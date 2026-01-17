/**
 * 🔍 Polymedia 站点适配模块
 * 负责在 polymedia.app 上识别地址并注入 Badge
 */

import { batchGetProfiles } from '../services/suiService';
import { RISK_ICONS, TYPE_ICONS } from '../services/constants';

const BADGE_CLASS = 'suitruth-badge';
const STYLE_ID = 'suitruth-styles-polymedia';

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
  console.log('💉 [Polymedia] 样式已注入');
};

/**
 * 🧹 移除全局样式
 */
export const removeStyles = () => {
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
    console.log('🧹 [Polymedia] 样式已移除');
  }
};

/**
 * 🧹 移除所有 Badge 并重置状态
 */
export const removeBadges = () => {
  const badges = document.querySelectorAll(`.${BADGE_CLASS}`);
  badges.forEach((badge) => badge.remove());

  // 🔧 关键修复：重置 processedElements
  processedElements = new WeakSet();

  console.log(`🧹 [Polymedia] 已移除 ${badges.length} 个 Badge，重置处理状态`);
};

/**
 * 🏷️ 创建 Badge 元素
 */
const createBadge = (profile) => {
  const badge = document.createElement('span');
  const riskClass = profile.riskLevel?.toLowerCase() || 'neutral';
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${riskClass}`;

  const icon = document.createElement('span');
  icon.className = `${BADGE_CLASS}__icon`;
  icon.textContent = RISK_ICONS[profile.riskLevel] || TYPE_ICONS[profile.type] || '🔍';

  const label = document.createElement('span');
  label.className = `${BADGE_CLASS}__label`;
  label.textContent = profile.label || profile.type || 'Unknown';

  badge.appendChild(icon);
  badge.appendChild(label);

  const tooltipLines = [
    `类型: ${profile.type || 'Unknown'}`,
    `风险: ${profile.riskLevel || 'Unknown'}`,
  ];
  if (profile.label) tooltipLines.push(`标签: ${profile.label}`);
  if (profile.isContract) tooltipLines.push('📜 智能合约');
  if (profile.isWhitelisted) tooltipLines.push('✅ 官方白名单');

  badge.title = tooltipLines.join('\n');

  return badge;
};

/**
 * 🔍 查找 Polymedia 页面上的地址元素
 */
const findAddressElements = () => {
  const elements = [];

  // Polymedia 的选择器
  const selectors = [
    'a[href*="/account/0x"]',
    'a[href*="/address/0x"]',
    'a[href*="/object/0x"]',
    'a[href*="/package/0x"]',
    'a[href*="0x"]',
  ];

  const addressLinks = document.querySelectorAll(selectors.join(', '));

  addressLinks.forEach((link) => {
    if (processedElements.has(link)) return;
    if (link.querySelector(`.${BADGE_CLASS}`)) return;
    if (link.nextElementSibling?.classList?.contains(BADGE_CLASS)) return;
    if (link.closest('nav, footer, header')) return;

    // 额外检查：确保 href 包含有效地址格式
    const href = link.getAttribute('href') || '';
    if (href.match(/0x[a-f0-9]{8,64}/i)) {
      elements.push(link);
    }
  });

  return elements;
};

/**
 * 🔍 从元素中提取地址
 */
const extractAddress = (element) => {
  const href = element.getAttribute('href') || '';

  const match = href.match(/0x[a-f0-9]{1,64}/i);
  if (match) {
    return match[0].toLowerCase();
  }

  const text = element.textContent?.trim() || '';
  const textMatch = text.match(/^0x[a-f0-9]{1,64}$/i);
  if (textMatch) {
    return textMatch[0].toLowerCase();
  }

  return null;
};

/**
 * 🚀 扫描页面并注入 Badge
 */
export const scanAndInjectBadges = async () => {
  const elements = findAddressElements();

  if (elements.length === 0) {
    console.log('🔍 [Polymedia] 未发现新的地址元素');
    return;
  }

  console.log(`🔍 [Polymedia] 发现 ${elements.length} 个地址元素`);

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
    console.log('🔍 [Polymedia] 未提取到有效地址');
    return;
  }

  console.log(`🔍 [Polymedia] 提取到 ${addresses.length} 个唯一地址`);

  try {
    const profiles = await batchGetProfiles(addresses);
    let injectedCount = 0;

    profiles.forEach((profile, address) => {
      const targetElements = addressMap.get(address) || [];

      targetElements.forEach((el) => {
        if (processedElements.has(el)) return;
        if (el.nextElementSibling?.classList?.contains(BADGE_CLASS)) return;

        processedElements.add(el);

        const badge = createBadge(profile);

        if (el.parentNode) {
          el.parentNode.insertBefore(badge, el.nextSibling);
          injectedCount++;
        }
      });
    });

    console.log(`✅ [Polymedia] 已注入 ${injectedCount} 个 Badge`);
  } catch (error) {
    console.error('❌ [Polymedia] 批量获取画像失败:', error);
  }
};

export default {
  injectStyles,
  removeStyles,
  removeBadges,
  scanAndInjectBadges,
};
