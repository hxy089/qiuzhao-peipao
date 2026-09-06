import checklistRaw from './knowledge/pm-resume-checklist.md?raw'
import patternsRaw from './knowledge/pm-jd-patterns.md?raw'
import { Application, Candidate, Experience, JDAnalysis, Version } from './types'

export const KB_VERSION = 'v0.1-手写首版'

const KB_BLOCK = `【PM 求职领域知识库】（分析任何 JD 与简历时，遵循其中的行业常识与写法规范）：

<pm_resume_checklist>
${checklistRaw}
</pm_resume_checklist>

<pm_jd_patterns>
${patternsRaw}
</pm_jd_patterns>`

const BASE_RULES = `你是「秋招陪跑 AI 工作台」的核心引擎，服务对象是中国产品经理求职者。

通用硬性规则（防幻觉约束）：
1. 所有事实、数字、时间必须来自输入材料原文，禁止编造或推测数据
2. 只允许重组、措辞优化、顺序调整、相关内容突出
3. 经历库无法支撑的要求，放入 gaps，绝不写进简历
4. 只输出 JSON，不要输出 JSON 之外的任何解释文字

${KB_BLOCK}`

/** P1 经历库提取与合并：1-3 份简历文本 → 结构化经历库 */
export function p1Prompt(texts: { name: string; content: string }[]): {
  kind: 'p1'
  system: string
  user: string
} {
  return {
    kind: 'p1',
    system: `${BASE_RULES}

任务：从用户提供的 1-3 份简历文本中提取求职者画像与全部经历，合并成一份结构化经历库。

输出 JSON 结构：
{"candidate":{"name":"","phone":"","email":"","education":[{"school":"","degree":"","major":"","start":"YYYY.MM","end":"YYYY.MM"}]},"experiences":[{"id":"exp_1","type":"实习|项目|校园|竞赛|开源","org":"","role":"","start":"YYYY.MM","end":"YYYY.MM 或 至今","bullets":[{"id":"b_1","text":"原文拆条"}],"sourceFiles":["简历文件名"]}]}

规则：
- 同公司+同岗位+时间段重叠视为同一段经历，合并为一条；bullets 取并集去重，保留更完整的表述
- experiences 按 start 时间倒序
- bullets 将原文经历描述拆成独立要点，每条一个点，保留原文的数字与事实
- 不翻译、不改写、不补充原文没有的内容；识别不到的字段留空字符串
- id 从 exp_1、b_1 开始递增`,
    user: texts.map(t => `<resume name="${t.name}">\n${t.content}\n</resume>`).join('\n\n'),
  }
}

/** P2 JD 分析：JD 全文 → 要求拆解 */
export function p2Prompt(app: Application): {
  kind: 'p2'
  system: string
  user: string
} {
  return {
    kind: 'p2',
    system: `${BASE_RULES}

任务：分析一份岗位 JD，拆解招聘方的真实要求。

输出 JSON 结构：
{"role_summary":"一段话概括这个岗位考察什么","hard_skills":["硬性要求"],"soft_skills":["软性要求"],"keywords":["中英文关键词，用于简历命中"],"implied":[{"name":"隐含考察点","confidence":"高|中|低","note":"判断依据"}]}

规则：
- JD 未提及的内容不要臆测为要求
- 对模糊表述结合知识库给出解读，并标注置信度
- keywords 覆盖 JD 中反复出现或处于要求核心的词`,
    user: `<jd>\n公司：${app.company || '未填写'}\n岗位：${app.position || '未填写'}\n${app.jdText}\n</jd>`,
  }
}

/** P3 经历匹配 + 组装：JD 分析 + 经历库 → 定制简历 */
export function p3Prompt(
  app: Application,
  jd: JDAnalysis,
  profile: Candidate | null,
  exps: Experience[],
): { kind: 'p3'; system: string; user: string } {
  return {
    kind: 'p3',
    system: `${BASE_RULES}

任务：基于 JD 分析结果与经历库，完成经历取舍并组装出针对该 JD 的定制简历。

输出 JSON 结构：
{"selection":[{"exp_id":"","decision":"strong|keep|drop","reason":"一句话理由"}],"resume_md":"完整简历 markdown","changes":[{"location":"","before":"","after":"","reason":""}],"gaps":[{"requirement":"","note":""}]}

规则：
- selection：对经历库中每段经历给出 strong（强相关，重点突出）/ keep（相关，保留）/ drop（不相关，舍弃）与理由
- resume_md 结构：# 姓名 → 联系方式行 → ## 教育背景 → ## 实习经历 → ## 项目/校园经历 → ## 技能；drop 的经历不得出现
- 简历中的 bullet 应自然复现 JD keywords、突出量化结果、按相关度排序；被改写的 bullet 整条用 ==...== 包裹
- 姓名/联系方式/教育背景来自 candidate；缺失的联系方式用【请补充手机号】【请补充邮箱】占位
- changes 逐条列出改动（location、before、after、reason）
- gaps 只列 JD 要求但经历库无法支撑的点，note 给出求职者可行动的建议`,
    user: `<jd_analysis>\n${JSON.stringify(jd, null, 2)}\n</jd_analysis>\n\n<profile>\n${JSON.stringify(profile ?? {}, null, 2)}\n</profile>\n\n<experiences>\n${JSON.stringify(exps, null, 2)}\n</experiences>`,
  }
}

/** P4 对话式迭代：当前简历 + 指令 → 更新后简历 */
export function p4Prompt(
  ver: Version,
  app: Application,
  exps: Experience[],
  instruction: string,
): { kind: 'p4'; system: string; user: string } {
  return {
    kind: 'p4',
    system: `${BASE_RULES}

任务：根据用户指令修改当前定制简历。

输出 JSON 结构：
{"resume_md":"修改后的完整简历 markdown","changes":[{"location":"","before":"","after":"","reason":""}]}

规则：
- 只做指令要求的修改，其余内容原样保留
- 继续遵守防幻觉约束
- 本次被修改的 bullet 整条用 ==...== 包裹，之前已标记的保留原状`,
    user: `【目标岗位】${app.position || '未填写'} @ ${app.company || '未填写'}
【JD 分析摘要】${app.jdAnalysis ? JSON.stringify(app.jdAnalysis) : '无'}
【经历库摘要】
${exps.map(e => `- ${e.org} ${e.role}（${e.start} - ${e.end}）`).join('\n') || '（空）'}

【当前简历】
${ver.content}

【用户指令】${instruction}`,
  }
}
