// AuraFlow Diagnostic Engine — 163 Data Point Registry
// Defines scoring logic for every data point across 7 dimensions
// Total max scores: D1=14, D2=15, D3=12, D4=13, D5=16, D6=15, D7=15 → 100

export type ScoringDirection = 'higher_better' | 'lower_better' | 'binary' | 'scale' | 'category' | 'multi' | 'percentage'

export interface DataPointConfig {
  id: string
  dimension: 1 | 2 | 3 | 4 | 5 | 6 | 7
  weight: number
  direction: ScoringDirection
  // For numeric: [poor_threshold, ok_threshold, good_threshold, excellent_threshold]
  // For percentage: target percentage (0-100) where score = 1.0
  thresholds?: number[]
  // For category/multi: map of value → normalized score (0-1)
  valueMap?: Record<string, number>
}

// ─── DIMENSION 1: DIGITAL PRESENCE (max 14 pts) ───────────────────────────────
const D: DataPointConfig[] = [
  { id: 'D01', dimension: 1, weight: 3, direction: 'binary' },
  { id: 'D02', dimension: 1, weight: 1, direction: 'category',
    valueMap: { custom: 1, wordpress: 0.9, webflow: 0.9, shopify: 0.8, squarespace: 0.6, wix: 0.4, none: 0 } },
  { id: 'D03', dimension: 1, weight: 1, direction: 'higher_better', thresholds: [6, 12, 24, 48] }, // months
  { id: 'D04', dimension: 1, weight: 3, direction: 'binary' },
  { id: 'D05', dimension: 1, weight: 2, direction: 'lower_better', thresholds: [6, 4.5, 3, 2] }, // seconds
  { id: 'D06', dimension: 1, weight: 2, direction: 'binary' }, // CWV pass
  { id: 'D07', dimension: 1, weight: 2, direction: 'binary' }, // SSL
  { id: 'D08', dimension: 1, weight: 1, direction: 'higher_better', thresholds: [3, 7, 15, 30] }, // indexed pages
  { id: 'D09', dimension: 1, weight: 1, direction: 'binary' }, // blog
  { id: 'D10', dimension: 1, weight: 2, direction: 'higher_better', thresholds: [0, 1, 4, 8] }, // posts/month
  { id: 'D11', dimension: 1, weight: 2, direction: 'higher_better', thresholds: [0, 3, 6, 12] }, // service pages
  { id: 'D12', dimension: 1, weight: 2, direction: 'higher_better', thresholds: [0, 1, 3, 8] }, // location pages
  { id: 'D13', dimension: 1, weight: 2, direction: 'binary' }, // contact form
  { id: 'D14', dimension: 1, weight: 2, direction: 'binary' }, // phone visible
  { id: 'D15', dimension: 1, weight: 1, direction: 'binary' }, // click-to-call
  { id: 'D16', dimension: 1, weight: 1, direction: 'binary' }, // chat widget
  { id: 'D17', dimension: 1, weight: 1, direction: 'percentage', thresholds: [90] }, // meta descriptions %
  { id: 'D18', dimension: 1, weight: 1, direction: 'percentage', thresholds: [90] }, // H1 %
  { id: 'D19', dimension: 1, weight: 1, direction: 'percentage', thresholds: [85] }, // alt tags %
  { id: 'D20', dimension: 1, weight: 1, direction: 'binary' }, // schema
  { id: 'D21', dimension: 1, weight: 2, direction: 'binary' }, // GA
  { id: 'D22', dimension: 1, weight: 1, direction: 'binary' }, // GTM
  { id: 'D23', dimension: 1, weight: 1, direction: 'binary' }, // FB pixel
  { id: 'D24', dimension: 1, weight: 2, direction: 'binary' }, // conversion tracking
  { id: 'D25', dimension: 1, weight: 1, direction: 'lower_better', thresholds: [20, 10, 3, 0] }, // 404 errors
  { id: 'D26', dimension: 1, weight: 1, direction: 'lower_better', thresholds: [20, 10, 3, 0] }, // broken links
  { id: 'D27', dimension: 1, weight: 2, direction: 'higher_better', thresholds: [10, 20, 35, 50] }, // DA
  { id: 'D28', dimension: 1, weight: 2, direction: 'higher_better', thresholds: [0, 5, 20, 50] }, // organic keywords
]

