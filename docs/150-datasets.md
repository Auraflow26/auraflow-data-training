# AuraFlow Diagnostic Engine — Data Acquisition & Dataset Library
## 150 Datasets · 15 Verticals · 10 Per Vertical · Real Industry Benchmarks
## Sources: WebFX, LocaliQ, ServiceTitan, HubSpot, Invoca, IDC, BCG, Shopify, Toast, Clio
### Confidential · April 2026 · v1.0

---

## DATA SOURCE REGISTRY

All benchmark values in this document are sourced from or calibrated against these respected platforms:

| Source | Data type | URL | Last updated |
|--------|-----------|-----|-------------|
| WebFX 2026 Home Services Benchmarks | CPL, CVR, CPC, margins by trade | webfx.com | Dec 2025 |
| LocaliQ 2025 Search Ad Benchmarks | CPC, CTR, CVR, CPL by industry | localiq.com | Feb 2026 |
| ServiceTitan Industry Reports | Booking rates, revenue/tech, job size | servicetitan.com | 2025 |
| Invoca Call Conversion Benchmarks | Answer rates, lead rates, conversion | invoca.com | 2025 |
| HubSpot State of Marketing | Email rates, content benchmarks | hubspot.com | 2025 |
| Shopify Commerce Benchmarks | AOV, cart abandonment, LTV | shopify.com | 2025 |
| Toast Restaurant Trends | Table turn, food cost, labor % | toasttab.com | 2025 |
| Clio Legal Trends Report | Billable hours, utilization, matter cycle | clio.com | 2025 |
| IDC SMB FutureScape 2026 | Digital maturity, AI adoption, cloud | idc.com | Feb 2026 |
| BCG Digital Acceleration Index | 42-category digital maturity scoring | bcg.com | 2025 |
| MetricNexus SMB Marketing 2026 | ROAS, CAC, conversion by segment | metricnexus.ai | Mar 2026 |
| Techaisle SMB Research | Cloud maturity, DX readiness | techaisle.com | 2025 |
| IBIS World Industry Reports | Revenue, margins, growth by vertical | ibisworld.com | 2025 |
| Bureau of Labor Statistics | Employment, wages, turnover by industry | bls.gov | 2025 |
| Yelp Economic Average | New business openings, review velocity | yelp.com | 2025 |

---

## INDUSTRY BENCHMARK PROFILES (15 Verticals)

Each profile defines the "healthy baseline" for that vertical. Every mock dataset is scored against these benchmarks.

### Real benchmark values by dimension:

---

### VERTICAL 1: HOME SERVICES (Electrical, Plumbing, HVAC, General Contracting)

**Sources: WebFX, LocaliQ, ServiceTitan, Invoca 2025-2026**

