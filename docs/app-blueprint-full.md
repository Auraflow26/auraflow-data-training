# AuraFlow Client App — Complete Architecture Blueprint
## The Single Pane of Glass for Every Client's Business
### Internal Architecture Document · April 2026 · Confidential

---

## EXECUTIVE SUMMARY

The AuraFlow Client App is the interface where clients interact with their deployed operating system. It's not a dashboard — it's the window into a living system that's running their business 24/7. The client opens one app and sees everything: leads captured, follow-ups sent, ads optimized, reviews managed, and performance metrics — all with the ability to ask questions in natural language and approve recommendations from their advisor.

This app connects two worlds:
1. **AuraFlow's internal infrastructure** (n8n workflows, AI agents, Supabase database, Claude/GPT intelligence layer)
2. **The client's existing tools** (their CRM, Google Ads, Google Business Profile, social media, phone system, accounting software)

The client never touches either system directly. They interact through the app. The app is the product they see every day.

---

## PART 1: ARCHITECTURE OVERVIEW

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT-FACING LAYER                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Mobile App   │  │   Web App    │  │  Notification Layer  │  │
│  │  (React       │  │  (Next.js)   │  │  (Push + SMS + Email)│  │
│  │   Native)     │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └────────────┬────┘──────────────────────┘              │
│                      │                                          │
│              ┌───────▼────────┐                                 │
│              │   API Gateway   │                                │
│              │  (FastAPI +     │                                │
│              │   Auth Layer)   │                                │
│              └───────┬────────┘                                 │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                  AURAFLOW CORE                                  │
│                      │                                          │
│  ┌───────────────────▼───────────────────┐                     │
│  │          Supabase (PostgreSQL)         │                     │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ │                     │
│  │  │ clients │ │hierarchy │ │metrics │ │                     │
│  │  │ nodes   │ │ _nodes   │ │_daily  │ │                     │
│  │  │ agents  │ │ break    │ │audit   │ │                     │
│  │  │ _config │ │ _points  │ │_log    │ │                     │
│  │  └─────────┘ └──────────┘ └────────┘ │                     │
│  └───────────────────────────────────────┘                     │
│                      │                                          │
│  ┌───────────────────▼───────────────────┐                     │
│  │          n8n Orchestration Engine      │                     │
│  │  ┌──────────────────────────────────┐ │                     │
│  │  │  6 Agent Workflows:              │ │                     │
│  │  │  Cyrus · Maven · Orion           │ │                     │
│  │  │  Atlas · Apex · Nova             │ │                     │
│  │  └──────────────────────────────────┘ │                     │
│  └───────────────────────────────────────┘                     │
│                      │                                          │
│  ┌───────────────────▼───────────────────┐                     │
│  │        Intelligence Layer             │                     │
│  │  Claude API · OpenAI · Ollama Local   │                     │
│  │  Pinecone (Vector) · RAG Pipeline     │                     │
│  └───────────────────────────────────────┘                     │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│              CLIENT'S EXISTING TOOLS                            │
│                      │                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Google Ads│ │  GBP     │ │  CRM     │ │ Phone System     │  │
│  │Meta Ads  │ │  Yelp    │ │ (varies) │ │ (Twilio/native)  │  │
│  │LSA       │ │  Angi    │ │          │ │                  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │QuickBooks│ │ Social   │ │ Website  │ │ Industry Tools   │  │
│  │Xero      │ │ Media    │ │ (Framer) │ │ (ServiceTitan,   │  │
│  │Stripe    │ │ Accounts │ │          │ │  Toast, Clio...) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Three-Level Access Hierarchy (from OS Client Deployment Model)

```
Level 1 — AuraFlow Team (full system access)
├── Can modify agent configurations, workflow logic, scoring models
├── Can view all client data across all deployments
├── Can deploy new agents, update system prompts, modify integrations
└── Access: n8n admin, Supabase admin, all API endpoints

Level 2 — Client Owner (dashboard + approval access)
├── Can view all their business data, metrics, reports
├── Can approve/reject agent recommendations
├── Can chat with the intelligence layer (ask questions)
├── Can view hierarchy map and Foundation Score
├── CANNOT modify agent logic, workflow code, or system architecture
└── Access: Client App (web + mobile), notification preferences

Level 3 — Client Staff (limited operational access)
├── Can view assigned dashboards and metrics
├── Can see lead notifications and task assignments
├── Can respond to customer interactions (with AI draft support)
├── CANNOT approve system changes, view financial data, or modify settings
└── Access: Client App (mobile only), role-filtered views
```

---

## PART 2: APP SCREENS — COMPLETE SPECIFICATION

