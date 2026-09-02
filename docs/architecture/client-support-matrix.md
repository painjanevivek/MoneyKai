# Supported client matrix

| Client | Release status | Contract owner | Current action |
|---|---|---|---|
| MoneyKai web | Active launch client | Versioned FastAPI `/v1` and web maintainers | Build, test, and release |
| Expo mobile | Deferred | Same FastAPI contract when resumed | Preserve source; no release work in the current program |
| Flutter client | Unsupported experiment | None | Do not ship or add feature parity work |
| Generated Android/native directories | Build artifacts or local experiments | Parent supported client only | Do not treat as independent products |

Mobile parity begins only after web/backend contracts and production rollout evidence stabilise. No public copy may imply a currently supported Android release.

Every newly supported client must name an owner, consume the published API contract, pass compatibility tests, and have a release/rollback procedure before it is added to this matrix.
