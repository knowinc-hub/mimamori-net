import { Search, CheckCircle2, MessageCircle, Eye } from 'lucide-react'
import type { UpdateKind } from '../../types'
import { UPDATE_KIND_LABEL } from '../../types'

/** 「捜索中」バッジ。警告色（赤）はこのバッジと110番導線のみに使う（設計方針）。 */
export function SearchingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-700 px-3 py-1 text-sm font-bold text-white">
      <Search className="h-4 w-4" aria-hidden="true" />
      捜索中
    </span>
  )
}

const KIND_STYLE: Record<UpdateKind, { icon: typeof Eye; className: string }> = {
  sighting: { icon: Eye, className: 'bg-sky-100 text-sky-900' },
  info: { icon: MessageCircle, className: 'bg-slate-200 text-slate-800' },
  found: { icon: CheckCircle2, className: 'bg-teal-100 text-teal-900' },
}

/** 更新情報（目撃・情報提供・発見報告）の種類バッジ */
export function UpdateKindBadge({ kind }: { kind: UpdateKind }) {
  const { icon: Icon, className } = KIND_STYLE[kind]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {UPDATE_KIND_LABEL[kind]}
    </span>
  )
}
