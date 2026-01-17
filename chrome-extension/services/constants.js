/**
 * 🛡️ SuiTruth - 静态常量与白名单数据
 * 用于本地快速识别官方资产，无需 RPC 查询
 */

// ============================================
// 系统合约完整地址映射（用于双向查找）
// ============================================

/**
 * 🔗 系统合约：短地址 -> 完整地址
 */
const SYSTEM_SHORT_TO_FULL = Object.freeze({
  '0x1': '0x0000000000000000000000000000000000000000000000000000000000000001',
  '0x2': '0x0000000000000000000000000000000000000000000000000000000000000002',
  '0x3': '0x0000000000000000000000000000000000000000000000000000000000000003',
  '0xdee9': '0x000000000000000000000000000000000000000000000000000000000000dee9',
});

/**
 * 🔗 系统合约：完整地址 -> 短地址
 */
const SYSTEM_FULL_TO_SHORT = Object.freeze({
  '0x0000000000000000000000000000000000000000000000000000000000000001': '0x1',
  '0x0000000000000000000000000000000000000000000000000000000000000002': '0x2',
  '0x0000000000000000000000000000000000000000000000000000000000000003': '0x3',
  '0x000000000000000000000000000000000000000000000000000000000000dee9': '0xdee9',
});

// ============================================
// 官方系统合约白名单
// ============================================

/**
 * 🛡️ Sui 官方系统合约白名单
 * 来源: Sui Framework 官方文档
 */
export const OFFICIAL_PACKAGES = Object.freeze({
  // 系统合约（短地址）
  '0x1': {
    name: 'Move Stdlib',
    description: 'Move 语言标准库',
    isSystem: true,
  },
  '0x2': {
    name: 'Sui Framework',
    description: 'SUI 核心逻辑（Coin、Object、Transfer 等）',
    isSystem: true,
  },
  '0x3': {
    name: 'Sui System',
    description: 'Staking 与验证节点逻辑',
    isSystem: true,
  },
  '0xdee9': {
    name: 'DeepBook',
    description: '官方 CLOB（中央限价订单簿）',
    isSystem: true,
  },
  // 生态协议（完整地址）
  '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0': {
    name: 'SuiNS',
    description: 'Sui 域名服务（类似 ENS）',
    website: 'https://suins.io',
    isSystem: false,
  },
  '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a': {
    name: 'Wormhole Bridge',
    description: '官方跨链桥（连接以太坊等）',
    website: 'https://wormhole.com',
    isSystem: false,
  },
});

// ============================================
// 官方代币白名单
// ============================================

/**
 * 💰 官方代币类型字符串（防假币核心数据）
 * 来源: REFERENCE.md 实战数据
 */
export const OFFICIAL_COINS = Object.freeze({
  SUI: {
    type: '0x2::sui::SUI',
    symbol: 'SUI',
    decimals: 9,
    description: 'Sui 原生代币',
    isNative: true,
  },
  USDC: {
    type: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    symbol: 'USDC',
    decimals: 6,
    description: 'Circle 官方 USDC（原生铸造）',
    packageId: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
    isNative: true,
  },
  USDT: {
    type: '0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06::coin::COIN',
    symbol: 'USDT',
    decimals: 6,
    description: 'Tether USDT（Wormhole 跨链）',
    packageId: '0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06',
    bridge: 'Wormhole',
    isNative: false,
  },
});

// ============================================
// 地址格式正则表达式
// ============================================

/**
 * 📏 地址格式正则表达式
 * 用于 Content Script 识别页面上的 Sui 地址
 */
export const ADDRESS_PATTERNS = Object.freeze({
  // 标准完整地址（64 位十六进制）
  STANDARD: /^0x[a-f0-9]{64}$/i,

  // 系统合约短地址（0x1, 0x2, 0x3, 0xdee9）
  SYSTEM: /^0x([1-3]|dee9)$/i,

  // 缩略格式（0x123...abc）- SuiScan 常用显示方式
  ABBREVIATED: /^0x[a-f0-9]{3,8}\.{2,3}[a-f0-9]{3,8}$/i,

  // 任意长度的十六进制地址（宽松匹配，用于文本提取）
  LOOSE: /0x[a-f0-9]{4,64}/gi,

  // 用于从 href 提取完整地址
  HREF_ADDRESS: /\/(?:address|account|object|package)\/0x([a-f0-9]{64})/i,
});

// ============================================
// 枚举定义
// ============================================

/**
 * 🛡️ 地址类型枚举（与 SUI_SERVICE_API.md 保持一致）
 */
export const AddressType = Object.freeze({
  ACCOUNT: 'ACCOUNT', // 🛡️ 普通钱包地址
  PACKAGE: 'PACKAGE', // 📜 智能合约包
  OBJECT: 'OBJECT', // 💎 链上对象（Coin、NFT 等）
  UNKNOWN: 'UNKNOWN', // ❓ 无法识别
});

