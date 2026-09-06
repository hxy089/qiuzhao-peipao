export interface Bullet {
  id: string
  text: string
}

export interface Experience {
  id: string
  type: string // 实习 | 项目 | 校园 | 竞赛 | 开源 | 其他
  org: string
  role: string
  start: string // YYYY.MM
  end: string // YYYY.MM 或 至今
  bullets: Bullet[]
  sourceFiles: string[]
  updatedAt: number
}

export interface Education {
  school: string
  degree: string
  major: string
  start: string
  end: string
}

export interface Candidate {
  name: string
  phone: string
  email: string
  education: Education[]
}

export interface JDAnalysis {
  role_summary: string
  hard_skills: string[]
  soft_skills: string[]
  keywords: string[]
  implied: { name: string; confidence: string; note: string }[]
}

export type Decision = 'strong' | 'keep' | 'drop'

export interface Selection {
  exp_id: string
  decision: Decision
  reason: string
}

export interface ChangeItem {
  location: string
  before: string
  after: string
  reason: string
}

export interface GapItem {
  requirement: string
  note: string
}

export interface AssembleResult {
  selection: Selection[]
  resume_md: string
  changes: ChangeItem[]
  gaps: GapItem[]
}

export interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface Application {
  id: string
  company: string
  position: string
  jdText: string
  jdAnalysis: JDAnalysis | null
  createdAt: number
}

export interface Version {
  id: string
  applicationId: string
  content: string // 简历 markdown 全文
  changes: ChangeItem[]
  gaps?: GapItem[]
  selection?: Selection[]
  chat: ChatMsg[]
  createdAt: number
  updatedAt: number
}

export interface Settings {
  apiKey: string
  baseUrl: string
  model: string
  demoMode: boolean
  kbVersion: string
}

export interface Metrics {
  openCount: number
  jdAnalyzedCount: number
  versionsCreated: number
  exportsCount: number
  lastActive: number
}
