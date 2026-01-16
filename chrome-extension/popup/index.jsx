import { useStorage } from '@plasmohq/storage/hook';
import React, { useEffect, useState } from 'react';

// 常量定义
const VERSION = 'v0.1.0'; // 动态版本号
const SUPPORTED_SITES = ['suiscan.xyz', 'suivision.xyz', 'polymedia.app']; // 支持的网站列表
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
    unsupportedSite: 'Unsupported Site',
    supportedSites: '📍 Supported Sites',
    siteList: '• SuiScan • SuiVision • Polymedia',
  },
  zh: {
    title: '🛡️ SuiTruth',
    version: '版本',
    currentStatus: '当前状态',
    monitoring: '🟢 正在实时监控',
    paused: '🔴 已暂停扫描',
    toggleOn: '▶️ 开启监控',
    toggleOff: '⏸️ 暂停监控',
    unsupportedSite: '不支持当前网站',
    supportedSites: '📍 适配站点',
    siteList: '• SuiScan • SuiVision • Polymedia',
  },
};

function IndexPopup() {
  const [scannerActive, setScannerActive] = useStorage('is_active', true);
  const [isSupported, setIsSupported] = useState(true); // 是否为支持的网站
  const [language, setLanguage] = useState('en'); // 默认语言为英文

  useEffect(() => {
    // 检查当前系统语言
    const userLanguage = navigator.language.toLowerCase();
    if (userLanguage.startsWith('zh')) {
      setLanguage('zh'); // 设置为中文
    } else {
      setLanguage('en'); // 设置为英文
    }

    // 检查当前网站是否在支持列表中
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      const hostname = new URL(url).hostname;
      const supported = SUPPORTED_SITES.some((site) => hostname.includes(site));
      setIsSupported(supported);
    });
  }, []);

  const handleToggle = () => {
    const newValue = !scannerActive;
    setScannerActive(newValue);
  };

  // 获取当前语言的文案
  const t = TRANSLATIONS[language];

  // 如果不是支持的网站，只显示“不支持当前网站”
  if (!isSupported) {
    return (
      <div
        style={{
          width: 280,
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: '#ffffff',
          color: '#ef4444',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {t.unsupportedSite}
      </div>
    );
  }

  // 动态样式
  const statusStyle = scannerActive ? STATUS_COLORS.active : STATUS_COLORS.paused;

  return (
    <div
      style={{
        width: 280,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: '#ffffff',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            margin: 0,
            color: '#1f2937',
            fontWeight: '700',
          }}
        >
          {t.title}
        </h2>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            borderRadius: '4px',
            fontWeight: '600',
          }}
        >
          {t.version}
          {VERSION}
        </span>
      </div>

      {/* 状态显示 */}
      <div
        style={{
          padding: '12px',
          backgroundColor: statusStyle.background,
          border: `1px solid ${statusStyle.border}`,
          borderRadius: '8px',
          marginBottom: '12px',
          transition: 'all 0.3s ease', // 添加过渡动画
        }}
      >
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>当前状态</div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: '600',
            color: statusStyle.text,
          }}
        >
          {scannerActive ? t.monitoring : t.monitoring}
        </div>
      </div>

      {/* 切换按钮 */}
      <button
        onClick={handleToggle}
        style={{
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: scannerActive ? '#ef4444' : '#10b981',
          color: 'white',
          transition: 'background-color 0.3s ease', // 添加过渡动画
        }}
      >
        {scannerActive ? t.toggleOff : t.toggleOn}
      </button>

      {/* 适配站点 */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#6b7280',
        }}
      >
        <strong>{t.supportedSites}</strong>
        <br />
        {t.siteList}
      </div>
    </div>
  );
}

export default IndexPopup;
