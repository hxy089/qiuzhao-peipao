import { PromptKind } from '../llm'

// 演示模式数据：示例人物「张小雨」为虚构角色，用于零门槛体验全流程与面试演示

const p1 = {
  candidate: {
    name: '张小雨',
    phone: '138****0000',
    email: 'zhangxiaoyu@demo.com',
    education: [
      { school: '某某大学', degree: '本科', major: '信息与通信工程', start: '2020.09', end: '2024.06' },
    ],
  },
  experiences: [
    {
      id: 'exp_1',
      type: '实习',
      org: '星澜科技（示例数据）',
      role: 'AI 产品实习生',
      start: '2025.11',
      end: '2026.04',
      bullets: [
        { id: 'b_1', text: '负责智能会议助手从 0 到 1 的产品设计与上线，完成竞品调研、MVP 功能定义与交互原型设计' },
        { id: 'b_2', text: '构建会议纪要生成评测体系，设计 6 个评测维度，组织标注 600 分钟多样化测试数据' },
        { id: 'b_3', text: '设计会议纪要生成 Prompt，参考优秀样本多轮迭代，使自部署模型效果接近闭源模型' },
        { id: 'b_4', text: '输出可复用的评测 SOP 文档，沉淀为团队标准流程' },
      ],
      sourceFiles: ['示例简历_1.pdf'],
      updatedAt: 0,
    },
    {
      id: 'exp_2',
      type: '实习',
      org: '云端数据（示例数据）',
      role: '数据产品实习生',
      start: '2025.04',
      end: '2025.07',
      bullets: [
        { id: 'b_5', text: '基于 800+ 条历史问答数据分析用户意图分布，完成智能客服产品路线规划' },
        { id: 'b_6', text: '独立完成 10+ 个意图识别需求的收集、撰写、推动上线与效果观测全流程' },
        { id: 'b_7', text: '用户进线转人工率降低 10%+' },
      ],
      sourceFiles: ['示例简历_1.pdf'],
      updatedAt: 0,
    },
    {
      id: 'exp_3',
      type: '校园',
      org: '某某大学创新实验室（示例数据）',
      role: '项目组长',
      start: '2023.09',
      end: '2024.06',
      bullets: [
        { id: 'b_8', text: '带领 5 人团队完成校园二手交易小程序开发，上线首月注册用户 2000+' },
      ],
      sourceFiles: ['示例简历_2.pdf'],
      updatedAt: 0,
    },
  ],
}

const p2 = {
  role_summary:
    'AI 产品经理（示例分析）：负责 AI 功能从需求定义、方案设计到上线迭代的全流程，重点考察大模型能力边界认知、评测方法、数据驱动迭代与跨团队推动能力',
  hard_skills: ['大模型应用产品设计', 'Prompt 工程与效果调优', 'RAG/评测体系搭建', '需求分析与 PRD 撰写', '数据分析（SQL/Python）'],
  soft_skills: ['跨团队协作', '沟通表达', '快速学习', 'Ownership'],
  keywords: ['AI', '大模型', 'Prompt', 'RAG', '评测', 'PRD', '数据分析', '从0到1', '用户增长'],
  implied: [
    { name: '数据驱动决策', confidence: '高', note: 'JD 多处强调指标与数据验证' },
    { name: '0-1 产品能力', confidence: '中', note: '提及负责新功能从 0 到 1 搭建' },
    { name: '技术沟通能力', confidence: '中', note: '需与算法工程师协同定义方案' },
  ],
}

