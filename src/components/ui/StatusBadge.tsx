import { Search, CheckCircle2, MessageCircle } from 'lucide-react'
import type { PostType } from '../../types'
import { POST_TYPE_LABEL } from '../../types'

/**
 * 投稿種類バッジ。赤の乱用を避け、警告色は「捜索中」のみに使う（設計方針）。
 */
export function StatusBadge({ type }: { type: PostType }) {
  if (type === 'searching') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-700 px-3 py-1 text-sm font-bold text-white">
        <Search className="h-4 w-4" aria-hidden="true" />
        捜索中
      </span>
    )
  }
  if (type === 'found') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {POST_TYPE_LABEL.found}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-800">
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {POST_TYPE_LABEL.info}
    </span>
  )
}
