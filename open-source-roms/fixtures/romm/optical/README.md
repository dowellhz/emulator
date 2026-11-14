# 原创光盘准备合同与黄金包

`contract.json` 列出 11 组输入和独立 canonical `.fcps1` 输出，供 Apple/Android 逐字节对拍。仅包含仓库既有作者生成的扇区、音频和描述文件，没有商业 ROM 或 BIOS。

`scripts/romm/optical_fixtures.py` 复用历史扇区作者生成输入，以独立的 `24 + 64N` 字节布局 writer 固化输出；没有调用产品准备器。Disc A、Disc A+B 和 CCD+SUB 的输出 SHA-256 与历史 `ps1-chd-fixtures.json` / `ps1-ccd-fixtures.json` 相符。CHD 来自既有 chdman 0.289 原创输入，三种 codec 为 cdzl/cdlz/cdfl。本轮只固化数据，不代表新实现已经构建或验收。

M3U 显式顺序是 Disc 10(A)→Disc 2(B)；无列表的 `natural.zip` 应按 Disc 2(B)→Disc 10(A)。同一输入既有独立描述文件，也有真实 Deflate ZIP 和 ZIP64 尾目录容器。

规范布局：magic 8 字节，四个 LE32（版本、成员数、CUE 总字节数、碟数）；v1 的碟数为0。接每项64字节表（UTF-8 名补零48字节、LE64 offset、LE64 bytes）；v2 再接每碟 LE32 CUE 长度；随后各 UTF-8 CUE、顺序 `NN.bin`、按碟编号 `DD.sbi`。最多8碟、99个轨道和SBI成员，每碟1 GiB、整包4 GiB。

Q 保护可表示为 SBI；规范包不能保存任意 R-W/CD+G。新准备器对非空 R-W 或无法表示的有效 Q 位置明确拒绝，不能丢弃后当成功。CHD `SUBTYPE=NONE` 的96字节只是填充；RW 为每通道12字节，RW_RAW 为交织位，需要先反交织。P 只接受全0或全FF，R-W须全0；异常Q CRC最多4096条。

Apple 入口：`TVRomMOpticalPreparation.prepare(sources:directory:checkpoint:)` 返回已识别系统的规范包，普通卡带返回 nil；全文件列表先选择唯一M3U或自然排序的控制文件，轨道留在其原相对目录。后台已有规范包导入使用 `TVRomMDiscImport.prepare(source:name:destinationRoot:checkpoint:)`，只生成私有 `ROMs/<SHA256>.<suffix>` 和 record，不发布资料库状态。

ZIP 的目录、路径冲突、成员范围和总预算先验证，64 KiB C 输送器再做 Deflate/CRC/取消。iOS/tvOS 不使用 Process；大光盘7z和RAR须提供ZIP或独立轨道。Mac 继续使用已有bsdtar输送，新增取消和预算轮询。小7z元数据探测单独有64 MiB输入/单coder、128 MiB coder合计限制，不能当成大7z流式准备通过。
