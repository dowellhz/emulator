# 开源 NES 测试资料库文件格式

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
  "games": [
    {
      "id": "falling",
      "manifest": "Games/Falling/manifest.json",
      "updatedAt": "2026-09-03T04:51:53Z"
    }
  ]
}
```

- `schemaVersion` 当前固定为 `1`。
- `id` 必须唯一且保持稳定，只能包含英文字母、数字、`.`、`_` 和 `-`，最长 180 个字符。
- `manifest` 是相对于资料库根目录的路径。
- `updatedAt` 使用 UTC RFC 3339 时间；修改游戏文件或清单后应同时更新。

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
- 单个 ROM 最大 512 MiB，单张封面最大 32 MiB，资料库最多 5000 个游戏。

macOS 可使用以下命令生成完整性字段：

```sh
stat -f '%z' 'Falling.nes'
shasum -a 256 'Falling.nes'
```

## 4. 简易目录与 HTTP 的区别

- SMB 简易导入可以直接扫描裸目录中的同名 `.nes` 和 `.png`。
- GitHub Pages 属于 HTTP 静态服务器，模拟器会读取根目录的 `library.json`，因此必须保留以上索引和每个游戏的 `manifest.json`。
- `index.html` 仅供人在浏览器查看文件，不参与模拟器导入。

## 5. 发布要求

只能发布作者明确允许再分发的 ROM 和素材，并保留相应许可证。不得上传商业 ROM、BIOS、私有密钥、密码或 Token。
