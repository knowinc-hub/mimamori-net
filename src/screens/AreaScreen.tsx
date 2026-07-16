import { MapPin, Info, BellRing } from 'lucide-react'
import { AREAS } from '../types'
import { useApp } from '../context/AppContext'
import { LoadingCards, ErrorState } from '../components/ui/states'

export function AreaScreen() {
  const { loadState, refresh } = useApp()

  if (loadState === 'loading') return <LoadingCards count={2} />
  if (loadState === 'error') return <ErrorState onRetry={() => void refresh()} />

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-bold text-slate-900">このアプリの対象自治体</h2>
        <p className="mb-4 text-sm text-slate-600">特別支援学校の学区に対応した3自治体で運用しています。</p>
        <ul className="space-y-2">
          {AREAS.map((area) => (
            <li
              key={area}
              className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-base text-slate-900">
                <MapPin className="h-5 w-5 text-teal-700" aria-hidden="true" />
                {area}
              </span>
              <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-bold text-white">対象エリア</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate-800">
          <span className="font-bold">プロトタイプ版：</span>
          実際の地図表示・GPS連動は今後の実装予定です。現在はエリア一覧のみ表示しています。
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-base font-bold text-slate-900">
          <BellRing className="h-5 w-5 text-teal-700" aria-hidden="true" />
          位置情報ベース通知のしくみ（予定）
        </h2>
        <p className="text-base leading-relaxed text-slate-800">
          依頼が発生した際、<strong>発生地点から2km以内</strong>
          にいるメンバーにだけ通知を送ります。遠方への無意味な拡散を防ぎ、本当に目撃できる可能性がある人だけに届けます。
        </p>
      </section>
    </div>
  )
}
