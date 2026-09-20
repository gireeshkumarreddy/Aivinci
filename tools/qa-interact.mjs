/** Interaction smoke test in foreground headless Chrome */
import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-first-run', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] })
const pg = await b.newPage()
const errors = []
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await pg.setViewport({ width: 1280, height: 800 })
await pg.goto((process.env.QA_URL || 'http://127.0.0.1:5173/') + '?settled', { waitUntil: 'networkidle0' })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const out = {}
// 1. nav click → scroll + active state + header theme
await pg.click('header a[data-nav-id="work"]')
await wait(1800)
out.navWork = await pg.evaluate(() => { const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; const top = Math.round(document.getElementById('work').getBoundingClientRect().top + window.scrollY); return { scrollY: Math.round(window.scrollY), workTop: top, underHeader: Math.abs(window.scrollY - (top - hh)) < 2, active: document.querySelector('header a[aria-current=page]')?.textContent, theme: document.querySelector('header').dataset.theme } })
// 2. open a case study from the rail
await pg.click('[data-wk="tile"][data-index="3"] button[aria-label^="Open"]')
await wait(700)
out.caseStudy = await pg.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label*="case study"]'); return { open: d?.getAttribute('aria-hidden'), title: d?.querySelector('h3')?.textContent, locked: document.body.classList.contains('is-locked') } })
await pg.keyboard.press('ArrowRight'); await wait(200)
out.caseStudyNext = await pg.evaluate(() => document.querySelector('[role=dialog][aria-label*="case study"] h3')?.textContent)
await pg.keyboard.press('Escape'); await wait(600)
out.caseStudyClosed = await pg.evaluate(() => ({ hidden: document.querySelector('[role=dialog][aria-label*="case study"]')?.getAttribute('aria-hidden'), locked: document.body.classList.contains('is-locked') }))
// 3. product system: select a card → object responds
await pg.evaluate(() => document.getElementById('product-system').scrollIntoView())
await wait(600)
await pg.click('#product-system button[data-card]:nth-of-type(1)')
await wait(400)
out.system = await pg.evaluate(() => ({ selected: document.getElementById('product-system').dataset.selected, pressed: Array.from(document.querySelectorAll('#product-system [data-card]')).map((b) => b.getAttribute('aria-pressed')), state: document.querySelector('#product-system [aria-live]')?.textContent, tintOpacity: getComputedStyle(document.querySelector('#product-system [class*="armTint"]')).opacity }))
// 4. products carousel
await pg.evaluate(() => document.getElementById('products').scrollIntoView())
await wait(500)
await pg.click('#products button[aria-label="Next"]')
await wait(300)
out.carousel = await pg.evaluate(() => document.querySelector('#products [class*="shotIndex"]')?.textContent.trim())
// 5. search overlay
await pg.click('header button[aria-label="Search the site"]')
await wait(400)
await pg.keyboard.type('zynnect')
await wait(200)
out.search = await pg.evaluate(() => Array.from(document.querySelectorAll('[role=dialog][aria-label="Search"] [role=option]')).map((o) => o.textContent.slice(0, 20)))
await pg.keyboard.press('Enter'); await wait(1500)
out.searchJump = await pg.evaluate(() => { const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; const top = Math.round(document.getElementById('products').getBoundingClientRect().top + window.scrollY); return { scrollY: Math.round(window.scrollY), productsTop: top, underHeader: Math.abs(window.scrollY - (top - hh)) < 2, dialogHidden: document.querySelector('[role=dialog][aria-label="Search"]')?.getAttribute('aria-hidden') } })
// 6. form validation
await pg.evaluate(() => document.getElementById('contact').scrollIntoView())
await wait(400)
out.formValid = await pg.evaluate(() => { const f = document.querySelector('#contact form'); return { invalidBefore: !f.checkValidity(), required: Array.from(f.querySelectorAll('[required]')).map((e) => e.name) } })
// 7. keyboard focus visibility on a button
await pg.evaluate(() => document.querySelector('header a[data-nav-id="services"]').focus())
out.focus = await pg.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, text: a.textContent, outline: getComputedStyle(a).outlineStyle } })
// 8. videos playing?
await pg.evaluate(() => document.getElementById('ai-video-story').scrollIntoView())
await wait(2500)
out.videos = await pg.evaluate(() => Array.from(document.querySelectorAll('#ai-video-story video')).map((v) => ({ src: v.currentSrc.split('/').pop(), paused: v.paused, muted: v.muted, t: +v.currentTime.toFixed(1) })))
console.log(JSON.stringify(out, null, 2))
console.log('errors:', errors)
await b.close()
