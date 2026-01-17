/**
 * 🛡️ SuiTruth Popup 界面
 * 显示插件状态和 Badge 图例说明
 */

import { useStorage } from '@plasmohq/storage/hook';
import React, { useEffect, useState } from 'react';

// 常量定义
const VERSION = 'v0.1.0';
const SUPPORTED_SITES = ['suiscan.xyz', 'suivision.xyz', 'polymedia.app'];

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
    // 图例部分
    legend: '📖 Badge Guide',
    riskLevels: 'Risk Levels (Background Color)',
    addressTypes: 'Address Types (Icon)',
    riskSafe: 'Safe',
    riskSafeDesc: 'Official whitelist',
    riskNeutral: 'Neutral',
    riskNeutralDesc: 'Unknown, no risk detected',
    riskSuspicious: 'Suspicious',
    riskSuspiciousDesc: 'Proceed with caution',
    riskDanger: 'Danger',
    riskDangerDesc: 'Confirmed fake/malicious',
    typePackage: 'Contract',
    typeObject: 'Object',
    typeAccount: 'Wallet',
    typeAddress: 'Address',
    typeUnknown: 'Unknown',
  },
  zh: {
    title: '🛡️ SuiTruth',
    version: '版本',
    currentStatus: '当前状态',
    monitoring: '🟢 正在监控',
    paused: '🔴 已暂停',
    toggleOn: '▶️ 开启监控',
    toggleOff: '⏸️ 暂停监控',
    unsupportedSite: '⚠️ 不支持当前网站',
    supportedSites: '📍 适配站点',
    siteList: '• SuiScan • SuiVision • Polymedia',
    visitSite: '请访问支持的网站以使用 SuiTruth。',
    // 图例部分
    legend: '📖 图例说明',
    riskLevels: '风险级别（背景色）',
    addressTypes: '地址类型（图标）',
    riskSafe: '安全',
    riskSafeDesc: '官方白名单',
    riskNeutral: '中性',
    riskNeutralDesc: '未知，暂无风险',
    riskSuspicious: '可疑',
    riskSuspiciousDesc: '需谨慎操作',
    riskDanger: '危险',
    riskDangerDesc: '确认的假币/恶意',
    typePackage: '合约',
    typeObject: '对象',
    typeAccount: '钱包',
    typeAddress: '地址',
    typeUnknown: '未知',
  },
};

/**
 * 安全解析 URL 的 hostname
 */
const safeGetHostname = (url) => {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

/**
 * 🏷️ Badge 预览组件
 * 🔧 颜色与 badgeManager.js 保持同步
 */
const BadgePreview = ({ icon, label, riskLevel }) => {
  const colors = {
    safe: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    neutral: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' }, // 🔧 改为蓝色
    suspicious: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    danger: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  const style = colors[riskLevel] || colors.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
};

/**
 * 📖 图例说明组件
 * 🔧 图标与 badgeManager.js TYPE_ICONS 保持同步
 */
const LegendSection = ({ t }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.legendContainer}>
      <button
        style={styles.legendToggle}
        onClick={() => setExpanded(!expanded)}
      >
        <span>{t.legend}</span>
        <span style={styles.legendArrow}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={styles.legendContent}>
          {/* 风险级别说明 */}
          <div style={styles.legendSection}>
            <div style={styles.legendSectionTitle}>{t.riskLevels}</div>
            <div style={styles.legendGrid}>
              <LegendItem
                badge={
                  <BadgePreview
                    icon="✅"
                    label={t.riskSafe}
                    riskLevel="safe"
                  />
                }
                desc={t.riskSafeDesc}
              />
              <LegendItem
                badge={
                  <BadgePreview
                    icon="🔵"
                    label={t.riskNeutral}
                    riskLevel="neutral"
                  />
                }
                desc={t.riskNeutralDesc}
              />
              <LegendItem
                badge={
                  <BadgePreview
                    icon="⚠️"
                    label={t.riskSuspicious}
                    riskLevel="suspicious"
                  />
                }
                desc={t.riskSuspiciousDesc}
              />
              <LegendItem
                badge={
                  <BadgePreview
                    icon="🚫"
                    label={t.riskDanger}
                    riskLevel="danger"
                  />
                }
                desc={t.riskDangerDesc}
              />
            </div>
          </div>

          {/* 地址类型说明 - 🔧 图标与 badgeManager.js 同步 */}
          <div style={styles.legendSection}>
            <div style={styles.legendSectionTitle}>{t.addressTypes}</div>
            <div style={styles.typeGrid}>
              <TypeItem
                icon="📦"
                label={t.typePackage}
              />
              <TypeItem
                icon="🔷"
                label={t.typeObject}
              />
              <TypeItem
                icon="💰"
                label={t.typeAccount}
              />
              <TypeItem
                icon="🏷️"
                label={t.typeAddress}
              />
              <TypeItem
                icon="❓"
                label={t.typeUnknown}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ badge, desc }) => (
  <div style={styles.legendItem}>
    <div>{badge}</div>
    <div style={styles.legendDesc}>{desc}</div>
  </div>
);