```
DIGITAL PRESENCE BENCHMARKS:
  Website exists: 92% of businesses (source: IBIS World)
  Mobile responsive: 78% (source: LocaliQ)
  Page load speed: median 3.2s (source: WebFX)
  Service pages: median 6, top quartile 14+
  Google Analytics installed: 61%
  Conversion tracking: 38% (source: LocaliQ — most DON'T track)

LEAD GENERATION BENCHMARKS:
  Monthly leads: 15-40 (small), 40-120 (medium)
  Cost per lead: $60-$229 HVAC, $30-$98 plumbing, $100-$264 electrical (source: WebFX)
  Average CPC: $7.85 (home services avg), $12.18 electrical (source: LocaliQ)
  CTR: 6.37% avg, electricians 5.15% (source: LocaliQ)
  Lead response time: 78% respond >5 minutes (source: Invoca); first responder wins 78% of jobs
  Phone answer rate: 61% avg across industries (source: Invoca)
  Booking rate: 42% avg for trade businesses (source: ServiceTitan)
  Conversion rate: 7.8% industry avg, plumbing 12-15%, electrical 8-10% (source: WebFX)

ADVERTISING BENCHMARKS:
  Monthly ad spend: $1,200-$3,500 (small), $3,500-$8,000 (medium)
  Google Ads ROAS: 3:1 to 8:1 depending on trade (source: LocaliQ)
  LSA adoption: 34% of home services businesses (source: Google)
  Meta Ads ROAS: 2.5:1 to 4:1 for geo-targeted campaigns
  Retargeting active: 22% of small businesses

REPUTATION BENCHMARKS:
  Google review count: median 47 (small), 120+ (top quartile)
  Google rating: 4.3 avg (source: Yelp/GBP aggregate)
  Review velocity: 3-5/month (small), 10-20/month (top quartile)
  Review response rate: 32% avg (source: WebFX) — top performers 90%+
  Yelp present: 67% of home services

OPERATIONS BENCHMARKS:
  Software tools used: 6-12 avg
  Tools connected/integrated: 2-3 avg (most are siloed)
  Owner hours/week IN business: 50-60 avg (source: SBA)
  Revenue per employee: $85K-$150K (source: IBIS World)
  Revenue per technician: $180K-$250K (source: ServiceTitan)
  Average job size: electrical $280-$4,200, plumbing $175-$400, HVAC $300-$8,500

FINANCIAL BENCHMARKS:
  Gross margin: 33% avg, 30-40% range (source: WebFX)
  Repeat customer rate: 22-35%
  Customer acquisition cost: $75-$250 (source: WebFX)
  LTV:CAC ratio target: 3:1 or higher
```

### VERTICAL 2: RESTAURANTS

**Sources: Toast, National Restaurant Association, IBIS World**

```
DIGITAL PRESENCE: Website 88%, mobile 82%, reservation system 65%, menu online 94%
LEAD GENERATION: Walk-in 45%, online ordering 30%, delivery apps 15%, social 10%
ADVERTISING: $800-$2,500/mo (independent), Meta dominant, Google secondary
REPUTATION: Median 125 reviews, 4.1 avg rating, review velocity 5-15/mo
OPERATIONS: Toast/Square adoption 72%, food cost target 28-32%, labor cost 25-35%
  Table turn rate: 1.5-2.5x lunch, 1.2-1.8x dinner
  Average check: $15-$35 casual, $45-$90 fine dining
FINANCIAL: Gross margin 60-70% (food), net margin 3-9%, annual turnover 75%
PEOPLE: Avg employees 15-25, turnover 75% (highest of all verticals)
```

### VERTICAL 3: DIGITAL AGENCIES

**Sources: HubSpot, Databox, Agency Analytics**

```
DIGITAL PRESENCE: Website 99%, blog 78%, case studies 62%, portfolio 85%
LEAD GENERATION: 5-15 leads/mo (small), referral-dominant (60%), content 25%
ADVERTISING: $500-$2,000/mo own marketing, mostly LinkedIn + content
REPUTATION: Clutch/G2 reviews median 12, Google reviews median 28
OPERATIONS: Tools avg 18-22, billable utilization target 65-75%, 
  client retention rate 72-85%, avg project value $5K-$25K
FINANCIAL: Gross margin 50-60%, net margin 15-25%, revenue/employee $100K-$180K
PEOPLE: Avg 4-12 employees, turnover 22%, remote-first 68%
```

### VERTICAL 4: REAL ESTATE

**Sources: NAR, Follow Up Boss, kvCORE**

```
DIGITAL PRESENCE: Website 91%, IDX integration 45%, CRM 72%
LEAD GENERATION: 20-80 leads/mo, online 40%, referral 35%, sphere 25%
  Cost per lead: $30-$150 (Zillow $20-$60, Google $80-$200)
  Response time: median 4.2 hours (NAR) — top agents <5 min
ADVERTISING: $500-$3,000/mo, Zillow/Realtor dominant, Meta secondary
REPUTATION: Google reviews median 35, rating 4.6 avg
OPERATIONS: CRM adoption 72% but utilization <40%, avg days on market 30-60
FINANCIAL: Commission splits 70/30 to 80/20, avg home price varies by market
PEOPLE: Solo 45%, team 35%, brokerage 20%
```

