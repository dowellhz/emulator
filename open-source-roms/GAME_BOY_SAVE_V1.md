# Game Boy / Game Boy Color 跨端存档 `FCGBSV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封。它只承载核心返回的
pointer-free 状态（`fcgb-state-v1`）和可选的电池存档，不包含路径、标题或宿主对象。
两台主机共用一个信封：哪台主机、哪个型号、哪种卡带控制芯片由头部字段写死；主机由
卡带头 `$0143` 的 CGB 标志决定，不由文件名或扩展名推断。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCGBSV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：Game Boy / Game Boy Color = 1/2 |
| 13 | u8 | 型号：`game-boy-dmg`/`game-boy-pocket`/`game-boy-color` = 1/2/3 |
| 14 | u8 | 卡带控制芯片：`rom`/`mbc1`/`mbc2`/`mbc3`/`mbc5` = 0/1/2/3/5 |
| 15 | u8 | 电池存档是否带时钟块：0/1 |
| 16–21 | 3×u16be | ROM identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与电池存档长度 |

随后依次写入 `v1:<gameBoy|gameBoyColor>:<ROM SHA-256>`、64 位小写十六进制硬件
fingerprint、`fcgb-state-v1`、核心状态、可选电池存档；末尾追加前述全部字节的 32 字节
SHA-256。状态上限 1 MiB；电池存档就是通用 `.sav` 的布局——卡带 RAM（MBC2 为 512
字节，其余按卡带头 `$0149`），MBC3 时钟卡带后接 48 字节时钟块（五个 32 位实时寄存器、
五个锁存寄存器、64 位 UNIX 时间，与 VBA-M/BGB/SameBoy 相同），上限 128 KiB + 48。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256：

```text
gb1|<gameBoy|gameBoyColor>|<game-boy-dmg|game-boy-pocket|game-boy-color>|<rom|mbc1|mbc2|mbc3|mbc5>
```

加载必须同时匹配 ROM identity、fingerprint、主机、型号、控制芯片、核心 revision，以及
电池存档与卡带头的 RAM 大小和有无时钟。只有游戏自己写过电池 RAM 或设置过时钟（宿主
恢复不算）才算持久介质：信封里没有电池存档就表示这局游戏从没存过档，客户端不得为它
落一个全零文件。即时状态恢复后要重新覆盖最新的独立电池存档，避免历史 checkpoint 回滚
游戏存档；恢复时钟块会按块内 UNIX 时间补到宿主当前时间，游戏停表时不补。服务端只在认证的
`/api/saves/<gameBoy|gameBoyColor>/<ROM SHA-256>` 保存该信封；它不得进入公开
`/library/`、ROM 包或封面缓存。

客户端本地另存两份独立电池文件（持久化种类 `game-boy-ram` slot 0、`game-boy-rtc`
slot 1）；缺一半即视为没有电池存档。

跨端固定向量（ROM SHA-256
`c73a5e69672a9fe9a3ba01b5ebb2ffbf56bd25d2254ac1360a4a6b45ee50a4cb`、Game Boy、
`game-boy-dmg`、`rom` 控制芯片、无电池存档、状态 `01 02 03`）由 Swift 与 JVM 测试共同
锁定，fingerprint 为
`cf2b4a6da17b15371ae9698ecfe395ac6db862e4b910caffe80421bd6b708f80`：

```text
RkNHQlNWMDEAAAABAQEAAABLAEAADQAAAAAAAwAAAAB2MTpnYW1lQm95OmM3M2E1ZTY5NjcyYTlmZTlhM2JhMDFiNWViYjJmZmJmNTZiZDI1ZDIyNTRhYzEzNjBhNGE2YjQ1ZWU1MGE0Y2JjZjJiNGE2ZGExN2IxNTM3MWFlOTY5OGVjZmUzOTVhYzZkYjg2MmU0YjkxMGNhZmZlODA0MjFiZDZiNzA4ZjgwZmNnYi1zdGF0ZS12MQECA59Fa364KB/jVRloVs1wPLZ9HeCUug2M3WUui/AaSINc
```

该 ROM 是测试夹具：32 KiB；`$0101` 为 `C3 50 01`（`jp $0150`）；`$0104–$0133` 为
`$a5 ^ i`；`$0134` 起为 ASCII `GB FIXTURE`；`$0143`、`$0147`、`$0149` 为 0；`$014d` 是
头校验和；`$0150` 起为
`3E 0A EA 00 00 3E 00 EA 00 40 3E 5A EA 00 A0 3E 09 EA 00 40 3E 02 EA 00 A0 18 FE`；
其余全零。
