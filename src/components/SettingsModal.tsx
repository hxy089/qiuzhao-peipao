import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Metrics, Settings } from '../types'
import { storage } from '../storage'
import { KB_VERSION } from '../prompts'

interface Props {
  settings: Settings
  setSettings: Dispatch<SetStateAction<Settings>>
  metrics: Metrics
  onClose: () => void
}

export default function SettingsModal({ settings, setSettings, metrics, onClose }: Props) {
  const [draft, setDraft] = useState<Settings>(settings)

  // 改动即存：任何字段变化立即同步回 App 并持久化到 localStorage，不依赖「保存」按钮
  useEffect(() => {
    setSettings({ ...draft, kbVersion: KB_VERSION })
  }, [draft, setSettings])

  function exportAll() {
    const blob = new Blob([JSON.stringify(storage.exportAll(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qiuzhao-peipao-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearAll() {
    if (!window.confirm('确定清空所有本地数据（经历库、投递、版本、设置）？此操作不可恢复。')) return
    storage.clearAll()
    window.location.reload()
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>设置</h2>
        <p className="hint" style={{ marginBottom: 10 }}>
          ✅ 所有改动自动保存到本浏览器，下次打开无需重新输入；点击弹窗外任意处即可关闭。
        </p>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.demoMode}
            onChange={e => setDraft({ ...draft, demoMode: e.target.checked })}
          />
          演示模式（使用内置示例数据，不调用 API）
        </label>

        {!draft.demoMode && (
          <>
            <label>
              API Base URL（OpenAI 兼容接口）
              <input
                value={draft.baseUrl}
                onChange={e => setDraft({ ...draft, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </label>
            <label>
              模型
              <input
                value={draft.model}
                onChange={e => setDraft({ ...draft, model: e.target.value })}
                placeholder="gpt-4o-mini / deepseek-chat / qwen-plus …"
              />
            </label>
            <label>
              API Key（只保存在你的浏览器 localStorage，不会上传）
              <input
                type="password"
                value={draft.apiKey}
                onChange={e => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="sk-…"
              />
            </label>
          </>
        )}

        <div className="metrics">
          <div className="metric">
            <b>{metrics.openCount}</b>
            <span>打开次数</span>
          </div>
          <div className="metric">
            <b>{metrics.jdAnalyzedCount}</b>
            <span>JD 分析次数</span>
          </div>
          <div className="metric">
            <b>{metrics.versionsCreated}</b>
            <span>生成版本数</span>
          </div>
          <div className="metric">
            <b>{metrics.exportsCount}</b>
            <span>导出次数</span>
          </div>
          <div className="metric">
            <b>{KB_VERSION.split('-')[0]}</b>
            <span>知识库版本</span>
          </div>
          <div className="metric">
            <b>{metrics.lastActive ? new Date(metrics.lastActive).toLocaleDateString('zh-CN') : '-'}</b>
            <span>最近活跃</span>
          </div>
        </div>

        <div className="row">
          <button onClick={exportAll}>导出全部数据 (JSON)</button>
          <button className="danger" onClick={clearAll}>
            清空所有数据
          </button>
        </div>
        <div className="row end">
          <button className="primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
