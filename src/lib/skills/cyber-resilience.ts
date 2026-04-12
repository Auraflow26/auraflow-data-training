// AuraFlow Skill #8 — Cyber-Resilience Check ("The Vault Lock")
// Key data points: D08 (indexed pages / data exposure), O22 (reporting dashboard / access control)
// Identifies digital vulnerabilities that could destroy the business overnight.

export interface CyberResilienceResult {
  resilienceScore: number       // 0-100 (100 = fully protected)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  vulnerabilities: Array<{
    vulnerability: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    businessImpact: string
    fix: string
    estimatedFixTime: string
  }>
  protections: string[]         // things they ARE doing right
  estimatedBreachCost: number   // $ if worst case happens
  topPriority: string
}

export function runCyberResilienceCheck(rawData: Record<string, unknown>): CyberResilienceResult {
  const hasSSL           = !!(rawData['D07'])
  const hasBackup        = !!(rawData['O20'])
  const hasDashboard     = !!(rawData['O22'])
  const hasCallRecording = !!(rawData['O26'])
  const hasVersionCtrl   = !!(rawData['O31'])
  const hasComplianceAuto = !!(rawData['O32'])
  const hasSOPs          = !!(rawData['O04'])
  const cloudOrganized   = !!(rawData['O30'])
  const hasAPIAccess     = !!(rawData['O29'])
  const hasSinglePointOfFailure = !!(rawData['O21'])
  const connectedTools   = Number(rawData['O02'] ?? 0)
  const totalTools       = Number(rawData['O01'] ?? 0)
  const industryPlatform = String(rawData['O27'] ?? 'none').toLowerCase()

  const vulnerabilities: CyberResilienceResult['vulnerabilities'] = []
  const protections: string[] = []
  let resilienceScore = 50

  // SSL
  if (!hasSSL) {
    resilienceScore -= 20
    vulnerabilities.push({
      vulnerability: 'No SSL/HTTPS encryption',
      severity: 'critical',
      businessImpact: 'Customer data transmitted in plaintext. Chrome marks site "Not Secure". GDPR/CCPA liability.',
      fix: 'Install SSL certificate via Let\'s Encrypt (free) or hosting provider',
      estimatedFixTime: '30 minutes',
    })
  } else {
    protections.push('SSL/HTTPS encryption active')
    resilienceScore += 5
  }

  // Data backup
  if (!hasBackup) {
    resilienceScore -= 25
    vulnerabilities.push({
      vulnerability: 'No data backup system',
      severity: 'critical',
      businessImpact: 'Hardware failure, ransomware, or accidental deletion = permanent data loss. Average ransomware cost to SMB: $170K.',
      fix: 'Set up automated daily backups: Google Workspace Backup or Backblaze B2 ($7/mo)',
      estimatedFixTime: '2 hours',
    })
  } else {
    protections.push('Data backup system in place')
    resilienceScore += 10
  }

  // Single point of failure
  if (!hasSinglePointOfFailure) {
    resilienceScore -= 10
    vulnerabilities.push({
      vulnerability: 'Single points of failure not identified or addressed',
      severity: 'high',
      businessImpact: 'One person, one tool, or one system failure halts operations',
      fix: 'Map your critical systems and identify backups for each: who covers when X is out?',
      estimatedFixTime: '1 day (workshop)',
    })
  } else {
    protections.push('Single points of failure mapped and addressed')
    resilienceScore += 5
  }

  // Compliance automation (HIPAA, GDPR, etc.)
  if (!hasComplianceAuto && ['healthcare', 'law', 'accounting', 'insurance'].some(v => industryPlatform.includes(v))) {
    resilienceScore -= 15
    vulnerabilities.push({
      vulnerability: 'Compliance tracking not automated for regulated vertical',
      severity: 'critical',
      businessImpact: 'Manual compliance = gaps. HIPAA violations: $100-$50K per violation. GDPR: 4% of annual revenue.',
      fix: 'Implement compliance automation tool relevant to your vertical (Compliancy Group, Accountable, etc.)',
      estimatedFixTime: '1-2 weeks',
    })
  }

  // Version control / document management
  if (!hasVersionCtrl) {
    resilienceScore -= 5
    vulnerabilities.push({
      vulnerability: 'No version control for documents and SOPs',
      severity: 'medium',
      businessImpact: 'Documents get overwritten, deleted, or become outdated without anyone knowing',
      fix: 'Use Google Drive with version history enabled, or Notion for SOPs',
      estimatedFixTime: '4 hours to migrate',
    })
  } else {
    protections.push('Document version control in place')
    resilienceScore += 5
  }

  // Cloud storage
  if (!cloudOrganized) {
    resilienceScore -= 5
    vulnerabilities.push({
      vulnerability: 'Cloud storage disorganized or not centralized',
      severity: 'medium',
      businessImpact: 'Files scattered across personal devices — data loss risk, no team access control',
      fix: 'Migrate all business files to Google Workspace or Microsoft 365 with shared drives',
      estimatedFixTime: '1-2 days',
    })
  } else {
    protections.push('Cloud storage organized and centralized')
    resilienceScore += 5
  }

  // Dashboard / access control
  if (!hasDashboard) {
    resilienceScore -= 5
    vulnerabilities.push({
      vulnerability: 'No reporting dashboard — no visibility into anomalies',
      severity: 'low',
      businessImpact: 'Can\'t detect unauthorized access, fraud, or unusual patterns without visibility',
      fix: 'Set up a basic dashboard in Google Looker Studio (free) connecting your key systems',
      estimatedFixTime: '3-4 hours',
    })
  }

  // Too many connected tools = expanded attack surface
  if (connectedTools > 12 && !hasAPIAccess) {
    resilienceScore -= 5
    vulnerabilities.push({
      vulnerability: `${connectedTools} connected tools without API access management`,
      severity: 'medium',
      businessImpact: 'Each integration is a potential breach point. No central way to revoke access.',
      fix: 'Audit all tool integrations. Remove unused ones. Use a password manager for credentials.',
      estimatedFixTime: '4 hours audit',
    })
  }

  resilienceScore = Math.max(0, Math.min(100, resilienceScore))

  let riskLevel: CyberResilienceResult['riskLevel']
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
  if (criticalCount >= 2)     riskLevel = 'critical'
  else if (criticalCount >= 1) riskLevel = 'high'
  else if (vulnerabilities.length >= 3) riskLevel = 'medium'
  else riskLevel = 'low'

  // Estimated breach cost (IBM SMB data: avg $3.31M but SMB typically $170K-$500K)
  const estimatedBreachCost = criticalCount >= 2 ? 250000 : criticalCount >= 1 ? 120000 : 50000

  vulnerabilities.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  return {
    resilienceScore,
    riskLevel,
    vulnerabilities,
    protections,
    estimatedBreachCost,
    topPriority: vulnerabilities[0]?.vulnerability ?? 'No critical vulnerabilities detected',
  }
}