### VERTICAL 5: E-COMMERCE

**Sources: Shopify, Klaviyo, ShipStation**

```
DIGITAL PRESENCE: Shopify 45%, WooCommerce 28%, custom 15%
LEAD GENERATION: Site traffic conversion rate 2.1% avg (Shopify benchmark)
  Cart abandonment: 70% avg (Baymard Institute)
  Email capture rate: 3-5% of visitors
ADVERTISING: $2,000-$25,000/mo, Meta dominant (42%), Google 35%, TikTok 12%
  ROAS: 3:1 to 8:1 (Meta avg 4.2:1 for DTC)
REPUTATION: Product reviews avg 12/product, overall store rating 4.3
OPERATIONS: AOV $50-$120, LTV $150-$400, order-to-ship 1.8 days avg
FINANCIAL: Gross margin 40-70% (product dependent), CAC $25-$80
PEOPLE: 5-20 employees, lean operations, high contractor usage
```

### VERTICALS 6-15: BENCHMARK SUMMARIES

```
6. HEALTHCARE (Dental/Medical Practice):
   Patient acquisition cost $150-$300, no-show rate 18-23%,
   HIPAA compliance required, avg revenue/patient $1,200/yr
   
7. SaaS:
   MRR tracking essential, churn rate 3-7% monthly (SMB SaaS),
   CAC payback 6-12 months, NPS >40 healthy, LTV:CAC >3:1

8. CONSTRUCTION:
   Bid-to-win rate 15-25%, change order rate 8-12%,
   avg project value $50K-$500K, safety incident rate tracked

9. LAW FIRMS:
   Billable utilization 31% avg (Clio), target 40%+,
   matter cycle time 60-180 days, collection rate 85-92%

10. ACCOUNTING:
    Client capacity 150-300/firm, deadline compliance 94%+,
    annual retention 88-95%, avg client value $2,500-$8,000/yr

11. FITNESS/WELLNESS:
    Member retention 72% (12-month), class fill rate 65-80%,
    revenue per sq ft $40-$80/mo, avg membership $79-$149/mo

12. INSURANCE:
    Policy retention 84-90%, claims per policy 0.05-0.12,
    cross-sell rate 1.8 policies/customer, referral rate 25%

13. LOGISTICS:
    On-time delivery 92-97%, fleet utilization 78-85%,
    cost per mile $1.80-$2.50, damage rate <1%

14. MANUFACTURING:
    OEE 60-85%, scrap rate 2-5%, order-to-ship 3-10 days,
    inventory turnover 6-12x/year

15. EDUCATION:
    Enrollment conversion 15-30%, course completion 65-80%,
    student LTV $500-$5,000, NPS 40-60
```

---

## 150 MOCK DATASETS — GENERATION FRAMEWORK

### Dataset naming convention:
```
[VERTICAL]-[SIZE]-[HEALTH]-[NUMBER]
Example: HOME-SM-BROKEN-01, REST-MD-FUNCTIONAL-03, ECOM-LG-OPTIMIZED-02
```

### Distribution per vertical (10 datasets each):
```
Per vertical:
  2 × Small + Broken (Foundation Score 15-30)
  2 × Small + Functional (Foundation Score 40-55)
  2 × Medium + Growing (Foundation Score 50-65)
  2 × Medium + Strong (Foundation Score 65-80)
  1 × Large + Optimized (Foundation Score 80-90)
  1 × Disqualified (below minimum thresholds — teaches the system what to reject)
```

This distribution ensures the scoring algorithm is calibrated across the full range of business health — from completely broken to highly optimized — and learns to identify disqualification criteria.

---

## FULLY DETAILED DATASETS — VERTICAL 1: HOME SERVICES (10 of 10)

