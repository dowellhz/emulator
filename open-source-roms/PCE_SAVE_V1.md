# PC Engine 跨端存档 `FCPCSV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封，结构照搬 `MEGA_CD_SAVE_V1.md`，只是魔数、标识、
头部第 13/14 字节与持久介质不同。它只承载核心返回的状态（`fcpce-state-v3`）和可选的 2 KiB 备份 RAM，不包含路径、
标题、宿主对象或 HuCard 本身。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCPCSV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：HuCard（`pcEngine`）= 1，CD-ROM² 光盘（`pcEngineCD`）= 2 |
| 13 | u8 | 型号：`pc-engine`（日版卡）= 1、`turbografx-16`（美版卡）= 2 |
| 14 | u8 | 卡带板：`pce-hucard`/`pce-sf2`/`pce-populous`/`pce-cd-disc` = 1/2/3/4（光盘只用 4，卡带不用 4） |
| 15 | u8 | 必须为 0 |
| 16–21 | 3×u16be | 卡带 identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与备份 RAM 长度 |

随后依次写入 `v1:pcEngine:<HuCard 文件 SHA-256>`（`.pce` 整个文件，含拷贝机头时连机头），光盘则为
`v1:pcEngineCD:<光盘包 SHA-256>`（`PCE_CD_DISC_PACKAGE_V1.md` 的 `.fcpcecd` 整个文件）、64 位小写十六进制硬件
fingerprint、`fcpce-state-v3`、核心状态、可选备份 RAM；末尾追加前述全部字节的 32 字节 SHA-256。状态上限 1 MiB
（当前核心约 450 KiB：含 CD 单元的 ADPCM RAM 与 Super System Card 的 192 KiB）；备份 RAM 长度只能是 0 或 2048。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256：

```text
pcev1|pcEngine|<pc-engine|turbografx-16>|<japan|usa>|<pce-hucard|pce-sf2|pce-populous>
pcev1|pcEngineCD|<pc-engine|turbografx-16>|<japan|usa>|pce-cd-disc
```

光盘的型号与地区是所用 System Card 的（日版卡即 PC Engine，美版卡即 TurboGrafx-16）；System Card 本身不进 fingerprint：
换一张同区的卡，信封仍可解开、备份 RAM 照用，只是核心按卡的 CRC 拒绝该即时状态，客户端从头启动。

主机由卡的身份决定（`PORTABLE_MANIFEST_V2.md`：MAME `hash/tg16.xml` 里的是美版卡），不由镜像是否按位倒序决定。
加载必须同时匹配卡带 identity、fingerprint、主机、型号、卡带板、地区与核心 revision。核心状态只能被同一构建的核心读取，
不符即拒绝（客户端从头启动，而不是崩溃）。只有游戏自己改写过备份 RAM（新机格式化与宿主恢复都不算）才算持久介质：
信封里没有备份 RAM 就表示这局游戏从没存过档，客户端不得为它落一个文件。即时状态恢复后要重新覆盖最新的独立备份 RAM，
避免历史 checkpoint 回滚游戏存档。服务端只在认证的 `/api/saves/pcEngine/<HuCard SHA-256>` 保存该信封；它不得进入公开
`/library/` 或封面缓存。

客户端本地另存备份 RAM 文件（持久化种类 `pce-backup-ram` slot 0，2048 字节）。

跨端固定向量：HuCard 为 8192 字节，第 i 字节是 i mod 256，但 $1FFE/$1FFF 为 `00 E0`（复位向量 $E000），SHA-256
`3fc4bf5865ac447f5b29eed85079e32d73b54f2aa8a44d427a71485bba06a67b`；日版卡、`pce-hucard`；无备份 RAM；状态 `01 02 03`。
fingerprint 为 `438a3bb5ada57160d102c038d0d5fa483f80b70070a03960d9738943573d901b`，信封（Base64）由 Swift 与 JVM 测试共同锁定：

```text
RkNQQ1NWMDEAAAABAQEBAABMAEAADgAAAAAAAwAAAAB2MTpwY0VuZ2luZTozZmM0YmY1ODY1YWM0NDdmNWIyOWVlZDg1MDc5ZTMyZDczYjU0ZjJhYThhNDRkNDI3YTcxNDg1YmJhMDZhNjdiNDM4YTNiYjVhZGE1NzE2MGQxMDJjMDM4ZDBkNWZhNDgzZjgwYjcwMDcwYTAzOTYwZDk3Mzg5NDM1NzNkOTAxYmZjcGNlLXN0YXRlLXYzAQID/+0LEWVjzeQ59O2vFYSUXfL9fZ5w4snYEgdaIc3P4HA=
```

光盘的跨端固定向量：光盘包为 `PCE_CD_DISC_PACKAGE_V1.md` 的固定向量包（SHA-256
`a09a6f2fd9d8945358e7b14ce71f33c3a4c4c28717bea46c29eea669578619df`），日版 System Card；无备份 RAM；状态 `01 02 03`。
fingerprint 为 `50e1440c421a7e275fed55c1a3ac244fb6bec4e12adf65b1e665c9c721e83c3c`：

```text
RkNQQ1NWMDEAAAABAgEEAABOAEAADgAAAAAAAwAAAAB2MTpwY0VuZ2luZUNEOmEwOWE2ZjJmZDlkODk0NTM1OGU3YjE0Y2U3MWYzM2MzYTRjNGMyODcxN2JlYTQ2YzI5ZWVhNjY5NTc4NjE5ZGY1MGUxNDQwYzQyMWE3ZTI3NWZlZDU1YzFhM2FjMjQ0ZmI2YmVjNGUxMmFkZjY1YjFlNjY1YzljNzIxZTgzYzNjZmNwY2Utc3RhdGUtdjMBAgOQRE2MSVnxl5876Nqqj5Z6lxZjkYeF8V/nSeC2VS5GHg==
```

向量由独立于客户端代码的脚本按本文档算出。
