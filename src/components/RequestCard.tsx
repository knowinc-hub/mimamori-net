import { useState } from 'react'
import {
  MapPin,
  Clock,
  RefreshCw,
  Eye,
  MessageSquarePlus,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { SearchRequest, UpdateKind } from '../types'
import { timeAgo } from '../utils/time'
import { SearchingBadge, UpdateKindBadge } from './ui/StatusBadge'
import { Button } from './ui/Button'
import { GuardedPhoto } from './GuardedPhoto'
import { UpdateDialog } from './UpdateDialog'
import { useApp } from '../context/AppContext'
import { useOptionalAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const VISIBLE_UPDATES = 2

/**
 * 捜索依頼カード。
 * - 「発生からの経過時間」「最終更新」を必ず表示（古い情報の拡散を防ぐ設計思想）
 * - 目撃情報・情報提供・発見報告は内容つきのタイムラインとして依頼にひも付く
 */
export function RequestCard({ request }: { request: SearchRequest }) {
  const { resolveRequest } = useApp()
  const auth = useOptionalAuth()
  const showToast = useToast()
  // 解決の操作は依頼の投稿者（ご家族）と管理者のみ。モックモードでは常に表示
  const canResolve = !auth || auth.isAdmin || (auth.user != null && request.authorUid === auth.user.uid)
  const [dialogKind, setDialogKind] = useState<UpdateKind | null>(null)
  const [confirmingResolve, setConfirmingResolve] = useState(false)
  const [showAllUpdates, setShowAllUpdates] = useState(false)
  const [busy, setBusy] = useState(false)

  const title = request.personName ?? '捜索依頼'
  const updates = [...request.updates].sort((a, b) => b.createdAt - a.createdAt)
  const visibleUpdates = showAllUpdates ? updates : updates.slice(0, VISIBLE_UPDATES)
  const hasFoundReport = updates.some((u) => u.kind === 'found')

  const resolve = async () => {
    setBusy(true)
    try {
      await resolveRequest(request.id)
      showToast('解決しました。写真・氏名・詳細は削除され、日時とエリアのみ履歴に残ります。')
    } catch {
      showToast('操作に失敗しました。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-red-300 bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {request.location}
          </p>
        </div>
        <SearchingBadge />
      </div>

      {/* 経過時間・最終更新は必ず表示する */}
      <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden="true" />
          発生から {timeAgo(request.createdAt).replace('前', '')}
        </span>
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          最終更新 {timeAgo(request.updatedAt)}
        </span>
      </p>

      {request.photoDataUrl && (
        <div className="mb-3">
          <GuardedPhoto src={request.photoDataUrl} alt={`${title}の写真`} />
        </div>
      )}

      {request.detail && (
        <p className="mb-3 text-base leading-relaxed text-slate-800">{request.detail}</p>
      )}

      {request.contact && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">連絡先：</span>
            {request.contact}
          </span>
        </p>
      )}

      {request.policeReported && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-teal-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          警察届出済み{request.policeReportNumber ? `（受理番号 ${request.policeReportNumber}）` : ''}
        </p>
      )}

      {/* 発見報告が届いている場合の案内 */}
      {hasFoundReport && (
        <p className="mb-3 flex items-start gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
          発見の報告が届いています。ご家族（投稿者）は内容を確認のうえ「解決」の処理をしてください。
        </p>
      )}

      {/* 寄せられた情報のタイムライン */}
      <section aria-label="寄せられた情報" className="mb-3 border-t border-slate-100 pt-3">
        <h4 className="mb-2 text-sm font-bold text-slate-600">
          寄せられた情報（{updates.length}件）
        </h4>
        {updates.length === 0 ? (
          <p className="text-sm text-slate-600">
            まだ情報はありません。見かけた方は下のボタンからお知らせください。
          </p>
        ) : (
          <ol className="space-y-2">
            {visibleUpdates.map((u) => (
              <li key={u.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <UpdateKindBadge kind={u.kind} />
                  <span className="text-xs text-slate-500">{timeAgo(u.createdAt)}</span>
                </p>
                {(u.location || u.whenText) && (
                  <p className="text-sm font-medium text-slate-800">
                    {u.location}
                    {u.whenText ? `（${u.whenText}）` : ''}
                  </p>
                )}
                {u.comment && (
                  <p className="text-sm leading-relaxed text-slate-700">{u.comment}</p>
                )}
              </li>
            ))}
          </ol>
        )}
        {updates.length > VISIBLE_UPDATES && (
          <button
            type="button"
            onClick={() => setShowAllUpdates((v) => !v)}
            className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-teal-800"
          >
            {showAllUpdates ? (
              <>
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                たたむ
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                残り{updates.length - VISIBLE_UPDATES}件を見る
              </>
            )}
          </button>
        )}
      </section>

      {/* 情報はワンタップではなく内容の入力を求める（信頼性の担保） */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Button variant="primary" onClick={() => setDialogKind('sighting')}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          見かけた
        </Button>
        <Button onClick={() => setDialogKind('info')}>
          <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          情報提供
        </Button>
        <Button onClick={() => setDialogKind('found')}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          発見報告
        </Button>
        {canResolve &&
          (confirmingResolve ? (
            <span className="flex items-center gap-2">
              <Button variant="danger" disabled={busy} onClick={() => void resolve()}>
                解決を確定
              </Button>
              <Button variant="quiet" onClick={() => setConfirmingResolve(false)}>
                戻る
              </Button>
            </span>
          ) : (
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmingResolve(true)}>
              解決
            </Button>
          ))}
      </div>

      {dialogKind && (
        <UpdateDialog
          requestId={request.id}
          kind={dialogKind}
          requestTitle={title}
          onClose={() => setDialogKind(null)}
        />
      )}
    </article>
  )
}
