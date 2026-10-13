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
本文件是执行说明，evals.json 是场景配置；包内没有自动启动 Qoder 的程序。
需要版本比较时，对不同版本使用相同任务与标准，记录质量、耗时、Token 和失败原因；
本包未提供已经测得的版本对比或生产评估结果。
