# Sega Saturn 光盘包 `FCSATPK1`（`.fcsat`）

世嘉土星（Sega Saturn）光盘在资料库里同样是**一个文件**：与 PlayStation 光盘包
（[PS1_DISC_PACKAGE_V1.md](PS1_DISC_PACKAGE_V1.md)）的布局**完全相同**，只是前 8 字节魔数为 ASCII `FCSATPK1`。
版本 1（一张盘）与版本 2（2–8 张盘）的头部、文件表、CUE 文本、文件数据、规范形式、上限（单盘 1 GiB、整包 4 GiB）
全部照搬那份文档，下面只写不同之处。

- 魔数 `FCSATPK1`；扩展名 `.fcsat`。PS1、Mega CD、PC Engine CD 的包不会被当成土星光盘打开，土星光盘也不能放进它们的包。
- 文件只能是 `BINARY`（小端 CD 音频）；不收 `MOTOROLA`、`WAVE`，也没有 `.sbi`。每张盘的第一轨必须是数据轨。
- 识别：第一个数据轨 INDEX 01 处第一个扇区的系统 ID（前 256 字节），以 Ymir `0d7f58b9` `SaturnHeader::ReadFrom`
  与 Mednafen（beetle-saturn `30f4c120`）`disc.c` `IsSaturnDisc`/`CalcGameID`/`DetectRegion` 交叉核对：硬件 ID 0x00
  `SEGA SEGASATURN `、厂商 0x10、产品号 0x20–0x29、版本 0x2A、发售日 0x30、设备信息 0x38、地区符号 0x40–0x49、
  外设 0x50–0x5F、标题 0x60–0xCF。
- 地区：地区符号里按 U（北美）、J（日本）、E（欧洲）的顺序取第一个出现的（Mednafen `region_strings` 的偏好顺序，
  只保留本项目有 BIOS 槽和 SMPC 区域码的三区；与 Mega Drive 的 AUTO 顺序一致）。只有 T/K/B/A/L 的光盘拒收。
  多碟包每张盘的地区必须相同。
- 卡带：产品号（0x20–0x29，NUL 当空格、去两端空白）整串精确查卡带表（Ymir `0d7f58b9` `game_db.cpp`，源自 Mednafen
  `db.cpp`）：1 MiB 扩展 RAM 22 个、4 MiB 扩展 RAM 8 个、备份记忆卡带 2 个，其余不插卡带；需要 ROM 卡带的 3 个产品号
  （拳皇 95 MK-81088/T-3101G、奥特曼 T-13308G）拒收（`DISC_SATURN_ROM_CART`）。多碟包里各盘需要的卡带不同也拒收
  （`DISC_MIXED_CARTS`）；不在表里的盘不影响别的盘的卡带。
- 安全码（0x100–0xDFF）按 Mednafen 的 SHA-256 比对，结果只记录（`securityCode`），不作为拒收条件；BIOS 启动时自己检查。
- 打包：`FCEmulatorMac/Scripts/ps1-pack-disc.py --saturn GAME.cue … OUT.fcsat`；与服务器的打包结果逐字节相同。

包里不放 BIOS、备份 RAM、卡带内容或存档。启动需要按地区选的 BIOS：日版光盘用日版 BIOS（SMPC 区域码 1），北美与欧洲光盘用海外版
BIOS（区域码 4 与 0xC，后者 PAL）。

固定向量：CUE 文本 `FILE "fixture.bin" BINARY` / `  TRACK 01 MODE1/2352` / `    INDEX 01 00:00:00` 加 2 个全零扇区
（4704 字节）的 `fixture.bin`，规范包共 4857 字节，SHA-256 为
`0e7671503606feae778c92ca1d4c4b8cc91062962161b2024773b1487136463b`；与同一输入的 `.fcpcecd`
（`PCE_CD_DISC_PACKAGE_V1.md` 的固定向量）只差第 3–5 字节（`SAT` 对 `PCD`）。这个向量没有系统 ID，只核对布局，不能被识别为土星光盘。
