/**
 * Visual QA harness — drives the installed Chrome through DevTools emulation.
 *
 *   node tools/qa.mjs shot <width> <height> <out.png> [--full] [--touch] [--settled|--live] [--wait ms] [--scroll y] [--dark]
 *   node tools/qa.mjs audit <width> <height> [--touch]
 *
 * `audit` reports horizontal overflow offenders, console errors, failed requests,
 * tiny text and document size for the given viewport.
 */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.QA_URL || 'http://127.0.0.1:5173/'

const args = process.argv.slice(2)
const cmd = args.shift()
const flags = new Set(args.filter((a) => a.startsWith('--')))
const pos = args.filter((a) => !a.startsWith('--'))
const opt = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}

const width = parseInt(pos[0] || '1440', 10)
const height = parseInt(pos[1] || '900', 10)
const touch = flags.has('--touch') || width < 1024
const live = flags.has('--live')
const url = live ? BASE : BASE + (BASE.includes('?') ? '&' : '?') + 'settled'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage()
await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch })
if (flags.has('--dark')) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
if (flags.has('--reduced')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

const consoleMsgs = []
const failed = []
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message}`))
page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`))
page.on('response', (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
})

await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 })
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await page.evaluate(() => document.fonts.ready)
const wait = parseInt(opt('--wait', live ? '7000' : '600'), 10)
await new Promise((r) => setTimeout(r, wait))

if (cmd === 'shot') {
  const out = pos[2]
  const scrollY = parseInt(opt('--scroll', '0'), 10)
  if (scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY)
    await new Promise((r) => setTimeout(r, 700))
  }
  if (flags.has('--full')) {
    // scroll through the page first so every lazy asset and scroll-triggered reveal has fired
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight
      for (let y = 0; y < h; y += 500) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 40))
      }
      window.scrollTo(0, 0)
    })
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => {
        i.loading = 'eager'
        if (!i.complete || i.naturalWidth === 0) {
          const s = i.getAttribute('src')
          i.removeAttribute('src')
          i.setAttribute('src', s)
        }
      })
      await Promise.all(Array.from(document.images).map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = i.onerror = r }))))
    })
    await new Promise((r) => setTimeout(r, 900))
    await page.screenshot({ path: out, fullPage: true })
  } else {
    await page.screenshot({ path: out })
  }
  console.log(out)
}

if (cmd === 'audit' || flags.has('--audit')) {
  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const bad = []
    // an element clipped by an ancestor (overflow hidden/clip/scroll) cannot widen the page
    const clipped = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX
        if (o !== 'visible') return true
      }
      return false
    }
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed') return
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && !clipped(el)) {
        bad.push({ tag: el.tagName, cls: String(el.className).slice(0, 70), left: Math.round(r.left), right: Math.round(r.right) })
      }
    })
    const tiny = []
    document.querySelectorAll('p, span, a, li, h1, h2, h3, button, label').forEach((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs && fs < 9 && el.textContent.trim().length > 2 && el.getClientRects().length) tiny.push({ fs, text: el.textContent.trim().slice(0, 40) })
    })
    return {
      vw,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      overflow: bad.slice(0, 30),
      tinyText: tiny.slice(0, 20),
      imagesMissing: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    }
  })
  console.log(JSON.stringify({ viewport: `${width}x${height}`, ...report, console: consoleMsgs, failedRequests: failed }, null, 2))
}

await browser.close()
