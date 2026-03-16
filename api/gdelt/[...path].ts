export default async function handler(req: any, res: any) {
  const path = (req.query.path as string[])?.join('/') ?? ''
  const baseQuery = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const target = `https://api.gdeltproject.org/${path}${baseQuery}`
  const response = await fetch(target, {
    headers: {
      'User-Agent': 'ParallelWorldSimulator/1.0'
    }
  })
  const text = await response.text()
  res.status(response.status)
  res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
  res.send(text)
}
