# Mega Drive 跨端存档 `FCMDSV02`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封。它只承载核心返回的
pointer-free `fcmegadrive-state-v1` 状态和可选卡带存储，不包含路径、标题或宿主对象。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCMDSV02` |
| 8 | u32be | 格式版本 `2` |
| 12 | u8 | 地区：J/U/E = 1/2/3 |
| 13–14 | 2×u8 | P1/P2：3 键/6 键 = 1/2 |
| 15 | u8 | 无/SRAM/EEPROM = 0/1/2 |
| 16–21 | 3×u16be | ROM identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与持久介质长度 |

随后依次写入 `v1:megaDrive:<ROM SHA-256>`、64 位小写十六进制硬件 fingerprint、
`fcmegadrive-state-v1`、核心状态、可选持久介质；末尾追加前述全部字节的 32 字节 SHA-256。
状态上限 16 MiB，持久介质上限 64 KiB。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256：

```text
md7|<japan|usa|europe>|<P1 kind>,<P2 kind>|<exact EEPROM board or linear-or-header-sram>
```

加载必须同时匹配 ROM identity、fingerprint、地区、两个手柄协议、核心 revision 与持久介质
种类。即时状态恢复后要重新覆盖最新的独立卡带存储，避免历史 checkpoint 回滚 SRAM/EEPROM。
服务端只在认证的 `/api/saves/megaDrive/<ROM SHA-256>` 保存该信封；它不得进入公开
`/library/`、ROM 包或封面缓存。

跨端固定向量（ROM SHA-256
`84e04012e49bfa275c60f581e8f0cdad3c7613c9227b1f9c7f74562b9b548ca3`、USA、P1 3 键、
P2 6 键、无持久介质、状态 `01 02 03`）由 Swift 与 JVM 测试共同锁定：

```text
RkNNRFNWMDIAAAACAgECAABNAEAAFAAAAAAAAwAAAAB2MTptZWdhRHJpdmU6ODRlMDQwMTJlNDliZmEyNzVjNjBmNTgxZThmMGNkYWQzYzc2MTNjOTIyN2IxZjljN2Y3NDU2MmI5YjU0OGNhMzEyMzkwNDZhNTkzOTQxNjM1MDMzMjViYzcxYWZiYjA2ZTVhYzU4MWExY2I5ZGM0ZTVkZDhkNDM1ZWEyMzA2NTZmY21lZ2Fkcml2ZS1zdGF0ZS12MQECA/NsaP7EQIECwVHrIq8okd6zvEBubYPC8SuZfmAoP46a
```
