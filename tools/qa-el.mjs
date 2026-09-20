/** Capture one chapter (settled state) at several widths:
 *    node tools/qa-el.mjs "#products" <outPrefix> 360,390,412,430 [height] [--live] [--offset px]
 *  Writes <outPrefix>-<width>.png with the chapter's top aligned under the header. */
import puppeteer from 'puppeteer-core'
const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const opt = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--offset'))
const [sel, prefix, widths = '390', height = '844'] = pos
const live = flags.has('--live')
const offset = parseInt(opt('--offset', '0'), 10)
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-first-run', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
})
for (const w of widths.split(',').map(Number)) {
  const pg = await b.newPage()
  const mobile = w < 1024
  await pg.setViewport({ width: w, height: +height, isMobile: mobile, hasTouch: mobile })
  const errors = []
  pg.on('pageerror', (e) => errors.push(e.message))
  pg.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await pg.goto('http://127.0.0.1:5173/' + (live ? '' : '?settled'), { waitUntil: 'networkidle0' })
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  await pg.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, live ? 6500 : 500))
  const info = await pg.evaluate(async (sel, offset, settle) => {
    const el = document.querySelector(sel)
    if (!el) return { missing: true }
    const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - hh + offset)
    await new Promise((r) => setTimeout(r, settle))
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), height: Math.round(r.height), scrollY: Math.round(window.scrollY), revealed: el.getAttribute('data-revealed') }
  }, sel, offset, live ? 4500 : 600)
  const out = `${prefix}-${w}.png`
  await pg.screenshot({ path: out })
  console.log(out, JSON.stringify(info), errors.length ? `errors: ${errors.join(' | ')}` : '')
  await pg.close()
}
await b.close()
