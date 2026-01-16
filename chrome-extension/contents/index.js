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

  // 不支持的网站返回 null
  return null;
};

// 防抖处理动态内容（提前定义，供 MutationObserver 使用）
const handleMutation = async () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const siteModule = getSiteModule();

      // 不支持的网站不处理
      if (!siteModule) return;

      const isActive = (await getStorage().get('is_active')) ?? true;
      if (isActive) {
        siteModule.injectStyles();
      }
    } catch (e) {
      // 静默处理
    }
  }, 300);
};

// 页面扫描（统一的状态处理逻辑）
const pageScanner = async () => {
  try {
    const siteModule = getSiteModule();

    // 不支持的网站直接退出
    if (!siteModule) {
      console.warn('⚠️ 当前网站不受支持，扩展未启动');
      return;
    }

    const isActive = (await getStorage().get('is_active')) ?? true;

    if (isActive) {
      siteModule.injectStyles();
    } else {
      siteModule.removeStyles();
    }
  } catch (e) {
    console.error('❌ 页面扫描失败:', e);
    // 降级处理：默认开启
    try {
      const siteModule = getSiteModule();
      if (siteModule) {
        siteModule.injectStyles();
      }
    } catch (fallbackError) {
      console.error('❌ 降级处理也失败:', fallbackError);
    }
  }
};

// 启动 MutationObserver
const startMutationObserver = () => {
  const siteModule = getSiteModule();

  // 不支持的网站不启动 Observer
  if (!siteModule) {
    console.warn('⚠️ 当前网站不受支持，跳过 MutationObserver');
    return;
  }

  // 避免重复启动
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

  // 不支持的网站不启动监听
  if (!siteModule) {
    console.warn('⚠️ 当前网站不受支持，跳过状态监听');
    return;
  }

  try {
    getStorage().watch({
      is_active: (change) => {
        console.log(`🔄 状态切换: ${change.newValue ? '开启' : '暂停'}`);

        // 根据状态启停 Observer
        if (change.newValue) {
          startMutationObserver();
        } else {
          stopMutationObserver();
        }

        // 复用 pageScanner 的完整逻辑（包括错误处理）
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
  // 1️⃣ 首次扫描
  pageScanner();
  // 2️⃣ 监听状态变化
  setupStatusListener();
  // 3️⃣ 启动 DOM 监听
  startMutationObserver();
} else {
  console.warn('⚠️ 当前网站不受支持，扩展未启动');
}
