# AMHOS — Technical Architecture Outline

## 1. Architectural Principles

- **Offline-first, not offline-tolerant**: every core workflow (registration, risk assessment, task scheduling) must complete fully with zero connectivity. Sync is an enhancement, not a dependency.
- **Interoperable by default**: no data silo. AMHOS is a coordination layer that plugs into national health information systems, not a replacement for them.
- **Progressive escalation**: risk stratification triggers workflow changes automatically (e.g., a high-risk flag auto-generates a referral task and notifies the receiving facility).
- **Least-fragile transport**: sync must degrade gracefully across 2G, intermittent connectivity, and SMS-only fallback.

## 2. High-Level System Layers

```
┌───────────────────────────────────────────────────┐
│  Presentation Layer                                │
│  - CHW mobile app (offline-first, Android-first)   │
│  - Clinic/hospital web dashboard                    │
│  - District/national admin dashboard                │
├───────────────────────────────────────────────────┤
│  Application / API Layer                            │
│  - Care coordination workflow engine                │
│  - Risk stratification service (rules + ML)         │
│  - Referral & transport tracking service             │
│  - Notification & task orchestration service         │
├───────────────────────────────────────────────────┤
│  Interoperability Layer                              │
│  - FHIR-compliant API gateway                        │
│  - OpenHIE-style mediator (client, facility, terminology registries) │
│  - DHIS2 / national HMIS connectors                  │
├───────────────────────────────────────────────────┤
│  Data Layer                                          │
│  - Event-sourced patient/pregnancy records            │
│  - Local encrypted store (device)                     │
│  - Cloud data store (region-hosted)                   │
├───────────────────────────────────────────────────┤
│  Infrastructure Layer                                 │
│  - Cloud-native deployment (containerized)            │
│  - SMS/USSD gateway for fallback connectivity          │
│  - Sync & conflict-resolution engine                   │
└───────────────────────────────────────────────────┘
```

## 3. Mobile Client (CHW-Facing)

- **Platform**: Android-first (dominant device class among CHW programs), built with an offline-capable framework (e.g., Flutter or React Native with a local-first data layer).
- **Local data store**: embedded database (e.g., SQLite/Realm-class) holding the CHW's full caseload, encrypted at rest.
- **Local-first logic**: all forms (registration, ANC visit, risk assessment, postnatal check) write to local store first; UI never blocks on network.
- **Sync queue**: outbound changes queued as discrete, timestamped events; retried on connectivity with exponential backoff.
- **Conflict resolution**: event-sourced model (append-only changes rather than overwriting records) so concurrent edits from CHW and facility don't clobber each other — last-write-wins is insufficient for clinical data.
- **Fallback channel**: critical alerts (e.g., emergency referral) can degrade to SMS/USSD if data sync is unavailable, ensuring the highest-stakes messages aren't blocked by the same infrastructure gaps as routine sync.

## 4. Risk Stratification Engine

- **Tiered design**:
  - *Rules-based layer* (deterministic, auditable): flags based on established clinical risk factors (e.g., prior C-section, hypertension, adolescent pregnancy, hemorrhage history). This layer works fully offline on-device.
  - *Advisory ML layer* (cloud-side): refines risk scoring using aggregated outcome data over time; explicitly advisory, not diagnostic — output is a decision-support flag reviewed by clinical staff, never an autonomous clinical decision.
- **Explainability requirement**: every risk flag must surface the contributing factors to the CHW/clinician, not just a score — critical for trust, adoption, and clinical liability in a decision-support tool.
- **Retraining loop**: outcomes data (referral completed, delivery outcome) feeds back into model evaluation on a defined cadence, with human clinical oversight on any model updates.

## 5. Interoperability Layer

This is the layer that determines whether AMHOS becomes a silo itself or genuinely functions as connective tissue:

- **FHIR** (HL7 FHIR, e.g., R4) as the canonical API standard for patient, encounter, and observation resources.
- **OpenHIE architecture** alignment: client registry (unique patient ID across facilities), facility registry, terminology service — avoids AMHOS building a parallel, disconnected identity system.
- **DHIS2 connector**: many African MOHs already run DHIS2 for aggregate reporting; AMHOS should push aggregate indicators there rather than requiring a new dashboard for ministries who already have one.
- **National ID / patient identity**: design for varying levels of national ID infrastructure — must function with locally-generated unique IDs where no national identity system exists, with reconciliation logic if one is introduced later.

## 6. Referral & Transport Tracking

- **Referral object as a first-class entity**: not a message, but a stateful record with timestamps at each transition (flagged → dispatched → in transit → received → outcome logged).
- **Advance visibility**: receiving facility gets the referral record (risk factors, gestational age, vitals) before patient arrival, pushed as soon as connectivity allows — with SMS fallback summary if data sync fails.
- **Timeline SLA tracking**: system flags referrals exceeding expected transit time, surfaced on district dashboards to identify systemic transport bottlenecks (not just individual case failures).

## 7. Dashboards (Facility / District / National)

- **Facility view**: incoming referral queue, today's scheduled postnatal checks, active high-risk caseload.
- **District/national view**: live aggregate indicators (registration rates, risk distribution, referral completion time, coverage gaps by geography) — built on near-real-time data pipelines rather than batch reporting.
- **Access control**: role-based, facility- and district-scoped visibility; patient-level data restricted to care team, aggregate-only for administrative tiers where appropriate.

## 8. Security & Privacy

- Encryption at rest (device and cloud) and in transit.
- Data residency: cloud hosting within-region where required by national health data regulations.
- Consent model: explicit consent capture at registration, aligned with local data protection law (e.g., Nigeria's NDPR, Kenya's DPA, or equivalent).
- Audit logging on all record access, particularly for cross-facility referral data sharing.

## 9. Deployment Model

- Containerized backend (Kubernetes-class orchestration) for cloud portability across regional providers.
- SMS/USSD gateway integration (e.g., Africa's Talking–class provider) as a resilience layer, not an afterthought.
- Designed for phased rollout: district-by-district deployment with local MOH data-sharing agreements before wider scale-out.

## 10. Open Technical Questions to Resolve Early

- Which national ID / client registry model to align with in each launch country (varies significantly by country).
- Minimum viable device spec for CHW hardware (affects local storage/sync design).
- Governance model for the ML risk layer — who validates model updates, and how are false negatives audited given the clinical stakes.
- Data-sharing agreement templates with MOH/DHIS2 before any pilot begins — this is often the longest lead-time item, not the engineering.
