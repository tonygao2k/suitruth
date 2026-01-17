/**
 * 🛡️ Sui 官方系统合约白名单
 * 来源: Sui Framework 官方文档
 */
export const OFFICIAL_PACKAGES = {
  '0x1': {
    name: 'Move Stdlib',
    description: 'Move 语言标准库',
  },
  '0x2': {
    name: 'Sui Framework',
    description: 'SUI 核心逻辑（Coin、Object、Transfer 等）',
  },
  '0x3': {
    name: 'Sui System',
    description: 'Staking 与验证节点逻辑',
  },
  '0xdee9': {
    name: 'DeepBook',
    description: '官方 CLOB（中央限价订单簿）',
  },
  '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0': {
    name: 'SuiNS',
    description: 'Sui 域名服务（类似 ENS）',
  },
  '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a': {
    name: 'Wormhole Bridge',
    description: '官方跨链桥（连接以太坊等）',
  },
};

/**
 * 💰 官方代币类型字符串（防假币核心数据）
 * 来源: REFERENCE.md 实战数据
 */
export const OFFICIAL_COINS = {
  SUI: {
    type: '0x2::sui::SUI',
    symbol: 'SUI',
    decimals: 9,
    description: 'Sui 原生代币',
  },
  USDC: {
    type: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    symbol: 'USDC',
    decimals: 6,
    description: 'Circle 官方 USDC（原生铸造）',
  },
  USDT: {
    type: '0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06::coin::COIN',
    symbol: 'USDT',
    decimals: 6,
    description: 'Tether USDT（Wormhole 跨链）',
  },
};

/**
 * 🔍 检查地址是否为官方系统合约
 * @param {string} address - Sui 地址（如 0x2 或完整 64 位地址）
 * @returns {boolean}
 * @example
 * isOfficialPackage('0x2') // true
 * isOfficialPackage('0xdee9') // true
 * isOfficialPackage('0xabc123...') // false
 */
export const isOfficialPackage = (address) => {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return Object.keys(OFFICIAL_PACKAGES).some((key) => normalized.startsWith(key.toLowerCase()));
};

/**
 * 🔍 检查资产类型是否为官方代币（防假币核心逻辑）
 * @param {string} typeString - 资产类型字符串（如 0x2::sui::SUI）
 * @returns {boolean}
 * @example
 * isOfficialCoin('0x2::sui::SUI') // true
 * isOfficialCoin('0xabc::fake::USDC') // false
 */
export const isOfficialCoin = (typeString) => {
  if (!typeString) return false;
  return Object.values(OFFICIAL_COINS).some((coin) => typeString.includes(coin.type));
};

/**
 * 🎯 获取官方代币信息（用于显示标签）
 * @param {string} typeString - 资产类型字符串
 * @returns {Object|null} 代币信息对象或 null
 * @example
 * getOfficialCoinInfo('0x2::sui::SUI')
 * // 返回: { key: 'SUI', type: '0x2::sui::SUI', symbol: 'SUI', decimals: 9, description: '...' }
 */
export const getOfficialCoinInfo = (typeString) => {
  if (!typeString) return null;

  for (const [key, coin] of Object.entries(OFFICIAL_COINS)) {
    if (typeString.includes(coin.type)) {
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
 * // 返回: { address: '0x2', name: 'Sui Framework', description: '...' }
 */
export const getOfficialPackageInfo = (address) => {
  if (!address) return null;
  const normalized = address.toLowerCase();

  for (const [key, info] of Object.entries(OFFICIAL_PACKAGES)) {
    if (normalized.startsWith(key.toLowerCase())) {
      return { address: key, ...info };
    }
  }
  return null;
};

/**
 * 📏 地址格式正则表达式
 * 用于 Content Script 识别页面上的 Sui 地址
 */
export const ADDRESS_PATTERNS = {
  // 标准完整地址（64 位十六进制）
  STANDARD: /^0x[a-f0-9]{64}$/i,

  // 系统合约短地址（0x1, 0x2, 0x3）
  SYSTEM: /^0x[1-3]$/,

  // 缩略格式（0x123...abc）- SuiScan 常用显示方式
  ABBREVIATED: /^0x[a-f0-9]{3,8}\.{3}[a-f0-9]{3,8}$/i,

  // 任意长度的十六进制地址（宽松匹配，用于文本提取）
  LOOSE: /0x[a-f0-9]+/gi,
};

/**
 * 🔍 验证是否为有效的 Sui 地址格式
 * @param {string} address - 待验证的地址
 * @returns {boolean}
 * @example
 * isValidAddressFormat('0x1') // true (系统合约)
 * isValidAddressFormat('0x123...abc') // true (缩略格式)
 * isValidAddressFormat('0xabc') // false (长度不符合规范)
 */
export const isValidAddressFormat = (address) => {
  if (!address) return false;
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
 * // 返回: ['0x123...abc', '0x2']
 */
export const extractAddresses = (text) => {
  if (!text) return [];
  const matches = text.match(ADDRESS_PATTERNS.LOOSE) || [];
  return [...new Set(matches)].filter(isValidAddressFormat);
};

/**
 * 🛡️ 地址类型枚举（与 SUI_SERVICE_API.md 保持一致）
 */
export const AddressType = {
  ACCOUNT: 'ACCOUNT', // 🛡️ 普通钱包地址
  PACKAGE: 'PACKAGE', // 📜 智能合约包
  OBJECT: 'OBJECT', // 💎 链上对象（Coin、NFT 等）
  UNKNOWN: 'UNKNOWN', // ❓ 无法识别
};

/**
 * 🚨 风险等级枚举（与 SUI_SERVICE_API.md 保持一致）
 */
export const RiskLevel = {
  SAFE: 'SAFE', // ✅ 绿色（官方白名单）
  NEUTRAL: 'NEUTRAL', // 🛡️ 灰色（未知但无明显风险）
  SUSPICIOUS: 'SUSPICIOUS', // ⚠️ 黄色（可疑但不确定）
  DANGER: 'DANGER', // 🚫 红色（确认恶意/假币）
};

/**
 * 🎨 风险等级对应的颜色（供 UI 使用）
 */
export const RISK_COLORS = {
  [RiskLevel.SAFE]: '#10b981', // 绿色
  [RiskLevel.NEUTRAL]: '#6b7280', // 灰色
  [RiskLevel.SUSPICIOUS]: '#f59e0b', // 黄色
  [RiskLevel.DANGER]: '#ef4444', // 红色
};

/**
 * 🎨 风险等级对应的图标（供 UI 使用）
 */
export const RISK_ICONS = {
  [RiskLevel.SAFE]: '✅',
  [RiskLevel.NEUTRAL]: '🛡️',
  [RiskLevel.SUSPICIOUS]: '⚠️',
  [RiskLevel.DANGER]: '🚫',
};
