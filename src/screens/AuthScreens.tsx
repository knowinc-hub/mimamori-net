import { useState, type ReactNode } from 'react'
import { Eye, Mail, MailCheck, Hourglass, Ban, LogOut, Send, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Field, inputClass } from '../components/ui/form'
import { AREAS, type Area } from '../types'

/** 認証系画面の共通レイアウト */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white">
          <Eye className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">みまもりネット</h1>
        <p className="text-sm text-slate-600">地域見守り相互支援</p>
      </div>
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6">{children}</div>
      <p className="mt-6 max-w-md text-center text-xs leading-relaxed text-slate-500">
        依頼情報はエリア内の承認されたメンバーだけが閲覧できます。
        解決した依頼の写真・氏名・詳細は自動的に削除されます。
      </p>
    </div>
  )
}

/** ログイン（メールリンク送信） */
export function LoginScreen() {
  const { sendLoginLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (!/.+@.+\..+/.test(email)) {
      setError('メールアドレスの形式が正しくありません')
      return
    }
    setBusy(true)
    try {
      await sendLoginLink(email)
      setSent(true)
    } catch {
      setError('送信に失敗しました。時間をおいてもう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="text-center">
          <MailCheck className="mx-auto mb-3 h-10 w-10 text-teal-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">メールを送信しました</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-700">
            <span className="font-medium">{email}</span> 宛にログイン用のリンクを送りました。
            メールを開いて、リンクをタップしてください。
          </p>
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            届かない場合は迷惑メールフォルダをご確認ください。
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h2 className="mb-1 text-lg font-bold text-slate-900">ログイン / 新規登録</h2>
      <p className="mb-5 text-sm leading-relaxed text-slate-600">
        パスワードは不要です。メールに届くリンクをタップしてログインします。
      </p>
      <Field label="メールアドレス" error={error ?? undefined}>
        {(a11y) => (
          <input
            {...a11y}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setError(null)
              setEmail(e.target.value)
            }}
            placeholder="例：hanako@example.com"
            className={inputClass(Boolean(error))}
          />
        )}
      </Field>
      <Button variant="primary" className="w-full" disabled={busy} onClick={() => void send()}>
        <Mail className="h-4 w-4" aria-hidden="true" />
        {busy ? '送信中…' : 'ログインリンクを送る'}
      </Button>
    </AuthShell>
  )
}

/** 別端末でメールリンクを開いた場合のメールアドレス確認 */
export function ConfirmEmailScreen() {
  const { completeSignIn } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await completeSignIn(email)
    } catch {
      setError('確認できませんでした。リンクを送ったときのメールアドレスを入力してください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h2 className="mb-1 text-lg font-bold text-slate-900">メールアドレスの確認</h2>
      <p className="mb-5 text-sm leading-relaxed text-slate-600">
        確認のため、ログインリンクを受け取ったメールアドレスをもう一度入力してください。
      </p>
      <Field label="メールアドレス" error={error ?? undefined}>
        {(a11y) => (
          <input
            {...a11y}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setError(null)
              setEmail(e.target.value)
            }}
            className={inputClass(Boolean(error))}
          />
        )}
      </Field>
      <Button variant="primary" className="w-full" disabled={busy} onClick={() => void confirm()}>
        確認してログイン
      </Button>
    </AuthShell>
  )
}

/** 会員登録（招待コード必須 → 承認待ちへ） */
export function RegisterScreen() {
  const { register, signOut } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [area, setArea] = useState<Area>('武蔵野市')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!inviteCode.trim()) {
      setError('招待コードを入力してください')
      return
    }
    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }
    setBusy(true)
    try {
      await register({ inviteCode, nickname, area })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h2 className="mb-1 text-lg font-bold text-slate-900">会員登録</h2>
      <p className="mb-5 flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
        このアプリは承認制です。PTA・親の会・支援者団体から配布された招待コードが必要です。
      </p>
      <Field label="招待コード" hint="団体から配布されたコードを入力してください">
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            autoCapitalize="none"
            value={inviteCode}
            onChange={(e) => {
              setError(null)
              setInviteCode(e.target.value)
            }}
            className={inputClass()}
          />
        )}
      </Field>
      <Field label="ニックネーム" hint="本名でなくて構いません（例：田中さん）">
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            value={nickname}
            onChange={(e) => {
              setError(null)
              setNickname(e.target.value)
            }}
            className={inputClass()}
          />
        )}
      </Field>
      <Field label="お住まい・活動エリア">
        {(a11y) => (
          <select
            {...a11y}
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
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
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      <Button variant="primary" className="w-full" disabled={busy} onClick={() => void submit()}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {busy ? '登録中…' : '登録を申請する'}
      </Button>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-1 text-sm text-slate-600"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        ログアウト
      </button>
    </AuthShell>
  )
}

/** 承認待ち */
export function PendingScreen() {
  const { signOut } = useAuth()
  return (
    <AuthShell>
      <div className="text-center">
        <Hourglass className="mx-auto mb-3 h-10 w-10 text-teal-700" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">承認をお待ちください</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-700">
          登録を受け付けました。管理者が確認して承認すると、依頼情報を閲覧できるようになります。
          承認まで少しお時間をいただく場合があります。
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-1 text-sm text-slate-600"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          ログアウト
        </button>
      </div>
    </AuthShell>
  )
}

/** 利用停止 */
export function SuspendedScreen() {
  const { signOut } = useAuth()
  return (
    <AuthShell>
      <div className="text-center">
        <Ban className="mx-auto mb-3 h-10 w-10 text-slate-500" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">アカウントが停止されています</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-700">
          このアカウントは現在ご利用いただけません。心当たりがない場合は、招待コードを配布した団体を通じて管理者にお問い合わせください。
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-1 text-sm text-slate-600"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          ログアウト
        </button>
      </div>
    </AuthShell>
  )
}

/** 初期化中のスプラッシュ */
export function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100" role="status" aria-label="読み込み中">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-teal-700 text-white">
          <Eye className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-600">読み込み中…</p>
      </div>
    </div>
  )
}
