import { useState } from 'react'
import { MapPin, Clock, RefreshCw, Eye, MessageSquarePlus, CheckCircle2, Phone, ShieldCheck } from 'lucide-react'
import type { Post } from '../types'
import { timeAgo } from '../utils/time'
import { StatusBadge } from './ui/StatusBadge'
import { Button } from './ui/Button'
import { GuardedPhoto } from './GuardedPhoto'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

/**
 * 依頼・報告カード。
 * 「発生からの経過時間」「最終更新」を必ず表示する（古い情報の拡散を防ぐ設計思想）。
 */
export function PostCard({ post }: { post: Post }) {
  const { addResponse, resolvePost } = useApp()
  const showToast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirmingResolve, setConfirmingResolve] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      showToast('操作に失敗しました。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  const isSearching = post.type === 'searching'

  return (
    <article
      className={`rounded-2xl border bg-white p-4 ${
        isSearching ? 'border-red-300' : 'border-slate-200'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {post.personName ?? (post.type === 'info' ? '情報提供' : '発見報告')}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {post.location}
            </span>
          </p>
        </div>
        <StatusBadge type={post.type} />
      </div>

      {/* 経過時間・最終更新は必ず表示する */}
      <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden="true" />
          発生から {timeAgo(post.createdAt).replace('前', '')}
        </span>
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          最終更新 {timeAgo(post.updatedAt)}
        </span>
      </p>

      {post.photoDataUrl && (
        <div className="mb-3">
          <GuardedPhoto src={post.photoDataUrl} alt={`${post.personName ?? '捜索対象の方'}の写真`} />
        </div>
      )}

      {post.detail && <p className="mb-3 text-base leading-relaxed text-slate-800">{post.detail}</p>}

      {post.contact && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">連絡先：</span>
            {post.contact}
          </span>
        </p>
      )}

      {isSearching && post.policeReported && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-teal-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          警察届出済み{post.policeReportNumber ? `（受理番号 ${post.policeReportNumber}）` : ''}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          {isSearching && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await addResponse(post.id)
                  showToast('目撃情報を送りました。ご協力ありがとうございます。')
                })
              }
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              見かけた
            </Button>
          )}
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await addResponse(post.id)
                showToast('情報を追加しました。')
              })
            }
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            情報追加
          </Button>
          {isSearching &&
            (confirmingResolve ? (
              <span className="flex items-center gap-2">
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await resolvePost(post.id)
                      showToast('解決しました。写真・氏名・詳細は削除され、日時とエリアのみ履歴に残ります。')
                    })
                  }
                >
                  解決を確定
                </Button>
                <Button variant="quiet" onClick={() => setConfirmingResolve(false)}>
                  戻る
                </Button>
              </span>
            ) : (
              <Button variant="secondary" disabled={busy} onClick={() => setConfirmingResolve(true)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                解決
              </Button>
            ))}
        </div>
        <p className="text-sm text-slate-600">
          反応 <span className="font-bold text-teal-800">{post.responses}</span> 件
        </p>
      </div>
    </article>
  )
}
