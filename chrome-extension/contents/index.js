import { Storage } from '@plasmohq/storage';

export const config = {
  matches: ['https://suiscan.xyz/*', 'https://suivision.xyz/*', 'https://explorer.polymedia.app/*'],
  run_at: 'document_end',
};

const storage = new Storage();
const SUI_ADDRESS_REGEX = /0x[a-fA-F0-9]{64}/g;

// 注入样式
const injectStyles = () => {
  if (document.getElementById('suitruth-styles')) return;

  const style = document.createElement('style');
  style.id = 'suitruth-styles';
  style.textContent = `
    .suitruth-badge {
      display: inline-flex !important;
      align-items: center;
      gap: 2px;
      padding: 1px 4px !important;
      margin-left: 4px !important;
      background: rgba(16, 185, 129, 0.1) !important;
      color: #10b981 !important;
      border: 1px solid #10b981 !important;
      border-radius: 3px !important;
      font-size: 9px !important;
      font-weight: 600 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      white-space: nowrap;
      vertical-align: middle;
      cursor: default;
      line-height: 1.3 !important;
    }
  `;
  document.head.appendChild(style);
  console.log('✅ SuiTruth styles injected');
};

class AddressScanner {
  constructor() {
    this.isActive = true;
    this.markedElements = new Set();
    this.observer = null;
    this.init();
  }

  async init() {
    try {
      console.log('🛡️ SuiTruth Content Script Loaded!');

      if (!chrome.runtime?.id) {
        console.error('❌ Extension context invalid');
        return;
      }

      injectStyles();

      this.isActive = (await storage.get('is_active')) ?? true;
      console.log(`📊 Status: ${this.isActive ? '✅ Active' : '⏸️ Paused'}`);

      storage.watch({
        is_active: (change) => {
          this.isActive = change.newValue;
          console.log(`🔄 Status: ${this.isActive ? '✅ Active' : '⏸️ Paused'}`);

          if (this.isActive) {
            this.start();
          } else {
            this.stop();
          }
        },
      });

      if (this.isActive) {
        setTimeout(() => this.start(), 500);
      }
    } catch (error) {
      console.error('❌ Init error:', error);
    }
  }

  start() {
    console.log('🟢 Starting scanner...');
    this.scanPage();
    this.startObserver();
  }

  stop() {
    console.log('🔴 Stopping scanner...');
    this.observer?.disconnect();
    this.observer = null;
    this.removeBadges();
  }

  removeBadges() {
    document.querySelectorAll('.suitruth-badge').forEach((el) => el.remove());
    this.markedElements.clear();
    console.log('🧹 Badges removed');
  }

  // 检查元素是否在浮动层/弹窗中
  isInFloatingElement(element) {
    let el = element;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);

      if (
        style.position === 'fixed' ||
        style.position === 'absolute' ||
        parseInt(style.zIndex) > 100 ||
        el.className?.match?.(
          /tooltip|popover|dropdown|modal|overlay|popup|hover|float|menu|dialog/i
        ) ||
        el.getAttribute?.('role')?.match?.(/tooltip|dialog|menu|listbox|popup/i)
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  scanPage() {
    if (!this.isActive) return;

    console.log('🔍 Scanning page...');

    const selectors = ['a[href*="0x"]', 'code', 'span', 'div', 'td', 'p'];
    let count = 0;

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (this.markedElements.has(el)) return;
        if (el.querySelector('.suitruth-badge')) return;
        if (this.isInFloatingElement(el)) return;

        const text = el.textContent || '';
        const matches = text.match(SUI_ADDRESS_REGEX);

        if (matches && matches.length > 0 && el.childNodes.length <= 3) {
          this.addBadge(el, matches[0]);
          count++;
        }
      });
    });

    console.log(`✅ Added ${count} badges`);
  }

  addBadge(element, address) {
    if (!element || this.markedElements.has(element)) return;
    if (element.querySelector('.suitruth-badge')) return;

    const tag = element.tagName?.toLowerCase();
    if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) return;
    if (this.isInFloatingElement(element)) return;

    try {
      const badge = document.createElement('span');
      badge.className = 'suitruth-badge';
      badge.textContent = '✓ Safe';
      badge.title = `🛡️ SuiTruth Verified\n📍 ${address.slice(0, 10)}...${address.slice(-6)}`;

      element.appendChild(badge);
      this.markedElements.add(element);
      console.log(`✨ Badge added to <${tag}>`);
    } catch (e) {
      console.error('❌ Badge error:', e);
    }
  }

  startObserver() {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      if (!this.isActive) return;
      clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => this.scanPage(), 300);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('👀 Observer started');
  }
}

console.log('🚀 SuiTruth initializing...');
new AddressScanner();
