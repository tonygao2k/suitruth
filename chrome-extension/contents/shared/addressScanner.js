/**
 * 🔍 地址扫描器工厂函数
 * 创建站点专属的扫描器实例
 */

import {
  createBadge,
  hasBadge,
  injectBadge,
  injectStyles,
  removeBadges,
  removeStyles,
} from './badgeManager';

// 直接定义常量
const AddressType = {
  PACKAGE: 'package',
  OBJECT: 'object',
  ACCOUNT: 'account',
  UNKNOWN: 'unknown',
};

const RiskLevel = {
  SAFE: 'safe',
  NEUTRAL: 'neutral',
  SUSPICIOUS: 'suspicious',
  DANGER: 'danger',
};

// 白名单配置
const WHITELIST = {
  '0x1': { label: 'Move Stdlib', type: AddressType.PACKAGE },
  '0x2': { label: 'Sui Framework', type: AddressType.PACKAGE },
  '0x3': { label: 'Sui System', type: AddressType.PACKAGE },
  '0xdee9': { label: 'DeepBook', type: AddressType.PACKAGE },
  '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0': {
    label: 'SuiNS',
    type: AddressType.PACKAGE,
  },
  // 🆕 添加零地址（Sui 系统地址）
  '0x0': { label: 'Sui Genesis', type: AddressType.ACCOUNT },
  '0x0000000000000000000000000000000000000000000000000000000000000000': {
    label: 'Sui Genesis',
    type: AddressType.ACCOUNT,
  },
  // 🆕 Wormhole 跨链桥
  '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a': {
    label: 'Wormhole',
    type: AddressType.PACKAGE,
  },
};

/**
 * 🔍 判断地址类型
 */
const detectAddressType = (address, urlPath = '') => {
  // 根据 URL 路径判断
  if (urlPath.includes('/package/') || urlPath.includes('/coin/')) {
    return AddressType.PACKAGE;
  }
  if (urlPath.includes('/object/')) {
    return AddressType.OBJECT;
  }
  if (urlPath.includes('/account/') || urlPath.includes('/address/')) {
    return AddressType.ACCOUNT;
  }

  // 根据地址特征判断（简单规则）
  if (address.length <= 6) {
    return AddressType.PACKAGE; // 短地址通常是系统合约
  }

  return AddressType.UNKNOWN;
};

/**
 * 🛡️ 分析地址风险
 */
const analyzeRisk = (address, type) => {
  // 检查白名单
  const whitelistEntry = WHITELIST[address];
  if (whitelistEntry) {
    return {
      riskLevel: RiskLevel.SAFE,
      isWhitelisted: true,
      label: whitelistEntry.label,
      type: whitelistEntry.type || type,
    };
  }

  // 默认返回中性
  return {
    riskLevel: RiskLevel.NEUTRAL,
    isWhitelisted: false,
    label: null,
    type: type,
  };
};

/**
 * 🏭 创建站点扫描器
 */
export const createSiteScanner = (config) => {
  const { siteName, styleId, selectors, addressPatterns, excludeSelectors = [] } = config;

  const processedElements = new WeakSet();

  /**
   * 🔍 从 URL 提取地址
   */
  const extractAddressFromUrl = (url) => {
    for (const pattern of addressPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  /**
   * 🔍 查找页面上的地址元素
   */
  const findAddressElements = () => {
    const elements = [];
    const addressLinks = document.querySelectorAll(selectors.join(', '));

    addressLinks.forEach((link) => {
      // 跳过已处理的元素
      if (processedElements.has(link)) return;

      // 跳过已有 Badge 的元素
      if (hasBadge(link)) return;

      // 跳过排除区域
      if (excludeSelectors.some((sel) => link.closest(sel))) return;

      elements.push(link);
    });

    return elements;
  };

  /**
   * 🎯 扫描并注入 Badge
   */
  const scanAndInjectBadges = async () => {
    const elements = findAddressElements();

    if (elements.length === 0) {
      console.log(`🔍 [${siteName}] 未发现新的地址元素`);
      return;
    }

    console.log(`🔍 [${siteName}] 发现 ${elements.length} 个地址元素`);

    // 收集所有地址
    const addressMap = new Map();
    elements.forEach((el) => {
      const href = el.getAttribute('href') || '';
      const address = extractAddressFromUrl(href);
      if (address) {
        if (!addressMap.has(address)) {
          addressMap.set(address, []);
        }
        addressMap.get(address).push({ element: el, href });
      }
    });

    console.log(`📋 [${siteName}] 提取到 ${addressMap.size} 个唯一地址`);

    // 为每个地址创建 profile 并注入 Badge
    let injectedCount = 0;

    for (const [address, items] of addressMap) {
      // 🔧 从 URL 路径判断类型
      const urlPath = items[0]?.href || '';
      const detectedType = detectAddressType(address, urlPath);

      // 🔧 分析风险
      const riskInfo = analyzeRisk(address, detectedType);

      // 🔧 创建完整的 profile
      const profile = {
        address: address,
        type: riskInfo.type, // ✅ 确保 type 存在
        riskLevel: riskInfo.riskLevel, // ✅ 确保 riskLevel 存在
        isWhitelisted: riskInfo.isWhitelisted,
        label: riskInfo.label,
        isFake: false,
        coinInfo: null,
      };

      console.log(`🏷️ [${siteName}] 创建 profile:`, profile);

      // 为所有使用该地址的元素注入 Badge
      for (const { element } of items) {
        if (processedElements.has(element)) continue;

        const badge = createBadge(profile);
        if (injectBadge(element, badge)) {
          processedElements.add(element);
          injectedCount++;
        }
      }
    }

    console.log(`✅ [${siteName}] 已注入 ${injectedCount} 个 Badge`);
  };

  return {
    injectStyles: () => injectStyles(styleId, siteName),
    removeStyles: () => removeStyles(styleId, siteName),
    removeBadges: () => removeBadges(siteName),
    scanAndInjectBadges,
  };
};
