# Stripe setup

Beata Shop uses Stripe-hosted Checkout in GBP. Prices and stock are recalculated from the database before each Checkout Session, UK shipping is £3 or free from £60, and only signed webhooks can mark an order as paid.

## Test mode

1. Open [Stripe test API keys](https://dashboard.stripe.com/test/apikeys) and copy the test secret key (`sk_test_...`) into `.env.local` as `STRIPE_SECRET_KEY`.
2. Run the site with Netlify's local database using `npx netlify dev`.
3. Install and sign in to the [Stripe CLI](https://docs.stripe.com/stripe-cli), then forward events:

   ```powershell
   stripe listen --forward-to localhost:8888/api/stripe/webhook
   ```

4. Copy the `whsec_...` printed by the CLI into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart Netlify Dev.
5. Complete a test Checkout using card number `4242 4242 4242 4242`, any future expiry date and any three-digit CVC.

The CLI signing secret is only for local forwarding. It is different from the signing secret generated for a deployed Dashboard webhook.

## Netlify deployment

Set `STRIPE_SECRET_KEY` in Netlify environment variables. After the site has a permanent URL, create a Stripe webhook endpoint at:

```text
https://YOUR-SITE.netlify.app/api/stripe/webhook
```

Subscribe it to these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Reveal that endpoint's signing secret and save it in Netlify as `STRIPE_WEBHOOK_SECRET`. Redeploy after changing environment variables.

Keep the account in test mode until business details, bank account, customer support details, policies and fulfilment have been checked. Replace the test secret with the live `sk_live_...` key and create a separate live-mode webhook only when the store is ready to accept real payments.
