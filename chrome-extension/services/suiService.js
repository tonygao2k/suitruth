import {
  isOfficialPackage,
  isOfficialCoin,
  getOfficialPackageInfo,
  getOfficialCoinInfo,
  AddressType,
  RiskLevel,
} from './constants';

/**
 * 🌐 Sui Mainnet RPC 端点
 */
const RPC_ENDPOINT = 'https://fullnode.mainnet.sui.io:443';

/**
 * ⏱️ RPC 请求超时时间（毫秒）
 */
const TIMEOUT_MS = 3000;

/**
 * 🔥 熔断器配置
 */
let isCircuitBroken = false;
let circuitBreakerUntil = 0;
const CIRCUIT_BREAKER_DURATION = 60000; // 60秒

/**
 * 💾 内存缓存（地址画像）
 * 使用 Map 而不是 Object 以获得更好的性能
 */
const profileCache = new Map();

/**
 * 🔢 请求计数器（用于生成唯一 ID）
 */
let requestIdCounter = 0;

/**
 * 📊 AddressProfile 数据结构
 * @typedef {Object} AddressProfile
 * @property {string} address - 完整地址
 * @property {AddressType} type - 地址类型枚举
 * @property {RiskLevel} riskLevel - 风险等级
 * @property {string} [label] - 可选标签（如 "Official USDC"）
 * @property {boolean} [isContract] - 是否为合约
 * @property {Object} [metadata] - 额外元数据
 */

/**
 * 🔍 检查熔断器状态
 * @returns {boolean} 是否处于熔断状态
 */
const checkCircuitBreaker = () => {
  if (isCircuitBroken && Date.now() < circuitBreakerUntil) {
    console.warn('🔥 熔断器激活中，跳过 RPC 请求');
    return true;
  }
  isCircuitBroken = false;
  return false;
};

/**
 * ⚡ 激活熔断器
 */
const activateCircuitBreaker = () => {
  isCircuitBroken = true;
  circuitBreakerUntil = Date.now() + CIRCUIT_BREAKER_DURATION;
  console.error(`⚠️ 触发限流，启动熔断器（${CIRCUIT_BREAKER_DURATION / 1000}秒）`);
};

/**
 * 🌐 调用 Sui RPC（带超时和熔断保护）
 * @param {string} method - RPC 方法名（如 'sui_getObject'）
 * @param {Array} params - 参数数组
 * @returns {Promise<Object>} RPC 响应
 */
const callRpc = async (method, params) => {
  // 1. 检查熔断器
  if (checkCircuitBreaker()) {
    return { error: { code: 'circuit_broken', message: '熔断器激活中' } };
  }

  // 2. 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // 3. 构造 JSON-RPC 请求
    const payload = {
      jsonrpc: '2.0',
      id: ++requestIdCounter,
      method,
      params,
    };

    // 4. 发起请求
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 5. 检查 HTTP 状态码
    if (response.status === 429) {
      console.error('⚠️ RPC 限流（429），激活熔断器');
      activateCircuitBreaker();
      return { error: { code: 'rate_limit', message: 'RPC 限流' } };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 6. 解析 JSON 响应
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // 7. 处理超时错误
    if (error.name === 'AbortError') {
      console.warn('⏱️ RPC 请求超时，返回默认状态');
      return { error: { code: 'timeout', message: 'RPC 请求超时' } };
    }

    // 8. 处理其他错误
    console.error('❌ RPC 调用失败:', error.message);
    return { error: { code: 'network_error', message: error.message } };
  }
};

/**
 * 🎯 推断地址类型（基于 RPC 响应）
 * @param {Object} response - sui_getObject 的响应
 * @returns {Object} { type: AddressType, confidence: string }
 */
const inferTypeFromResponse = (response) => {
  // 1. 错误码分析
  if (response.error) {
    const errorCode = response.error.code;

    if (errorCode === -32602 || errorCode === 'notExists') {
      // 对象不存在 → 可能是纯钱包地址
      return { type: AddressType.ACCOUNT, confidence: 'medium' };
    }

    return { type: AddressType.UNKNOWN, confidence: 'low' };
  }

  const data = response.result?.data;
  if (!data) {
    return { type: AddressType.UNKNOWN, confidence: 'low' };
  }

  // 2. 检查 content.dataType（最可靠）
  if (data.content?.dataType === 'package') {
    return { type: AddressType.PACKAGE, confidence: 'high' };
  }

  // 3. 检查 type 字段是否包含 ::coin::
  if (data.type && data.type.includes('::coin::')) {
    return { type: AddressType.OBJECT, subType: 'COIN', confidence: 'high' };
  }

  // 4. 检查 type 字段是否包含 ::nft::
  if (data.type && data.type.includes('::nft::')) {
    return { type: AddressType.OBJECT, subType: 'NFT', confidence: 'high' };
  }

  // 5. 默认为普通对象
  return { type: AddressType.OBJECT, confidence: 'medium' };
};

/**
 * 🛡️ 检测假币（核心安全功能）
 * @param {Object} objectData - RPC 返回的对象数据
 * @returns {Object} { isFake: boolean, reason: string }
 */
const detectFakeCoin = (objectData) => {
  if (!objectData || !objectData.type) {
    return { isFake: false };
  }

  // 1. 获取对象的 display 元数据
  const display = objectData.display?.data;
  const typeString = objectData.type;

  // 2. 可疑的代币符号列表
  const suspiciousSymbols = ['USDC', 'USDT', 'SUI', 'WETH', 'WBTC'];

  // 3. 如果 Symbol 是常见代币名
  if (display?.symbol && suspiciousSymbols.includes(display.symbol.toUpperCase())) {
    // 4. 但 type 字符串不在官方白名单中 → 假币！
    if (!isOfficialCoin(typeString)) {
      return {
        isFake: true,
        reason: `Symbol "${display.symbol}" 但 Package ID 不是官方的`,
        suspectedType: display.symbol,
      };
    }
  }

  return { isFake: false };
};

