🔌 SuiTruth Service Layer Interface Design (SuiService)1. 概述 (Overview)SuiService 是扩展程序内部的单例服务模块，负责处理所有与 Sui 区块链网络的交互。它封装了底层的 JSON-RPC 调用，为 UI 层（Popup 和 Content Scripts）提供语义化的数据接口。核心职责 RPC 封装: 统一管理向 fullnode.mainnet.sui.io 的请求。类型识别: 区分地址是 Account（用户钱包）、Package（合约）还是 Object（资产对象）。真伪验证: 对比本地白名单，识别官方资产与假冒资产。缓存策略: 简单的内存缓存，避免重复请求同一地址导致 RPC 限流。2. 基础配置 (Configuration)Network: Sui MainnetRPC Endpoint: https://fullnode.mainnet.sui.io:443Protocol: JSON-RPC 2.0Content-Type: application/json3. 数据模型定义 (Data Models)3.1 枚举：地址类型 (AddressType)用于前端决定显示什么图标（🛡️, 📜, 📦）。TypeScripttype AddressType =
| 'ACCOUNT' // 普通钱包
| 'PACKAGE' // 智能合约包
| 'OBJECT' // NFT 或 Token 对象
| 'UNKNOWN'; // 未知/无效
3.2 枚举：安全等级 (RiskLevel)用于前端决定 Badge 的颜色（绿/黄/红）。TypeScripttype RiskLevel =
| 'SAFE' // 官方认证/白名单 (✅ 绿色)
| 'NEUTRAL' // 普通未知地址 (🛡️ 默认色)
| 'SUSPICIOUS'// 疑似风险 (⚠️ 黄色)
| 'DANGER'; // 确认恶意 (🚫 红色)
3.3 响应对象：地址详情 (AddressProfile)UI 层渲染所需的核心数据结构。TypeScriptinterface AddressProfile {
address: string; // 0x...
type: AddressType; // 类型
riskLevel: RiskLevel; // 风险等级
label?: string; // 标签 (例如 "Official USDC")
isContract?: boolean; // 是否为合约
} 4. 接口定义 (Methods)4.1 核心方法：获取地址画像这是主功能，suiscan.js 等模块将调用此方法来决定如何染色。Method Name: getAddressProfile(address: string)Returns: Promise<AddressProfile>Logic Flow:检查 Local Whitelist (如果是白名单地址，直接返回 SAFE)。检查 Local Cache (如果已查询过，返回缓存结果)。发起 RPC 请求 (sui_getObject)。如果返回 error.code: notExists -> 判定为 ACCOUNT (新钱包通常没有 Object 记录，或者是纯地址)。如果返回 data.type == 'package' -> 判定为 PACKAGE。其他 -> 判定为 OBJECT。返回结果并写入缓存。4.2 辅助方法：批量获取画像 (优化性能)用于一次性处理页面上出现的几十个地址。Method Name: batchGetProfiles(addresses: string[])Returns: Promise<Map<string, AddressProfile>>Implementation: 使用 sui_multiGetObjects RPC 方法，大幅减少网络请求次数。5. RPC 调用规范 (RPC Specs)SuiService 内部需要构建的原始 RPC Payload 示例。5.1 检查对象类型 (Check Object/Package)RPC Method: sui_getObjectPayload:JSON{
"jsonrpc": "2.0",
"id": 1,
"method": "sui_getObject",
"params": [
"0x...", // 目标地址
{
"showType": true,
"showOwner": true
}
]
}
5.2 检查地址是否活跃 (Check Account Activity)RPC Method: suix_queryTransactionBlocksPayload:JSON{
"jsonrpc": "2.0",
"id": 1,
"method": "suix_queryTransactionBlocks",
"params": [
{
"filter": { "FromAddress": "0x..." },
"limit": 1
}
]
} 6. 本地白名单数据 (Static Data / Hardcoded Truth)为了不依赖后端，我们需要在 services/constants.js 中维护一份“真理列表”。6.1 官方系统合约 (System Packages)AddressNameDescription0x1Move StdlibMove 语言标准库 0x2Sui FrameworkSUI 核心逻辑 0x3Sui System 验证节点逻辑 0xdee9DeepBook 官方流动性层 6.2 核心资产 (Official Assets)用于防伪检测。如果一个 Object 的 Type 包含 Coin 但不在这个列表里，却叫 "USDC"，那就是假币。JavaScriptexport const OFFICIAL_COINS = {
"SUI": "0x2::sui::SUI",
"USDC": "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
"USDT": "0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06::coin::COIN",
"CETUS": "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"
}; 7. 序列图 (Sequence Diagram)代码段 sequenceDiagram
participant Page as SuiScan Page (DOM)
participant Content as Content Script
participant Service as SuiService
participant RPC as Sui Mainnet RPC

    Page->>Content: User scrolls / Mutation detected
    Content->>Content: Extract Address "0x123...abc"

    Content->>Service: getAddressProfile("0x123...abc")

    alt is cached
        Service-->>Content: Return { type: "ACCOUNT", risk: "NEUTRAL" }
    else is new
        Service->>RPC: sui_getObject("0x123...abc")
        RPC-->>Service: { error: "notExists" } (Implies Account)
        Service->>Service: Save to Cache
        Service-->>Content: Return { type: "ACCOUNT", risk: "NEUTRAL" }
    end

    Content->>Page: Inject 🛡️ Badge

8. 错误处理策略 (Error Handling)网络超时: 设置 fetch 超时时间为 3000ms。如果超时，返回默认的 NEUTRAL 状态（不展示错误，只展示默认盾牌），以免干扰用户体验。RPC 限流 (429): 如果收到 429 错误，启用“熔断机制”，在接下来 60 秒内不再发起请求，全部返回默认状态。给 AI 助手的 Prompt 建议"I need you to implement the services/suiService.js based on this design document. It should be a standalone module that exports getAddressProfile. Please include the hardcoded OFFICIAL_COINS constant and handle the JSON-RPC fetching logic using the native fetch API. Do not use any external SDKs to keep the extension lightweight."
