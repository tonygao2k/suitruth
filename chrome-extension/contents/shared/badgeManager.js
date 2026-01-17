/**
 * 🏷️ Badge 管理器
 * 简化版：去掉 Tooltip，Badge 直接显示所有信息
 * 背景色 = 风险级别
 * 文字 = 地址类型/标签
 */

// 🔧 定义常量并导出
export const AddressType = {
  PACKAGE: 'package',
  OBJECT: 'object',
  ACCOUNT: 'account',
  ADDRESS: 'address',
  UNKNOWN: 'unknown',
};

export const RiskLevel = {
  SAFE: 'safe',
  NEUTRAL: 'neutral',
  SUSPICIOUS: 'suspicious',
  DANGER: 'danger',
};

export const BADGE_CLASS = 'suitruth-badge';

// 🆕 白名单配置（统一管理）
export const WHITELIST = {
  '0x1': { label: 'Move Stdlib', type: AddressType.PACKAGE },
  '0x2': { label: 'Sui Framework', type: AddressType.PACKAGE },
  '0x3': { label: 'Sui System', type: AddressType.PACKAGE },
  '0xdee9': { label: 'DeepBook', type: AddressType.PACKAGE },
  '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0': {
    label: 'SuiNS',
    type: AddressType.PACKAGE,
  },
  '0x0': { label: 'Sui Wallet', type: AddressType.ACCOUNT },
  '0x0000000000000000000000000000000000000000000000000000000000000000': {
    label: 'Sui Wallet',
    type: AddressType.ACCOUNT,
  },
  '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a': {
    label: 'Wormhole',
    type: AddressType.PACKAGE,
  },
};

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
      account: '钱包',
      address: '地址',
      unknown: '未知',
      PACKAGE: '合约',
      OBJECT: '对象',
      ACCOUNT: '钱包',
      ADDRESS: '地址',
      UNKNOWN: '未知',
    },
    fake: '假币',
    whitelist: {
      'Move Stdlib': '官方',
      'Sui Framework': '官方',
      'Sui System': '官方',
      'Sui Wallet': '官方',
      DeepBook: '官方',
      SuiNS: '官方',
      Wormhole: '官方',
    },
  },
  en: {
    types: {
      package: 'Contract',
      object: 'Object',
      account: 'Wallet',
      address: 'Address',
      unknown: 'Unknown',
      PACKAGE: 'Contract',
      OBJECT: 'Object',
      ACCOUNT: 'Wallet',
      ADDRESS: 'Address',
      UNKNOWN: 'Unknown',
    },
    fake: 'Fake',
    whitelist: {
      'Move Stdlib': 'Official',
      'Sui Framework': 'Official',
      'Sui System': 'Official',
      'Sui Wallet': 'Official',
      DeepBook: 'Official',
      SuiNS: 'Official',
      Wormhole: 'Official',
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
 * 📦 类型图标映射
 */
const TYPE_ICONS = {
  package: '📦',
  object: '🔷', // 🔧 改为菱形，表示数据对象
  account: '💰',
  address: '🏷️',
  unknown: '❓',
  PACKAGE: '📦',
  OBJECT: '🔷', // 🔧 改为菱形
  ACCOUNT: '💰',
  ADDRESS: '🏷️',
  UNKNOWN: '❓',
};

/**
 * 🎨 生成 Badge 样式 CSS（修复版 - inline 布局，不叠加）
 */
export const generateStyles = () => `
  /* Badge 主体 - inline 布局 */
  .${BADGE_CLASS} {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    margin-left: 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    gap: 2px;
    vertical-align: middle;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* ✅ 安全 - 绿色背景 */
  .${BADGE_CLASS}--safe {
    background-color: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }

  /* 🛡️ 中性 - 蓝色背景（更好看）*/
  .${BADGE_CLASS}--neutral {
    background-color: #eff6ff;
    color: #3b82f6;
    border: 1px solid #bfdbfe;
  }

  /* ⚠️ 可疑 - 黄色背景 */
  .${BADGE_CLASS}--suspicious {
    background-color: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }

  /* 🚫 危险 - 红色背景 */
  .${BADGE_CLASS}--danger {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  /* 图标 */
  .${BADGE_CLASS}__icon {
    font-size: 10px;
    line-height: 1;
  }

  /* 标签文字 */
  .${BADGE_CLASS}__label {
    max-width: 60px;
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

  // 清除所有处理标记
  document.querySelectorAll('[data-suitruth-processed]').forEach((el) => {
    delete el.dataset.suitruthProcessed;
  });

  console.log(`🧹 [${siteName}] 已移除 ${badges.length} 个 Badge`);
  return badges.length;
};

/**
 * 🏷️ 获取显示信息
 */
const getDisplayInfo = (profile) => {
  const locale = getLocale();
  const type = profile.type || 'unknown';
  const icon = TYPE_ICONS[type] || '❓';

  let label = '';

  // 1. 假币 → 显示 "假币"
  if (profile.isFake) {
    label = locale.fake;
  }
  // 2. 白名单 → 显示 "官方"
  else if (profile.isWhitelisted && profile.label) {
    label = locale.whitelist[profile.label] || profile.label;
  }
  // 3. 代币 → 显示代币符号
  else if (profile.coinInfo?.symbol) {
    label = profile.coinInfo.symbol;
  }
  // 4. 默认 → 显示类型名称
  else {
    label = locale.types[type] || locale.types.unknown;
  }

  return { icon, label };
};

/**
 * 🏷️ 创建 Badge 元素
 */
export const createBadge = (profile) => {
  const badge = document.createElement('span');

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

  return badge;
};

/**
 * 🔍 检查元素是否已有 Badge
 */
export const hasBadge = (element) => {
  if (element.dataset?.suitruthProcessed === 'true') return true;
  if (element.nextElementSibling?.classList?.contains(BADGE_CLASS)) return true;
  return false;
};

/**
 * 📌 注入 Badge（简化版 - 直接插入到元素后面）
 */
export const injectBadge = (element, badge) => {
  if (!element.parentNode) return false;

  if (element.dataset?.suitruthProcessed === 'true') {
    return false;
  }

  element.dataset.suitruthProcessed = 'true';
  element.parentNode.insertBefore(badge, element.nextSibling);

  return true;
};
