import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

/** ローディング（スケルトン） */
export function LoadingCards({ count = 2 }: { count?: number }) {
  return (
    <div role="status" aria-label="読み込み中" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 h-5 w-2/5 rounded bg-slate-200" />
          <div className="mb-2 h-4 w-4/5 rounded bg-slate-100" />
          <div className="h-4 w-3/5 rounded bg-slate-100" />
        </div>
      ))}
      <span className="sr-only">読み込み中です</span>
    </div>
  )
}

/** 空状態 */
export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </div>
      <p className="text-base font-medium text-slate-800">{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>}
    </div>
  )
}

/** エラー状態（再試行つき） */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-8 text-center">
      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-700" aria-hidden="true" />
      <p className="text-base font-medium text-slate-900">データを読み込めませんでした</p>
      <p className="mt-1 text-sm text-slate-700">通信状態をご確認のうえ、もう一度お試しください。</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        再読み込み
      </Button>
    </div>
  )
}
