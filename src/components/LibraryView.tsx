import { Dispatch, SetStateAction, useRef, useState } from 'react'
import { Candidate, Experience, Settings } from '../types'
import { callLLMJSON } from '../llm'
import { p1Prompt } from '../prompts'
import { extractPdfText } from '../utils/pdf'
import { uid } from '../storage'

interface P1Result {
  candidate?: {
    name?: string
    phone?: string
    email?: string
    education?: Candidate['education']
  }
  experiences?: Array<Partial<Experience>>
}

interface Staged {
  name: string
  content: string
}

interface Props {
  settings: Settings
  profile: Candidate | null
  setProfile: Dispatch<SetStateAction<Candidate | null>>
  experiences: Experience[]
  setExperiences: Dispatch<SetStateAction<Experience[]>>
  goWorkspace: () => void
}

const EXP_TYPES = ['实习', '项目', '校园', '竞赛', '开源', '其他']

const expTypeClass = (t: string) =>
  t === '实习' ? 'intern' : t === '项目' ? 'proj' : t === '校园' ? 'campus' : 'other'

function serializeEducation(edu: Candidate['education']): string {
  return edu.map(e => [e.school, e.degree, e.major, `${e.start}-${e.end}`].join('｜')).join('\n')
}

function parseEducation(text: string): Candidate['education'] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const parts = l.split(/[｜|]/).map(p => p.trim())
      const period = (parts[3] ?? '').split('-')
      return {
        school: parts[0] ?? '',
        degree: parts[1] ?? '',
        major: parts[2] ?? '',
        start: (period[0] ?? '').trim(),
        end: (period[1] ?? '').trim(),
      }
    })
}

interface EditForm {
  type: string
  org: string
  role: string
  start: string
  end: string
  bulletsText: string
}

function ExpEditor({
  exp,
  onSave,
  onCancel,
}: {
  exp: Experience
  onSave: (id: string, form: EditForm) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    type: exp.type,
    org: exp.org,
    role: exp.role,
    start: exp.start,
    end: exp.end,
    bulletsText: exp.bullets.map(b => b.text).join('\n'),
  })
  const set = (k: keyof EditForm) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="card exp-card editing">
      <div className="edit-grid">
        <select value={form.type} onChange={set('type')}>
          {EXP_TYPES.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input value={form.org} onChange={set('org')} placeholder="组织/公司" />
        <input value={form.role} onChange={set('role')} placeholder="角色" />
        <input value={form.start} onChange={set('start')} placeholder="开始 YYYY.MM" />
        <input value={form.end} onChange={set('end')} placeholder="结束 YYYY.MM / 至今" />
      </div>
      <textarea
        rows={Math.max(3, form.bulletsText.split('\n').length + 1)}
        value={form.bulletsText}
        onChange={set('bulletsText')}
        placeholder="每行一条要点，保留原文数字与事实"
      />
      <div className="row end">
        <button className="sm" onClick={onCancel}>
          取消
        </button>
        <button className="primary sm" onClick={() => onSave(exp.id, form)}>
          保存
        </button>
      </div>
    </div>
  )
}

