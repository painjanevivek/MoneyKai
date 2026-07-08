# Google OAuth Runbook

## Fix `redirect_uri_mismatch`

Google shows `Error 400: redirect_uri_mismatch` when the redirect URI sent by MoneyKai is not listed on the Google OAuth client.

For the production `moneykai.com` site, add this exact value to the Google Cloud OAuth client:

```text
https://moneykai.com/api/v1/auth/google/callback
```

Google requires an exact match. The scheme, host, path, case, port, and trailing slash must all match.

## Check the deployed value

Open this endpoint on the deployed site:

```text
https://moneykai.com/api/v1/auth/google/setup-status
```

Copy the value from:

```text
requiredGoogleCloud.authorizedRedirectUris[0]
```

Then add that exact URI in Google Cloud:

1. Open Google Cloud Console.
2. Go to APIs & Services.
3. Open Credentials.
4. Open the OAuth 2.0 Client ID used by MoneyKai.
5. Confirm the application type is `Web application`.
6. Add the URI under `Authorized redirect URIs`.
7. Save, then wait a few minutes for Google to apply the change.

## Required deployment environment

Set these on the backend/Vercel deployment:

```text
MONEYKAI_SITE_URL=https://moneykai.com
GOOGLE_OAUTH_CLIENT_ID=<google-web-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<google-web-client-secret>
GOOGLE_OAUTH_STATE_SECRET=<long-random-secret>
```

Optional:

```text
GOOGLE_OAUTH_REDIRECT_URI=https://moneykai.com/api/v1/auth/google/callback
```

Use `GOOGLE_OAUTH_REDIRECT_URI` only when the backend callback must differ from `MONEYKAI_SITE_URL`. If it is set, Google Cloud must authorize that exact value.

## Common blockers

- `https://www.moneykai.com/api/v1/auth/google/callback` is different from `https://moneykai.com/api/v1/auth/google/callback`.
- A trailing `/` at the end is different from no trailing `/`.
- A Vercel preview URL is different from the production domain.
- A Firebase client ID is different from the backend web OAuth client ID.
- Google changes can take a few minutes to propagate after saving.
