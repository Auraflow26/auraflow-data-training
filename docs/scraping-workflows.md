# AuraFlow — What's Next: Complete Execution Plan
## Data Scraping Workflows + Apify Integration + n8n Automation
### Everything needed to build the 150-dataset diagnostic engine with real data

---

## THE PRIORITY STACK (What to do in what order)

```
WEEK 1 — UNBLOCK REVENUE (Do this FIRST, before any scraping)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Day 1: Remove website password (30 seconds in Framer)
□ Day 1: Fix site title typo ("Powerd" → "Powered")
□ Day 1: Rotate Pinecone + Notion API keys (5 min)
□ Day 1: Update /about page with new titles
□ Day 2: Build WF-DIAG-01 in n8n (diagnostic intake webhook)
□ Day 2: Create 5 critical Slack channels
□ Day 3: Set up Calendly discovery call page
□ Day 3: Ario makes first 5 outbound calls

WEEK 2 — START SCRAPING + CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Run Apify scrapers (this document) — collect real data
□ Produce V3 hero video (HeyGen)
□ Generate 6 agent FLUX portraits
□ Record first 7 agent content pieces
□ Set up @auraflowusa on Instagram + LinkedIn

WEEK 3 — DATA ENGINE + ADS
━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Insert scraped data into Supabase industry_benchmarks
□ Build scoring algorithm workflow (WF-DIAG-SCORE)
□ Run 5 test scans on real businesses
□ Launch Google Ads ($500 budget)
□ Launch Meta retargeting

WEEK 4 — CLIENT APP + SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Start client app build (Claude Code, 2-week sprint)
□ Complete RC Generators deployment (remaining access + agents)
□ Run first real paid diagnostic for a new prospect
□ Ario continues outbound (5 calls/day)
```

---

## PART 1: APIFY SCRAPING ARCHITECTURE

### What we're scraping and why:

```
TARGET: 750 real business profiles across 15 verticals (50 per vertical)
PURPOSE: Build the industry_benchmarks table with real-world data
OUTPUT: Benchmark values for ~80 of the 163 data points (the automated ones)
STORAGE: Supabase industry_benchmarks table
COST: ~$10-25 in Apify credits total
TIME: 4-6 hours of scraping (mostly automated, runs in parallel)
```

### Apify Actors to use:

```
ACTOR 1: Google Maps Scraper (apify/google-maps-scraper)
├── Purpose: Scrape Google Business Profile data for businesses
├── Data collected: Name, address, phone, website, rating, review count,
│   review response rate, categories, photos count, hours, GBP posts
├── Runs: 15 times (once per vertical, 50 results each)
├── Cost: ~$0.005 per result = ~$3.75 total
└── Output: 750 GBP profiles

ACTOR 2: Website Performance Scraper (custom or apify/lighthouse-scraper)
├── Purpose: Run Lighthouse audits on extracted website URLs
├── Data collected: Performance score, LCP, FID, CLS, mobile score,
│   SEO score, accessibility score, page load time
├── Runs: 750 URLs (batch processing)
├── Cost: ~$5
└── Output: Core Web Vitals for 750 sites

ACTOR 3: Web Scraper / Cheerio Scraper (apify/cheerio-scraper)
├── Purpose: Crawl each website for structural data
├── Data collected: Has blog (y/n), service pages count, contact form (y/n),
│   phone visible (y/n), chat widget (y/n), meta descriptions present,
│   H1 structure, image alt tags, schema markup, analytics installed
├── Runs: 750 URLs
├── Cost: ~$3
└── Output: Website structure analysis for 750 sites

ACTOR 4: RAG Web Browser (apify/rag-web-browser)
├── Purpose: Deep-read specific pages for content analysis
├── Data collected: About page content, service descriptions, blog post
│   dates and frequency, team page information
├── Runs: Selective (100-200 key pages)
├── Cost: ~$2
└── Output: Content quality analysis

ACTOR 5: Social Media Scrapers
├── Instagram: apify/instagram-profile-scraper
│   Data: followers, post count, engagement rate, last post date
├── Facebook: apify/facebook-pages-scraper
│   Data: likes, followers, post frequency
├── Runs: 750 profiles × 2 platforms
├── Cost: ~$5
└── Output: Social presence data
```

