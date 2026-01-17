import { Storage } from '@plasmohq/storage';
import * as suiscan from './suiscan';
import * as suivision from './suivision';
import * as polymedia from './polymedia';

export const config = {
  matches: ['https://*.suiscan.xyz/*', 'https://*.suivision.xyz/*', 'https://*.polymedia.app/*'],
};

// 单例 Storage 实例
let storage;
const getStorage = () => {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
};

// 防抖定时器
let debounceTimer = null;

// MutationObserver 实例
let observer = null;

// 扫描状态（避免重复扫描）
let isScanning = false;

// 根据当前网站选择对应的模块
const getSiteModule = () => {
  const hostname = window.location.hostname;

  if (hostname.includes('suiscan.xyz')) {
    return suiscan;
  } else if (hostname.includes('suivision.xyz')) {
    return suivision;
  } else if (hostname.includes('polymedia.app')) {
    return polymedia;
  }

  return null;
};

// 执行扫描（核心逻辑）
const performScan = async () => {
  if (isScanning) return;

  const siteModule = getSiteModule();
  if (!siteModule) return;

  try {
    isScanning = true;

    const isActive = (await getStorage().get('is_active')) ?? true;

    if (isActive) {
      // 1. 注入样式
      siteModule.injectStyles();

      // 2. 扫描地址并注入 Badge
      if (typeof siteModule.scanAndInjectBadges === 'function') {
        await siteModule.scanAndInjectBadges();
      }
    } else {
      // 移除样式和 Badge
      if (typeof siteModule.removeBadges === 'function') {
        siteModule.removeBadges();
      }
      siteModule.removeStyles();
    }
  } catch (e) {
    console.error('❌ 扫描失败:', e);
  } finally {
    isScanning = false;
  }
};

// 防抖处理动态内容
const handleMutation = () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    await performScan();
  }, 300);
};

// 页面扫描（统一的状态处理逻辑）
const pageScanner = async () => {
  try {
    await performScan();
  } catch (e) {
    console.error('❌ 页面扫描失败:', e);

    // 降级处理：默认开启样式
    try {
      const siteModule = getSiteModule();
      if (siteModule) {
        siteModule.injectStyles();
      }
    } catch (fallbackError) {
      console.error('❌ 降级处理失败:', fallbackError);
    }
  }
};

// 启动 MutationObserver
const startMutationObserver = () => {
  const siteModule = getSiteModule();

  if (!siteModule) {
    console.warn('⚠️ 当前网站不受支持，跳过 MutationObserver');
    return;
  }

  if (observer) {
    console.warn('⚠️ MutationObserver 已在运行');
    return;
  }

  observer = new MutationObserver(handleMutation);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('👀 MutationObserver 已启动');
};

// 停止 MutationObserver
const stopMutationObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('🛑 MutationObserver 已停止');
  }
};

// 监听扩展状态变化
const setupStatusListener = () => {
  const siteModule = getSiteModule();

  if (!siteModule) {
    console.warn('⚠️ 当前网站不受支持，跳过状态监听');
    return;
  }

  try {
    getStorage().watch({
      is_active: (change) => {
        console.log(`🔄 状态切换: ${change.newValue ? '开启' : '暂停'}`);

        if (change.newValue) {
          startMutationObserver();
        } else {
          stopMutationObserver();
        }

        pageScanner();
      },
    });

    console.log('👀 状态监听已启动');
  } catch (e) {
    console.warn('⚠️ 状态监听失败:', e.message);
  }
};

// 初始化
console.log('🚀 SuiTruth Content Script 加载完成');
console.log(`📍 当前网站: ${window.location.hostname}`);

const siteModule = getSiteModule();
if (siteModule) {
  console.log('✅ 当前网站受支持，启动扩展');
  pageScanner();
  setupStatusListener();
  startMutationObserver();
} else {
  console.warn('⚠️ 当前网站不受支持，扩展未启动');
}
