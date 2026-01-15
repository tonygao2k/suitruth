import { useStorage } from "@plasmohq/storage/hook"
import React, { useState } from "react"

function IndexPopup() {
  const [scannerActive, setScannerActive] = useStorage("is_scan_active", true)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleToggle = () => {
    const newValue = !scannerActive
    setScannerActive(newValue)
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 2000)
  }

  return (
    <div
      style={{
        width: 280,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: "#ffffff"
      }}>
      
      {/* 标题 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "8px",
        marginBottom: "12px"
      }}>
        <h2 style={{ 
          fontSize: "18px", 
          margin: 0, 
          color: "#1f2937",
          fontWeight: "700"
        }}>
          🛡️ SuiTruth
        </h2>
        <span style={{
          fontSize: "10px",
          padding: "2px 6px",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          borderRadius: "4px",
          fontWeight: "600"
        }}>
          v0.1.0
        </span>
      </div>
      
      {/* 状态显示 */}
      <div style={{ 
        padding: "12px",
        backgroundColor: scannerActive ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${scannerActive ? "#10b981" : "#ef4444"}`,
        borderRadius: "8px",
        marginBottom: "12px"
      }}>
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
          当前状态
        </div>
        <div style={{ 
          fontSize: "15px", 
          fontWeight: "600",
          color: scannerActive ? "#10b981" : "#ef4444"
        }}>
          {scannerActive ? "🟢 正在实时监控" : "🔴 已暂停扫描"}
        </div>
      </div>

      {/* 操作反馈 */}
      {showFeedback && (
        <div style={{
          padding: "10px",
          marginBottom: "12px",
          backgroundColor: scannerActive ? "#ecfdf5" : "#fef2f2",
          border: `1px solid ${scannerActive ? "#10b981" : "#ef4444"}`,
          color: scannerActive ? "#059669" : "#dc2626",
          borderRadius: "6px",
          fontSize: "12px",
          textAlign: "center"
        }}>
          ✓ {scannerActive ? "监控已开启" : "监控已暂停"}
        </div>
      )}

      {/* 切换按钮 */}
      <button
        onClick={handleToggle}
        style={{
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          border: "none",
          borderRadius: "8px",
          backgroundColor: scannerActive ? "#ef4444" : "#10b981",
          color: "white"
        }}>
        {scannerActive ? "⏸️ 暂停监控" : "▶️ 开启监控"}
      </button>

      {/* 适配站点 */}
      <div style={{ 
        marginTop: "16px", 
        padding: "12px",
        backgroundColor: "#f9fafb",
        borderRadius: "6px",
        fontSize: "11px",
        color: "#6b7280"
      }}>
        <strong>📍 适配站点</strong><br/>
        • SuiScan • SuiVision • Polymedia
      </div>
    </div>
  )
}

export default IndexPopup