/**
 * 🚨 风险等级枚举（与 SUI_SERVICE_API.md 保持一致）
 */
export const RiskLevel = Object.freeze({
  SAFE: 'SAFE', // ✅ 绿色（官方白名单）
  NEUTRAL: 'NEUTRAL', // 🛡️ 灰色（未知但无明显风险）
  SUSPICIOUS: 'SUSPICIOUS', // ⚠️ 黄色（可疑但不确定）
  DANGER: 'DANGER', // 🚫 红色（确认恶意/假币）
});

/**
 * 🎨 风险等级对应的颜色（供 UI 使用）
 */
export const RISK_COLORS = Object.freeze({
  [RiskLevel.SAFE]: '#10b981', // 绿色
  [RiskLevel.NEUTRAL]: '#6b7280', // 灰色
  [RiskLevel.SUSPICIOUS]: '#f59e0b', // 黄色
  [RiskLevel.DANGER]: '#ef4444', // 红色
});

/**
 * 🎨 风险等级对应的图标（供 UI 使用）
 */
export const RISK_ICONS = Object.freeze({
  [RiskLevel.SAFE]: '✅',
  [RiskLevel.NEUTRAL]: '🛡️',
  [RiskLevel.SUSPICIOUS]: '⚠️',
  [RiskLevel.DANGER]: '🚫',
});

/**
 * 🎨 地址类型对应的图标
 */
export const TYPE_ICONS = Object.freeze({
  [AddressType.ACCOUNT]: '👤',
  [AddressType.PACKAGE]: '📜',
  [AddressType.OBJECT]: '💎',
  [AddressType.UNKNOWN]: '❓',
});

// ============================================
// 核心工具函数
// ============================================

/**
 * 🔧 标准化地址格式
 * @param {string} address - 原始地址
 * @returns {string|null} 标准化后的地址（小写、去空格），无效返回 null
 */
export const normalizeAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return null;
  }
  return address.toLowerCase().trim();
};

/**
 * 🔍 检查地址是否为官方系统合约（修复版本）
 * @param {string} address - Sui 地址（如 0x2 或完整 64 位地址）
 * @returns {boolean}
 * @example
 * isOfficialPackage('0x2')        // true
 * isOfficialPackage('0xdee9')     // true
 * isOfficialPackage('0x0000...0002') // true (完整地址)
 * isOfficialPackage('0x123abc...') // false
 * isOfficialPackage('0x2abc...')   // false (不会误判！)
 */
export const isOfficialPackage = (address) => {
  if (!address) return false;

  const normalized = normalizeAddress(address);
  if (!normalized) return false;

  // 1. 精确匹配（短地址或完整地址直接在表中）
  if (OFFICIAL_PACKAGES[normalized]) {
    return true;
  }

  // 2. 完整地址 -> 短地址映射（系统合约）
  const shortForm = SYSTEM_FULL_TO_SHORT[normalized];
  if (shortForm && OFFICIAL_PACKAGES[shortForm]) {
    return true;
  }

  return false;
};

/**
 * 🔍 检查资产类型是否为官方代币（防假币核心逻辑）
 * @param {string} typeString - 资产类型字符串（如 0x2::sui::SUI）
 * @returns {boolean}
 * @example
 * isOfficialCoin('0x2::sui::SUI')     // true
 * isOfficialCoin('0xabc::fake::USDC') // false
 */
export const isOfficialCoin = (typeString) => {
  if (!typeString) return false;

  const normalizedType = typeString.toLowerCase();

  return Object.values(OFFICIAL_COINS).some((coin) => normalizedType === coin.type.toLowerCase());
};

/**
 * 🎯 获取官方代币信息（用于显示标签）
 * @param {string} typeString - 资产类型字符串
 * @returns {Object|null} 代币信息对象或 null
 * @example
 * getOfficialCoinInfo('0x2::sui::SUI')
 * // 返回: { key: 'SUI', type: '0x2::sui::SUI', symbol: 'SUI', decimals: 9, ... }
 */
export const getOfficialCoinInfo = (typeString) => {
  if (!typeString) return null;

  const normalizedType = typeString.toLowerCase();

  for (const [key, coin] of Object.entries(OFFICIAL_COINS)) {
    if (normalizedType === coin.type.toLowerCase()) {
      return { key, ...coin };
    }
  }

  return null;
};

/**
 * 🎯 获取官方合约信息
 * @param {string} address - Sui 地址
 * @returns {Object|null} 合约信息对象或 null
 * @example
 * getOfficialPackageInfo('0x2')
 * // 返回: { address: '0x2', name: 'Sui Framework', description: '...', isSystem: true }
 */
