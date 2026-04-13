#!/usr/bin/env tsx
// AuraFlow — Hermes Fine-Tune Dataset Builder
// Pulls all mock_datasets from Supabase, runs each through generatePalaceReport(),
// formats prompt/completion pairs, saves to ml-data/hermes-finetune-v1.jsonl
//
// Usage:
//   npx tsx scripts/build-finetune-dataset.ts              # all 750 datasets
//   npx tsx scripts/build-finetune-dataset.ts --vertical home_services
//   npx tsx scripts/build-finetune-dataset.ts --health broken
//   npx tsx scripts/build-finetune-dataset.ts --limit 50   # first 50 (test run)
//
// Output: ml-data/hermes-finetune-v1.jsonl
// Each line = one JSON object: { prompt, completion, metadata }

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { generatePalaceReport } from '../src/lib/agents/orchestrator'
import type { Vertical } from '../src/lib/types'

// ─── CLI ARGS ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (flag: string) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : null
}
const VERTICAL_FILTER = getArg('--vertical') as Vertical | null
const HEALTH_FILTER   = getArg('--health')
const LIMIT           = getArg('--limit') ? Number(getArg('--limit')) : null
const OUTPUT_VERSION  = getArg('--version') ?? 'v1'

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MockDatasetRow {
  dataset_id: string
  vertical: string
  size_band: string
  health_level: string
  company_name: string
  location: string
  employee_count: number
  revenue: number
  foundation_score: number
  raw_data: Record<string, unknown>
}

interface FineTunePair {
  prompt: string
  completion: string
  metadata: {
    dataset_id: string
    vertical: string
    health_level: string
    foundation_score: number
    version: string
    generated_at: string
  }
}

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────
// Converts a PalaceReport into a structured prompt Hermes will learn to respond to

