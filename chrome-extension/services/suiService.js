/**
 * 🌐 SuiTruth - Sui 区块链服务层
 * 单例模式，负责所有链上数据交互
 */

import {
  OFFICIAL_COINS,
  AddressType,
  RiskLevel,
  isOfficialPackage,
  isOfficialCoin,
  getOfficialPackageInfo,
  getOfficialCoinInfo,
} from './constants.js';

// ============================================
// 配置常量
// ============================================

/**
 * 🌐 Sui Mainnet RPC 端点
 */
const RPC_ENDPOINT = 'https://fullnode.mainnet.sui.io:443';

/**
 * ⏱️ RPC 请求超时时间（毫秒）
 */
const TIMEOUT_MS = 3000;

/**
 * 💾 缓存过期时间（毫秒）
 */
const CACHE_TTL = 300000; // 5 分钟

/**
 * 🔥 熔断器持续时间（毫秒）
 */
const CIRCUIT_BREAKER_DURATION = 60000; // 60 秒

/**
 * 📦 批量请求并发限制
 */
const BATCH_CONCURRENCY = 5;

// ============================================
// 状态管理
// ============================================

/**
 * 🔥 熔断器状态
 */
let isCircuitBroken = false;
let circuitBreakerUntil = 0;

/**
 * 💾 内存缓存（带时间戳，避免 setTimeout 内存泄漏）
 * Map<string, { profile: AddressProfile, timestamp: number }>
 */
const profileCache = new Map();

/**
 * 🔢 请求计数器（用于生成唯一 JSON-RPC ID）
 */
let requestIdCounter = 0;

// ============================================
// 缓存管理
// ============================================

/**
 * 🔍 获取缓存的地址画像
 * @param {string} address - 标准化后的地址
 * @returns {AddressProfile|null}
 */
const getCachedProfile = (address) => {
  const cached = profileCache.get(address);
  if (!cached) return null;

  // 检查是否过期
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    profileCache.delete(address);
    return null;
  }

  return cached.profile;
};

/**
 * 💾 设置缓存的地址画像
 * @param {string} address - 标准化后的地址
 * @param {AddressProfile} profile - 地址画像
 */
const setCachedProfile = (address, profile) => {
  profileCache.set(address, {
    profile,
    timestamp: Date.now(),
  });
};

// ============================================
// 熔断器管理
// ============================================

/**
 * 🔍 检查熔断器状态
 * @returns {boolean} 是否处于熔断状态
 */
const checkCircuitBreaker = () => {
  if (!isCircuitBroken) return false;

  if (Date.now() >= circuitBreakerUntil) {
    // 熔断时间已过，重置状态
    isCircuitBroken = false;
    circuitBreakerUntil = 0;
    console.log('🔄 [SuiTruth] 熔断器已重置');
    return false;
  }

  return true;
};

/**
 * ⚡ 激活熔断器
 */
const activateCircuitBreaker = () => {
  isCircuitBroken = true;
  circuitBreakerUntil = Date.now() + CIRCUIT_BREAKER_DURATION;
  console.warn(`⚠️ [SuiTruth] 触发限流，启动熔断器（${CIRCUIT_BREAKER_DURATION / 1000}秒）`);
};

// ============================================
// RPC 调用
// ============================================

/**
 * 🌐 调用 Sui JSON-RPC（带超时和熔断保护）
 * @param {string} method - RPC 方法名（如 'sui_getObject'）
 * @param {Array} params - 参数数组
 * @returns {Promise<Object>} RPC 响应
 */
