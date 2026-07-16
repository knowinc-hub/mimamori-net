import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  ArrowLeft,
  ArrowRight,
  Phone,
  ShieldCheck,
  Camera,
  Trash2,
  Send,
  Lock,
} from 'lucide-react'
import type { RequestInput } from '../../types'
import { AREAS, EMPTY_REQUEST_INPUT } from '../../types'
import { repository } from '../../data/localRepository'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Field, inputClass } from '../ui/form'
import { GuardedPhoto } from '../GuardedPhoto'
import { fileToResizedDataUrl } from './photo'

/**
 * 捜索依頼専用のステップ式ウィザード。
 * 発見報告・情報提供はここではなく、依頼カード上のボタンから追加する。
 * 緊急時を想定し、各ステップの入力は3項目以内。
 */
const STEPS = ['police', 'person', 'situation', 'confirm'] as const
type StepId = (typeof STEPS)[number]

const STEP_TITLE: Record<StepId, string> = {
  police: '警察への届出確認',
  person: 'ご本人の情報',
  situation: '場所と状況',
  confirm: '内容の確認',
}

interface Props {
  open: boolean
  onClose: () => void
}

export function RequestWizard({ open, onClose }: Props) {
  const { createRequest, profile } = useApp()
  const showToast = useToast()
  const [input, setInput] = useState<RequestInput>(EMPTY_REQUEST_INPUT)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draftAvailable, setDraftAvailable] = useState<RequestInput | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const step = STEPS[stepIndex]

  // 開いたとき: 下書きがあれば再開を提案
  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    setError(null)
    setInput({ ...EMPTY_REQUEST_INPUT, area: profile?.area ?? EMPTY_REQUEST_INPUT.area })
    void repository.loadDraft().then((draft) => {
      if (draft && (draft.location || draft.personName || draft.detail)) {
        setDraftAvailable(draft)
      } else {
        setDraftAvailable(null)
      }
    })
  }, [open, profile])

  // 入力内容は自動で下書き保存（緊急時の中断に備える）
  useEffect(() => {
    if (!open || draftAvailable) return
    if (input.location || input.personName || input.detail || input.contact) {
      void repository.saveDraft(input)
    }
  }, [input, open, draftAvailable])

  // ステップ切替時に見出しへフォーカス（スクリーンリーダー・キーボード対応)
  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [stepIndex, open])

  // Esc で閉じる
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const update = useCallback((patch: Partial<RequestInput>) => {
    setError(null)
    setInput((prev) => ({ ...prev, ...patch }))
  }, [])

  if (!open) return null

  const goNext = () => {
    if (step === 'police' && !input.policeReported) {
      setError('警察への届出確認が必要です。届出済みにチェックを入れてください。')
      return
    }
    if (step === 'situation' && !input.location.trim()) {
      setError('場所を入力してください（例：吉祥寺駅北口付近）')
      return
    }
    setError(null)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setError(null)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      await createRequest(input)
      await repository.clearDraft()
      showToast('捜索依頼を投稿しました。エリア内のメンバーにのみ共有されます。')
      onClose()
    } catch {
      setError('投稿に失敗しました。通信状態をご確認のうえ、もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        className="absolute inset-x-0 bottom-0 top-10 mx-auto flex max-w-2xl flex-col rounded-t-3xl bg-white shadow-xl"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm text-slate-600">
              捜索依頼 — ステップ {stepIndex + 1} / {STEPS.length}
            </p>
            <h2 id="wizard-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold text-slate-900 outline-none">
              {STEP_TITLE[step]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる（入力内容は下書きとして保存されます）"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* 進捗バー */}
        <div className="h-1 bg-slate-100" aria-hidden="true">
          <div
            className="h-1 bg-teal-700 transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* 下書き再開の提案 */}
          {draftAvailable && (
            <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <p className="mb-3 text-base text-slate-900">前回の入力途中の下書きがあります。続きから再開しますか？</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setInput(draftAvailable)
                    setDraftAvailable(null)
                  }}
                >
                  続きから再開
                </Button>
                <Button
                  onClick={() => {
                    void repository.clearDraft()
                    setDraftAvailable(null)
                  }}
                >
                  破棄して新規作成
                </Button>
              </div>
            </div>
          )}

          {step === 'police' && <PoliceStep input={input} update={update} />}
          {step === 'person' && <PersonStep input={input} update={update} onError={setError} />}
          {step === 'situation' && <SituationStep input={input} update={update} error={error} />}
          {step === 'confirm' && <ConfirmStep input={input} />}

          {error && step !== 'situation' && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
        </div>

        {/* フッターナビゲーション */}
        <div className="border-t border-slate-200 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <Button onClick={goBack} className="flex-1">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                戻る
              </Button>
            )}
            {step !== 'confirm' ? (
              <Button variant="primary" onClick={goNext} className="flex-1">
                次へ
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="primary" onClick={() => void submit()} disabled={submitting} className="flex-1">
                <Send className="h-4 w-4" aria-hidden="true" />
                {submitting ? '投稿中…' : 'この内容で依頼する'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- 各ステップ ---------- */

function PoliceStep({ input, update }: { input: RequestInput; update: (p: Partial<RequestInput>) => void }) {
  const [notReported, setNotReported] = useState(false)

  if (notReported) {
    // 未届けの場合は 110 番を促す画面を挟む（設計原則: 警察への届出が前提）
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-center">
        <Phone className="mx-auto mb-3 h-10 w-10 text-red-700" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-900">まず警察へ通報してください</h3>
        <p className="mt-2 text-base leading-relaxed text-slate-800">
          このアプリは警察の捜索を<strong>補完</strong>するものです。
          行方不明に気づいたら、最初に110番通報（または最寄りの警察署への届出）をお願いします。
        </p>
        <a
          href="tel:110"
          className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-8 text-lg font-bold text-white hover:bg-red-800"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          110番に電話する
        </a>
        <div className="mt-4">
          <Button variant="quiet" onClick={() => setNotReported(false)}>
            届出が済んだので入力に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 flex gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        捜索依頼の投稿には、警察への届出が必要です。このアプリは警察捜索の補完として機能します。
      </p>

      <label className="mb-4 flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border-2 border-slate-200 p-4 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50">
        <input
          type="checkbox"
          checked={input.policeReported}
          onChange={(e) => update({ policeReported: e.target.checked })}
          className="mt-1 h-5 w-5 accent-teal-700"
        />
        <span>
          <span className="block text-base font-bold text-slate-900">警察に届出済みです</span>
          <span className="mt-0.5 block text-sm text-slate-600">110番通報または警察署への行方不明者届を済ませています</span>
        </span>
      </label>

      <Field label="警察受理番号" optional hint="わかる場合のみ入力してください（例：2025-0412）">
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            value={input.policeReportNumber}
            onChange={(e) => update({ policeReportNumber: e.target.value })}
            placeholder="例：2025-0412"
            className={inputClass()}
          />
        )}
      </Field>

      <button
        type="button"
        onClick={() => setNotReported(true)}
        className="min-h-11 text-base font-medium text-red-800 underline underline-offset-2"
      >
        まだ届け出ていない場合はこちら
      </button>
    </div>
  )
}

function PersonStep({
  input,
  update,
  onError,
}: {
  input: RequestInput
  update: (p: Partial<RequestInput>) => void
  onError: (msg: string | null) => void
}) {
  const [processing, setProcessing] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setProcessing(true)
    try {
      update({ photoDataUrl: await fileToResizedDataUrl(file) })
    } catch (e) {
      onError(e instanceof Error ? e.message : '画像を読み込めませんでした')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <Field label="お名前・特徴" optional hint="呼びかけに使える名前や、年齢・性別などの特徴">
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            value={input.personName}
            onChange={(e) => update({ personName: e.target.value })}
            placeholder="例：山田さん、男性、60代くらい"
            className={inputClass()}
          />
        )}
      </Field>

      <Field label="写真" optional hint="解決したら自動的に削除されます。">
        {(a11y) => (
          <div>
            {input.photoDataUrl ? (
              <div>
                <GuardedPhoto src={input.photoDataUrl} alt="添付した写真のプレビュー" />
                <Button variant="danger" className="mt-2" onClick={() => update({ photoDataUrl: null })}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  写真を削除
                </Button>
              </div>
            ) : (
              <label
                htmlFor={a11y.id}
                className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-slate-600 hover:border-teal-600"
              >
                <Camera className="h-7 w-7" aria-hidden="true" />
                <span className="text-base">{processing ? '読み込み中…' : 'タップして写真を選択'}</span>
                <input
                  {...a11y}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        )}
      </Field>
    </div>
  )
}

function SituationStep({
  input,
  update,
  error,
}: {
  input: RequestInput
  update: (p: Partial<RequestInput>) => void
  error: string | null
}) {
  return (
    <div>
      <Field label="エリア">
        {(a11y) => (
          <select
            {...a11y}
            value={input.area}
            onChange={(e) => update({ area: e.target.value as RequestInput['area'] })}
            className={inputClass()}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="最後に見かけた場所" error={error ?? undefined}>
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            value={input.location}
            onChange={(e) => update({ location: e.target.value })}
            placeholder="例：吉祥寺駅北口付近"
            className={inputClass(Boolean(error))}
          />
        )}
      </Field>

      <Field label="詳細・服装など" optional hint="服装・持ち物・状況など、気づいた点">
        {(a11y) => (
          <textarea
            {...a11y}
            value={input.detail}
            onChange={(e) => update({ detail: e.target.value })}
            rows={3}
            placeholder="例：青いジャンパー着用、グレーのズボン。午前10時頃から行方不明。"
            className={inputClass()}
          />
        )}
      </Field>

      <Field label="連絡先" optional hint="目撃情報を受け取る電話番号など">
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            value={input.contact}
            onChange={(e) => update({ contact: e.target.value })}
            placeholder="例：090-XXXX-XXXX"
            className={inputClass()}
          />
        )}
      </Field>
    </div>
  )
}

