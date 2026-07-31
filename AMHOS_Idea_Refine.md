# AMHOS — CHW Care Operating System (with WhatsApp Notification Layer)

## Problem Statement
How might we give CHW programs a single system that runs their maternal-health workflow *and* keeps CHWs engaged enough to actually use it — so no high-risk pregnancy falls through the cracks between community and facility?

## Recommended Direction
The CHW operating system framing becomes the core bet: maternal referral is the wedge, but the product is positioned as the system that runs a CHW's day — caseload, tasks, and (eventually) the incentive/pay tie-in that gives CHWs a reason to keep using it rather than abandon it, which is the single most common failure mode in CHW tech historically (tools that add work without adding pay get dropped).

A WhatsApp notification layer is folded in as a **notification channel, not the capture interface**. This is the deliberate resolution to a tension surfaced during ideation: the native app (with local-first storage) stays the system of record and the only place data is *captured*, preserving the offline-first promise from the technical architecture doc intact. WhatsApp is used one-directionally for things that are inherently "when signal exists" anyway — pinging a facility that a referral is incoming, alerting a supervisor to a high-risk case, notifying a CHW their sync succeeded. Nothing clinically load-bearing depends on WhatsApp actually being delivered.

**Update — buyer question resolved:** the actual model is an NGO partnering directly with hospitals, not a hospital acting alone. The NGO's caseworkers (this doc's "CHW" role) manage the portal, and — new information — pregnant women send WhatsApp updates directly to the portal between scheduled visits, which the caseworker triages and escalates to the partner hospital when something looks concerning. This extends the WhatsApp layer beyond outbound facility notifications (Cluster 1) into an inbound mother-reported channel (Cluster 3's "direct-to-mother" variation) — both clusters end up folded into the same direction after all, just with WhatsApp scoped to notification-out and structured-check-in-in rather than full conversational capture.

## Key Assumptions to Validate
- [x] **Buyer fit — resolved:** the model is an NGO partnering directly with hospitals; the NGO's caseworkers own the portal relationship. No longer an open assumption.
- [ ] **Mother engagement:** pregnant women will actually use WhatsApp to send self-reported check-ins between visits, and have the phone/data access and privacy to do so reliably. *Test: ask the partner NGO whether their current mothers already use WhatsApp day-to-day, and whether phone access is typically personal or shared in the household.*
- [ ] **Notification reliability:** a WhatsApp-style alert is a credible enough channel for facility/supervisor notifications in target Nigeria regions. *Test: prototype one message-template flow ("high-risk referral incoming") and confirm it's plausible under real network conditions — doesn't need real WhatsApp Business API for the hackathon, just needs to be honest about what's mocked.*
- [ ] **Incentive hook actually drives engagement:** CHWs will engage more with a tool that visibly relates to their pay, even before a real payment rail exists. *Test: even a mocked "visits logged this week" counter, reacted to by anyone with real CHW-program experience if available before the marathon.*
- [ ] **Narrow wedge doesn't read as incomplete:** a maternal-only v1 is enough to prove the CHW-OS concept to a real evaluator, without needing the full multi-condition vision built out. *Test: get the demo + this one-pager in front of one real CHW-program stakeholder post-hackathon.*

## MVP Scope
**In:**
- Everything already in the hackathon PRD's P0 list (offline registration, rules-based risk flag with explainability, auto-referral, facility dashboard, offline sync demo).
- A CHW task/caseload view — all active registrations + upcoming scheduled checks — as the first visible slice of "operating system," not just single-patient referral.
- A WhatsApp-*style* notification triggered on referral creation, even if mocked/simulated rather than wired to the real WhatsApp Business API for the demo.
- A mocked mother WhatsApp check-in (structured pick-list, not free text) that routes into the caseworker's portal view against her case — the concrete demonstration of the NGO–hospital partnership model.

**Out (for now):** real incentive/payment tracking, real WhatsApp Business API integration, free-text/NLP parsing of mother check-ins, training/job-aid content, non-maternal CHW workflows.

## Not Doing (and Why)
- **Real CHW payment/incentive rail** — pulls in mobile-money integration and financial compliance that has nothing to do with proving the maternal-mortality wedge. Genuine scope-creep trap for a hackathon.
- **Real WhatsApp Business API / any real external integration** — approval and template-review lead times exceed the marathon window. Mock the concept, don't build the plumbing yet.
- **Chasing the hospital-buyer path as primary** — this direction points at NGO/CHW-program operators. Don't force a hospital pitch onto a workforce-platform product before validating who actually wants it.
- **Multi-condition CHW workflows** — the broader "CHW OS" is the north star, not the v1 build target. Stay maternal-only until the wedge is proven.

## Open Questions
- Should the WhatsApp notification target facility staff, CHW supervisors, or both, for the demo specifically? *(product — non-blocking, decide during build)*
- What happens when a mother's check-in has no clear caseworker assigned, or arrives outside the caseworker's working hours — does it queue silently or trigger an escalation path? *(product — non-blocking for the hackathon mock, blocking for a real pilot)*
- Does the bigger "CHW-OS" platform narrative pitch better for accelerator/funding interest, or does a narrower referral-tool story demo more convincingly in 48 hours? *(strategy — worth a quick gut check before the marathon starts)*
