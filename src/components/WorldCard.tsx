import { useState } from 'react'
import { WorldConfig, SimResult } from '../worlds/worldEngine'

const paramDefs: Array<{ key: keyof WorldConfig['params']; label: string; hint: string }> = [
  { key: 'iranWarIntensity', label: 'Iran War Intensity', hint: '0 = de-escalation, 100 = full war' },
  { key: 'russiaUkraineStatus', label: 'Russia-Ukraine Status', hint: '0 = peace, 100 = full war' },
  { key: 'usChinaTension', label: 'US-China Tension', hint: 'Strategic rivalry level' },
  { key: 'hormuzClosure', label: 'Hormuz Closure', hint: '% of shipping blocked' },
  { key: 'aiAdoptionRate', label: 'AI Adoption Rate', hint: 'Speed of diffusion' },
  { key: 'aiGovernance', label: 'AI Governance', hint: 'Treaty coordination level' },
  { key: 'techDecoupling', label: 'Tech Decoupling', hint: 'US-China tech split' },
  { key: 'fiscalResponse', label: 'Fiscal Response', hint: 'UBI + stimulus aggression' },
  { key: 'tradeOpenness', label: 'Trade Openness', hint: 'Global trade integration' },
  { key: 'greenTransition', label: 'Green Transition', hint: 'Climate investment' },
  { key: 'politicalStability', label: 'Political Stability', hint: 'Institutional resilience' },
  { key: 'inequalityLevel', label: 'Inequality Level', hint: 'Wealth concentration' }
]

interface WorldCardProps {
  world: WorldConfig
  result?: SimResult
  selected: boolean
  onToggle: () => void
  onUpdate: (paramKey: keyof WorldConfig['params'], value: number) => void
  onRemove?: () => void
}

export default function WorldCard({ world, result, selected, onToggle, onUpdate, onRemove }: WorldCardProps) {
  const [expanded, setExpanded] = useState(false)

  const latestIndex = result ? Math.max(0, result.gdpGrowth.length - 1) : 0
  const preview = result
    ? {
        gdp: result.gdpGrowth[0]?.toFixed(2),
        oil: result.oilPrice[0]?.toFixed(0),
        conflict: result.conflictIndex[0]?.toFixed(0),
        ai: result.aiProductivityContribution[latestIndex]?.toFixed(2)
      }
    : null

  return (
    <div
      className="rounded-2xl border bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 shadow-glow"
      style={{ borderColor: world.color }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-white">{world.name}</div>
          <div className="mt-1 flex items-center gap-2">
            {world.probability !== undefined && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                {world.probability}% probability
              </span>
            )}
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: `${world.color}33`, color: world.color }}
            >
              {selected ? 'Included' : 'Excluded'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Collapse' : 'Tune'}
          </button>
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
            onClick={onToggle}
          >
            {selected ? 'Hide' : 'Show'}
          </button>
          {onRemove && (
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-red-300"
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-200">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-slate-400">GDP Growth (Y0)</div>
          <div className="text-base font-semibold">{preview ? `${preview.gdp}%` : '—'}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-slate-400">Oil Price (Y0)</div>
          <div className="text-base font-semibold">{preview ? `$${preview.oil}` : '—'}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-slate-400">Conflict Index</div>
          <div className="text-base font-semibold">{preview ? preview.conflict : '—'}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-slate-400">AI Productivity (Yr End)</div>
          <div className="text-base font-semibold">{preview ? `${preview.ai}%` : '—'}</div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {paramDefs.map((param) => (
            <div key={param.key} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div>
                  <div className="font-semibold text-slate-100">{param.label}</div>
                  <div className="text-slate-500">{param.hint}</div>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {world.params[param.key]}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={world.params[param.key]}
                onChange={(event) => onUpdate(param.key, Number(event.target.value))}
                className="mt-3 w-full accent-white/70"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-slate-400">Based on: {world.analogy ?? 'Current trajectory'}</div>
    </div>
  )
}
