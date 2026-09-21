import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-first-run', '--hide-scrollbars', '--mute-audio'] })
const pg = await b.newPage()
const W = +(process.argv[2] || 1280), H = +(process.argv[3] || 800); await pg.setViewport({ width: W, height: H, isMobile: W < 1024, hasTouch: W < 1024 })
const errors = []
pg.on('pageerror', (e) => errors.push(e.message))
pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await pg.goto(process.env.QA_URL || 'http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
const log = await pg.evaluate(() => new Promise((resolve) => {
  const log = []; const t0 = performance.now()
  const iv = setInterval(() => {
    const h = document.querySelector('header')
    const intro = document.querySelector('[class*="intro"][aria-hidden="true"]')
    const heroChar = document.querySelector('[data-hero="character"]')
    const nav = document.querySelector('[data-hdr="nav"]')
    const introMark = document.querySelector('[class*="lockupWrap"] [data-lockup-mark]')
    const hand = document.querySelector('[data-hero="hand"] [data-hand-line]')
    const r = introMark ? introMark.getBoundingClientRect() : null
    log.push({ t: Math.round(performance.now() - t0), locked: h?.dataset.locked, ready: h?.dataset.ready, intro: intro ? getComputedStyle(intro).opacity : 'gone', hero: heroChar ? getComputedStyle(heroChar).opacity : null, nav: nav ? getComputedStyle(nav).opacity : null, mark: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width)] : null, hand: hand ? hand.style.getPropertyValue('--p') : null })
    if (performance.now() - t0 > 7500) { clearInterval(iv); resolve(log) }
  }, 250)
}))
for (const l of log) console.log(`${String(l.t).padStart(5)}ms locked=${l.locked} ready=${l.ready} intro=${l.intro} hero=${Number(l.hero).toFixed(2)} nav=${Number(l.nav).toFixed(2)} mark=${JSON.stringify(l.mark)} hand=${l.hand}`)
console.log('errors:', errors)
await b.close()
