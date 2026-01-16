📂 1. 核心技术标准 (The "Bible" for RPC & Data)
用途： 帮助 AI 准确编写 suiService.js 中的 JSON-RPC 请求，理解数据结构。

Sui JSON-RPC API Reference (官方文档)

核心关注点: sui_getObject (获取对象详情), sui_multiGetObjects (批量获取), suix_resolveNameServiceAddress (SuiNS 域名解析).

链接: Sui JSON-RPC Documentation

给 AI 的提示: "Focus on the Read API section. Learn how to parse the SuiObjectResponse structure to distinguish between a package and a coin."

Sui Framework (GitHub 源码)

核心关注点: 了解 0x1, 0x2 (Sui System), 0x3 下定义了哪些标准模块。特别是 coin.move 的结构。

链接: Sui Framework Source Code

给 AI 的提示: "Look at sui-framework to understand what the official system packages look like."

🛡️ 2. 安全与鉴别模式 (Security Patterns)
用途： 帮助 AI 理解什么是“官方认证”，什么是“潜在风险”。

OtterSec Audit Reports (Sui 生态顶级审计)

核心关注点: 看看那些通过审计的头部项目（如 Scallop, Navi, Cetus）的合约地址和结构。

链接: [OtterSec Audits](https://github.com/ OtterSec/audits)

给 AI 的提示: "Use this to understand that contracts audited by top firms like OtterSec are candidates for a 'Verified' badge."

Sui Token Standards (SIPs - Sui Improvement Proposals)

核心关注点: 只有符合标准的 Token 才是真资产。了解 CoinMetadata 对象是如何存储代币符号（Symbol）和名称的。

链接: Sui Improvement Proposals

📜 3. 官方/权威地址清单 (Hard Facts)
用途： 让 AI 帮你生成 constants.js 中的白名单，避免手动复制粘贴出错。

你可以把下面这段文本直接复制给 Claude，让它提取为常量：

Sui Mainnet Official Addresses Context:

Sui Framework: 0x0000000000000000000000000000000000000000000000000000000000000002

DeepBook (Official CLOB): 0xdee9 (shorthand for full address)

SuiNS (Name Service): 0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0

Wormhole (Bridge): 0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a

USDC (Native): 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC

USDT (Wormhole): 0xc060006111016b8a020ad5b338349841437adb20874067361659545ed8199e06::coin::COIN
