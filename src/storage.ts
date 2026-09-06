import { Application, Candidate, Experience, Metrics, Settings, Version } from './types'

const KEYS = {
  profile: 'qp_profile',
  experiences: 'qp_experiences',
  applications: 'qp_applications',
  versions: 'qp_versions',
  settings: 'qp_settings',
  metrics: 'qp_metrics',
  privacy: 'qp_privacy_ack',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 写满：v0 忽略，设置页提供导出备份
  }
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  demoMode: true,
  kbVersion: '',
}

export const storage = {
  loadProfile: () => load<Candidate | null>(KEYS.profile, null),
  saveProfile: (v: Candidate | null) => save(KEYS.profile, v),

  loadExperiences: () => load<Experience[]>(KEYS.experiences, []),
  saveExperiences: (v: Experience[]) => save(KEYS.experiences, v),

  loadApplications: () => load<Application[]>(KEYS.applications, []),
  saveApplications: (v: Application[]) => save(KEYS.applications, v),

  loadVersions: () => load<Version[]>(KEYS.versions, []),
  saveVersions: (v: Version[]) => save(KEYS.versions, v),

  loadSettings: () => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(KEYS.settings, {}) }),
  saveSettings: (v: Settings) => save(KEYS.settings, v),

  loadMetrics: () =>
    load<Metrics>(KEYS.metrics, {
      openCount: 0,
      jdAnalyzedCount: 0,
      versionsCreated: 0,
      exportsCount: 0,
      lastActive: 0,
    }),
  saveMetrics: (v: Metrics) => save(KEYS.metrics, v),

  privacyAcked: () => localStorage.getItem(KEYS.privacy) === '1',
  ackPrivacy: () => localStorage.setItem(KEYS.privacy, '1'),

  exportAll: () => ({
    exportedAt: new Date().toISOString(),
    profile: load<Candidate | null>(KEYS.profile, null),
    experiences: load<Experience[]>(KEYS.experiences, []),
    applications: load<Application[]>(KEYS.applications, []),
    versions: load<Version[]>(KEYS.versions, []),
    settings: { ...load<Partial<Settings>>(KEYS.settings, {}), apiKey: '' }, // 导出不含 apiKey
    metrics: load<Metrics>(KEYS.metrics, {
      openCount: 0,
      jdAnalyzedCount: 0,
      versionsCreated: 0,
      exportsCount: 0,
      lastActive: 0,
    }),
  }),

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
