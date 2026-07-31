# AMHOS — AI Maternal Health Operating System

A prototype built for the **Vibe Code Marathon** hackathon: an offline-first coordination layer connecting community health workers (caseworkers), pregnant women, and hospitals around a single, risk-aware maternal care pathway.

## What this is

Maternal and newborn deaths are often caused by coordination failure, not a single clinical failure: a high-risk pregnancy flagged in the field that never reaches a hospital, or a mother lost to follow-up in the days after birth. AMHOS is a coordination layer that:

- lets a caseworker register a pregnancy and get an **instant, explainable risk flag** — fully offline, on-device
- **auto-generates a referral** the moment a case is flagged high-risk
- gives the receiving hospital **advance visibility** into incoming referrals, with a WhatsApp-style alert
- lets a mother send a **structured WhatsApp-style check-in** between visits, which the caseworker can escalate into a referral
- gives district-level stakeholders a **read-only aggregate view** — no patient-level data at that tier

## What's in this folder

This is a web-based prototype (React + TypeScript + Vite) that demonstrates the full workflow above end-to-end in a browser. See the [top-level README](../README.md) for a short project summary.

**Important scope note:** the production plan calls for a React Native mobile client for caseworkers. This prototype is a **disclosed substitution** — a web app that simulates the same offline-first behavior (a local "device" store and a separate "synced cloud" store, both backed by `localStorage`, with an explicit Airplane Mode toggle standing in for real connectivity loss) rather than the real thing. It's built to prove the workflow and risk logic, not to be the final mobile client.

Also explicitly mocked for this prototype:
- **WhatsApp integration** — notifications and mother check-ins are simulated UI, not a real WhatsApp Business API integration.
- **Risk scoring** — the rules-based risk engine is a placeholder set of clinical thresholds and is **not clinically validated**. It needs review by a qualified clinical advisor before informing any real triage decision.
- **Backend/sync** — there is no real server; two `localStorage` collections in one browser stand in for a caseworker's device and the hospital's synced cloud store.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to `http://localhost:5173`).

Run the test suite:

```bash
npm test
```

Build for production:

```bash
npm run build
```

## Demo walkthrough

1. **Caseworker tab** (default): Airplane Mode is on by default. Register a patient and check a risk factor like "Active vaginal bleeding" — the risk tier and reasons appear instantly, with no network dependency, and a referral is auto-created if the tier is High.
2. Your caseload lists the patient with a "Pending sync" badge.
3. Turn off **Airplane Mode** and click **Sync Now** — the referral moves to the synced store and a WhatsApp-style notification is generated.
4. Switch to the **Facility** tab — the referral appears with its risk context, and you can advance its status (flagged → dispatched → received → outcome logged).
5. Back in the Caseworker tab, use **Mother check-ins** to simulate a WhatsApp-style check-in against a registered patient, and escalate it into a new referral.
6. Switch to the **District** tab for a read-only aggregate view — counts only, no patient names.

## Tech stack

- React + TypeScript + Vite
- Vitest + React Testing Library
- No backend — `localStorage`-backed stores simulate offline-device vs. synced-cloud data

## Project structure

```
src/
├── data/          # types + localStorage-backed stores (local queue, cloud sync)
├── domain/        # risk engine, risk factor definitions, id generation
└── features/
    ├── registration/   # caseworker: new patient registration + risk scoring
    ├── caseload/        # caseworker: patient list / worklist
    ├── checkins/         # caseworker: mother WhatsApp check-in inbox + escalation
    ├── sync/               # caseworker: Airplane Mode + Sync Now
    ├── facility/            # facility: incoming referral queue + status controls
    ├── notifications/         # facility: WhatsApp-style alert feed
    ├── district/               # district: read-only aggregate view
    └── layout/                  # role switcher
```