// ─── DIMENSION 2: LEAD GENERATION (max 15 pts) ────────────────────────────────
const L: DataPointConfig[] = [
  { id: 'L01', dimension: 2, weight: 3, direction: 'higher_better', thresholds: [5, 15, 40, 100] }, // monthly leads
  { id: 'L02', dimension: 2, weight: 2, direction: 'multi' }, // lead sources (more sources = better)
  { id: 'L03', dimension: 2, weight: 3, direction: 'lower_better', thresholds: [300, 150, 80, 40] }, // CPL
  { id: 'L04', dimension: 2, weight: 4, direction: 'lower_better', thresholds: [240, 60, 15, 5] }, // response time (min)
  { id: 'L05', dimension: 2, weight: 3, direction: 'category',
    valueMap: { ai_receptionist: 1, auto_text: 0.9, live_chat: 0.8, booking_form: 0.7, answering_service: 0.5, voicemail: 0.2, nothing: 0 } },
  { id: 'L06', dimension: 2, weight: 2, direction: 'higher_better', thresholds: [0.5, 1.5, 3, 6] }, // form CVR %
  { id: 'L07', dimension: 2, weight: 3, direction: 'higher_better', thresholds: [40, 55, 70, 85] }, // phone answer rate %
  { id: 'L08', dimension: 2, weight: 2, direction: 'lower_better', thresholds: [48, 24, 4, 1] }, // voicemail return (hrs)
  { id: 'L09', dimension: 2, weight: 2, direction: 'binary' }, // qualification process
  { id: 'L10', dimension: 2, weight: 2, direction: 'binary' }, // lead scoring system
  { id: 'L11', dimension: 2, weight: 1, direction: 'category',
    valueMap: { servicetitan: 1, hubspot: 1, salesforce: 1, housecall_pro: 0.9, jobber: 0.8, zoho: 0.7, spreadsheet: 0.3, none: 0 } },
  { id: 'L12', dimension: 2, weight: 2, direction: 'scale' }, // CRM quality 1-5
  { id: 'L13', dimension: 2, weight: 2, direction: 'percentage', thresholds: [80] }, // % leads in CRM
  { id: 'L14', dimension: 2, weight: 3, direction: 'binary' }, // follow-up sequence
  { id: 'L15', dimension: 2, weight: 2, direction: 'higher_better', thresholds: [0, 2, 4, 7] }, // follow-up touchpoints
  { id: 'L16', dimension: 2, weight: 1, direction: 'multi' }, // follow-up channels
  { id: 'L17', dimension: 2, weight: 3, direction: 'lower_better', thresholds: [72, 24, 4, 1] }, // first follow-up (hrs)
  { id: 'L18', dimension: 2, weight: 2, direction: 'binary' }, // lost lead recovery
  { id: 'L19', dimension: 2, weight: 1, direction: 'binary' }, // referral program
  { id: 'L20', dimension: 2, weight: 2, direction: 'higher_better', thresholds: [5, 15, 25, 40] }, // referral rate %
  { id: 'L21', dimension: 2, weight: 2, direction: 'binary' }, // online booking
  { id: 'L22', dimension: 2, weight: 1, direction: 'lower_better', thresholds: [30, 20, 10, 5] }, // no-show rate %
  { id: 'L23', dimension: 2, weight: 3, direction: 'higher_better', thresholds: [5, 10, 18, 30] }, // lead→appt CVR %
  { id: 'L24', dimension: 2, weight: 3, direction: 'higher_better', thresholds: [15, 25, 40, 60] }, // appt→close rate %
]

