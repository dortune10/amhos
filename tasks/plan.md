# Implementation Plan: AMHOS Web Prototype

## Overview
Build a React + TypeScript + Vite web prototype of the AMHOS hackathon golden path: offline-first caseworker registration → deterministic risk flag → auto-referral → sync → facility dashboard, plus the mother-check-in and WhatsApp-notification stretch features from the NGO–hospital partnership framing. Source of truth for requirements: `SPEC.md`.

## Architecture Decisions
- Two localStorage-backed stores (`chw_local_queue`, `cloud_synced_store`) simulate offline device vs. synced cloud — no real backend for this prototype (see `SPEC.md`).
- Risk engine is a pure, fully unit-tested function — it's the one piece of business logic with unambiguous acceptance criteria, so it's built test-first.
- No routing library — a role switcher (Caseworker/Facility/District) drives which top-level view renders; state lives in React state + the localStorage stores, no global state library needed at this scale.
- Vitest + React Testing Library for tests, matching the Vite scaffold already in place.

## Task List

### Phase 1: Foundation

#### Task 1: Data types and typed localStorage store utility
**Description:** Define the shared TypeScript types (`Registration`, `Referral`, `MotherCheckIn`, `WhatsAppNotification`) and a small typed wrapper around localStorage providing get/set/append for the two named collections (`chw_local_queue`, `cloud_synced_store`), each holding registrations, referrals, and check-ins.

**Acceptance criteria:**
- [ ] Types match `SPEC.md`'s Data Model section exactly.
- [ ] Store utility can append and read back a record without data loss across a simulated reload (re-instantiate the utility, re-read).
- [ ] Store utility exposes separate accessors for the local-queue store and the cloud-synced store — no way to accidentally read/write the wrong one via a shared key.

**Verification:**
- [ ] Tests pass: `npm test -- store`
- [ ] Build succeeds: `npm run build`

**Dependencies:** None

**Files likely touched:**
- `app/src/data/types.ts`
- `app/src/data/store.ts`
- `app/src/data/store.test.ts`

**Estimated scope:** Small

---

#### Task 2: Risk engine (TDD)
**Description:** Implement `scoreRisk(riskFactorIds: string[])` exactly per `SPEC.md` §Risk Engine — red-flag override (any Tier 3 factor → High) then Tier 2 accumulation (0→Low, 1→Medium, ≥2→High), always returning the human-readable reasons that triggered the tier.

**Acceptance criteria:**
- [ ] Any single Tier 3 factor alone yields High, regardless of Tier 2 factors present or absent.
- [ ] Zero Tier 2 factors (and no Tier 3) yields Low with empty reasons.
- [ ] Exactly one Tier 2 factor yields Medium with that factor's reason.
- [ ] Two or more Tier 2 factors yields High with all triggering reasons listed.
- [ ] Unknown/unrecognized factor ids are ignored, not thrown on.

**Verification:**
- [ ] Tests pass: `npm test -- riskEngine`
- [ ] Build succeeds: `npm run build`

**Dependencies:** None (can run in parallel with Task 1)

**Files likely touched:**
- `app/src/domain/riskEngine.ts`
- `app/src/domain/riskEngine.test.ts`
- `app/src/domain/riskFactors.ts` (the Tier 2/3 factor id → label lists)

**Estimated scope:** Small

### Checkpoint: Foundation
- [ ] All tests pass
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Review before proceeding to Phase 2

---

### Phase 2: Core Golden Path (Caseworker side)

#### Task 3: Registration form with instant risk scoring + auto-referral
**Description:** A form (patient name, gestational age, risk-factor checklist) that on submit writes a `Registration` to `chw_local_queue`, runs `scoreRisk`, displays the tier + reasons immediately, and — if tier is High — also writes a linked `Referral` (status `flagged`) to the same local queue. Must work with no network/fetch calls at all (offline-first by construction, not by feature-flag).

**Acceptance criteria:**
- [ ] Submitting the form with only Tier 3/Tier 2 factors selected produces the correct tier per the risk engine, displayed with reasons.
- [ ] A High-risk submission results in exactly one new `Referral` with status `flagged`, linked to the registration's id.
- [ ] A Low/Medium-risk submission creates no referral.
- [ ] The new registration appears in `chw_local_queue` immediately (verifiable by reading the store directly in a test, not just the UI).

**Verification:**
- [ ] Tests pass: `npm test -- RegistrationForm`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: submit a registration with 2 moderate risk factors in the browser, confirm a "High" badge and a referral appears in the caseload view (Task 4).

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `app/src/features/registration/RegistrationForm.tsx`
- `app/src/features/registration/RegistrationForm.test.tsx`

