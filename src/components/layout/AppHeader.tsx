import { Eye, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function AppHeader() {
  const { profile } = useApp()
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white" aria-hidden="true">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg leading-tight font-bold text-slate-900">みまもりネット</h1>
            <p className="text-xs text-slate-600">地域見守り相互支援</p>
          </div>
        </div>
        {profile && (
          <p className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" />
            {profile.area}
          </p>
        )}
      </div>
    </header>
  )
}
