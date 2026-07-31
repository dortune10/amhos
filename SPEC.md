# AMHOS Prototype — Technical Spec

**Purpose:** a working web-based prototype demonstrating the AMHOS hackathon golden path end-to-end, for the Vibe Code Marathon demo. This spec is derived from `AMHOS_PRD.md` (full product requirements) and `AMHOS_Idea_Refine.md` (NGO–hospital partnership framing) — read those for rationale; this file is the build-ready subset.

## Why a web prototype, not React Native

`AMHOS_PRD.md` decided React Native for the real mobile client. Building an actual RN app requires a simulator/device toolchain this session isn't set up for. This prototype uses a **React + TypeScript + Vite web app** that simulates the same offline-first behavior in the browser (local storage as the "device," a synced store as the "cloud," an explicit Airplane Mode toggle). This is an explicit, disclosed substitution — not a silent scope change — and should be called out as such in the actual hackathon demo.

## Tech Stack

- React + TypeScript + Vite (fast dev server, browser-previewable)
- Vitest + React Testing Library for tests
- No backend server — two localStorage-backed stores simulate device-local vs. synced-cloud data (see Data Layer)
- No routing library — a simple role switcher (Caseworker / Facility / District) drives which screen renders

## Data Layer (simulates offline-first + sync)

Two persisted stores, both in `localStorage`:
- `chw_local_queue` — the caseworker's on-device data. All registrations/check-ins write here **first**, always, regardless of "connectivity" state.
- `cloud_synced_store` — represents the backend/facility-visible data. Only updated when "Sync Now" is triggered.

**Airplane Mode toggle:** when ON, "Sync Now" is disabled and a banner explains why (this is the honest stand-in for real offline detection — a browser can't actually simulate lost connectivity to itself). When OFF, "Sync Now" copies all un-synced items from `chw_local_queue` into `cloud_synced_store`, stamping each with `syncedAt`.

## Data Model (TypeScript types)

```ts
type RiskTier = 'Low' | 'Medium' | 'High';

interface Registration {
  id: string;
  patientName: string;
  gestationalAgeWeeks: number;
  riskFactors: string[];       // ids from RISK_FACTORS
  riskTier: RiskTier;
  riskReasons: string[];       // human-readable, from triggered factors
  createdAt: string;           // ISO timestamp
  syncedAt?: string;
}

interface Referral {
  id: string;
  registrationId: string;
  patientName: string;
  riskFactors: string[];
  riskReasons: string[];
  gestationalAgeWeeks: number;
  status: 'flagged' | 'dispatched' | 'received' | 'outcome_logged';
  createdAt: string;
  syncedAt?: string;
}

interface MotherCheckIn {
  id: string;
  registrationId: string;
  patientName: string;
  symptom: string;             // from a fixed pick-list, no free text
  createdAt: string;
  reviewed: boolean;
  escalated: boolean;
  syncedAt?: string;
}

interface WhatsAppNotification {
  id: string;
  kind: 'referral_alert' | 'checkin_alert';
  targetRole: 'facility' | 'caseworker';
  message: string;
  createdAt: string;
}
```

## Risk Engine (from `AMHOS_PRD.md` §6a — NOT clinically validated, hackathon placeholder)

Pure function: `scoreRisk(riskFactorIds: string[]): { tier: RiskTier; reasons: string[] }`

**Tier 3 — red-flag factors (any ONE present → High, overrides everything):**
`active_bleeding`, `severe_abdominal_pain`, `convulsions_eclampsia_history`, `severe_hypertension`, `obstructed_labor_signs`, `malpresentation_at_term`

**Tier 2 — moderate factors (0 → Low, 1 → Medium, ≥2 → High):**
`adolescent_pregnancy`, `prior_csection`, `hypertension_non_severe`, `prior_pph`, `grand_multipara`, `short_interpregnancy_interval`, `multiple_gestation`, `advanced_maternal_age`

Scoring logic:
1. If any Tier 3 factor present → tier = High. Reasons = all present Tier 3 factor labels.
2. Else count Tier 2 factors present. 0 → Low (reasons = []). 1 → Medium (reasons = that factor's label). ≥2 → High (reasons = all present Tier 2 factor labels).

## Screens & Requirements

### 1. Role switcher (header)
Three buttons: Caseworker / Facility / District. No real auth — this satisfies PRD P0 #7 (minimal role separation).

### 2. Caseworker view
- **New Registration form** — patient name, gestational age, risk-factor checklist (Tier 2 + Tier 3 factors as checkboxes with plain-language labels). On submit: write to `chw_local_queue`, run `scoreRisk`, show the resulting tier + reasons immediately (works with no dependency on Sync — this is the offline-first guarantee). If tier === 'High', auto-create a Referral (status `flagged`) in the same local queue.
- **Caseload view** — list of all registrations in `chw_local_queue` (plus synced ones), sorted: unsynced-and-high-risk first, then by date. Shows tier badge and sync status per row. (PRD P0 #8)
- **Mother check-ins inbox** — list of `MotherCheckIn` records (seeded/simulated — see Task list) against caseworker's patients; each has a "Mark reviewed" and "Escalate to referral" action. Escalating creates a Referral linked to that registration. (PRD top-priority P1)
- **Sync controls** — Airplane Mode toggle + "Sync Now" button + a visible count of pending (unsynced) items.

### 3. Facility view
- **Incoming referral queue** — reads only from `cloud_synced_store`, sorted by risk tier then recency. Each row shows patient name, gestational age, risk tier + reasons, current status.
- **Status update** — button(s) to advance a referral's status: flagged → dispatched → received → outcome_logged.
- **WhatsApp-style notification feed** — a chat-bubble-styled list of `WhatsAppNotification` records with `targetRole: 'facility'`, newest first. A notification is appended whenever a referral syncs into the cloud store.

### 4. District view (stretch — only if time remains after 1-3)
- Aggregate counts: total registrations, count by risk tier, count of referrals by status. Read-only, no patient-level detail (per PRD access-control requirement).

## Explicitly Out of Scope for this Prototype

- Real React Native / mobile app — see rationale above.
- Real WhatsApp Business API — the notification feed and mother check-ins are simulated UI, not real messages.
- Real backend/database/multi-device sync — localStorage in one browser stands in for "device" and "cloud."
- ML risk layer, FHIR/OpenHIE/DHIS2 integration, real SMS/USSD gateway, national ID logic, real auth, incentive/payment tracking — all deferred per `AMHOS_PRD.md` Non-Goals / Phase 2-3.
- Free-text/NLP parsing of mother check-ins — fixed pick-list only.

## Acceptance Criteria (top-level, per-task criteria live in `tasks/plan.md`)

- [ ] A registration can be created with the device in "Airplane Mode" and immediately shows a risk tier with reasons, no network dependency.
- [ ] A High-risk registration auto-creates a referral, visible in the caseworker's local queue before any sync.
- [ ] Toggling off Airplane Mode and clicking "Sync Now" moves pending items into the facility-visible store, and a WhatsApp-style notification appears.
- [ ] The facility view never shows unsynced data — it only reads from `cloud_synced_store`.
- [ ] A mother check-in can be escalated into a referral by the caseworker.
- [ ] All risk-engine scoring logic is covered by unit tests matching the rules in this spec.
