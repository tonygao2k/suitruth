import { Storage } from '@plasmohq/storage';

export const config = {
  matches: ['https://suiscan.xyz/*', 'https://suivision.xyz/*', 'https://explorer.polymedia.app/*'],
};

const SUI_ADDRESS_REGEX = /0x[a-fA-F0-9]{3,64}/;

// 单例 Storage 实例，避免重复创建
let storage;
const getStorage = () => {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
};

// 存储所有被修改过的元素，方便恢复
const modifiedElements = new Set();

// 防抖定时器
let debounceTimer = null;

const injectStyles = () => {
  const addressLinks = document.querySelectorAll("a[href*='0x']");
  let count = 0;

  addressLinks.forEach((el) => {
    // 已处理或不包含地址则跳过
    if (el.dataset.suitruthProcessed || !el.innerText.includes('0x')) return;

    el.dataset.suitruthProcessed = 'true';

    // 保存原始样式（只保存一次）
    el.dataset.suitruthOriginalBg = el.style.backgroundColor || '';
    el.dataset.suitruthOriginalBr = el.style.borderRadius || '';
    el.dataset.suitruthOriginalPd = el.style.padding || '';

    // 创建 badge
    const badge = document.createElement('span');
    badge.className = 'suitruth-badge';
    badge.innerText = '🛡️';
    badge.title = 'SuiTruth 正在保护中';
    badge.style.cssText = `
      margin-left: 4px;
      font-size: 12px;
      cursor: help;
      display: inline-block;
      filter: drop-shadow(0 0 2px rgba(76, 130, 251, 0.5));
    `;

    // 应用样式
    el.style.setProperty('background-color', 'rgba(76, 130, 251, 0.2)', 'important');
    el.style.setProperty('border-radius', '4px', 'important');
    el.style.setProperty('padding', '0 2px', 'important');

    el.appendChild(badge);
    modifiedElements.add(el);
    count++;
  });

  if (count > 0) {
    console.log(`✅ 成功注入 ${count} 个标记`);
  }
};

const removeStyle = () => {
  // 移除所有 badge
  const badges = document.querySelectorAll('.suitruth-badge');
  badges.forEach((badge) => badge.remove());

  // 恢复所有被修改元素的原始样式
  modifiedElements.forEach((el) => {
    if (!el?.dataset) return;

    // 恢复原始样式
    el.style.backgroundColor = el.dataset.suitruthOriginalBg || '';
    el.style.borderRadius = el.dataset.suitruthOriginalBr || '';
    el.style.padding = el.dataset.suitruthOriginalPd || '';

    // 清除标记
    delete el.dataset.suitruthProcessed;
    delete el.dataset.suitruthOriginalBg;
    delete el.dataset.suitruthOriginalBr;
    delete el.dataset.suitruthOriginalPd;
  });

  modifiedElements.clear();

  if (badges.length > 0) {
    console.log(`🔴 已移除 ${badges.length} 个标记`);
  }
};

const pageScanner = async () => {
  try {
    const isActive = (await getStorage().get('is_active')) ?? true;

    if (isActive) {
      injectStyles();
    } else {
      removeStyle();
    }
  } catch (e) {
    console.warn('⚠️ Storage 读取失败:', e.message);
    // 默认开启
    injectStyles();
  }
};

// 监听 storage 变化
const setupStorageWatch = () => {
  try {
    getStorage().watch({
      is_active: (change) => {
        console.log(`🔄 状态切换: ${change.newValue ? '开启' : '暂停'}`);

        if (change.newValue) {
          injectStyles();
        } else {
          removeStyle();
        }
      },
    });

    console.log('👀 Storage 监听已启动');
  } catch (e) {
    console.warn('⚠️ Storage 监听失败:', e.message);
  }
};

// 防抖处理动态内容
const handleMutation = async () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      const isActive = (await getStorage().get('is_active')) ?? true;
      if (isActive) {
        injectStyles();
      }
    } catch (e) {
      // 静默处理
    }
  }, 300); // 300ms 防抖
};

// 监听动态内容加载（使用防抖）
const observer = new MutationObserver(handleMutation);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 初始化
console.log('🚀 SuiTruth Content Script 加载完成');
pageScanner();
setupStorageWatch();
