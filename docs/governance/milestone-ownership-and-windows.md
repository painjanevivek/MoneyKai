# M01–M19 Ownership and Target Windows

## Scheduling Rules

Week 1 begins 2026-09-22 after M00 implementation starts. Windows are planning targets,
not permission to bypass dependencies or acceptance gates. A missed date changes the plan;
it does not weaken scope, evidence, security, financial, privacy, Play, or rollout controls.
Only M07's always-on security lane and explicitly independent preparation may overlap.
One milestone at a time receives final acceptance.

`@painjanevivek` is the currently named accountable founder. Role labels below identify the
review dimension being exercised and the owner to delegate as the team grows. Until then,
single-maintainer limitations are disclosed under the ownership policy. M18 requires backup
coverage rather than perpetual founder-only operation.

## Delivery Ownership

| Milestone | Target window | Accountable role | Required co-review dimensions | Entry / exit control |
|---|---|---|---|---|
| M01 Product definition | W1: 2026-09-22–09-28 | Founder/product owner | Product analytics, financial trust, support | M00 gate / `PROD-01` |
| M02 Design system | W2–W3: 2026-09-29–10-12 | Product/UI owner | Accessibility, mobile, web, trust/privacy | M01 / design, accessibility, UX gates |
| M03 Modular architecture | W4: 2026-10-13–10-19 | Architecture owner | Domain, API, mobile, web, security | M02 / architecture and `API-01` |
| M04 Financial correctness | W5: 2026-10-20–10-26 | Financial correctness owner | Domain, API, data/recovery, QA | M03 / `FIN-01`–`FIN-03`, `TRUST-01` |
| M05 Identity/authentication | W6: 2026-10-27–11-02 | Identity owner | Security, privacy, API, mobile/web, support | M03–M04 / `SEC-04` |
| M06 Privacy/user trust | W7: 2026-11-03–11-09 | Privacy/trust owner | Product, identity, mobile/web, support, legal/policy | M05 / `TRUST-03`, `TRUST-04`, `PRIV-01` |
| M07 Security baseline | W6–W8: 2026-10-27–11-16; continuous lane from M00 | Security owner | Identity, data, API, release, operations | M05–M06 / `SEC-01`–`SEC-05` |
| M08 Reliable/scalable backend | W9–W10: 2026-11-17–11-30 | Backend/reliability owner | API, domain, data, security, operations | M03–M04, M07 / `REL-04`, `PERF-03` |
| M09 Bruno API assurance | W11: 2026-12-01–12-07 | API quality owner | Backend, identity/security, CI/release | M08 and isolated staging / `API-01`–`API-03` |
| M10 Core experience | W12: 2026-12-08–12-14 | Product/mobile owner | Design, domain, identity, privacy, API, support | M02, M04–M09 / launch journeys |
| M11 Automated quality | W13–W14: 2026-12-15–12-28 | Quality owner | Every affected technical owner, accessibility, security | M10 / immutable passing matrix |
| M12 Play readiness | W15: 2026-12-29–2027-01-04 | Android release owner | Security, privacy, mobile, operations, product/store | M07, M11 / Play and release gates |
| M13 Golden journey | W16: 2027-01-05–01-11 | Release quality owner | Identity, data/recovery, privacy/support, mobile | M12 / ten consecutive `GOLDEN-01` runs |
| M14 Internal dogfood | W17: 2027-01-12–01-18 (minimum 7 days) | Product operations owner | Quality, release, support, security, reliability | M13 / health thresholds and no blocker |
| M15 Closed beta | W18–W19: 2027-01-19–02-01 (minimum 14 days) | Product/beta owner | Support, privacy, security, analytics, release, operations | M14 / beta go/no-go gates |
| M16 Production launch | W20: 2027-02-02–02-08 (minimum staged observations) | Release commander | Product, security, privacy, reliability, support, incident owner | M15 / every required production gate |
| M17 Product-market fit | W21–W28: 2027-02-09–04-05; iterative | Product/growth owner | Analytics, trust/privacy, support, engineering | M16 / `GROWTH-01` and production guardrails |
| M18 MNC-grade operations | W21–W32: 2027-02-09–05-03; evidence window | Operations owner | Security, privacy/compliance, SRE/on-call, accessibility, vendor owner | M16 / 99.9% crash-free and `OPS-01`–`OPS-04` |
| M19 Category leadership | W33 onward: from 2027-05-04 | Product/platform owner | Collaboration security, financial correctness, scale, partnerships, customer ops | M17–M18 / feature-specific production gates |

## Escalation and Replanning

- The accountable role publishes a revised window and risk impact when a target slips by
  more than five business days or a dependency cannot enter on time.
- Critical/high security, financial integrity, cross-account privacy, Play policy, or
  recovery blockers immediately stop affected work and notify the founder and operations.
- External review, Play policy, vendor, or environment access delays remain visible as
  blockers; they are not converted into completed tasks.
- Owners are reviewed at every milestone gate. Delegation updates CODEOWNERS and the
  ownership policy in the same reviewed change.
