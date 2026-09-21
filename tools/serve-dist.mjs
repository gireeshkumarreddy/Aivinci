/** Serve the static export like a plain host: node tools/serve-dist.mjs [dir=dist] [base=/] [port=8095] */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const [root = 'dist', base = '/', port = '8095'] = process.argv.slice(2)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.php': 'text/plain' }
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (!url.startsWith(base)) { res.writeHead(404); res.end('outside base'); return }
  let rel = url.slice(base.length)
  if (rel === '' || rel.endsWith('/')) rel += 'index.html'
  const file = path.join(root, rel)
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return }
  const stat = fs.statSync(file)
  const type = types[path.extname(file)] || 'application/octet-stream'
  const range = req.headers.range
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-').map((n) => parseInt(n, 10))
    const start = s || 0, end = isNaN(e) ? stat.size - 1 : e
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 })
    fs.createReadStream(file, { start, end }).pipe(res)
    return
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' })
  fs.createReadStream(file).pipe(res)
}).listen(+port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}${base}`))
