export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : ''
  const baseQuery = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const target = `https://api.stlouisfed.org/${path}${baseQuery}`
  const response = await fetch(target)
  const text = await response.text()
  res.status(response.status)
  res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
  res.send(text)
}