---

## PART 2: THE 15 SCRAPING RUNS (Apify Google Maps Queries)

### Run these 15 searches in the Google Maps Scraper:

```
RUN 01 — HOME SERVICES:
  Search: "electrician" + "plumber" + "HVAC contractor"
  Location: "Southern California" + "Phoenix, AZ" + "Dallas, TX"
  Max results: 50
  Filter: 10+ reviews, has website

RUN 02 — RESTAURANTS:
  Search: "restaurant" + "cafe" + "bar and grill"
  Location: "Los Angeles, CA" + "New York, NY" + "Chicago, IL"
  Max results: 50
  Filter: 20+ reviews, has website

RUN 03 — DIGITAL AGENCIES:
  Search: "marketing agency" + "digital agency" + "web design agency"
  Location: "United States"
  Max results: 50
  Filter: 5+ reviews, has website

RUN 04 — REAL ESTATE:
  Search: "real estate agent" + "realtor" + "real estate broker"
  Location: "Southern California" + "Miami, FL" + "Austin, TX"
  Max results: 50
  Filter: 10+ reviews, has website

RUN 05 — E-COMMERCE:
  Search: "online store" + "ecommerce business"
  Location: "United States"
  Max results: 50
  NOTE: E-commerce is harder to scrape from Maps — supplement with
  Shopify store directory scraping or manual curation

RUN 06 — HEALTHCARE:
  Search: "dentist" + "dental practice" + "medical clinic"
  Location: "Southern California" + "Houston, TX"
  Max results: 50
  Filter: 20+ reviews

RUN 07 — SAAS:
  Search: "software company" + "tech startup" + "SaaS company"
  Location: "San Francisco, CA" + "New York, NY" + "Austin, TX"
  Max results: 50
  NOTE: SaaS companies are hard to find on Maps — supplement with
  Crunchbase/ProductHunt scraping

RUN 08 — CONSTRUCTION:
  Search: "general contractor" + "construction company" + "builder"
  Location: "Southern California" + "Atlanta, GA" + "Denver, CO"
  Max results: 50
  Filter: 10+ reviews

RUN 09 — LAW FIRMS:
  Search: "law firm" + "attorney" + "lawyer"
  Location: "Southern California" + "New York, NY" + "Chicago, IL"
  Max results: 50
  Filter: 10+ reviews

RUN 10 — ACCOUNTING:
  Search: "accounting firm" + "CPA" + "bookkeeper"
  Location: "Southern California" + "Dallas, TX" + "Seattle, WA"
  Max results: 50
  Filter: 5+ reviews

RUN 11 — FITNESS/WELLNESS:
  Search: "gym" + "yoga studio" + "fitness center" + "pilates"
  Location: "Southern California" + "Miami, FL" + "Portland, OR"
  Max results: 50
  Filter: 20+ reviews

RUN 12 — INSURANCE:
  Search: "insurance agency" + "insurance broker"
  Location: "Southern California" + "Phoenix, AZ" + "Charlotte, NC"
  Max results: 50
  Filter: 10+ reviews

RUN 13 — LOGISTICS:
  Search: "trucking company" + "freight broker" + "logistics company"
  Location: "United States"
  Max results: 50
  Filter: 5+ reviews

RUN 14 — MANUFACTURING:
  Search: "manufacturing company" + "machine shop" + "fabrication"
  Location: "United States"
  Max results: 50
  Filter: 5+ reviews

RUN 15 — EDUCATION:
  Search: "tutoring center" + "learning center" + "driving school" + "music school"
  Location: "Southern California" + "New York, NY"
  Max results: 50
  Filter: 10+ reviews
```

---

