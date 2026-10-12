# PC Engine CD 光盘包 `FCPCDPK1`（`.fcpcecd`）

PC Engine CD-ROM² / Super CD-ROM² 光盘在资料库里同样是**一个文件**：与 PlayStation 光盘包
（[PS1_DISC_PACKAGE_V1.md](PS1_DISC_PACKAGE_V1.md)）的布局**完全相同**，只是前 8 字节魔数为 ASCII `FCPCDPK1`。
版本 1（一张盘）与版本 2（2–8 张盘）的头部、文件表、CUE 文本、文件数据、规范形式、上限（单盘 1 GiB、整包 4 GiB）
全部照搬那份文档，下面只写不同之处。

- 魔数 `FCPCDPK1`；扩展名 `.fcpcecd`。客户端核心（`FCPCECDDisc.c`）只认这个魔数，PS1 与 Mega CD 的包不会被当成 PC Engine
  光盘打开。
- 文件只能是 `BINARY`（小端 CD 音频）；不收 `MOTOROLA`、`WAVE`，也没有 `.sbi`。
- 轨道类型：`AUDIO`、`MODE1/2352`（PC Engine CD 的数据轨）、`MODE1/2048`、`MODE2/2352`。
- 目录（TOC）按 MAME 对 CUE 的处理建立（`src/lib/util/cdrom.cpp` 的 `parse_cue` 与 `cdrom_file` 构造）：`INDEX 00`/`INDEX 01`
  之差是在文件里的 pregap，`PREGAP` 是不在文件里的 pregap，逻辑扇区号依此排开。PC Engine 的 CD-DA 起点按这张目录换算
  （NEC 命令 `$D8` 的 MSF 模式减去 pregap，至少 2 秒），目录不同会让音乐起点不同，所以客户端与服务器都不得自行改写。
- 打包：`FCEmulatorMac/Scripts/ps1-pack-disc.py --pce-cd GAME.cue … OUT.fcpcecd`；同一份 dump 总是同一个包、同一个 SHA-256。

包里不放 System Card（BIOS）、备份 RAM 或存档。启动光盘需要 System Card：CD-ROM² 游戏用 2.x 或 3.0，Super CD-ROM² 游戏
必须用 3.0（Super System Card，卡上带 192 KiB RAM）。

固定向量：CUE 文本 `FILE "fixture.bin" BINARY` / `  TRACK 01 MODE1/2352` / `    INDEX 01 00:00:00`（CRLF 换行）加 2 个全零扇区
（4704 字节）的 `fixture.bin`，规范包共 4857 字节，SHA-256 为
`a09a6f2fd9d8945358e7b14ce71f33c3a4c4c28717bea46c29eea669578619df`；与同一输入的 `.fcmcd`
（`MEGA_CD_DISC_PACKAGE_V1.md` 的固定向量）只差第 3 字节（`P` 对 `M`）。
