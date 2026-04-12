// AuraFlow Skill #7 — Lead-Velocity Radar ("The Flow Meter")
// Key data points: L05 (after-hours capture), L10 (lead scoring), L22 (no-show rate)
// Maps the speed, quality, and leaks in the lead pipeline.

export interface LeadVelocityResult {
  velocityScore: number         // 0-100: overall pipeline health
  velocityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  monthlyLeads: number
  pipelineValue: number         // monthly leads × close rate × avg deal size
  leaksPerMonth: number         // estimated leads lost at each stage
  bottleneck: string            // single biggest chokepoint
  stages: Array<{
    stage: string
    health: 'good' | 'warning' | 'critical'
    metric: string
    benchmark: string
    gap: string | null
  }>
  quickFixes: string[]          // ranked by impact
}

export function runLeadVelocityRadar(rawData: Record<string, unknown>, context: {
  monthly_leads: number
  avg_deal_size: number
  close_rate: number
}): LeadVelocityResult {
  const afterHoursCapture = String(rawData['L05'] ?? 'nothing').toLowerCase()
  const hasLeadScoring    = !!(rawData['L10'])
  const noShowRate        = Number(rawData['L22'] ?? 20)
  const responseMin       = Number(rawData['L04'] ?? 999)
  const hasFollowUp       = !!(rawData['L14'])
  const followUpTouchpts  = Number(rawData['L15'] ?? 0)
  const phoneAnswerRate   = Number(rawData['L07'] ?? 50)
  const leadToApptCVR     = Number(rawData['L23'] ?? 10)
  const apptToCloseCVR    = Number(rawData['L24'] ?? 25)
  const hasOnlineBooking  = !!(rawData['L21'])
  const hasLostLeadRecovery = !!(rawData['L18'])
  const crmSystem         = String(rawData['L11'] ?? 'none').toLowerCase()

  let velocityScore = 60
  const stages: LeadVelocityResult['stages'] = []

  // Stage 1: Lead Capture
  const captureHealth = afterHoursCapture === 'ai_receptionist' || afterHoursCapture === 'auto_text' ? 'good'
    : afterHoursCapture === 'booking_form' || afterHoursCapture === 'answering_service' ? 'warning'
    : 'critical'
  if (captureHealth === 'critical') velocityScore -= 20
  else if (captureHealth === 'warning') velocityScore -= 10
  else velocityScore += 5
  stages.push({
    stage: 'After-Hours Capture',
    health: captureHealth,
    metric: afterHoursCapture.replace('_', ' '),
    benchmark: 'AI receptionist or auto-text response',
    gap: captureHealth !== 'good' ? '35-50% of leads arrive outside business hours' : null,
  })

  // Stage 2: Speed to Lead
  const responseHealth = responseMin <= 5 ? 'good' : responseMin <= 30 ? 'warning' : 'critical'
  if (responseHealth === 'critical') velocityScore -= 20
  else if (responseHealth === 'warning') velocityScore -= 10
  else velocityScore += 5
  stages.push({
    stage: 'Speed to Lead',
    health: responseHealth,
    metric: `${responseMin} min average`,
    benchmark: '<5 min (first responder wins 78% of jobs)',
    gap: responseMin > 5 ? `${Math.round((responseMin - 5) / responseMin * 100)}% of leads go cold before contact` : null,
  })

  // Stage 3: Phone Answer Rate
  const phoneHealth = phoneAnswerRate >= 75 ? 'good' : phoneAnswerRate >= 55 ? 'warning' : 'critical'
  if (phoneHealth === 'critical') velocityScore -= 15
  else if (phoneHealth === 'warning') velocityScore -= 5
  stages.push({
    stage: 'Phone Answer Rate',
    health: phoneHealth,
    metric: `${phoneAnswerRate}%`,
    benchmark: '75%+ (industry top quartile)',
    gap: phoneAnswerRate < 75 ? `${Math.round(context.monthly_leads * ((75 - phoneAnswerRate) / 100))} missed calls/month` : null,
  })

  // Stage 4: Lead Qualification
  const qualHealth = hasLeadScoring ? 'good' : crmSystem !== 'none' ? 'warning' : 'critical'
  if (qualHealth === 'critical') velocityScore -= 10
  else if (qualHealth === 'warning') velocityScore -= 5
  else velocityScore += 5
  stages.push({
    stage: 'Lead Qualification',
    health: qualHealth,
    metric: hasLeadScoring ? 'Lead scoring active' : crmSystem !== 'none' ? `CRM: ${crmSystem}` : 'No system',
    benchmark: 'Lead scoring + CRM with qualification workflow',
    gap: !hasLeadScoring ? 'Wasting time on unqualified leads without scoring' : null,
  })

  // Stage 5: Follow-Up
  const followHealth = followUpTouchpts >= 5 ? 'good' : followUpTouchpts >= 2 ? 'warning' : 'critical'
  if (followHealth === 'critical') velocityScore -= 20
  else if (followHealth === 'warning') velocityScore -= 8
  else velocityScore += 5
  stages.push({
    stage: 'Follow-Up Sequence',
    health: followHealth,
    metric: `${followUpTouchpts} touchpoints`,
    benchmark: '7-touch multi-channel sequence',
    gap: followUpTouchpts < 7 ? `Leaving ${Math.round(context.monthly_leads * 0.35)} recoverable leads/month cold` : null,
  })

  // Stage 6: No-Show / Appointment Reliability
  const noShowHealth = noShowRate <= 10 ? 'good' : noShowRate <= 20 ? 'warning' : 'critical'
  if (noShowHealth === 'critical') velocityScore -= 15
  else if (noShowHealth === 'warning') velocityScore -= 5
  stages.push({
    stage: 'Appointment No-Show Rate',
    health: noShowHealth,
    metric: `${noShowRate}%`,
    benchmark: '<10% (industry top quartile)',
    gap: noShowRate > 10 ? `${Math.round(context.monthly_leads * (noShowRate / 100))} no-shows/month = wasted capacity` : null,
  })

  velocityScore = Math.max(0, Math.min(100, velocityScore))

  let velocityGrade: LeadVelocityResult['velocityGrade']
  if (velocityScore >= 85) velocityGrade = 'A'
  else if (velocityScore >= 70) velocityGrade = 'B'
  else if (velocityScore >= 55) velocityGrade = 'C'
  else if (velocityScore >= 35) velocityGrade = 'D'
  else velocityGrade = 'F'

  const bottleneckStage = stages
    .filter(s => s.health !== 'good')
    .sort((a, b) => (a.health === 'critical' ? -1 : 1))[0]

  const leaksPerMonth = Math.round(
    context.monthly_leads * (
      (responseMin > 30 ? 0.2 : 0) +
      (noShowRate > 20 ? 0.15 : noShowRate > 10 ? 0.05 : 0) +
      (!hasFollowUp ? 0.3 : followUpTouchpts < 4 ? 0.15 : 0) +
      (afterHoursCapture === 'nothing' ? 0.15 : 0)
    )
  )

  const pipelineValue = Math.round(
    (context.monthly_leads - leaksPerMonth) * (context.close_rate / 100) * context.avg_deal_size
  )

  const quickFixes: string[] = stages
    .filter(s => s.health !== 'good' && s.gap)
    .map(s => `${s.stage}: ${s.gap}`)
    .slice(0, 4)

  if (!hasOnlineBooking) quickFixes.push('Add online booking — reduce friction from interest to appointment')
  if (!hasLostLeadRecovery) quickFixes.push('Add lost lead re-engagement campaign (30/60/90-day sequences)')

  return {
    velocityScore,
    velocityGrade,
    monthlyLeads: context.monthly_leads,
    pipelineValue,
    leaksPerMonth,
    bottleneck: bottleneckStage?.stage ?? 'Pipeline running at capacity',
    stages,
    quickFixes: quickFixes.slice(0, 5),
  }
}
