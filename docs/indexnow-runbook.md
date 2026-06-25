# IndexNow Runbook

MoneyKai uses IndexNow to notify participating search engines when public site URLs change.

## Current Key

- Key: `2798fae71bac4fe1ad2b379c5825b8f9`
- Hosted file path: `apps/MoneyKai-web/public/2798fae71bac4fe1ad2b379c5825b8f9.txt`
- Expected live URL: `https://moneykai.com/2798fae71bac4fe1ad2b379c5825b8f9.txt`

The key file is public by design. It must contain only the key text.

## Submit Flow

1. Deploy the web app.
2. Confirm the key file is live:

```powershell
curl.exe https://moneykai.com/2798fae71bac4fe1ad2b379c5825b8f9.txt
```

Expected response:

```text
2798fae71bac4fe1ad2b379c5825b8f9
```

3. Preview the IndexNow payload:

```powershell
npm run indexnow:dry-run
```

4. Submit sitemap URLs to IndexNow:

```powershell
npm run indexnow:submit
```

The script reads `apps/MoneyKai-web/public/sitemap.xml`, submits every `<loc>` URL for `moneykai.com`, and includes the required `keyLocation`.

## Troubleshooting

- `403 Forbidden`: the live key file is missing, not reachable, or does not contain the exact key.
- `422 Unprocessable Entity`: one or more submitted URLs do not belong to `moneykai.com`.
- `429 Too Many Requests`: wait before submitting again.
- Do not submit from preview deployments unless the host and key location are changed intentionally.