### HOME-SM-BROKEN-01
```
Company: SoCal Quick Electric (mock)
Location: Riverside, CA | Vertical: Electrical | Size: 8 employees | Revenue: $750K
Foundation Score: 28/100 | Complexity: 22/40

DIMENSION 1 — DIGITAL PRESENCE (score: 5/14)
D01=Yes D02=Wix D03=36mo D04=No D05=6.2s D06=Fail D07=Yes D08=7 D09=No D10=0
D11=0 D12=0 D13=Yes D14=No D15=No D16=No D17=30% D18=40% D19=10%
D20=No D21=No D22=No D23=No D24=No D25=3 D26=8 D27=8 D28=4

DIMENSION 2 — LEAD GENERATION (score: 3/15)
L01=15 L02={google:40%,referral:35%,angi:25%} L03=$142 L04=270min L05=voicemail
L06=2.1% L07=62% L08=24hrs L09=No L10=No L11=None L12=1 L13=20%
L14=No L15=0 L16={phone} L17=48hrs L18=No L19=No L20=5% L21=No L22=18%
L23=15% L24=35%

DIMENSION 3 — ADVERTISING (score: 3/12)
A01=$1,200 A02={google_ads} A03=Yes A04=No A05=4.2 A06=4.8% A07=$14.20
A08=No A09=0 A10=No A11=0 A12={angi} A13=$185 A14=180 A15=No
A16=No A17=Yes A18=No A19=No A20=1.8 A21=1.9% A22=none

DIMENSION 4 — REPUTATION (score: 4/13)
R01=Yes R02=No R03=6 R04=0 R05=23 R06=4.2 R07=1 R08=12% R09=72hrs
R10=Yes R11=8 R12=3.8 R13=No R14={angi} R15=No R16=No R17=55% R18=4

DIMENSION 5 — OPERATIONS (score: 5/16)
O01=12 O02=2 O03=14 O04=No O05=None O06=Text O07=Phone/paper O08=No
O09=No O10=No O11=No O12=None O13=No O14=35 O15=18 O16=12 O17=Maybe
O18="Everything goes through me" O19="Lost a $12K job because no one returned call"
O20=No O21=Yes O22=No O23=Never O24=2 O25=Landline O26=No O27=None O28=0
O29=No O30=No O31=No O32=No

DIMENSION 6 — FINANCIAL (score: 4/15)
F01=$750K F02=Flat F03=25-30% F04=$2,800 F05=No F06=No F07=$94K F08=22%
F09=$1,800 F10=15% F11=QuickBooks F12=Quarterly F13=2 F14=No F15=No
F16=Competitor F17=12 F18=1 F19=$200 F20=$1,200 F21=30%

DIMENSION 7 — PEOPLE (score: 4/15)
P01=8 P02=18 P03=25% P04=1 P05=6 P06=No P07=0 P08=3 P09=55 P10=5
P11=2 P12=1 P13=No P14=No P15=No P16=None P17=No P18=No

BREAK POINTS:
1. Lead response time 4.5 hours — 78% of customers buy from first responder (Invoca)
2. No mobile responsive site — losing ~60% of mobile traffic (Google benchmark)
3. 12 tools, only 2 connected — massive operational friction
4. Zero follow-up system — estimated $8,400/mo in recoverable revenue
5. Owner works 55 hrs/week, business survives 1 day without them

GAP ANALYSIS:
├── Lead response automation: $4,200/mo (20 missed leads × 35% close × $600 avg)
├── Website rebuild: $3,600/mo (mobile traffic recovery + conversion optimization)
├── Follow-up system: $8,400/mo (3-touch sequence on 15 leads × 40% recovery × $1,400)
├── Tool consolidation: $1,800/mo (14 hrs/week admin × $30/hr)
├── Review generation: $2,100/mo (5 additional reviews/mo → ranking boost → organic leads)
└── TOTAL MONTHLY GAP VALUE: $20,100/mo → $241,200/yr

PRICING DERIVATION:
Value created: $241,200/yr
AuraFlow fee (25%): $60,300/yr = $5,025/mo
Recommended: $4,500/mo + $8,000 setup (discounted from value-based maximum)
```

