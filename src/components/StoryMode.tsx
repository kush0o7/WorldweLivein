import { useEffect, useMemo, useState } from 'react'
import { CurrentSignals, DEFAULT_SIGNALS, generatePrediction, TimeMachinePrediction } from '../predictor/timeMachine'
import { fetchLiveSignals } from '../predictor/liveSignals'
import { fetchLocalEventkgEvents } from '../worlds/localEventkg'

const formatPct = (value: number, digits = 2) => `${value.toFixed(digits)}%`

const formatNumber = (value: number, digits = 2) => Number(value.toFixed(digits))

export default function StoryMode() {
  const [signals, setSignals] = useState<CurrentSignals>(DEFAULT_SIGNALS)
  const [prediction, setPrediction] = useState<TimeMachinePrediction>(() =>
    generatePrediction(DEFAULT_SIGNALS)
  )
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [contextLoaded, setContextLoaded] = useState(false)

  const buildStory = useMemo(() => {
    const outputs = prediction.modelOutputs
    const marketStress = outputs.market.stressScore
    const marketTone = marketStress > 0.6 ? 'stressed' : marketStress > 0.3 ? 'cautious' : 'stable'
    const conflictTone =
      signals.activeWarCount > 7 ? 'elevated' : signals.activeWarCount > 3 ? 'persistent' : 'contained'

    const nowLine =
      `Markets look ${marketTone} and global conflict is ${conflictTone}. ` +
      `Oil is ~$${formatNumber(signals.oilPrice, 2)}, inflation is ${formatPct(signals.inflationRate, 2)}, ` +
      `and unemployment is ${formatPct(signals.unemploymentRate, 2)}.`

    const nextLine =
      `The baseline path for the next 12 months is GDP growth around ${formatPct(
        prediction.scenarios.mostLikely.gdpGrowthNextYear,
        2
      )}, oil near $${formatNumber(prediction.scenarios.mostLikely.oilPriceNextYear, 2)}, ` +
      `and conflict ${prediction.scenarios.mostLikely.conflictTrend}.`

    const analogy = prediction.topAnalogies[0]
    const analogyLine = analogy
      ? `Closest historical analogue: ${analogy.name} (${analogy.period}) — ${analogy.keyLesson.toLowerCase()}`
      : 'No dominant historical analogue.'

    const tippingPoints: string[] = []
    if (signals.nuclearThreatLevel > 6) {
      tippingPoints.push(`Nuclear risk is high (${signals.nuclearThreatLevel}/10).`)
    }
    if (signals.yieldCurve10y2y < 0) {
      tippingPoints.push(`Yield curve is inverted (${signals.yieldCurve10y2y}%).`)
    }
    if (signals.creditSpreadBaaAaa > 1.8) {
      tippingPoints.push(`Credit spreads are wide (${signals.creditSpreadBaaAaa}%).`)
    }
    if (signals.oilPrice > 110) {
      tippingPoints.push(`Oil above $110 amplifies inflation pressure.`)
    }
    if (signals.publicDebtGdpRatio > 110) {
      tippingPoints.push(`High public debt (${signals.publicDebtGdpRatio}%) limits policy room.`)
    }

    const opportunities: string[] = []
    if (outputs.brynjolfsson.currentPhase === 'harvest') {
      opportunities.push('AI productivity gains are now compounding.')
    }
    if (signals.tradeOpenness > 60) {
      opportunities.push('Higher trade openness can soften supply shocks.')
    }
    if (signals.tempAnomalyC < 1.5) {
      opportunities.push('Climate transition window remains open.')
    }

    return {
      nowLine,
      nextLine,
      analogyLine,
      tippingPoints: tippingPoints.slice(0, 3),
      opportunities: opportunities.slice(0, 3)
    }
  }, [prediction, signals])

  const refreshStory = async (force?: boolean) => {
    setLoading(true)
    try {
      const live = await fetchLiveSignals({ force })
      const merged = { ...signals, ...live }
      setSignals(merged)
      setLastUpdated(Date.now())
      setPrediction(generatePrediction(merged))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadContext = async () => {
      try {
        await fetchLocalEventkgEvents()
      } finally {
        setContextLoaded(true)
      }
    }
    loadContext()
    refreshStory()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">World Trajectory Story</div>
            <div className="mt-1 text-xs text-slate-400">
              Built from live signals and model outputs.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {lastUpdated && <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>}
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
              onClick={() => refreshStory(true)}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Story'}
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-4 text-sm text-slate-200">
          <p>{buildStory.nowLine}</p>
          <p>{buildStory.nextLine}</p>
          <p>{buildStory.analogyLine}</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tipping Points
            </div>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {buildStory.tippingPoints.length === 0 && <li>No critical tipping points flagged.</li>}
              {buildStory.tippingPoints.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Opportunities
            </div>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {buildStory.opportunities.length === 0 && <li>No clear upside catalysts.</li>}
              {buildStory.opportunities.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
        <div className="text-sm font-semibold text-white">Evidence (Data Basis)</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-slate-300">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Oil: ${formatNumber(signals.oilPrice, 2)}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            GDP Growth: {formatPct(signals.globalGDPGrowth, 2)}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Inflation: {formatPct(signals.inflationRate, 2)}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Unemployment: {formatPct(signals.unemploymentRate, 2)}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            War Count: {signals.activeWarCount}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Yield Curve: {formatNumber(signals.yieldCurve10y2y, 2)}%
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Credit Spread: {formatNumber(signals.creditSpreadBaaAaa, 2)}%
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Policy Rate: {formatNumber(signals.policyRate, 2)}%
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            Debt/GDP: {formatNumber(signals.publicDebtGdpRatio, 0)}%
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          {contextLoaded ? 'Context events loaded from local EventKG dataset.' : 'Loading local context...'}
        </div>
      </section>
    </div>
  )
}
