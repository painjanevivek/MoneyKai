# MoneyKai Stripe Billing Runbook

MoneyKai uses Stripe-hosted Checkout for subscriptions and the Stripe Customer Portal for billing recovery. The client never receives a Stripe secret key and never collects card data.

## Required Stripe Setup

1. Create a MoneyKai Premium product and recurring Prices in Stripe.
2. Set `STRIPE_PREMIUM_MONTHLY_PRICE_ID` and optionally `STRIPE_PREMIUM_ANNUAL_PRICE_ID`.
3. Use `STRIPE_RESTRICTED_KEY` where possible. Grant only the permissions needed for Customers, Prices, Checkout Sessions, Subscriptions, and Billing Portal Sessions.
4. Configure the Customer Portal in Stripe so users can update payment methods, view invoices, and cancel or change subscriptions.
5. Enable Smart Retries and failed-payment emails in Stripe Billing recovery settings.
6. Add tax registrations in Stripe Tax if MoneyKai needs to collect tax, then keep `STRIPE_AUTOMATIC_TAX_ENABLED=true`.

## Webhook Endpoint

Use:

```text
https://moneykai.app/api/billing/webhook
```

Listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`

Set `STRIPE_WEBHOOK_SECRET` from the webhook endpoint signing secret. The handler verifies the raw-body HMAC signature before accepting events.

The current app treats Stripe as the billing source of truth. The pricing screen calls `/api/billing/status`, which searches for the authenticated user's Stripe customer by `firebase_uid` metadata and reads the latest subscription status directly from Stripe. If MoneyKai later needs offline entitlement checks, persist these verified webhook events into the production backend or Firestore before gating premium features.

## Local Testing

```bash
stripe listen --forward-to localhost:8081/api/billing/webhook
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

Use Stripe test cards for checkout, including successful payment, declined payment, and 3DS authentication scenarios.

## Production Checks

- Confirm no `sk_`, `rk_`, or `whsec_` values are committed to git.
- Confirm `/api/billing/checkout`, `/api/billing/portal`, and `/api/billing/status` require a Firebase ID token.
- Confirm Checkout Sessions do not pass `payment_method_types`; payment methods should be managed from Stripe Dashboard.
- Confirm users with `past_due`, `unpaid`, or `incomplete` status see the billing portal recovery path.
- Confirm Stripe Tax registrations are correct before collecting tax in new jurisdictions.
