import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { AppHeader } from './components/layout/AppHeader'
import { TabBar, type TabId } from './components/layout/TabBar'
import { HomeScreen } from './screens/HomeScreen'
import { AreaScreen } from './screens/AreaScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { PostWizard } from './components/post/PostWizard'
import { InstallBanner } from './components/InstallBanner'
import { OfflineBanner } from './components/OfflineBanner'

function Shell() {
  const [tab, setTab] = useState<TabId>('home')
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <OfflineBanner />
      <AppHeader />
      <InstallBanner />
      <main className="mx-auto max-w-2xl px-4 pb-40 pt-5">
        {tab === 'home' && <HomeScreen />}
        {tab === 'area' && <AreaScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      {/* 投稿ボタン（ラベル併記・44px以上） */}
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex min-h-14 items-center gap-2 rounded-full bg-teal-700 px-6 text-lg font-bold text-white shadow-lg hover:bg-teal-800 active:bg-teal-900 mb-[env(safe-area-inset-bottom)]"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
        投稿
      </button>

      <TabBar active={tab} onChange={setTab} />
      <PostWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AppProvider>
  )
}
