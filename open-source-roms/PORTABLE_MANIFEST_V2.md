# FC Emulator 可携带游戏清单 v2

`manifest.json` 的 v2 格式在 v1 展示元数据之外，加入一份完整、可审计的 `hardware` 声明。
它用于 Mega Drive、IGS PGM、SNES 等独立新核心，也可用于现有系统。GB/GBC 已退出开发与
产品范围，服务端与客户端都会拒绝新的 `gameBoy`、`gameBoyColor` 清单。

v1 清单保持可读，但不得带 `hardware`。v2 清单必须带 `hardware`，其中所有数组即使为空也
必须明确写出。ROM、固件和参考轨迹只以安全相对路径、字节数和小写 SHA-256 引用；不得在
清单里放 ROM/BIOS 字节、存档内容、绝对路径、凭据或私有 key 表。

## 完整示例

```json
{
  "schemaVersion": 2,
  "id": "md-fixture",
  "title": "Mega Drive Fixture",
  "system": "megaDrive",
  "category": "其他",
  "rom": {
    "path": "rom/fixture.md",
    "bytes": 524288,
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "hardware": {
    "schemaVersion": 1,
    "model": "sega-mega-drive",
    "region": "usa",
    "cartridge": {
      "board": "mega-drive-linear",
      "features": ["battery"]
    },
    "firmware": [],
    "inputs": [
      { "port": 0, "kind": "mega-drive-6-button" }
    ],
    "persistence": [
      { "kind": "mega-drive-sram", "slot": 0, "bytes": 65536 }
    ],
    "referenceTraces": [
      {
        "id": "boot-1800",
        "file": {
          "path": "traces/boot-1800.json",
          "bytes": 4096,
          "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        },
        "hardResetSeed": 4660,
        "rtcEpoch": 946684800,
        "checkpoints": [600, 1200, 1800],
        "references": [
          {
            "name": "mame",
            "revision": "cccccccccccccccccccccccccccccccccccccccc",
            "binarySHA256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
          }
        ]
      }
    ]
  }
}
```

## 稳定标识

| `system` | 允许的 `model` | ROM 扩展名 | 卡带/板卡前缀 |
| --- | --- | --- | --- |
| `nes` | `nes`、`famicom`、`famicom-disk-system` | `.nes/.fds/.qd` | `nes-`、`fds-` |
| `neoGeo` | `arcade-neogeo-mvs` | `.zip/.7z` | `neogeo-` |
| `arcade` | `arcade-cps1`、`arcade-cps2`、`arcade-sega-outrun`、`arcade-sega-system16` | `.zip/.7z` | `cps1-`、`cps2-`、`sega-arcade-` |
| `megaDrive` | `sega-mega-drive` | `.bin/.md/.gen` | `mega-drive-` |
| `pgm` | `arcade-igs-pgm1` | `.zip/.7z` | `pgm-` |
| `snes` | `super-nintendo`、`super-famicom` | `.smc/.sfc` | `snes-` |

`region` 只能是 `japan/usa/europe/world/asia/korea/taiwan/hong-kong`。地区和机型必须明确，
不得依靠标题、文件名或 ROM 哈希在运行时猜测。

输入设备按系统限制为 `nes-standard`、`arcade-digital`、`mega-drive-3-button`、
`mega-drive-6-button`、`snes-standard` 或 `snes-super-scope`。端口号在 0–7 内且不可重复。

持久化 `kind` 与 `FCEngineC` ABI v2 一一对应：`nes-battery`、`fds-side`、
`neogeo-backup-ram`、`neogeo-memory-card`、`cps1-eeprom`、`mega-drive-sram`、
`mega-drive-eeprom`、`pgm-nvram`、`snes-sram`、`snes-rtc`。
同一 `(kind, slot)` 不可重复，`bytes` 是核心可见区域的精确大小。这里只描述区域，不保存用户
运行后产生的存档数据。

`port` 与 `slot` 使用无符号 32 位整数。轨迹的 seed、RTC epoch 和检查点为保证 Swift、Java、
JavaScript 精确解析，绝对值不得超过 JSON 安全整数 `9007199254740991`；seed 与检查点不得为负。
`.fds/.qd` 必须同时使用 `famicom-disk-system` 与 `fds-` 板卡，且只可声明 `fds-side`；`.nes`
不得声明 FDS 型号、板卡或 `fds-side`。

Mega Drive 首发产品边界更窄：`region` 只接受 `japan/usa/europe/world`，输入只接受端口 0/1
且必须包含端口 0，每张卡带最多一种 slot 0 持久介质。并行 SRAM 使用普通 `mega-drive-*`
板卡；串行 EEPROM 必须使用
`mega-drive-eeprom-<PCB>-<chip>`，其中 PCB 只能是 `sega-171`、`ea-p1000x`、
`acclaim-16m`、`acclaim-32m`、`codemasters-jcart`，chip 只能是 `x24c01/x24c02`
或 `24c01` 至 `24c512` 的已登记型号。`bytes` 必须与芯片容量精确相等；客户端和服务端都
在 ROM 进入核心前拒绝未知接线或容量不一致，不能用游戏名、文件名或 ROM 哈希推断 EEPROM。

固件 `role` 只能是 `system-firmware` 或 `coprocessor-firmware`；同一 `(role, slot)` 不可
重复。CPS2 key 仍严格使用既有的单游戏 `emulation.cps2Key` 链路，不能伪装成通用固件，客户端
也不得读取服务端 `cps2-keys.json`。

Super NES 卡带必须且只能声明一个 `system-firmware` slot 0，其文件正好 64 字节，
内容是该清单明确绑定的外部 SPC700 IPL。客户端按 SHA-256 将它保存到 App 私有容器，
不得内置固件、从 ROM 公共目录搜索同名文件或把缓存写回资料库。普通板最多声明一个
slot 0 `snes-sram`，容量上限 128 KiB；SA-1 与 S-DD1 上限 256 KiB。SPC7110 RTC 型另以
slot 1、16 字节 `snes-rtc` 表示时钟状态。DSP-1/2/3/4、Cx4、ST010/011/018 必须再声明一个
`coprocessor-firmware` slot 0，大小分别为 8192、3072、53248/53248/163840 字节。

服务端已经能够生成 `snes-sdd1`、`snes-cx4`、`snes-spc7110`、`snes-spc7110-rtc`、
`snes-st010`、`snes-st011` 和 `snes-st018` 清单，以便私人资料库先完成收录。S-DD1
现已由 Apple/Android 源码产品链接受；Cx4、SPC7110/RTC 和 ST010/011/018 仍是客户端的
保留身份，对应核心与产品门完成之前，上传成功不代表能够启动。

## 参考轨迹

每条轨迹必须引用 `.json` 文件，固定 `hardResetSeed`、`rtcEpoch`、严格递增的检查帧，以及至少
一个参考实现。`revision` 必须是完整 40 或 64 位源码 commit，`binarySHA256` 必须是小写
SHA-256。`master`、版本昵称和 `unknown` 不可作为 golden。轨迹文件使用
`FCEmulatorMac/Tools/FCReferenceRunner/README.md` 定义的逐帧输入合同，运行报告不进入清单。

路径遵循 v1 的边界：相对于游戏自己的 `manifest.json`，不能是绝对路径，不能含空、`.` 或
`..` 段，也不能使用反斜线。公共资料库仍只发布有明确再分发许可的内容；商业 ROM/BIOS 与私有测试内容只可留在
用户自己的资料库。
