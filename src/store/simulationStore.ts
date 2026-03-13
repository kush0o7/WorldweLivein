import { create } from 'zustand'
import { WorldConfig, SimResult, simulateWorld } from '../worlds/worldEngine'
import { WORLD_PRESETS } from '../worlds/worldPresets'

interface SimulationState {
  worlds: WorldConfig[]
  results: Map<string, SimResult>
  selectedWorlds: Set<string>
  simulationYears: number
  runSimulation: () => void
  updateWorldParam: (id: string, paramKey: keyof WorldConfig['params'], value: number) => void
  addWorld: () => void
  removeWorld: (id: string) => void
  toggleWorldSelection: (id: string) => void
  setSimulationYears: (years: number) => void
}

const cloneWorld = (world: WorldConfig, index: number): WorldConfig => ({
  ...world,
  id: `${world.id}-${Date.now()}-${index}`,
  name: `${world.name} Copy`,
  params: { ...world.params }
})

export const useSimulationStore = create<SimulationState>((set, get) => ({
  worlds: WORLD_PRESETS,
  results: new Map(),
  selectedWorlds: new Set(WORLD_PRESETS.map((world) => world.id)),
  simulationYears: 20,
  runSimulation: () => {
    const { worlds, simulationYears, selectedWorlds } = get()
    const nextResults = new Map<string, SimResult>()
    worlds.forEach((world) => {
      if (selectedWorlds.has(world.id)) {
        nextResults.set(world.id, simulateWorld(world, simulationYears))
      }
    })
    set({ results: nextResults })
  },
  updateWorldParam: (id, paramKey, value) => {
    set((state) => ({
      worlds: state.worlds.map((world) =>
        world.id === id
          ? {
              ...world,
              params: {
                ...world.params,
                [paramKey]: value
              }
            }
          : world
      )
    }))
  },
  addWorld: () => {
    const { worlds } = get()
    const baseWorld = worlds[worlds.length - 1] ?? WORLD_PRESETS[0]
    const newWorld = cloneWorld(baseWorld, worlds.length)
    set((state) => ({
      worlds: [...state.worlds, newWorld],
      selectedWorlds: new Set(state.selectedWorlds).add(newWorld.id)
    }))
  },
  removeWorld: (id) => {
    set((state) => {
      const nextSelected = new Set(state.selectedWorlds)
      nextSelected.delete(id)
      return {
        worlds: state.worlds.filter((world) => world.id !== id),
        selectedWorlds: nextSelected
      }
    })
  },
  toggleWorldSelection: (id) => {
    set((state) => {
      const nextSelected = new Set(state.selectedWorlds)
      if (nextSelected.has(id)) {
        nextSelected.delete(id)
      } else {
        nextSelected.add(id)
      }
      return { selectedWorlds: nextSelected }
    })
  },
  setSimulationYears: (years) => set({ simulationYears: years })
}))
