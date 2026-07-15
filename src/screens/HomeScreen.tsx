import { Search, HeartHandshake, Leaf } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PostCard } from '../components/PostCard'
import { LoadingCards, EmptyState, ErrorState } from '../components/ui/states'
import { timeAgo } from '../utils/time'

/** 最上部のステータスカード。現在の状況をひと目で伝える。 */
function StatusCard() {
  const { posts } = useApp()
  const searching = posts.filter((p) => p.type === 'searching')

  if (searching.length === 0) {
    return (
      <section
        aria-label="現在の状況"
        className="mb-5 flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white">
          <Leaf className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold text-teal-950">現在、捜索依頼はありません</p>
          <p className="text-sm text-teal-900">エリア内は落ち着いています。</p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="現在の状況"
      className="mb-5 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-700 text-white">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold text-red-950">
            捜索中の依頼が {searching.length} 件あります
          </p>
          <p className="text-sm text-red-900">
            最新：{searching[0].location}（{timeAgo(searching[0].createdAt)}）
          </p>
        </div>
      </div>
    </section>
  )
}

/** 統計は控えめに下部へ（数字の誇示より安心感を優先する方針） */
function StatsFooter() {
  const { posts, history } = useApp()
  return (
    <section aria-label="地域の状況" className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
        この地域の見守り
      </h2>
      <dl className="flex gap-8 text-sm text-slate-700">
        <div>
          <dt className="text-slate-500">捜索中</dt>
          <dd className="text-lg font-bold text-slate-900">
            {posts.filter((p) => p.type === 'searching').length}件
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">解決済み</dt>
          <dd className="text-lg font-bold text-slate-900">{history.length}件</dd>
        </div>
        <div>
          <dt className="text-slate-500">地域メンバー</dt>
          <dd className="text-lg font-bold text-slate-900">12人</dd>
        </div>
      </dl>
    </section>
  )
}

export function HomeScreen() {
  const { loadState, posts, refresh } = useApp()

  if (loadState === 'loading') return <LoadingCards count={3} />
  if (loadState === 'error') return <ErrorState onRetry={() => void refresh()} />

  return (
    <div>
      <StatusCard />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide text-slate-600">最新の依頼・情報</h2>
        <p className="text-sm text-slate-600">{posts.length}件</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState
          icon={<Leaf className="h-6 w-6" aria-hidden="true" />}
          title="投稿はまだありません"
          description="捜索依頼や情報提供があると、ここに表示されます。"
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <StatsFooter />
    </div>
  )
}
