import { UserRound, Bell, Info, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useOptionalAuth } from '../context/AuthContext'
import { LoadingCards, ErrorState } from '../components/ui/states'
import { Toggle } from '../components/ui/Toggle'
import type { Profile } from '../types'

export function SettingsScreen() {
  const { loadState, profile, updateProfile, refresh } = useApp()
  const auth = useOptionalAuth()

  if (loadState === 'loading' || !profile) {
    if (loadState === 'error') return <ErrorState onRetry={() => void refresh()} />
    return <LoadingCards count={3} />
  }

  const setNotify = (key: keyof Profile['notify'], value: boolean) =>
    void updateProfile({ ...profile, notify: { ...profile.notify, [key]: value } })

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-slate-900">
          <UserRound className="h-5 w-5 text-teal-700" aria-hidden="true" />
          アカウント情報
        </h2>
        <dl className="divide-y divide-slate-100 text-base">
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600">ニックネーム</dt>
            <dd className="font-medium text-slate-900">{profile.nickname}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600">エリア</dt>
            <dd className="font-medium text-slate-900">
              {profile.area} {profile.district}
            </dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600">登録日</dt>
            <dd className="font-medium text-slate-900">{profile.joinedAt}</dd>
          </div>
          {profile.organizationName && (
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-600">所属団体</dt>
              <dd className="font-medium text-slate-900">{profile.organizationName}</dd>
            </div>
          )}
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600">協力実績</dt>
            <dd className="font-bold text-teal-800">{profile.contributions}件</dd>
          </div>
        </dl>
        {auth && (
          <button
            type="button"
            onClick={() => void auth.signOut()}
            className="mt-3 flex min-h-11 items-center gap-1.5 text-base font-medium text-slate-600 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            ログアウト
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-base font-bold text-slate-900">
          <Bell className="h-5 w-5 text-teal-700" aria-hidden="true" />
          通知設定
        </h2>
        <div className="divide-y divide-slate-100">
          <Toggle
            label="新しい捜索依頼"
            checked={profile.notify.newRequest}
            onChange={(v) => setNotify('newRequest', v)}
          />
          <Toggle
            label="発見・解決のお知らせ"
            checked={profile.notify.resolved}
            onChange={(v) => setNotify('resolved', v)}
          />
          <Toggle
            label="深夜（22時〜6時）の通知"
            description="オフにすると深夜帯は通知されません"
            checked={profile.notify.night}
            onChange={(v) => setNotify('night', v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-base font-bold text-slate-900">
          <Info className="h-5 w-5 text-teal-700" aria-hidden="true" />
          このアプリについて
        </h2>
        <p className="text-base leading-relaxed text-slate-800">
          地域で顔が見える見守りネットワークを作るためのアプリです。SNSへの無制限拡散ではなく、
          <strong>エリア内の信頼できるメンバー間</strong>で情報を共有します。
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-800">
          依頼情報は発見・解決後に自動でクローズされます。個人情報の外部拡散はできない設計です。
        </p>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
          このアプリは警察の捜索活動を<strong>補完</strong>するものです。行方不明に気づいたら、まず110番通報・警察への届出をお願いします。
        </p>
      </section>
    </div>
  )
}