function buildPrompt(row: MockDatasetRow, report: Awaited<ReturnType<typeof generatePalaceReport>>): string {
  const fs = report.foundationScore
  const rb = report.revenueBleed
  const ot = report.ownerTrap
  const mv = report.marketValue
  const cp = report.churnPredictor
  const mo = report.marginOptimizer
  const lv = report.leadVelocity
  const cy = report.cyberResilience
  const ss = report.shadowSite
  const td = report.talentDensity

  return `[AURAFLOW DIAGNOSTIC]
Business: ${row.company_name} | ${row.location}
Vertical: ${row.vertical.replace(/_/g, ' ')} | Size: ${row.size_band} | Health: ${row.health_level}

FOUNDATION SCORE: ${fs.foundation_score}/100 — ${fs.tier_label}
Dimension Scores:
  Digital Presence: ${fs.dimension_scores.digital_presence}/14
  Lead Generation:  ${fs.dimension_scores.lead_generation}/15
  Advertising:      ${fs.dimension_scores.advertising}/12
  Reputation:       ${fs.dimension_scores.reputation}/13
  Operations:       ${fs.dimension_scores.operations}/16
  Financial:        ${fs.dimension_scores.financial}/15
  People:           ${fs.dimension_scores.people}/15

REVENUE BLEED
  Monthly Loss: $${rb.monthlyLoss.toLocaleString()}
  Annual Loss:  $${rb.annualLoss.toLocaleString()}
  Primary Leak: ${rb.primaryLeak}
  Bleed Score:  ${rb.bleedScore}/100
  Leaks: ${rb.leaks.slice(0, 3).map(l => `${l.source} ($${l.monthlyAmount.toLocaleString()}/mo)`).join(' | ')}

OWNER TRAP
  Level: ${ot.trapLevel}
  Hours in Business: ${ot.ownerHrsPerWeek}/week
  Team Autonomous Days: ${ot.teamAutonomousDays}
  Primary Trap: ${ot.primaryTrap}

LEAD PIPELINE
  Velocity Score: ${lv.velocityScore}/100 (Grade: ${lv.velocityGrade})
  Leads Lost/Month: ${lv.leaksPerMonth}
  Bottleneck: ${lv.bottleneck}
  Pipeline Value: $${lv.pipelineValue.toLocaleString()}/mo

REPUTATION & SITE
  Site Grade: ${ss.siteGrade} | Performance: ${ss.performanceScore}/100 | SEO: ${ss.seoScore}/100
  Load Speed: ${ss.loadSpeedSeconds}s | Mobile: ${ss.isMobileResponsive ? 'Yes' : 'No'}
  Sentiment Score: ${report.sentimentGhost.sentimentScore}/100
  Reputation Risk: ${report.sentimentGhost.reputationRisk}

CHURN
  Estimated Churn Rate: ${cp.churnRateEstimate}%
  Annual Revenue Lost: $${cp.annualRevenueLostToChurn.toLocaleString()}
  Churn Risk: ${cp.churnRisk}
  LTV Estimate: $${cp.ltvEstimate.toLocaleString()} (benchmark: $${cp.ltvBenchmark.toLocaleString()})

MARGIN
  Current Margin: ${mo.estimatedMarginPct}% (benchmark: ${mo.benchmarkMarginPct}%)
  Annual Margin Gap: $${mo.annualMarginGap.toLocaleString()}
  Pricing Health: ${mo.pricingHealth}
  Top Opportunity: ${mo.opportunities[0]?.opportunity ?? 'none'}

TALENT
  Talent Score: ${td.talentScore}/100 (${td.hiringHealth})
  Revenue/Employee: $${td.revenuePerEmployee.toLocaleString()} (benchmark: $${td.benchmarkRevPerEmployee.toLocaleString()})
  Hiring Debt: $${td.hiringDebt.toLocaleString()}/mo

CYBER
  Resilience Score: ${cy.resilienceScore}/100 | Risk Level: ${cy.riskLevel}
  Estimated Breach Cost: $${cy.estimatedBreachCost.toLocaleString()}
  Top Risk: ${cy.topPriority}

VALUATION
  Current: $${mv.currentValuation.toLocaleString()}
  Potential: $${mv.potentialValuation.toLocaleString()}
  Value Gap: $${mv.valueGap.toLocaleString()}
  Exit Readiness: ${mv.exitReadiness}
  Method: ${mv.valuationMethod}

TOTAL ANNUAL OPPORTUNITY: $${report.totalAnnualOpportunity.toLocaleString()}

CRITICAL ALERTS: ${report.criticalAlerts.length > 0 ? report.criticalAlerts.join(' | ') : 'None'}

TOP OPPORTUNITIES:
${report.topOpportunities.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

Generate a 4-5 sentence executive summary for this business owner. Be specific, use the exact dollar amounts and scores above. Name the real problems. End with the single most important first action.`
}

// ─── COMPLETION BUILDER ───────────────────────────────────────────────────────
// Generates the target completion from structured data — this is what Hermes learns to produce.
// These are deterministic templates now. After real client data accumulates,
// replace these with human-reviewed completions for higher quality fine-tuning.

