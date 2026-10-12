# Mega CD 跨端存档 `FCMCSV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封，结构照搬 `PS1_SAVE_V1.md`，只是魔数、
标识和持久介质不同。它只承载核心返回的状态（`fcmegacd-state-v1`）和可选的 8 KiB 备份 RAM，不包含路径、
标题、宿主对象、BIOS 或光盘。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCMCSV01` |
| 8 | u32be | 格式版本 `1` |
| 12 | u8 | 主机：Mega CD = 1 |
| 13 | u8 | 型号：`sega-mega-cd` = 1 |
| 14 | u8 | 光盘地区：`usa`/`japan`/`europe` = 1/2/3 |
| 15 | u8 | 必须为 0 |
| 16–21 | 3×u16be | 光盘 identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态与备份 RAM 长度 |

随后依次写入 `v1:megaCD:<光盘包 SHA-256>`（`MEGA_CD_DISC_PACKAGE_V1.md` 的 `.fcmcd` 整个文件）、64 位
小写十六进制硬件 fingerprint、`fcmegacd-state-v1`、核心状态、可选备份 RAM；末尾追加前述全部字节的 32 字节
SHA-256。状态上限 16 MiB（当前核心约 3.5 MB：Mega Drive 状态后接 `FCMCDST1` 块）；备份 RAM 长度只能是
0 或 8192（主机内置备份 RAM 的原始镜像，末 64 字节是 `SEGA_CD_ROM` / `RAM_CARTRIDGE` 格式化块）。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256（不含 BIOS：换了同区的另一份 BIOS，信封仍可解开、备份 RAM
照常使用，只是核心拒绝该即时状态，客户端从头启动）：

```text
mcdv1|megaCD|sega-mega-cd|<usa|japan|europe>
```

加载必须同时匹配光盘 identity、fingerprint、主机、型号、地区与核心 revision。核心状态只能被同一构建的
核心读取，并且核心自己核对状态里记下的 BIOS（CRC32）与光盘轨道布局，不符即拒绝（客户端提示后从头启动，而不是崩溃）。
只有游戏自己改写过备份 RAM（新机格式化与宿主恢复都不算）才算持久介质：信封里没有备份 RAM 就表示这局
游戏从没存过档，客户端不得为它落一个文件。即时状态恢复后要重新覆盖最新的独立备份 RAM，避免历史
checkpoint 回滚游戏存档。服务端只在认证的 `/api/saves/megaCD/<光盘包 SHA-256>` 保存该信封；它不得进入
公开 `/library/`、光盘包或封面缓存。

客户端本地另存备份 RAM 文件（持久化种类 `mega-cd-backup-ram` slot 0，8192 字节）。

跨端固定向量（光盘包 SHA-256 `60a56dfb97a56255daabc0f27a319ec5ba15f4a3ab1a093aff74e341748ca554`，即
`MEGA_CD_DISC_PACKAGE_V1.md` 的固定向量包；地区 `usa`；无备份 RAM；状态 `01 02 03`）由 Swift 与 JVM 测试
共同锁定，fingerprint 为 `d6918ebb98857855254fb45b2adbfa0b6d002f662247a758d08f5fb6a199673f`：

```text
RkNNQ1NWMDEAAAABAQEBAABKAEAAEQAAAAAAAwAAAAB2MTptZWdhQ0Q6NjBhNTZkZmI5N2E1NjI1NWRhYWJjMGYyN2EzMTllYzViYTE1ZjRhM2FiMWEwOTNhZmY3NGUzNDE3NDhjYTU1NGQ2OTE4ZWJiOTg4NTc4NTUyNTRmYjQ1YjJhZGJmYTBiNmQwMDJmNjYyMjQ3YTc1OGQwOGY1ZmI2YTE5OTY3M2ZmY21lZ2FjZC1zdGF0ZS12MQECA9vaN5+XD6h6pQwOL5Wq/P8R3MCw+NpCvmoHhhAqAFzR
```

向量由独立于客户端代码的脚本按本文档算出。