### HOME-SM-BROKEN-02
```
Company: Desert Valley Plumbing (mock)
Location: Phoenix, AZ | Vertical: Plumbing | Size: 5 employees | Revenue: $420K
Foundation Score: 22/100 | Complexity: 16/40

KEY DIFFERENCES FROM HOME-01:
- No website at all (GBP only)
- 100% word-of-mouth leads — zero digital presence
- No ad spend, no CRM, no email
- Google reviews: 9 total (4.6 rating — quality but no volume)
- Owner IS the dispatcher, bookkeeper, and lead technician
- Revenue plateaued for 3 years — can't grow without systems
- Foundation Score even lower but complexity is lower (simpler business)

GAP VALUE: $14,200/mo → AuraFlow: $3,500/mo + $5,000 setup
```

### HOME-SM-FUNCTIONAL-03
```
Company: Bright Spark Electrical (mock)
Location: San Diego, CA | Vertical: Electrical | Size: 12 employees | Revenue: $1.1M
Foundation Score: 48/100 | Complexity: 24/40

KEY CHARACTERISTICS:
- WordPress site, mobile responsive, 2.8s load time
- 30 leads/mo, $118 CPL, 12% conversion rate
- Google Ads active ($2,200/mo) but no conversion tracking
- 45 Google reviews, 4.5 rating, responds to 40%
- Uses ServiceTitan but only for scheduling (not CRM features)
- Owner works 45 hrs/week — better than broken, still too much
- Knows they need help but doesn't know where to start

GAP VALUE: $11,800/mo → AuraFlow: $2,950/mo + $6,000 setup
```

### HOME-SM-FUNCTIONAL-04
```
Company: CoolBreeze HVAC (mock)
Location: Houston, TX | Vertical: HVAC | Size: 10 employees | Revenue: $980K
Foundation Score: 44/100 | Complexity: 22/40

KEY CHARACTERISTICS:
- Squarespace site, decent but no service pages or location pages
- Seasonal revenue variance: summer 2x winter
- 25 leads/mo, response time 45 min (better than avg)
- Google Ads + Angi ($3,100/mo combined), ROAS 2.8x
- 68 reviews, 4.4 rating, 25% response rate
- Booking rate 38% (below 42% ServiceTitan benchmark)
- No email marketing, no review generation system

GAP VALUE: $13,400/mo → AuraFlow: $3,350/mo + $6,500 setup
```

### HOME-MD-GROWING-05
```
Company: RC Generators & Electric (REAL CLIENT)
Location: Southern California | Vertical: Electrical | Size: 8 employees | Revenue: $750K+
Foundation Score: 34/100 | Complexity: 22/40

ACTUAL DATA (from onboarding):
- Access obtained: FB, IG, Meta Ads, Meta Business Suite, Meta Pixel, GBP
- Access needed: Website CMS, Google Ads, GA4, GTM, LSA, CRM, phone, Angi, Yelp
- Smart AI Receptionist: ACTIVE (first agent deployed)
- Response time before AuraFlow: ~4.5 hours
- Response time after receptionist: ~8 seconds
- 45-day execution plan active, $2K/mo ad budget
- This IS your reference dataset — real client, real gaps, real deployment

NOTES: This dataset is partially populated with real data. As deployment
progresses, update with actual performance metrics weekly. This becomes
the gold standard for the Home Services vertical benchmark.
```

### HOME-MD-GROWING-06
```
Company: AllStar Roofing & Exteriors (mock)
Location: Dallas, TX | Vertical: Roofing | Size: 18 employees | Revenue: $2.4M
Foundation Score: 52/100 | Complexity: 28/40

KEY CHARACTERISTICS:
- Custom WordPress site, 14 service pages, blog (1 post/quarter)
- 45 leads/mo, $285 CPL (high for roofing but normal per WebFX)
- Google Ads ($4,500/mo) + Angi ($1,200/mo) + LSA active
- ROAS 4.2x on Google, 2.1x on Angi
- 187 reviews, 4.3 rating, 55% response rate
- Uses Buildertrend for project management
- 3 salespeople, avg close rate 28%
- Revenue growing 18% YoY — needs systems to sustain growth

GAP VALUE: $18,200/mo → AuraFlow: $4,550/mo + $9,000 setup
```

