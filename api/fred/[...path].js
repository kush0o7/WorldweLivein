export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : ''
  const baseQuery = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing FRED_API_KEY on server' })
    return
  }
  const joiner = baseQuery.includes('?') ? '&' : '?'
  const target = `https://api.stlouisfed.org/${path}${baseQuery}${joiner}api_key=${encodeURIComponent(apiKey)}`
  const response = await fetch(target)
  const text = await response.text()
  res.status(response.status)
  res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
  res.send(text)
}
