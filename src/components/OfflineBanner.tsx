import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/** オフライン時の常時表示バナー。キャッシュ済み画面は閲覧できる旨を案内する。 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div role="status" className="bg-slate-800 px-4 py-2 text-center">
      <p className="flex items-center justify-center gap-2 text-sm font-medium text-white">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        オフラインです。表示中の情報は最新でない可能性があります。
      </p>
    </div>
  )
}
