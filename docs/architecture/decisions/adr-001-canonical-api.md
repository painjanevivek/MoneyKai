# ADR-001: FastAPI owns the canonical product API

- Status: Accepted
- Date: 2026-09-02
- Owner: MoneyKai founder and backend maintainers

## Context

MoneyKai previously contained deployable Google authentication logic in the web project while the product client also called the sibling FastAPI service. That created two places for authentication policy, throttling, error handling, and incident response to drift.

## Decision

The private FastAPI repository is the only implementation of MoneyKai product routes under `/v1`.

- Web and supported clients call `EXPO_PUBLIC_BACKEND_BASE_URL` plus `/v1/...` directly.
- The web deployment does not probe its own origin for product APIs and does not ship `/api/v1` functions.
- Root `api/v1` sources are retained only as deployment-excluded compatibility evidence until their final deletion; `.vercelignore` and CI prevent them from becoming runtime handlers.
- Web-edge functions may provide health, consented analytics, monitoring intake, and temporary billing adapters, but they must not implement identity, financial records, provider sync, documents, or AI policy.
- New product endpoints are added only to FastAPI. A duplicate web route fails CI.

## Rollback

Rollback changes only the configured canonical backend origin to a previously approved FastAPI deployment. It does not restore web-side business logic.

## Verification

`npm run web:api-boundary:check` proves that authentication uses one backend URL, both Vercel configurations contain no `/api/v1` rewrites, no deployable app-local API functions exist, and the deployment exclusion cannot be negated.
