# MoneyKai Android V1 Product Definition

**Version:** 1.0.0  
**Status:** Approved for implementation; final adoption occurs when the M01 pull request merges  
**Owner:** Founder / product owner (`@painjanevivek`)  
**Effective:** 2026-09-21  
**Review trigger:** A change to the launch user, trust promise, regulated boundary, or V1 value proposition

## Product Decision

MoneyKai Android V1 is a calm, review-first money workspace for people who want to understand
their month without spreadsheet fatigue. It combines personal transaction and budget clarity
with explainable shared-expense records. It does not depend on invasive automatic collection,
hold money, move money, or provide financial advice.

The first-value promise is:

> Record or review money once, understand what changed, and stay in control of the data.

## Primary User

The launch user is an Android-first individual money manager in India who:

- handles everyday digital and cash spending but lacks one trustworthy monthly view;
- finds spreadsheets or feature-heavy finance apps burdensome;
- is willing to record or review transactions when the result is immediately useful;
- sometimes shares costs with a partner, roommate, family, friends, or a trip group; and
- values clear status, reversibility, privacy, and recovery more than opaque automation.

Launch assumptions are English (India), INR as the default ledger currency, and an adult user
managing their own records. These assumptions must be validated during M14 and M15; they are not
claims of broad market fit.

## Secondary Users

| User | Needed outcome | V1 relationship |
|---|---|---|
| Shared-expense organizer | Record who paid, split a cost, and understand the resulting position | Supported, without payment execution or an unverified real-time claim |
| Shared-expense participant | See why they owe or are owed and what changed | Supported only where membership and authorization are proven |
| Returning/reinstalling user | Recover the same records and balances without duplicates | A launch-critical trust journey |
| Privacy-conscious evaluator | Understand collection, permissions, export, and deletion before committing | A launch-critical conversion and trust journey |

Business accountants, minors, professional traders, users seeking regulated advice, and people
requiring bank aggregation or payment execution are not launch target users.

## Jobs to Be Done

### Core jobs

1. **Capture:** When money moves, record an income or expense quickly and know whether it saved.
2. **Review:** When checking the month, understand income, spending, remaining budget, and recent
   changes without reconstructing them manually.
3. **Correct:** When a record is wrong, edit or remove it with an understandable balance impact.
4. **Plan:** When deciding what is safe to spend, set a monthly budget and see progress against it.
5. **Share:** When a cost involves other people, record payer, participants, split rule, and the
   explainable resulting position without implying that MoneyKai moved money.
6. **Continue:** When offline, reconnecting, upgrading, or reinstalling, recover without silent
   duplication, loss, or unexplained variance.
7. **Leave:** When trust is withdrawn, export understandable data and complete account deletion
   with visible status and bounded recovery/support.

### Emotional and trust jobs

- Feel calmer rather than judged or overwhelmed.
- Know which data is local, pending, synchronized, shared, exported, or deleted.
- Verify a displayed amount without accepting a black-box calculation.
- Understand the consequence before a destructive or privacy-sensitive confirmation.

## Trust Promise

MoneyKai will earn trust through verifiable behaviour, not badges or vague security claims:

1. Every certified amount can be traced to source records and documented rules.
2. Local, pending, synchronized, failed, conflicted, and recovered states are distinguishable.
3. Imports are reviewed before they affect balances; retries cannot create silent duplicates.
4. Permissions are requested from the user-initiated feature that needs them, with denial recovery.
5. Shared records identify authority, participants, calculation method, and settlement status.
6. Material consequences remain visible; progressive disclosure may simplify detail, never conceal it.
7. Export and deletion are first-class, tested journeys with status and support escalation.
8. MoneyKai never claims to hold, transfer, invest, or guarantee the safety of a user's money.

The compact product-language version is:

> Every amount explained. Every sync state visible. Every sensitive choice yours.

## Competitive Position

| Alternative | What it does well | MoneyKai V1 differentiation |
|---|---|---|
| Splitwise | Familiar group expense entry and debt positions | Adds personal monthly context, budgets, explainable calculations, visible sync/recovery, and user-controlled export/deletion |
| Automatic/SMS trackers | Low-effort collection and India-specific transaction capture | Uses review-first, permission-minimal flows and never makes opaque collection the price of first value |
| Full finance suites | Broad accounts, reports, investments, and automation | Keeps launch scope narrow and primary actions obvious instead of presenting an all-in-one control panel |
| Spreadsheets/notes | Flexible and user-controlled | Provides deterministic calculations, status, recovery, and repeatable shared-expense structure with less upkeep |

Splitwise is inspiration for clarity around people, payer, split, and settlement history—not a
visual or interaction template to copy. MoneyKai's defensible launch position is the combination
of personal and shared monthly clarity with unusually explicit data and calculation trust.

## Product Principles for Downstream Milestones

- The dashboard answers “what changed and what needs attention?” before offering analysis.
- Record transaction, review import, and understand balance remain one-tap primary paths.
- Advanced filters, analytics, settings, and diagnostics are progressively disclosed.
- No gradient, dark-mode, fear-based, shame-based, or artificial-urgency experience is permitted.
- Feature presence is not success; users must complete the job with correct, recoverable state.
- Unsupported capability is labelled unavailable or omitted, never represented by hopeful copy.

## Change Control

A patch version may clarify language without changing intent. A minor version may refine a
secondary segment or job after evidence. Any change to the primary user, trust promise, India/INR
launch assumption, regulated boundary, or core differentiation requires an ADR, updated M01
evidence, product-owner approval, and impact review across M02, M04-M10, M12, and M17.
