import { Home, Map, ClipboardList, Settings, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'

export type TabId = 'home' | 'area' | 'history' | 'settings' | 'admin'

const BASE_TABS: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'area', label: 'エリア', icon: Map },
  { id: 'history', label: '履歴', icon: ClipboardList },
  { id: 'settings', label: '設定', icon: Settings },
]

const ADMIN_TAB = { id: 'admin' as TabId, label: '管理', icon: ShieldCheck }

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  showAdmin?: boolean
}

/** 下部タブナビゲーション（SVGアイコン＋テキストラベル併記、44px以上のタップ領域） */
export function TabBar({ active, onChange, showAdmin }: Props) {
  const TABS = showAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium ${
                isActive ? 'text-teal-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.2]' : ''}`} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
