# PlayStation 跨端存档 `FCPSSV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封，结构沿用 `GBA_SAVE_V1.md`。它只承载
核心返回的状态（`fcps1-state-v1`）和可选的 1 号卡槽记忆卡，不包含路径、标题、宿主对象、BIOS 或光盘。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCPSSV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：PlayStation = 1 |
| 13 | u8 | 型号：`playstation` = 1 |
| 14 | u8 | 光盘地区：`usa`/`japan`/`europe` = 1/2/3 |
| 15 | u8 | 必须为 0 |
| 16–21 | 3×u16be | 光盘 identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与记忆卡长度 |

随后依次写入 `v1:playStation:<光盘包 SHA-256>`（`PS1_DISC_PACKAGE_V1.md` 的 `.fcps1` 整个文件）、64 位
小写十六进制硬件 fingerprint、`fcps1-state-v1`、核心状态、可选记忆卡；末尾追加前述全部字节的 32 字节
SHA-256。状态上限 8 MiB（当前核心约 4.5 MB）；记忆卡长度只能是 0 或 131072（128 KiB 原始镜像，
即 `.mcr` 布局）。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256（不含 BIOS：换了同区的另一份 BIOS，信封仍可解开、记忆卡
照常使用，只是核心拒绝该即时状态，客户端从头启动）：

```text
ps1v1|playStation|playstation|<usa|japan|europe>
```

加载必须同时匹配光盘 identity、fingerprint、主机、型号、地区与核心 revision。核心状态只能被同一构建的
核心读取，并且核心自己核对状态里记下的 BIOS 与光盘指纹，不符即拒绝（客户端提示后从头启动，而不是崩溃）。
只有游戏自己写过记忆卡（宿主恢复不算）才算持久介质：信封里没有记忆卡就表示这局游戏从没存过档，客户端
不得为它落一个空卡文件。即时状态恢复后要重新覆盖最新的独立记忆卡，避免历史 checkpoint 回滚游戏存档。
服务端只在认证的 `/api/saves/playStation/<光盘包 SHA-256>` 保存该信封；它不得进入公开 `/library/`、
光盘包或封面缓存。

客户端本地另存记忆卡文件（持久化种类 `ps1-memory-card` slot 0，131072 字节）。

跨端固定向量（光盘包 SHA-256 `7695ddb80b43301d0930cada8b948d8460ecd27202ce31dc31bbde49bdea39dd`，即
`PS1_DISC_PACKAGE_V1.md` 的固定向量包；地区 `usa`；无记忆卡；状态 `01 02 03`）由 Swift 与 JVM 测试共同
锁定，fingerprint 为 `bb4dfc0c8e9ca2bca5a47993e4666ab35d5b6e2d99927a8bdf3008d77589f0a7`：

```text
RkNQU1NWMDEAAAABAQEBAABPAEAADgAAAAAAAwAAAAB2MTpwbGF5U3RhdGlvbjo3Njk1ZGRiODBiNDMzMDFkMDkzMGNhZGE4Yjk0OGQ4NDYwZWNkMjcyMDJjZTMxZGMzMWJiZGU0OWJkZWEzOWRkYmI0ZGZjMGM4ZTljYTJiY2E1YTQ3OTkzZTQ2NjZhYjM1ZDViNmUyZDk5OTI3YThiZGYzMDA4ZDc3NTg5ZjBhN2ZjcHMxLXN0YXRlLXYxAQIDbi+7wlV/cQs6gorZlfurR87145QC2FPJlXxV8Gzudds=
```

向量由独立于客户端代码的脚本按本文档算出。
