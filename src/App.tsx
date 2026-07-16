import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppHeader } from './components/layout/AppHeader'
import { TabBar, type TabId } from './components/layout/TabBar'
import { HomeScreen } from './screens/HomeScreen'
import { AreaScreen } from './screens/AreaScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import {
  ConfirmEmailScreen,
  LoginScreen,
  PendingScreen,
  RegisterScreen,
  SplashScreen,
  SuspendedScreen,
} from './screens/AuthScreens'
import { RequestWizard } from './components/post/RequestWizard'
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

      {/* 捜索依頼ボタン（ラベル併記・44px以上）。発見報告・情報提供は依頼カードから行う */}
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex min-h-14 items-center gap-2 rounded-full bg-teal-700 px-5 text-base font-bold text-white shadow-lg hover:bg-teal-800 active:bg-teal-900 mb-[env(safe-area-inset-bottom)]"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
        捜索依頼をする
      </button>

      <TabBar active={tab} onChange={setTab} />
      <RequestWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  )
}

/**
 * 認証・承認ゲート。設計原則: 未ログイン・未承認では依頼情報を一切表示しない。
 * VITE_REPOSITORY=local のときは認証を通さずモックで動かす（UI開発用）。
 */
function Gate() {
  const { phase } = useAuth()

  switch (phase) {
    case 'loading':
      return <SplashScreen />
    case 'signedOut':
      return <LoginScreen />
    case 'needEmail':
      return <ConfirmEmailScreen />
    case 'unregistered':
      return <RegisterScreen />
    case 'pending':
      return <PendingScreen />
    case 'suspended':
      return <SuspendedScreen />
    case 'approved':
      return (
        <AppProvider>
          <Shell />
        </AppProvider>
      )
  }
}

export default function App() {
  const isMock = import.meta.env.VITE_REPOSITORY === 'local'
  return (
    <ToastProvider>
      {isMock ? (
        <AppProvider>
          <Shell />
        </AppProvider>
      ) : (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      )}
    </ToastProvider>
  )
}
