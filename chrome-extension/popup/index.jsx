import { useStorage } from '@plasmohq/storage/hook';
import React, { useEffect, useState } from 'react';

// 常量定义
const VERSION = 'v0.1.0';
const SUPPORTED_SITES = ['suiscan.xyz', 'suivision.xyz', 'polymedia.app'];

const STATUS_COLORS = {
  active: {
    background: '#ecfdf5',
    border: '#10b981',
    text: '#10b981',
  },
  paused: {
    background: '#fef2f2',
    border: '#ef4444',
    text: '#ef4444',
  },
};

// 文案定义（中英文）
const TRANSLATIONS = {
  en: {
    title: '🛡️ SuiTruth',
    version: 'Version',
    currentStatus: 'Current Status',
    monitoring: '🟢 Monitoring',
    paused: '🔴 Paused',
    toggleOn: '▶️ Start Monitoring',
    toggleOff: '⏸️ Pause Monitoring',
    unsupportedSite: '⚠️ Unsupported Site',
    supportedSites: '📍 Supported Sites',
    siteList: '• SuiScan • SuiVision • Polymedia',
    visitSite: 'Please visit a supported site to use SuiTruth.',
  },
  zh: {
    title: '🛡️ SuiTruth',
    version: '版本',
    currentStatus: '当前状态',
    monitoring: '🟢 正在实时监控',
    paused: '🔴 已暂停扫描',
    toggleOn: '▶️ 开启监控',
    toggleOff: '⏸️ 暂停监控',
    unsupportedSite: '⚠️ 不支持当前网站',
    supportedSites: '📍 适配站点',
    siteList: '• SuiScan • SuiVision • Polymedia',
    visitSite: '请访问支持的网站以使用 SuiTruth。',
  },
};

/**
 * 安全解析 URL 的 hostname
 * @param {string} url - 原始 URL
 * @returns {string} hostname 或空字符串
 */
const safeGetHostname = (url) => {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

function IndexPopup() {
  const [scannerActive, setScannerActive] = useStorage('is_active', true);
  const [isSupported, setIsSupported] = useState(null); // null = 加载中
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // 检查当前系统语言
    const userLanguage = navigator.language.toLowerCase();
    setLanguage(userLanguage.startsWith('zh') ? 'zh' : 'en');

    // 检查当前网站是否在支持列表中
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      const hostname = safeGetHostname(url);
      const supported = SUPPORTED_SITES.some((site) => hostname.includes(site));
      setIsSupported(supported);
    });
  }, []);

  const handleToggle = () => {
    setScannerActive(!scannerActive);
  };

  // 获取当前语言的文案
  const t = TRANSLATIONS[language];

  // 加载状态
  if (isSupported === null) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  // 不支持的网站
  if (!isSupported) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>{t.title}</h2>
        <div style={styles.unsupportedBox}>
          <div style={styles.unsupportedText}>{t.unsupportedSite}</div>
          <div style={styles.unsupportedHint}>{t.visitSite}</div>
        </div>
        <div style={styles.siteListBox}>
          <strong>{t.supportedSites}</strong>
          <br />
          {t.siteList}
        </div>
      </div>
    );
  }

  // 动态样式
  const statusStyle = scannerActive ? STATUS_COLORS.active : STATUS_COLORS.paused;

  return (
    <div style={styles.container}>
      {/* 标题 */}
      <div style={styles.header}>
        <h2 style={styles.title}>{t.title}</h2>
        <span style={styles.versionBadge}>
          {t.version} {VERSION}
        </span>
      </div>

      {/* 状态显示 */}
      <div
        style={{
          ...styles.statusBox,
          backgroundColor: statusStyle.background,
          border: `1px solid ${statusStyle.border}`,
        }}
      >
        <div style={styles.statusLabel}>{t.currentStatus}</div>
        <div style={{ ...styles.statusText, color: statusStyle.text }}>
          {scannerActive ? t.monitoring : t.paused}
        </div>
      </div>

      {/* 切换按钮 */}
      <button
        onClick={handleToggle}
        style={{
          ...styles.toggleButton,
          backgroundColor: scannerActive ? '#ef4444' : '#10b981',
        }}
      >
        {scannerActive ? t.toggleOff : t.toggleOn}
      </button>

      {/* 适配站点 */}
      <div style={styles.siteListBox}>
        <strong>{t.supportedSites}</strong>
        <br />
        {t.siteList}
      </div>
    </div>
  );
}

// 样式抽离（避免内联样式重复）
const styles = {
  container: {
    width: 280,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '18px',
    margin: 0,
    color: '#1f2937',
    fontWeight: '700',
  },
  versionBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '4px',
    fontWeight: '600',
  },
  statusBox: {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statusText: {
    fontSize: '15px',
    fontWeight: '600',
  },
  toggleButton: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    transition: 'background-color 0.3s ease',
  },
  siteListBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#6b7280',
  },
  loading: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '20px',
  },
  unsupportedBox: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  unsupportedText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: '8px',
  },
  unsupportedHint: {
    fontSize: '12px',
    color: '#6b7280',
  },
};

export default IndexPopup;
