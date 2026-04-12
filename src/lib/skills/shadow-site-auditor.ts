// AuraFlow Skill #6 — Shadow-Site Auditor ("The Structural Scan")
// Key data points: D01 (website exists), D05 (page speed), D_SEO (SEO score)
// X-ray of the website's structural health — what Google sees vs what the owner sees.

export interface ShadowSiteResult {
  hasSite: boolean
  performanceScore: number      // 0-100 from PageSpeed
  seoScore: number              // 0-100 from PageSpeed
  loadSpeedSeconds: number
  isMobileResponsive: boolean
  siteGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  structuralIssues: Array<{
    issue: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    googleImpact: string
    fix: string
  }>
  seoOpportunities: Array<{
    opportunity: string
    estimatedTrafficGain: string
    effort: 'easy' | 'medium' | 'hard'
  }>
  technicalDebt: number         // 0-100: how much technical work is needed
  estimatedMonthlyTrafficLost: number
}

export function runShadowSiteAuditor(rawData: Record<string, unknown>, context: {
  monthly_leads: number
  avg_deal_size: number
  close_rate: number
}): ShadowSiteResult {
  const hasSite          = !!(rawData['D01'])
  const loadSpeed        = Number(rawData['D05'] ?? 8)
  const isMobile         = !!(rawData['D04'])
  const hasCWV           = !!(rawData['D06'])
  const hasSSL           = !!(rawData['D07'])
  const indexedPages     = Number(rawData['D08'] ?? 0)
  const hasBlog          = !!(rawData['D09'])
  const servicePages     = Number(rawData['D11'] ?? 0)
  const locationPages    = Number(rawData['D12'] ?? 0)
  const hasSchema        = !!(rawData['D20'])
  const hasGA            = !!(rawData['D21'])
  const hasConvTracking  = !!(rawData['D24'])
  const errors404        = Number(rawData['D25'] ?? 0)
  const brokenLinks      = Number(rawData['D26'] ?? 0)
  const domainAuthority  = Number(rawData['D27'] ?? 0)
  const organicKeywords  = Number(rawData['D28'] ?? 0)
  const metaDescCoverage = Number(rawData['D17'] ?? 0)
  const h1Coverage       = Number(rawData['D18'] ?? 0)
  const altTagCoverage   = Number(rawData['D19'] ?? 0)

  // PageSpeed proxy scores (use actual if available, estimate otherwise)
  const perfScore = Number(rawData['D_PERF'] ?? (loadSpeed < 2 ? 90 : loadSpeed < 3 ? 75 : loadSpeed < 4 ? 55 : loadSpeed < 6 ? 35 : 15))
  const seoScore  = Number(rawData['D_SEO']  ?? (servicePages > 6 && hasSchema && metaDescCoverage > 80 ? 85 : servicePages > 3 ? 65 : 45))

  const issues: ShadowSiteResult['structuralIssues'] = []
  let technicalDebt = 0

  if (!hasSite) {
    return {
      hasSite: false,
      performanceScore: 0, seoScore: 0,
      loadSpeedSeconds: 0, isMobileResponsive: false,
      siteGrade: 'F',
      structuralIssues: [{
        issue: 'No website exists',
        severity: 'critical',
        googleImpact: 'Completely invisible in Google search. Losing 100% of organic leads.',
        fix: 'Build a professional website immediately — this is the single highest-ROI investment',
      }],
      seoOpportunities: [],
      technicalDebt: 100,
      estimatedMonthlyTrafficLost: context.monthly_leads * 3,
    }
  }

  // Speed
  if (loadSpeed > 5) {
    technicalDebt += 25
    issues.push({ issue: `${loadSpeed}s page load speed`, severity: 'critical', googleImpact: '53% of mobile users abandon sites that take >3s. Google uses speed as ranking signal.', fix: 'Compress images, enable caching, upgrade hosting, consider CDN' })
  } else if (loadSpeed > 3) {
    technicalDebt += 15
    issues.push({ issue: `${loadSpeed}s page load speed`, severity: 'high', googleImpact: 'Above Google\'s 3s threshold — hurting Core Web Vitals score', fix: 'Optimize images (WebP), minify CSS/JS, enable browser caching' })
  }

  // Mobile
  if (!isMobile) {
    technicalDebt += 20
    issues.push({ issue: 'Not mobile responsive', severity: 'critical', googleImpact: 'Google uses mobile-first indexing. Non-mobile sites rank dramatically lower.', fix: 'Rebuild site with responsive design — not a quick fix, requires proper rebuild' })
  }

  // SSL
  if (!hasSSL) {
    technicalDebt += 10
    issues.push({ issue: 'No SSL certificate (not HTTPS)', severity: 'critical', googleImpact: 'Chrome marks site as "Not Secure". Google confirmed HTTPS is a ranking factor.', fix: 'Install SSL certificate — most hosts offer free via Let\'s Encrypt' })
  }

  // CWV
  if (!hasCWV) {
    technicalDebt += 15
    issues.push({ issue: 'Core Web Vitals failing', severity: 'high', googleImpact: 'Google\'s Page Experience ranking signal — failing CWV costs ranking positions', fix: 'Fix LCP, CLS, and FID. Use Google Search Console for specific issues.' })
  }

  // 404s and broken links
  if (errors404 > 10 || brokenLinks > 10) {
    technicalDebt += 10
    issues.push({ issue: `${errors404} 404 errors and ${brokenLinks} broken links`, severity: 'high', googleImpact: 'Crawl errors waste Google\'s crawl budget and signal poor site maintenance', fix: 'Audit with Screaming Frog, redirect 404s, fix broken internal links' })
  }

  // Thin content
  if (servicePages < 3) {
    technicalDebt += 10
    issues.push({ issue: `Only ${servicePages} service page${servicePages === 1 ? '' : 's'}`, severity: 'high', googleImpact: 'Google can\'t rank you for services it doesn\'t know you offer', fix: 'Create a dedicated page for every service you offer with 500+ words each' })
  }

  // Schema
  if (!hasSchema) {
    technicalDebt += 5
    issues.push({ issue: 'No schema markup', severity: 'medium', googleImpact: 'Missing rich results (star ratings, FAQ, service listings in search)', fix: 'Add LocalBusiness, Service, and FAQPage schema markup' })
  }

  // No GA
  if (!hasGA) {
    technicalDebt += 10
    issues.push({ issue: 'Google Analytics not installed', severity: 'high', googleImpact: 'Impossible to measure what\'s working or optimize without traffic data', fix: 'Install GA4 + Google Tag Manager immediately' })
  }

  // SEO opportunities
  const seoOpportunities: ShadowSiteResult['seoOpportunities'] = []

  if (organicKeywords < 20) {
    seoOpportunities.push({ opportunity: 'Target long-tail local keywords (e.g., "[service] in [city]")', estimatedTrafficGain: '40-120% organic traffic increase over 6 months', effort: 'medium' })
  }

  if (!hasBlog) {
    seoOpportunities.push({ opportunity: 'Start a blog targeting FAQ keywords from customers', estimatedTrafficGain: '25-60 additional monthly visitors per post', effort: 'medium' })
  }

  if (locationPages < 3) {
    seoOpportunities.push({ opportunity: `Create location pages for each city/area you serve`, estimatedTrafficGain: 'Rank for "[service] in [city]" searches — often low competition', effort: 'easy' })
  }

  if (metaDescCoverage < 80) {
    seoOpportunities.push({ opportunity: 'Write unique meta descriptions for all pages', estimatedTrafficGain: '5-15% CTR improvement from search results', effort: 'easy' })
  }

  technicalDebt = Math.min(100, technicalDebt)

  // Site grade
  const avgScore = (perfScore + seoScore) / 2
  let siteGrade: ShadowSiteResult['siteGrade']
  if (avgScore >= 85 && !issues.find(i => i.severity === 'critical')) siteGrade = 'A'
  else if (avgScore >= 70) siteGrade = 'B'
  else if (avgScore >= 55) siteGrade = 'C'
  else if (avgScore >= 35) siteGrade = 'D'
  else siteGrade = 'F'

  // Estimate traffic lost from technical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical').length
  const estimatedMonthlyTrafficLost = Math.round(context.monthly_leads * criticalIssues * 0.3)

  issues.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  return {
    hasSite,
    performanceScore: perfScore,
    seoScore,
    loadSpeedSeconds: loadSpeed,
    isMobileResponsive: isMobile,
    siteGrade,
    structuralIssues: issues,
    seoOpportunities,
    technicalDebt,
    estimatedMonthlyTrafficLost,
  }
}
