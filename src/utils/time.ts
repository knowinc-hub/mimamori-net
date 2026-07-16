/** 「たった今」「25分前」などの相対時刻表示 */
export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

/** 経過分数を「1時間25分」形式に */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min}分`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}

/** 「7月15日 14:30」形式 */
export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}