## PART 3: N8N WORKFLOWS FOR DATA COLLECTION

### WF-SCRAPE-01: Google Maps Data Collection Pipeline

```
WORKFLOW: WF-SCRAPE-01
NAME: Industry Data Collection — Google Maps
TRIGGER: Manual (run once per vertical)

NODES:
1. Manual Trigger
   └── Input: vertical_name, search_query, location, max_results

2. HTTP Request — Apify API
   └── POST https://api.apify.com/v2/acts/apify~google-maps-scraper/runs
   └── Headers: Authorization: Bearer YOUR_APIFY_TOKEN
   └── Body:
       {
         "queries": "{{$json.search_query}}",
         "maxCrawledPlaces": {{$json.max_results}},
         "language": "en",
         "maxReviews": 0,
         "includeWebResults": false,
         "includeHistogram": false,
         "includeOpeningHours": true,
         "includePeopleAlsoSearch": false,
         "includeImages": false,
         "exportPlaceUrls": false,
         "additionalInfo": false,
         "maxImages": 0,
         "maxAutoZoom": 10,
         "searchStringsArray": ["{{$json.search_query}}"],
         "locationQuery": "{{$json.location}}",
         "zoom": 12,
         "maxCrawledPlacesPerSearch": {{$json.max_results}},
         "onlyDataFromSearchPage": false
       }

3. Wait (60 seconds — let Apify finish)

4. HTTP Request — Get Results
   └── GET https://api.apify.com/v2/acts/apify~google-maps-scraper/runs/last/dataset/items
   └── Headers: Authorization: Bearer YOUR_APIFY_TOKEN

5. Code Node — Transform Data
   └── Extract and normalize:
       {
         business_name: item.title,
         vertical: input.vertical_name,
         location: item.city + ", " + item.state,
         website_url: item.website,
         phone: item.phone,
         google_rating: item.totalScore,
         google_review_count: item.reviewsCount,
         google_categories: item.categoryName,
         gbp_photos_count: item.imageCount || 0,
         has_website: !!item.website,
         latitude: item.location?.lat,
         longitude: item.location?.lng,
         scraped_at: new Date().toISOString()
       }

6. Split In Batches (50 items per batch)

7. Supabase — Insert to scan_history
   └── Table: scan_history
   └── Operation: Insert
   └── Map fields from transformed data

8. Slack Notification
   └── Channel: #diagnostics
   └── Message: "Scraped {count} {vertical} businesses from Google Maps"
```

### WF-SCRAPE-02: Website Analysis Pipeline

```
WORKFLOW: WF-SCRAPE-02
NAME: Website Analysis — Lighthouse + Structure
TRIGGER: Runs after WF-SCRAPE-01 completes
INPUT: List of website URLs from scan_history table

NODES:
1. Supabase — Get URLs
   └── SELECT website_url FROM scan_history
       WHERE vertical = '{{vertical}}' AND website_url IS NOT NULL

2. Split In Batches (10 at a time — rate limiting)

3. HTTP Request — Google PageSpeed Insights API
   └── GET https://www.googleapis.com/pagespeedonline/v5/runPagespeedTest
   └── Params: url={{item.website_url}}&category=performance&category=seo&category=accessibility&strategy=mobile
   └── NOTE: Free API, no key needed for basic usage

4. Code Node — Extract Lighthouse Scores
   └── {
         url: item.website_url,
         performance_score: result.lighthouseResult.categories.performance.score * 100,
         seo_score: result.lighthouseResult.categories.seo.score * 100,
         accessibility_score: result.lighthouseResult.categories.accessibility.score * 100,
         lcp: result.lighthouseResult.audits['largest-contentful-paint'].numericValue / 1000,
         fid: result.lighthouseResult.audits['max-potential-fid']?.numericValue || 0,
         cls: result.lighthouseResult.audits['cumulative-layout-shift'].numericValue,
         page_load_ms: result.lighthouseResult.audits['interactive'].numericValue,
         mobile_friendly: result.lighthouseResult.audits['viewport']?.score === 1
       }

5. Wait (2 seconds — respect rate limits)

6. HTTP Request — Crawl Website Structure
   └── GET {{item.website_url}}
   └── Response: Full HTML

7. HTML Extract Node — Structural Analysis
   └── Extraction rules:
       - has_contact_form: "form" element count > 0
       - has_chat_widget: check for common chat selectors (intercom, drift, tawk, tidio, zendesk)
       - phone_visible: regex match phone number in first 2000 chars
       - has_blog: check for /blog, /news, /articles links
       - service_pages_count: count internal links with /service or service-related paths
       - has_schema: check for application/ld+json scripts
       - has_analytics: check for gtag, ga, google-analytics scripts
       - has_facebook_pixel: check for fbq, facebook pixel scripts
       - meta_description_exists: check <meta name="description">
       - h1_count: count h1 elements
       - ssl_active: url starts with https

8. Code Node — Combine Lighthouse + Structure Data

9. Supabase — Update scan_history
   └── UPDATE scan_history SET scan_data = combined_data
       WHERE website_url = {{item.website_url}}

10. Slack Notification
    └── "Website analysis complete: {count} sites analyzed for {vertical}"
```