### HOME-MD-STRONG-07
```
Company: ProFlow Plumbing Group (mock)
Location: Charlotte, NC | Vertical: Plumbing | Size: 22 employees | Revenue: $3.2M
Foundation Score: 68/100 | Complexity: 30/40

KEY CHARACTERISTICS:
- Professional site with 12 service pages, 8 location pages
- ServiceTitan fully utilized (scheduling, CRM, reporting)
- 85 leads/mo, $72 CPL, 18% conversion rate
- Google Ads + LSA + Meta ($6,800/mo), ROAS 5.8x
- 312 reviews, 4.7 rating, 88% response rate, review gen system active
- Owner works 35 hrs/week, team operates independently 3+ days
- Needs: predictive analytics, ad optimization AI, expansion support

GAP VALUE: $8,400/mo → AuraFlow: $2,100/mo + $5,000 setup (Phase 2 only)
```

### HOME-MD-STRONG-08
```
Company: Summit Mechanical Services (mock)
Location: Denver, CO | Vertical: HVAC | Size: 28 employees | Revenue: $4.1M
Foundation Score: 72/100 | Complexity: 32/40

KEY CHARACTERISTICS:
- Best-in-class website, full SEO, content marketing active
- Housecall Pro + QuickBooks + Mailchimp integrated
- 120 leads/mo across all channels, $95 CPL
- ROAS 6.1x, attribution tracking in place
- 420 reviews, 4.8 rating, auto-response system
- Revenue per technician: $228K (above ServiceTitan benchmark)
- Needs: AI optimization layer, predictive maintenance scheduling

GAP VALUE: $6,200/mo → AuraFlow: $1,550/mo (Phase 2 optimization only)
```

### HOME-LG-OPTIMIZED-09
```
Company: Patriot Home Services Group (mock)
Location: Atlanta, GA | Vertical: Multi-trade | Size: 45 employees | Revenue: $7.8M
Foundation Score: 82/100 | Complexity: 36/40

KEY CHARACTERISTICS:
- Multi-trade (electrical + plumbing + HVAC under one brand)
- ServiceTitan Enterprise, full integration stack
- 280 leads/mo, $82 CPL, dedicated marketing coordinator
- ROAS 7.2x, multi-touch attribution active
- 680 reviews across 3 GBP locations, 4.7 avg
- Owner works ON business 30 hrs/week, team autonomous
- Phase 2 only: AI co-pilot, predictive analytics, expansion intelligence

GAP VALUE: $4,800/mo → AuraFlow: Enterprise custom pricing
```

### HOME-DISQUALIFIED-10
```
Company: Joe's Handyman (mock)
Location: Anywhere, USA | Vertical: Handyman | Size: 1 (solo) | Revenue: $45K
Foundation Score: 8/100 | Complexity: 10/40

DISQUALIFICATION CRITERIA MET:
- Solo operator with no employees
- Revenue below $250K minimum
- No budget for technology ($0/mo available)
- Not the decision-maker problem — IS the entire business
- Recommended: Zapier free tier + Google Business Profile + Thumbtack

SYSTEM RESPONSE: "AuraFlow works best for businesses with 5+ employees and
established revenue. Here's what we recommend for your stage: [free tool list]"
```

---

## REMAINING 140 DATASETS — GENERATION TEMPLATE

For each of the remaining 14 verticals, generate 10 datasets following this template:

```
DATASET: [VERTICAL]-[SIZE]-[HEALTH]-[##]
Company: [Mock name]
Location: [City, State]
Vertical: [Specific sub-vertical]
Size: [Employee count]
Revenue: [Annual]
Foundation Score: [0-100]
Complexity Score: [10-40]

DIMENSION SCORES:
D1 Digital Presence:    __/14
D2 Lead Generation:     __/15
D3 Advertising:         __/12
D4 Reputation:          __/13
D5 Operations:          __/16
D6 Financial:           __/15
D7 People:              __/15

RAW DATA: {163 data points as JSON}

BREAK POINTS: [Top 5 failure patterns]
GAP ANALYSIS: [Gaps with dollar values]
TOTAL GAP VALUE: $__/mo → $__/yr
AURAFLOW PRICING: $__/mo + $__ setup

BENCHMARK COMPARISON:
vs_industry_median: [above/below by %]
vs_size_band: [percentile]
vs_top_quartile: [gap to reach]
```

