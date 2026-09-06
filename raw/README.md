# raw/ — 知识库原始素材收集区

PM 求职知识库的原始素材在这里攒，每周用 Claude Code 清洗提炼进 `src/knowledge/`。

## 目录约定

- `jd/` — 真实 PM 岗位 JD 全文，一个文件一条，命名：`公司-岗位.md`
- `tips/` — 求职经验帖（牛客/小红书/公众号），命名随意，保留原文即可

## 收集方式（别搞仪式感）

- 刷到好内容：复制原文 → 手机微信「文件传输助手」→ 回电脑存进这里
- 投递/看到 JD：复制全文存进 `jd/`，顺手把公司岗位写进文件名
- 目标：上线前攒 30 份 JD + 30 篇经验帖

## 提炼指令（每周 30 分钟，丢给 Claude Code）

```
清洗 raw/jd/ 和 raw/tips/ 里的新素材（与 src/knowledge/ 现有内容去重），
提炼合并进 src/knowledge/pm-jd-patterns.md（更新频次排序）和
src/knowledge/pm-resume-checklist.md，并把两个文件头部的版本号升级
（如 v0.1 → v0.2），保持现有格式不变。
```

提炼完成后同步更新 `src/prompts.ts` 里的 `KB_VERSION`，简历 bullet 上就多了一个「知识库持续迭代」的故事点。
