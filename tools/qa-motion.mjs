/** Capture a chapter mid-choreography: node tools/qa-motion.mjs <#id> <out.png> <delayMs> [width] [height]
 *  Scrolls like a user (steps) until the chapter's reveal starts, then waits <delayMs> and captures. */
import puppeteer from 'puppeteer-core'
const [id, out, delay = '600', w = '1440', h = '900'] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-first-run', '--hide-scrollbars', '--mute-audio'] })
const pg = await b.newPage()
await pg.setViewport({ width: +w, height: +h, isMobile: +w < 1024, hasTouch: +w < 1024 })
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' })
await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 6500)) // let the intro finish
// park the chapter just below its trigger line, then scroll down in steps until the reveal starts
const started = await pg.evaluate(async (id) => {
  const el = document.querySelector(id)
  const target = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.95
  window.scrollTo(0, Math.max(0, target))
  await new Promise((r) => setTimeout(r, 400))
  const t0 = performance.now()
  for (let i = 0; i < 60; i++) {
    window.scrollBy(0, 24)
    await new Promise((r) => setTimeout(r, 16))
    if (el.hasAttribute('data-revealing') || el.hasAttribute('data-revealed')) {
      // the choreography has started: bring the chapter fully into view for the capture
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
      return performance.now() - t0
    }
  }
  return -1
}, id)
await new Promise((r) => setTimeout(r, +delay))
await pg.screenshot({ path: out })
console.log(out, 'reveal started after', Math.round(started), 'ms of stepping')
await b.close()
