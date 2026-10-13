AI 任务场景

evals.json 记录四个任务的提示词、输入、预期结果与核对项。
files 和 expected_file 均为相对 Skill 根目录的路径，直接引用 tests/ 的样例与答案。
expected_file 是本参考包的核对字段，不要求评估工具自动识别。

在 Qoder 中逐案执行：
1. 安装同版本 ticket-daily-report。为每案准备新的验证文件夹，
   将 files 指向的输入复制到文件夹根目录，保留原文件名。
2. 开新 Chat，选择该验证文件夹，用 / 选择 ticket-daily-report，
   只粘贴该案的 prompt。输出目录名称可换成尚未使用的名称。
3. 任务结束后，由核对者查看交付文件与执行记录，逐项核对 assertions。
   正常两案的 report.json 与 expected_file 中每个字段比对；
   异常两案核对停止原因、实际非零退出和没有成功目录。
4. 在 Skill 包外保存本轮输入、实际结果和执行记录。
   每项记 PASS、FAIL 或 UNKNOWN；未运行、看不到证据时记 UNKNOWN。
   测试通过不能代替查看 Qoder 实际使用了哪个 Skill 和脚本。

预期答案与评分配置由核对者保留，不把它们当作任务提示发给受测 AI。
本文件是执行说明，evals.json 是场景配置；当前没有自动评估程序。
人手动启动任务、收集材料，再按标准核对；配置文件不会自行运行或评分。
需要版本比较时，对不同版本使用相同任务与标准，记录质量、耗时、Token 和失败原因；
本包未提供已经测得的版本对比或生产评估结果。

交给评审 LLM 核对场景 1：
先按上述步骤让 Qoder 实际完成正常任务，再创建独立的评审文件夹。
复制本包 evals/evals.json 和 tests/expected/2026-10-10.json，保留相对路径。
把本次 report.json、report.txt、evidence.json 放入 actual/，
把技能加载、实际脚本路径、参数、退出状态和有关回复保存为根目录 execution-record.txt。
记录缺失部分注明缺失，不凭印象补写。另开能读取这些文件的评审 Chat，发送：

只核对 evals/evals.json 中 id=1 这一案，对照它引用的预期答案、actual/ 的本次输出和 execution-record.txt。逐项给出核对项、PASS/FAIL/UNKNOWN、文件或日志证据和理由。证据不足记 UNKNOWN，明确不符记 FAIL；不能用自报 PASS 代替调用日志；最后汇总本案结论。只做核对，不重跑任务或修改文件。

应得到每项结论、文件或日志证据、理由与整体结论。
有日报 65 而没有实际调用日志时，调用项为 UNKNOWN；
实际数字 39 与已确认答案不符时，数字项为 FAIL。
整体：任一 FAIL 则 FAIL，无 FAIL 但有 UNKNOWN 则 UNKNOWN，全项有证据通过才 PASS。
LLM 的判断需要复核证据；人工、程序和 LLM 都可以承担适合它们的评分。
本包未实现批量启动 Agent、收集记录、自动评分和汇总的链路。
