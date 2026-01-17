/**
 * 🏷️ Badge 管理器
 * 简化版：去掉 Tooltip，Badge 直接显示所有信息
 * 背景色 = 风险级别
 * 文字 = 地址类型/标签
 */

// 🔧 直接定义常量，避免导入问题
const AddressType = {
  PACKAGE: 'package',
  OBJECT: 'object',
  ACCOUNT: 'account',
  ADDRESS: 'address', // 🆕 添加 ADDRESS
  UNKNOWN: 'unknown',
};

const RiskLevel = {
  SAFE: 'safe',
  NEUTRAL: 'neutral',
  SUSPICIOUS: 'suspicious',
  DANGER: 'danger',
};

const BADGE_CLASS = 'suitruth-badge';

/**
 * 🌐 检测是否为中文环境
 */
const isChineseLocale = () => {
  const lang = navigator.language || navigator.userLanguage || 'en';
  return lang.startsWith('zh');
};

/**
 * 🌐 多语言文本
 */
const i18n = {
  zh: {
    types: {
      package: '合约',
      object: '对象',
      account: '账户', // 🔧 account = 账户
      address: '钱包', // 🆕 address = 钱包
      unknown: '未知',
      // 大写版本兼容
      PACKAGE: '合约',
      OBJECT: '对象',
      ACCOUNT: '账户', // 🔧
      ADDRESS: '钱包', // 🆕
      UNKNOWN: '未知',
    },
    fake: '假币',
    whitelist: {
      'Move Stdlib': 'Move标准库',
      'Sui Framework': 'Sui框架',
      'Sui System': 'Sui系统',
      'Sui Genesis': 'Sui官方',
      DeepBook: 'DeepBook',
      SuiNS: 'SuiNS',
      Wormhole: 'Wormhole',
    },
  },
  en: {
    types: {
      package: 'Contract',
      object: 'Object',
      account: 'Account', // 🔧 account = Account
      address: 'Wallet', // 🆕 address = Wallet
      unknown: 'Unknown',
      // 大写版本兼容
      PACKAGE: 'Contract',
      OBJECT: 'Object',
      ACCOUNT: 'Account', // 🔧
      ADDRESS: 'Wallet', // 🆕
      UNKNOWN: 'Unknown',
    },
    fake: 'Fake',
    whitelist: {
      'Move Stdlib': 'Move Stdlib',
      'Sui Framework': 'Sui Framework',
      'Sui System': 'Sui System',
      'Sui Genesis': 'Sui Offical',
      DeepBook: 'DeepBook',
      SuiNS: 'SuiNS',
      Wormhole: 'Wormhole',
    },
  },
};

/**
 * 🌐 获取当前语言的文本
 */
const getLocale = () => {
  return isChineseLocale() ? i18n.zh : i18n.en;
};

/**
 * 📦 类型图标映射（支持大小写）
 */
const TYPE_ICONS = {
  package: '📦',
  object: '🎁',
  account: '👤',
  address: '💳', // 🆕 钱包用不同图标
  unknown: '❓',
  // 大写版本兼容
  PACKAGE: '📦',
  OBJECT: '🎁',
  ACCOUNT: '👤',
  ADDRESS: '💳', // 🆕
  UNKNOWN: '❓',
};

/**
 * 🎨 生成 Badge 样式 CSS（简化版）
 */