function buildCompletion(row: MockDatasetRow, report: Awaited<ReturnType<typeof generatePalaceReport>>): string {
  const fs  = report.foundationScore
  const rb  = report.revenueBleed
  const ot  = report.ownerTrap
  const mv  = report.marketValue
  const cp  = report.churnPredictor
  const mo  = report.marginOptimizer
  const lv  = report.leadVelocity
  const cy  = report.cyberResilience
  const top = report.topOpportunities[0] ?? 'operational improvements'

  const verticalLabel = row.vertical.replace(/_/g, ' ')

  // Build health-level-aware completion
  let urgencyPhrase: string
  let actionPhrase: string

  switch (row.health_level) {
    case 'broken':
    case 'disqualified':
      urgencyPhrase = `This ${verticalLabel} business is in critical condition`
      actionPhrase = `The immediate priority is stopping the bleeding — everything else is secondary until the core systems are working`
      break
    case 'functional':
      urgencyPhrase = `This ${verticalLabel} business is functional but leaving significant money on the table`
      actionPhrase = `The foundation exists — now it needs to be systematized so it works without constant owner intervention`
      break
    case 'growing':
      urgencyPhrase = `This ${verticalLabel} business has real momentum but is starting to hit growth ceilings`
      actionPhrase = `The focus should be building the infrastructure to scale without the owner becoming the bottleneck`
      break
    case 'strong':
    case 'optimized':
      urgencyPhrase = `This ${verticalLabel} business is operating well above average for its vertical`
      actionPhrase = `The opportunity is shifting from operational fixes to strategic growth and exit preparation`
      break
    default:
      urgencyPhrase = `This ${verticalLabel} business has clear improvement opportunities`
      actionPhrase = `Systematic improvements across the identified gaps will unlock significant value`
  }

  const sentences: string[] = []

  // Sentence 1 — Foundation + primary problem
  sentences.push(
    `${urgencyPhrase} — scoring ${fs.foundation_score}/100 (${fs.tier_label}) with $${rb.annualLoss.toLocaleString()} leaking out annually, primarily from ${rb.primaryLeak.toLowerCase()}.`
  )

  // Sentence 2 — Owner situation
  if (ot.trapLevel === 'imprisoned' || ot.trapLevel === 'trapped') {
    sentences.push(
      `The owner is working ${ot.ownerHrsPerWeek} hours a week inside the business with only ${ot.teamAutonomousDays} day${ot.teamAutonomousDays !== 1 ? 's' : ''} the team can operate independently — this owner dependency is suppressing the valuation by capping growth at the owner's personal capacity.`
    )
  } else {
    sentences.push(
      `At ${ot.ownerHrsPerWeek} hours a week in the business, the owner has begun building team autonomy — the team can operate ${ot.teamAutonomousDays} days independently, which is a signal the systems foundation is starting to hold.`
    )
  }

  // Sentence 3 — Biggest dollar opportunity
  if (cp.churnRisk === 'critical' || cp.churnRisk === 'high') {
    sentences.push(
      `The most urgent financial issue is ${cp.churnRateEstimate}% annual customer churn costing $${cp.annualRevenueLostToChurn.toLocaleString()}/year — combined with a ${lv.velocityGrade}-grade lead pipeline losing ${lv.leaksPerMonth} leads per month, the business is simultaneously losing existing customers and failing to capture new ones.`
    )
  } else if (mo.annualMarginGap > 20000) {
    sentences.push(
      `Margin is at ${mo.estimatedMarginPct}% against a ${mo.benchmarkMarginPct}% benchmark for this vertical — the $${mo.annualMarginGap.toLocaleString()} annual margin gap means this business is generating significantly less profit per dollar of revenue than its competitors, primarily due to ${mo.opportunities[0]?.opportunity?.toLowerCase() ?? 'pricing and cost structure issues'}.`
    )
  } else {
    sentences.push(
      `Lead pipeline health is the critical leverage point — a Grade ${lv.velocityGrade} pipeline with ${lv.leaksPerMonth} leads lost per month means $${(lv.leaksPerMonth * (Number(report.marginOptimizer.opportunities[0]?.estimatedAnnualDollar ?? 0) / 12)).toLocaleString() !== '0' ? (lv.leaksPerMonth * 500).toLocaleString() : 'significant revenue'} in missed monthly revenue that better systems would capture automatically.`
    )
  }

  // Sentence 4 — Valuation story
  sentences.push(
    `At the current Foundation Score of ${fs.foundation_score}, the business is valued at $${mv.currentValuation.toLocaleString()} using the ${mv.valuationMethod} — with AuraFlow improvements, the projected score of ${mv.projectedFoundationScore} puts the valuation at $${mv.potentialValuation.toLocaleString()}, a $${mv.valueGap.toLocaleString()} uplift.`
  )

  // Sentence 5 — First action
  sentences.push(`${actionPhrase} — start with ${top.split('(')[0].trim().toLowerCase()}.`)

  return sentences.join(' ')
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║     AuraFlow — Hermes Fine-Tune Dataset Builder      ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  // ── Pull datasets from Supabase ──────────────────────────────────────────
  console.log('📥 Pulling mock datasets from Supabase...')

  let query = supabase
    .from('mock_datasets')
    .select('dataset_id, vertical, size_band, health_level, company_name, location, employee_count, revenue, foundation_score, raw_data')
    .order('vertical', { ascending: true })
    .order('health_level', { ascending: true })

  if (VERTICAL_FILTER) query = query.eq('vertical', VERTICAL_FILTER)
  if (HEALTH_FILTER)   query = query.eq('health_level', HEALTH_FILTER)
  if (LIMIT)           query = query.limit(LIMIT)

  const { data: rows, error } = await query

  if (error) {
    console.error('❌ Supabase error:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.error('❌ No datasets found. Run: npm run seed first.')
    process.exit(1)
  }

  console.log(`✅ Found ${rows.length} datasets`)
  if (VERTICAL_FILTER) console.log(`   Filter: vertical=${VERTICAL_FILTER}`)
  if (HEALTH_FILTER)   console.log(`   Filter: health=${HEALTH_FILTER}`)
  console.log()

  // ── Ensure output directory ───────────────────────────────────────────────
  const outDir = join(process.cwd(), 'ml-data')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `hermes-finetune-${OUTPUT_VERSION}.jsonl`)

  // ── Process each dataset ──────────────────────────────────────────────────
  const pairs: FineTunePair[] = []
  const errors: string[] = []
  let processed = 0

  for (const row of rows as MockDatasetRow[]) {
    try {
      const rawData  = row.raw_data as Record<string, unknown>
      const revenue  = Number(row.revenue)
      const empCount = Number(row.employee_count) || 1

      // Derive context fields from raw_data (same as seed script logic)
      const monthly_leads = Number(rawData['L01'] ?? 20)
      const close_rate    = Number(rawData['L24'] ?? 20)

      // Get avg_deal_size from vertical config via F04
      const avg_deal_size = Number(rawData['F04'] ?? 2000)

      const report = generatePalaceReport({
        rawData,
        vertical: row.vertical as Vertical,
        revenue,
        monthly_leads,
        avg_deal_size,
        close_rate,
        employee_count: empCount,
        owner_hourly_value: revenue / empCount / 2080,
      })

      const prompt     = buildPrompt(row, report)
      const completion = buildCompletion(row, report)

      pairs.push({
        prompt,
        completion,
        metadata: {
          dataset_id:      row.dataset_id,
          vertical:        row.vertical,
          health_level:    row.health_level,
          foundation_score: row.foundation_score,
          version:         OUTPUT_VERSION,
          generated_at:    new Date().toISOString(),
        },
      })

      processed++

      // Progress every 50
      if (processed % 50 === 0) {
        process.stdout.write(`   ⚙️  Processed ${processed}/${rows.length}...\r`)
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${row.dataset_id}: ${msg}`)
    }
  }

  console.log(`\n✅ Generated ${pairs.length} training pairs`)
  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} errors:`)
    errors.forEach(e => console.warn(`   ${e}`))
  }

  // ── Write JSONL ───────────────────────────────────────────────────────────
  const jsonl = pairs.map(p => JSON.stringify(p)).join('\n')
  writeFileSync(outPath, jsonl, 'utf8')
  console.log()
  console.log(`📄 Saved to: ml-data/hermes-finetune-${OUTPUT_VERSION}.jsonl`)
  console.log(`   ${pairs.length} lines | ${(Buffer.byteLength(jsonl) / 1024).toFixed(1)} KB`)

  // ── Stats summary ─────────────────────────────────────────────────────────
  console.log()
  console.log('📊 Dataset breakdown:')
  const byVertical = pairs.reduce((acc, p) => {
    acc[p.metadata.vertical] = (acc[p.metadata.vertical] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byHealth = pairs.reduce((acc, p) => {
    acc[p.metadata.health_level] = (acc[p.metadata.health_level] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgScore = Math.round(pairs.reduce((s, p) => s + p.metadata.foundation_score, 0) / pairs.length)

  Object.entries(byVertical).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => {
    console.log(`   ${v.padEnd(20)} ${n} pairs`)
  })
  console.log()
  Object.entries(byHealth).sort((a, b) => b[1] - a[1]).forEach(([h, n]) => {
    console.log(`   ${h.padEnd(20)} ${n} pairs`)
  })
  console.log()
  console.log(`   Avg Foundation Score: ${avgScore}/100`)
  console.log()
  console.log('Next step: fine-tune Hermes with this dataset')
  console.log('  python3 src/scripts/ml-training/lora-finetune.py')
  console.log()
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
