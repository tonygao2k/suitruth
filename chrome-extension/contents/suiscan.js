// 存储被修改的元素
const modifiedElements = new Set();

// 验证是否为 Sui 地址（0x 开头 + 64 位十六进制）
const isSuiAddress = (text) => {
  return /0x[a-fA-F0-9]{64}/.test(text);
};

export const injectStyles = () => {
  // 查找所有包含 0x 的链接
  const addressLinks = document.querySelectorAll("a[href*='0x']");
  let count = 0;

  addressLinks.forEach((el) => {
    // 已处理则跳过
    if (el.dataset.suitruthProcessed) return;

    // 验证是否包含 Sui 地址
    const text = el.innerText || el.textContent || '';
    const href = el.href || '';
    if (!isSuiAddress(text) && !isSuiAddress(href)) return;

    el.dataset.suitruthProcessed = 'true';

    // 保存原始样式
    el.dataset.suitruthOriginalBg = el.style.backgroundColor || '';
    el.dataset.suitruthOriginalBr = el.style.borderRadius || '';
    el.dataset.suitruthOriginalPd = el.style.padding || '';

    // 创建 badge
    const badge = document.createElement('span');
    badge.className = 'suitruth-badge';
    badge.innerText = '🛡️';
    badge.title = 'SuiScan - SuiTruth 正在保护中';
    badge.style.cssText = `
      margin-left: 4px;
      font-size: 12px;
      cursor: help;
      display: inline-block;
      filter: drop-shadow(0 0 2px rgba(76, 130, 251, 0.5));
    `;

    // 应用样式（蓝色主题）
    el.style.setProperty('background-color', 'rgba(76, 130, 251, 0.2)', 'important');
    el.style.setProperty('border-radius', '4px', 'important');
    el.style.setProperty('padding', '0 2px', 'important');

    el.appendChild(badge);
    modifiedElements.add(el);
    count++;
  });

  if (count > 0) {
    console.log(`✅ SuiScan: 成功注入 ${count} 个标记`);
  }
};

export const removeStyles = () => {
  const badges = document.querySelectorAll('.suitruth-badge');
  badges.forEach((badge) => badge.remove());

  // 过滤已删除的元素，防止内存泄漏
  const elementsToRemove = [];

  modifiedElements.forEach((el) => {
    // 检查元素是否仍在 DOM 中
    if (!document.body.contains(el)) {
      elementsToRemove.push(el);
      return;
    }

    if (!el?.dataset) return;

    // 恢复原始样式
    el.style.backgroundColor = el.dataset.suitruthOriginalBg || '';
    el.style.borderRadius = el.dataset.suitruthOriginalBr || '';
    el.style.padding = el.dataset.suitruthOriginalPd || '';

    delete el.dataset.suitruthProcessed;
    delete el.dataset.suitruthOriginalBg;
    delete el.dataset.suitruthOriginalBr;
    delete el.dataset.suitruthOriginalPd;
  });

  // 清理已删除的元素引用
  elementsToRemove.forEach((el) => modifiedElements.delete(el));
  modifiedElements.clear();

  if (badges.length > 0) {
    console.log(`🔴 SuiScan: 已移除 ${badges.length} 个标记`);
  }
};
