import { WorldConfig } from './worldEngine'

const colors = ['#D85A30', '#1D9E75', '#7F77DD', '#BA7517', '#378ADD']

export const WORLD_PRESETS: WorldConfig[] = [
  {
    id: 'muddling-through',
    name: 'Muddling Through',
    color: colors[0],
    probability: 35,
    analogy: 'Post-1970s stagflation grind',
    params: {
      iranWarIntensity: 65,
      russiaUkraineStatus: 70,
      usChinaTension: 72,
      hormuzClosure: 35,
      aiAdoptionRate: 62,
      aiGovernance: 35,
      techDecoupling: 55,
      fiscalResponse: 45,
      tradeOpenness: 48,
      greenTransition: 52,
      politicalStability: 50,
      inequalityLevel: 60
    }
  },
  {
    id: 'ai-led-renaissance',
    name: 'AI-Led Renaissance',
    color: colors[1],
    probability: 18,
    analogy: 'Post-WWII reconstruction boom',
    params: {
      iranWarIntensity: 20,
      russiaUkraineStatus: 35,
      usChinaTension: 40,
      hormuzClosure: 10,
      aiAdoptionRate: 90,
      aiGovernance: 75,
      techDecoupling: 20,
      fiscalResponse: 70,
      tradeOpenness: 75,
      greenTransition: 78,
      politicalStability: 70,
      inequalityLevel: 40
    }
  },
  {
    id: 'great-fragmentation',
    name: 'Great Fragmentation',
    color: colors[2],
    probability: 25,
    analogy: '1930s tariff spiral',
    params: {
      iranWarIntensity: 70,
      russiaUkraineStatus: 85,
      usChinaTension: 88,
      hormuzClosure: 55,
      aiAdoptionRate: 60,
      aiGovernance: 30,
      techDecoupling: 85,
      fiscalResponse: 35,
      tradeOpenness: 28,
      greenTransition: 40,
      politicalStability: 38,
      inequalityLevel: 72
    }
  },
  {
    id: 'cascade-collapse',
    name: 'Cascade Collapse',
    color: colors[3],
    probability: 12,
    analogy: '1914 escalation meets 2008 debt shock',
    params: {
      iranWarIntensity: 95,
      russiaUkraineStatus: 95,
      usChinaTension: 92,
      hormuzClosure: 85,
      aiAdoptionRate: 55,
      aiGovernance: 15,
      techDecoupling: 92,
      fiscalResponse: 20,
      tradeOpenness: 18,
      greenTransition: 25,
      politicalStability: 22,
      inequalityLevel: 85
    }
  },
  {
    id: 'managed-renaissance',
    name: 'Managed Renaissance',
    color: colors[4],
    probability: 10,
    analogy: 'Cold War thaw + coordinated climate response',
    params: {
      iranWarIntensity: 25,
      russiaUkraineStatus: 40,
      usChinaTension: 45,
      hormuzClosure: 15,
      aiAdoptionRate: 78,
      aiGovernance: 90,
      techDecoupling: 25,
      fiscalResponse: 80,
      tradeOpenness: 70,
      greenTransition: 88,
      politicalStability: 75,
      inequalityLevel: 35
    }
  }
]