### Screen 1: HOME — "The Pulse"
The first thing the client sees every time they open the app.

```
┌─────────────────────────────────────┐
│  Good morning, Robert.        [≡]   │
│  RC Generators & Electric           │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │ 4       │  │ 8 sec   │         │
│  │ Leads   │  │ Avg     │         │
│  │ today   │  │ response│         │
│  └─────────┘  └─────────┘         │
│  ┌─────────┐  ┌─────────┐         │
│  │ $14.2K  │  │ 67      │         │
│  │ Pipeline│  │ Google  │         │
│  │ value   │  │ reviews │         │
│  └─────────┘  └─────────┘         │
│                                     │
│  ── ACTIVITY FEED ──────────────── │
│                                     │
│  🟢 Lead captured — Panel upgrade   │
│     Riverside · $4,200 est.         │
│     Qualified & followed up · 3 min │
│                                     │
│  🟣 Ad optimization applied         │
│     Google Ads · Budget shifted     │
│     15% to emergency campaign       │
│     ✓ Approved by advisor           │
│                                     │
│  🟢 Review responded                │
│     5-star · "Great service..."     │
│     Auto-published · 12 min ago     │
│                                     │
│  ── ASK AURAFLOW ──────────────── │
│  ┌─────────────────────────────┐   │
│  │ Ask about your business...  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

**Data sources:**
- Lead count: Supabase `lead_interactions` table, filtered by today
- Response time: calculated from `lead_interactions.created_at` vs `lead_interactions.first_response_at`
- Pipeline value: sum of `lead_interactions.estimated_value` for active leads
- Review count: Google Business Profile API via n8n connector
- Activity feed: Supabase `audit_log` table, filtered by client_id, last 24 hours

### Screen 2: LEADS — "The Pipeline"

```
┌─────────────────────────────────────┐
│  ← Leads                    [Filter]│
│  ─────────────────────────────────  │
│                                     │
│  [New (4)] [Qualified (7)] [Won (3)]│
│                                     │
│  ── NEW ────────────────────────── │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Sarah Wilson · Riverside     │   │
│  │ Panel upgrade · $4,200 est.  │   │
│  │ Source: Google Ads            │   │
│  │ Score: 87/100 · ⚡ Hot        │   │
│  │ Status: Follow-up #2 sent    │   │
│  │ [View] [Call] [Approve quote]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Mike Chen · Corona           │   │
│  │ Generator install · $8,500   │   │
│  │ Source: Angi                  │   │
│  │ Score: 72/100 · 🟡 Warm      │   │
│  │ Status: Qualification call   │   │
│  │ scheduled for 2 PM           │   │
│  │ [View] [Call] [Reschedule]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

**Data sources:**
- Lead list: Supabase `lead_interactions` joined with `clients` table
- Lead score: calculated by the Lead Qualification Agent (Maven) via n8n
- Source attribution: tracked from UTM params, call tracking, or platform API
- Follow-up status: tracked in `lead_interactions.follow_up_stage`
- Actions: trigger n8n webhooks (Call → Twilio, Approve → workflow trigger)

### Screen 3: REPORTS — "The Scoreboard"

```
┌─────────────────────────────────────┐
│  ← Reports                  [Range]│
│  ─────────────────────────────────  │
│                                     │
│  [This Week] [Month] [Quarter]      │
│                                     │
│  ── FOUNDATION SCORE ───────────── │
│  ┌─────────────────────────────┐   │
│  │         62 / 100             │   │
│  │    ██████████░░░░░░░         │   │
│  │    ↑ from 34 at diagnostic   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ── MARKETING ──────────────────── │
│  Leads this month      47  (+23%)  │
│  Cost per lead         $32 (-18%)  │
│  Close rate            28% (+4%)   │
│  Ad spend ROI          4.2x        │
│                                     │
│  ── OPERATIONS ─────────────────── │
│  Avg response time     8 sec       │
│  Follow-up completion  94%         │
│  Admin hours saved     12 hrs/wk   │
│                                     │
│  ── REPUTATION ─────────────────── │
│  Google reviews        67 (+8)     │
│  Avg rating            4.8 ★       │
│  Response rate         100%        │
│                                     │
│  ── SEO ────────────────────────── │
│  Keywords ranking      23 (+6)     │
│  Organic traffic       +34%        │
│  Top page: /panel-upgrade #4       │
│                                     │
│  [Download PDF] [Share with team]  │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

**Data sources:**
- Foundation Score: Supabase `diagnostic_submissions.foundation_score`, updated monthly by Cyrus agent
- Marketing metrics: Google Ads API + Meta Ads API + CRM, aggregated by Maven
- Operations metrics: n8n execution logs + Twilio call logs, aggregated by Orion
- Reputation: Google Business Profile API + Yelp API, tracked by Atlas
- SEO: Google Search Console API + rank tracking tool, managed by Maven

### Screen 4: CHAT — "Ask AuraFlow"
The conversational interface from the Experience page — now as a real, functioning screen.

```
┌─────────────────────────────────────┐
│  ← AuraFlow Intelligence     [···] │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ AI: Good morning, Robert.   │   │
│  │ Your emergency campaign     │   │
│  │ captured 3 leads overnight. │   │
│  │ 2 are qualified.            │   │
│  └─────────────────────────────┘   │
│                                     │
│      ┌─────────────────────────┐   │
│      │ Why did Thursday's      │   │
│      │ leads spike?            │   │
│      └─────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ AI: The spike came from     │   │
│  │ your emergency campaign.    │   │
│  │ A rolling blackout hit      │   │
│  │ West Covina at 2 PM.        │   │
│  │ We captured 9 leads in      │   │
│  │ 4 hours. Revenue: $14.2K.   │   │
│  │                             │   │
│  │ Want me to create a surge   │   │
│  │ playbook for next time?     │   │
│  │                             │   │
│  │ [Yes, create playbook]      │   │
│  │ [Tell me more]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Ask about your business...  │ ↑ │
│  └─────────────────────────────┘   │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

