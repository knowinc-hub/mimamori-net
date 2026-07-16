/**
 * 添付写真を縮小して DataURL 化する。
 * localStorage 保存（Phase 1）とアップロード（Phase 2）の両方でサイズを抑える。
 */
export async function fileToResizedDataUrl(file: File, maxSize = 1024): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('画像は10MB以下にしてください')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('画像を処理できませんでした')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}
