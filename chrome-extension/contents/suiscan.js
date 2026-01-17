/**
 * 🔍 SuiScan 站点适配模块
 * 负责在 suiscan.xyz 上识别地址并注入 Badge
 */

import { getAddressProfile, batchGetProfiles } from '../services/suiService';
import { RISK_ICONS, TYPE_ICONS } from '../services/constants';

// Badge 标识类名（用于识别和清理）
const BADGE_CLASS = 'suitruth-badge';
const STYLE_ID = 'suitruth-styles';

// 已处理的元素 WeakSet（避免重复处理）
// 🔧 使用 let 以便在 removeBadges 中重置
let processedElements = new WeakSet();

/**
 * 💉 注入全局样式
 */
export const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${BADGE_CLASS} {
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.2;
      vertical-align: middle;
      cursor: help;
      transition: opacity 0.2s ease;
      white-space: nowrap;
    }

    .${BADGE_CLASS}:hover {
      opacity: 0.85;
    }

    .${BADGE_CLASS}--safe {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .${BADGE_CLASS}--neutral {
      background-color: #f3f4f6;
      color: #6b7280;
      border: 1px solid #e5e7eb;
    }

    .${BADGE_CLASS}--suspicious {
      background-color: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .${BADGE_CLASS}--danger {
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .${BADGE_CLASS}__icon {
      margin-right: 4px;
      font-size: 12px;
    }

    .${BADGE_CLASS}__label {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  document.head.appendChild(style);
  console.log('💉 [SuiScan] 样式已注入');
};

/**
 * 🧹 移除全局样式
 */
export const removeStyles = () => {
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
    console.log('🧹 [SuiScan] 样式已移除');
  }
};

/**
 * 🧹 移除所有 Badge 并重置状态
 */
export const removeBadges = () => {
  const badges = document.querySelectorAll(`.${BADGE_CLASS}`);
  badges.forEach((badge) => badge.remove());

  // 🔧 关键修复：重置 processedElements，允许重新扫描
  processedElements = new WeakSet();

  console.log(`🧹 [SuiScan] 已移除 ${badges.length} 个 Badge，重置处理状态`);
};

/**
 * 🏷️ 创建 Badge 元素
 * @param {Object} profile - 地址画像
 * @returns {HTMLElement}
 */
const createBadge = (profile) => {
  const badge = document.createElement('span');
  const riskClass = profile.riskLevel?.toLowerCase() || 'neutral';
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${riskClass}`;

  // 图标
  const icon = document.createElement('span');
  icon.className = `${BADGE_CLASS}__icon`;
  icon.textContent = RISK_ICONS[profile.riskLevel] || TYPE_ICONS[profile.type] || '🔍';

  // 标签文字
  const label = document.createElement('span');
  label.className = `${BADGE_CLASS}__label`;
  label.textContent = profile.label || profile.type || 'Unknown';

  badge.appendChild(icon);
  badge.appendChild(label);

  // Tooltip
  const tooltipLines = [
    `类型: ${profile.type || 'Unknown'}`,
    `风险: ${profile.riskLevel || 'Unknown'}`,
  ];
  if (profile.label) tooltipLines.push(`标签: ${profile.label}`);
  if (profile.isContract) tooltipLines.push('📜 智能合约');
  if (profile.isWhitelisted) tooltipLines.push('✅ 官方白名单');
  if (profile.isFake) tooltipLines.push('⚠️ 疑似假币');

  badge.title = tooltipLines.join('\n');

  return badge;
};

/**
 * 🔍 查找 SuiScan 页面上的地址元素
 * @returns {HTMLElement[]}
 */
const findAddressElements = () => {
  const elements = [];

  // SuiScan 地址链接选择器
  const selectors = [
    'a[href*="/account/0x"]',
    'a[href*="/address/0x"]',
    'a[href*="/object/0x"]',
    'a[href*="/package/0x"]',
    'a[href*="/txblock/"]',
  ];

  const addressLinks = document.querySelectorAll(selectors.join(', '));

  addressLinks.forEach((link) => {
    // 跳过已处理的元素
    if (processedElements.has(link)) return;

    // 跳过已有 Badge 的元素
    if (link.querySelector(`.${BADGE_CLASS}`)) return;
    if (link.nextElementSibling?.classList?.contains(BADGE_CLASS)) return;

    // 跳过导航栏、页脚等非主要内容
    if (link.closest('nav, footer, header')) return;

    elements.push(link);
  });

  return elements;
};

/**
 * 🔍 从元素中提取地址
 * @param {HTMLElement} element
 * @returns {string|null}
 */
const extractAddress = (element) => {
  const href = element.getAttribute('href') || '';

  // 从 URL 路径中提取地址
  const patterns = [
    /\/account\/(0x[a-f0-9]+)/i,
    /\/address\/(0x[a-f0-9]+)/i,
    /\/object\/(0x[a-f0-9]+)/i,
    /\/package\/(0x[a-f0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = href.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  // 尝试从文本内容提取
  const text = element.textContent?.trim() || '';
  const textMatch = text.match(/^0x[a-f0-9]{1,64}$/i);
  if (textMatch) {
    return textMatch[0].toLowerCase();
  }

  return null;
};

/**
 * 🚀 扫描页面并注入 Badge（主功能）
 */
export const scanAndInjectBadges = async () => {
  const elements = findAddressElements();

  if (elements.length === 0) {
    console.log('🔍 [SuiScan] 未发现新的地址元素');
    return;
  }

  console.log(`🔍 [SuiScan] 发现 ${elements.length} 个地址元素`);

  // 提取所有地址，建立 address -> elements[] 映射
  const addressMap = new Map();

  elements.forEach((el) => {
    const address = extractAddress(el);
    if (address) {
      if (!addressMap.has(address)) {
        addressMap.set(address, []);
      }
      addressMap.get(address).push(el);
    }
  });

  const addresses = Array.from(addressMap.keys());

  if (addresses.length === 0) {
    console.log('🔍 [SuiScan] 未提取到有效地址');
    return;
  }

  console.log(`🔍 [SuiScan] 提取到 ${addresses.length} 个唯一地址`);

  // 批量获取地址画像
  try {
    const profiles = await batchGetProfiles(addresses);

    // 注入 Badge
    let injectedCount = 0;

    profiles.forEach((profile, address) => {
      const targetElements = addressMap.get(address) || [];

      targetElements.forEach((el) => {
        // 再次检查，防止并发问题
        if (processedElements.has(el)) return;
        if (el.nextElementSibling?.classList?.contains(BADGE_CLASS)) return;

        // 标记为已处理
        processedElements.add(el);

        // 创建并注入 Badge
        const badge = createBadge(profile);

        if (el.parentNode) {
          el.parentNode.insertBefore(badge, el.nextSibling);
          injectedCount++;
        }
      });
    });

    console.log(`✅ [SuiScan] 已注入 ${injectedCount} 个 Badge`);
  } catch (error) {
    console.error('❌ [SuiScan] 批量获取画像失败:', error);
  }
};

// 默认导出
export default {
  injectStyles,
  removeStyles,
  removeBadges,
  scanAndInjectBadges,
};
