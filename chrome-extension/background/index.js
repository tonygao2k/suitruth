import { Storage } from '@plasmohq/storage';

const SUPPORTED_SITES = ['suiscan.xyz', 'suivision.xyz', 'polymedia.app']; // 支持的网站列表

const storage = new Storage();

// 检查URL是否在监控列表中
const isMonitoredSite = (url) => {
  if (!url) return false;
  return SUPPORTED_SITES.some((site) => url.includes(site));
};

// 更新badge
const updateBadge = async (tabId, url) => {
  try {
    const isActive = (await storage.get('is_active')) ?? true;

    if (isActive && isMonitoredSite(url)) {
      // 显示监控badge
      chrome.action.setBadgeText({
        text: '👁️',
        tabId,
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#4c82fb',
        tabId,
      });
      chrome.action.setTitle({
        title: '🛡️ SuiTruth 正在监控此网站',
        tabId,
      });
    } else {
      // 清除badge
      chrome.action.setBadgeText({
        text: '',
        tabId,
      });
      chrome.action.setTitle({
        title: 'SuiTruth',
        tabId,
      });
    }
  } catch (error) {
    console.error('更新badge失败:', error);
  }
};

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId, tab.url);
  }
});

// 监听标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    updateBadge(activeInfo.tabId, tab.url);
  }
});

// 监听storage变化，实时更新所有标签页的badge
storage.watch({
  is_active: async (change) => {
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id && tab.url) {
        updateBadge(tab.id, tab.url);
      }
    });
  },
});

console.log('🚀 SuiTruth Background Script 已启动');