**Data flow for chat:**
1. Client types question
2. App sends to FastAPI endpoint `/api/chat`
3. FastAPI queries Supabase for client context (recent metrics, lead data, agent activity)
4. Context + question sent to Claude API with client-specific system prompt
5. Claude generates response grounded in actual client data
6. If response includes a recommendation (budget shift, new workflow), it's flagged for advisor approval
7. Response returned to app with optional action buttons

### Screen 5: HIERARCHY — "Your Business Map"

```
┌─────────────────────────────────────┐
│  ← Business Hierarchy        [Edit]│
│  ─────────────────────────────────  │
│  Complexity: 22/40 · Standard       │
│  Active layers: 5                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ C1 · P&L Owner              │   │
│  │ RC Generators & Electric     │   │
│  ├─────────────────────────────┤   │
│  │ E4 · Department              │   │
│  │ Residential Services         │   │
│  ├─────────────────────────────┤   │
│  │ E5 · Work Category           │   │
│  │ Generator Installation       │   │
│  ├─────────────────────────────┤   │
│  │ C2 · Cost Container          │   │
│  │ JOB-0142 Smith Residence     │   │
│  ├─────────────────────────────┤   │
│  │ C3 · Transaction             │   │
│  │ Dispatch + 6hrs + $2,800     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ── COST TRACEABILITY ──────────── │
│  Can you trace this task to P&L?   │
│  [██████████░░] 78% traceable      │
│  ↑ from 23% at diagnostic          │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

### Screen 6: AGENTS — "Your Team"

```
┌─────────────────────────────────────┐
│  ← Active Agents             [Logs]│
│  ─────────────────────────────────  │
│                                     │
│  ┌─ CYRUS ─────────────────────┐   │
│  │ Chief Orchestrator    🟢 Active│
│  │ Last heartbeat: 2 min ago    │  │
│  │ Actions today: 142           │  │
│  │ [View activity log]          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ MAVEN ─────────────────────┐   │
│  │ Marketing Intelligence 🟢    │  │
│  │ Campaigns: 3 active          │  │
│  │ Leads captured today: 4      │  │
│  │ Ad spend today: $67          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ ORION ─────────────────────┐   │
│  │ Operations        🟢 Active  │  │
│  │ Workflows run today: 38      │  │
│  │ Avg execution: 2.3 sec       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ ATLAS ─────────────────────┐   │
│  │ Administrative    🟢 Active  │  │
│  │ Docs processed: 12           │  │
│  │ Reviews responded: 3         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ APEX ──────────────────────┐   │
│  │ Human Performance 🟡 Idle    │  │
│  │ Team health: Good            │  │
│  │ Next check: Tomorrow 9 AM    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ NOVA ──────────────────────┐   │
│  │ Finance & Legal   🟢 Active  │  │
│  │ Revenue tracked: $23.4K MTD  │  │
│  │ Margin alert: None           │  │
│  └──────────────────────────────┘  │
│                                     │
│  [Home] [Leads] [Reports] [Chat]   │
└─────────────────────────────────────┘
```

### Screen 7: SETTINGS

```
Profile & Business Info
Notification Preferences (push, SMS, email, frequency)
Team Members (Level 3 access management)
Connected Tools (view integration status)
Billing & Subscription
Advisor Contact
Data Export
```

---

## PART 3: API ARCHITECTURE

### Core API Endpoints (FastAPI)

```
Authentication:
POST   /api/auth/login              → JWT token
POST   /api/auth/refresh            → Refresh JWT
POST   /api/auth/logout             → Invalidate session

