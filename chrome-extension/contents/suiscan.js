/**
 * 🔍 SuiScan 站点适配模块
 * 仅定义站点特有的配置
 */

import { createSiteScanner } from './shared/addressScanner';

const scanner = createSiteScanner({
  siteName: 'SuiScan',
  styleId: 'suitruth-styles-suiscan',

  // SuiScan 特有的选择器
  selectors: [
    'a[href*="/account/0x"]',
    'a[href*="/address/0x"]',
    'a[href*="/object/0x"]',
    'a[href*="/package/0x"]',
    'a[href*="/coin/0x"]',
  ],

  // SuiScan URL 地址提取正则
  addressPatterns: [
    /\/account\/(0x[a-f0-9]+)/i,
    /\/address\/(0x[a-f0-9]+)/i,
    /\/object\/(0x[a-f0-9]+)/i,
    /\/package\/(0x[a-f0-9]+)/i,
    /\/coin\/(0x[a-f0-9]+)/i,
  ],

  // 排除的区域
  excludeSelectors: ['nav', 'footer', 'header', '.sidebar'],
});

export const { injectStyles, removeStyles, removeBadges, scanAndInjectBadges } = scanner;
export default scanner;
