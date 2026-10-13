---
name: ticket-daily-report
description: 从符合练习数据契约的 JSON 工单明细生成按创建日期统计的日报，核验分类数量与完成工单平均耗时。用于工单日报教学练习。
metadata:
  version: "1.0"
---

# 工单日报练习

输入：明细 JSON 路径、统计日期、新的输出目录。数据全部为教学虚构数据。需要 Python 3.9+，无第三方依赖或网络请求。

先读取 [数据契约](references/data-contract.md) 和 [业务规则](references/business-rules.md)。缺少输入先补齐，不猜测日期或业务口径。

运行固定脚本，不临时改写计算方法：

```sh
python3 scripts/pipeline.py --input <明细路径> --date <YYYY-MM-DD> --out <新输出目录>
```

命令路径相对 Skill 根目录，实际运行时使用对应完整路径。输出目录必须不存在，避免把旧结果当成本次成功。

退出码非零：报告缺口，停止成功交付，不补造字段或修改原始数据。需要变更业务口径时先由业务负责人确认，再修改规则和实现并重新验证。

退出码为零后：读取 evidence.json，确认 validation 为 PASS、统计日期正确，交付 report.json、report.txt 与 evidence.json，并说明输入数、重复数和跨日期排除数。

脚本测试只证明程序行为。新 Chat 中确认本 Skill 被选中、脚本实际运行、失败正确停止，才构成该环境的 Agent 行为验证。规则和资源应来自包内文件，不依赖此前对话。

维护与验证本 Skill 时：程序测试运行 `python3 tests/check-regression.py --out <包外新目录>`；AI 任务场景见 [evals/README.txt](evals/README.txt) 与 [evals/evals.json](evals/evals.json)。两者共用 `tests/fixtures/` 的输入和 `tests/expected/` 的已确认答案；日常生成日报只需用户提供的输入与上述规则、脚本。
