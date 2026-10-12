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

当前项目使用 Direct Upload。源码已纳入 GitHub 版本管理，自动部署尚未配置。若以后接入 GitHub Actions，可按 [Cloudflare 官方文档](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) 将 `dist/` 上传到现有项目；需要单独配置 Cloudflare 发布凭据。

## 练习边界

练习采用虚构工单，不含客户业务数据。目录图中的 `inspect.py`、`transform.py`、`validate.py` 表示职责；练习包实际把三阶段放在 `pipeline.py`。正常数据、换日期和应停止的异常都有样例。尚未在每位同事的 Qoder 环境完成导入验证；实际操作入口按当前产品版本核对。

## v2.1 讲解与回归实践

桌面说明在翻页区后随页切换；手机逐页附说明；无 JS 按顺序阅读。全屏隐藏讲解，以图解为主。PPTX speaker notes 和讲解 PDF 读取同一 explanation 字段。

`npm run build` 同时生成网页、完整练习 ZIP 和可导入 Skill ZIP。包只包含指定源码目录，排除本地输出与缓存。自评模板仍为只读试用版，版本独立于课程。

在解压练习包根目录运行 `python3 check-regression.py --out ../ticket-regression-first`。检查器核对独立 expected 和异常停止；`example-results/` 保留受控副本的真实失败与修复记录。它不证明 Agent 行为或跨机通过。

实现检查：`python3 tests/regression-checker.py`、`node --test tests/self-review.test.mjs`。启动本地预览后，`node tests/course-browser.mjs` 检查桌面、手机、无 JS 和全屏。浏览器检查需要 Playwright；它仅是作者验证依赖，不是学员练习依赖。