const p3 = {
  selection: [
    { exp_id: 'exp_1', decision: 'strong', reason: '智能会议助手是完整的 AI 产品 0-1 案例，与 JD 的核心要求直接对应' },
    { exp_id: 'exp_2', decision: 'keep', reason: '意图识别与数据分析经历支撑「数据驱动」考察点' },
    { exp_id: 'exp_3', decision: 'drop', reason: '校园小程序项目与 AI 产品岗位相关度低，为实习生简历腾出篇幅' },
  ],
  resume_md: `# 张小雨
求职意向：AI 产品经理 ｜ 138****0000 ｜ zhangxiaoyu@demo.com

## 教育背景
**某某大学** · 信息与通信工程 · 本科（2020.09 - 2024.06）

## 实习经历
**星澜科技（示例数据）** · AI 产品实习生（2025.11 - 2026.04）
- ==负责智能会议助手从 0 到 1 的产品设计与上线，完成竞品调研、MVP 功能定义与交互原型，产品已上线公司内部大模型平台==
- 构建会议纪要生成评测体系：设计 6 个评测维度、组织标注 600 分钟测试数据，输出可复用的评测 SOP
- 设计会议纪要生成 Prompt，多轮迭代使自部署模型效果接近闭源模型

**云端数据（示例数据）** · 数据产品实习生（2025.04 - 2025.07）
- 基于 800+ 条历史问答数据分析用户意图分布，完成智能客服产品路线规划
- 独立推进 10+ 个意图识别需求全流程，用户进线转人工率降低 10%+

## 技能
- 产品：PRD 撰写、竞品分析、评测体系设计、Axure
- 数据：SQL、Python、Tableau
- AI：Prompt 工程、RAG 评测、Claude Code、Dify`,
  changes: [
    {
      location: '实习经历 · 星澜科技 · 第 1 条',
      before: '负责智能会议助手从 0 到 1 的产品设计与上线，完成竞品调研、MVP 功能定义与交互原型设计',
      after: '负责智能会议助手从 0 到 1 的产品设计与上线，完成竞品调研、MVP 功能定义与交互原型，产品已上线公司内部大模型平台',
      reason: '补上「已上线」的落地结果，对齐 JD 中「从 0 到 1 搭建」关键词',
    },
  ],
  gaps: [
    {
      requirement: 'RAG 系统搭建经验',
      note: '经历库中只有 RAG 评测相关证据；建议面试中以评测体系经验迁移说明，或后续补充相关实践',
    },
  ],
}

const p4 = {
  resume_md: `# 张小雨
求职意向：AI 产品经理 ｜ 138****0000 ｜ zhangxiaoyu@demo.com

## 教育背景
**某某大学** · 信息与通信工程 · 本科（2020.09 - 2024.06）

## 实习经历
**星澜科技（示例数据）** · AI 产品实习生（2025.11 - 2026.04）
- 负责智能会议助手从 0 到 1 的产品设计与上线，完成竞品调研、MVP 功能定义与交互原型，产品已上线公司内部大模型平台
- 构建会议纪要生成评测体系：设计 6 个评测维度、组织标注 600 分钟测试数据，输出可复用的评测 SOP
- 设计会议纪要生成 Prompt，多轮迭代使自部署模型效果接近闭源模型
- ==协同算法工程师定位 badcase 并推动底库去重等链路优化，RAG 检索准确率提升 15%==

**云端数据（示例数据）** · 数据产品实习生（2025.04 - 2025.07）
- 基于 800+ 条历史问答数据分析用户意图分布，完成智能客服产品路线规划
- 独立推进 10+ 个意图识别需求全流程，用户进线转人工率降低 10%+

## 技能
- 产品：PRD 撰写、竞品分析、评测体系设计、Axure
- 数据：SQL、Python、Tableau
- AI：Prompt 工程、RAG 评测、Claude Code、Dify`,
  changes: [
    {
      location: '实习经历 · 星澜科技 · 新增第 4 条',
      before: '（无）',
      after: '协同算法工程师定位 badcase 并推动底库去重等链路优化，RAG 检索准确率提升 15%',
      reason: '按指令「突出 RAG 相关经历」，从经历库 exp_1 提取该要点并前置量化结果',
    },
  ],
}

const canned: Record<PromptKind, unknown> = { p1, p2, p3, p4 }

export function demoReply(kind: PromptKind): string {
  return JSON.stringify(canned[kind], null, 2)
}
