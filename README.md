# 秋招陪跑 AI 工作台

> 上传历史简历构建结构化经历库，针对每个 JD 完成经历取舍与定制改写的秋招投递工作台。
> 数据仅存用户浏览器本地，零后端、零运维。

**线上地址**：https://hxy089.github.io/qiuzhao-peipao/ ｜ **代码仓库**：https://github.com/hxy089/qiuzhao-peipao

## 问题与洞察

**问题**：PM 求职者每投递一个岗位要花 20-30 分钟手动改简历；多段实习/项目/校园经历的取舍依赖感觉；市面 AI 简历工具（含裸大模型对话）本质是「文本改写器」，不理解简历的本质是**经历与岗位的匹配决策**。

**方案**：把简历拆成结构化「经历时间线库」，AI 按 JD 在经历级完成取舍、缺口分析与定制改写，再用「PM 求职领域知识库」（真实 JD + 经验帖提炼）增强模型输出质量。简历版本按「公司-岗位」管理，只存本地。

完整产品定义见 [docs/PRD.md](docs/PRD.md)。

## 功能（v0）

| 模块 | 说明 |
|---|---|
| 经历库构建 | 上传 1-3 份 PDF（或粘贴文本），AI 合并去重、按时间排序，可编辑 |
| JD 分析 | 要求拆解 / 关键词 / 隐含考察点（带置信度） |
| 经历取舍 | 每段经历标记 强相关 / 保留 / 舍弃 + 一句话理由 |
| 简历组装 | 生成定制简历 markdown，被改写的 bullet 高亮标注，附改动清单 |
| 缺口分析 | JD 要求但经历库无法支撑的点，给出可行动建议（不写进简历） |
| 对话迭代 | 自然语言持续修改，遵守防幻觉约束（只重组不改事实） |
| 版本管理 | 按投递卡保存版本、另存快照，全部存 localStorage |
| 演示模式 | 内置示例数据，不调 API，点开就能体验全流程 |
| 数据埋点 | 本地统计打开/分析/生成/导出次数，支持 JSON 导出备份 |

## 快速开始

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 构建产物在 dist/
npm run preview    # 预览构建产物
```

- **体验**：默认开启演示模式，无需任何配置，点「构建经历库」→「新建投递」即可走完全流程
- **正式使用**：设置 → 关闭演示模式 → 填入 OpenAI 兼容的 Base URL + API Key + 模型名（支持 DeepSeek/Qwen 等）

## 部署到 GitHub Pages

纯静态站，零服务器，免费部署（当前线上地址见页首）：

1. 首次部署：`npm run deploy`（构建 dist 并推送到 gh-pages 分支）
2. 仓库 Settings → Pages 选择 `gh-pages` 分支（首次需手动开启一次，本项目已完成）
3. 后续更新：改完代码后 `npm run deploy` 即可，1-2 分钟后生效

> `vite.config.ts` 已设置 `base: './'`（相对路径），保证子路径部署时资源可正常加载；该配置同样兼容 Vercel/Netlify 等其它静态托管。

## 知识库喂养工作流

```
raw/jd/（真实 PM JD）   raw/tips/（牛客/小红书/公众号经验帖）
        ↓ 每周一次，用 Claude Code 清洗去重提炼
src/knowledge/pm-jd-patterns.md      （JD 高频要求模式）
src/knowledge/pm-resume-checklist.md （简历写法规范）
        ↓ 构建时 ?raw 注入，全量进 system prompt（v0 不做 RAG）
        版本号见 src/prompts.ts 的 KB_VERSION
```

当前知识库为 **v0.1 手写首版基线**，待收集 30 份真实 JD 后升级 v0.2。

## 技术栈与架构

- Vite + React 18 + TypeScript，纯前端单页应用
- `pdfjs-dist` 提取 PDF 文本；`marked` 渲染简历 markdown
- 数据模型：profile / experiences / applications / versions / settings / metrics（全部 localStorage，见 `src/storage.ts`）
- AI 调用链（`src/prompts.ts` + `src/llm.ts`）：
  - P1 经历库提取合并 → P2 JD 分析 → P3 经历取舍+组装 → P4 对话迭代
  - 防幻觉硬约束写入所有 prompt：事实数字必须来自原文、改动逐条列清单、缺口不进简历
  - JSON 解析容错：代码围栏剥离 + 括号配平 + 尾逗号/中文引号清理 + 失败自动重试 1 次

## 成功指标（北极星：生成并保存的定制简历版本数）

| 指标 | 目标（上线两周） |
|---|---|
| 问卷回收（痛点验证） | 30 份 |
| 使用人次 | 50+ |
| 生成版本数 | 30+ |
| 复盘文章阅读 | 300+ |

## Roadmap

- **二期**：面试准备模式（基于过筛版本生成预测问题与模拟追问）、投递结果追踪（先手动标记）
- **三期**：AI 自动抓取求职信息源、数据看板、账号体系与云同步、知识库 RAG 化

## 隐私

所有简历、投递、版本数据仅存于用户浏览器 localStorage，不上传任何服务器；API Key 同样只存本地；导出备份功能刻意剔除 API Key。
