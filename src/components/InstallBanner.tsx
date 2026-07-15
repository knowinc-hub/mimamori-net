import { useEffect, useState } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'
import { Button } from './ui/Button'

const DISMISS_KEY = 'mimamori:install-banner-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

/**
 * ホーム画面追加の案内バナー（初回のみ・閉じられる）。
 * Android/デスクトップは beforeinstallprompt、iOS Safari は手順の案内を表示。
 */
export function InstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return
    if (isIos()) {
      setVisible(true)
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3">
      <div className="relative rounded-2xl border border-teal-200 bg-teal-50 p-4 pr-12">
        <button
          type="button"
          onClick={dismiss}
          aria-label="この案内を閉じる"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-teal-100"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-base font-bold text-slate-900">ホーム画面に追加できます</p>
        {isIos() ? (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm leading-relaxed text-slate-700">
            Safari の共有ボタン
            <Share className="inline h-4 w-4 text-teal-800" aria-label="共有アイコン" />
            から「ホーム画面に追加
            <PlusSquare className="inline h-4 w-4 text-teal-800" aria-hidden="true" />
            」を選ぶと、アプリのように使えます。通知機能もホーム画面追加後に利用できます。
          </p>
        ) : (
          <div className="mt-2">
            <p className="mb-2 text-sm text-slate-700">アプリのようにすばやく開けて、通知も受け取れます。</p>
            <Button
              variant="primary"
              onClick={() => {
                void installEvent?.prompt()
                dismiss()
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              ホーム画面に追加
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