// ─── DIMENSION 3: ADVERTISING (max 12 pts) ────────────────────────────────────
const A: DataPointConfig[] = [
  { id: 'A01', dimension: 3, weight: 2, direction: 'higher_better', thresholds: [0, 800, 2500, 6000] }, // ad spend $
  { id: 'A02', dimension: 3, weight: 1, direction: 'multi' }, // platforms used
  { id: 'A03', dimension: 3, weight: 2, direction: 'binary' }, // Google Ads exists
  { id: 'A04', dimension: 3, weight: 3, direction: 'binary' }, // conversion tracking
  { id: 'A05', dimension: 3, weight: 2, direction: 'higher_better', thresholds: [3, 4, 6, 8] }, // quality score
  { id: 'A06', dimension: 3, weight: 2, direction: 'higher_better', thresholds: [1, 3, 5, 8] }, // CTR %
  { id: 'A07', dimension: 3, weight: 2, direction: 'lower_better', thresholds: [20, 12, 8, 5] }, // CPC $
  { id: 'A08', dimension: 3, weight: 2, direction: 'binary' }, // LSA active
  { id: 'A09', dimension: 3, weight: 1, direction: 'higher_better', thresholds: [0, 5, 15, 30] }, // LSA reviews
  { id: 'A10', dimension: 3, weight: 1, direction: 'binary' }, // Meta Ads exists
  { id: 'A11', dimension: 3, weight: 2, direction: 'higher_better', thresholds: [1, 2.5, 4, 6] }, // Meta ROAS
  { id: 'A12', dimension: 3, weight: 1, direction: 'multi' }, // home service platforms
  { id: 'A13', dimension: 3, weight: 2, direction: 'lower_better', thresholds: [300, 150, 80, 40] }, // platform CPL
  { id: 'A14', dimension: 3, weight: 1, direction: 'lower_better', thresholds: [180, 90, 30, 7] }, // creative age (days)
  { id: 'A15', dimension: 3, weight: 1, direction: 'binary' }, // A/B testing
  { id: 'A16', dimension: 3, weight: 1, direction: 'binary' }, // negative keywords
  { id: 'A17', dimension: 3, weight: 1, direction: 'binary' }, // geo-targeting
  { id: 'A18', dimension: 3, weight: 1, direction: 'binary' }, // ad scheduling
  { id: 'A19', dimension: 3, weight: 2, direction: 'binary' }, // retargeting
  { id: 'A20', dimension: 3, weight: 3, direction: 'higher_better', thresholds: [1, 2.5, 4.5, 7] }, // overall ROAS
  { id: 'A21', dimension: 3, weight: 2, direction: 'category',
    valueMap: { optimal: 1, high: 0.7, low: 0.6, zero: 0 } }, // ad spend as % of revenue
  { id: 'A22', dimension: 3, weight: 2, direction: 'category',
    valueMap: { data_driven: 1, last_click: 0.6, first_click: 0.5, none: 0 } },
]

// ─── DIMENSION 4: REPUTATION (max 13 pts) ────────────────────────────────────
const R: DataPointConfig[] = [
  { id: 'R01', dimension: 4, weight: 3, direction: 'binary' }, // GBP claimed
  { id: 'R02', dimension: 4, weight: 1, direction: 'binary' }, // GBP categories
  { id: 'R03', dimension: 4, weight: 1, direction: 'higher_better', thresholds: [5, 20, 50, 100] }, // GBP photos
  { id: 'R04', dimension: 4, weight: 1, direction: 'higher_better', thresholds: [0, 1, 3, 8] }, // GBP posts/30d
  { id: 'R05', dimension: 4, weight: 3, direction: 'higher_better', thresholds: [10, 30, 80, 200] }, // Google review count
  { id: 'R06', dimension: 4, weight: 3, direction: 'higher_better', thresholds: [3.5, 4.0, 4.4, 4.7] }, // Google rating
  { id: 'R07', dimension: 4, weight: 2, direction: 'higher_better', thresholds: [0, 2, 5, 12] }, // review velocity/mo
  { id: 'R08', dimension: 4, weight: 3, direction: 'higher_better', thresholds: [10, 30, 60, 90] }, // response rate %
  { id: 'R09', dimension: 4, weight: 2, direction: 'lower_better', thresholds: [168, 72, 24, 4] }, // response time (hrs)
  { id: 'R10', dimension: 4, weight: 1, direction: 'binary' }, // Yelp claimed
  { id: 'R11', dimension: 4, weight: 2, direction: 'higher_better', thresholds: [0, 5, 15, 40] }, // Yelp reviews
  { id: 'R12', dimension: 4, weight: 2, direction: 'higher_better', thresholds: [3.0, 3.5, 4.0, 4.5] }, // Yelp rating
  { id: 'R13', dimension: 4, weight: 1, direction: 'binary' }, // BBB
  { id: 'R14', dimension: 4, weight: 1, direction: 'multi' }, // industry platforms
  { id: 'R15', dimension: 4, weight: 2, direction: 'binary' }, // review gen system
  { id: 'R16', dimension: 4, weight: 2, direction: 'binary' }, // negative review protocol
  { id: 'R17', dimension: 4, weight: 2, direction: 'percentage', thresholds: [80] }, // NAP consistency %
  { id: 'R18', dimension: 4, weight: 1, direction: 'higher_better', thresholds: [5, 15, 30, 60] }, // citation count
]

