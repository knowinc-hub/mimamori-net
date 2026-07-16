import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { Area, MemberStatus } from '../types'

const EMAIL_KEY = 'mimamori:signin-email'
let emailLinkConsumed = false

/** 認証・会員ステータスの状態機械 */
export type AuthPhase =
  | 'loading' // 初期化中
  | 'signedOut' // 未ログイン → ログイン画面
  | 'needEmail' // メールリンクで開いたがメールアドレス不明（別端末）
  | 'unregistered' // ログイン済みだが会員登録（招待コード）未完了
  | 'pending' // 承認待ち
  | 'suspended' // 利用停止
  | 'approved' // 利用可能

interface AuthContextValue {
  phase: AuthPhase
  user: User | null
  isAdmin: boolean
  /** ログインリンクをメールで送る */
  sendLoginLink: (email: string) => Promise<void>
  /** 別端末でリンクを開いた場合のメールアドレス再入力 */
  completeSignIn: (email: string) => Promise<void>
  /** 招待コードで会員登録（→ 承認待ち） */
  register: (input: { inviteCode: string; nickname: string; area: Area }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [needEmail, setNeedEmail] = useState(false)
  const [memberStatus, setMemberStatus] = useState<MemberStatus | 'none' | 'unknown'>('unknown')
  const [isAdmin, setIsAdmin] = useState(false)

  // メールリンクでの着地を処理
  useEffect(() => {
    const url = window.location.href
    if (!isSignInWithEmailLink(auth, url)) return
    // StrictMode の二重マウントでリンクを二度消費しないようにガード
    if (emailLinkConsumed) return
    emailLinkConsumed = true
    const email = localStorage.getItem(EMAIL_KEY)
    if (!email) {
      setNeedEmail(true)
      return
    }
    signInWithEmailLink(auth, email, url)
      .then(() => {
        localStorage.removeItem(EMAIL_KEY)
        // リンクのクエリパラメータをURLから消す
        window.history.replaceState(null, '', window.location.pathname)
      })
      .catch(() => {
        // リンクが期限切れ・使用済みの場合はメールアドレス確認からやり直し
        setNeedEmail(true)
      })
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
      if (u) setNeedEmail(false)
    })
  }, [])

  // users/{uid} を購読して承認状態をライブ反映（承認された瞬間に使えるように）
  useEffect(() => {
    if (!user) {
      setMemberStatus('unknown')
      setIsAdmin(false)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setMemberStatus(snap.exists() ? (snap.data().status as MemberStatus) : 'none')
      },
      () => setMemberStatus('none'),
    )
    void getDoc(doc(db, 'admins', user.uid))
      .then((s) => setIsAdmin(s.exists()))
      .catch(() => setIsAdmin(false))
    return unsub
  }, [user])

  const sendLoginLink = useCallback(async (email: string) => {
    await sendSignInLinkToEmail(auth, email, {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true,
    })
    localStorage.setItem(EMAIL_KEY, email)
  }, [])

  const completeSignIn = useCallback(async (email: string) => {
    await signInWithEmailLink(auth, email, window.location.href)
    localStorage.removeItem(EMAIL_KEY)
    window.history.replaceState(null, '', window.location.pathname)
    setNeedEmail(false)
  }, [])

  const register = useCallback(
    async (input: { inviteCode: string; nickname: string; area: Area }) => {
      const u = auth.currentUser
      if (!u) throw new Error('ログインが必要です')
      const codeSnap = await getDoc(doc(db, 'inviteCodes', input.inviteCode.trim()))
      if (!codeSnap.exists() || !codeSnap.data().active) {
        throw new Error('招待コードが正しくないか、無効になっています')
      }
      await setDoc(doc(db, 'users', u.uid), {
        nickname: input.nickname.trim(),
        area: input.area,
        district: '',
        status: 'pending',
        inviteCode: input.inviteCode.trim(),
        organizationName: codeSnap.data().organizationName ?? '',
        notify: { newRequest: true, resolved: true, night: false },
        createdAt: serverTimestamp(),
      })
    },
    [],
  )

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
  }, [])

  const phase: AuthPhase = !authReady
    ? 'loading'
    : needEmail
      ? 'needEmail'
      : !user
        ? 'signedOut'
        : memberStatus === 'unknown'
          ? 'loading'
          : memberStatus === 'none'
            ? 'unregistered'
            : memberStatus === 'pending'
              ? 'pending'
              : memberStatus === 'suspended'
                ? 'suspended'
                : 'approved'

  const value = useMemo(
    () => ({ phase, user, isAdmin, sendLoginLink, completeSignIn, register, signOut }),
    [phase, user, isAdmin, sendLoginLink, completeSignIn, register, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth は AuthProvider の内側で使用してください')
  return ctx
}

/** AuthProvider の外（モックモード）では null を返す版 */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext)
}
