/**
 * Generate SmartIME app icons: purple gradient rounded square.
 * Outputs: icon.png (256x256), icon.ico (multi-size), tray-icon.png (32x32)
 */
const { resolve } = require('path')
const { writeFileSync } = require('fs')
const { Jimp } = require('jimp')
const pngToIco = require('png-to-ico').default

const RESOURCES = resolve(__dirname, '..', 'resources')
const SIZES = [16, 32, 48, 64, 128, 256]
const RADIUS_RATIO = 0.19 // radius / size

async function main() {
  const size = 256
  const radius = Math.round(size * RADIUS_RATIO)
  const img = new Jimp({ width: size, height: size, color: 0x00000000 })

  // Purple gradient background with rounded corners
  for (let y = 0; y < size; y++) {
    const t = y / size
    const r = Math.round(108 + t * 40)
    const g = Math.round(92 - t * 20)
    const b = Math.round(231 - t * 30)
    for (let x = 0; x < size; x++) {
      if (inRoundedRect(x, y, size, size, radius)) {
        const color = ((r << 24) | (g << 16) | (b << 8) | 0xFF) >>> 0
        img.setPixelColor(color, x, y)
      }
    }
  }

  // Draw "S" letter overlay (simplified: three horizontal bars)
  const cx = size / 2
  const cy = size / 2
  const barW = size * 0.32
  const barH = size * 0.08
  const gap = size * 0.1
  const white = 0xFFFFFFFF >>> 0

  // Rounded rectangle function for letter shapes
  function fillBar(x1, y1, w, h) {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          img.setPixelColor(white, x, y)
        }
      }
    }
  }

  // "S" shape made of 3 rounded bars
  const left = cx - barW / 2
  fillBar(left, cy - gap - barH, barW, barH)           // top bar
  fillBar(left, cy - barH / 2, barW, barH)              // middle bar
  fillBar(left, cy + gap, barW, barH)                   // bottom bar

  // Left vertical connector (top half)
  const vertW = barH
  fillBar(left, cy - gap - barH, vertW, gap + barH)
  // Right vertical connector (bottom half)
  fillBar(left + barW - vertW, cy, vertW, gap + barH)

  // Save 256x256 PNG
  const png256Path = resolve(RESOURCES, 'icon.png')
  await img.write(png256Path)
  console.log('Generated:', png256Path)

  // Generate all sizes
  const pngBuffers = []
  for (const sz of SIZES) {
    const resized = img.clone().resize({ w: sz, h: sz })
    const buf = await resized.getBuffer('image/png')
    pngBuffers.push(buf)
    if (sz === 32) {
      const trayPath = resolve(RESOURCES, 'tray-icon.png')
      await resized.write(trayPath)
      console.log('Generated:', trayPath)
    }
  }

  // Convert to .ico
  const icoPath = resolve(RESOURCES, 'icon.ico')
  const icoBuf = await pngToIco(pngBuffers)
  writeFileSync(icoPath, icoBuf)
  console.log('Generated:', icoPath)

  console.log('\nDone. Icon files ready.')
}

/** Check if (px,py) is inside a rounded rectangle [0,w]x[0,h] with corner radius r. */
function inRoundedRect(px, py, w, h, r) {
  // Inside the main rectangle minus corners
  if (px < r && py < r) {
    const dx = r - px - 0.5, dy = r - py - 0.5
    return dx * dx + dy * dy <= r * r
  }
  if (px >= w - r && py < r) {
    const dx = px - (w - r) + 0.5, dy = r - py - 0.5
    return dx * dx + dy * dy <= r * r
  }
  if (px < r && py >= h - r) {
    const dx = r - px - 0.5, dy = py - (h - r) + 0.5
    return dx * dx + dy * dy <= r * r
  }
  if (px >= w - r && py >= h - r) {
    const dx = px - (w - r) + 0.5, dy = py - (h - r) + 0.5
    return dx * dx + dy * dy <= r * r
  }
  return true
}

main().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
