import { Storage } from '@plasmohq/storage';

// ============================================
// 常量配置
// ============================================

const SUPPORTED_SITES = ['suiscan.xyz', 'suivision.xyz', 'polymedia.app'];

const BADGE_CONFIG = {
  active: {
    text: 'ON',
    color: '#10b981', // 绿色
    title: '🛡️ SuiTruth 正在监控此网站',
  },
  inactive: {
    text: 'OFF',
    color: '#6b7280', // 灰色
    title: 'SuiTruth 已暂停',
  },
  unsupported: {
    text: '',
    color: '#000000',
    title: 'SuiTruth - 当前网站不受支持',
  },
};

// ============================================
// 存储实例
// ============================================

const storage = new Storage();

// ============================================
// 工具函数
// ============================================

/**
 * 检查 URL 是否为支持的网站
 * @param {string} url
 * @returns {boolean}
 */
const isMonitoredSite = (url) => {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return SUPPORTED_SITES.some((site) => hostname.includes(site));
  } catch {
    return false;
  }
};

/**
 * 更新扩展 Badge
 * @param {number} tabId
 * @param {string} url
 */
const updateBadge = async (tabId, url) => {
  try {
    const isActive = (await storage.get('is_active')) ?? true;
    const isSupported = isMonitoredSite(url);

    let config;
    if (!isSupported) {
      config = BADGE_CONFIG.unsupported;
    } else if (isActive) {
      config = BADGE_CONFIG.active;
    } else {
      config = BADGE_CONFIG.inactive;
    }

    await Promise.all([
      chrome.action.setBadgeText({ text: config.text, tabId }),
      chrome.action.setBadgeBackgroundColor({ color: config.color, tabId }),
      chrome.action.setTitle({ title: config.title, tabId }),
    ]);
  } catch (error) {
    // 标签页可能已关闭，忽略错误
    if (!error.message?.includes('No tab with id')) {
      console.error('❌ 更新 Badge 失败:', error);
    }
  }
};

/**
 * 更新所有标签页的 Badge
 */
const updateAllBadges = async () => {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.filter((tab) => tab.id && tab.url).map((tab) => updateBadge(tab.id, tab.url))
    );
  } catch (error) {
    console.error('❌ 批量更新 Badge 失败:', error);
  }
};

// ============================================
// 消息处理（与 Content Script 通信）
// ============================================

/**
 * 处理来自 Content Script 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'GET_STATUS':
      // Content Script 查询当前状态
      storage.get('is_active').then((isActive) => {
        sendResponse({ isActive: isActive ?? true });
      });
      return true; // 异步响应

    case 'REPORT_SCAN_RESULT':
      // Content Script 报告扫描结果（可用于统计）
      console.log(`📊 [${sender.tab?.url}] 扫描结果:`, payload);
      sendResponse({ success: true });
      return false;

    case 'GET_SUPPORTED_SITES':
      // 返回支持的网站列表
      sendResponse({ sites: SUPPORTED_SITES });
      return false;

    default:
      console.warn('⚠️ 未知消息类型:', type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// ============================================
// 事件监听
// ============================================

// 标签页更新（页面加载完成）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId, tab.url);
  }
});

// 标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      updateBadge(activeInfo.tabId, tab.url);
    }
  } catch (error) {
    // 标签页可能已关闭
    console.warn('⚠️ 获取标签页失败:', error.message);
  }
});

// 扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`🎉 SuiTruth ${details.reason}:`, details);

  if (details.reason === 'install') {
    // 首次安装：设置默认值
    storage.set('is_active', true);
    console.log('✅ 首次安装，默认开启监控');
  } else if (details.reason === 'update') {
    // 更新：可以在这里做数据迁移
    console.log(`📦 从 ${details.previousVersion} 更新`);
  }

  // 更新所有标签页的 Badge
  updateAllBadges();
});

// 监听 Storage 变化
storage.watch({
  is_active: async (change) => {
    console.log(`🔄 状态切换: ${change.newValue ? '开启' : '暂停'}`);
    await updateAllBadges();
  },
});

// ============================================
// 启动日志
// ============================================

console.log('🚀 SuiTruth Background Script 已启动');
console.log('📍 支持的网站:', SUPPORTED_SITES.join(', '));
