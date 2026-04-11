# AuraFlow Data Training — Master Document

**Status:** Complete  
**Date:** 2026-04-11  
**Model:** `foundation_score_v1.json` — MAE 1.28, R² 0.981  
**Repo:** https://github.com/Auraflow26/auraflow-data-training

---

## What This Is

The AuraFlow Diagnostic Engine scores any small-to-medium business on 163 data points across 7 dimensions and produces a **Foundation Score (0–100)**. That score drives the $500–$1,500 diagnostic reports sold by AuraFlow.

This repo contains the full data pipeline that:
1. Scrapes real business data from Google Maps (Apify)
2. Seeds 150 synthetic mock datasets into Supabase
3. Extracts a clean training CSV
4. Trains an XGBoost model to predict the Foundation Score

---

## Architecture

```
Google Maps (Apify)
        ↓
  scan_history (Supabase)
        ↓
  benchmark-aggregator.ts
        ↓
  industry_benchmarks (Supabase)    ←── used by client app


  seed-mock-datasets.ts
        ↓
  mock_datasets (Supabase)
        ↓
  extract-training-data.ts
        ↓
  ml-data/training_data_v1.csv
        ↓
  train-xgboost.py
        ↓
  ml-data/models/foundation_score_v1.json
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
| `mock_datasets` | 150 | Synthetic training datasets with scored raw_data |

---

## Phase 1 — Real Business Data Collection

### Tool
Apify actor: `compass~crawler-google-places`

### What Was Collected

For each business scraped from Google Maps:
- Business name, website URL, location
- Google rating, review count, category
- These feed directly into benchmark calculations (R01, R05, R06, D_PERF, D_SEO, S_IG, S_FB)

### Vertical Coverage

| Vertical | Businesses Scraped |
|---|---|
| home_services | 134 |
| agency | 98 |
| real_estate | 85 |
| logistics | 74 |
| law | 71 |
| education | 65 |
| manufacturing | 65 |
| accounting | 61 |
| healthcare | 62 |
| fitness | 60 |
| saas | 60 |
| construction | 60 |
| insurance | 59 |
| ecommerce | 57 |
| restaurant | 55 |
| **TOTAL** | **~1,040** |

Minimum 50 per vertical — achieved through 3 scraping passes with different queries and locations.

### Benchmark Aggregation

Script: `src/lib/scraping/benchmark-aggregator.ts`

For each vertical, calculates percentile benchmarks across 23 data points:
- **D01** website_exists, **D04** mobile_responsive, **D05** page_load_speed
- **D08** google_analytics, **D11** monthly_leads, **D13** lead_response_time
- **D17** google_ads, **D18** meta_ads, **D20** gbp_claimed
- **D22** google_reviews_count, **D23** google_rating, **D25** review_response_rate
- **D_SEO** seo_score, **D_PERF** performance_score, **D_LCP** lcp, **D_CLS** cls
- **R01** gbp_claimed, **R05** google_reviews_count, **R06** google_rating
- **S_IG** instagram_exists, **S_IG_FOLLOWERS** ig_followers
- **S_FB** facebook_exists, **S_FB_FOLLOWERS** fb_followers

Percentiles stored: `p25`, `median`, `p75`, `top10` per data point per vertical.

---

## Phase 2 — Mock Dataset Generation

### Script
`scripts/seed-mock-datasets.ts`

### What It Generates
150 datasets: **15 verticals × 10 businesses each**

Each dataset contains:
- 163 raw_data fields (the full diagnostic data points)
- Pre-calculated Foundation Score, dimension scores, gap analysis
- Health level classification

### Health Level Distribution (per vertical)
| # | Health Level | Count | FS Range |
|---|---|---|---|
| 1–2 | broken | 2 | 28–43 |
| 3–4 | functional | 2 | 35–58 |
| 5–6 | growing | 2 | 48–72 |
| 7–8 | strong | 2 | 62–85 |
| 9 | optimized (growing label) | 1 | 80–90 |
| 10 | disqualified | 1 | 22–37 |

### Reproducibility
Uses mulberry32 seeded PRNG — same dataset_id always produces identical data. Run `npm run seed` any number of times: idempotent.

### Calibration Results (`npm run calibrate`)
```
Health Level    | Count | Avg FS | In-Range
broken          |    30 |   37.2 | 100%
functional      |    30 |   49.2 | 100%
growing         |    45 |   61.7 | 100%
strong          |    30 |   64.9 | 100%
disqualified    |    15 |   31.0 | 100%

