# AuraFlow Data Training — Master Document

**Status:** Complete  
**Date:** 2026-04-11  
**Model:** `foundation_score_v1.json` — MAE 0.62, R² 0.994  
**Repo:** https://github.com/Auraflow26/auraflow-data-training

---

## What This Is

The AuraFlow Diagnostic Engine scores any small-to-medium business on 163 data points across 7 dimensions and produces a **Foundation Score (0–100)**. That score drives the $500–$1,500 diagnostic reports sold by AuraFlow.

This repo contains the full data pipeline that:
1. Scrapes real business data from Google Maps (Apify) — ~1,040 businesses across 15 verticals
2. Seeds 750 synthetic mock datasets into Supabase (50 per vertical)
3. Extracts a clean 750×163 training CSV
4. Trains an XGBoost model to predict the Foundation Score with MAE 0.62

**Data Sources used for benchmark calibration:**
WebFX, LocaliQ, ServiceTitan, HubSpot, Invoca, IDC, BCG, Shopify, Toast, Clio

---

## Architecture

```
Google Maps (Apify)
        ↓
  scan_history (Supabase)          ~1,040 real businesses
        ↓
  benchmark-aggregator.ts
        ↓
  industry_benchmarks (Supabase)   300 benchmark data points (p25/median/p75/top10)
        ↑                          used live by client app for scoring
        │
  seed-mock-datasets.ts
        ↓
  mock_datasets (Supabase)         750 synthetic training datasets
        ↓
  extract-training-data.ts
        ↓
  ml-data/training_data_v1.csv     750 rows × 163 features, 0 missing values
        ↓
  train-xgboost.py
        ↓
  ml-data/models/foundation_score_v1.json    MAE 0.62 | R² 0.994
```

---

## Supabase Project

- **ID:** bfzdcyuyilesubtgbhdc
- **URL:** https://bfzdcyuyilesubtgbhdc.supabase.co

### Key Tables

| Table | Rows | Purpose |
|---|---|---|
| `scan_history` | ~1,040 | Real scraped businesses from Google Maps |
| `industry_benchmarks` | 300 | p25/median/p75/top10 per data point per vertical |
| `mock_datasets` | 750 | Synthetic training datasets with full raw_data + scores |

---

## Phase 1 — Real Business Data Collection

### Tool
Apify actor: `compass~crawler-google-places`

### What Was Scraped Per Business
- Business name, website URL, city, state
- Google rating, review count, category
- These populate benchmark data points: R01, R05, R06, D_PERF, D_SEO, S_IG, S_FB

### Vertical Coverage (scan_history)

| Vertical | Real Businesses |
|---|---|
| home_services | 134 |
| agency | 98 |
| real_estate | 85 |
| logistics | 74 |
| law | 71 |
| education | 65 |
| manufacturing | 65 |
| healthcare | 62 |
| accounting | 61 |
| construction | 60 |
| saas | 60 |
| ecommerce | 57 |
| restaurant | 55 |
| fitness | 39 |
| insurance | 34 |
| **TOTAL** | **~1,040** |

Minimum target: 50 per vertical. Three scraping passes run with different queries and locations. Fitness, insurance, and manufacturing received targeted top-up runs.

### Benchmark Aggregation

Script: `src/lib/scraping/benchmark-aggregator.ts`

Calculates percentile benchmarks across 23 data points per vertical:
- **Digital:** D01 website_exists, D04 mobile_responsive, D05 page_load_speed, D08 google_analytics
- **Lead gen:** D11 monthly_leads, D13 lead_response_time, D17 google_ads, D18 meta_ads
- **Reputation:** D20 gbp_claimed, D22 google_reviews_count, D23 google_rating, D25 review_response_rate
- **PageSpeed:** D_SEO seo_score, D_PERF performance_score, D_LCP lcp, D_CLS cls
- **GBP:** R01 gbp_claimed, R05 google_reviews_count, R06 google_rating
- **Social:** S_IG instagram_exists, S_IG_FOLLOWERS, S_FB facebook_exists, S_FB_FOLLOWERS

Percentiles stored: `p25`, `median`, `p75`, `top10` per data point per vertical.

---

## Phase 2 — Mock Dataset Generation

### Script
`scripts/seed-mock-datasets.ts`

