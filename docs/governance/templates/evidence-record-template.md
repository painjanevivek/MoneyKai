# <task or gate> Evidence Record

## Identity

| Field | Value |
|---|---|
| Task / gate | <MNN.T or gate ID> |
| Outcome under test | <one bounded, falsifiable outcome> |
| Status | Pass / Fail / Blocked / Pass with approved exception |
| Captured at | <ISO-8601 timestamp with offset> |
| Executor | <person or automation identity> |
| Repository / branch | <repository and branch> |
| Revision | <full immutable commit SHA> |
| Build / artifact | <immutable ID and SHA-256, or Not applicable> |
| Environment | <local / CI / staging / production-read-only plus identifiers> |
| Device / runtime | <OS, app version, API level, model, browser, or Not applicable> |

## Scope and Preconditions

- In scope: <paths, services, journeys, identities, and data fixtures>
- Out of scope: <explicit exclusions and owner/follow-up>
- Preconditions: <configuration, dependency versions, feature flags, synthetic identities>
- Sensitive-data handling: <redaction/synthetic-data statement>

## Procedure and Results

Record exact commands or numbered manual steps. Do not include credentials or sensitive
payloads. For each item, retain the exit code/result and a sanitized durable artifact.

| # | Command / procedure | Expected | Actual | Result | Artifact |
|---:|---|---|---|---|---|
| 1 | `<exact command or manual step>` | <falsifiable expectation> | <observed result and exit code> | Pass / Fail | <repository path or immutable CI URL> |

## Gate Evaluation

| Acceptance criterion | Result | Evidence |
|---|---|---|
| <criterion or production-gate ID> | Pass / Fail / Not applicable | <artifact/row/measurement> |

## Findings, Exceptions, and Follow-up

- Blocking findings: <None or IDs>
- Non-blocking findings: <None or IDs with owner/date>
- Risk acceptance: <None or approved, unexpired record>
- Follow-up: <task/owner/date; never hide incomplete work in prose>

## Reproduction and Integrity

- Re-run command/procedure: `<entry point>`
- Artifact hashes: <SHA-256 values or Not applicable>
- External evidence retention: <location and retention period>
- Known nondeterminism: <source and bounds>

## Decision

State why the outcome passes, fails, or remains blocked. A pass requires all mandatory
criteria, no prohibited/expired risk, and evidence tied to the identified revision,
environment, and build. Name the accountable approver for a milestone or release gate.