### Verticals to generate (10 datasets each):
```
VERTICAL 2:  REST-[01-10]  Restaurant datasets
VERTICAL 3:  AGENCY-[01-10]  Digital agency datasets
VERTICAL 4:  REALTY-[01-10]  Real estate datasets
VERTICAL 5:  ECOM-[01-10]  E-commerce datasets
VERTICAL 6:  HEALTH-[01-10]  Healthcare/dental datasets
VERTICAL 7:  SAAS-[01-10]  SaaS company datasets
VERTICAL 8:  BUILD-[01-10]  Construction datasets
VERTICAL 9:  LAW-[01-10]  Law firm datasets
VERTICAL 10: ACCT-[01-10]  Accounting firm datasets
VERTICAL 11: FIT-[01-10]  Fitness/wellness datasets
VERTICAL 12: INS-[01-10]  Insurance datasets
VERTICAL 13: LOG-[01-10]  Logistics datasets
VERTICAL 14: MFG-[01-10]  Manufacturing datasets
VERTICAL 15: EDU-[01-10]  Education datasets
```

---

## DATA COLLECTION EXECUTION PLAN

### Phase 1: Automated Data Harvesting (Week 1-2)

**Use these tools to collect real benchmark data for all 15 verticals:**

```
TOOL 1: Apify Web Scraper (connected MCP)
├── Scrape Google Business Profile data for 50 businesses per vertical
├── Collect: review count, rating, response rate, photo count, post frequency
├── Target: 750 real GBP profiles across 15 verticals
├── Store in: Supabase industry_benchmarks table
└── Cost: ~$10 in Apify credits

TOOL 2: SE Ranking / Ahrefs API
├── Domain authority for 50 websites per vertical
├── Keyword rankings, organic traffic estimates
├── Page speed scores via Lighthouse API
├── Store in: Supabase scan_history table
└── Cost: Included in SE Ranking subscription

TOOL 3: BuiltWith / Wappalyzer API
├── Technology stack detection for 50 sites per vertical
├── CMS, analytics, pixels, ad platforms, CRM presence
├── Store in: Supabase scan_history.scan_data (JSON)
└── Cost: Free tier sufficient

TOOL 4: Google PageSpeed Insights API (free)
├── Core Web Vitals for 50 sites per vertical
├── Performance score, accessibility, SEO score
├── Mobile vs desktop comparison
└── Cost: Free

TOOL 5: Social Media APIs
├── Instagram Business API: follower count, post frequency, engagement
├── Facebook Graph API: page likes, post reach
├── LinkedIn Company API: follower count, employee count
└── Cost: Free (API access)
```

### Phase 2: Survey-Based Data Collection (Week 3-4)

**For data points that can't be automated (internal operations, financial, people):**

```
METHOD A: Claude-powered research synthesis
├── Use Claude API to analyze industry reports from IBIS World, Statista, BLS
├── Extract median values for each data point per vertical per size band
├── Cross-reference 3+ sources for each benchmark value
├── Document sources for credibility
└── This is how you build benchmarks for internal metrics you can't scan

METHOD B: Partner data (future)
├── As you complete real diagnostics, each one adds to the benchmark database
├── 10 real diagnostics = preliminary benchmarks
├── 50 real diagnostics = statistically significant benchmarks
├── 100 real diagnostics = publishable industry report
└── This is the compounding data moat

METHOD C: Industry association data (free/low cost)
├── SBA Small Business Profiles (by state and industry)
├── Census Bureau SUSB (Statistics of US Businesses)
├── BLS QCEW (Quarterly Census of Employment and Wages)
├── NAR/NRA/ABA reports (industry-specific associations)
└── Trade publication surveys (ServiceTitan, Toast, Clio annual reports)
```