// ─── DIMENSION 5: OPERATIONS (max 16 pts) ─────────────────────────────────────
const O: DataPointConfig[] = [
  { id: 'O01', dimension: 5, weight: 2, direction: 'higher_better', thresholds: [1, 4, 8, 15] }, // tools count
  { id: 'O02', dimension: 5, weight: 3, direction: 'higher_better', thresholds: [0, 2, 5, 10] }, // connected tools
  { id: 'O03', dimension: 5, weight: 3, direction: 'lower_better', thresholds: [30, 20, 10, 4] }, // manual hrs/wk
  { id: 'O04', dimension: 5, weight: 2, direction: 'binary' }, // SOPs
  { id: 'O05', dimension: 5, weight: 1, direction: 'category',
    valueMap: { monday: 1, asana: 1, clickup: 1, notion: 0.9, jira: 0.9, trello: 0.7, email: 0.3, none: 0 } },
  { id: 'O06', dimension: 5, weight: 1, direction: 'category',
    valueMap: { slack: 1, teams: 0.9, discord: 0.8, email: 0.5, text: 0.3, none: 0 } },
  { id: 'O07', dimension: 5, weight: 2, direction: 'category',
    valueMap: { servicetitan: 1, housecall_pro: 1, jobber: 0.9, calendar_crm: 0.7, phone_paper: 0.2, none: 0 } },
  { id: 'O08', dimension: 5, weight: 2, direction: 'binary' }, // invoicing automated
  { id: 'O09', dimension: 5, weight: 2, direction: 'binary' }, // payment automated
  { id: 'O10', dimension: 5, weight: 2, direction: 'binary' }, // comms automated
  { id: 'O11', dimension: 5, weight: 1, direction: 'binary' }, // inventory tracking
  { id: 'O12', dimension: 5, weight: 1, direction: 'category',
    valueMap: { automated_app: 1, spreadsheet: 0.5, manual: 0.2, none: 0 } },
  { id: 'O13', dimension: 5, weight: 1, direction: 'binary' }, // onboarding documented
  { id: 'O14', dimension: 5, weight: 1, direction: 'lower_better', thresholds: [200, 100, 50, 20] }, // email vol/day
  { id: 'O15', dimension: 5, weight: 3, direction: 'lower_better', thresholds: [60, 50, 40, 25] }, // owner admin hrs/wk
  { id: 'O16', dimension: 5, weight: 2, direction: 'lower_better', thresholds: [25, 18, 10, 5] }, // team admin hrs/wk
  { id: 'O17', dimension: 5, weight: 3, direction: 'category', valueMap: { yes: 1, maybe: 0.5, no: 0 } }, // handle 2x
  { id: 'O18', dimension: 5, weight: 0, direction: 'binary' }, // bottleneck text (no score)
  { id: 'O19', dimension: 5, weight: 0, direction: 'binary' }, // last failure text (no score)
  { id: 'O20', dimension: 5, weight: 1, direction: 'binary' }, // data backup
  { id: 'O21', dimension: 5, weight: 2, direction: 'binary' }, // single point of failure — INVERTED (identified=good)
  { id: 'O22', dimension: 5, weight: 2, direction: 'binary' }, // reporting dashboard
  { id: 'O23', dimension: 5, weight: 1, direction: 'category',
    valueMap: { daily: 1, weekly: 0.9, monthly: 0.6, quarterly: 0.3, never: 0 } },
  { id: 'O24', dimension: 5, weight: 1, direction: 'scale' }, // decision speed 1-5
  { id: 'O25', dimension: 5, weight: 1, direction: 'category',
    valueMap: { voip_crm: 1, voip: 0.8, virtual: 0.7, mobile: 0.5, landline: 0.2 } },
  { id: 'O26', dimension: 5, weight: 1, direction: 'binary' }, // call recording
  { id: 'O27', dimension: 5, weight: 2, direction: 'category',
    valueMap: { servicetitan: 1, hubspot: 1, housecall_pro: 0.9, buildertrend: 0.9, clio: 0.9, mindbody: 0.9, shopify: 0.9, toast: 0.9, other: 0.7, spreadsheet: 0.3, none: 0 } },
  { id: 'O28', dimension: 5, weight: 1, direction: 'scale' }, // platform satisfaction 1-5
  { id: 'O29', dimension: 5, weight: 1, direction: 'binary' }, // API access
  { id: 'O30', dimension: 5, weight: 1, direction: 'binary' }, // cloud storage organized
  { id: 'O31', dimension: 5, weight: 1, direction: 'binary' }, // version control
  { id: 'O32', dimension: 5, weight: 1, direction: 'binary' }, // compliance automated
]

