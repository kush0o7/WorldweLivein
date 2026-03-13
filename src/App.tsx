import { useEffect, useMemo, useState } from 'react'
import WorldCard from './components/WorldCard'
import SimChart from './components/SimChart'
import Timeline from './components/Timeline'
import TimeMachine from './components/TimeMachine'
import { HISTORICAL_ANCHORS } from './worlds/historicalData'
import { useSimulationStore } from './store/simulationStore'
import { SimResult } from './worlds/worldEngine'

const tabs = ['Worlds', 'Projections', 'Historical Anchors', 'Live Inputs', 'Event Cascade', 'Time Machine'] as const

type Tab = (typeof tabs)[number]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Worlds')
  const [selectedTimelineWorld, setSelectedTimelineWorld] = useState<string | null>(null)

  const {
    worlds,
    results,
    selectedWorlds,
    simulationYears,
    runSimulation,
    updateWorldParam,
    addWorld,
    removeWorld,
    toggleWorldSelection,
    setSimulationYears
  } = useSimulationStore()

  useEffect(() => {
    runSimulation()
  }, [runSimulation])

  const selectedWorldConfigs = useMemo(
    () => worlds.filter((world) => selectedWorlds.has(world.id)),
    [worlds, selectedWorlds]
  )

  const timelineWorld = selectedTimelineWorld
    ? worlds.find((world) => world.id === selectedTimelineWorld)
    : worlds[0]

  const timelineResult: SimResult | undefined = timelineWorld ? results.get(timelineWorld.id) : undefined

  return (
    <div className="min-h-screen px-6 py-8 text-slate-100">
      <header className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold text-white">Parallel World Simulator</div>
            <div className="mt-1 text-sm text-slate-400">
              Explore geopolitical, AI, and climate futures across divergent timelines.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
              Simulation Horizon: {simulationYears} years
            </div>
            <input
              type="range"
              min={10}
              max={40}
              value={simulationYears}
              onChange={(event) => setSimulationYears(Number(event.target.value))}
              className="w-40 accent-white/70"
            />
            <button
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={runSimulation}
            >
              Run Simulation
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-white text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl">
        {activeTab === 'Worlds' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-300">
                Adjust parameters per world and toggle which timelines appear in projections.
              </div>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200"
                onClick={addWorld}
              >
                Clone World
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {worlds.map((world) => (
                <WorldCard
                  key={world.id}
                  world={world}
                  result={results.get(world.id)}
                  selected={selectedWorlds.has(world.id)}
                  onToggle={() => toggleWorldSelection(world.id)}
                  onUpdate={(key, value) => updateWorldParam(world.id, key, value)}
                  onRemove={worlds.length > 1 ? () => removeWorld(world.id) : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Projections' && (
          <section className="grid gap-4 md:grid-cols-2">
            <SimChart metric="gdpGrowth" worlds={selectedWorldConfigs} results={results} />
            <SimChart metric="conflictIndex" worlds={selectedWorldConfigs} results={results} />
            <SimChart metric="oilPrice" worlds={selectedWorldConfigs} results={results} />
            <SimChart metric="whiteCollarJobsDisrupted" worlds={selectedWorldConfigs} results={results} />
            <SimChart metric="aiProductivityContribution" worlds={selectedWorldConfigs} results={results} />
            <SimChart metric="giniCoefficient" worlds={selectedWorldConfigs} results={results} />
          </section>
        )}

        {activeTab === 'Historical Anchors' && (
          <section className="space-y-4">
            {HISTORICAL_ANCHORS.map((anchor) => (
              <div
                key={anchor.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="rounded-full bg-white/10 px-3 py-1">{anchor.period}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-wide">
                    {anchor.category}
                  </span>
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{anchor.name}</div>
                <div className="mt-1 text-sm text-slate-300">{anchor.gdpImpact}</div>
                <div className="mt-3 text-sm text-slate-400">Analogy: {anchor.analogy}</div>
                <div className="mt-1 text-sm text-slate-300">Lesson: {anchor.lessonForSim}</div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'Live Inputs' && (
          <section className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Oil Baseline (March 12, 2026)', value: '$100 / barrel' },
              { label: 'Iran War Status', value: 'Day 13, escalation phase' },
              { label: 'Russia-Ukraine', value: 'Active conflict (Year 4)' },
              { label: 'US-China Tension', value: 'Strategic competition, partial decoupling' },
              { label: 'AI Adoption', value: 'Accelerating enterprise rollout' },
              { label: 'Climate', value: '1.35°C above pre-industrial' }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
                <div className="mt-3 text-lg font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'Event Cascade' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-slate-300">Select a world to view cascading events.</div>
              <select
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                value={timelineWorld?.id}
                onChange={(event) => setSelectedTimelineWorld(event.target.value)}
              >
                {worlds.map((world) => (
                  <option key={world.id} value={world.id} className="bg-slate-950">
                    {world.name}
                  </option>
                ))}
              </select>
            </div>
            <Timeline events={timelineResult?.events ?? []} />
          </section>
        )}

        {activeTab === 'Time Machine' && (
          <section>
            <TimeMachine />
          </section>
        )}
      </main>
    </div>
  )
}
