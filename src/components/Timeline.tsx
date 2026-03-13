import { SimEvent } from '../worlds/worldEngine'

const categoryColors: Record<string, string> = {
  war: '#E24B4A',
  ai: '#1D9E75',
  economic: '#BA7517',
  political: '#7F77DD',
  climate: '#378ADD',
  tech: '#D85A30',
  society: '#BA7517'
}

const severityColors: Record<string, string> = {
  critical: '#E24B4A',
  high: '#D85A30',
  medium: '#BA7517',
  low: '#1D9E75'
}

interface TimelineProps {
  events: SimEvent[]
}

export default function Timeline({ events }: TimelineProps) {
  if (!events.length) {
    return <div className="text-sm text-slate-400">No events triggered yet.</div>
  }

  return (
    <div className="relative space-y-4">
      <div className="absolute left-3 top-0 h-full w-px bg-white/10" />
      {events.map((event, index) => (
        <div
          key={`${event.year}-${index}`}
          className="relative pl-10 animate-fade-in"
        >
          <div
            className="absolute left-1 top-2 h-4 w-4 rounded-full border border-white/20"
            style={{ backgroundColor: categoryColors[event.category] || '#1D9E75' }}
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-white/10 px-3 py-1">{event.year}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 capitalize">{event.category}</span>
              <span
                className="rounded-full px-3 py-1 font-semibold capitalize"
                style={{ backgroundColor: `${severityColors[event.severity]}33`, color: severityColors[event.severity] }}
              >
                {event.severity}
              </span>
            </div>
            <div className="mt-2 text-base font-semibold text-white">{event.title}</div>
            <div className="mt-1 text-sm text-slate-300">{event.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