### WF-SCRAPE-03: Social Media Presence Check

```
WORKFLOW: WF-SCRAPE-03
NAME: Social Media Presence Scan
TRIGGER: Runs after WF-SCRAPE-01
INPUT: Business names from scan_history

NODES:
1. Supabase — Get business names
   └── SELECT business_name, website_url FROM scan_history
       WHERE vertical = '{{vertical}}'

2. Split In Batches (10 at a time)

3. HTTP Request — Apify Instagram Profile Scraper
   └── POST https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs
   └── Body: { "usernames": ["{{derived_instagram_handle}}"] }
   └── NOTE: Derive IG handle from business name or scrape from website

4. Code Node — Check Facebook Page
   └── Search Facebook for business name
   └── Extract: page_likes, followers, last_post_date

5. Code Node — Compile Social Data
   └── {
         has_instagram: boolean,
         ig_followers: number,
         ig_posts: number,
         ig_last_post_days_ago: number,
         has_facebook: boolean,
         fb_followers: number,
         fb_last_post_days_ago: number,
         has_linkedin: boolean
       }

6. Supabase — Update scan_history with social data

7. Slack Notification
```

### WF-SCRAPE-04: Benchmark Aggregation

```
WORKFLOW: WF-SCRAPE-04
NAME: Benchmark Calculator
TRIGGER: Runs after all scraping is complete
PURPOSE: Calculate percentiles from scraped data → populate industry_benchmarks

NODES:
1. Supabase — Get all scan data for a vertical
   └── SELECT * FROM scan_history WHERE vertical = '{{vertical}}'

2. Code Node — Calculate Statistics
   └── For each data point:
       - Sort values
       - Calculate p25, median, p75, p90
       - Count sample size
       - Example:
         const ratings = items.map(i => i.scan_data.google_rating).filter(Boolean).sort()
         const p25 = ratings[Math.floor(ratings.length * 0.25)]
         const median = ratings[Math.floor(ratings.length * 0.5)]
         const p75 = ratings[Math.floor(ratings.length * 0.75)]
         const p90 = ratings[Math.floor(ratings.length * 0.9)]

3. Supabase — Upsert industry_benchmarks
   └── For each data point:
       INSERT INTO industry_benchmarks (vertical, size_band, data_point_id,
         benchmark_p25, benchmark_median, benchmark_p75, benchmark_top10,
         sample_size, source)
       VALUES (...)
       ON CONFLICT (vertical, size_band, data_point_id) DO UPDATE SET ...

4. Slack Notification
   └── "Benchmark profile generated for {vertical}: {sample_size} businesses,
        median rating {median_rating}, median reviews {median_reviews}"
```

---

## PART 4: N8N CREDENTIAL SETUP FOR SCRAPING

