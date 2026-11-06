# PlayStation 跨端存档 `FCPSSV01`

Apple 与 Android 使用同一份大端、带 SHA-256 校验的存档信封，结构沿用 `GBA_SAVE_V1.md`。它只承载
核心返回的状态（`fcps1-state-v1`）和两张可选的独立记忆卡镜像，不包含路径、标题、宿主对象、BIOS 或光盘。
物理卡槽 1/2 对应索引 slot 0/1，每张卡各 128 KiB；不能合成一张 256 KiB 卡。

固定头共 32 字节：

| 偏移 | 类型 | 内容 |
| --- | --- | --- |
| 0 | 8 bytes | ASCII `FCPSSV01` |
| 8 | u32be | 格式版本 `1` 或 `2` |
| 12 | u8 | 主机：PlayStation = 1 |
| 13 | u8 | 型号：`playstation` = 1 |
| 14 | u8 | 光盘地区：`usa`/`japan`/`europe` = 1/2/3 |
| 15 | u8 | v1 必须为 0；v2 为镜像位图：bit 0 = 卡 1，bit 1 = 卡 2，其余必须为 0 |
| 16–21 | 3×u16be | 光盘 identity、硬件 fingerprint、核心 revision 的 UTF-8 长度 |
| 22 | u16be | 必须为 0 |
| 24–31 | 2×u32be | 核心状态长度、记忆卡镜像总长度 |

随后依次写入 `v1:playStation:<光盘包 SHA-256>`（`PS1_DISC_PACKAGE_V1.md` 的 `.fcps1` 整个文件）、64 位
小写十六进制硬件 fingerprint、`fcps1-state-v1`、核心状态、按 slot 0 → slot 1 顺序的可选卡镜像；末尾追加前述全部字节的 32 字节
SHA-256。状态上限 8 MiB（当前核心约 4.5 MB）。v1 记忆卡总长度只能是 0 或 131072，非空时属于卡 1；
v2 总长度必须等于位图置位数 × 131072（0、131072 或 262144）。每张仍是 128 KiB 原始 `.mcr` 镜像。
只含卡 2 时位图为 2，不得误放进卡 1。位图仅表示独立镜像是否携带，不表示物理卡是否插入。

硬件 fingerprint 是以下 UTF-8 文本的 SHA-256（不含 BIOS：换了同区的另一份 BIOS，信封仍可解开、记忆卡
照常使用，只是核心拒绝该即时状态，客户端从头启动）：

```text
ps1v1|playStation|playstation|<usa|japan|europe>
```

加载必须同时匹配光盘 identity、fingerprint、主机、型号、地区与核心 revision。核心状态只能被同一构建的
核心读取，并且核心自己核对状态里记下的 BIOS 与光盘指纹，不符即拒绝（客户端提示后从头启动，而不是崩溃）。
每个卡槽只有游戏写过或已载入现有镜像时才作为已存在的持久介质，不能因默认插入两张格式化空卡就制造两份空存档。
已有卡即使本局未写也继续携带。即时状态恢复后，对两个槽分别覆盖最新的独立记忆卡，避免历史 checkpoint 回滚任一卡的游戏存档；
客户端重新施加双卡插入策略，旧即时状态里空置的卡槽 2 不会使新版本的第二张卡消失。
服务端只在认证的 `/api/saves/playStation/<光盘包 SHA-256>` 保存该信封；它不得进入公开 `/library/`、
光盘包或封面缓存。

客户端本地另存两份记忆卡文件（持久化种类 `ps1-memory-card`，slot 0/1，各 131072 字节）。
旧 slot 0 的身份与路径不变，slot 1 是新增文件。单卡落盘失败不能跳过另一卡，失败的卡保留待保存状态并重试。

## 版本与发布顺序

新客户端读取 v1/v2。没有卡 2 镜像时仍编码 v1，保持既有固定向量逐字不变；存在卡 2 时编码 v2。
新清单声明两个 `ps1-memory-card`，slot 0/1 各 131072 字节；新客户端也接受旧清单的唯一 slot 0 声明。
两项可以倒序排列，但不可重复、越界、改变容量或仅声明 slot 1。

