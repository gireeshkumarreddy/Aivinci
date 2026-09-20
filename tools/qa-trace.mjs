/** Trace computed opacity/transform of elements during a chapter's reveal: node tools/qa-trace.mjs <#id> "<selector>" */
import puppeteer from 'puppeteer-core'
const [id, sel] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-first-run', '--hide-scrollbars', '--mute-audio'] })
const pg = await b.newPage()
await pg.setViewport({ width: 1440, height: 900 })
await pg.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' })
await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 6500))
const log = await pg.evaluate(async (id, sel) => {
  const el = document.querySelector(id)
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
  const t0 = performance.now()
  const out = []
  await new Promise((res) => {
    const iv = setInterval(() => {
      const els = Array.from(document.querySelectorAll(sel))
      out.push(`${Math.round(performance.now() - t0)}ms ` + els.map((e) => { const cs = getComputedStyle(e); return `${(e.className || e.tagName).toString().split(' ')[0].slice(0, 14)}:o=${(+cs.opacity).toFixed(2)},t=${cs.transform.slice(0, 40)}` }).join(' | '))
      if (performance.now() - t0 > 2200) { clearInterval(iv); res() }
    }, 200)
  })
  return out
}, id, sel)
console.log(log.join('\n'))
await b.close()