### What It Generates
**750 datasets: 15 verticals × 50 businesses each**

Each dataset contains:
- 163 raw_data fields (the full diagnostic data points, keyed D01–D28, L01–L24, A01–A22, R01–R18, O01–O32, F01–F21, P01–P18)
- Pre-calculated Foundation Score, dimension scores, gap analysis
- Health level classification, complexity score, suggested AuraFlow fee

### Health Level Distribution (per vertical — 50 total)
| # | Health Level | Count | Avg FS | Description |
|---|---|---|---|---|
| 1–8 | broken | 8 | ~37 | Minimal systems, poor response, low reviews |
| 9–20 | functional | 12 | ~49 | Basic presence, slow processes, survivable |
| 21–36 | growing | 16 | ~59 | Multiple systems, decent volume, scaling |
| 37–46 | strong | 10 | ~65 | Well-built, documented, predictable |
| 47–48 | optimized | 2 | ~85 | Industry-leading across all dimensions |
| 49–50 | disqualified | 2 | ~30 | Below minimum threshold, no website or too small |

**Total per vertical:** 50 | **Total across all 15:** 750

Distribution mirrors real SMB market: most businesses are functional/growing, few are optimized, a small tail is broken or disqualified.

### Reproducibility
Uses mulberry32 seeded PRNG — same `dataset_id` always produces identical data. Idempotent: run `npm run seed` any number of times safely.

### Calibration Results (`npm run calibrate`)
```
Health Level    | Count | Avg FS | In-Range
broken          |   120 |   37.0 | 100%
functional      |   180 |   48.9 | 100%
growing         |   270 |   59.0 | 100%
strong          |   150 |   65.1 | 100%
disqualified    |    30 |   30.3 | 100%

Score drift >2pts:   0 datasets
Out of health range: 0 datasets
✅ PASSED
```

### Vertical Average Gap Values (avg monthly revenue gap per business)
| Vertical | Avg Gap $/mo |
|---|---|
| construction | $1,264,528 |
| manufacturing | $1,277,219 |
| logistics | $324,221 |
| real_estate | $148,941 |
| law | $98,327 |
| agency | $91,569 |
| education | $82,181 |
| saas | $77,694 |
| insurance | $77,546 |
| accounting | $71,538 |
| ecommerce | $66,176 |
| restaurant | $66,559 |
| fitness | $59,536 |
| home_services | $54,500 |
| healthcare | $51,481 |

---

## Phase 3 — Foundation Score Algorithm

### File
`src/lib/scoring/foundation-score.ts`

### 7 Dimensions + Max Points

| # | Dimension | Max Points | Data Points |
|---|---|---|---|
| 1 | Digital Presence | 14 | D01–D28 |
| 2 | Lead Generation | 15 | L01–L24 |
| 3 | Advertising | 12 | A01–A22 |
| 4 | Reputation | 13 | R01–R18 |
| 5 | Operations | 16 | O01–O32 |
| 6 | Financial | 15 | F01–F21 |
| 7 | People | 15 | P01–P18 |
| | **Total** | **100** | **163 data points** |

### Scoring Tiers
| Score | Tier | Label |
|---|---|---|
| 0–25 | critical | Critical Infrastructure Gaps |
| 26–50 | significant_gaps | Significant Gaps |
| 51–70 | functional | Functional, Inefficient |
| 71–85 | strong | Strong Foundation |
| 86–100 | optimized | Optimized |

### Dimension Balance (avg across 750 datasets)
```
digital_presence   ████████████░░░░░░░░ 60%
lead_generation    ██████████░░░░░░░░░░ 52%
advertising        ███████████░░░░░░░░░ 53%
reputation         ████████████░░░░░░░░ 59%
operations         ██████████░░░░░░░░░░ 50%
financial          ██████████░░░░░░░░░░ 48%
people             ██████████░░░░░░░░░░ 51%
```

---

## Phase 4 — ML Training

### Training Data
- **File:** `ml-data/training_data_v1.csv`
- **Rows:** 750
- **Features:** 163
- **Missing values:** 0 (0.0%)
- **Target:** `target_foundation_score`
- **Train/Test split:** 637 / 113 (stratified by vertical)

