import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import { WorldConfig, SimResult } from '../worlds/worldEngine'

interface SimChartProps {
  metric: keyof SimResult
  worlds: WorldConfig[]
  results: Map<string, SimResult>
}

const BASE_YEAR = 2026

const metricLabels: Record<string, string> = {
  gdpGrowth: 'GDP Growth (%)',
  conflictIndex: 'Conflict Index',
  oilPrice: 'Oil Price (USD)',
  whiteCollarJobsDisrupted: 'White Collar Disrupted (%)',
  aiProductivityContribution: 'AI Productivity (%)',
  giniCoefficient: 'Gini (0-100)',
  geopoliticalFragmentation: 'Fragmentation Index',
  temperatureAnomaly: 'Temp Anomaly (°C)',
  events: 'Events'
}

const referenceMarkers = [
  { year: BASE_YEAR, label: '2026 Baseline' },
  { year: BASE_YEAR + 3, label: "Engels' Pause Ends" },
  { year: BASE_YEAR + 7, label: 'AI Inflection' }
]

export default function SimChart({ metric, worlds, results }: SimChartProps) {
  const maxYears = Math.max(
    0,
    ...Array.from(results.values()).map((result) => result[metric]?.length ?? 0)
  )

  const data = Array.from({ length: maxYears }, (_, index) => {
    const row: Record<string, number | string> = { year: BASE_YEAR + index }
    worlds.forEach((world) => {
      const result = results.get(world.id)
      const series = result ? result[metric] : undefined
      if (Array.isArray(series)) {
        row[world.id] = series[index] ?? null
      }
    })
    return row
  })

  return (
    <div className="h-72 w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
      <div className="mb-3 text-sm font-semibold text-slate-200">{metricLabels[metric]}</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 6" />
          <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
          <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 15, 20, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f1f5f9'
            }}
          />
          {referenceMarkers.map((marker) => (
            <ReferenceLine
              key={marker.year}
              x={marker.year}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 4"
              label={{ value: marker.label, position: 'top', fill: 'rgba(255,255,255,0.6)' }}
            />
          ))}
          {worlds.map((world) => (
            <Line
              key={world.id}
              type="monotone"
              dataKey={world.id}
              stroke={world.color}
              strokeWidth={2.2}
              dot={false}
              isAnimationActive
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
