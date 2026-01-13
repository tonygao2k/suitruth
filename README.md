# 🛡️ SuiTruth

**Identify the Real, Expose the Shadow.**

Sui 生态首个基于"谱系追踪"与"语义指纹"技术的去中心化身份安全层。

---

## 📖 背景与痛点 (The Problem)

在 Sui 区块链独特的架构下，用户面临着前所未有的**"身份迷雾"**：

- **Package 不可变性带来的 ID 膨胀**：Sui 合约一旦部署不可修改，协议升级必须产生新的 Package ID。一个长期运营的项目（如 NAVI 或 Scallop）可能拥有数十个均带有"官方认证"的历史 ID，用户无法分辨哪个是当前活跃的"正统版本"。

- **影子合约 (Shadow Contracts)**：黑客利用 `sui_getNormalizedMovePackage` 抓取官方字节码并重新部署。这些合约拥有与官方完全一致的函数签名（如 `lending::borrow`），极易诱导用户进行授权交互。

- **浏览器认证的滞后性**：主流浏览器仅验证源码一致性，无法实时标记该 ID 是否已被废弃或是否存在逻辑陷阱。

SuiTruth 旨在建立一个**动态的信任谱系 (Trust Lineage)**，在用户交互的第一现场（浏览器/钱包）还原真相。

---

## ⚡️ 核心架构 (Architecture)

SuiTruth 采用 **Monorepo 架构**，前端通过 Chrome Extension API 注入页面，后端利用 Firebase 实现无服务器的高性能数据分发。

### 1. 客户端 (Chrome Extension)

- **技术栈**: React 18, Vite, TailwindCSS, Manifest V3
- **功能**:
  - **DOM 哨兵**: 实时扫描 SuiScan, SuiVision, Polymedia 等页面的 `0x...` 字符串
  - **交互拦截**: 解析可编程交易块 (PTB)，在签名弹窗前进行风险模拟

### 2. 真相引擎 (The Truth Engine)

- **技术栈**: Firebase (Firestore + Cloud Functions), @mysten/sui
- **核心逻辑**:
  - **Canonical Mapping**: 维护各协议"当前唯一推荐 ID"的映射表
  - **Fingerprint Matcher**: 对陌生 ID 进行字节码比对。如果代码相似度 >95% 但不在白名单，判定为"高仿影子"

---

## 🛠️ 安装与开发 (Development)

本项目包含两个核心模块：**chrome-extension** (插件本体) 和 **backend** (云端逻辑)。

### 环境要求

- Node.js >= 18
- npm 或 pnpm

### 1. 克隆项目

```bash
git clone https://github.com/your-username/suitruth.git
cd suitruth
```

### 2. 安装插件依赖

```bash
cd chrome-extension
npm install
```

### 3. 配置 Firebase

在 `chrome-extension/src/firebase/config.js` 中填入你的项目配置：

```javascript
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'suitruth-app.firebaseapp.com',
  projectId: 'suitruth-app',
  storageBucket: 'suitruth-app.appspot.com',
  messagingSenderId: '...',
  appId: '...',
};
```

### 4. 启动开发模式 (Hot Reload)

```bash
npm run dev
```

然后：

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角 **Developer mode**
3. 点击 **Load unpacked**，选择 `suitruth/chrome-extension/dist` 文件夹

---

## 🚥 状态定义 (Status Definitions)

SuiTruth 将链上实体分为三个安全等级：

| 标识 | 状态                 | 含义                               | 示例场景                      |
| ---- | -------------------- | ---------------------------------- | ----------------------------- |
| ✅   | **Canonical** (正统) | 官方当前维护的唯一活跃版本         | NAVI Protocol V3 (Latest)     |
| ⏳   | **Legacy** (历史)    | 官方部署但已废弃/过期的版本        | NAVI Protocol V1 (Deprecated) |
| 🚨   | **Shadow** (影子)    | 代码高度相似但非官方部署，极大风险 | Fake NAVI (Phishing)          |

---

## 🗺️ 路线图 (Roadmap)

- [x] **Phase 1: 原型验证** (Current)

  - 完成 React + Vite + Firebase 架构搭建
  - 实现 SuiScan 页面基础 ID 识别与染色

- [ ] **Phase 2: 数据增强**

  - 建立 Top 50 Sui 协议的指纹库
  - 引入"社区举报"功能，允许用户提交可疑地址

- [ ] **Phase 3: 生态集成**
  - 开放 API 供钱包 (Wallet) 调用
  - 申请 Sui Foundation Grant

---

## 🤝 贡献 (Contributing)

SuiTruth 致力于成为**公共产品 (Public Good)**。我们欢迎开发者提交 PR，特别是增加新的协议指纹数据。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 许可证 (License)

Distributed under the MIT License. See `LICENSE` for more information.
