import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import {
  Application,
  AssembleResult,
  Candidate,
  ChangeItem,
  Experience,
  JDAnalysis,
  Settings,
  Version,
} from '../types'
import { callLLMJSON } from '../llm'
import { p2Prompt, p3Prompt, p4Prompt } from '../prompts'
import { uid } from '../storage'
import { stripMarks } from '../utils/md'
import MarkdownView from './MarkdownView'

interface Props {
  settings: Settings
  profile: Candidate | null
  experiences: Experience[]
  applications: Application[]
  setApplications: Dispatch<SetStateAction<Application[]>>
  versions: Version[]
  setVersions: Dispatch<SetStateAction<Version[]>>
  bump: (k: 'jdAnalyzedCount' | 'versionsCreated' | 'exportsCount') => void
  goLibrary: () => void
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function WorkspaceView({
  settings,
  profile,
  experiences,
  applications,
  setApplications,
  versions,
  setVersions,
  bump,
  goLibrary,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [jd, setJd] = useState('')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [viewVerId, setViewVerId] = useState<string | null>(null)
  const [busy, setBusy] = useState<'' | 'jd' | 'assemble' | 'chat'>('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'req' | 'sel' | 'gap'>('req')
  const [highlight, setHighlight] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (selectedAppId === null && applications.length) setSelectedAppId(applications[0].id)
  }, [applications, selectedAppId])

  useEffect(() => {
    setViewVerId(null)
  }, [selectedAppId])

  const app = applications.find(a => a.id === selectedAppId) ?? null
  const appVersions = useMemo(
    () =>
      versions
        .filter(v => v.applicationId === selectedAppId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [versions, selectedAppId],
  )
  const viewVer = appVersions.find(v => v.id === viewVerId) ?? appVersions[0] ?? null

  async function runAnalysis(target: Application) {
    setError('')
    try {
      setBusy('jd')
      const analysis = await callLLMJSON<JDAnalysis>(p2Prompt(target), settings)
      bump('jdAnalyzedCount')
      const updated = { ...target, jdAnalysis: analysis }
      setApplications(list => list.map(a => (a.id === target.id ? updated : a)))
      if (!experiences.length) {
        setError('经历库为空：请先到「经历库」页构建经历库，再回来分析')
        return
      }
      setBusy('assemble')
      const p3 = await callLLMJSON<AssembleResult>(p3Prompt(updated, analysis, profile, experiences), settings)
      const ver: Version = {
        id: uid('ver'),
        applicationId: target.id,
        content: p3.resume_md || '',
        changes: Array.isArray(p3.changes) ? p3.changes : [],
        gaps: Array.isArray(p3.gaps) ? p3.gaps : [],
        selection: Array.isArray(p3.selection) ? p3.selection : [],
        chat: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setVersions(list => [...list, ver])
      setViewVerId(null)
      bump('versionsCreated')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  async function createApp() {
    const jdText = jd.trim()
    if (!jdText) {
      setError('请粘贴 JD 全文')
      return
    }
    if (jdText.length < 50) {
      setError('JD 内容过短（少于 50 字），请确认粘贴完整')
      return
    }
    setError('')
    const newApp: Application = {
      id: uid('app'),
      company: company.trim(),
      position: position.trim(),
      jdText,
      jdAnalysis: null,
      createdAt: Date.now(),
    }
    setApplications(list => [newApp, ...list])
    setSelectedAppId(newApp.id)
    setShowForm(false)
    setCompany('')
    setPosition('')
    setJd('')
    await runAnalysis(newApp)
  }

  async function sendChat() {
    if (!viewVer || !app || !chatInput.trim() || busy === 'chat') return
    const instruction = chatInput.trim()
    setChatInput('')
    setBusy('chat')
    const userMsg = { role: 'user' as const, content: instruction, ts: Date.now() }
    try {
      const res = await callLLMJSON<{ resume_md: string; changes: ChangeItem[] }>(
        p4Prompt(viewVer, app, experiences, instruction),
        settings,
      )
      const aiMsg = {
        role: 'assistant' as const,
        content: `已更新简历（${res.changes?.length ?? 0} 处改动）`,
        ts: Date.now(),
      }
      setVersions(list =>
        list.map(v =>
          v.id === viewVer.id
            ? {
                ...v,
                content: res.resume_md || v.content,
                changes: [...v.changes, ...(Array.isArray(res.changes) ? res.changes : [])],
                chat: [...v.chat, userMsg, aiMsg],
                updatedAt: Date.now(),
              }
            : v,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setVersions(list => list.map(v => (v.id === viewVer.id ? { ...v, chat: [...v.chat, userMsg] } : v)))
    } finally {
      setBusy('')
    }
  }

  async function copyResume() {
    if (!viewVer) return
    try {
      await navigator.clipboard.writeText(stripMarks(viewVer.content))
      bump('exportsCount')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('复制失败，请手动选择文本复制')
    }
  }

  function snapshot() {
    if (!viewVer) return
    const snap: Version = { ...viewVer, id: uid('ver'), chat: [], createdAt: Date.now(), updatedAt: Date.now() }
    setVersions(list => [...list, snap])
    setViewVerId(snap.id)
  }

  const jdA = app?.jdAnalysis ?? null

  return (
    <div className="ws">
      {error && <div className="error banner">{error}</div>}
      <div className="ws-grid">
        <aside className="ws-left">
          <button className="primary block" onClick={() => setShowForm(s => !s)}>
            ＋ 新建投递
          </button>
          {showForm && (
            <div className="card form">
              <input placeholder="公司名（可选）" value={company} onChange={e => setCompany(e.target.value)} />
              <input placeholder="岗位名（可选）" value={position} onChange={e => setPosition(e.target.value)} />
              <textarea
                placeholder="粘贴 JD 全文（必填）"
                rows={8}
                value={jd}
                onChange={e => setJd(e.target.value)}
              />
              <button className="primary block" disabled={busy !== ''} onClick={createApp}>
                {busy === 'jd' ? 'AI 分析 JD…' : busy === 'assemble' ? 'AI 组装简历…' : '开始分析并生成简历'}
              </button>
            </div>
          )}
          <div className="app-list">
            {applications.length === 0 && <div className="empty small">还没有投递记录</div>}
            {applications.map(a => (
              <div
                key={a.id}
                className={a.id === selectedAppId ? 'app-item active' : 'app-item'}
                onClick={() => setSelectedAppId(a.id)}
              >
                <div className="app-item-title">{a.position || '未填岗位'}</div>
                <div className="app-item-sub">
                  {a.company || '未填公司'} · {fmtTime(a.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="ws-mid">
          {!app && <div className="empty">在左侧新建投递，粘贴 JD 开始</div>}
          {app && !experiences.length && busy === '' && (
            <div className="error banner">
              经历库为空，
              <button className="link" onClick={goLibrary}>
                去经历库页构建 →
              </button>
            </div>
          )}
          {app && busy === 'jd' && <div className="loading">AI 正在分析 JD…</div>}
          {app && busy === 'assemble' && <div className="loading">AI 正在取舍经历并组装简历…</div>}
          {app && jdA && busy === '' && (
            <div className="card">
              <div className="card-head">
                <b>JD 分析</b>
                <span className="grow" />
                <button className="sm" onClick={() => runAnalysis(app)}>
                  重新分析
                </button>
              </div>
              <div className="tabs">
                <button className={tab === 'req' ? 'tab active' : 'tab'} onClick={() => setTab('req')}>
                  要求拆解
                </button>
                <button className={tab === 'sel' ? 'tab active' : 'tab'} onClick={() => setTab('sel')}>
                  经历取舍
                </button>
                <button className={tab === 'gap' ? 'tab active' : 'tab'} onClick={() => setTab('gap')}>
                  缺口分析
                </button>
              </div>
              {tab === 'req' && (
                <div className="analysis">
                  <p className="summary">{jdA.role_summary}</p>
                  <h4>硬性要求</h4>
                  <ul>
                    {(jdA.hard_skills ?? []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <h4>软性要求</h4>
                  <ul>
                    {(jdA.soft_skills ?? []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <h4>关键词</h4>
                  <div className="chips">
                    {(jdA.keywords ?? []).map((k, i) => (
                      <span key={i} className="chip">
                        {k}
                      </span>
                    ))}
                  </div>
                  <h4>隐含考察点</h4>
                  <ul>
                    {(jdA.implied ?? []).map((im, i) => (
                      <li key={i}>
                        <b>{im.name}</b>（{im.confidence}）— {im.note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === 'sel' && (
                <>
                  {viewVer?.selection?.length ? (
                    <ul className="sel-list">
                      {viewVer.selection.map(s => {
                        const exp = experiences.find(e => e.id === s.exp_id)
                        return (
                          <li key={s.exp_id}>
                            <span className={`badge ${s.decision}`}>
                              {s.decision === 'strong' ? '强相关' : s.decision === 'keep' ? '保留' : '舍弃'}
                            </span>
                            <span className="sel-exp">{exp ? `${exp.org} · ${exp.role}` : s.exp_id}</span>
                            <span className="sel-reason">{s.reason}</span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="empty small">暂无取舍数据</div>
                  )}
                </>
              )}
              {tab === 'gap' && (
                <>
                  {viewVer?.gaps?.length ? (
                    <ul className="gap-list">
                      {viewVer.gaps.map((g, i) => (
                        <li key={i}>
                          <b>{g.requirement}</b>
                          <p>{g.note}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty small">没有发现缺口 🎉</div>
                  )}
                </>
              )}
            </div>
          )}
          {viewVer && (
            <div className="card resume-card">
              <div className="resume-toolbar">
                <select value={viewVer.id} onChange={e => setViewVerId(e.target.value)}>
                  {appVersions.map((v, i) => (
                    <option key={v.id} value={v.id}>
                      版本{appVersions.length - i} · {fmtTime(v.createdAt)}
                    </option>
                  ))}
                </select>
                <label className="check">
                  <input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} />
                  改动高亮
                </label>
                <button onClick={copyResume}>{copied ? '已复制 ✓' : '复制'}</button>
                <button onClick={() => window.print()}>打印 / 导出 PDF</button>
                <button onClick={snapshot}>另存快照</button>
              </div>
              <MarkdownView md={viewVer.content} highlight={highlight} className="resume md-body print-area" />
            </div>
          )}
        </section>

        <aside className="ws-right">
          <div className="card chat-card">
            <h3>AI 对话修改</h3>
            {!viewVer ? (
              <div className="empty small">生成简历后，可在这里用自然语言持续修改</div>
            ) : (
              <>
                <div className="chat-list">
                  {viewVer.chat.length === 0 && (
                    <div className="empty small">试试：「突出数据分析能力」「更精炼」「删掉校园经历」</div>
                  )}
                  {viewVer.chat.map((m, i) => (
                    <div key={i} className={`bubble ${m.role}`}>
                      {m.content}
                    </div>
                  ))}
                  {busy === 'chat' && <div className="loading">AI 修改中…</div>}
                </div>
                <div className="chat-input">
                  <textarea
                    placeholder="输入修改指令，回车发送（Shift+回车换行）"
                    rows={3}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendChat()
                      }
                    }}
                  />
                  <button className="primary" disabled={busy !== ''} onClick={sendChat}>
                    发送
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