### Credentials to create in n8n:

```
1. APIFY API TOKEN
   └── Go to: apify.com → Settings → Integrations → API tokens
   └── Create: Personal API token
   └── Save in n8n as: HTTP Header Auth
   └── Header name: Authorization
   └── Header value: Bearer apify_api_YOUR_TOKEN
   └── Name in n8n: "Apify API"

2. GOOGLE PAGESPEED API (optional — works without key but rate limited)
   └── Go to: console.cloud.google.com → APIs → PageSpeed Insights API → Enable
   └── Create API key
   └── Save in n8n as: HTTP Query Auth
   └── Query param: key
   └── Name in n8n: "Google PageSpeed"

3. SUPABASE (already exists)
   └── Credential ID: 4q9cpfRnu7cIWTdl
   └── Already connected to project bfzdcyuyilesubtgbhdc
```

---

## PART 5: APIFY ACTOR CONFIGURATIONS

### Exact Apify actor settings for each scraper:

```json
// ACTOR: apify/google-maps-scraper
// Settings for HOME SERVICES run:
{
  "searchStringsArray": [
    "electrician near me",
    "plumber near me",
    "HVAC contractor near me"
  ],
  "locationQuery": "Southern California",
  "maxCrawledPlacesPerSearch": 20,
  "language": "en",
  "deepenSearchWithFilters": false,
  "maxReviews": 5,
  "reviewsSort": "newest",
  "reviewsTranslation": "originalAndTranslated",
  "scrapeReviewsPersonalData": false,
  "includeWebResults": false,
  "includeHistogram": false,
  "includeOpeningHours": true,
  "includePeopleAlsoSearch": false
}
```

```json
// ACTOR: apify/cheerio-scraper (website structure analysis)
// Run for each website URL collected:
{
  "startUrls": [
    { "url": "https://example-electrician.com" }
  ],
  "maxRequestsPerCrawl": 5,
  "maxCrawlingDepth": 1,
  "pageFunction": "async function pageFunction(context) {
    const { $, request } = context;
    return {
      url: request.url,
      title: $('title').text(),
      hasContactForm: $('form').length > 0,
      hasChat: $('[class*=chat], [id*=chat], [class*=intercom], [class*=drift], [class*=tawk], [class*=tidio]').length > 0,
      phoneVisible: !!$('body').text().match(/\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}/),
      hasBlog: $('a[href*=blog], a[href*=news], a[href*=article]').length > 0,
      servicePageLinks: $('a[href*=service]').length,
      hasSchema: $('script[type=\"application/ld+json\"]').length > 0,
      hasGA: !!$('script').text().match(/gtag|google-analytics|UA-|G-/),
      hasFBPixel: !!$('script').text().match(/fbq|facebook.*pixel/i),
      metaDescription: $('meta[name=description]').attr('content') || '',
      h1Count: $('h1').length,
      imageCount: $('img').length,
      imagesWithAlt: $('img[alt]').length,
      internalLinks: $('a[href^=\"/\"]').length,
      externalLinks: $('a[href^=\"http\"]').not('[href*=\"' + request.url.split('/')[2] + '\"]').length,
      ssl: request.url.startsWith('https'),
      cms: $('meta[name=generator]').attr('content') || 
           ($('link[href*=wp-content]').length ? 'WordPress' : 
           $('meta[content*=Squarespace]').length ? 'Squarespace' :
           $('meta[content*=Wix]').length ? 'Wix' :
           $('meta[content*=Shopify]').length ? 'Shopify' : 'Unknown')
    };
  }"
}
```

---

## PART 6: DATA FLOW DIAGRAM

