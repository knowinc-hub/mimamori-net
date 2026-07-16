/**
 * 転載抑止つき写真表示。
 * - img への pointer-events を無効化（長押し保存・ドラッグの抑止）
 * - 「みまもりネット限定共有」の透かしをオーバーレイ
 * 完全な保存防止は技術的に不可能（スクリーンショット等）。README に明記済み。
 */
export function GuardedPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="guarded-photo relative select-none overflow-hidden rounded-xl border border-slate-200">
      <img src={src} alt={alt} draggable={false} className="max-h-56 w-full object-cover" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2"
      >
        <span className="rounded bg-black/35 px-2 py-0.5 text-xs tracking-wider text-white/90">
          みまもりネット限定共有
        </span>
      </div>
    </div>
  )
}