**Estimated scope:** Medium

---

#### Task 4: Caseworker caseload view
**Description:** A list view reading all registrations from `chw_local_queue` (plus any already-synced ones from `cloud_synced_store` so nothing "disappears" after sync), sorted unsynced-and-high-risk first, then by recency. Each row shows patient name, gestational age, risk tier badge, and sync status.

**Acceptance criteria:**
- [ ] A newly-submitted registration (Task 3) appears in this list without a page reload.
- [ ] Sort order places unsynced High-risk registrations first.
- [ ] Each row visibly distinguishes synced vs. unsynced state.

**Verification:**
- [ ] Tests pass: `npm test -- CaseloadView`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1, Task 3

**Files likely touched:**
- `app/src/features/caseload/CaseloadView.tsx`
- `app/src/features/caseload/CaseloadView.test.tsx`

**Estimated scope:** Small

---

#### Task 5: Sync controls (Airplane Mode + Sync Now)
**Description:** An Airplane Mode toggle and a "Sync Now" button with a live pending-item count. When Airplane Mode is on, Sync Now is disabled with an explanatory banner. Triggering sync copies all unsynced registrations and referrals from `chw_local_queue` into `cloud_synced_store` (stamping `syncedAt`), and appends a `WhatsAppNotification` (kind `referral_alert`, targetRole `facility`) for each referral that just synced.

**Acceptance criteria:**
- [ ] With Airplane Mode on, clicking Sync Now has no effect and the button is disabled.
- [ ] With Airplane Mode off, Sync Now moves every unsynced record into the cloud store and updates the pending count to zero.
- [ ] Exactly one `WhatsAppNotification` is created per referral that syncs (not per registration).
- [ ] Data already in `cloud_synced_store` is never duplicated on a second sync.

**Verification:**
- [ ] Tests pass: `npm test -- syncService`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: register a high-risk patient in Airplane Mode, confirm Sync Now is disabled, turn Airplane Mode off, sync, and confirm the facility view (Task 6) now shows the referral.

**Dependencies:** Task 1, Task 3

**Files likely touched:**
- `app/src/domain/syncService.ts`
- `app/src/domain/syncService.test.ts`
- `app/src/features/sync/SyncControls.tsx`

**Estimated scope:** Medium

### Checkpoint: Core Golden Path (Caseworker side)
- [ ] All tests pass, build succeeds
- [ ] Manual walkthrough: airplane-mode registration → high-risk flag with reasons → referral created → sync → pending count clears
- [ ] Review before proceeding to facility side

---

### Phase 3: Facility Side

#### Task 6: Facility referral queue
**Description:** A view reading only from `cloud_synced_store`, listing referrals sorted by risk tier then recency, showing patient name, gestational age, risk tier + reasons, and current status. Must never read from `chw_local_queue` — this is the enforced boundary from `SPEC.md`.

**Acceptance criteria:**
- [ ] Referrals synced in Task 5 appear here with correct risk context.
- [ ] Unsynced referrals never appear here (test this directly, not just by omission).
- [ ] Sort order: High before Medium before Low, most recent first within a tier.

**Verification:**
- [ ] Tests pass: `npm test -- ReferralQueue`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1, Task 5

**Files likely touched:**
- `app/src/features/facility/ReferralQueue.tsx`
- `app/src/features/facility/ReferralQueue.test.tsx`

**Estimated scope:** Small

---

#### Task 7: Referral status lifecycle controls
**Description:** Buttons on each referral row to advance its status forward through flagged → dispatched → received → outcome_logged, writing the update back to `cloud_synced_store`.

**Acceptance criteria:**
- [ ] Each status can only advance forward (no skipping backward via the UI).
- [ ] Status changes persist across a re-render (read back from the store).

**Verification:**
- [ ] Tests pass: `npm test -- ReferralStatus`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 6

**Files likely touched:**
- `app/src/features/facility/ReferralQueue.tsx` (extended)
- `app/src/features/facility/ReferralQueue.test.tsx` (extended)

**Estimated scope:** Small

---

#### Task 8: WhatsApp-style notification feed (facility)
**Description:** A chat-bubble-styled feed of `WhatsAppNotification` records where `targetRole === 'facility'`, newest first, populated by the sync action from Task 5.

**Acceptance criteria:**
- [ ] A notification appears immediately after a sync that includes a referral.
- [ ] Feed is empty (with an empty state) before any sync has happened.

**Verification:**
- [ ] Tests pass: `npm test -- NotificationFeed`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 5

**Files likely touched:**
- `app/src/features/notifications/NotificationFeed.tsx`
- `app/src/features/notifications/NotificationFeed.test.tsx`