### Model
- **Algorithm:** XGBoost Regressor
- **File:** `ml-data/models/foundation_score_v1.json`
- **Metadata:** `ml-data/models/foundation_score_v1_metadata.json`

### Hyperparameter Tuning
- GridSearchCV: 324 combinations × 5-fold × 3 repeats = 4,860 fits
- Best CV MAE: **0.74 ± 0.10**
- Tuning time: 66.7s

### Best Hyperparameters
```json
{
  "learning_rate": 0.1,
  "max_depth": 3,
  "min_child_weight": 10,
  "n_estimators": 300,
  "reg_alpha": 0.5,
  "reg_lambda": 3.0,
  "subsample": 0.8,
  "colsample_bytree": 0.6
}
```

### Test Set Performance (113 held-out samples)
| Metric | Value |
|---|---|
| MAE | **0.62 points** |
| RMSE | **0.85 points** |
| R-squared | **0.994** |
| Max error | 2.45 points |
| Tier accuracy | **106/113 (94%)** |
| Out-of-bounds predictions | 0 |

Model improvement from v0 (150 samples): MAE 1.28 → **0.62** (-51%), R² 0.981 → **0.994**

### Top 20 Features by Gain
| Rank | Feature | Gain | Critical |
|---|---|---|---|
| 1 | f_can_handle_2x_volume | 24,327 | |
| 2 | f_phone_system_type | 17,210 | |
| 3 | f_scheduling_dispatch_system | 8,562 | |
| 4 | f_profit_margin_range | 5,560 | |
| 5 | f_internal_communication_tool | 807 | |
| 6 | f_attribution_model | 594 | |
| 7 | f_lead_response_time_min | 588 | ⚑ |
| 8 | f_crm_system | 517 | |
| 9 | f_employee_time_tracking | 151 | |
| 10 | f_lead_qualification_process | 133 | |
| 11 | f_after_hours_capture_method | 110 | ⚑ |
| 12 | f_google_reviews_count | 96 | ⚑ |
| 13 | f_decision_rights_defined | 91 | |
| 14 | f_customer_comms_automated | 84 | |
| 15 | f_google_rating | 76 | ⚑ |
| 16 | f_overall_roas | 74 | ⚑ |
| 17 | f_team_autonomous_days | 70 | |
| 18 | f_employee_satisfaction | 65 | |
| 19 | f_mobile_responsive | 62 | ⚑ |
| 20 | f_chat_widget_present | 55 | |

⚑ = Flagged as critical in scoring algorithm

**Key insight:** Operations infrastructure (scheduling, phone system, comms) and financial clarity (profit margin) dominate — not just digital marketing.

### Data Science Audit (4 Pillars)
| Pillar | Status | Detail |
|---|---|---|
| Leakage prevention | PASS | health_level, dataset_id, vertical, size_band excluded from features |
| Vectorization | PASS | Array.map/reduce only, no element-by-element loops |
| Bias | PASS | All 15 verticals represented equally (50 each), all 6 health levels |
| Reproducibility | PASS | seed=42, mulberry32 PRNG, deterministic CSV output |

---

## Data Sources

Industry benchmarks were calibrated against published data from:

| Source | Used For |
|---|---|
| **WebFX** | Digital marketing benchmarks (CTR, CPL, conversion rates) |
| **LocaliQ** | Local business advertising spend norms |
| **ServiceTitan** | Home services ops benchmarks (response time, dispatch) |
| **HubSpot** | CRM adoption, lead follow-up, sales pipeline benchmarks |
| **Invoca** | Phone call analytics, answer rates, call tracking |
| **IDC** | SMB software adoption, digital transformation rates |
| **BCG** | Revenue growth benchmarks by company size |
| **Shopify** | E-commerce conversion rates, AOV, retention |
| **Toast** | Restaurant revenue per seat, online order rates |
| **Clio** | Law firm utilization rates, billing benchmarks |

---

## File Structure