Dashboard:
GET    /api/dashboard/pulse         → Home screen metrics
GET    /api/dashboard/activity      → Activity feed (paginated)

Leads:
GET    /api/leads                   → List leads (filtered, paginated)
GET    /api/leads/{id}              → Lead detail
POST   /api/leads/{id}/action       → Trigger action (call, approve, etc)
GET    /api/leads/stats             → Lead funnel metrics

Reports:
GET    /api/reports/foundation      → Foundation Score + history
GET    /api/reports/marketing       → Marketing metrics by period
GET    /api/reports/operations      → Operations metrics
GET    /api/reports/reputation      → Review metrics
GET    /api/reports/seo             → SEO performance
GET    /api/reports/export/pdf      → Generate PDF report

Chat:
POST   /api/chat                    → Send message, receive AI response
GET    /api/chat/history            → Conversation history

Hierarchy:
GET    /api/hierarchy               → Client's hierarchy map
PUT    /api/hierarchy/{node_id}     → Update hierarchy node label

Agents:
GET    /api/agents                  → Agent status + activity summary
GET    /api/agents/{name}/logs      → Agent activity log (paginated)

Notifications:
GET    /api/notifications           → Unread notifications
POST   /api/notifications/{id}/read → Mark as read
PUT    /api/notifications/settings  → Update preferences

Settings:
GET    /api/settings/profile        → Client profile
PUT    /api/settings/profile        → Update profile
GET    /api/settings/integrations   → Connected tool status
GET    /api/settings/team           → Team members (Level 3)
POST   /api/settings/team/invite    → Invite team member
```

### Data flow: How the app stays in sync

```
REAL-TIME UPDATES (WebSocket / Supabase Realtime):
- New lead captured → push to app immediately
- Agent action completed → activity feed update
- Review detected → notification
- Advisor message → chat notification

POLLING (every 60 seconds):
- Dashboard metrics refresh
- Agent heartbeat status

ON-DEMAND (user-triggered):
- Report generation
- Chat messages
- Lead actions
- Hierarchy edits
```

---

## PART 4: INTEGRATION ARCHITECTURE

### How the app connects to the client's existing tools

```
INTEGRATION LAYER (n8n as middleware):

Client Tool          n8n Connector        Data Flow
──────────────────────────────────────────────────────
Google Ads        →  Google Ads API    →  Spend, clicks, conversions
Meta Ads          →  Meta Marketing    →  Spend, reach, leads
Google Business   →  GBP API           →  Reviews, ratings, insights
Google Analytics  →  GA4 API           →  Traffic, behavior, goals
Google Search     →  Search Console    →  Rankings, impressions, CTR
Yelp              →  Yelp API          →  Reviews, ratings
Angi              →  Web scraper       →  Leads, reviews
Phone System      →  Twilio API        →  Call logs, recordings
CRM (varies)      →  HubSpot/Pipe API  →  Contacts, deals, pipeline
Accounting        →  QuickBooks API    →  Revenue, expenses
Social Media      →  Meta/IG API       →  Posts, engagement, reach
Website           →  Analytics pixel   →  Visitors, conversions, forms
Industry Tool     →  Custom API/webhook →  Industry-specific data
```

### Per-vertical integrations:

```
HOME SERVICES:   ServiceTitan, Housecall Pro, Jobber
RESTAURANT:      Toast, Square, DoorDash, OpenTable
AGENCY:          Monday.com, Asana, HubSpot, Harvest
REAL ESTATE:     Follow Up Boss, kvCORE, Dotloop
ECOMMERCE:       Shopify, Klaviyo, ShipStation
HEALTHCARE:      Athenahealth, Dentrix, ZocDoc
SAAS:            Stripe, Intercom, Mixpanel
CONSTRUCTION:    Procore, Buildertrend
LAW:             Clio, MyCase, LawPay
ACCOUNTING:      QuickBooks, Karbon, Lacerte
FITNESS:         Mindbody, Glofox
INSURANCE:       Applied Epic, HawkSoft
LOGISTICS:       Samsara, McLeod
MANUFACTURING:   SAP, Fishbowl
```

---

## PART 5: NOTIFICATION SYSTEM

### Notification categories and channels:

```
CRITICAL (push + SMS immediately):
- Lead scored 90+ (hot lead)
- Negative review detected (3 stars or below)
- System outage or agent failure
- Advisor needs approval for urgent change

