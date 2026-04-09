# AuraFlow Platform

Client App + Diagnostic Engine + Data Acquisition Pipeline

## Quick Start

```bash
npm install
cp .env.example .env.local  # Fill in keys
# Run Supabase schema: docs/supabase-schema.sql
# Seed data: docs/seed-data.sql
npm run dev
```

## Architecture

```
Client App (Next.js) → Supabase (PostgreSQL) ← n8n (Automation)
                     → Claude API (Chat)     ← Apify (Scraping)
```

## Key Commands

```bash
npm run dev        # Start dev server
npm run seed       # Insert mock datasets
npm run scrape     # Run Apify benchmark scraping
npm run calibrate  # Test scoring algorithms
```

## Documentation

- `CLAUDE.md` — Project instructions for Claude Code
- `docs/supabase-schema.sql` — Complete database schema
- `docs/diagnostic-engine.md` — 163 data points + scoring
- `docs/150-datasets.md` — Dataset generation framework
- `docs/scraping-workflows.md` — Apify + n8n pipeline specs
- `docs/app-blueprint-full.md` — Client app screen specs
- `docs/api-routes.md` — API endpoints
- `prompts/n8n-workflows.md` — n8n build prompts
