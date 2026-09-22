/** WebKit (Safari-engine) captures: node tools/qa-webkit.mjs <url> <#id|top> <out.png> [offset] [width] [height]
 *  Emulates an iPhone (393 x 852 @3x, touch, Safari UA). Prints console errors and failed requests. */
import { webkit, devices } from 'playwright'
const [url, target = 'top', out = 'webkit.png', offset = '0', w = '393', h = '852'] = process.argv.slice(2)
const b = await webkit.launch()
const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], viewport: { width: +w, height: +h } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
p.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`))
await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await p.waitForTimeout(800)
if (target !== 'top') {
  await p.evaluate(([sel, off]) => { const el = document.querySelector(sel); const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - hh + Number(off)) }, [target, offset])
  await p.waitForTimeout(700)
}
await p.screenshot({ path: out })
const info = await p.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const r = (e) => e && e.getBoundingClientRect().toJSON()
  return {
    logo: r(q('[data-header-brand] [data-lockup]')),
    box: q('[data-ph="phone"]') && { transform: getComputedStyle(q('[data-ph="phone"]').parentElement).transform, s: q('[data-ph="phone"]').parentElement.parentElement.style.getPropertyValue('--s'), outer: r(q('[data-ph="phone"]').parentElement.parentElement), phone: r(q('[data-ph="phone"]')) },
    installation: r(q('#contact [class*="installation"]')), people: r(q('[data-ct="people"]')), reality: r(q('[data-ct="reality"]')), beyond: r(q('#contact p[class*="beyond"]')),
  }
})
console.log(JSON.stringify(info))
console.log('errors', errors)
await b.close()