const callRpc = async (method, params) => {
  // 1. 检查熔断器
  if (checkCircuitBreaker()) {
    return {
      error: {
        code: -1,
        message: 'Circuit breaker is open',
      },
    };
  }

  // 2. 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++requestIdCounter,
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3. 处理 HTTP 错误
    if (!response.ok) {
      // 429 = Rate Limited
      if (response.status === 429) {
        activateCircuitBreaker();
        return {
          error: {
            code: 429,
            message: 'Rate limited by RPC',
          },
        };
      }

      return {
        error: {
          code: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    // 4. 解析 JSON 响应
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // 超时错误
    if (error.name === 'AbortError') {
      console.warn('⏱️ [SuiTruth] RPC 请求超时');
      return {
        error: {
          code: -2,
          message: 'Request timeout',
        },
      };
    }

    // 网络错误
    console.error('❌ [SuiTruth] RPC 网络错误:', error.message);
    return {
      error: {
        code: -3,
        message: error.message || 'Network error',
      },
    };
  }
};

// ============================================
// 类型推断
// ============================================

/**
 * 🎯 推断地址类型（基于 RPC 响应）
 * @param {Object} response - sui_getObject 的响应
 * @returns {Object} { type: AddressType, subType?: string, confidence: string }
 */
const inferTypeFromResponse = (response) => {
  // 情况1: RPC 返回错误（对象不存在）
  if (response.error) {
    const errorCode = response.error.code;
    const errorMsg = response.error.message || '';

    // "notExists" 或类似错误 -> 可能是纯钱包地址（没有链上对象）
    if (
      errorCode === -32000 ||
      errorMsg.includes('not exist') ||
      errorMsg.includes('not found') ||
      errorMsg.includes('deleted')
    ) {
      return {
        type: AddressType.ACCOUNT,
        confidence: 'medium',
        reason: 'Object not found, likely an account address',
      };
    }

    return {
      type: AddressType.UNKNOWN,
      confidence: 'low',
      reason: `RPC error: ${errorMsg}`,
    };
  }

  // 情况2: 成功获取对象数据
  const data = response.result?.data;

  if (!data) {
    return {
      type: AddressType.UNKNOWN,
      confidence: 'low',
      reason: 'No data in response',
    };
  }

  const objectType = data.type || '';

  // 2a. Package（智能合约）
  if (objectType === 'package' || data.dataType === 'package') {
    return {
      type: AddressType.PACKAGE,
      confidence: 'high',
      reason: 'Object type is package',
    };
  }

  // 2b. Coin 对象（代币）
  if (objectType.includes('::coin::Coin<') || objectType.includes('0x2::coin::')) {
    return {
      type: AddressType.OBJECT,
      subType: 'COIN',
      confidence: 'high',
      reason: 'Object is a Coin',
      coinType: objectType,
    };
  }

  // 2c. 其他对象（NFT、自定义对象等）
  return {
    type: AddressType.OBJECT,
    subType: 'OTHER',
    confidence: 'high',
    reason: 'Generic on-chain object',
    objectType,
  };
};

// ============================================
// 假币检测
// ============================================

/**
 * 🛡️ 检测假币（核心安全功能）
 * @param {Object} objectData - RPC 返回的对象数据
 * @returns {Object} { isFake: boolean, reason?: string }
 */
const detectFakeCoin = (objectData) => {
  if (!objectData || !objectData.type) {
    return { isFake: false };
  }

  const objectType = objectData.type;

  // 1. 检查是否声称是某个官方代币
  for (const [symbol, coinInfo] of Object.entries(OFFICIAL_COINS)) {
    // 如果类型字符串中包含官方代币的 symbol（如 "USDC"、"SUI"）
    // 但不是官方的完整 type，则判定为假币
    const symbolPattern = new RegExp(`::${symbol}(?:>|$|::)`, 'i');

    if (symbolPattern.test(objectType)) {
      // 检查是否是真正的官方代币
      if (!objectType.includes(coinInfo.type)) {
        return {
          isFake: true,
          reason: `伪装成 ${symbol}，真实地址与官方不符`,
          claimedSymbol: symbol,
          actualType: objectType,
          officialType: coinInfo.type,
        };
      }
    }
  }

  // 2. 检查常见的钓鱼模式
  const phishingPatterns = [
    { pattern: /fake/i, reason: '类型名包含 "fake"' },
    { pattern: /scam/i, reason: '类型名包含 "scam"' },
    { pattern: /test.*coin/i, reason: '疑似测试代币' },
    { pattern: /airdrop.*claim/i, reason: '疑似钓鱼空投' },
  ];

  for (const { pattern, reason } of phishingPatterns) {
    if (pattern.test(objectType)) {
      return {
        isFake: true,
        reason,
        actualType: objectType,
      };
    }
  }

  return { isFake: false };
};

// ============================================
// 地址标准化
// ============================================

/**
 * 🔧 标准化 Sui 地址
 * @param {string} address - 原始地址
 * @returns {string|null} 标准化后的地址（小写、去空格）
 */
const normalizeAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  return address.toLowerCase().trim();
};

// ============================================
// 主功能：获取地址画像
// ============================================

/**
 * 🔍 获取地址画像（主功能）
 * @param {string} address - Sui 地址（0x...）
 * @returns {Promise<AddressProfile>}
 * @example
 * const profile = await getAddressProfile('0x2');
 * // 返回: { address: '0x2', type: 'PACKAGE', riskLevel: 'SAFE', label: 'Sui Framework' }
 */
export const getAddressProfile = async (address) => {
  // 0. 参数校验
  if (!address) {
    return {
      address: '',
      type: AddressType.UNKNOWN,
      riskLevel: RiskLevel.NEUTRAL,
      error: 'Empty address',
    };
  }

  // 1. 标准化地址
  const normalized = normalizeAddress(address);

  if (!normalized) {
    return {
      address: address,
      type: AddressType.UNKNOWN,
      riskLevel: RiskLevel.NEUTRAL,
      error: 'Invalid address format',
    };
  }

  // 2. 检查本地白名单（优先级最高，无需网络请求）
  if (isOfficialPackage(normalized)) {
    const packageInfo = getOfficialPackageInfo(normalized);
    return {
      address: normalized,
      type: AddressType.PACKAGE,
      riskLevel: RiskLevel.SAFE,
      label: packageInfo?.name || 'Official Package',
      isContract: true,
      isWhitelisted: true,
      metadata: packageInfo,
    };
  }

  // 3. 检查缓存
  const cached = getCachedProfile(normalized);
  if (cached) {
    return cached;
  }

  // 4. 发起 RPC 请求
  try {
    const response = await callRpc('sui_getObject', [
      normalized,
      {
        showType: true,
        showOwner: true,
        showContent: true,
        showDisplay: true,
      },
    ]);

    // 5. 处理 RPC 错误（熔断/超时等）
    if (response.error && response.error.code < 0) {
      // 内部错误（熔断、超时、网络错误），不缓存
      return {
        address: normalized,
        type: AddressType.UNKNOWN,
        riskLevel: RiskLevel.NEUTRAL,
        error: response.error.message,
      };
    }

    // 6. 推断地址类型
    const typeInference = inferTypeFromResponse(response);

    let profile = {
      address: normalized,
      type: typeInference.type,
      riskLevel: RiskLevel.NEUTRAL,
      confidence: typeInference.confidence,
      reason: typeInference.reason,
    };

    // 7. 如果是 Package，标记为合约
    if (typeInference.type === AddressType.PACKAGE) {
      profile.isContract = true;
    }

    // 8. 如果是 Coin 对象，进行假币检测
    if (typeInference.subType === 'COIN') {
      const objectData = response.result?.data;
      const fakeCheck = detectFakeCoin(objectData);

      if (fakeCheck.isFake) {
        profile.riskLevel = RiskLevel.DANGER;
        profile.label = `⚠️ 假币警告: ${fakeCheck.reason}`;
        profile.isFake = true;
        profile.fakeDetails = fakeCheck;
      } else {
        // 检查是否为官方代币
        const coinType = objectData?.type;
        if (coinType && isOfficialCoin(coinType)) {
          const coinInfo = getOfficialCoinInfo(coinType);
          profile.riskLevel = RiskLevel.SAFE;
          profile.label = `Official ${coinInfo?.symbol || 'Token'}`;
          profile.coinInfo = coinInfo;
        }
      }
    }

    // 9. 保存到缓存
    setCachedProfile(normalized, profile);

    return profile;
  } catch (error) {
    console.error('❌ [SuiTruth] getAddressProfile 异常:', error);

    // 降级处理：返回默认状态，不阻塞用户体验
    return {
      address: normalized,
      type: AddressType.UNKNOWN,
      riskLevel: RiskLevel.NEUTRAL,
      error: error.message,
    };
  }
};

// ============================================
// 批量获取地址画像
// ============================================

/**
 * 🔍 批量获取地址画像（性能优化）
 * @param {string[]} addresses - 地址数组
 * @returns {Promise<Map<string, AddressProfile>>}
 */
export const batchGetProfiles = async (addresses) => {
  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return new Map();
  }

  const profiles = new Map();
  const uncachedAddresses = [];

  // 1. 先处理白名单和缓存
  for (const addr of addresses) {
    const normalized = normalizeAddress(addr);
    if (!normalized) continue;

    // 检查白名单
    if (isOfficialPackage(normalized)) {
      const packageInfo = getOfficialPackageInfo(normalized);
      profiles.set(normalized, {
        address: normalized,
        type: AddressType.PACKAGE,
        riskLevel: RiskLevel.SAFE,
        label: packageInfo?.name || 'Official Package',
        isContract: true,
        isWhitelisted: true,
        metadata: packageInfo,
      });
      continue;
    }

    // 检查缓存
    const cached = getCachedProfile(normalized);
    if (cached) {
      profiles.set(normalized, cached);
      continue;
    }

    uncachedAddresses.push(normalized);
  }

  // 2. 批量并发请求未缓存的地址（带限流）
  if (uncachedAddresses.length > 0 && !checkCircuitBreaker()) {
    // 分批处理，每批最多 BATCH_CONCURRENCY 个并发
    for (let i = 0; i < uncachedAddresses.length; i += BATCH_CONCURRENCY) {
      const batch = uncachedAddresses.slice(i, i + BATCH_CONCURRENCY);

      const results = await Promise.allSettled(batch.map((addr) => getAddressProfile(addr)));

      results.forEach((result, index) => {
        const addr = batch[index];
        if (result.status === 'fulfilled') {
          profiles.set(addr, result.value);
        } else {
          profiles.set(addr, {
            address: addr,
            type: AddressType.UNKNOWN,
            riskLevel: RiskLevel.NEUTRAL,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }
  } else if (uncachedAddresses.length > 0) {
    // 熔断状态下，返回默认值
    for (const addr of uncachedAddresses) {
      profiles.set(addr, {
        address: addr,
        type: AddressType.UNKNOWN,
        riskLevel: RiskLevel.NEUTRAL,
        error: 'Circuit breaker is open',
      });
    }
  }

  return profiles;
};

// ============================================
// SuiNS 域名解析
// ============================================

/**
 * 🔍 解析 SuiNS 域名
 * @param {string} domain - 域名（如 "alice.sui"）
 * @returns {Promise<string|null>} 解析后的地址，失败返回 null
 */
export const resolveSuiNS = async (domain) => {
  if (!domain || typeof domain !== 'string') {
    return null;
  }

  // 检查是否是 .sui 域名
  if (!domain.endsWith('.sui')) {
    return null;
  }

  try {
    const response = await callRpc('suix_resolveNameServiceAddress', [domain]);

    if (response.error || !response.result) {
      return null;
    }

    return response.result;
  } catch (error) {
    console.warn(`🔍 [SuiTruth] SuiNS 解析失败: ${domain}`, error);
    return null;
  }
};

// ============================================
// 缓存管理
// ============================================

/**
 * 🧹 清空缓存
 */
export const clearCache = () => {
  profileCache.clear();
  console.log('🧹 [SuiTruth] 缓存已清空');
};

/**
 * 📊 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export const getCacheStats = () => {
  let validCount = 0;
  let expiredCount = 0;
  const now = Date.now();

  for (const [, value] of profileCache) {
    if (now - value.timestamp > CACHE_TTL) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    total: profileCache.size,
    valid: validCount,
    expired: expiredCount,
    isCircuitBroken,
    circuitBreakerRemaining: isCircuitBroken ? Math.max(0, circuitBreakerUntil - now) : 0,
  };
};

/**
 * 🧹 清理过期缓存（可定期调用）
 * @returns {number} 清理的条目数量
 */
export const pruneExpiredCache = () => {
  const now = Date.now();
  let pruned = 0;

  for (const [key, value] of profileCache) {
    if (now - value.timestamp > CACHE_TTL) {
      profileCache.delete(key);
      pruned++;
    }
  }

  if (pruned > 0) {
    console.log(`🧹 [SuiTruth] 清理了 ${pruned} 条过期缓存`);
  }

  return pruned;
};

// ============================================
// 导出单例服务对象
// ============================================

export const SuiService = {
  // 核心功能
  getAddressProfile,
  batchGetProfiles,
  resolveSuiNS,

  // 缓存管理
  clearCache,
  getCacheStats,
  pruneExpiredCache,

  // 类型常量（方便外部使用）
  AddressType,
  RiskLevel,
};

// 默认导出
export default SuiService;
