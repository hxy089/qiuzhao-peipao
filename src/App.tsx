import { useEffect, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import LibraryView from './components/LibraryView'
import WorkspaceView from './components/WorkspaceView'
import SettingsModal from './components/SettingsModal'
import { storage } from './storage'
import { KB_VERSION } from './prompts'
import { Application, Candidate, Experience, Metrics, Settings, Version } from './types'

export default function App() {
  const [view, setView] = useState<'library' | 'workspace'>('library')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(() => storage.loadSettings())
  const [profile, setProfile] = useState<Candidate | null>(() => storage.loadProfile())
  const [experiences, setExperiences] = useState<Experience[]>(() => storage.loadExperiences())
  const [applications, setApplications] = useState<Application[]>(() => storage.loadApplications())
  const [versions, setVersions] = useState<Version[]>(() => storage.loadVersions())
  const [metrics, setMetrics] = useState<Metrics>(() => storage.loadMetrics())
  const [privacyAck, setPrivacyAck] = useState(() => storage.privacyAcked())
  const opened = useRef(false)

  useEffect(() => {
    if (opened.current) return
    opened.current = true
    setMetrics(m => {
      const n = { ...m, openCount: m.openCount + 1, lastActive: Date.now() }
      storage.saveMetrics(n)
      return n
    })
    setSettings(s => (s.kbVersion ? s : { ...s, kbVersion: KB_VERSION }))
  }, [])

  useEffect(() => { storage.saveSettings(settings) }, [settings])
  useEffect(() => { storage.saveProfile(profile) }, [profile])
  useEffect(() => { storage.saveExperiences(experiences) }, [experiences])
  useEffect(() => { storage.saveApplications(applications) }, [applications])
  useEffect(() => { storage.saveVersions(versions) }, [versions])

  const bump = (k: 'jdAnalyzedCount' | 'versionsCreated' | 'exportsCount') => {
    setMetrics(m => {
      const n = { ...m, [k]: m[k] + 1, lastActive: Date.now() }
      storage.saveMetrics(n)
      return n
    })
  }

  function ackPrivacy() {
    storage.ackPrivacy()
    setPrivacyAck(true)
  }

  return (
    <div className="app">
      {!privacyAck && (
        <div className="privacy-bar">
          🔒 所有简历与投递数据仅保存在你自己的浏览器本地（localStorage），不会上传任何服务器。
          <button onClick={ackPrivacy}>知道了</button>
        </div>
      )}
      <TopBar view={view} setView={setView} settings={settings} onOpenSettings={() => setSettingsOpen(true)} />
      {view === 'library' ? (
        <LibraryView
          settings={settings}
          profile={profile}
          setProfile={setProfile}
          experiences={experiences}
          setExperiences={setExperiences}
          goWorkspace={() => setView('workspace')}
        />
      ) : (
        <WorkspaceView
          settings={settings}
          profile={profile}
          experiences={experiences}
          applications={applications}
          setApplications={setApplications}
          versions={versions}
          setVersions={setVersions}
          bump={bump}
          goLibrary={() => setView('library')}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          metrics={metrics}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