export const generateStyles = () => `
  /* Badge 容器 */
  .${BADGE_CLASS}-wrapper {
    position: relative;
    display: inline;
  }

  /* Badge 主体 */
  .${BADGE_CLASS} {
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    gap: 4px;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* 左上角尖角 */
  .${BADGE_CLASS}::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid currentColor;
    opacity: 0.3;
  }

  .${BADGE_CLASS}::after {
    content: '';
    position: absolute;
    top: -5px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }

  /* ✅ 安全 - 绿色背景 */
  .${BADGE_CLASS}--safe {
    background-color: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  .${BADGE_CLASS}--safe::before { border-bottom-color: #a7f3d0; }
  .${BADGE_CLASS}--safe::after { border-bottom: 5px solid #ecfdf5; }

  /* 🛡️ 中性 - 灰色背景 */
  .${BADGE_CLASS}--neutral {
    background-color: #f3f4f6;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }
  .${BADGE_CLASS}--neutral::before { border-bottom-color: #d1d5db; }
  .${BADGE_CLASS}--neutral::after { border-bottom: 5px solid #f3f4f6; }

  /* ⚠️ 可疑 - 黄色背景 */
  .${BADGE_CLASS}--suspicious {
    background-color: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .${BADGE_CLASS}--suspicious::before { border-bottom-color: #fde68a; }
  .${BADGE_CLASS}--suspicious::after { border-bottom: 5px solid #fffbeb; }

  /* 🚫 危险 - 红色背景 */
  .${BADGE_CLASS}--danger {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  .${BADGE_CLASS}--danger::before { border-bottom-color: #fecaca; }
  .${BADGE_CLASS}--danger::after { border-bottom: 5px solid #fef2f2; }

  /* 图标 */
  .${BADGE_CLASS}__icon {
    font-size: 12px;
    line-height: 1;
  }

  /* 标签文字 */
  .${BADGE_CLASS}__label {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/**
 * 💉 注入样式
 */
export const injectStyles = (styleId, siteName) => {
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = generateStyles();
  document.head.appendChild(style);

  console.log(`💉 [${siteName}] 样式已注入`);
};

/**
 * 🧹 移除样式
 */
export const removeStyles = (styleId, siteName) => {
  const style = document.getElementById(styleId);
  if (style) {
    style.remove();
    console.log(`🧹 [${siteName}] 样式已移除`);
  }
};

/**
 * 🧹 移除所有 Badge
 */
export const removeBadges = (siteName) => {
  const badges = document.querySelectorAll(`.${BADGE_CLASS}`);
  badges.forEach((badge) => badge.remove());

  const wrappers = document.querySelectorAll(`.${BADGE_CLASS}-wrapper`);
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
  });

  console.log(`🧹 [${siteName}] 已移除 ${badges.length} 个 Badge`);
  return badges.length;
};

/**
 * 🏷️ 获取显示信息
 * @returns { icon: string, label: string }
 */
const getDisplayInfo = (profile) => {
  const locale = getLocale();

  // 🔧 调试：打印 profile 内容
  console.log('🔍 [Badge] profile:', JSON.stringify(profile, null, 2));

  const type = profile.type || 'unknown';
  const icon = TYPE_ICONS[type] || '❓';

  let label = '';

  // 1. 假币 → 显示 "假币"
  if (profile.isFake) {
    label = locale.fake;
  }
  // 2. 白名单 → 显示简称（如 "Sui"）
  else if (profile.isWhitelisted && profile.label) {
    label = locale.whitelist[profile.label] || profile.label;
  }
  // 3. 代币 → 显示代币符号
  else if (profile.coinInfo?.symbol) {
    label = profile.coinInfo.symbol;
  }
  // 4. 默认 → 显示类型名称（如 "合约"、"钱包"）
  else {
    label = locale.types[type] || locale.types.unknown;
  }

  console.log('🏷️ [Badge] getDisplayInfo:', { type, icon, label });

  return { icon, label };
};

/**
 * 🏷️ 创建 Badge 元素（简化版，无 Tooltip）
 */
export const createBadge = (profile) => {
  const badge = document.createElement('span');

  // 风险级别 → 背景色（转小写）
  const riskLevel = profile.riskLevel || 'neutral';
  const riskClass = riskLevel.toLowerCase();
  badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${riskClass}`;

  const { icon, label } = getDisplayInfo(profile);

  // 类型图标
  const iconEl = document.createElement('span');
  iconEl.className = `${BADGE_CLASS}__icon`;
  iconEl.textContent = icon;
  badge.appendChild(iconEl);

  // 标签文字
  const labelEl = document.createElement('span');
  labelEl.className = `${BADGE_CLASS}__label`;
  labelEl.textContent = label;
  badge.appendChild(labelEl);

  console.log('🏷️ [Badge] createBadge:', { riskLevel, riskClass, icon, label });

  return badge;
};

/**
 * 🔍 检查元素是否已有 Badge
 */
export const hasBadge = (element) => {
  if (element.parentNode?.classList?.contains(`${BADGE_CLASS}-wrapper`)) return true;
  if (element.querySelector(`.${BADGE_CLASS}`)) return true;
  return false;
};

/**
 * 📌 注入 Badge
 */
export const injectBadge = (element, badge) => {
  if (!element.parentNode) return false;

  const wrapper = document.createElement('span');
  wrapper.className = `${BADGE_CLASS}-wrapper`;

  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  wrapper.appendChild(badge);

  return true;
};

export { BADGE_CLASS, AddressType, RiskLevel };
