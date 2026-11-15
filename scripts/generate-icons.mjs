// Gera os ícones PNG da PWA (sem dependências externas).
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

const INDIGO = [79, 70, 229]
const WHITE = [255, 255, 255]
const BLUE = [191, 219, 254]

// Desenha um calendário simples. `scale` < 1 deixa margem de segurança (maskable).
function render(size, { rounded, scale }) {
  const px = Buffer.alloc(size * size * 4)
  const inRound = (x, y, x0, y0, x1, y1, r) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    const cx = Math.min(Math.max(x, x0 + r), x1 - r)
    const cy = Math.min(Math.max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
  }
  const s = size
  const half = (s * scale) / 2
  const c = s / 2
  const bx0 = c - half * 0.62, bx1 = c + half * 0.62
  const by0 = c - half * 0.55, by1 = c + half * 0.65
  const rad = s * 0.06 * scale
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let col = null
      if (!rounded || inRound(x, y, 0, 0, s - 1, s - 1, s * 0.22)) col = INDIGO
      if (col && inRound(x, y, bx0, by0, bx1, by1, rad)) {
        col = WHITE
        // faixa superior do calendário
        if (y < by0 + (by1 - by0) * 0.26) col = BLUE
        // grelha de dias (3x3)
        const gx0 = bx0 + (bx1 - bx0) * 0.14, gx1 = bx1 - (bx1 - bx0) * 0.14
        const gy0 = by0 + (by1 - by0) * 0.36, gy1 = by1 - (by1 - by0) * 0.12
        if (x >= gx0 && x <= gx1 && y >= gy0 && y <= gy1) {
          const u = ((x - gx0) / (gx1 - gx0)) * 3
          const v = ((y - gy0) / (gy1 - gy0)) * 3
          if (u % 1 > 0.18 && u % 1 < 0.82 && v % 1 > 0.18 && v % 1 < 0.82) col = INDIGO
        }
      }
      const i = (y * s + x) * 4
      if (col) {
        px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255
      }
    }
  }
  const raw = Buffer.alloc((s * 4 + 1) * s)
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0
    px.copy(raw, y * (s * 4 + 1) + 1, y * s * 4, (y + 1) * s * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(s, 0)
  ihdr.writeUInt32BE(s, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
const out = [
  ['icon-192.png', 192, { rounded: true, scale: 1.0 }],
  ['icon-512.png', 512, { rounded: true, scale: 1.0 }],
  // maskable: fundo total (o SO recorta) e conteúdo na zona segura
  ['icon-maskable-512.png', 512, { rounded: false, scale: 0.9 }],
  // iOS aplica o seu próprio recorte: fundo total
  ['apple-touch-icon.png', 180, { rounded: false, scale: 1.0 }],
]
for (const [name, size, opts] of out) {
  writeFileSync(`public/icons/${name}`, render(size, opts))
  console.log('gerado', name)
}
