import { useEffect, useRef, useState } from 'react'
import { X, Send, Eye, MessageCircle, CheckCircle2 } from 'lucide-react'
import type { UpdateInput, UpdateKind } from '../types'
import { UPDATE_KIND_LABEL } from '../types'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Field, inputClass } from './ui/form'

const KIND_ICON: Record<UpdateKind, typeof Eye> = {
  sighting: Eye,
  info: MessageCircle,
  found: CheckCircle2,
}

const KIND_INTRO: Record<UpdateKind, string> = {
  sighting: '見かけた場所と時間を教えてください。具体的な情報が捜索の助けになります。',
  info: 'お気づきの点を教えてください。小さな情報でも助けになります。',
  found: '発見の状況を教えてください。ご家族（依頼の投稿者）が確認のうえ「解決」の処理を行います。',
}

interface Props {
  requestId: string
  kind: UpdateKind
  requestTitle: string
  onClose: () => void
}

/**
 * 目撃情報・情報提供・発見報告の入力ダイアログ。
 * ワンタップの「反応」ではなく内容の入力を求めることで、情報の信頼性を担保する。
 */
export function UpdateDialog({ requestId, kind, requestTitle, onClose }: Props) {
  const { addUpdate } = useApp()
  const showToast = useToast()
  const [input, setInput] = useState<UpdateInput>({ kind, location: '', whenText: '', comment: '' })
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
    // 種類ごとの必須項目: 中身のない「反応」は送れない
    if (kind === 'sighting' && !input.location.trim()) {
      setError('見かけた場所を入力してください')
      return
    }
    if (kind === 'info' && !input.comment.trim()) {
      setError('内容を入力してください')
      return
    }
    if (kind === 'found' && !input.comment.trim() && !input.location.trim()) {
      setError('発見した場所または状況を入力してください')
      return
    }
    setSubmitting(true)
    try {
      await addUpdate(requestId, input)
      showToast(
        kind === 'found'
          ? '発見報告を送りました。ご協力ありがとうございます。'
          : `${UPDATE_KIND_LABEL[kind]}を送りました。ご協力ありがとうございます。`,
      )
      onClose()
    } catch {
      setError('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const Icon = KIND_ICON[kind]

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id="update-dialog-title"
            ref={headingRef}
            tabIndex={-1}
            className="flex items-center gap-2 text-lg font-bold text-slate-900 outline-none"
          >
            <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
            {UPDATE_KIND_LABEL[kind]}を送る
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
        <p className="mb-1 text-sm text-slate-600">対象：{requestTitle}</p>
        <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
          {KIND_INTRO[kind]}
        </p>

        <Field
          label={kind === 'sighting' ? '見かけた場所' : '場所'}
          optional={kind !== 'sighting'}
          error={kind === 'sighting' ? (error ?? undefined) : undefined}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              value={input.location}
              onChange={(e) => {
                setError(null)
                setInput((p) => ({ ...p, location: e.target.value }))
              }}
              placeholder="例：田無駅北口のベンチ付近"
              className={inputClass(kind === 'sighting' && Boolean(error))}
            />
          )}
        </Field>

        <Field label="いつ頃" optional>
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              value={input.whenText}
              onChange={(e) => setInput((p) => ({ ...p, whenText: e.target.value }))}
              placeholder="例：11時頃、ついさっき"
              className={inputClass()}
            />
          )}
        </Field>

        <Field
          label={kind === 'sighting' ? '様子・状況' : '内容'}
          optional={kind === 'sighting'}
          error={kind !== 'sighting' ? (error ?? undefined) : undefined}
        >
          {(a11y) => (
            <textarea
              {...a11y}
              rows={3}
              value={input.comment}
              onChange={(e) => {
                setError(null)
                setInput((p) => ({ ...p, comment: e.target.value }))
              }}
              placeholder={
                kind === 'sighting'
                  ? '例：ベンチで休んでいました。声はかけていません。'
                  : '例：無事に保護されたと家族から連絡がありました。'
              }
              className={inputClass(kind !== 'sighting' && Boolean(error))}
            />
          )}
        </Field>

        <div className="mt-2 flex gap-3">
          <Button onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={submitting} className="flex-1">
            <Send className="h-4 w-4" aria-hidden="true" />
            {submitting ? '送信中…' : '送信する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
