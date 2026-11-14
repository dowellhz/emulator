# RomM 5.4.1 synthetic contract fixtures

这些 JSON 是根据固定源码 `9c74d0143fbb876f2f62260b91c6fd0b3f590226` 的接口字段构造的合成样本，**不是实际 RomM 响应抓取，也不是客户端与真实 RomM 联调通过的证明**。`contract.json` 保存来源、对象 ID、字节摘要及各异常样本的预期解释。全套不含商业 ROM、BIOS、私有 key 或真实账户。

`scripts/romm/fixtures.py` 自行生成一份 16 KiB PRG + 8 KiB CHR 的 NROM：复位后只关闭 PPU 并运行空闲循环，用于格式、内容身份和装载检查，不声称是可玩游戏。多文件样本包含两个不同的合成卡带，用于验证不能自动取第一个成员；不冒充真实多碟游戏。封面是自行生成的 2×2 PNG。

```sh
python3 scripts/romm/fixtures.py --check
python3 scripts/romm/test_fixture_server.py
python3 scripts/romm/fixture_server.py --port 0 --ready-file /private/tmp/fc-romm-fixture-ready.json
```

服务默认只绑定回环地址，输出实际端口。基本实例根是 `http://127.0.0.1:<port>/romm/`；所有 `/api/...` 路由均位于该前缀下。使用公开的合成 Bearer 值 `fixture-alpha`、`fixture-beta` 或 `fixture-limited`；这些只被此测试服务接受，不是真实 RomM Token。alpha 的用户 ID 是 11，beta 是 22。`GET /__fixture__/requests` 返回无凭据请求轨迹，可断言客户端没有请求本项目的 manifest、hash-table 或 `/api/saves`。

## 共享响应样本

| 路径 | 用途 |
| --- | --- |
| `heartbeat.json`、`users/*.json`、`platforms.json` | 版本、账户、平台字典 |
| `roms/single-file.json` | ROM ID 101，file ID 1001；仅有 CRC/MD5/SHA-1，没有 SHA-256 |
| `roms/multi-file.json` | ROM ID 202，file IDs 2001/2002；动态 ZIP 的大小不等于原始文件大小之和 |
| `roms/custom-platform.json` | 自定义 slug 下的有效合成 NROM，必须保留内容识别入口 |
| `roms/no-remote-hash.json` | 没有远端摘要，不能伪造“远端 SHA-256 校验成功” |
| `pages/files-omitted.json` | `with_files=false` 的列表，`files=[]` 不代表没有内容 |
| `pages/null-total.json` | total 可空，不能作为空列表处理 |
| `roms/*.json` 的 `path_cover_small/large` | 实例资源路径带官方形态 `?ts=<updated_at>`；不能因有 query 拒绝封面 |
| `roms/official-cover-url.json` | 按真服观察补充的 `/assets/romm/resources/...` 根路径与含空格的时间戳；样本内容仍为合成 |
| `errors/*.json`、`invalid/*.json` | HTTP 错误与无效对象 ID；错误响应不可当 ROM 发布 |

## 本地服务场景

在实例根使用 `/romm/scenarios/<scenario>/` 即可选择场景，后面仍接 `api/...`：

- `basic`、`empty`、`large`：基础、空库、10001 条；large 的 offset=5000 后仍有游戏。
- `null-total`、`page-error`、`repeated-page`、`drift`：未知总数、后续页 500、重复页、前后 ID 集变化。
- `missing-scopes`：合集和固件 403，但基本游戏资料仍可读取。
- `no-hash`、`bad-checksum`：无摘要与故意错误摘要。
- `range-ignored`、`bad-range`、`changed-file`：Range 返回 200、错误 Content-Range、旧 If-Range 对不上新内容。
- `html-login`、`invalid-user`、`wrong-version`：登录 HTML、null 用户、版本低于基线。
- `redirect`：内容重定向到其他 origin，客户端不得转发 Authorization。
- `official-cover`：官方资源根路径、含空格时间戳与实例反代前缀组合；客户端须正确编码空格并保留实例前缀。

重要下载路由：`/api/roms/1001/files/content/<name>` 使用 **file ID**，`/api/roms/101/content/<name>` 使用 **ROM ID**。前者不是 `/api/roms/101/files/...`。服务支持普通单范围 `Range`、`If-Range`、206/416；具体文件内容始终由 ID 决定，不受输出文件名影响。服务不会写任何用户资料，默认不读取本机 RomM/NAS 配置。

## 真实实例与部署凭据

`scripts/romm/synology_*.sh` / `synology_ssh.py` 只用于用户已明确授权的独立群晖实例。私有 SSH 凭据仅从项目规定的本机配置读取；随机部署密码和认证 secret 在独立 NAS 目录中以 0600 保存，不进这些 fixture。真实实例的版本、镜像 digest、OpenAPI、合成库响应及验收结果单独留回执，不能用上述本地服务结果替代。
