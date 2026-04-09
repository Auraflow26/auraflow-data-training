# AuraFlow — API Routes Specification

## Authentication
All routes require valid Supabase JWT except /api/scan (public, rate-limited).

## Client App Endpoints

### GET /api/dashboard
Home/Pulse screen data.
Response: { greeting, business_name, metrics, recent_activity, unread_notifications }

### POST /api/chat
Claude AI chat with client context.
Request: { message, conversation_id? }
Response: { role, content, actions? }

### GET /api/notifications
Client notifications. Query: ?read=false&limit=20

### PATCH /api/notifications/:id
Mark notification as read.

## Diagnostic Engine Endpoints

### POST /api/scan
Public pre-diagnostic scan (rate-limited: 10/hour per IP).
Request: { business_name, website_url, city, state, vertical? }
Response: { preliminary_score, dimension_scores, top_gaps, competitor_preview }
Flow:
  1. Validate input (Zod schema)
  2. Run Lighthouse on website_url (Google PageSpeed API)
  3. Crawl website for structural data (Cheerio)
  4. Query Google Maps API for review data
  5. Calculate preliminary Foundation Score (53/163 data points)
  6. Compare to industry_benchmarks for that vertical
  7. Identify top 3 gaps with dollar values
  8. Store in scan_history table
  9. Return snapshot to caller

### POST /api/diagnostics/score
Internal: score a full dataset of 163 data points.
Request: { raw_data, vertical, size_band }
Response: { foundation_score, complexity_score, dimension_scores, break_points, gap_analysis }

### GET /api/diagnostics/benchmarks/:vertical
Get benchmark data for a specific vertical.
Response: { vertical, size_band, benchmarks[] }

### POST /api/diagnostics/report
Generate a diagnostic report using Claude API.
Request: { diagnostic_result_id }
Response: { report_html, report_pdf_url }
