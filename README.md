# MoneyKai Monorepo

MoneyKai is organized as a monorepo so the production mobile app, the public website frontend, and the Python backend live together with a clear boundary.

## Layout

- `apps/MoneyKai-mobile` - Expo Router mobile app
- `apps/MoneyKai-web` - Expo Router website frontend
- `backend` - FastAPI + Firestore backend

## Common commands

```bash
npm run start
npm run web
npm run lint
npm run typecheck
npm run build
```

`npm run start` launches the mobile app, while `npm run web` launches the website package.

## Backend commands

```bash
npm run backend:dev
npm run backend:test
npm run backend:compile
```

The two app packages each have their own config and entry points under `apps/`, so the mobile and website surfaces can evolve independently while sharing the same repository.
