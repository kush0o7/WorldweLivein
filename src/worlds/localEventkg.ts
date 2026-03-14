export interface LocalEvent {
  id: string
  label: string
  description?: string
  date?: string
}

export async function fetchLocalEventkgEvents(): Promise<LocalEvent[]> {
  try {
    const response = await fetch('/data/eventkg_events.json', { cache: 'force-cache' })
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data as LocalEvent[]
  } catch {
    return []
  }
}
