// AuraFlow Skill #2 — Owner-Trap Index ("The Golden Cage")
// Key data points: P15 (decision rights defined), O05 (project management tool), P18 (culture documented)
// Measures how trapped the owner is inside their own business.

export interface OwnerTrapResult {
  trapScore: number          // 0-100: how trapped (100 = completely stuck)
  trapLevel: 'free' | 'tethered' | 'trapped' | 'imprisoned'
  ownerHrsPerWeek: number
  teamAutonomousDays: number
  primaryTrap: string
  traps: Array<{
    trap: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    impact: string
    fix: string
  }>
  freedomRoadmap: string[]   // 3 steps to reduce trap score by 20+ pts
}

export function calculateOwnerTrap(rawData: Record<string, unknown>): OwnerTrapResult {
  const traps: OwnerTrapResult['traps'] = []
  let trapPoints = 0

  // P15 — Decision rights not defined (every decision goes through owner)
  const decisionRightsDefined = rawData['P15']
  if (!decisionRightsDefined) {
    trapPoints += 20
    traps.push({
      trap: 'No decision rights defined — everything escalates to owner',
      severity: 'critical',
      impact: 'Owner is the bottleneck for every decision above $50',
      fix: 'Create a decision matrix: define what team can decide autonomously vs what needs approval',
    })
  }

  // O05 — No project management tool (everything lives in owner\'s head)
  const pmTool = String(rawData['O05'] ?? 'none').toLowerCase()
  if (pmTool === 'none' || pmTool === 'email') {
    trapPoints += 15
    traps.push({
      trap: `Project management via ${pmTool === 'none' ? 'memory/whiteboard' : 'email'} — owner is the system`,
      severity: 'high',
      impact: 'Business operations pause when owner is unavailable',
      fix: 'Implement Monday.com, Asana, or ClickUp — move all projects out of owner\'s head',
    })
  }

  // P18 — Culture not documented (no way to onboard without owner)
  const cultureDocs = rawData['P18']
  if (!cultureDocs) {
    trapPoints += 10
    traps.push({
      trap: 'Culture and values not documented',
      severity: 'medium',
      impact: 'Hiring decisions and standards depend entirely on owner judgment',
      fix: 'Document company values, hiring criteria, and behavioral standards in a Culture Playbook',
    })
  }

  // P09 — Owner hours IN the business
  const ownerHrsIn = Number(rawData['P09'] ?? 50)
  if (ownerHrsIn > 50) {
    trapPoints += 20
    traps.push({
      trap: `Owner works ${ownerHrsIn} hrs/week IN the business (target: <30)`,
      severity: 'critical',
      impact: `${ownerHrsIn - 30} hrs/week stolen from strategy, family, and growth`,
      fix: 'Identify and delegate 3 recurring tasks per week. Use SOPs for each.',
    })
  } else if (ownerHrsIn > 40) {
    trapPoints += 10
    traps.push({
      trap: `Owner works ${ownerHrsIn} hrs/week IN the business`,
      severity: 'high',
      impact: 'Limited bandwidth for growth initiatives',
      fix: 'Delegate 2 operational tasks per week, starting with lowest-value activities',
    })
  }

  // P12 — Team autonomous days (how long business runs without owner)
  const autonomousDays = Number(rawData['P12'] ?? 0)
  if (autonomousDays < 2) {
    trapPoints += 20
    traps.push({
      trap: `Team cannot operate without owner for more than ${autonomousDays} day(s)`,
      severity: 'critical',
      impact: 'Business stops if owner gets sick, travels, or takes a vacation',
      fix: 'Build SOPs for top 10 operational tasks. Test by taking a 3-day trip.',
    })
  } else if (autonomousDays < 7) {
    trapPoints += 10
    traps.push({
      trap: `Team autonomous for only ${autonomousDays} days`,
      severity: 'high',
      impact: 'Owner cannot take a real vacation or step back for strategic work',
      fix: 'Identify single points of failure and build redundancy into each process',
    })
  }

  // O04 — No SOPs documented
  const hasSOPs = rawData['O04']
  if (!hasSOPs) {
    trapPoints += 15
    traps.push({
      trap: 'No standard operating procedures documented',
      severity: 'high',
      impact: 'Every task gets done differently each time; owner must supervise everything',
      fix: 'Document top 5 most repeated tasks as SOPs using Loom + Notion',
    })
  }

  // P11 — Delegation comfort low
  const delegationComfort = Number(rawData['P11'] ?? 2)
  if (delegationComfort <= 2) {
    trapPoints += 10
    traps.push({
      trap: `Low delegation comfort (${delegationComfort}/5) — owner defaults to doing it themselves`,
      severity: 'medium',
      impact: 'Even when SOPs exist, owner reverts to hands-on execution',
      fix: 'Weekly delegation challenge: pick one task to hand off, review output, resist fixing it yourself',
    })
  }

  trapPoints = Math.min(100, trapPoints)

  let trapLevel: OwnerTrapResult['trapLevel']
  if (trapPoints <= 20) trapLevel = 'free'
  else if (trapPoints <= 45) trapLevel = 'tethered'
  else if (trapPoints <= 70) trapLevel = 'trapped'
  else trapLevel = 'imprisoned'

  traps.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  const freedomRoadmap = [
    traps[0] ? `Week 1-2: ${traps[0].fix}` : 'Define decision rights for your team',
    traps[1] ? `Week 3-4: ${traps[1].fix}` : 'Document your top 5 operational SOPs',
    'Month 2: Take a 3-day trip without checking in — use it to identify what breaks',
  ]

  return {
    trapScore: trapPoints,
    trapLevel,
    ownerHrsPerWeek: ownerHrsIn,
    teamAutonomousDays: autonomousDays,
    primaryTrap: traps[0]?.trap ?? 'No critical traps detected',
    traps,
    freedomRoadmap,
  }
}
