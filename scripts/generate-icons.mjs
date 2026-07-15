// PWA用アイコンを外部依存なしで生成するスクリプト。
// 実行: node scripts/generate-icons.mjs
// デザインを差し替える場合は public/ の PNG を直接置き換えても良い。
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(publicDir, { recursive: true })

const TEAL = [15, 118, 110] // #0f766e
const WHITE = [255, 255, 255]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

// 角丸四角のSDF（負なら内側）
function roundedRectDist(x, y, half, radius) {
  const qx = Math.abs(x) - (half - radius)
  const qy = Math.abs(y) - (half - radius)
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius
}

/**
 * アイコン描画: テーマ色の背景に、白いリング＋中心のドット（見守りの目）。
 * maskable はOS側で切り抜かれるため全面背景＋モチーフを小さめに。
 */
function drawIcon(size, { maskable = false, opaqueSquare = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const c = size / 2
  const motifScale = maskable ? 0.62 : 0.78
  const ringR = (size / 2) * motifScale * 0.62
  const ringW = size * 0.055
  const dotR = ringR * 0.42
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - c
      const dy = y + 0.5 - c
      // 背景アルファ
      let bgA = 1
      if (!maskable && !opaqueSquare) {
        bgA = clamp01(0.5 - roundedRectDist(dx, dy, c, size * 0.22))
      }
      const d = Math.hypot(dx, dy)
      const ringA = clamp01(0.5 - (Math.abs(d - ringR) - ringW))
      const dotA = clamp01(0.5 - (d - dotR))
      const fgA = Math.max(ringA, dotA)
      const r = TEAL[0] + (WHITE[0] - TEAL[0]) * fgA
      const g = TEAL[1] + (WHITE[1] - TEAL[1]) * fgA
      const b = TEAL[2] + (WHITE[2] - TEAL[2]) * fgA
      const i = (y * size + x) * 4
      px[i] = Math.round(r)
      px[i + 1] = Math.round(g)
      px[i + 2] = Math.round(b)
      px[i + 3] = Math.round(bgA * 255)
    }
  }
  return encodePng(size, px)
}

writeFileSync(join(publicDir, 'icon-192.png'), drawIcon(192))
writeFileSync(join(publicDir, 'icon-512.png'), drawIcon(512))
writeFileSync(join(publicDir, 'icon-maskable-512.png'), drawIcon(512, { maskable: true }))
writeFileSync(join(publicDir, 'apple-touch-icon.png'), drawIcon(180, { opaqueSquare: true }))

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f766e"/>
  <circle cx="32" cy="32" r="15" fill="none" stroke="#ffffff" stroke-width="6"/>
  <circle cx="32" cy="32" r="7" fill="#ffffff"/>
</svg>
`
writeFileSync(join(publicDir, 'favicon.svg'), faviconSvg)
console.log('icons generated in public/')
