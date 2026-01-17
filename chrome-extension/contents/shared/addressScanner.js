/**
 * 🔍 地址扫描器工厂函数
 * 创建站点专属的扫描器实例
 */

import {
  AddressType,
  RiskLevel,
  WHITELIST,
  createBadge,
  hasBadge,
  injectBadge,
  injectStyles,
  removeBadges,
  removeStyles,
} from './badgeManager';

/**
 * 🔧 标准化地址格式
 */
const normalizeAddress = (address) => {
  if (!address) return '';

  let normalized = address.toLowerCase();

  // 全零地址统一返回 0x0
  if (/^0x0+$/.test(normalized)) {
    return '0x0';
  }

  // 移除前导零
  const withoutPrefix = normalized.slice(2);
  const trimmed = withoutPrefix.replace(/^0+/, '') || '0';

  return '0x' + trimmed;
};

/**
 * 🔍 判断地址类型
 */
const detectAddressType = (address, urlPath = '') => {
  if (urlPath.includes('/package/') || urlPath.includes('/coin/')) {
    return AddressType.PACKAGE;
  }
  if (urlPath.includes('/object/')) {
    return AddressType.OBJECT;
  }
  if (urlPath.includes('/account/')) {
    return AddressType.ACCOUNT;
  }
  if (urlPath.includes('/address/')) {
    return AddressType.ADDRESS;
  }

  if (address.length <= 6) {
    return AddressType.PACKAGE;
  }

  return AddressType.UNKNOWN;
};

/**
 * 🛡️ 分析地址风险
 */
const analyzeRisk = (address, type) => {
  const normalizedAddr = normalizeAddress(address);
  const whitelistEntry = WHITELIST[normalizedAddr] || WHITELIST[address];

  if (whitelistEntry) {
    return {
      riskLevel: RiskLevel.SAFE,
      isWhitelisted: true,
      isFake: false,
      label: whitelistEntry.label,
      type: whitelistEntry.type || type,
    };
  }

  return {
    riskLevel: RiskLevel.NEUTRAL,
    isWhitelisted: false,
    isFake: false,
    label: null,
    type: type,
  };
};

/**
 * 🏭 创建站点扫描器
 */
export const createSiteScanner = (config) => {
  const { siteName, styleId, selectors, addressPatterns, excludeSelectors = [] } = config;

  // 🔧 不再使用 WeakSet，直接依赖 dataset 标记
  // const processedElements = new WeakSet();

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
      if (link.dataset?.suitruthProcessed === 'true') return;

      // 跳过已有 Badge 的元素
      if (hasBadge(link)) return;

      // 跳过排除区域
      if (excludeSelectors.some((sel) => link.closest(sel))) return;

      // 跳过代币符号链接
      const href = link.getAttribute('href') || '';
      if (href.includes('::')) return;

      elements.push(link);
    });

    return elements;
  };

  /**
   * 🧹 清除所有处理标记（新增函数）
   */
  const clearProcessedMarks = () => {
    document.querySelectorAll('[data-suitruth-processed]').forEach((el) => {
      delete el.dataset.suitruthProcessed;
    });
    console.log(`🧹 [${siteName}] 已清除所有处理标记`);
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

    let injectedCount = 0;

    for (const el of elements) {
      // 再次检查避免重复
      if (el.dataset?.suitruthProcessed === 'true') continue;

      const href = el.getAttribute('href') || '';
      const address = extractAddressFromUrl(href);

      if (!address) continue;

      const detectedType = detectAddressType(address, href);
      const riskInfo = analyzeRisk(address, detectedType);

      const profile = {
        address: address,
        type: riskInfo.type,
        riskLevel: riskInfo.riskLevel,
        isWhitelisted: riskInfo.isWhitelisted,
        label: riskInfo.label,
        isFake: riskInfo.isFake,
        coinInfo: null,
      };

      const badge = createBadge(profile);
      if (injectBadge(el, badge)) {
        injectedCount++;
      }
    }

    console.log(`✅ [${siteName}] 已注入 ${injectedCount} 个 Badge`);
  };

  /**
   * 🧹 完整清理（移除 Badge + 清除标记）
   */
  const cleanup = () => {
    removeBadges(siteName);
    clearProcessedMarks();
  };

  return {
    injectStyles: () => injectStyles(styleId, siteName),
    removeStyles: () => removeStyles(styleId, siteName),
    removeBadges: () => cleanup(), // 🔧 改为调用完整清理
    scanAndInjectBadges,
    clearProcessedMarks, // 🆕 导出清理函数
  };
};
