export interface WikidataEvent {
  id: string
  label: string
  date: string
  description?: string
}

interface CacheEntry {
  timestamp: number
  events: WikidataEvent[]
}

const buildQuery = (
  start: string,
  end: string,
  limit: number,
  options?: { includeDescription?: boolean; orderByDate?: boolean }
) => `
SELECT ?event ?eventLabel ?date ${options?.includeDescription !== false ? '?desc' : ''} WHERE {
  ?event wdt:P31/wdt:P279* wd:Q1190554.
  ?event wdt:P585 ?date.
  FILTER(?date >= "${start}T00:00:00Z"^^xsd:dateTime && ?date < "${end}T00:00:00Z"^^xsd:dateTime)
  ${options?.includeDescription !== false ? 'OPTIONAL { ?event schema:description ?desc FILTER(LANG(?desc) = "en") }' : ''}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
${options?.orderByDate === false ? '' : 'ORDER BY DESC(?date)'}
LIMIT ${limit}
`

const parseDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

const cacheKey = (startYear: number, endYear: number, limit: number) =>
  `wikidata-events-${startYear}-${endYear}-${limit}`

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

const readCache = (key: string): CacheEntry | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.timestamp || !Array.isArray(parsed.events)) return null
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

const writeCache = (key: string, events: WikidataEvent[]) => {
  if (typeof window === 'undefined') return
  const entry: CacheEntry = { timestamp: Date.now(), events }
  try {
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore cache write errors
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchWikidataEvents(
  startYear: number,
  endYear: number,
  limit = 40
): Promise<WikidataEvent[]> {
  const key = cacheKey(startYear, endYear, limit)
  const cached = readCache(key)
  if (cached) return cached.events

  const start = `${startYear}-01-01`
  const end = `${endYear + 1}-01-01`
  const buildUrl = (query: string) =>
    `/api/wikidata/sparql?format=json&query=${encodeURIComponent(query)}`

  const fetchOnce = async (query: string) => {
    const url = buildUrl(query)
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json'
      }
    })
    if (!response.ok) {
      throw new Error(`Wikidata request failed: ${response.status}`)
    }
    return response.json()
  }

  let data: any
  const primaryQuery = buildQuery(start, end, limit, { includeDescription: true, orderByDate: true })
  try {
    data = await fetchOnce(primaryQuery)
  } catch (error) {
    const message = (error as Error).message
    if (message.includes('429') || message.includes('504')) {
      await sleep(900)
      const fallbackQuery = buildQuery(start, end, Math.max(20, Math.floor(limit / 2)), {
        includeDescription: false,
        orderByDate: false
      })
      try {
        data = await fetchOnce(fallbackQuery)
      } catch {
        // Last-resort: shrink to the most recent 5 years to avoid timeouts.
        const fallbackStartYear = Math.max(startYear, endYear - 5)
        const recentStart = `${fallbackStartYear}-01-01`
        const recentEnd = `${endYear + 1}-01-01`
        const recentQuery = buildQuery(recentStart, recentEnd, 20, {
          includeDescription: false,
          orderByDate: false
        })
        data = await fetchOnce(recentQuery)
      }
    } else {
      throw error
    }
  }
  const bindings = data?.results?.bindings ?? []

  const events = bindings.map((binding: Record<string, { value: string }>) => {
    const eventUrl = binding.event?.value ?? ''
    const id = eventUrl.split('/').pop() ?? eventUrl
    return {
      id,
      label: binding.eventLabel?.value ?? 'Unknown event',
      date: parseDate(binding.date?.value ?? ''),
      description: binding.desc?.value
    }
  })
  writeCache(key, events)
  return events
}
