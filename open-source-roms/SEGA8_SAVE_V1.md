# Master System / Game Gear 跨端存档 `FCS8SV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封。它只承载核心返回的
pointer-free `fcsms-state-v1` 状态和可选卡带 RAM，不包含路径、标题或宿主对象。两台主机
共用一个信封：哪台主机、哪个型号由头部字段写死，不由文件名或标题推断。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCS8SV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：Master System / Game Gear = 1/2 |
| 13 | u8 | 型号：`sega-master-system`/`-2`/`sega-mark-iii`/`sega-game-gear` = 1/2/3/4 |
| 14 | u8 | 地区：J/U/E = 1/2/3（Game Gear 没有 3） |
| 15 | u8 | mapper：`cartridge`（核心自检）/`sega`/`codemasters`/`korean` = 0/1/2/3 |
| 16–21 | 3×u16be | ROM identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与卡带 RAM 长度 |

随后依次写入 `v1:<masterSystem|gameGear>:<ROM SHA-256>`、64 位小写十六进制硬件
fingerprint、`fcsms-state-v1`、核心状态、可选卡带 RAM；末尾追加前述全部字节的 32 字节
SHA-256。状态上限 4 MiB，卡带 RAM 为 32 KiB（Codemasters 板 64 KiB），上限 64 KiB。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256：

```text
sms7|<masterSystem|gameGear>|<sega-master-system|sega-master-system-2|sega-mark-iii|sega-game-gear>|<japan|usa|europe>|<cartridge|sega|codemasters|korean>
```

加载必须同时匹配 ROM identity、fingerprint、主机、型号、地区、mapper 与核心 revision。
每张卡带都有 RAM，但只有游戏自己写过它（宿主恢复不算）才算持久介质：信封里没有
卡带 RAM 就表示这局游戏从没存过档，客户端不得为它落一个全零文件。即时状态恢复后要
重新覆盖最新的独立卡带 RAM，避免历史 checkpoint 回滚游戏存档。服务端只在认证的
`/api/saves/<masterSystem|gameGear>/<ROM SHA-256>` 保存该信封；它不得进入公开
`/library/`、ROM 包或封面缓存。

同一份 ROM 字节以 `.sms` 和 `.gg` 两种身份进资料库时 identity 不同（主机名在前缀里），
存档互不串。

跨端固定向量（ROM SHA-256
`9f32fc164a34aa2bc53600a6991a37d82b3b99e58c936e26ba20790c4898271b`、Master System、
`sega-master-system-2`、USA、`sega` mapper、无卡带 RAM、状态 `01 02 03`）由 Swift 与
JVM 测试共同锁定，fingerprint 为
`20d7910c5c0bd3c3f4a17dffb023a78963b04afc61fb29a5aef3aa3902f69a86`：

```text
RkNTOFNWMDEAAAABAQICAQBQAEAADgAAAAAAAwAAAAB2MTptYXN0ZXJTeXN0ZW06OWYzMmZjMTY0YTM0YWEyYmM1MzYwMGE2OTkxYTM3ZDgyYjNiOTllNThjOTM2ZTI2YmEyMDc5MGM0ODk4MjcxYjIwZDc5MTBjNWMwYmQzYzNmNGExN2RmZmIwMjNhNzg5NjNiMDRhZmM2MWZiMjlhNWFlZjNhYTM5MDJmNjlhODZmY3Ntcy1zdGF0ZS12MQECA5FZpZLjFb0D77wh/a+GP+D9sC+MWQjTQu7rVVqeikB0
```

该 ROM 是测试夹具：32 KiB，`$7ff0` 处 `TMR SEGA`，`$7fff` 为 `$40`，开头为
`F3 ED 56 31 F0 DF 18 FE`（`di; im 1; ld sp,$dff0; jr $`），其余全零。