export default function LibraryView({
  settings,
  profile,
  setProfile,
  experiences,
  setExperiences,
  goWorkspace,
}: Props) {
  const [staged, setStaged] = useState<Staged[]>([])
  const [paste, setPaste] = useState('')
  const [busy, setBusy] = useState<'' | 'parse' | 'extract'>('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [pf, setPf] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
  })
  const [eduText, setEduText] = useState(serializeEducation(profile?.education ?? []))
  const fileRef = useRef<HTMLInputElement>(null)

  const hasLibrary = experiences.length > 0

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const list = Array.from(files)
      .filter(f => f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, Math.max(0, 3 - staged.length))
    if (!list.length) {
      setError('最多上传 3 份 PDF 简历')
      return
    }
    setBusy('parse')
    try {
      for (const f of list) {
        const content = await extractPdfText(f)
        if (!content || content.replace(/\s/g, '').length < 30) {
          setError(`「${f.name}」解析不到文本（可能是图片型 PDF），请改用粘贴文本`)
          continue
        }
        setStaged(s => [...s, { name: f.name, content }])
      }
    } catch (e) {
      setError(`PDF 解析失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function build() {
    const texts = [...staged]
    if (paste.trim()) texts.push({ name: '粘贴文本', content: paste.trim() })
    if (!texts.length) {
      setError('请先上传 PDF 或粘贴简历文本')
      return
    }
    if (hasLibrary && !window.confirm('经历库已存在，继续将覆盖现有经历库，确认？')) return
    setError('')
    setBusy('extract')
    try {
      const res = await callLLMJSON<P1Result>(p1Prompt(texts), settings)
      const exps: Experience[] = (res.experiences ?? [])
        .map((e, i) => ({
          id: e.id || uid('exp'),
          type: e.type || '其他',
          org: e.org || '',
          role: e.role || '',
          start: e.start || '',
          end: e.end || '',
          bullets: (e.bullets ?? []).map((b, j) => ({ id: b.id || uid('b'), text: b?.text || '' })),
          sourceFiles: e.sourceFiles ?? texts.map(t => t.name),
          updatedAt: Date.now() + i,
        }))
        .sort((a, b) => (b.start || '').localeCompare(a.start || ''))
      const cand: Candidate = {
        name: res.candidate?.name ?? '',
        phone: res.candidate?.phone ?? '',
        email: res.candidate?.email ?? '',
        education: Array.isArray(res.candidate?.education) ? res.candidate!.education : [],
      }
      setProfile(cand)
      setExperiences(exps)
      setStaged([])
      setPaste('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  function saveEdit(id: string, form: EditForm) {
    setExperiences(list =>
      list.map(e =>
        e.id === id
          ? {
              ...e,
              type: form.type,
              org: form.org,
              role: form.role,
              start: form.start,
              end: form.end,
              bullets: form.bulletsText
                .split('\n')
                .map(t => t.trim())
                .filter(Boolean)
                .map((t, i) => ({ id: `${e.id}_b${i + 1}`, text: t })),
              updatedAt: Date.now(),
            }
          : e,
      ),
    )
    setEditingId(null)
  }

  function saveProfile() {
    setProfile({
      name: pf.name.trim(),
      phone: pf.phone.trim(),
      email: pf.email.trim(),
      education: parseEducation(eduText),
    })
    setEditingProfile(false)
  }

  return (
    <div className="library">
      <div className="lib-inner">
        {error && <div className="error banner">{error}</div>}

        {!hasLibrary && (
          <div className="hero card">
            <h1>先建你的经历库</h1>
            <p className="muted">
              上传 1~3 份不同时期的历史简历（PDF），AI 会合并去重、按时间排序，生成结构化经历时间线。
              之后每次投递，只需粘贴 JD，AI 自动完成经历取舍与定制改写。
            </p>
            {settings.demoMode && (
              <p className="hint">当前为演示模式：构建会返回示例数据。正式使用请在「设置」中关闭演示模式并填入 API Key。</p>
            )}
            <div className="upload-row">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                hidden
                onChange={e => onFiles(e.target.files)}
              />
              <button className="primary" disabled={busy !== ''} onClick={() => fileRef.current?.click()}>
                上传 PDF 简历（最多 3 份）
              </button>
              {busy === 'parse' && <span className="muted">解析中…</span>}
              {staged.length > 0 && <span className="muted">已选择 {staged.length} 份</span>}
            </div>
            <textarea
              placeholder="或粘贴简历全文（图片型 PDF 请用这里）"
              rows={6}
              value={paste}
              onChange={e => setPaste(e.target.value)}
            />
            <button
              className="primary block"
              disabled={busy !== '' || (!staged.length && !paste.trim())}
              onClick={build}
            >
              {busy === 'extract' ? 'AI 构建经历库中…' : '构建经历库'}
            </button>
          </div>
        )}

        {hasLibrary && (
          <>
            <div className="card">
              <div className="card-head">
                <b>求职者信息</b>
                {editingProfile ? (
                  <>
                    <button className="primary sm" onClick={saveProfile}>
                      保存
                    </button>
                    <button
                      className="sm"
                      onClick={() => {
                        setEditingProfile(false)
                        setPf({ name: profile?.name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '' })
                        setEduText(serializeEducation(profile?.education ?? []))
                      }}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    className="sm"
                    onClick={() => {
                      setPf({ name: profile?.name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '' })
                      setEduText(serializeEducation(profile?.education ?? []))
                      setEditingProfile(true)
                    }}
                  >
                    编辑
                  </button>
                )}
              </div>
              {!editingProfile ? (
                <div>
                  <p>
                    {profile?.name || '未填写姓名'} · {profile?.phone || '未填手机'} · {profile?.email || '未填邮箱'}
                  </p>
                  {(profile?.education ?? []).map((ed, i) => (
                    <p key={i} className="muted">
                      {ed.school} · {ed.degree} · {ed.major}（{ed.start} - {ed.end}）
                    </p>
                  ))}
                </div>
              ) : (
                <div className="profile-form">
                  <div className="edit-grid">
                    <input value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} placeholder="姓名" />
                    <input value={pf.phone} onChange={e => setPf({ ...pf, phone: e.target.value })} placeholder="手机号" />
                    <input value={pf.email} onChange={e => setPf({ ...pf, email: e.target.value })} placeholder="邮箱" />
                  </div>
                  <textarea
                    rows={3}
                    value={eduText}
                    onChange={e => setEduText(e.target.value)}
                    placeholder={'教育背景，每行一条：学校｜学历｜专业｜2020.09-2024.06'}
                  />
                </div>
              )}
            </div>

            <div className="card-head section-head">
              <b>经历时间线（{experiences.length} 段）</b>
              <div className="grow" />
              <button
                className="sm"
                onClick={() => {
                  if (window.confirm('重建将清空现有经历库并回到上传页，确认？')) setExperiences([])
                }}
              >
                重建经历库
              </button>
              <button className="primary sm" onClick={goWorkspace}>
                去工作台 →
              </button>
            </div>

            <div className="timeline">
              {experiences.map(exp =>
                editingId === exp.id ? (
                  <ExpEditor key={exp.id} exp={exp} onSave={saveEdit} onCancel={() => setEditingId(null)} />
                ) : (
                  <div key={exp.id} className="card exp-card">
                    <div className="card-head">
                      <span className={`badge type ${expTypeClass(exp.type)}`}>{exp.type || '经历'}</span>
                      <b>{exp.org || '未知组织'}</b>
                      <span>{exp.role}</span>
                      <span className="muted">
                        {exp.start} - {exp.end}
                      </span>
                      <span className="grow" />
                      <span className="muted src">来自 {exp.sourceFiles.join('、')}</span>
                      <button className="sm" onClick={() => setEditingId(exp.id)}>
                        编辑
                      </button>
                      <button
                        className="sm danger"
                        onClick={() => setExperiences(list => list.filter(x => x.id !== exp.id))}
                      >
                        删除
                      </button>
                    </div>
                    <ul className="bullets">
                      {exp.bullets.map(b => (
                        <li key={b.id}>{b.text}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
