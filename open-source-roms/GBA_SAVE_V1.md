# Game Boy Advance 跨端存档 `FCGASV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封，结构沿用 `GAME_BOY_SAVE_V1.md`。它只承载
核心返回的状态（`fcgba-state-v1`）和可选的卡带存档，不包含路径、标题、宿主对象或 BIOS。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCGASV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：Game Boy Advance = 1 |
| 13 | u8 | 型号：`game-boy-advance` = 1 |
| 14 | u8 | 存档芯片（清单板卡）：`none`/`sram`/`flash64`/`flash128`/`eeprom` = 0/1/2/3/4 |
| 15 | u8 | 卡带存档是否带时钟块：0/1 |
| 16–21 | 3×u16be | ROM identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与卡带存档长度 |

随后依次写入 `v1:gameBoyAdvance:<ROM SHA-256>`、64 位小写十六进制硬件 fingerprint、
`fcgba-state-v1`、核心状态、可选卡带存档；末尾追加前述全部字节的 32 字节 SHA-256。状态上限
2 MiB（当前核心约 1 MB）；卡带存档就是 mGBA 通用 `.sav` 的布局——芯片内容（SRAM 32 KiB、Flash
64/128 KiB、EEPROM 512 字节或 8 KiB），带时钟的卡带后接 16 字节时钟块（7 个 BCD 日期时间寄存器、
状态字节、写入时的 64 位本地墙钟秒数，小端），上限 128 KiB + 16。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256：

```text
gba1|gameBoyAdvance|game-boy-advance|<none|sram|flash64|flash128|eeprom>
```

加载必须同时匹配 ROM identity、fingerprint、主机、型号、存档芯片、核心 revision，以及卡带存档的
大小（`eeprom` 板 512 或 8192 字节，其余等于芯片容量）和有无时钟。核心状态只能被同一构建的核心读取
（布局随核心版本变化时核心会拒绝，客户端提示存档不兼容而不是崩溃）。只有游戏自己写过存档芯片或设置过
时钟（宿主恢复不算）才算持久介质：信封里没有卡带存档就表示这局游戏从没存过档，客户端不得为它落一个
全 `$ff` 文件。即时状态恢复后要重新覆盖最新的独立卡带存档，避免历史 checkpoint 回滚游戏存档；恢复
时钟块会按块内时间补到宿主当前的本地时间。服务端只在认证的 `/api/saves/gameBoyAdvance/<ROM SHA-256>`
保存该信封；它不得进入公开 `/library/`、ROM 包或封面缓存。

客户端本地另存两份独立文件（持久化种类 `gba-backup` slot 0、`gba-rtc` slot 1）；有时钟的卡带缺一半
即视为没有卡带存档。

跨端固定向量（ROM SHA-256
`48cdee265176723f746d553847952a9038052d0672fa2e4b2460be3d1d0cddc9`、`none` 板、无卡带存档、状态
`01 02 03`）由 Swift 与 JVM 测试共同锁定，fingerprint 为
`581443ae86a5a13ab01846af648d0bcf2abc834394987a245360347aa193cf84`：

```text
RkNHQVNWMDEAAAABAQEAAABSAEAADgAAAAAAAwAAAAB2MTpnYW1lQm95QWR2YW5jZTo0OGNkZWUyNjUxNzY3MjNmNzQ2ZDU1Mzg0Nzk1MmE5MDM4MDUyZDA2NzJmYTJlNGIyNDYwYmUzZDFkMGNkZGM5NTgxNDQzYWU4NmE1YTEzYWIwMTg0NmFmNjQ4ZDBiY2YyYWJjODM0Mzk0OTg3YTI0NTM2MDM0N2FhMTkzY2Y4NGZjZ2JhLXN0YXRlLXYxAQIDoMup+jDePHTcdQoFT6gqqn4lsxFqaSZcUpWJJd/WEMs=
```

该 ROM 是测试夹具：512 字节全零，只有卡带头——`$00a0` 起 ASCII `GBA FIXTURE`、`$00ac` 为 `AFXE`、
`$00b0` 为 `01`、`$00b2` 为 `$96`、`$00bd` 是头校验和（`$a0–$bc` 字节之和取负再减 `$19`）。
向量由独立于客户端代码的脚本按本文档算出。
