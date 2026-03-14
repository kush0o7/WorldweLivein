import fs from 'node:fs'
import path from 'node:path'

const EVENTKG_TSV_URL =
  'https://eventkg.l3s.uni-hannover.de/data/event_list.tsv?attname=&download=1'

const args = process.argv.slice(2)
const limitArg = args.find((arg) => arg.startsWith('--limit='))
const outputArg = args.find((arg) => arg.startsWith('--out='))

const limit = limitArg ? Number(limitArg.split('=')[1]) : 3000
const outputPath = outputArg
  ? outputArg.split('=')[1]
  : path.join(process.cwd(), 'public', 'data', 'eventkg_events.json')

const decodeField = (value) => value.replace(/^"|"$/g, '')

const pickLabel = (raw) => {
  const cleaned = decodeField(raw)
  if (!cleaned) return ''
  const parts = cleaned.split('|')
  const english = parts.find((part) => part.toLowerCase().includes('en:'))
  if (english) {
    return english.replace(/^[^:]*:/, '').trim()
  }
  return parts[0]?.trim() ?? cleaned
}

const parseRow = (row) => {
  const cols = row.split('\t')
  const id = cols[0]?.trim()
  if (!id) return null
  return {
    id,
    label: pickLabel(cols[2] ?? ''),
    description: cols[3] ? `Classes: ${decodeField(cols[3]).split('|').slice(0, 4).join(', ')}` : undefined,
    date: ''
  }
}

const main = async () => {
  console.log(`Downloading EventKG list...`)
  const response = await fetch(EVENTKG_TSV_URL)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }
  const text = await response.text()
  const lines = text.trim().split('\n')
  const data = []

  for (let i = 1; i < lines.length && data.length < limit; i += 1) {
    const parsed = parseRow(lines[i])
    if (parsed && parsed.label) {
      data.push(parsed)
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  console.log(`Saved ${data.length} events to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
