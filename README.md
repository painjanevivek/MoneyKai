# MoneyKai Workspace

MoneyKai keeps the production mobile app and the public website frontend together here, while the Python backend now lives in a sibling repository for cleaner Vercel deployment.

## Layout

- `apps/MoneyKai-mobile` - Expo Router mobile app
- `apps/MoneyKai-web` - Expo Router website frontend
- `../MoneyKai-backend` - FastAPI + Firestore backend

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

These commands look for the backend in `../MoneyKai-backend` by default, or in the directory pointed to by `MONEYKAI_BACKEND_DIR`.

The two app packages each have their own config and entry points under `apps/`, so the mobile and website surfaces can evolve independently while sharing the same workspace.

## Production Launch Checklist

Before a release candidate goes out, verify these items in order:

1. Fill in the real `EXPO_PUBLIC_FIREBASE_*` values for both app packages.
2. Enable Email/Password auth in Firebase Authentication.
3. Enable Google auth if browser and native Google sign-in should be available.
4. Create the Firestore database and verify backup/restore end to end.
5. Set `EXPO_PUBLIC_BACKEND_BASE_URL` to the deployed FastAPI backend.
6. Optionally add `EXPO_PUBLIC_APP_STORE_URL` and `EXPO_PUBLIC_PLAY_STORE_URL` so the Settings `Rate the App` action opens the final listing instead of a store search page.
7. Re-run `npm run typecheck`, `npm run lint`, and a real login/backup/restore smoke test before publishing.
