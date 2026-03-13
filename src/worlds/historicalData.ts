export interface HistoricalAnchor {
  period: string
  name: string
  category: string
  gdpImpact: string
  recoveryYears: number
  analogy: string
  lessonForSim: string
}

export const HISTORICAL_ANCHORS: HistoricalAnchor[] = [
  {
    period: '1914-1918',
    name: 'World War I',
    category: 'war',
    gdpImpact: 'Trade contraction ~40%, rearmament surge, post-war inflation shock',
    recoveryYears: 8,
    analogy: 'Great power conflict disrupts trade and accelerates state control.',
    lessonForSim: 'High conflict and deglobalization compress growth and spike prices.'
  },
  {
    period: '1929-1933',
    name: 'Great Depression',
    category: 'economic',
    gdpImpact: 'Global GDP down ~27%, Smoot-Hawley tariff spiral',
    recoveryYears: 10,
    analogy: 'Demand collapse compounded by protectionism.',
    lessonForSim: 'Trade fragmentation deepens downturns without fiscal response.'
  },
  {
    period: '1939-1945',
    name: 'World War II',
    category: 'war',
    gdpImpact: 'Shock then rapid industrial mobilization; post-war boom',
    recoveryYears: 6,
    analogy: 'Massive mobilization followed by coordinated reconstruction.',
    lessonForSim: 'Coordinated rebuild can offset wartime loss if governance aligns.'
  },
  {
    period: '1953',
    name: 'Korean War Armistice',
    category: 'war',
    gdpImpact: 'Frozen conflict, defense-heavy budgets',
    recoveryYears: 4,
    analogy: 'Conflict stabilizes without full resolution.',
    lessonForSim: 'Persistent tensions keep risk premium elevated.'
  },
  {
    period: '1973-1974',
    name: 'Oil Shock',
    category: 'economic',
    gdpImpact: 'Oil price quadruples, stagflation emerges',
    recoveryYears: 7,
    analogy: 'Energy choke point shocks supply chains.',
    lessonForSim: 'Hormuz disruption drives inflation and growth drag.'
  },
  {
    period: '1991',
    name: 'Cold War End',
    category: 'political',
    gdpImpact: 'Peace dividend, globalization surge',
    recoveryYears: 5,
    analogy: 'Geopolitical thaw unlocks trade.',
    lessonForSim: 'Lower tensions plus openness boost long-run growth.'
  },
  {
    period: '2000-2002',
    name: 'Dot-Com Bubble',
    category: 'tech',
    gdpImpact: 'Tech valuations collapse, investment resets',
    recoveryYears: 4,
    analogy: 'Overheated tech cycles cool before the next wave.',
    lessonForSim: 'AI hype can dip before productivity arrives.'
  },
  {
    period: '2008-2010',
    name: 'Global Financial Crisis',
    category: 'economic',
    gdpImpact: 'Credit shock, GDP collapse, massive stimulus',
    recoveryYears: 6,
    analogy: 'Debt overhang and policy response reshape recoveries.',
    lessonForSim: 'Fiscal response dampens inequality and speeds recovery.'
  },
  {
    period: '2020-2022',
    name: 'COVID-19 Pandemic',
    category: 'economic',
    gdpImpact: 'Supply chain shock, rapid recovery with stimulus',
    recoveryYears: 3,
    analogy: 'Short but sharp global shock and rebound.',
    lessonForSim: 'Fast policy responses stabilize demand.'
  },
  {
    period: '1760-1830',
    name: 'Industrial Revolution (Engels\' Pause)',
    category: 'tech',
    gdpImpact: 'Productivity gains lagged wages for decades',
    recoveryYears: 20,
    analogy: 'Technology diffusion outpaces wage growth.',
    lessonForSim: 'AI productivity lags adoption, creating distribution tensions.'
  },
  {
    period: '1890-1920',
    name: 'Electricity Adoption (Solow Paradox)',
    category: 'tech',
    gdpImpact: '30-year productivity lag',
    recoveryYears: 30,
    analogy: 'Infrastructure rewiring delays visible gains.',
    lessonForSim: 'AI gains are delayed by reorganization costs.'
  },
  {
    period: '1995-2005',
    name: 'Internet Adoption',
    category: 'tech',
    gdpImpact: '10-year lag followed by new job creation',
    recoveryYears: 10,
    analogy: 'Rapid diffusion with delayed broad productivity.',
    lessonForSim: 'AI adoption accelerates but still needs institutional adjustment.'
  },
  {
    period: '2012-present',
    name: 'AI Revolution',
    category: 'ai',
    gdpImpact: 'Early displacement phase, uneven productivity impact',
    recoveryYears: 8,
    analogy: 'Rapid model scaling with policy lag.',
    lessonForSim: 'Governance, education, and safety buffers shape outcomes.'
  }
]