function ConfirmStep({ input }: { input: RequestInput }) {
  const rows: [string, string][] = [
    ['エリア', input.area],
    ['場所', input.location],
  ]
  if (input.personName) rows.push(['お名前・特徴', input.personName])
  if (input.detail) rows.push(['詳細', input.detail])
  if (input.contact) rows.push(['連絡先', input.contact])
  rows.push([
    '警察届出',
    input.policeReported
      ? `届出済み${input.policeReportNumber ? `（${input.policeReportNumber}）` : ''}`
      : '未確認',
  ])

  return (
    <div>
      {/* 設計原則の明示: エリア内限定・解決後の自動削除 */}
      <div className="mb-5 flex gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate-800">
          この依頼は<strong>エリア内のメンバーのみ</strong>に共有されます。SNSへの転載はできません。
          解決後、写真と詳細情報は<strong>自動的に削除</strong>されます。
        </p>
      </div>

      <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 py-3">
            <dt className="w-28 shrink-0 text-sm text-slate-600">{label}</dt>
            <dd className="text-base text-slate-900">{value}</dd>
          </div>
        ))}
        {input.photoDataUrl && (
          <div className="py-3">
            <dt className="mb-2 text-sm text-slate-600">写真</dt>
            <dd>
              <GuardedPhoto src={input.photoDataUrl} alt="添付した写真のプレビュー" />
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
