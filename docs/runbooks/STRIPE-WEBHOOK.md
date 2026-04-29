# Stripe Webhook Reliability Runbook

## Purpose

This runbook covers Stripe webhook incident response for `POST /api/webhooks/stripe`, with focus on order creation reliability and safe replay.

## Preconditions

- `STRIPE_WEBHOOK_SECRET` is configured.
- Webhook endpoint is configured in Stripe Dashboard.
- Application logs are available for webhook request tracing.

## Normal Behavior

- Webhook signatures are verified before processing.
- Event replay window is enforced.
- Events are processed synchronously.
- Non-2xx responses are intentional for retryable failures.
- Duplicate processing is prevented with order metadata checks on:
  - `_stripe_event_id`
  - `_stripe_session_id`

## Triage Checklist

1. Confirm endpoint health in Stripe Dashboard (`Webhooks` -> endpoint status).
2. Locate event by ID and inspect delivery attempts.
3. Check app logs for structured event names:
   - `webhook_verified`
   - `webhook_event_already_processed`
   - `webhook_processing_failed`
   - `webhook_signature_verification_failed`
4. Verify WooCommerce order metadata for both session and event IDs.
5. Determine error class:
   - Signature/config error (non-retryable until fixed)
   - Upstream Woo/API transient failure (retryable)
   - Data mapping error (requires code/data fix before replay)

## Replay Procedure (Local/Dev)

1. Start local app.
2. Start Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Re-send an event:

```bash
stripe events resend <event_id>
```

4. Validate a single Woo order exists for the session and event IDs.

## Replay Procedure (Production)

1. Fix root cause first (config outage, dependency outage, mapping bug).
2. Use Stripe Dashboard or Stripe CLI to re-send failed events.
3. Monitor logs for successful processing and dedupe behavior.
4. Verify Woo order created exactly once with expected metadata.

## Secret Rotation

1. Add new webhook signing secret in Stripe Dashboard.
2. Update `STRIPE_WEBHOOK_SECRET` in deployment environment.
3. Deploy and verify new deliveries.
4. Remove deprecated secret from secret manager/config.

## Rollback Guidance

- If deploy introduces webhook processing regressions:
  1. Roll back to previous known-good build.
  2. Re-send failed events after rollback.
  3. Confirm dedupe prevents duplicate order creation.

## Verification Commands

```bash
npm run type-check
npm run lint
npm run test -- src/app/api/webhooks/stripe/route.test.ts src/app/api/checkout/shipping/route.test.ts src/app/api/shipping/calculate/route.test.ts src/app/api/checkout/route.test.ts src/lib/__tests__/utils.test.ts
npm run test:security
```

For checkout critical path confidence:

```bash
npm run test:e2e
```

CloudWatch metric filters, alarms, and query snippets are documented in [CLOUDWATCH-OBSERVABILITY.md](./CLOUDWATCH-OBSERVABILITY.md).