Score drift >2pts:   0 datasets
Out of health range: 0 datasets
✅ PASSED
```

### Vertical Average Gap Values
| Vertical | Avg Gap $/mo |
|---|---|
| construction | $1,863,748 |
| manufacturing | $1,411,009 |
| logistics | $254,979 |
| real_estate | $163,684 |
| law | $104,600 |
| agency | $90,625 |
| accounting | $73,017 |
| education | $72,464 |
| insurance | $71,837 |
| saas | $69,408 |
| fitness | $53,036 |
| restaurant | $50,972 |
| home_services | $49,494 |
| healthcare | $46,727 |
| ecommerce | $44,709 |

---

## Phase 3 — Foundation Score Algorithm

### File
`src/lib/scoring/foundation-score.ts`

### 7 Dimensions + Max Points

| # | Dimension | Max Points |
|---|---|---|
| 1 | Digital Presence | 14 |
| 2 | Lead Generation | 15 |
| 3 | Advertising | 12 |
| 4 | Reputation | 13 |
| 5 | Operations | 16 |
| 6 | Financial | 15 |
| 7 | People | 15 |
| | **Total** | **100** |

### Scoring Tiers
| Score | Tier |
|---|---|
| 0–25 | Critical Infrastructure Gaps |
| 26–50 | Significant Gaps |
| 51–70 | Functional, Inefficient |
| 71–85 | Strong Foundation |
| 86–100 | Optimized |

### Dimension Balance (avg across 150 datasets)
```
digital_presence   ████████████░░░░░░░░ 58%
lead_generation    ██████████░░░░░░░░░░ 51%
advertising        ██████████░░░░░░░░░░ 52%
reputation         ████████████░░░░░░░░ 58%
operations         ██████████░░░░░░░░░░ 48%
financial          █████████░░░░░░░░░░░ 47%
people             ██████████░░░░░░░░░░ 50%
```

---

## Phase 4 — ML Training

### Training Data
- **File:** `ml-data/training_data_v1.csv`
- **Rows:** 150
- **Features:** 163
- **Missing values:** 0 (0.0%)
- **Target:** `target_foundation_score`

### Model
- **Algorithm:** XGBoost Regressor
- **File:** `ml-data/models/foundation_score_v1.json`

### Hyperparameter Tuning
- GridSearchCV: 324 combinations × 5-fold × 3 repeats = 4,860 fits
- Best CV MAE: **1.72 ± 0.31**

### Best Hyperparameters
```json
{
  "learning_rate": 0.1,
  "max_depth": 4,
  "min_child_weight": 10,
  "n_estimators": 300,
  "reg_alpha": 1.0,
  "reg_lambda": 10.0,
  "subsample": 0.8,
  "colsample_bytree": 0.6
}
```

### Test Set Performance (23 held-out samples)
| Metric | Value |
|---|---|
| MAE | **1.28 points** |
| RMSE | **2.05 points** |
| R-squared | **0.981** |
| Max error | 5.61 points |
| Tier accuracy | **22/23 (96%)** |
| Out-of-bounds predictions | 0 |

### Top 20 Features by Gain
| Rank | Feature | Gain |
|---|---|---|
| 1 | f_can_handle_2x_volume | 2915.2 |
| 2 | f_profit_margin_range | 2248.2 |
| 3 | f_scheduling_dispatch_system | 2178.2 |
| 4 | f_monthly_lead_volume ⚑ | 544.6 |
| 5 | f_google_reviews_count ⚑ | 365.1 |
| 6 | f_lead_response_time_min ⚑ | 139.7 |
| 7 | f_total_employees | 84.6 |
| 8 | f_google_rating ⚑ | 41.4 |
| 9 | f_after_hours_capture_method ⚑ | 36.9 |
| 10 | f_owner_hours_in_business | 35.1 |
| 11 | f_team_autonomous_days | 29.4 |
| 12 | f_owner_admin_hrs_week ⚑ | 26.1 |
| 13 | f_meta_ads_roas | 25.2 |
| 14 | f_can_identify_least_profitable | 23.9 |
| 15 | f_crm_system | 22.2 |
| 16 | f_version_control_for_docs | 21.6 |
| 17 | f_contact_form_exists | 20.6 |
| 18 | f_click_to_call_enabled | 13.4 |
| 19 | f_invoicing_automated | 11.9 |
| 20 | f_employee_satisfaction | 8.4 |

⚑ = Critical feature (flagged in scoring algorithm)

### Data Science Audit (4 Pillars)
| Pillar | Status |
|---|---|
| Leakage prevention | PASS — health_level, dataset_id, vertical excluded from features |
| Vectorization | PASS — Array.map/reduce, no element loops |
| Bias check | PASS — all 15 verticals represented, all 6 health levels |
| Reproducibility | PASS — seed=42, mulberry32 PRNG, deterministic CSV |

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
│   ├── seed-mock-datasets.ts              ← Generate + insert 150 mock datasets
│   ├── calibrate-scoring.ts               ← Validate scoring against mock data
│   ├── run-benchmark-scrape.ts            ← Master Apify scraper (all 15 verticals)
│   ├── topup-verticals.ts                 ← Top-up verticals under 50
│   └── topup-final.ts                     ← Final top-up pass (fitness/insurance/mfg)
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
│   ├── training_data_v1.csv               ← 150 rows × 163 features
│   ├── models/
│   │   ├── foundation_score_v1.json       ← Trained XGBoost model
│   │   └── foundation_score_v1_metadata.json  ← Params, metrics, feature importances
│   └── splits/
│       └── split_v1.json                  ← Train/test indices for reproducibility
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
| `npm run seed` | Generate + insert 150 mock datasets into Supabase |
| `npm run calibrate` | Re-score all 150 datasets, validate health ranges |
| `npm run scrape` | Run Apify scraper for all 15 verticals |
| `npm run scrape -- --vertical home_services` | Scrape one vertical only |
| `npm run scrape -- --dry-run` | Preview without calling APIs |

### Python Pipeline

```bash
# Extract training CSV from Supabase
export $(grep -v '^#' .env.local | xargs)
npx tsx src/scripts/ml-prep/extract-training-data.ts

# Train model
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

To push updates:
```bash
# Set up credentials (one time)
/opt/homebrew/bin/brew install gh
/opt/homebrew/bin/gh auth login

# Push
git add -A
git commit -m "your message"
git push origin main
```

---

## Next Steps (v2)

1. **Social media data** — Re-run scraper without `--skip-social` to populate Instagram/Facebook benchmarks
2. **Website structure data** — Add Cheerio scraper for boolean structural checks (contact form, schema markup, etc.)
3. **Expand mock datasets** — Move from 150 to 500+ as more real data comes in
4. **Retrain model** — After social + structure data collected, retrain with full 163 features populated
5. **Serve model** — Expose `foundation_score_v1.json` via API endpoint for real-time scoring during client onboarding