const TypeItem = ({ icon, label }) => (
  <div style={styles.typeItem}>
    <span style={styles.typeIcon}>{icon}</span>
    <span style={styles.typeLabel}>{label}</span>
  </div>
);

/**
 * 🎯 主组件
 */
function IndexPopup() {
  const [scannerActive, setScannerActive] = useStorage('is_active', true);
  const [isSupported, setIsSupported] = useState(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const userLanguage = navigator.language.toLowerCase();
    setLanguage(userLanguage.startsWith('zh') ? 'zh' : 'en');

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

  const t = TRANSLATIONS[language];

  if (isSupported === null) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>{t.title}</h2>
        <div style={styles.unsupportedBox}>
          <div style={styles.unsupportedText}>{t.unsupportedSite}</div>
          <div style={styles.unsupportedHint}>{t.visitSite}</div>
        </div>
        <LegendSection t={t} />
        <div style={styles.siteListBox}>
          <strong>{t.supportedSites}</strong>
          <br />
          {t.siteList}
        </div>
      </div>
    );
  }

  const statusColor = scannerActive ? '#10b981' : '#ef4444';
  const statusBg = scannerActive ? '#ecfdf5' : '#fef2f2';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t.title}</h2>
        <span style={styles.versionBadge}>
          {t.version} {VERSION}
        </span>
      </div>

      <div
        style={{
          ...styles.statusBox,
          backgroundColor: statusBg,
          border: `1px solid ${statusColor}`,
        }}
      >
        <div style={styles.statusLabel}>{t.currentStatus}</div>
        <div style={{ ...styles.statusText, color: statusColor }}>
          {scannerActive ? t.monitoring : t.paused}
        </div>
      </div>

      <button
        onClick={handleToggle}
        style={{
          ...styles.toggleButton,
          backgroundColor: scannerActive ? '#ef4444' : '#10b981',
        }}
      >
        {scannerActive ? t.toggleOff : t.toggleOn}
      </button>

      <LegendSection t={t} />

      <div style={styles.siteListBox}>
        <strong>{t.supportedSites}</strong>
        <br />
        {t.siteList}
      </div>
    </div>
  );
}

// 样式 - 🔧 调整 typeGrid 为 5 列
const styles = {
  container: {
    width: 300,
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
  },
  siteListBox: {
    marginTop: '12px',
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
  legendContainer: {
    marginTop: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  legendToggle: {
    width: '100%',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  legendArrow: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  legendContent: {
    padding: '12px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  },
  legendSection: {
    marginBottom: '12px',
  },
  legendSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  legendGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legendDesc: {
    fontSize: '11px',
    color: '#6b7280',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)', // 🔧 改为 5 列
    gap: '8px',
  },
  typeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  typeIcon: {
    fontSize: '16px',
  },
  typeLabel: {
    fontSize: '10px',
    color: '#6b7280',
  },
};

export default IndexPopup;
