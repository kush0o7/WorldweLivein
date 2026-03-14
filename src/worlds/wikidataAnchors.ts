export interface WikidataEvent {
  id: string
  label: string
  date: string
  description?: string
}

const buildQuery = (start: string, end: string, limit: number) => `
SELECT ?event ?eventLabel ?date ?desc WHERE {
  ?event wdt:P31/wdt:P279* wd:Q1190554.
  ?event wdt:P585 ?date.
  FILTER(?date >= "${start}T00:00:00Z"^^xsd:dateTime && ?date < "${end}T00:00:00Z"^^xsd:dateTime)
  OPTIONAL { ?event schema:description ?desc FILTER(LANG(?desc) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?date)
LIMIT ${limit}
`

const parseDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

export async function fetchWikidataEvents(
  startYear: number,
  endYear: number,
  limit = 40
): Promise<WikidataEvent[]> {
  const start = `${startYear}-01-01`
  const end = `${endYear + 1}-01-01`
  const query = buildQuery(start, end, limit)
  const url = `/api/wikidata/sparql?format=json&query=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/sparql-results+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Wikidata request failed: ${response.status}`)
  }

  const data = await response.json()
  const bindings = data?.results?.bindings ?? []

  return bindings.map((binding: Record<string, { value: string }>) => {
    const eventUrl = binding.event?.value ?? ''
    const id = eventUrl.split('/').pop() ?? eventUrl
    return {
      id,
      label: binding.eventLabel?.value ?? 'Unknown event',
      date: parseDate(binding.date?.value ?? ''),
      description: binding.desc?.value
    }
  })
}
