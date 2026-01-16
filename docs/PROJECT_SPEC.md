🛡️ SuiTruth 浏览器扩展 - 项目需求规格说明书与设计文档 (PRD & TDD)

1. 项目概述 (Project Overview)
   SuiTruth 是一款基于 Plasmo Framework 开发的 Web3 安全类浏览器扩展。它的核心目标是为 Sui 区块链生态 的用户提供“上帝视角”的安全防护。 通过在主流 Sui 浏览器（Explorer）的页面 DOM 中实时注入视觉标记（Badge/Coloring），帮助用户区分钱包（Account）、合约（Package）以及潜在的恶意地址。

核心价值
非侵入式安全：不改变用户原有操作习惯，仅做视觉增强。

全平台统一：无论用户使用 SuiScan、SuiVision 还是 Polymedia，都能获得一致的安全感知。

隐私优先：目前版本采用纯前端逻辑，无外部数据上报。

2. 技术栈架构 (Tech Stack)
   框架: Plasmo Framework (React + TypeScript/JavaScript)

构建工具: pnpm + Parcel (Plasmo 内置)

状态管理: @plasmohq/storage (基于 Chrome Storage API 的封装)

UI 库: React (Popup), 原生 DOM API (Content Scripts)

浏览器兼容: Chrome, Edge (Manifest V3)

3. 系统架构设计 (System Architecture)
   项目采用标准的 Chrome Extension MV3 架构，分为三层逻辑，通过 Storage 进行异步通信。

3.1 模块通信图
代码段

graph TD
User[用户操作] --> Popup[Popup UI (React)]
Popup -- write --> Storage[Chrome Storage (is_active)]

    Storage -- watch --> Background[Background Service Worker]
    Background -- update --> BrowserAction[扩展图标 Badge (👁️)]

    Storage -- watch --> ContentScript[Content Script Orchestrator]

    ContentScript --> Strategy{Site Strategy Selector}
    Strategy --> SuiScan[SuiScan Module]
    Strategy --> SuiVision[SuiVision Module]
    Strategy --> Polymedia[Polymedia Module]

    SuiScan -- DOM Injection --> Page[当前网页]

3.2 目录结构规范
popup/: 扩展弹窗 UI，负责开关控制、国际化展示。

background/: 后台服务，负责浏览器级别的状态反馈（Badge）。

contents/: 核心业务逻辑。

index.js: 指挥官。负责生命周期管理、防抖、路由分发。

[site].js: 执行者。针对特定网站的独立逻辑模块（策略模式）。

4. 详细功能设计 (Detailed Specifications)
   4.1 指挥中心 (Popup)
   文件: popup/index.jsx

功能:

全局开关: 控制 is_active 状态，持久化存储。

环境感知: 检测当前 Tab 是否在支持列表中。如果不在，显示“不支持当前网站”。

国际化 (i18n): 根据 navigator.language 自动切换中/英文。

交互: 状态切换时的平滑过渡动画（Transition）。

4.2 全局守卫 (Background)
文件: background/index.js

功能:

视觉反馈: 当监控开启且用户处于支持的网站时，扩展图标显示 👁️ Badge 和蓝色背景。

性能优化: 仅监听特定的 URL Pattern，避免无效唤醒。

4.3 核心引擎 (Content Scripts) - 重点
这是项目最复杂的部分，采用了 策略模式 (Strategy Pattern) 和 观察者模式。

A. 调度器 (contents/index.js)
职责:

单例模式: 维护唯一的 Storage 和 MutationObserver 实例。

防抖 (Debounce): 监听 DOM 变化（300ms 延迟），处理 SPA 动态加载。

生命周期:

Start: 注入样式，启动 Observer。

Stop: 清理所有 DOM 标记，断开 Observer，释放内存。

路由分发: 根据 window.location.hostname 动态加载对应的子模块。

B. 站点策略模块 (suiscan.js, suivision.js, polymedia.js)
接口规范: 每个模块必须导出 injectStyles() 和 removeStyles()。

内存管理: 使用 Set 记录 modifiedElements。在移除样式时，必须校验 document.body.contains(el)，防止内存泄漏。

视觉规范:

SuiScan: 🔵 蓝色主题 (#4c82fb)

SuiVision: 🟢 绿色主题 (#22c55e)

Polymedia: 🟡 黄色主题 (#fbbf24)

5. 核心算法与逻辑规范
   5.1 地址识别算法 (Address Detection)
   由于不同网站的显示方式不同，需支持多种匹配模式：

Strict Mode: 标准 64 位 Hex (0x[a-f0-9]{64}).

Abbreviation Mode: 省略号格式 (0x123...abc).

Context Check: 优先检查 href 属性（通常包含完整地址），其次检查 innerText。

Exclusion: 必须通过正则区分 Transaction Digest（类似地址但非地址）和 Package ID。

5.2 性能与防抖
MutationObserver: 监听 childList 和 subtree。

Debounce: 必须确保高频 DOM 更新（如滚动列表加载）不会触发连续的重绘，强制合并为一次执行。

6. 待开发特性 (Roadmap for AI Assistant)
   以下是接下来需要 AI 辅助编写的重点功能：

本地白名单系统 (Local Whitelist):

创建 constants.js，硬编码 Sui 官方系统合约（如 0x1, 0x2, 0x3）。

在注入逻辑中优先比对白名单，给予特殊认证标记（✅ 而非 🛡️）。

类型推断逻辑 (Type Inference):

通过 URL 结构（如 /package/ vs /account/）或 API 响应，区分 智能合约 和 普通钱包。

为合约应用不同的图标（📜）和样式（如虚线边框）。

假币/高危识别 (Risk Detection - Local):

识别著名的“钓鱼特征”（如与用户钱包极度相似的地址）。

识别伪装成官方代币的假 Object ID。

7. 给 AI 助手的提示词 (Prompt Context)
   Instructions for Claude/Copilot:

You are working on the SuiTruth browser extension project.

Context: The project uses Plasmo with React for the Popup and vanilla JS for Content Scripts.

Architecture: Content scripts follow a Strategy Pattern. contents/index.js is the orchestrator, and site-specific logic resides in separate modules (e.g., suiscan.js).

Constraint 1: strictly avoid using heavy libraries in Content Scripts to maintain performance on older hardware.

Constraint 2: Always handle memory cleanup. When removing styles, ensure elements still exist in the DOM before accessing them.

Constraint 3: Use chrome.storage.local (via Plasmo hook) for state synchronization.

Current task is to improve the address detection logic to support "Address Abbreviations" (e.g., 0x123...456) and distinguish between Contracts and Wallets.

🎨 附：UI 视觉指南
Badges:

🛡️ (Shield): 普通地址/安全未知

✅ (Check): 官方认证/系统合约

📜 (Scroll): 智能合约 Package

🚫 (Stop): 风险/黑名单地址
