import { KB_VERSION } from '../prompts'
import { Settings } from '../types'

interface Props {
  view: 'library' | 'workspace'
  setView: (v: 'library' | 'workspace') => void
  settings: Settings
  onOpenSettings: () => void
}

export default function TopBar({ view, setView, settings, onOpenSettings }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        🏃 秋招陪跑 <span className="sub">AI 工作台</span>
      </div>
      <nav>
        <button className={view === 'library' ? 'nav active' : 'nav'} onClick={() => setView('library')}>
          经历库
        </button>
        <button className={view === 'workspace' ? 'nav active' : 'nav'} onClick={() => setView('workspace')}>
          工作台
        </button>
      </nav>
      <div className="right">
        {settings.demoMode && (
          <span className="badge demo" title="演示模式使用内置示例数据，不调用 API。可在设置中关闭并填入自己的 API Key。" onClick={onOpenSettings}>
            演示模式
          </span>
        )}
        <span className="kb" title={`知识库版本：${KB_VERSION}`}>KB {settings.kbVersion || KB_VERSION}</span>
        <button className="gear" onClick={onOpenSettings}>
          ⚙ 设置
        </button>
      </div>
    </header>
  )
}
