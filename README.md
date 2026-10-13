# Skill Engineering 自学课件

从 Chat 使用者，到 Skill 工程实践者。

出品：AI 经营交付效能专项组。问题反馈：张坚、李琦。

[查看公开课件](https://skill-engineering-guide.pages.dev/) · [原始讨论与视觉材料](https://chatgpt.com/share/6acc432e-2210-83ec-8c0f-fb5a93d3ae5a)

## 内容与文件

- `dist/`：可直接发布的网站，包含原海报、可编辑 PPTX、九页 PDF、同源讲解 PDF 和虚构数据练习包。
- `src/content.json`：九页核心文案与 explanation 讲解源。`style.css` 与 `app.js` 控制网页视觉与阅读行为。
- `src/prompts.json`：可复制的创建、实践和反馈提示词。`deep-template.html` 是深入阅读的模板。
- `references/`：原海报、六张原知识课件和最后九页结构摘录。原五期培训安排已按要求排除。
- `authoring/`：PPTX 和 PDF 的生成源码。
- `practice/`：下载练习包的源码和虚构工单数据。
- `prompts/`：通用只读 Skill 自评模板的唯一维护源、版本和合成回归场景。网页及下载文件由构建脚本生成，当前标为试用版。

## 修改与本地预览

需要 Node.js 22.16+ 和 Python 3。网页生成无需安装 npm 依赖。

```bash
npm run build
python3 -m http.server 8765 --directory dist
```

浏览器打开 `http://localhost:8765/`。电脑可以翻页、按左右箭头和 F；手机连续阅读九页。

[自评提示词页面](https://skill-engineering-guide.pages.dev/self-review.html)只需填写 Skill 名称。默认基础筛查，结束后询问是否继续深度；也可直接选择深度。它支持数据处理、写作与分析、流程与工具调用，模型执行的跨平台验收仍未完成。

修改自评提示词时编辑 `prompts/skill-self-review.txt`，版本在 `prompts/metadata.json`，然后运行 `npm run build`。不要直接维护 `dist/self-review.html` 或下载副本。运行 `node --test tests/self-review.test.mjs` 可核对网站复制、下载与单一来源契约；这不代替真实工具中的提示词行为评估。

修改核心文案时，同步重新导出 PPTX/PDF，并逐页检查后更新 `dist/downloads/`。PDF 使用审阅后的九张幻灯片渲染图，PPTX 中的核心文字、表格和图解可编辑。

PPTX 生成使用 Codex 提供的 `@oai/artifact-tool`、Presentations skill 验证工具和选定字体。请在该运行环境中配置 `PRESENTATIONS_SKILL_DIR`、`PYTHON_EXECUTABLE`、`RUNTIME_NODE_MODULES` 及按需配置 `SLIDE_FONT`，然后运行 `node authoring/build-deck.mjs`。最终文件与验证回执默认以新的版本文件名写入 `build/`，不会覆盖发布版；检查后再复制到下载目录。PDF 导出需要 `reportlab` 和可嵌入的 CJK 字体，运行 `python3 authoring/build-pdf.py`，同时生成九页图解 PDF 与九页讲解手册。可用 `PDF_CJK_FONT` 配置字体路径。

## 发布

```bash
npm run package
```

将生成的 `build/cloudflare-pages.zip` 上传到现有 Cloudflare Pages 项目 `skill-engineering-guide`，选择 Production，然后部署。压缩包根目录就是网站根目录，原网址保持可用。

现有 Pages 项目继续使用 Direct Upload，自动发布由 `.github/workflows/pages-deployment.yml` 完成：推送到 GitHub 的 `main` 分支后，构建网页和练习下载，检查页面链接、自评工具与参考脚本回归，再上传到同一个 `skill-engineering-guide` 项目。检查失败会停止发布。也可在 GitHub Actions 中手动运行工作流；只允许 `main` 发布生产版本。

发布前需要在本仓库的 Actions secrets 中配置 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。Token 使用本项目所属账户的 Cloudflare Pages Edit 权限；不将凭据提交到源码。接入方式依据 [Cloudflare 官方文档](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)。手工上传 ZIP 保留为备用方式。

自动部署构建网页与练习包，不重新生成 PPTX 和两份 PDF。修改九页核心文案时，仍需按上面的导出步骤更新并提交下载文件，再推送发布。

`deep` 跟练页从未安装自己的日报 Skill 开始，顺序为普通 Chat、提炼、安装、新 Chat 验证。维护 `src/deep-template.html` 和 `src/prompts.json` 中的 `deep-*` 提示词；独立输入下载从 `practice/ticket-daily-report/tests/fixtures/` 生成，现成参考 Skill 留在进阶部分。

## 练习边界

练习采用虚构工单，不含客户业务数据。目录图中的 `inspect.py`、`transform.py`、`validate.py` 表示职责；练习包实际把三阶段放在 `pipeline.py`。正常数据、换日期和应停止的异常都有样例。尚未在每位同事的 Qoder 环境完成导入验证；实际操作入口按当前产品版本核对。

## v2.1 讲解与回归实践

桌面说明在翻页区后随页切换；手机逐页附说明；无 JS 按顺序阅读。全屏隐藏讲解，以图解为主。PPTX speaker notes 和讲解 PDF 读取同一 explanation 字段。

`npm run build` 同时生成网页、完整练习 ZIP 和可导入 Skill ZIP。包只包含指定源码目录，排除本地输出与缓存。自评模板仍为只读试用版，版本独立于课程。

进入解压后的 `ticket-daily-report/`，运行 `python3 tests/check-regression.py --out ../ticket-regression-first`。检查器核对 `tests/expected/` 和异常停止；`tests/example-results/` 保留受控副本的真实失败与修复记录。它不证明 Agent 行为或跨机通过。

实现检查：`python3 tests/regression-checker.py`、`node --test tests/self-review.test.mjs`。启动本地预览后，`node tests/course-browser.mjs` 检查桌面、手机、无 JS 和全屏。浏览器检查需要 Playwright；它仅是作者验证依赖，不是学员练习依赖。

## v2.2 示例与讲解

第 2 页从同一份 `practice/ticket-daily-report/tests/fixtures/normal.json` 读取完整 7 行数据，展示要交给 AI 的任务和日报计算过程。网页表格与 PPTX 可编辑表格通过 `scripts/course-data.mjs` 读取同一来源。九页讲解改为围绕工单案例的讲述，并同步到 PPTX 备注和讲解 PDF。练习包、自评模板及其历史运行记录沿用原版本。

浏览器检查按内容版本保存证据；设置 `COURSE_TEST_EVIDENCE_DIR` 可为本地与公网执行分别指定目录。

## v2.3 测试、评估与自然语言任务

第 6、7、8 页与 Deep 统一采用常见组织方式：`tests/` 通常放程序测试，`evals/` 放 AI 任务场景与判定标准，均为可选目录。Task eval 可以复用 tests 的同一断言，增加整批任务的基线与版本比较；评估可由程序发起并评分。第 8 页与 Deep 用 Trigger、Task、Production 三个教学视角，以及 10 个 Golden Tasks 的 V1/V2 假设结果讲解评估。60%/80% 与提升 20 个百分点仅为示例，明确重复运行与控制变量的要求。工单四步保留为结果与安装复用的基础验证，不据此宣称版本收益。正确答案的独立性来自已确认的规则，可供两类检查共用，不取决于存放位置。

安装后任务只给文件、日期与新输出目录；固定规则和脚本调用由 Skill 提供。首次普通 Chat 保留尚未沉淀的业务口径，创建步骤要求完整包；路径和模板排错放入帮助。主课件第 7 页链接到四步跟练，现成参考包另放进阶。

修改后的网页、PPTX 备注与讲解 PDF 同源。仍需按既有作者流程导出并核对九页 PPTX、课件 PDF 和讲解 PDF，再提交下载文件。参考包保持教学格式，`GUIDE.txt` 同步解释测试/评估；不提供一键自动运行 Qoder 的评估程序。

## v2.4 统一参考包目录

现成 Skill 与完整参考包都将输入、已确认答案、检查器和历史脚本运行记录归入 `ticket-daily-report/tests/`。`evals/evals.json` 使用 Agent Skills 指南的场景结构，并直接引用 tests 的输入与答案；`evals/README.txt` 说明如何在 Qoder 新 Chat 中逐案执行和留证。配置中的 `expected_file` 是本包的核对字段，不假设工具自动识别。没有新增自动启动 Qoder 的程序或实测版本比较。

页面、GUIDE、Skill 入口与 PPTX/PDF 统一这套目录。处理脚本、原始输入、确认答案和历史运行 JSON 保持字节一致；历史记录的来源与摘要保留当时值。两种 ZIP 解压后都能独立运行检查器，相关作者测试在发布前检查其可移植性与场景引用。

## v2.5 教学框架与 LLM 核对示例

九页主线保持。第 4、5 页的继续阅读改到工作流和 AI/代码分工；第 6 页展示参考包实际五类文件，第 8 页保留 Golden Tasks 理论，并提示 LLM 核对已有证据。第 9 页与 Deep 区分自评、检查计划、生成文件、执行与评审。

Deep 的进阶阅读按方法组织、准备/运行/核对、版本比较与分享安排。evals.json 的使用例子明确受测任务和评审 Chat 分开，列出场景配置、可信答案、actual/ 输出、execution-record.txt 与短评审请求。示例判断是假设材料，不冒充新增 Qoder 实测。当前无自动评估程序；检查器只运行固定脚本。参考包使用说明同步，处理代码和原始可信答案不变。

新增“生成检查文件”提示词仅在已有 Skill 和已确认计划下使用；可机械判定内容生成可运行检查，其余保留评审标准。生成文件不等于运行通过，也不会自动安装或发布。课程文案、PPTX 备注与讲解 PDF 保持单一来源，发布前检查各提示词的前置材料、输出与范围；未实测的新提示词不继承旧 Qoder 实测记录。