// ─── DIMENSION 6: FINANCIAL HEALTH (max 15 pts) ───────────────────────────────
const F: DataPointConfig[] = [
  { id: 'F01', dimension: 6, weight: 2, direction: 'category',
    valueMap: { '5M+': 1, '1M-5M': 0.8, '500K-1M': 0.6, '250K-500K': 0.4, '<250K': 0.1 } },
  { id: 'F02', dimension: 6, weight: 2, direction: 'category',
    valueMap: { 'growing_fast': 1, 'growing': 0.8, 'flat': 0.4, 'declining': 0 } },
  { id: 'F03', dimension: 6, weight: 2, direction: 'category',
    valueMap: { '30%+': 1, '20-30%': 0.8, '10-20%': 0.5, '<10%': 0.2, 'negative': 0 } },
  { id: 'F04', dimension: 6, weight: 2, direction: 'higher_better', thresholds: [500, 1500, 3500, 8000] }, // avg deal $
  { id: 'F05', dimension: 6, weight: 2, direction: 'binary' }, // CAC known
  { id: 'F06', dimension: 6, weight: 2, direction: 'binary' }, // LTV known
  { id: 'F07', dimension: 6, weight: 2, direction: 'higher_better', thresholds: [50000, 80000, 120000, 200000] }, // rev/employee
  { id: 'F08', dimension: 6, weight: 2, direction: 'higher_better', thresholds: [10, 20, 35, 50] }, // repeat rate %
  { id: 'F09', dimension: 6, weight: 1, direction: 'higher_better', thresholds: [500, 1200, 3000, 8000] }, // rev/customer/yr
  { id: 'F10', dimension: 6, weight: 1, direction: 'lower_better', thresholds: [80, 50, 30, 15] }, // seasonal variance %
  { id: 'F11', dimension: 6, weight: 1, direction: 'category',
    valueMap: { quickbooks: 1, xero: 1, sage: 0.9, freshbooks: 0.8, wave: 0.6, spreadsheet: 0.3, none: 0 } },
  { id: 'F12', dimension: 6, weight: 1, direction: 'category',
    valueMap: { weekly: 1, monthly: 0.8, quarterly: 0.4, annual: 0.2, never: 0 } },
  { id: 'F13', dimension: 6, weight: 1, direction: 'scale' }, // cash flow visibility 1-5
  { id: 'F14', dimension: 6, weight: 2, direction: 'binary' }, // can identify most profitable service
  { id: 'F15', dimension: 6, weight: 1, direction: 'binary' }, // can identify least profitable
  { id: 'F16', dimension: 6, weight: 1, direction: 'category',
    valueMap: { value_based: 1, competitive: 0.7, cost_plus: 0.5, gut_feel: 0.2 } },
  { id: 'F17', dimension: 6, weight: 1, direction: 'lower_better', thresholds: [36, 24, 12, 6] }, // pricing reviewed (mo ago)
  { id: 'F18', dimension: 6, weight: 1, direction: 'scale' }, // revenue forecasting 1-5
  { id: 'F19', dimension: 6, weight: 1, direction: 'higher_better', thresholds: [0, 500, 2000, 5000] }, // tech budget/mo
  { id: 'F20', dimension: 6, weight: 1, direction: 'higher_better', thresholds: [0, 800, 2500, 6000] }, // marketing spend/mo
  { id: 'F21', dimension: 6, weight: 2, direction: 'higher_better', thresholds: [5, 20, 40, 70] }, // revenue from digital %
]

