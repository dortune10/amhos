# AMHOS — Product Requirements Document
### AI Maternal Health Operating System — Hackathon MVP + Phased v1 Roadmap

**Source documents:** `AMHOS-HEALTH.pdf` (Vibe Code Marathon brief), `AMHOS_Technical_Architecture.md`, `AMHOS_Positioning.md`
**Scope of this PRD:** A tightly-scoped hackathon build (Part A), plus a phased roadmap toward the full production architecture described in the technical architecture doc (Part B).

**Strategic framing update:** Following an ideation pass (see `AMHOS_Idea_Refine.md`), this PRD folds in a "CHW operating system" framing — the caseload/task view is promoted to a P0 requirement — plus a WhatsApp layer as an add-on channel (not a replacement for the offline-first native app). The buyer/go-to-market model is now confirmed: **an NGO, partnering directly with hospitals**, whose caseworkers (this PRD's "CHW" role) manage the portal. The WhatsApp layer covers two directions: outbound facility notifications (Section 6, P1) and, new since the last revision, inbound mother self-reported check-ins that route into the portal for caseworker triage (Section 6, top-priority P1) — see Sections 4, 5, and 8.

---

## 1. Problem Statement

Maternal and newborn deaths in much of Africa are rarely caused by a single clinical failure — they're caused by coordination failure: a high-risk pregnancy flagged by a community health worker (CHW) that never reaches a clinic, a referral that arrives with no context, or a mother lost to follow-up in the 48 hours after birth, when most postpartum deaths occur. Existing tools (paper registers, SMS chains, disconnected apps) don't talk to each other, don't work offline, and give district health officers only delayed, retrospective data. The cost of not solving this is measured in preventable maternal and newborn mortality.

## 2. Goals

**Hackathon demo goals:**
1. Demonstrate the core mortality-prevention loop end-to-end: CHW registers a pregnancy offline → risk is flagged with visible reasoning → a referral is auto-generated and becomes visible to a receiving facility before the patient arrives.
2. Prove the offline-first claim live — the CHW flow must work with zero connectivity, then sync.
3. Make risk stratification explainable, not a black box, to a non-technical judge or clinician.
4. Demonstrate a CHW task/caseload view — not just a single-patient referral form — so the platform reads as an operating system for the CHW's day, not a one-off form.

**Product goals (post-hackathon v1):**
1. Every registered pregnancy is triaged and has a documented care pathway (no drop-offs between CHW and facility).
2. Reduce referral-to-arrival delay by giving facilities advance visibility into incoming risk.
3. Give district/national stakeholders real-time (not quarterly) operational visibility.
4. Increase CHW engagement and retention by tying the platform to their daily workflow — and, longer-term, their incentive/pay — rather than adding a disconnected reporting burden.

## 3. Non-Goals

- **Multi-language / multi-country localization** — single locale for the demo; real localization is a pilot-country decision, not a hackathon concern.
- **Real integration with any national HMIS, DHIS2 instance, or OpenHIE registry** — the architecture doc itself flags data-sharing agreements as the longest lead-time item in the whole program, not an engineering task. MVP uses a local/mocked dashboard instead.
- **ML-based risk scoring** — the architecture doc explicitly scopes ML as an advisory, cloud-side, *future* refinement layer with clinical governance requirements. The deterministic rules layer is the actual v1 (and MVP) risk engine.
- **Real SMS/USSD gateway integration** (e.g., Africa's Talking) — simulated/mocked for the demo; real integration is a Phase 2 item requiring a vendor relationship.
- **Formal regulatory compliance (Nigeria's NDPR)** — the MVP will follow reasonable security practices but will not pursue certification before a real pilot.
- **iOS client** — architecture doc specifies Android-first for CHW hardware reality; iOS is not on the roadmap for the initial pilot persona.
- **Real WhatsApp Business API integration** — both the facility notification and the mother check-in intake (see `AMHOS_Idea_Refine.md`) are demoed via mocked/simulated messages for the hackathon; real API approval and message-template review have lead times that exceed the marathon window.
- **Free-text/NLP symptom parsing on mother check-ins** — the hackathon mock uses a simplified structured check-in (a short pick-list, not open conversational text); real natural-language intake and triage logic is a Phase 2/3 item, not a hackathon concern.
- **CHW incentive/payment tracking** — a real payment rail (e.g., mobile money disbursement) is out of scope; the caseload view may gesture at the concept (e.g., a visit counter) but no real payment logic is built.

## 4. Chosen MVP Workflow

Of the value pillars in the positioning doc, the one that most directly demonstrates "coordination failure → coordination success" in a single demoable path is:

> **CHW registration → rules-based risk flag → auto-generated referral → facility receives advance visibility**

This single path touches three of the five value pillars (reduce mortality, strengthen CHW↔facility coordination, cut referral delay) and requires the least amount of infrastructure to fake convincingly (no ML, no real SMS gateway, no national HMIS integration).

**Framing note:** this golden path is now wrapped inside a broader "CHW operating system" positioning rather than presented as a single-patient form — the CHW's view of the golden path sits inside a caseload/task list (Section 6, P0), and referral creation additionally fires a mocked WhatsApp-style notification to the facility (Section 6, P1). See `AMHOS_Idea_Refine.md` for the full reasoning behind this framing shift.

**Confirmed real-world model (NGO–hospital partnership):** an NGO partners directly with hospitals; NGO caseworkers (the "CHW" role above) manage the portal; and pregnant women send WhatsApp updates between scheduled visits, which route into the portal against their case. The caseworker triages these updates and coordinates directly with the partner hospital when something concerning develops — the same coordination loop as the referral flow above, with an additional inbound channel from the mother herself.

> **Design tension, resolved deliberately:** the mother's WhatsApp channel is *supplementary and best-effort* — it depends on her having phone/data access, a different reliability profile than the caseworker's guaranteed offline-first field capture. It enriches the record between visits; it does not replace the offline-first registration and risk-flagging loop, which remains the system's one guaranteed core path.

## 5. User Stories

**Pregnant woman**
- As a pregnant woman, I want my risk factors captured at first contact so that I'm flagged for extra attention before a complication occurs, not after.
- As a pregnant woman, I want to send a quick update via WhatsApp about how I'm feeling between scheduled visits so that my caseworker and the partner hospital know if something changes before my next check.

**Community Health Worker / NGO Caseworker (CHW)**
- As a caseworker, I want to register a new pregnancy on my phone with zero network connectivity so that a lack of signal never blocks my work.
- As a caseworker, I want the app to tell me *why* a case is flagged high-risk (not just a score) so that I trust the flag and can explain it to the mother and the receiving facility.
- As a caseworker, I want a high-risk registration to automatically create a referral so that I don't have to remember to escalate manually.
- As a caseworker, I want to see that my offline entries synced successfully so that I know the facility actually received the case.
- As a caseworker, I want to see all my active cases and upcoming scheduled checks (ANC/postnatal) in one list so that the app functions as my daily worklist, not just a single-patient form.
- As a caseworker, I want mother-reported WhatsApp updates to appear in my portal against her case so that I can decide whether to escalate to the partner hospital.

**Facility / Clinic Staff (Hospital Partner)**
- As facility staff, I want to see incoming referrals with the patient's risk factors and gestational age before the patient arrives so that I can prepare rather than react.
- As facility staff, I want to update a referral's status (received, outcome logged) so that the system reflects what actually happened, not just what was dispatched.
- As facility staff, I want to see referrals that are taking longer than expected so that I can flag a possible transport problem.
- As facility staff, I want a WhatsApp-style notification when a high-risk referral is created so that I'm alerted even if I haven't opened the dashboard yet.
- As facility staff, I want to see any caseworker-escalated mother updates alongside the referral record so that I understand what changed before the patient arrives.

**District/National Admin** (P1, lightweight in MVP)
- As a district admin, I want a live count of registrations and risk distribution so that I have more than a quarterly report to act on.

**Edge cases to cover:**
- CHW submits a registration offline, then the sync fails or is interrupted — the record must not be lost or silently duplicated.
- A registration has conflicting risk factors entered by two different actors (CHW update + facility update) — must not silently overwrite either.
- A referral is created with no receiving facility identifiable — system must surface this rather than fail silently.
- A mother sends a WhatsApp update but connectivity/timing means her caseworker doesn't see it promptly — the update must be visibly timestamped and queued in the portal, not silently dropped or lost.

## 6. Requirements

### Must-Have (P0) — the demo does not work without these
1. **Offline-capable CHW registration form** — captures patient identifier, gestational age, and the fixed risk-factor checklist defined in section 6a (draft, pending clinical validation). Writes to local storage first; UI never blocks on network.
   - *Acceptance:* Given the device has no network connection, when a CHW submits a registration, then the record is saved locally and visibly confirmed to the CHW.
2. **Deterministic rules-based risk engine**, running fully on-device. Evaluates the checklist against a fixed rule set and outputs a risk tier (Low/Medium/High) plus the specific contributing factors.
   - *Acceptance:* Given a registration with ≥1 defined high-risk factor, when risk is evaluated, then the output includes the risk tier and a human-readable list of which factors triggered it.
3. **Auto-generated referral on High risk** — creates a referral record (patient info, risk factors, gestational age, timestamp) with a status field, without requiring manual CHW action.
   - *Acceptance:* Given a registration is scored High risk, when scoring completes, then a referral record exists with status "flagged."
4. **Referral status lifecycle** — flagged → dispatched → received → outcome logged, minimally as a manually-advanced status in the demo.
5. **Facility dashboard: incoming referral queue** — shows referrals with patient risk context, sorted by recency/urgency.
   - *Acceptance:* Given a referral is created on the CHW side and synced, when facility staff open the dashboard, then the referral appears with its risk factors visible without needing to open a separate record.
6. **Sync demonstration** — an explicit "sync" action pushes the local CHW queue to the facility-visible store, proving offline-first without requiring real network-loss simulation.
7. **Minimal role separation** — CHW view vs. facility view, even if login is simplified to a role picker rather than real auth.
8. **CHW task/caseload view** — shows all active registrations plus upcoming scheduled checks (ANC/postnatal) in one list, establishing the platform as a daily worklist rather than a single-patient form.
   - *Acceptance:* Given a CHW has multiple registered patients, when they open the caseload view, then all active cases and upcoming scheduled checks are visible in one list, sorted by urgency/date.

### Nice-to-Have (P1) — fast follows if time allows within the marathon
- **District aggregate view** — simple counts by risk tier and referral status.
- **Timeline SLA flag** — visually flags a referral once it exceeds an expected transit time.
- **Simulated SMS fallback notification** — mocked message shown/logged when "sync" is simulated as failed, demonstrating the fallback concept without a real gateway.
- **Basic conflict-resolution demo** — show two concurrent edits to the same record preserved as an append-only event log rather than one overwriting the other.
- **WhatsApp-style notification (mocked)** — a simulated WhatsApp-format alert fires when a referral is created, demonstrating the notification-layer concept from `AMHOS_Idea_Refine.md` without real Business API integration.
- **Mother WhatsApp check-in intake (mocked) — top-priority P1:** a simulated structured check-in (e.g., "feeling dizzy," "swelling," "all fine") appears as a message against the mother's case in the caseworker's portal view; the caseworker can mark it reviewed or escalate it toward a referral. This is the concrete demonstration of the NGO–hospital partnership model and should be prioritized above the other P1 items if time is tight.
   - *Acceptance:* Given a mother's case exists in the portal, when a simulated WhatsApp check-in is submitted, then it appears against her case, timestamped, and the caseworker can mark it reviewed or escalate it.

### Future Considerations (P2) — explicitly out of scope for hackathon, but the data model should not preclude them
- Real FHIR-compliant API layer and OpenHIE-aligned client/facility/terminology registries.
- DHIS2 connector for aggregate indicator push.
- Advisory ML risk-scoring layer with a retraining loop and clinical governance.
- Real SMS/USSD gateway integration.
- National ID reconciliation logic for varying country ID infrastructure.
- Full audit logging and formal data-protection compliance (NDPR/DPA-class).
- Containerized, region-hosted cloud deployment.
- Real WhatsApp Business API integration, replacing the hackathon's mocked notification.
- CHW incentive/payment tracking tied to caseload/visit logging, pending validation of the engagement-hook assumption in `AMHOS_Idea_Refine.md`.

## 6a. Draft Risk Rule Set (Hackathon Placeholder — Requires Clinical Validation)

> ⚠️ **Not clinically validated.** This is a starter rule set built for demo purposes only, loosely modeled on commonly-referenced obstetric danger-sign and risk-screening frameworks (e.g., WHO ANC/obstetric danger signs, standard CHW risk checklists). It is **not** a substitute for review by a licensed clinical advisor (OB-GYN or public health physician) and must not inform any real pilot or patient care decision before that review happens. Treat every threshold below as provisional.

**Design pattern:** red-flag override + weighted accumulation — mirrors real obstetric early-warning tools. A single red-flag danger sign forces High regardless of anything else; otherwise, moderate factors accumulate toward Medium/High. This keeps the rules deterministic, auditable, and easy to explain to a CHW (which is the architecture doc's explainability requirement).

**Tier 3 — High / Immediate Referral** (any ONE of these present, auto-High):
- Active vaginal bleeding (antepartum or postpartum)
- Severe abdominal pain
- Convulsions or history of eclampsia/severe pre-eclampsia
- Severe hypertension (systolic ≥160 or diastolic ≥110)
- Signs of obstructed/prolonged labor
- Known malpresentation (e.g., breech) at or near term

**Tier 2 — Medium — contributes toward High if ≥2 present, else Medium** (single moderate factor):
- Adolescent pregnancy (<18 years)
- Prior C-section
- Hypertension present but below the severe threshold above
- History of postpartum hemorrhage
- Grand multipara (5+ prior pregnancies)
- Short inter-pregnancy interval (<18 months)
- Multiple gestation (twins/triplets)
- Advanced maternal age (>35)

**Tier 1 — Low:** none of the above present.

**Scoring logic (draft):**
1. If any Tier 3 factor is present → risk = **High**, referral auto-generated. (Red-flag override.)
2. Else, count Tier 2 factors present. If count ≥ 2 → risk = **High**. If count = 1 → risk = **Medium**. If count = 0 → risk = **Low**.
3. Explainability output always lists every factor that contributed, not just the tier — per the architecture doc's requirement that a flag must never be "just a score."

**Next step to actually resolve this open question:** get this draft in front of a clinical advisor (OB-GYN, MOH technical working group member, or a maternal-health NGO already active in Nigeria) before any real pilot — ideally cross-checked against Nigeria's Federal Ministry of Health ANC/obstetric care guidelines specifically, since thresholds and terminology can vary by country protocol. Good enough as-is to power the hackathon demo.

## 7. Success Metrics

**Demo / leading indicators:**
- 100% success rate on the golden-path run-through (register → flag → refer → facility sees it) across live demo attempts.
- Registration-to-risk-flag latency: instant (on-device, no network dependency).
- Flag-to-facility-visibility latency after sync: target < 2 minutes in the demo environment.
- Demo clearly shows the CHW caseload/task view in use (not just the single-patient registration form), evidencing the "operating system" framing.

**Product / lagging indicators (post-pilot, for the real v1):**
- Referral completion rate (referrals with a logged outcome) — target uplift vs. baseline paper/SMS process.
- Reduction in average referral transit time.
- CHW weekly active use rate.
- Reduction in lost-to-follow-up rate during the 0–48 hour postpartum window.
- CHW retention rate correlated with caseload/task engagement — tests the "incentive hook" hypothesis from `AMHOS_Idea_Refine.md` once a real incentive tie-in exists.

## 8. Open Questions

- ~~**Engineering (blocking, pre-build):** Mobile framework choice~~ — **Decided: React Native.** Local-first data layer via WatermelonDB or react-native-sqlite-storage. Trade-off accepted: RN was chosen for team familiarity (JS/TS) and potential logic-sharing with a future React-based web dashboard, over Flutter's edge in raw performance and embedded-DB maturity on low-end Android hardware — worth monitoring background-sync reliability on older devices as the offline queue gets built out.
- ~~**Engineering (non-blocking):** What "offline" means operationally~~ — **Decided: airplane mode**, reflecting real conditions for CHWs in remote, poor-connectivity areas. Registration, risk scoring, and referral creation must be fully completable with the device in airplane mode; queued changes sync automatically the moment connectivity returns, with no manual "retry" step required from the CHW.
- **Clinical/Product (non-blocking for hackathon, blocking for pilot):** A draft rule set now exists (see section 6a) and is sufficient to power the demo, but it is **not clinically validated** — needs sign-off from a clinical advisor (OB-GYN or public health physician), ideally cross-checked against Nigeria's Federal Ministry of Health ANC/obstetric guidelines, before any real pilot.
- **Legal/Compliance (blocking for pilot, not for hackathon):** Data residency and consent requirements — **pilot country confirmed as Nigeria**, so this narrows to Nigeria's NDPR (Nigeria Data Protection Act/Regulation) specifically rather than a multi-country evaluation. Actual residency/consent implementation is still open and remains the program's longest lead-time item per the architecture doc.
- ~~**Stakeholder (blocking for Phase 2 planning):** Which country/region is the first pilot target~~ — **Decided: Nigeria.** This gates: (1) national ID model — align with Nigeria's NIN (National Identification Number) where available, with locally-generated IDs as fallback and reconciliation logic per the architecture doc; (2) DHIS2/HMIS integration — Nigeria's National Health Management Information System (NHMIS) is DHIS2-based, so the existing DHIS2 connector plan in the architecture doc applies directly rather than needing a different aggregate-reporting approach.
- **Design (non-blocking):** Information hierarchy for facility vs. district dashboard views. **Recommendation:**
  - *Facility view* (task-oriented, patient-level, top-to-bottom by urgency): (1) high-risk incoming referrals needing action now, (2) today's scheduled ANC/postnatal checks, (3) active high-risk caseload list, (4) completed/historical referrals — least prominent, archive-style.
  - *District/national view* (situational-awareness-first, aggregate-only): (1) headline KPI cards with red/amber/green anomaly flags (registration rate, risk-tier distribution, avg. referral completion time, coverage gaps), (2) trend charts over time, (3) geographic drill-down by facility/LGA with SLA-breach flags surfaced, (4) no patient-identifiable drill-down at this tier, per the architecture doc's access-control requirement (aggregate-only for administrative tiers).
  - Treat this as a default to validate with real facility/district users before the pilot, not a final answer.
- ~~**Stakeholder (blocking for go-to-market):** Is the primary buyer/pilot partner an NGO or CHW-program operator, or a hospital?~~ — **Decided: an NGO, partnering directly with hospitals.** The NGO employs/manages caseworkers (this PRD's "CHW" role — the two terms are used interchangeably in this partnership model) who monitor the portal and coordinate with partner hospitals when a risk emerges. This confirms the CHW-operating-system buyer direction from `AMHOS_Idea_Refine.md` and adds a concrete mechanism: mothers send WhatsApp updates between visits, which the caseworker triages (see Section 4 and the new P1 requirement in Section 6).
- **Product (non-blocking):** WhatsApp notification *and* mother-intake reliability and message-template approach in target Nigeria regions — deferred to real validation in Phase 2; mocked for the hackathon per `AMHOS_Idea_Refine.md`.
- **Product (non-blocking, needs real user input):** Does a visible incentive/engagement hook (e.g., a "visits logged" counter) actually improve CHW retention, or is this an untested assumption carried over from ideation? Needs reaction from someone with real CHW-program experience before being treated as validated.

## 9. Timeline Considerations

Assumes a typical hackathon window (~24–48 hours, small team) — flagged as an assumption since no explicit constraint was given.

Suggested phasing within the window:
- **Hrs 0–4:** Finalize risk rule set; build registration form + local storage schema.
- **Hrs 4–10:** Rules engine + referral auto-generation; facility dashboard skeleton; CHW caseload/task view (P0).
- **Hrs 10–16:** Offline queue + sync demo; referral status lifecycle UI; mocked WhatsApp-style notification on referral creation; mocked mother check-in intake (top-priority P1).
- **Hrs 16–20:** Remaining P1 stretch items (district view, SLA flag) if ahead of schedule; polish and seed demo data.
- **Hrs 20–24:** Demo rehearsal, error-state pass, judging prep.

No hard external dependencies are required for the hackathon build (no real DHIS2, national ID, or SMS gateway) — this is intentional and mirrors the non-goals above.

---

## Part B — Phased Roadmap Toward Full Architecture

Mapping the deferred (P2) items back to the technical architecture doc's own priorities:

**Phase 2 (pilot-ready v1):**
- Real SMS/USSD gateway integration (e.g., Africa's Talking–class provider) as a genuine resilience layer.
- Harden conflict resolution into the full event-sourced model described in the architecture doc (append-only, not last-write-wins).
- District/national dashboard on near-real-time data pipelines (not batch).
- Explicit consent capture at registration, aligned to Nigeria's NDPR.
- Data residency decisions and initial data-sharing agreement work with Nigeria's Federal/State MOH — start this early; per the architecture doc, it's the longest lead-time item.
- Begin OpenHIE-aligned client/facility registry work; align national ID model to Nigeria's NIN with locally-generated ID fallback per the architecture doc.
- Real WhatsApp Business API integration for facility/supervisor notifications *and* mother check-in intake, replacing the hackathon's mocked versions — pending the notification-reliability open question in Section 8.
- Structured (non-NLP) mother check-in flow hardened with the NGO's actual partner hospitals, validating the real coordination workflow between caseworker and hospital.
- Validate the CHW engagement/incentive-hook hypothesis (`AMHOS_Idea_Refine.md`) with real CHW-program users before committing to a full payment-rail build.

**Phase 3 (scale):**
- Advisory ML risk-scoring layer with a defined retraining cadence and human clinical oversight/governance model.
- Full FHIR-compliant (HL7 FHIR R4) API gateway.
- DHIS2 connector pushing aggregate indicators into Nigeria's NHMIS (DHIS2-based).
- National ID reconciliation logic for future launch countries introducing different ID infrastructure post-Nigeria.
- Full audit logging and formal NDPR compliance work.
- Containerized, Kubernetes-class, region-hosted deployment for cloud portability across regional providers.
- Phased, district-by-district rollout gated on local MOH data-sharing agreements.
- If Phase 2 validation supports it: a real CHW incentive/payment rail (e.g., mobile money disbursement tied to visit/caseload logging), completing the "CHW operating system" ambition from `AMHOS_Idea_Refine.md`.
- Natural-language/NLP parsing of free-text mother check-ins (beyond the structured pick-list from Phase 2), with clinical oversight on any auto-escalation logic — mirrors the same governance requirement as the ML risk layer above.
