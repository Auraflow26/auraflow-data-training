# n8n Workflows — Claude Code Build Prompts
# Run these in Claude Code to generate n8n workflow JSON for import

## PRIORITY 0 — Revenue Critical

### WF-DIAG-01: Diagnostic Intake Pipeline
Trigger: Webhook POST /webhook/diagnostic-intake
→ Validate payload (Zod schema: business_name, email, industry, responses)
→ Write to Supabase diagnostic_submissions table
→ Send Slack notification to #diagnostics with formatted message
→ Send auto-reply email via Gmail (confirm receipt, set expectations)
→ Log to Supabase audit_log
n8n credential IDs: Supabase (4q9cpfRnu7cIWTdl), Gmail (OGJwMbv8Lq4nnawr), Slack (W0avLLt4nRkXYBkX)

### WF-LEAD-01: Lead Capture Router
Trigger: Webhook POST /webhook/lead-capture
→ Normalize lead data (different sources send different formats)
→ Write to Supabase lead_interactions table
→ Calculate lead score using scoring algorithm
→ Send Slack notification to #leads
→ If score > 80: also notify via SMS to Mo/Ario (Twilio bozJutScyUonyuRa)

### WF-BOOK-01: Calendly Booking Handler
Trigger: Webhook from Calendly
→ Extract booking data (name, email, time, type)
→ Write to Supabase diagnostic_submissions (if diagnostic booking)
→ Send Slack notification to #bookings
→ Send confirmation email with prep questions

## PRIORITY 1 — Data Collection

### WF-SCRAPE-01: Google Maps Data Collection
Trigger: Manual
→ HTTP Request to Apify google-maps-scraper API
→ Wait for completion
→ GET results from Apify dataset
→ Transform data (normalize fields)
→ Split in batches (50 per batch)
→ Insert to Supabase scan_history
→ Slack notification to #diagnostics

### WF-SCRAPE-02: Website Analysis Pipeline
Trigger: After WF-SCRAPE-01
→ Get URLs from Supabase scan_history
→ Split in batches (10 at a time)
→ Google PageSpeed Insights API call
→ Extract Lighthouse scores
→ Wait 2 seconds (rate limit)
→ HTTP GET website HTML
→ HTML Extract node (structure analysis)
→ Combine lighthouse + structure
→ Update Supabase scan_history.scan_data
→ Slack notification

### WF-SCRAPE-03: Social Media Presence
Trigger: After WF-SCRAPE-01
→ Get business names from scan_history
→ Check Instagram presence (Apify)
→ Check Facebook presence
→ Compile social data
→ Update scan_history

### WF-SCRAPE-04: Benchmark Aggregation
Trigger: After all scraping complete
→ Get all scan data for a vertical
→ Code node: calculate p25, median, p75, p90 for each data point
→ Upsert to Supabase industry_benchmarks
→ Slack notification with summary

## PRIORITY 2 — Ongoing Automation

### WF-SEO-01 through WF-SEO-05 (see marketing doc)
### WF-CONTENT-01 (weekly content generation)
### WF-REV-01 (review monitoring + auto-response)
### WF-REPORT-01 (weekly performance report)