// ─── DIMENSION 7: PEOPLE & CULTURE (max 15 pts) ───────────────────────────────
const P: DataPointConfig[] = [
  { id: 'P01', dimension: 7, weight: 1, direction: 'higher_better', thresholds: [1, 5, 15, 30] }, // employees
  { id: 'P02', dimension: 7, weight: 1, direction: 'higher_better', thresholds: [6, 12, 24, 48] }, // avg tenure (mo)
  { id: 'P03', dimension: 7, weight: 2, direction: 'lower_better', thresholds: [50, 30, 15, 5] }, // turnover %
  { id: 'P04', dimension: 7, weight: 1, direction: 'lower_better', thresholds: [5, 3, 1, 0] }, // open positions
  { id: 'P05', dimension: 7, weight: 1, direction: 'lower_better', thresholds: [16, 10, 4, 1] }, // time to fill (wks)
  { id: 'P06', dimension: 7, weight: 1, direction: 'binary' }, // training program
  { id: 'P07', dimension: 7, weight: 1, direction: 'higher_better', thresholds: [0, 8, 20, 40] }, // training hrs/yr
  { id: 'P08', dimension: 7, weight: 1, direction: 'scale' }, // employee satisfaction 1-5
  { id: 'P09', dimension: 7, weight: 3, direction: 'lower_better', thresholds: [60, 50, 40, 25] }, // owner hrs/wk IN
  { id: 'P10', dimension: 7, weight: 2, direction: 'higher_better', thresholds: [0, 5, 15, 25] }, // owner hrs/wk ON
  { id: 'P11', dimension: 7, weight: 2, direction: 'scale' }, // delegation comfort 1-5
  { id: 'P12', dimension: 7, weight: 3, direction: 'higher_better', thresholds: [0, 1, 5, 14] }, // team ops without owner (days)
  { id: 'P13', dimension: 7, weight: 1, direction: 'binary' }, // performance metrics
  { id: 'P14', dimension: 7, weight: 1, direction: 'binary' }, // org chart
  { id: 'P15', dimension: 7, weight: 1, direction: 'binary' }, // decision rights
  { id: 'P16', dimension: 7, weight: 1, direction: 'category',
    valueMap: { daily_standup: 1, weekly: 0.9, biweekly: 0.7, monthly: 0.4, never: 0 } },
  { id: 'P17', dimension: 7, weight: 1, direction: 'binary' }, // remote capability
  { id: 'P18', dimension: 7, weight: 1, direction: 'binary' }, // culture documented
]

// ─── MASTER REGISTRY ─────────────────────────────────────────────────────────

export const DATA_POINTS: DataPointConfig[] = [...D, ...L, ...A, ...R, ...O, ...F, ...P]

export const DIMENSION_MAXES: Record<number, number> = {
  1: 14, // Digital Presence
  2: 15, // Lead Generation
  3: 12, // Advertising
  4: 13, // Reputation
  5: 16, // Operations
  6: 15, // Financial
  7: 15, // People
}

export const DIMENSION_NAMES: Record<number, string> = {
  1: 'digital_presence',
  2: 'lead_generation',
  3: 'advertising',
  4: 'reputation',
  5: 'operations',
  6: 'financial',
  7: 'people',
}

// Total raw weight sums per dimension (used for normalization)
export function getDimensionRawMax(dimension: number): number {
  return DATA_POINTS
    .filter(dp => dp.dimension === dimension && dp.weight > 0)
    .reduce((sum, dp) => sum + dp.weight, 0)
}
