# src/

Source for the AMHOS prototype. See the [repo README](../../README.md) for the full project overview, scope notes, and a demo walkthrough.

## Layout

- **`data/`** — types + two `localStorage`-backed stores: `chw_local_queue` (offline device data) and `cloud_synced_store` (synced/facility-visible data).
- **`domain/`** — the risk-scoring engine and its rule definitions, plus small shared helpers (id generation, check-in symptom list).
- **`features/`** — one folder per screen/capability, each owning its own components, logic, and tests:
  - `registration/`, `caseload/`, `checkins/`, `sync/` — caseworker side
  - `facility/`, `notifications/` — facility side
  - `district/` — read-only aggregate view
  - `layout/` — the Caseworker/Facility/District role switcher
- **`App.tsx`** — composes everything behind the role switcher.

## Notes

- No backend — everything reads/writes the two `localStorage` stores in `data/store.ts`.
- The risk engine (`domain/riskEngine.ts`) is a prototype placeholder, not clinically validated.
- Tests sit next to the code they cover (`*.test.ts` / `*.test.tsx`).