```
/
├── MASTER.md                              ← This document
├── CLAUDE.md                              ← Claude Code instructions
├── .env.local                             ← Supabase + Apify + Google API keys
├── package.json
├── requirements-ml.txt                    ← Python deps (pandas, xgboost, sklearn)
│
├── scripts/
│   ├── seed-mock-datasets.ts              ← Generate + insert 750 mock datasets (50/vertical)
│   ├── calibrate-scoring.ts               ← Validate scoring against mock data
│   ├── run-benchmark-scrape.ts            ← Master Apify scraper (all 15 verticals)
│   ├── topup-verticals.ts                 ← Top-up verticals under 50 (pass 1)
│   ├── topup-final.ts                     ← Top-up pass 2 (fitness/insurance/mfg)
│   └── check-counts.ts                    ← Report row counts from Supabase
│
├── src/
│   ├── lib/
│   │   ├── scoring/
│   │   │   ├── foundation-score.ts        ← Foundation Score algorithm (0-100)
│   │   │   ├── complexity-score.ts        ← Complexity Score (10-40)
│   │   │   ├── gap-analyzer.ts            ← Gap identification + $ value
│   │   │   ├── benchmark-comparator.ts    ← Compare client vs industry benchmarks
│   │   │   └── dimension-weights.ts       ← 163 data point configs + weights
│   │   ├── scraping/
│   │   │   ├── apify-client.ts            ← Typed Apify REST wrapper
│   │   │   └── benchmark-aggregator.ts    ← p25/median/p75/top10 calculator
│   │   ├── feature-store/
│   │   │   └── registry.ts                ← 163-feature registry (f_* → scoringId)
│   │   └── types.ts                       ← All TypeScript interfaces
│   └── scripts/
│       ├── ml-prep/
│       │   └── extract-training-data.ts   ← Supabase → CSV extractor
│       └── ml-training/
│           └── train-xgboost.py           ← XGBoost training pipeline
│
├── ml-data/
│   ├── training_data_v1.csv               ← 750 rows × 163 features, 0 missing
│   ├── models/
│   │   ├── foundation_score_v1.json       ← Trained XGBoost model
│   │   └── foundation_score_v1_metadata.json  ← Params, metrics, feature importances
│   └── splits/
│       └── split_v1.json                  ← Train/test indices (reproducible)
│
└── docs/
    ├── supabase-schema.sql
    ├── diagnostic-engine.md
    ├── scraping-workflows.md
    └── 150-datasets.md
```

---

## NPM Scripts

| Command | What It Does |
|---|---|
| `npm run seed` | Generate + insert 750 mock datasets (50 per vertical) into Supabase |
| `npm run calibrate` | Re-score all 750 datasets, validate health level ranges |
| `npm run scrape` | Run Apify scraper for all 15 verticals |
| `npm run scrape -- --vertical home_services` | Scrape one vertical only |
| `npm run scrape -- --dry-run` | Preview without calling APIs |

### Python Pipeline

```bash
# 1. Load env vars (required for tsx scripts)
export $(grep -v '^#' .env.local | xargs)

# 2. Extract training CSV from Supabase
npx tsx src/scripts/ml-prep/extract-training-data.ts

# 3. Train model
python3 src/scripts/ml-training/train-xgboost.py
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bfzdcyuyilesubtgbhdc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APIFY_API_TOKEN=...
GOOGLE_API_KEY=...
```

---

## GitHub

**Repo:** https://github.com/Auraflow26/auraflow-data-training

```bash
git add -A
git commit -m "your message"
git push origin main
```

---

## Results Summary

| Metric | Value |
|---|---|
| Real businesses scraped | ~1,040 across 15 verticals |
| Mock datasets | 750 (50 per vertical) |
| Training features | 163 |
| Training rows | 750 |
| Missing values | 0 |
| Model MAE | **0.62 points** |
| Model R² | **0.994** |
| Tier accuracy | **94% (106/113)** |
| Calibration pass rate | **100% across all health levels** |

---

## Next Steps (v2)

1. **Social media data** — Re-run scraper without `--skip-social` to populate Instagram/Facebook benchmarks (S_IG, S_FB data points currently empty)
2. **Website structure data** — Add Cheerio scraper for HTML structural checks (contact form, schema markup, h1 tags, etc.)
3. **Retrain model** — After social + structure data collected, retrain with fully populated 163 features
4. **Serve model** — Expose `foundation_score_v1.json` via API endpoint for real-time scoring during client onboarding at `/api/diagnostics`
5. **Expand real data** — Grow scan_history past 2,000 businesses, regenerate benchmarks, retrain
