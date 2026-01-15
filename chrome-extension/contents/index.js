import { Storage } from '@plasmohq/storage';

export const config = {
  matches: ['https://suiscan.xyz/*', 'https://suivision.xyz/*', 'https://explorer.polymedia.app/*'],
};

const SUI_ADDRESS_REGEX = /0x[a-fA-F0-9]{3,64}/;

// 存储所有被修改过的元素，方便恢复
const modifiedElements = new Set();

const injectStyles = () => {
  console.log('🟢 开始注入样式...');

  const addressLinks = document.querySelectorAll("a[href*='0x']");
  let count = 0;

  addressLinks.forEach((el) => {
    if (!el.dataset.suitruthProcessed && el.innerText.includes('0x')) {
      el.dataset.suitruthProcessed = 'true';

      // 保存原始样式
      if (!el.dataset.suitruthOriginalBg) {
        el.dataset.suitruthOriginalBg = el.style.backgroundColor || '';
        el.dataset.suitruthOriginalBr = el.style.borderRadius || '';
        el.dataset.suitruthOriginalPd = el.style.padding || '';
      }

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

      el.style.setProperty('background-color', 'rgba(76, 130, 251, 0.2)', 'important');
      el.style.setProperty('border-radius', '4px', 'important');
      el.style.setProperty('padding', '0 2px', 'important');

      el.appendChild(badge);
      modifiedElements.add(el);
      count++;
    }
  });

  console.log(`✅ 成功注入 ${count} 个标记`);
};

const removeStyle = () => {
  console.log('🔴 开始移除样式...');

  // 移除所有 badge
  document.querySelectorAll('.suitruth-badge').forEach((badge) => {
    badge.remove();
  });

  // 恢复所有被修改元素的原始样式
  modifiedElements.forEach((el) => {
    if (el && el.dataset) {
      // 恢复原始样式
      el.style.backgroundColor = el.dataset.suitruthOriginalBg || '';
      el.style.borderRadius = el.dataset.suitruthOriginalBr || '';
      el.style.padding = el.dataset.suitruthOriginalPd || '';

      // 清除我们的标记
      delete el.dataset.suitruthProcessed;
      delete el.dataset.suitruthOriginalBg;
      delete el.dataset.suitruthOriginalBr;
      delete el.dataset.suitruthOriginalPd;
    }
  });

  modifiedElements.clear();
  console.log('✅ 样式已移除并恢复原状');
};

const pageScanner = async () => {
  let storage, isActive;

  try {
    storage = new Storage();
    isActive = (await storage.get('is_active')) ?? true;
  } catch (e) {
    console.warn('⚠️ Storage 读取失败，使用默认值');
    isActive = true;
  }

  console.log(`📊 当前状态: ${isActive ? '开启' : '暂停'}`);

  if (isActive) {
    injectStyles();
  } else {
    removeStyle();
  }
};

// 监听 storage 变化
const setupStorageWatch = async () => {
  try {
    const storage = new Storage();

    storage.watch({
      is_active: (change) => {
        console.log(`🔄 状态切换: ${change.newValue ? '开启' : '暂停'}`);

        if (change.newValue) {
          injectStyles();
        } else {
          removeStyle();
        }
      },
    });

    console.log('👀 已开始监听 popup 切换');
  } catch (e) {
    console.warn('⚠️ Storage 监听启动失败:', e);
  }
};

// 监听动态内容加载
const observer = new MutationObserver(() => {
  // 只在激活状态下扫描新内容
  const storage = new Storage();
  storage.get('is_active').then((isActive) => {
    if (isActive ?? true) {
      injectStyles();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// 初始化
console.log('🚀 SuiTruth Content Script 加载完成');
pageScanner();
setupStorageWatch();