```
APIFY SCRAPERS                    N8N WORKFLOWS                  SUPABASE
────────────────                  ──────────────                  ────────
                                                                 
Google Maps      ──── API ────→  WF-SCRAPE-01  ──── Insert ───→  scan_history
Scraper                          (transform)                      (750 rows)
                                      │                                │
                                      ▼                                │
PageSpeed API    ──── API ────→  WF-SCRAPE-02  ──── Update ───→  scan_history
+ HTML Extract                   (lighthouse +                    (add scan_data)
                                  structure)                           │
                                      │                                │
                                      ▼                                │
Social Scrapers  ──── API ────→  WF-SCRAPE-03  ──── Update ───→  scan_history
(IG, FB)                         (social check)                   (add social_data)
                                      │                                │
                                      ▼                                │
                                 WF-SCRAPE-04  ──── Insert ───→  industry_benchmarks
                                 (aggregate +                     (15 verticals ×
                                  percentiles)                     ~80 data points)
                                      │                                │
                                      ▼                                │
                                 WF-DIAG-SCORE ◄──── Read ─────  industry_benchmarks
                                 (scoring algo)                        │
                                      │                                │
                                      ▼                                │
                                 WF-SCAN-01    ──── Insert ───→  diagnostic_results
                                 (pre-scan for                    (real client scans)
                                  new prospects)
                                      │
                                      ▼
                                 Claude API    ──── Format ───→  PDF Report
                                 (report gen)                     (client deliverable)
```

---

## PART 7: EXECUTION CHECKLIST

### Before scraping (30 minutes):
```
□ Create Apify API token (apify.com → Settings → Integrations)
□ Add Apify credential to n8n (HTTP Header Auth)
□ Run the Supabase schema SQL (scan_history + industry_benchmarks tables)
□ Verify Supabase connection works from n8n
```

### Scraping execution (4-6 hours, mostly automated):
```
□ Build WF-SCRAPE-01 in n8n (Google Maps pipeline)
□ Run for HOME SERVICES first (test run, ~50 results)
□ Verify data lands in scan_history table
□ Fix any mapping issues
□ Run for remaining 14 verticals (parallel if possible)
□ Build WF-SCRAPE-02 (website analysis)
□ Run for all 750 URLs (batch 10 at a time)
□ Build WF-SCRAPE-03 (social media check)
□ Run for all 750 businesses
□ Build WF-SCRAPE-04 (benchmark aggregation)
□ Run for each vertical
□ Verify industry_benchmarks table is populated
```

### Post-scraping (2-3 hours):
```
□ Review benchmark data for sanity
□ Compare scraped benchmarks to published sources (WebFX, LocaliQ)
□ Adjust any outliers or data quality issues
□ Build WF-DIAG-SCORE (the scoring algorithm)
□ Test scoring on 5 mock datasets
□ Build WF-SCAN-01 (the pre-diagnostic scan for prospects)
□ Test pre-scan on 3 real businesses you know
□ Connect pre-scan to /get-started form webhook
```

---

## PART 8: COST SUMMARY

```
Apify credits:
├── Google Maps Scraper (750 results): ~$3.75
├── Cheerio Scraper (750 sites): ~$3.00
├── Instagram Scraper (750 profiles): ~$3.75
├── Facebook Scraper (750 pages): ~$2.50
└── Total Apify: ~$13.00

Google APIs:
├── PageSpeed Insights: FREE (rate limited to 400 queries/100 sec)
└── Total Google: $0

n8n Cloud:
├── Workflow executions: included in plan
└── Total n8n: $0

Supabase:
├── Storage: well within free tier
└── Total Supabase: $0

TOTAL DATA COLLECTION COST: ~$13
DATA POINTS COLLECTED: ~60,000 (750 businesses × ~80 data points each)
```

---

## WHAT THIS BUILDS

After this execution:

1. **industry_benchmarks table** has real percentile data for all 15 verticals
2. **scan_history table** has 750 real business profiles for reference
3. **WF-SCAN-01** can run a pre-diagnostic on any new prospect in 60 seconds
4. **The diagnostic engine** scores new clients against real benchmarks, not made-up numbers
5. **Every diagnostic report** says "based on analysis of 50+ businesses in your industry"

This is the data that makes the diagnostic worth $500. Without it, you're guessing. With it, you're the authority.
