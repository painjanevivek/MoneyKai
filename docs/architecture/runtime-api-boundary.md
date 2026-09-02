# Runtime API boundary

## Production ownership

| Surface | Owner | Status |
|---|---|---|
| `/v1/**` product API | Private FastAPI deployment | Canonical |
| Firebase identity verification | FastAPI using Firebase Admin | Canonical server boundary |
| Google/Gmail OAuth | FastAPI | Canonical; public Gmail capability remains gated |
| AI policy and provider calls | FastAPI | Canonical; disabled unless its release gate passes |
| Financial documents, portfolio, reconciliation, backups, and deletion | FastAPI | Canonical |
| `/api/health` | Web edge | Public web deployment health only |
| `/api/monitoring` | Web edge | Redacted browser diagnostics intake |
| `/api/analytics/events` | Web edge | Consent-gated, payload-minimised product analytics |
| `/api/billing/**` | Web edge | Temporary Stripe adapter; migration requires a separately reviewed backend contract |

The web edge must never report itself as the backend. A successful web health response proves only that the static/edge deployment is reachable.

## Legacy source disposition

The root `api/v1` tree is excluded from every web deployment by `.vercelignore`. It is not a fallback and must not be imported by client code. It remains temporarily as compatibility/security-test evidence while the backend contract is the source of truth. The CI boundary check fails if any exclusion is reversed or a deployable app-local handler returns.

## Client routing invariant

Clients construct exactly one product URL:

```text
canonical backend origin + versioned /v1 path
```

Network errors, missing routes, or backend failures are surfaced truthfully. Clients do not retry against the web origin or a second implementation.