**Estimated scope:** Small

### Checkpoint: Facility Side
- [ ] All tests pass, build succeeds
- [ ] Full golden path demoable end-to-end in the browser
- [ ] Review before proceeding to mother check-ins and wiring

---

### Phase 4: Mother Check-ins, Role Switcher, Wiring

#### Task 9: Mother check-in inbox with escalation
**Description:** A caseworker-facing inbox of `MotherCheckIn` records (seeded with a few simulated check-ins against existing registrations, since there's no real WhatsApp intake) with "Mark reviewed" and "Escalate to referral" actions. Escalating creates a new `Referral` (status `flagged`) linked to that registration and, per Task 5's pattern, should be reflected the next time a sync runs.

**Acceptance criteria:**
- [ ] Seeded check-ins appear against the correct patient by name.
- [ ] "Mark reviewed" toggles `reviewed` and persists.
- [ ] "Escalate to referral" creates exactly one referral in `chw_local_queue`, marks the check-in `escalated`, and is idempotent (escalating twice does not create two referrals).

**Verification:**
- [ ] Tests pass: `npm test -- CheckInInbox`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1, Task 3

**Files likely touched:**
- `app/src/features/checkins/CheckInInbox.tsx`
- `app/src/features/checkins/CheckInInbox.test.tsx`
- `app/src/data/seedData.ts`

**Estimated scope:** Medium

---

#### Task 10: Role switcher and top-level app wiring
**Description:** Compose everything into `App.tsx` behind a Caseworker/Facility/District role switcher. Caseworker role shows Registration form + Caseload + Check-in inbox + Sync controls. Facility role shows Referral queue + Notification feed. District is a placeholder until Task 11.

**Acceptance criteria:**
- [ ] Switching roles changes the rendered view without losing store state.
- [ ] The full golden path (register → flag → refer → sync → facility sees it + notification) works via the composed UI, not just individual component tests.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: full walkthrough in the browser dev server per `SPEC.md`'s top-level acceptance criteria.

**Dependencies:** Tasks 3, 4, 5, 6, 7, 8, 9

**Files likely touched:**
- `app/src/App.tsx`
- `app/src/features/layout/RoleSwitcher.tsx`

**Estimated scope:** Medium

### Checkpoint: Fully Wired Prototype
- [ ] All tests pass, build succeeds
- [ ] Every acceptance criterion in `SPEC.md`'s top-level list verified manually in the browser
- [ ] Review before polish phase

---

### Phase 5: Polish (stretch, only if time remains)

#### Task 11: District aggregate view
**Description:** Read-only aggregate counts (total registrations, count by risk tier, count of referrals by status) from `cloud_synced_store` only — no patient-level detail, per the access-control requirement in `AMHOS_PRD.md`.

**Acceptance criteria:**
- [ ] Counts update correctly after a sync.
- [ ] No patient name or identifying detail is rendered in this view.

**Verification:**
- [ ] Tests pass: `npm test -- DistrictView`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 6

**Files likely touched:**
- `app/src/features/district/DistrictView.tsx`
- `app/src/features/district/DistrictView.test.tsx`

**Estimated scope:** Small

---

#### Task 12: Visual polish pass
**Description:** Styling for a mobile-esque caseworker view vs. a desktop-esque facility dashboard, offline/airplane-mode banners, empty states, and general visual coherence. No new business logic.

**Acceptance criteria:**
- [ ] All existing tests still pass (no behavior change).
- [ ] Caseworker view is visually distinct as a "field tool"; facility view reads as a "dashboard."

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual visual check in the browser.

**Dependencies:** Task 10

**Files likely touched:** CSS/styling across `app/src/features/**`

**Estimated scope:** Medium

### Checkpoint: Complete
- [ ] All acceptance criteria in `SPEC.md` met
- [ ] Ready for hackathon demo rehearsal

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage-only "sync" reads as too simplistic for judges | Medium | Demo narration explicitly frames it as a disclosed prototype substitution for real device/cloud sync, per `SPEC.md` |
| Scope creep into real WhatsApp/backend integration mid-build | Medium | `SPEC.md`'s Out of Scope section is the guardrail — re-check it before adding anything not in this plan |
| Risk engine test cases don't match `AMHOS_PRD.md` §6a exactly | High (breaks the one clinically-flavored piece) | Task 2's acceptance criteria are written directly from §6a; verify against that section, not from memory |

## Open Questions
- None blocking — all prototype-scope questions are resolved in `SPEC.md`'s Out of Scope section. Product-level open questions (buyer fit, real WhatsApp integration, clinical validation) remain tracked in `AMHOS_PRD.md` §8 and are explicitly not this prototype's concern.
