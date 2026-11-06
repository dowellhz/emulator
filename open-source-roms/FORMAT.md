# 开源 NES 测试资料库文件格式

本页描述现有 NES `manifest.json` v1。需要声明明确机型、硬件板、固件、输入、持久化区域与
可复现参考轨迹时，使用[可携带游戏清单 v2](./PORTABLE_MANIFEST_V2.md)。

资料库导入地址：

`https://dowellhz.github.io/emulator/open-source-roms/`

## 1. 目录结构

```text
open-source-roms/
├── library.json
├── FORMAT.md
├── LICENSE-*.txt
└── Games/
    └── 游戏目录/
        ├── manifest.json
        ├── 游戏名称.nes
        └── 游戏名称.png
```

新入库的游戏按系统分组保存，例如 `Games/nes/<游戏ID>/manifest.json`、
`Games/snes/<游戏ID>/manifest.json`、`Games/arcade/<游戏ID>/manifest.json`。
已有资料库的 `Games/<游戏目录>/manifest.json`、小写 `games/` 和其他合法相对路径继续有效；
同一资料库允许新旧结构混用。读取、编辑和删除必须使用索引里的 `manifest` 路径，
不得从游戏 ID 或系统推算已有游戏的位置，也不得在启动、扫描或更新时自动搬迁用户目录。
游戏 ID 与目录层级无关，包内 ROM、封面路径仍相对于 manifest 所在目录。
macOS 内置 HTTP 发布使用虚拟路径，地址可以继续为 `Games/<游戏ID>/`。

BIOS 和系统固件的新文件按 `bios/<系统>/<文件名>` 保存，例如
`bios/neoGeo/neogeo.zip`、`bios/playStation/ps1-bios-usa.bin`、`bios/snes/dsp1b.rom`。
`library.json` 中 `bios` / `firmware` 的 `path` 仍相对于资料库根目录。
已有根目录或自定义路径保持兼容，更新文件不搬迁原位置。
SNES 游戏包自身 `firmware/` 下的文件属于该游戏包，整理共享 BIOS 时不移动它们。

每个游戏使用独立目录。ROM 和封面必须使用相同的文件名主体，例如：

```text
Falling.nes
Falling.png
```

文件名区分大小写。建议使用 505×337 横版 PNG 封面，画面会居中裁切，不能拉伸。

## 2. 根索引 `library.json`

```json
{
  "schemaVersion": 1,
  "title": "Open-source NES Test Library",
  "updatedAt": "2026-09-03T04:51:53Z",
  "manufacturerCounts": { "capcom": 297, "sega": 140, "konami": 88 },
  "games": [
    {
      "id": "falling",
      "manifest": "Games/Falling/manifest.json",
      "updatedAt": "2026-09-03T04:51:53Z"
    }
  ]
}
```

- `schemaVersion` 当前固定为 `1`。**客户端必须忽略本文未列出的多余字段**，使服务端可以附加向后兼容的新字段而不改版本号。
- `id` 必须唯一且保持稳定，只能包含英文字母、数字、`.`、`_` 和 `-`，最长 180 个字符。
- `manifest` 是相对于资料库根目录的路径。
- `updatedAt` 使用 UTC RFC 3339 时间；修改游戏文件或清单后应同时更新。
- `manufacturerCounts` 可选：街机厂家 id → 该厂家的游戏数，供客户端按游戏数量排序街机厂家货架、把长尾收进一个“其他”货架，免得每个客户端各自统计。id 为 `capcom`、`sega`、`konami`、`taito`、`namco`、`psikyo`、`irem`、`seibu`、`cave`、`technos`、`dataeast`（无连字符）、`toaplan`、`midway`。缺省时客户端本地统计；老客户端忽略该字段。

## 3. 游戏清单 `manifest.json`

```json
{
  "schemaVersion": 1,
  "id": "falling",
  "title": "Falling",
  "chineseTitle": "Falling",
  "description": "游戏说明",
  "system": "nes",
  "category": "动作",
  "classic": false,
  "mapper": 0,
  "region": "Homebrew",
  "players": 1,
  "rom": {
    "path": "Falling.nes",
    "bytes": 40976,
    "sha256": "64 位小写 SHA-256"
  },
  "artwork": {
    "cover": {
      "path": "Falling.png",
      "bytes": 187727,
      "sha256": "64 位小写 SHA-256"
    }
  }
}
```

- 清单中的 `id` 必须与 `library.json` 对应条目的 `id` 完全相同。
- `rom.path` 和 `artwork.cover.path` 相对于该游戏的 `manifest.json` 所在目录。
- 路径必须是安全的相对路径，不能以 `/` 开头，也不能包含 `.` 或 `..` 路径段。
- `bytes` 必须等于文件的实际字节数。
- `sha256` 必须等于文件内容的 SHA-256，并使用 64 位小写十六进制字符。
- NES ROM 使用 `.nes`；封面推荐 `.png`，也支持 `.jpg`、`.jpeg` 和 `.webp`。
- 单个 ROM 最大 512 MiB（PlayStation 光盘包 `.fcps1`、Mega CD 光盘包 `.fcmcd`、PC Engine CD 光盘包 `.fcpcecd` 每张盘最大 1 GiB、整包最大 4 GiB），单张封面最大 32 MiB，资料库最多 5000 个游戏。

macOS 可使用以下命令生成完整性字段：

```sh
stat -f '%z' 'Falling.nes'
shasum -a 256 'Falling.nes'
```

### 街机补充集与完整运行包

街机补充集只包含某个版本新增或不同的芯片。服务器可以从用户资料库中找到经过大小与 CRC32 校验的其余芯片，生成独立的完整 ZIP；客户端仍只下载 `rom` 指定的一个文件，不需要自行寻找母集。

生成运行包时，`rom.path` 指向 `runtime/v1/<运行包 SHA-256>/<driver>.zip`，`rom.bytes` 和 `rom.sha256` 必须对应运行包的真实内容，`rom.driver` 保留准确的子版本。原始上传保存在独立路径，通过可选字段记录：

```json
"sourceROM": {
  "path": "rom/original-clone.7z",
  "originalName": "original-clone.7z",
  "bytes": 123456,
  "sha256": "原始上传文件的 64 位小写 SHA-256"
}
```

`sourceROM.path` 同样相对于本游戏清单。它是用户原始 ROM 内容的来源说明，不是 App 私有索引。游戏 ID 保持不变，原包和供芯片的资料库文件均不被覆盖。完整的 ZIP/7z 不因这个功能重新打包；已有客户端可忽略 `sourceROM`，继续按 `rom` 加载。

存档仍校验运行 ROM 的 SHA-256。旧的不完整包变成完整运行包后，旧存档不会通过修改哈希强行迁移。BIOS、设备固件和 CPS2/CPS3 key 继续遵循各自的校验与存储规则，不能用其他版本的文件代替。

## 4. 简易目录与 HTTP 的区别

- SMB 简易导入可以直接扫描裸目录中的同名 `.nes` 和 `.png`。
- GitHub Pages 属于 HTTP 静态服务器，模拟器会读取根目录的 `library.json`，因此必须保留以上索引和每个游戏的 `manifest.json`。
- `index.html` 仅供人在浏览器查看文件，不参与模拟器导入。

## 5. 发布要求

只能发布作者明确允许再分发的 ROM 和素材，并保留相应许可证。不得上传商业 ROM、BIOS、私有密钥、密码或 Token。