/**
 * 🔍 获取地址画像（主功能）
 * @param {string} address - Sui 地址（0x...）
 * @returns {Promise<AddressProfile>}
 * @example
 * const profile = await getAddressProfile('0x2');
 * // 返回: { address: '0x2', type: 'PACKAGE', riskLevel: 'SAFE', label: 'Sui Framework' }
 */
export const getAddressProfile = async (address) => {
  if (!address) {
    return {
      address: '',
      type: AddressType.UNKNOWN,
      riskLevel: RiskLevel.NEUTRAL,
    };
  }

  // 1. 标准化地址（转小写）
  const normalized = address.toLowerCase().trim();

  // 2. 检查本地白名单（优先级最高）
  if (isOfficialPackage(normalized)) {
    const packageInfo = getOfficialPackageInfo(normalized);
    return {
      address: normalized,
      type: AddressType.PACKAGE,
      riskLevel: RiskLevel.SAFE,
      label: packageInfo?.name || 'Official Package',
      isContract: true,
      metadata: packageInfo,
    };
  }

  // 3. 检查缓存
  if (profileCache.has(normalized)) {
    return profileCache.get(normalized);
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

    // 5. 处理 RPC 错误（超时/熔断）
    if (response.error) {
      const profile = {
        address: normalized,
        type: AddressType.UNKNOWN,
        riskLevel: RiskLevel.NEUTRAL,
        error: response.error.message,
      };
      // 不缓存错误结果
      return profile;
    }

    // 6. 推断地址类型
    const typeInference = inferTypeFromResponse(response);
    let profile = {
      address: normalized,
      type: typeInference.type,
      riskLevel: RiskLevel.NEUTRAL,
      confidence: typeInference.confidence,
    };

    // 7. 如果是 Package，标记为合约
    if (typeInference.type === AddressType.PACKAGE) {
      profile.isContract = true;
    }

    // 8. 如果是 Coin，检查是否为假币
    if (typeInference.subType === 'COIN') {
      const fakeCheck = detectFakeCoin(response.result?.data);

      if (fakeCheck.isFake) {
        profile.riskLevel = RiskLevel.DANGER;
        profile.label = `⚠️ 假币警告: ${fakeCheck.reason}`;
        profile.isFake = true;
      } else {
        // 检查是否为官方代币
        const coinInfo = getOfficialCoinInfo(response.result?.data?.type);
        if (coinInfo) {
          profile.riskLevel = RiskLevel.SAFE;
          profile.label = `Official ${coinInfo.symbol}`;
        }
      }
    }

    // 9. 保存到缓存（5 分钟后过期）
    profileCache.set(normalized, profile);
    setTimeout(() => {
      profileCache.delete(normalized);
    }, 300000);

    return profile;
  } catch (error) {
    console.error('❌ getAddressProfile 失败:', error);

    // 降级处理：返回默认状态
    return {
      address: normalized,
      type: AddressType.UNKNOWN,
      riskLevel: RiskLevel.NEUTRAL,
      error: error.message,
    };
  }
};

/**
 * 🔍 批量获取地址画像（性能优化）
 * @param {string[]} addresses - 地址数组
 * @returns {Promise<Map<string, AddressProfile>>}
 */
export const batchGetProfiles = async (addresses) => {
  if (!addresses || addresses.length === 0) {
    return new Map();
  }

  const profiles = new Map();

  // 1. 先从缓存和白名单中获取
  const uncachedAddresses = [];

  for (const address of addresses) {
    const normalized = address.toLowerCase().trim();

    // 检查白名单
    if (isOfficialPackage(normalized)) {
      const packageInfo = getOfficialPackageInfo(normalized);
      profiles.set(normalized, {
        address: normalized,
        type: AddressType.PACKAGE,
        riskLevel: RiskLevel.SAFE,
        label: packageInfo?.name || 'Official Package',
        isContract: true,
      });
      continue;
    }

    // 检查缓存
    if (profileCache.has(normalized)) {
      profiles.set(normalized, profileCache.get(normalized));
      continue;
    }

    uncachedAddresses.push(normalized);
  }

  // 2. 批量查询未缓存的地址
  if (uncachedAddresses.length > 0) {
    // 🔥 修复：使用串行查询而不是 sui_multiGetObjects
    // 原因：sui_multiGetObjects 需要所有地址都是有效的对象 ID
    for (const address of uncachedAddresses) {
      try {
        const profile = await getAddressProfile(address);
        profiles.set(address, profile);
      } catch (error) {
        console.error(`❌ 批量查询地址 ${address} 失败:`, error);
        // 失败时返回默认状态
        profiles.set(address, {
          address,
          type: AddressType.UNKNOWN,
          riskLevel: RiskLevel.NEUTRAL,
          error: error.message,
        });
      }
    }
  }

  return profiles;
};

/**
 * 🧹 清空缓存（用于测试或手动刷新）
 */
export const clearCache = () => {
  profileCache.clear();
  console.log('🧹 地址画像缓存已清空');
};

/**
 * 📊 获取缓存统计信息
 */
export const getCacheStats = () => {
  return {
    size: profileCache.size,
    circuitBroken: isCircuitBroken,
    circuitBreakerUntil: isCircuitBroken ? new Date(circuitBreakerUntil).toISOString() : null,
  };
};

// 导出为单例（可选，如果需要在其他地方访问）
export const SuiService = {
  getAddressProfile,
  batchGetProfiles,
  clearCache,
  getCacheStats,
};
