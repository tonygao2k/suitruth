import { Storage } from '@plasmohq/storage';

export const config = {
  matches: ['https://suiscan.xyz/*', 'https://suivision.xyz/*', 'https://explorer.polymedia.app/*'],
};

const SUI_ADDRESS_REGEX = /0x[a-fA-F0-9]{3,64}/; // 兼容缩写地址

const injectStyles = () => {
  // 查找所有包含 0x 的 a 标签（SuiVision 的地址几乎全是 a 链接）
  const addressLinks = document.querySelectorAll("a[href*='0x']");

  addressLinks.forEach((el) => {
    // 检查：是否包含地址特征 且 还没被我们插过旗子
    if (!el.dataset.suitruthProcessed && el.innerText.includes('0x')) {
      el.dataset.suitruthProcessed = 'true';
      el.style.position = 'relative';

      // 1. 创建一个 SuiTruth 认证小标签
      const badge = document.createElement('span');
      badge.innerText = '🛡️';
      badge.title = 'SuiTruth 正在保护中';
      badge.style.cssText = `
          margin-left: 4px;
          font-size: 12px;
          cursor: help;
          display: inline-block;
          filter: drop-shadow(0 0 2px rgba(76, 130, 251, 0.5));
        `;

      // 2. 给原有的地址加一个高亮底色
      el.style.setProperty('background-color', 'rgba(76, 130, 251, 0.2)', 'important');
      el.style.setProperty('border-radius', '4px', 'important');
      el.style.setProperty('padding', '0 2px', 'important');

      // 3. 将图标插入到地址后面
      el.appendChild(badge);

      console.log('✅ 成功在地址旁插旗:', el.innerText);
    }
  });
};

const removeStyle = () => {
  console.log('remove styles');
};

const pageScanner = async () => {
  let storage, isScanActive;

  try {
    storage = new Storage();
    isScanActive = (await storage.get('is_scan_active')) ?? true;
  } catch (e) {
    console.warn('⚠️ Storage error, using default:', e.message);
    isScanActive = true;
  }

  console.log(`📊 Status: ${isScanActive ? '✅ Active' : '⏸️ Paused'}`);

  if (isScanActive) injectStyles();
  else removeStyle();
};

// 监听动态内容加载
const observer = new MutationObserver(() => pageScanner());
observer.observe(document.body, { childList: true, subtree: true });

pageScanner();
