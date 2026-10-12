# Mega CD 光盘包 `FCMCDPK1`（`.fcmcd`）

Mega CD（Sega CD）光盘在资料库里同样是**一个文件**：与 PlayStation 光盘包
（[PS1_DISC_PACKAGE_V1.md](PS1_DISC_PACKAGE_V1.md)）的布局**完全相同**，只是前 8 字节魔数为 ASCII `FCMCDPK1`。
版本 1（一张盘）与版本 2（2–8 张盘）的头部、文件表、CUE 文本、文件数据、规范形式、上限（单盘 1 GiB、整包 4 GiB）
全部照搬那份文档，下面只写不同之处。

- 魔数 `FCMCDPK1`；扩展名 `.fcmcd`。客户端核心（`FCMegaCDDisc.c`）只认这个魔数，PS1 包不会被当成 Mega CD 盘打开。
- 文件只能是 `BINARY`（小端 CD 音频）；不收 `MOTOROLA`，也没有 `.sbi`（Mega CD 没有 LibCrypt）。
- 第一轨是数据轨（`MODE1/2352`，个别为 `MODE2/2352`）；只有一条数据轨的 dump（音轨缺失）按 Genesis Plus GX 的做法补 2 秒一条的
  静音音轨目录，不另写进包。
- 打包：`FCEmulatorMac/Scripts/ps1-pack-disc.py --mega-cd GAME.cue … OUT.fcmcd`；资料库服务器按同一规则打包，同一份 dump 总是
  同一个包、同一个 SHA-256。

包里不放 BIOS、备份 RAM 或存档。光盘的地区由服务器从数据轨开头的系统区（`SEGADISCSYSTEM`）读出写进清单，客户端按它选 BIOS。

固定向量：CUE 文本 `FILE "fixture.bin" BINARY` / `  TRACK 01 MODE1/2352` / `    INDEX 01 00:00:00`（CRLF 换行）加 2 个全零扇区
（4704 字节）的 `fixture.bin`，规范包共 4857 字节，SHA-256 为
`60a56dfb97a56255daabc0f27a319ec5ba15f4a3ab1a093aff74e341748ca554`；除前 8 字节外与同一输入的 `.fcps1` 逐字节相同：

```text
46434d43 44504b31 01000000 01000000 41000000 00000000
30312e62 696e0000 ...（文件名补零至 48 字节）
99000000 00000000 60120000 00000000
```