export const getOfficialPackageInfo = (address) => {
  if (!address) return null;

  const normalized = normalizeAddress(address);
  if (!normalized) return null;

  // 1. 精确匹配
  if (OFFICIAL_PACKAGES[normalized]) {
    return { address: normalized, ...OFFICIAL_PACKAGES[normalized] };
  }

  // 2. 完整地址 -> 短地址映射
  const shortForm = SYSTEM_FULL_TO_SHORT[normalized];
  if (shortForm && OFFICIAL_PACKAGES[shortForm]) {
    return { address: shortForm, ...OFFICIAL_PACKAGES[shortForm] };
  }

  return null;
};

/**
 * 🔍 验证是否为有效的 Sui 地址格式
 * @param {string} address - 待验证的地址
 * @returns {boolean}
 * @example
 * isValidAddressFormat('0x1')          // true (系统合约)
 * isValidAddressFormat('0x123...abc')  // true (缩略格式)
 * isValidAddressFormat('0xabc')        // false (长度不符合规范)
 */
export const isValidAddressFormat = (address) => {
  if (!address || typeof address !== 'string') return false;

  return (
    ADDRESS_PATTERNS.STANDARD.test(address) ||
    ADDRESS_PATTERNS.SYSTEM.test(address) ||
    ADDRESS_PATTERNS.ABBREVIATED.test(address)
  );
};

/**
 * 🎯 从文本中提取所有可能的 Sui 地址
 * @param {string} text - 待解析的文本（如 DOM 节点的 textContent）
 * @returns {string[]} 提取出的地址数组（去重）
 * @example
 * extractAddresses('Account: 0x123...abc, Package: 0x2')
 * // 返回: ['0x2'] (0x123...abc 不符合 LOOSE 模式最小长度)
 */
export const extractAddresses = (text) => {
  if (!text || typeof text !== 'string') return [];

  const matches = text.match(ADDRESS_PATTERNS.LOOSE) || [];

  // 去重并过滤无效格式
  return [...new Set(matches)].filter((addr) => {
    // 至少 4 位十六进制（0x + 4 位 = 最短有效地址如 0xdee9）
    return addr.length >= 6;
  });
};

/**
 * 🔗 从 href 中提取完整地址
 * @param {string} href - 链接地址（如 /address/0x123...）
 * @returns {string|null} 提取的完整地址或 null
 */
export const extractAddressFromHref = (href) => {
  if (!href || typeof href !== 'string') return null;

  const match = href.match(ADDRESS_PATTERNS.HREF_ADDRESS);
  if (match && match[1]) {
    return `0x${match[1].toLowerCase()}`;
  }

  return null;
};

/**
 * 🔄 将短地址转换为完整地址
 * @param {string} address - 短地址（如 0x2）
 * @returns {string|null} 完整地址或 null（非系统合约）
 */
export const shortToFullAddress = (address) => {
  if (!address) return null;
  const normalized = normalizeAddress(address);
  return SYSTEM_SHORT_TO_FULL[normalized] || null;
};

/**
 * 🔄 将完整地址转换为短地址（仅系统合约）
 * @param {string} address - 完整地址
 * @returns {string|null} 短地址或 null（非系统合约）
 */
export const fullToShortAddress = (address) => {
  if (!address) return null;
  const normalized = normalizeAddress(address);
  return SYSTEM_FULL_TO_SHORT[normalized] || null;
};

/**
 * 📋 获取用于显示的地址格式
 * @param {string} address - 完整地址
 * @param {number} prefixLen - 前缀长度（默认 6）
 * @param {number} suffixLen - 后缀长度（默认 4）
 * @returns {string} 格式化后的地址（如 0x1234...abcd）
 */
export const formatAddressDisplay = (address, prefixLen = 6, suffixLen = 4) => {
  if (!address) return '';

  const normalized = normalizeAddress(address);
  if (!normalized) return address;

  // 系统合约短地址直接返回
  if (ADDRESS_PATTERNS.SYSTEM.test(normalized)) {
    return normalized;
  }

  // 短于需要截取的长度，直接返回
  if (normalized.length <= prefixLen + suffixLen + 3) {
    return normalized;
  }

  return `${normalized.slice(0, prefixLen)}...${normalized.slice(-suffixLen)}`;
};

// ============================================
// 导出快速查找集合（用于 O(1) 匹配）
// ============================================

/**
 * 🚀 所有白名单地址的 Set（用于快速查找）
 */
export const WHITELIST_ADDRESS_SET = new Set([
  // 系统合约（短地址 + 完整地址）
  '0x1',
  '0x2',
  '0x3',
  '0xdee9',
  '0x0000000000000000000000000000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000000000000000000000000000002',
  '0x0000000000000000000000000000000000000000000000000000000000000003',
  '0x000000000000000000000000000000000000000000000000000000000000dee9',
  // 生态协议
  '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0',
  '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a',
  // 代币合约
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
  '0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06',
]);

/**
 * 🚀 官方代币 Type 的 Set（用于快速查找）
 */
export const OFFICIAL_COIN_TYPES_SET = new Set(
  Object.values(OFFICIAL_COINS).map((coin) => coin.type.toLowerCase())
);
