# MoneyKai Mobile

This package contains the Expo Router mobile app for MoneyKai.

## Run from the monorepo root

```bash
npm run start
npm run web
npm run lint
npm run typecheck
npm run build
```

## Direct package commands

```bash
cd apps/MoneyKai-mobile
npm run start
```

## Environment

Set the Firebase web client values in `apps/MoneyKai-mobile/.env`.

## Notes

- The website frontend lives in `apps/MoneyKai-web/`.
- The backend lives in the sibling repository `../MoneyKai-backend/`.
- Shared app code can be extracted into a future shared package as the monorepo grows.
- Release build commands, artifact paths, and remaining Play Store blockers are documented in `docs/phase5-release-readiness.md`.
