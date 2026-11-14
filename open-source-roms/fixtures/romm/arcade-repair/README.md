# 原创街机补件契约

`contract.json` 的 13 个 case 只包含原创短字符串与顺序字节，不含商业 ROM、BIOS、有效游戏 key 或用户凭据。`catalogues` 是测试专用芯片大小/CRC 记录，不能作为真实游戏支持证明。

用 `python3 scripts/romm/arcade_repair_fixtures.py` 重建。脚本独立按 STORE ZIP 格式拼接 canonical golden，不调用产品准备器或模拟核心。输入 ZIP 使用 Deflate、反向成员次序及不同命名；输入小 7z 使用系统 bsdtar 创作。golden 字节约定为 UTF-8 名称按字节升序、version 20、flag 0x800、method 0、time 0/date 0x21、空 extra/comment、attributes 0。

覆盖子包独特身份、歧义拒绝、缺母包、不同物理插槽不能复用同一成员、alternate 重排、key 只能取子包且错误 key 不能替换、optional 只能取子包，以及完整包不重写。输出流式落盘不代表通过完整核心装载；后续隔离导入必须调用真实核心校验。

Apple 新准备器的 ZIP 单原件与总展开各限 512 MiB，明确 donors 最多 8 个，全部输入合计 4 GiB；仅选中芯片展开到隔离文件，规范 ZIP（含目录）最多 512 MiB，临时总预算约 1 GiB。7z 输入、每个 coder 输出、单成员及总展开均限 16 MiB，coder 合计最多 32 MiB；逐包开关，不同时持有多个 C archive。7z 解码前与 64 KiB 输出块检查取消，严格有界解码内部不支持中途取消。超过此界限要求 ZIP。
