# AuraFlow — Complete Project Instructions for Claude Code
## Client App + Diagnostic Engine + Data Acquisition + Scraping Pipeline

---

## WHAT THIS PROJECT IS

This is TWO systems in one codebase:

1. **The Client App** — a Next.js 14 PWA where AuraFlow clients see their leads, metrics, reports, chat with AI, and monitor their 6 AI agents. Deployed at app.auraflowusa.com.

2. **The Diagnostic Engine** — the data backbone that collects industry benchmarks from 15 verticals, scores businesses against 163 data points, and generates diagnostic reports worth $500-$1,500. This is AuraFlow's core IP.

Both systems share Supabase, n8n, and the Claude API. The client app READS the diagnostic data. The diagnostic engine WRITES it.

---

## TECH STACK

- **Framework:** Next.js 14 (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with AuraFlow brand kit
- **Database:** Supabase (PostgreSQL + Auth + Realtime + RLS)
- **State:** Zustand (global), React hooks (local)
- **Charts:** Recharts
- **Icons:** Lucide React
- **AI Chat:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Scraping:** Apify actors via API (Google Maps, Cheerio, Lighthouse)
- **Orchestration:** n8n Cloud (aurabazaar.app.n8n.cloud)
- **Deployment:** Vercel (app.auraflowusa.com)
- **PWA:** next-pwa

## SUPABASE PROJECT
- ID: bfzdcyuyilesubtgbhdc
- URL: https://bfzdcyuyilesubtgbhdc.supabase.co
- Existing tables (8): diagnostic_submissions, clients, heartbeat_log, audit_log, request_log, lead_interactions, system_metrics, webhook_events
- Client app tables (6): client_profiles, daily_metrics, agent_activity, chat_messages, notifications, hierarchy_nodes
- Diagnostic engine tables (3): diagnostic_results, industry_benchmarks, scan_history, mock_datasets
- n8n credential ID: 4q9cpfRnu7cIWTdl

---

## DESIGN SYSTEM — MANDATORY

### Colors (Tailwind custom):
```
bg: #030305 | bg-secondary: #0a0a0f | bg-card: #0c0a12 | bg-elevated: #141220
accent: #8b5cf6 | accent-light: #a78bfa | accent-bright: #c4b5fd
gold: #d4af37 | success: #10b981 | danger: #ef4444 | warning: #f59e0b
text-primary: #faf5ff | text-secondary: #c4b5fd | text-muted: #7c7291 | text-dim: #4a4458
border: rgba(139,92,246,0.12) | border-active: rgba(139,92,246,0.35)
```

### Typography:
- Primary: Space Grotesk (all text)
- Mono: JetBrains Mono (numbers, metrics, labels, timestamps, scores, data)

### Rules:
- Dark theme ONLY. Never white backgrounds.
- Purple accent for interactive elements, CTAs, active states
- JetBrains Mono for ALL numbers and data
- Border radius: 16px cards, 12px inputs, 100px pills
- No gradients except subtle radial glows
- Glassmorphism on overlays only (backdrop-blur-xl)

---

## ACCESS HIERARCHY
- Level 1 (AuraFlow team): Full system access — NOT in this app
- Level 2 (Client owner): Dashboard + approval access — THIS APP
- Level 3 (Client staff): Limited role-filtered views — THIS APP

---

## DATA RULES — CRITICAL
- ALL data comes from Supabase. Never hardcode metrics or fake data in components.
- Use seed data during development (see docs/seed-data.sql)
- RLS policies enforce multi-tenant isolation
- The chat endpoint MUST ground responses in real data — never fabricate
- Industry benchmarks come from real scraped data + published sources

---

## ARCHITECTURE RULES
- Server Components by default. Client Components only for interactivity.
- Zustand for global state (client profile, notification count). NOT React Context.
- Every API route verifies Supabase auth session.
- Supabase Realtime for live activity feed on Home screen.
- Keep initial bundle under 200KB for mobile performance.
- All timestamps in client's local timezone.

---

## FILE STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                    ← Root layout: fonts, metadata, PWA
│   ├── globals.css                   ← Tailwind + custom styles
│   ├── login/page.tsx                ← Magic link login
│   ├── auth/callback/route.ts        ← Supabase auth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← Dashboard shell: bottom nav, header
│   │   ├── page.tsx                  ← HOME: The Pulse
│   │   ├── leads/page.tsx            ← Lead pipeline list
│   │   ├── leads/[id]/page.tsx       ← Lead detail
│   │   ├── reports/page.tsx          ← Reports & Foundation Score
│   │   ├── chat/page.tsx             ← Ask AuraFlow chat
│   │   ├── agents/page.tsx           ← Agent status dashboard
│   │   ├── hierarchy/page.tsx        ← Business hierarchy map
│   │   └── settings/page.tsx         ← Profile, notifications, team
│   └── api/
│       ├── chat/route.ts             ← Claude API chat endpoint
│       ├── notifications/route.ts    ← Notification endpoints
│       ├── scan/route.ts             ← Pre-diagnostic scan endpoint
│       └── diagnostics/route.ts      ← Full diagnostic scoring endpoint
├── components/
│   ├── ui/                           ← MetricCard, LeadCard, Badge, etc.
│   ├── charts/                       ← LeadTrend, SourceBreakdown, etc.
│   └── layout/                       ← DashboardHeader, DashboardShell, BottomNav
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser Supabase client
│   │   ├── server.ts                 ← Server Supabase client
│   │   └── middleware.ts             ← Auth middleware
│   ├── scoring/
│   │   ├── foundation-score.ts       ← Foundation Score algorithm (0-100)
│   │   ├── complexity-score.ts       ← Complexity Score algorithm (10-40)
│   │   ├── gap-analyzer.ts           ← Gap identification + dollar value calculator
│   │   ├── benchmark-comparator.ts   ← Compare client data to industry benchmarks
│   │   └── dimension-weights.ts      ← Scoring weights per dimension per vertical
│   ├── scraping/
│   │   ├── apify-client.ts           ← Apify API wrapper
│   │   ├── lighthouse.ts             ← Google PageSpeed API wrapper
│   │   ├── website-analyzer.ts       ← HTML structure extraction
│   │   └── social-checker.ts         ← Social media presence checker
│   ├── store.ts                      ← Zustand global state
│   ├── types.ts                      ← All TypeScript interfaces
│   └── utils.ts                      ← Formatting, date helpers
├── hooks/
│   ├── useClient.ts                  ← Current client profile
│   ├── useMetrics.ts                 ← Dashboard metrics
│   ├── useLeads.ts                   ← Lead data + realtime
│   ├── useAgents.ts                  ← Agent status
│   ├── useBenchmarks.ts              ← Industry benchmark data
│   └── useNotifications.ts           ← Notification count + list
├── scripts/
│   ├── seed-mock-datasets.ts         ← Insert 150 mock datasets into Supabase
│   ├── run-benchmark-scrape.ts       ← Trigger Apify scraping for all 15 verticals
│   └── calibrate-scoring.ts          ← Run scoring on mock data + validate
└── middleware.ts                      ← Redirect unauthenticated to /login
```

---

## KEY DOCS TO READ BEFORE BUILDING

1. `docs/app-blueprint.md` — Full screen specifications for the client app
2. `docs/supabase-schema.sql` — ALL database tables (app + diagnostic engine)
3. `docs/seed-data.sql` — RC Generators sample data + mock datasets
4. `docs/api-routes.md` — API endpoint specifications
5. `docs/diagnostic-engine.md` — 163 data points, scoring algorithms, benchmark profiles
6. `docs/scraping-workflows.md` — Apify actor configs, n8n workflow specs
7. `docs/150-datasets.md` — The 150 mock dataset framework + generation template
8. `prompts/n8n-workflows.md` — Claude Code prompts for building n8n workflows

---

## BUILD ORDER

### Phase 1 (Days 1-5): Foundation
1. Supabase schema (run docs/supabase-schema.sql)
2. Auth flow (login, middleware, callback)
3. Dashboard shell (layout, nav, header)
4. Home/Pulse screen with real Supabase queries
5. Seed data inserted

### Phase 2 (Days 6-10): Client App Screens
6. Leads screen (list + detail + filtering)
7. Reports screen (Foundation Score, metrics, charts)
8. Chat screen (Claude API, message history)
9. Agents screen + Settings screen
10. PWA config, notifications, realtime

### Phase 3 (Days 11-14): Diagnostic Engine
11. Scoring algorithms (lib/scoring/)
12. Pre-diagnostic scan API endpoint
13. Scraping utilities (lib/scraping/)
14. Benchmark comparator
15. Deploy to Vercel, connect domain

### Phase 4 (Week 3+): Data Collection
16. Run Apify scrapers for all 15 verticals
17. Insert 150 mock datasets
18. Calibrate scoring against real + mock data
19. Build automated pre-scan for /get-started
20. Connect to n8n diagnostic intake workflow
