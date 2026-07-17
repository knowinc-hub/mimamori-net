import { useEffect, useRef, useState } from 'react'
import { X, Flag, Send } from 'lucide-react'
import { REPORT_REASONS } from '../types'
import { createReport } from '../data/reports'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Field, inputClass } from './ui/form'

interface Props {
  requestId: string
  requestTitle: string
  onClose: () => void
}

/** 投稿への通報ダイアログ。通報内容は管理者のみが確認できる。 */
export function ReportDialog({ requestId, requestTitle, onClose }: Props) {
  const showToast = useToast()
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async () => {
    if (reason === 'その他' && !detail.trim()) {
      setError('「その他」の場合は詳細を入力してください')
      return
    }
    setSubmitting(true)
    try {
      await createReport({ requestId, requestSummary: requestTitle, reason, detail })
      showToast('報告を受け付けました。管理者が確認します。')
      onClose()
    } catch {
      setError('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id="report-dialog-title"
            ref={headingRef}
            tabIndex={-1}
            className="flex items-center gap-2 text-lg font-bold text-slate-900 outline-none"
          >
            <Flag className="h-5 w-5 text-slate-600" aria-hidden="true" />
            問題を報告
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          対象：{requestTitle}。報告の内容は管理者だけが確認します。
        </p>

        <Field label="理由">
          {(a11y) => (
            <select
              {...a11y}
              value={reason}
              onChange={(e) => {
                setError(null)
                setReason(e.target.value)
              }}
              className={inputClass()}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="詳細" optional={reason !== 'その他'} error={error ?? undefined}>
          {(a11y) => (
            <textarea
              {...a11y}
              rows={3}
              value={detail}
              onChange={(e) => {
                setError(null)
                setDetail(e.target.value)
              }}
              placeholder="気づいた点があれば書いてください"
              className={inputClass(Boolean(error))}
            />
          )}
        </Field>

        <div className="mt-2 flex gap-3">
          <Button onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={submitting} className="flex-1">
            <Send className="h-4 w-4" aria-hidden="true" />
            {submitting ? '送信中…' : '報告する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