HIGH (push immediately):
- New lead captured
- Appointment booked
- Review responded (auto-published)
- Ad budget recommendation ready

MEDIUM (push, batched hourly):
- Lead follow-up completed
- Weekly report ready
- SEO ranking change
- Agent optimization applied

LOW (email digest, daily):
- System performance summary
- Content published
- Team activity log
- Integration status updates
```

---

## PART 6: TECH STACK

```
FRONTEND:
- Mobile: React Native (iOS + Android from single codebase)
- Web: Next.js 14 (App Router, Server Components)
- State: Zustand (lightweight, no Redux complexity)
- Charts: Recharts (React-native-compatible)
- Chat UI: Custom (matches AuraFlow brand kit)

BACKEND:
- API: FastAPI (Python, async)
- Auth: Supabase Auth (JWT + magic link + SSO)
- Database: Supabase (PostgreSQL + Row Level Security)
- Realtime: Supabase Realtime (WebSocket channels)
- File storage: Supabase Storage (reports, exports)
- AI: Anthropic Claude API (chat intelligence)

ORCHESTRATION:
- n8n Cloud (all agent workflows, integrations, data sync)
- Cron jobs via n8n schedule triggers

HOSTING:
- Web: Vercel (Next.js optimized)
- Mobile: App Store + Google Play
- API: Railway or Render (FastAPI)
- CDN: Cloudflare (assets, caching)

MONITORING:
- Sentry (error tracking)
- Supabase dashboard (database monitoring)
- n8n execution logs (workflow monitoring)
- Custom heartbeat monitor (the one we built)
```

---

## PART 7: BUILD PHASES

### Phase 1: Web MVP (Months 1-2)
Build the web app first — deploy as a PWA so it works on mobile browsers before native apps are ready.

```
DELIVERABLES:
- Auth (Supabase magic link)
- Home/Pulse screen with live metrics
- Activity feed
- Lead list with status tracking
- Basic chat (Claude-powered, client context)
- Foundation Score display
- Notification emails

TECH: Next.js + Supabase + FastAPI
COST: $0 infra (Supabase free tier, Vercel hobby)
TIMELINE: 6-8 weeks
```

### Phase 2: Full Web + API (Months 3-4)
```
DELIVERABLES:
- Reports screen with charts
- PDF export
- Hierarchy visualization
- Agent status dashboard
- Team member management (Level 3)
- Push notifications (web)
- Connected tools status page
- Advisor messaging channel

TIMELINE: 4-6 weeks
```

### Phase 3: React Native Mobile (Months 5-7)
```
DELIVERABLES:
- iOS + Android apps from shared codebase
- All web features ported
- Native push notifications
- Biometric auth (Face ID, fingerprint)
- Offline mode (cached dashboard, queued actions)
- Widget for iOS home screen (lead count, score)

TIMELINE: 8-10 weeks
```

### Phase 4: Advanced Features (Months 8-12)
```
DELIVERABLES:
- Voice interface ("Hey AuraFlow, how many leads today?")
- Predictive analytics dashboard
- Custom report builder
- Multi-location view (for complex clients)
- White-label capability (for partner agencies)
- API access for client developers

TIMELINE: Ongoing
```

---

## PART 8: COMPETITIVE MOAT

### Why the app creates lock-in:

1. **Data accumulation** — every day the system runs, it collects more data about the client's business. After 6 months, leaving means abandoning 6 months of trend data, lead history, performance baselines, and trained AI context.

2. **Hierarchy mapping** — the elastic hierarchy is mapped to the client's actual business structure. Rebuilding this with a competitor would take weeks.

3. **Integration depth** — the app connects to 5-15 of the client's tools. Disconnecting means reconnecting everything to a new system.

4. **AI context** — the chat intelligence has conversation history and learned preferences. A new system starts from zero.

5. **Team familiarity** — Level 3 staff are trained on the app. Switching means retraining.

6. **Advisor relationship** — the human advisor knows the business. This is the hardest thing to replicate.

The app isn't just a dashboard. It's a dependency. And that's by design.
```

---

## SUMMARY

The AuraFlow Client App is the product the client pays for every month. Everything else — the agents, the workflows, the integrations, the intelligence layer — is invisible infrastructure. The app is where the value becomes visible.

Build the web MVP first (Phase 1, 6-8 weeks). Deploy it for RC Generators as the reference client. Use their feedback to refine before building native mobile. By the time you have 5 clients on the web app, you'll know exactly what the mobile app needs to be.
