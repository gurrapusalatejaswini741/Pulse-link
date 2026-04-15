# Pulse-Link

## Overview

AI-driven stadium crowd management system. Features a real-time admin command center dashboard, a mobile-responsive fan interface, and a Gemini-powered fan assistant chatbot.

## Architecture

- **Frontend** (`artifacts/pulse-link/`) — React + Vite, dark mode neon aesthetic, routes: `/` (Admin Dashboard), `/fan` (Fan Interface), `/fan/assistant` (AI Fan Assistant)
- **API Server** (`artifacts/api-server/`) — Express 5 + TypeScript + WebSocket crowd simulation
- **Database** — PostgreSQL (Replit-managed) with Drizzle ORM
- **AI** — Gemini Flash via Replit AI Integrations (Fan Assistant chatbot, SSE streaming)
- **Crowd Engine** (`artifacts/api-server/src/lib/crowd-engine.ts`) — Isolated simulation module, 24 stadium zones, 2-second tick interval, modular for future Vertex AI migration

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Lucide Icons
- **Backend**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: `@google/genai` via Replit AI Integrations (no API key needed)

## Features

1. **Admin Dashboard** (`/`) — Live 6x8 stadium heat map grid colored by density, real-time bottleneck alerts, crowd stats, Simulate Halftime + Reset buttons
2. **Fan Interface** (`/fan`) — 2D stadium map with optimal route overlay, smart discount nudges, Aura-Gate biometric check-in simulator
3. **Fan AI Assistant** (`/fan/assistant`) — Gemini-powered chatbot with SSE streaming, knows stadium layout, answers crowd/navigation questions

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/scripts run seed-pulse-link` — seed initial venue/zone data

## Cloud Readiness

- `Dockerfile` — multi-stage build for Google Cloud Run
- `docker-compose.yml` — local full-stack development with Postgres
- Crowd Engine is isolated in `src/lib/crowd-engine.ts` for future Vertex AI migration

## Database Schema

- `venues` — Stadium configuration
- `zones` — 24 zones with type (gate/concession/seating/restroom/general), capacity, density, bottleneck flag
- `bottlenecks` — Historical bottleneck events with severity and resolution tracking
- `fans` — Registered attendees with seat section and check-in status
- `notifications` — Smart nudge messages with discount codes
- `checkins` — Biometric entry log (Aura-Gate simulation)
- `conversations` + `messages` — Gemini chat history

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Set by Replit AI Integrations
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Set by Replit AI Integrations
- `SESSION_SECRET` — Session secret