### Phase 3: n8n Automation for Ongoing Collection (Week 5-6)

```
WF-BENCH-01: Weekly Benchmark Refresh
  Trigger: Schedule (Sunday midnight)
  → Pull latest Google Ads CPC data by industry (Google Keyword Planner API)
  → Pull latest review velocity data (GBP API for tracked businesses)
  → Update Supabase industry_benchmarks table
  → Calculate rolling 90-day averages
  → Slack alert if any benchmark shifts >10%

WF-BENCH-02: New Diagnostic → Benchmark Update
  Trigger: New diagnostic_results row in Supabase
  → Extract anonymized data points
  → Update industry_benchmarks rolling averages
  → Recalculate percentiles
  → If sample_size reaches 10 for any vertical: generate benchmark report

WF-BENCH-03: Competitive Intelligence Scan
  Trigger: Monthly
  → For each active client, scan top 5 competitors
  → Compare client scores to competitor scores
  → Generate competitive intelligence brief
  → Store in diagnostic_results.competitor_comparison
```

---

## SUPABASE STORAGE SCHEMA

```sql
-- Industry benchmarks (one row per vertical × size band × data point)
CREATE TABLE industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  size_band TEXT NOT NULL, -- small, medium, large
  data_point_id TEXT NOT NULL, -- D01, L04, A20, etc.
  benchmark_p25 DECIMAL(12,2), -- 25th percentile
  benchmark_median DECIMAL(12,2), -- 50th percentile (median)
  benchmark_p75 DECIMAL(12,2), -- 75th percentile
  benchmark_top10 DECIMAL(12,2), -- 90th percentile (best-in-class)
  sample_size INT DEFAULT 0,
  source TEXT, -- "WebFX 2026", "ServiceTitan 2025", "real_diagnostics"
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, size_band, data_point_id)
);

-- Mock datasets (the 150 training datasets)
CREATE TABLE mock_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id TEXT UNIQUE NOT NULL, -- "HOME-SM-BROKEN-01"
  vertical TEXT NOT NULL,
  size_band TEXT NOT NULL,
  health_level TEXT NOT NULL, -- broken, functional, growing, strong, optimized, disqualified
  company_name TEXT NOT NULL,
  location TEXT,
  employee_count INT,
  revenue DECIMAL(12,2),
  foundation_score INT,
  complexity_score INT,
  dimension_scores JSONB, -- {d1:5, d2:3, d3:3, ...}
  raw_data JSONB NOT NULL, -- all 163 data points
  break_points JSONB,
  gap_analysis JSONB,
  total_gap_value_monthly DECIMAL(10,2),
  suggested_monthly_fee DECIMAL(10,2),
  suggested_setup_fee DECIMAL(10,2),
  is_disqualified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_benchmarks_vertical ON industry_benchmarks(vertical, size_band);
CREATE INDEX idx_mock_vertical ON mock_datasets(vertical);
CREATE INDEX idx_mock_health ON mock_datasets(health_level);
CREATE INDEX idx_mock_score ON mock_datasets(foundation_score);
```

---

## WHAT THIS UNLOCKS

After all 150 datasets are loaded and the scoring algorithm is calibrated:

1. **Any new diagnostic runs through the same engine** — questionnaire answers → 163 data points → 7 dimension scores → Foundation Score → Gap Analysis → Pricing → Report

2. **Every report includes industry comparison** — "Your lead response time of 4.5 hours puts you in the bottom 8% of electrical contractors we've assessed"

3. **The automated pre-scan uses the same benchmarks** — even the free 60-second scan compares against these profiles

4. **As real diagnostics replace mock data**, the benchmarks become proprietary — no competitor can replicate them

5. **At 100 real diagnostics, you publish the Annual SMB Infrastructure Report** — thought leadership that generates inbound leads

This is the data moat. Start collecting.
