# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are administrative staff of Ecoturismo La Yeguada OBC, a community-based organization (organización de base comunitaria) — not necessarily technical people. In their day-to-day, they open the dashboard to check how the conversational chatbot is performing, review conversations the bot escalated to a human, keep the intents/knowledge base current, and monitor system configuration (confidence threshold, WhatsApp integration, escalation rules).

## Product Purpose

A conversational automation system that answers ecotourism visitors' natural-language questions (in Spanish) about tours, pricing, guides, directions, camping, waterfalls, and hours, and escalates unresolved queries to a human. The admin dashboard gives OBC staff visibility into and control over that system: KPIs, conversation volume and intent breakdown, a monitoring view of active/completed/waiting conversations, intent management, and a knowledge-base CRUD.

This is also the deliverable for a Trabajo Final de Graduación (TFG) — a Licenciatura en Sistemas de Información thesis at Universidad Nacional de Costa Rica (UNA) — so the dashboard doubles as an academic demonstration of the system's design and completeness, but is scoped and built as if intended for real adoption by the OBC, not as a throwaway demo.

## Positioning

A purpose-built NLP chatbot trained specifically on La Yeguada's own intents and answers (tour booking, pricing, guide availability, directions to the Reserva Forestal La Yeguada in Calobre, Veraguas, camping, the Cascadas Celestes/La Silampa waterfalls, hours), paired with an admin dashboard that a non-technical community organization can actually operate — not a generic chatbot widget or a bare analytics dump.

## Operating Context

- Backend: Express + node-nlp (`NlpManager`, Spanish), in-memory metrics, REST endpoints (`/api/chat`, `/api/metrics`, `/api/intents`, `/api/health`, `DELETE /api/metrics/reset`).
- Frontend: React 18 dashboard (CRA) with Recharts, React Router v6. Runs standalone in a **demo mode** with local mock data and a client-side NLP classifier when the backend isn't running; switches to **connected mode** (polling `/api/metrics` every 30s) when the backend is up. A visible connection-status indicator in the topbar communicates which mode is active.
- Dashboard surfaces already implemented: Panel de Control (KPIs, daily volume chart, intents donut, recent conversations table), Gestión de Intenciones, Base de Conocimiento (CRUD), Monitoreo (conversations active/completed/waiting), Configuración (backend params, confidence threshold, WhatsApp integration, escalation rules). A chat panel embedded in the dashboard lets staff test the bot directly.
- Escalation path to a human is by WhatsApp; no other channel is wired up yet.
- Spanish-only interface and chatbot; no i18n requirement.

## Capabilities and Constraints

- All current metrics, conversations, and KPI figures are mock/demo data — there is no production data yet to preserve or reference as ground truth.
- The 10 configured NLP intents (`booking.tour`, `pricing.info`, `guide.availability`, `general.info`, `location.directions`, `camping.info`, `waterfall.info`, `hours.info`, `greeting`, `farewell`) and their canned Spanish answers are real product content already written into the backend — treat them as authoritative source text, not placeholder copy.
- No stated connectivity or low-end-device constraint beyond ordinary responsive/accessible web practice — no special low-bandwidth or offline mode is required.

## Brand Commitments

No official logo or brand identity exists for Ecoturismo La Yeguada OBC. The original "forest / nature" palette and Plus Jakarta Sans + DM Serif Display pairing were a first pass, not a mandate — the user explicitly asked (2026-08-24) to move away from it because it read as generic/AI-generated and not elegant.

**Standing visual preference (confirmed 2026-08-24):** the admin dashboard should sit alongside Linear, Stripe, and Vercel's dashboards in craft level — restrained neutrals, one committed accent, precise typography and spacing, hairline structure, no gradients, no glassmorphism, no generic AI icon tiles. This is the canon reference for the whole dashboard (sidebar, topbar, chat panel, and all five pages); functionality, data, and content stay exactly as they are, but full freedom was granted over layout/structure to reach that craft level.

## Evidence on Hand

- Backend source (`yeguada-backend/server.js`) contains the real, final Spanish copy for every chatbot intent/answer — usable as authentic content in dashboard mockups (e.g., knowledge base entries, conversation examples).
- No real screenshots, testimonials, case studies, or production metrics exist. Do not fabricate any of these; all example data in the UI is explicitly mock/demo data and should read as illustrative, not as real activity.

## Product Principles

1. Built for a non-technical community organization first — clarity and low cognitive load outrank feature density or technical sophistication.
2. Trustworthy at a glance — because visitor-facing chat quality is invisible to staff except through this dashboard, the KPIs, resolution/escalation rates, and conversation monitoring must be legible and unambiguous.
3. Demo mode is a first-class state, not a degraded fallback — the dashboard must work and look complete without the backend running, since that's the mode a thesis committee is most likely to see.
4. Content authenticity — use the real intents/answers already defined in the backend rather than inventing new fictional copy when examples are needed.
5. Academic rigor meets real-world readiness — the system should read as production-credible, not as a class exercise, since it is scoped to be genuinely adoptable by the OBC.

## Accessibility & Inclusion

No standard beyond ordinary web accessibility best practice was specified; no product-specific accessibility requirement was established.
