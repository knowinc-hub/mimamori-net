import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Ticket,
  Flag,
  CheckCircle2,
  Ban,
  RotateCcw,
  Plus,
  EyeOff,
  Eye,
  Dices,
} from 'lucide-react'
import type { Report } from '../types'
import {
  createInviteCode,
  getRequestState,
  listInviteCodes,
  listMembers,
  listReports,
  setInviteCodeActive,
  setMemberStatus,
  setReportStatus,
  setRequestHidden,
  type InviteCode,
  type Member,
} from '../data/adminApi'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/Button'
import { Field, inputClass } from '../components/ui/form'
import { LoadingCards, ErrorState, EmptyState } from '../components/ui/states'
import { formatDateTime } from '../utils/time'

type Section = 'members' | 'codes' | 'reports'

const STATUS_LABEL = {
  pending: { text: '承認待ち', className: 'bg-amber-100 text-amber-900' },
  approved: { text: '利用中', className: 'bg-teal-100 text-teal-900' },
  suspended: { text: '停止中', className: 'bg-slate-200 text-slate-700' },
} as const

/** 管理画面。非エンジニアの管理者が操作する前提で、専門用語を避けたシンプルなUIにする。 */
export function AdminScreen() {
  const [section, setSection] = useState<Section>('members')
  return (
    <div>
      <div role="tablist" aria-label="管理メニュー" className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1">
        {(
          [
            ['members', 'メンバー', Users],
            ['codes', '招待コード', Ticket],
            ['reports', '通報', Flag],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium ${
              section === id ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {section === 'members' && <MembersSection />}
      {section === 'codes' && <CodesSection />}
      {section === 'reports' && <ReportsSection />}
    </div>
  )
}

function MembersSection() {
  const showToast = useToast()
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setMembers(null)
    listMembers()
      .then(setMembers)
      .catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorState onRetry={load} />
  if (!members) return <LoadingCards count={3} />

  const change = async (m: Member, status: 'approved' | 'suspended', msg: string) => {
    try {
      await setMemberStatus(m.uid, status)
      showToast(msg)
      load()
    } catch {
      showToast('操作に失敗しました。もう一度お試しください。')
    }
  }

  const pending = members.filter((m) => m.status === 'pending')
  const others = members.filter((m) => m.status !== 'pending')

  const card = (m: Member) => {
    const s = STATUS_LABEL[m.status ?? 'pending']
    return (
      <li key={m.uid} className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-base font-bold text-slate-900">{m.nickname}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.className}`}>{s.text}</span>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          {m.area}
          {m.organizationName ? `・${m.organizationName}` : ''}・登録 {m.joinedAt}
        </p>
        <div className="flex flex-wrap gap-2">
          {m.status === 'pending' && (
            <>
              <Button variant="primary" onClick={() => void change(m, 'approved', `${m.nickname}を承認しました。`)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                承認する
              </Button>
              <Button onClick={() => void change(m, 'suspended', `${m.nickname}の登録を停止しました。`)}>
                <Ban className="h-4 w-4" aria-hidden="true" />
                お断りする
              </Button>
            </>
          )}
          {m.status === 'approved' && (
            <Button onClick={() => void change(m, 'suspended', `${m.nickname}を停止しました。`)}>
              <Ban className="h-4 w-4" aria-hidden="true" />
              停止する
            </Button>
          )}
          {m.status === 'suspended' && (
            <Button onClick={() => void change(m, 'approved', `${m.nickname}を再開しました。`)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              利用を再開する
            </Button>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-600">
          承認待ち（{pending.length}人）
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
            承認待ちのメンバーはいません。
          </p>
        ) : (
          <ul className="space-y-3">{pending.map(card)}</ul>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-600">
          メンバー（{others.length}人）
        </h2>
        <ul className="space-y-3">{others.map(card)}</ul>
      </section>
    </div>
  )
}

function CodesSection() {
  const showToast = useToast()
  const [codes, setCodes] = useState<InviteCode[] | null>(null)
  const [error, setError] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setCodes(null)
    listInviteCodes()
      .then(setCodes)
      .catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorState onRetry={load} />
  if (!codes) return <LoadingCards count={2} />

  const randomize = () => {
    // 読み間違えにくい文字だけでコードを生成（例: MIMA-K7T2M9）
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const part = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setNewCode(`MIMA-${part}`)
  }

  const create = async () => {
    if (!newCode.trim() || !newOrg.trim()) {
      setFormError('コードと団体名の両方を入力してください')
      return
    }
    setBusy(true)
    try {
      await createInviteCode(newCode.trim(), newOrg.trim())
      showToast(`招待コード ${newCode.trim()} を発行しました。`)
      setNewCode('')
      setNewOrg('')
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '発行に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">新しい招待コードを発行</h2>
        <Field label="コード" hint="団体に配布する文字列です。「ランダム生成」がおすすめ">
          {(a11y) => (
            <div className="flex gap-2">
              <input
                {...a11y}
                type="text"
                autoCapitalize="characters"
                value={newCode}
                onChange={(e) => {
                  setFormError(null)
                  setNewCode(e.target.value)
                }}
                placeholder="例：MIMA-K7T2M9"
                className={inputClass()}
              />
              <Button onClick={randomize} className="shrink-0">
                <Dices className="h-4 w-4" aria-hidden="true" />
                ランダム生成
              </Button>
            </div>
          )}
        </Field>
        <Field label="配布先の団体名" error={formError ?? undefined}>
          {(a11y) => (
            <input
              {...a11y}
              type="text"
              value={newOrg}
              onChange={(e) => {
                setFormError(null)
                setNewOrg(e.target.value)
              }}
              placeholder="例：○○特別支援学校PTA"
              className={inputClass(Boolean(formError))}
            />
          )}
        </Field>
        <Button variant="primary" disabled={busy} onClick={() => void create()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          発行する
        </Button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-600">発行済みのコード</h2>
        <ul className="space-y-3">
          {codes.map((c) => (
            <li key={c.code} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-mono text-base font-bold text-slate-900">{c.code}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    c.active ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {c.active ? '有効' : '無効'}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate-600">{c.organizationName}</p>
              <Button
                onClick={() =>
                  void setInviteCodeActive(c.code, !c.active)
                    .then(() => {
                      showToast(c.active ? 'コードを無効化しました。新規登録に使えなくなります。' : 'コードを有効に戻しました。')
                      load()
                    })
                    .catch(() => showToast('操作に失敗しました。'))
                }
              >
                {c.active ? '無効化する' : '有効に戻す'}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ReportsSection() {
  const showToast = useToast()
  const { refresh } = useApp()
  const [reports, setReports] = useState<Report[] | null>(null)
  const [requestStates, setRequestStates] = useState<
    Record<string, { exists: boolean; hidden: boolean }>
  >({})
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setReports(null)
    listReports()
      .then(async (rs) => {
        setReports(rs)
        const states: Record<string, { exists: boolean; hidden: boolean }> = {}
        for (const r of rs.filter((r) => r.status === 'open')) {
          if (!(r.requestId in states)) {
            try {
              states[r.requestId] = await getRequestState(r.requestId)
            } catch {
              states[r.requestId] = { exists: false, hidden: false }
            }
          }
        }
        setRequestStates(states)
      })
      .catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorState onRetry={load} />
  if (!reports) return <LoadingCards count={2} />

  const open = reports.filter((r) => r.status === 'open')
  const done = reports.filter((r) => r.status === 'done')

  const toggleHidden = async (r: Report, hidden: boolean) => {
    try {
      await setRequestHidden(r.requestId, hidden)
      showToast(hidden ? '投稿を非表示にしました。メンバーには見えません。' : '投稿を表示に戻しました。')
      load()
      void refresh() // ホーム画面の一覧にも即時反映する
    } catch {
      showToast('操作に失敗しました。')
    }
  }

  const markDone = async (r: Report) => {
    try {
      await setReportStatus(r.id, 'done')
      showToast('対応済みにしました。')
      load()
    } catch {
      showToast('操作に失敗しました。')
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-600">
          未対応の通報（{open.length}件）
        </h2>
        {open.length === 0 ? (
          <EmptyState
            icon={<Flag className="h-6 w-6" aria-hidden="true" />}
            title="未対応の通報はありません"
          />
        ) : (
          <ul className="space-y-3">
            {open.map((r) => {
              const state = requestStates[r.requestId]
              return (
                <li key={r.id} className="rounded-2xl border border-amber-300 bg-white p-4">
                  <p className="mb-1 text-base font-bold text-slate-900">{r.reason}</p>
                  <p className="mb-1 text-sm text-slate-700">対象：{r.requestSummary}</p>
                  {r.detail && <p className="mb-1 text-sm text-slate-700">詳細：{r.detail}</p>}
                  <p className="mb-3 text-xs text-slate-500">{formatDateTime(r.createdAt)} 受付</p>
                  <div className="flex flex-wrap gap-2">
                    {state?.exists && !state.hidden && (
                      <Button variant="danger" onClick={() => void toggleHidden(r, true)}>
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                        投稿を非表示にする
                      </Button>
                    )}
                    {state?.exists && state.hidden && (
                      <Button onClick={() => void toggleHidden(r, false)}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        表示に戻す
                      </Button>
                    )}
                    {state && !state.exists && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                        対象の投稿はすでに解決済み・削除済みです
                      </span>
                    )}
                    <Button onClick={() => void markDone(r)}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      対応済みにする
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-600">
            対応済み（{done.length}件）
          </h2>
          <ul className="space-y-2">
            {done.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                {r.reason} — {r.requestSummary}（{formatDateTime(r.createdAt)}）
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
