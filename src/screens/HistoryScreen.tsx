import { ShieldCheck, ClipboardList, CheckCircle2, MapPin, Clock, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { LoadingCards, EmptyState, ErrorState } from '../components/ui/states'
import { formatDateTime, formatMinutes } from '../utils/time'

export function HistoryScreen() {
  const { loadState, history, refresh } = useApp()

  if (loadState === 'loading') return <LoadingCards count={2} />
  if (loadState === 'error') return <ErrorState onRetry={() => void refresh()} />

  return (
    <div>
      {/* 設計思想の説明（固定文言・常に先頭に表示） */}
      <section className="mb-4 flex gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate-800">
          <span className="font-bold">プライバシー保護：</span>
          履歴には「解決した日時・エリア」のみ記録されます。写真・お名前・特徴・連絡先は、解決した時点で削除されています。
        </p>
      </section>

      <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-600">解決済みの記録</h2>

      {history.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" aria-hidden="true" />}
          title="解決済みの記録はまだありません"
          description="依頼が解決すると、日時とエリアだけがここに残ります。"
        />
      ) : (
        <ul className="space-y-3">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-base font-bold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  解決済み
                </span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-900">
                  個人情報は削除済み
                </span>
              </div>
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <dt className="sr-only">エリア</dt>
                  <dd>{entry.area}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <dt className="sr-only">解決日時</dt>
                  <dd>
                    {formatDateTime(entry.resolvedAt)} 解決（所要 {formatMinutes(entry.elapsedMinutes)}）
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <dt className="sr-only">反応数</dt>
                  <dd>反応 {entry.responses}件</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