旧版客户端只理解 v1 和单卡清单，不能把它们视为可读取 v2。发布时须协调客户端和服务端升级，不能先向仍在运行旧版客户端的资料库发布双卡清单。
服务器保存接口仍为不解析内部格式的鉴权字节传输，身份与 ETag 并发控制不变。

## 记忆卡与即时存档的职责

记忆卡按光盘包身份独立保存，同一个多碟包内换盘继续使用同一组两张卡；不同游戏不共用一张容量有限的卡。
游戏内保存写入的是记忆卡，即时存档记录的是整台机器的运行状态，两者不可互相替代。

- 恢复过的有效记忆卡即使本局没有新写入，也必须保留在随后生成的信封中。“没有新写入”不代表“没有卡”。
- 游戏写卡后，客户端以有界的短间隔把最新卡镜像原子写入自己的持久化目录；只有写入成功才能确认该版本已经保存。
  写入失败保留待保存状态并重试。暂停、手动保存、退出还需尝试立即写卡，不等待即时存档生成成功。
- 校验通过的信封若只有核心即时状态不兼容（例如 BIOS 改变），仍可保留独立记忆卡并冷启动。
  身份、地区、信封版本或校验不符的载荷不能借此绕过验证。
- 本地短间隔写卡不等于每次都向服务器上传；远程仍使用完整 `FCPSSV01` 信封及现有并发冲突保护。
  网络失败、本机缓存被清除或强制终止时，不能把尚未完成的同步称为服务器备份。

没有游戏内保存功能的游戏仍需使用即时存档；记忆卡协议存在不代表每款游戏的读写兼容性都已经验收。

跨端固定向量（光盘包 SHA-256 `7695ddb80b43301d0930cada8b948d8460ecd27202ce31dc31bbde49bdea39dd`，即
`PS1_DISC_PACKAGE_V1.md` 的固定向量包；地区 `usa`；无记忆卡；状态 `01 02 03`）由 Swift 与 JVM 测试共同
锁定，fingerprint 为 `bb4dfc0c8e9ca2bca5a47993e4666ab35d5b6e2d99927a8bdf3008d77589f0a7`：

```text
RkNQU1NWMDEAAAABAQEBAABPAEAADgAAAAAAAwAAAAB2MTpwbGF5U3RhdGlvbjo3Njk1ZGRiODBiNDMzMDFkMDkzMGNhZGE4Yjk0OGQ4NDYwZWNkMjcyMDJjZTMxZGMzMWJiZGU0OWJkZWEzOWRkYmI0ZGZjMGM4ZTljYTJiY2E1YTQ3OTkzZTQ2NjZhYjM1ZDViNmUyZDk5OTI3YThiZGYzMDA4ZDc3NTg5ZjBhN2ZjcHMxLXN0YXRlLXYxAQIDbi+7wlV/cQs6gorZlfurR87145QC2FPJlXxV8Gzudds=
```

向量由独立于客户端代码的脚本按本文档算出。


双卡独立向量另由 `scratchpad/ps1-dual-memory-card-20261019/make-envelope-vectors.py` 生成；输入为光盘 SHA `a` × 64、地区 `usa`、状态 `01 02 03`，卡 1 填充 `11h`、卡 2 填充 `22h`（各 131072 字节）。Swift/JVM 共同锁定：

| 镜像 | 版本 / 位图 | 完整编码字节数 | 完整编码 SHA-256 |
| --- | --- | --- | --- |
| 无 | v1 / 保留字节 0 | 224 | `03762199c95e15cd22443bb08baabaa860d7880b30f8c831d2fad7f96bf0db08` |
| 仅卡 1 | v1 / 保留字节 0 | 131296 | `58b2874f6813c58f98f4e833613c3a07812475f2ed820f6a78296c6edd4de8df` |
| 仅卡 2 | v2 / 2 | 131296 | `0dc13864eb0ed77fe472c1c47a26a5cf3176f6205fecf78bbeba9e524259cda0` |
| 两卡 | v2 / 3 | 262368 | `8ee7e1aa6203496e8a3e38164fc8098dcbc33f0e1e9ac9d5971ec35210d59e48` |

v2 位图 0/1 的解码及畸形位图、总长度、SHA 校验拒绝也有固定回归；旧版上方 Base64 向量保持不变。
