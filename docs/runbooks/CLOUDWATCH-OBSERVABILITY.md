# CloudWatch Observability Runbook

## Scope

Production monitoring for checkout, shipping, and Stripe webhook reliability.

## Log Contract

Critical server paths emit structured JSON with:

- `timestamp`
- `level`
- `service`
- `route`
- `message`
- `requestId` (when request-scoped)

Sensitive fields are redacted in logger output.

## Suggested Log Groups

- `/rockited/app/checkout`
- `/rockited/app/shipping`
- `/rockited/app/webhooks`

Retention recommendation:

- `staging`: 14 days
- `production`: 90 days

## Metric Filters

Create metric filters on application log groups:

- `checkout_failed_count` on `"message":"checkout_failed"`
- `shipping_rate_failed_count` on `"message":"shipping_rate_failed"`
- `webhook_processing_failed_count` on `"message":"webhook_processing_failed"`
- `webhook_signature_failed_count` on `"message":"webhook_signature_verification_failed"`

## Alarm Baselines

- Checkout failures:
  - Alarm when `checkout_failed_count >= 5` in `5 minutes`.
- Shipping failures:
  - Alarm when `shipping_rate_failed_count >= 5` in `5 minutes`.
- Webhook processing failures:
  - Alarm when `webhook_processing_failed_count >= 3` in `5 minutes`.
- Webhook signature failures:
  - Alarm when `webhook_signature_failed_count >= 10` in `5 minutes` (possible abuse/config issue).

## Logs Insights Queries

Checkout failures:

```sql
fields @timestamp, message, route, requestId
| filter message = "checkout_failed"
| sort @timestamp desc
| limit 100
```

Shipping failures:

```sql
fields @timestamp, message, route, requestId
| filter message like /shipping_rate_failed|shipping_calculate_failed/
| sort @timestamp desc
| limit 100
```

Webhook failures:

```sql
fields @timestamp, message, route, eventId, requestId
| filter route = "/api/webhooks/stripe" and level = "error"
| sort @timestamp desc
| limit 100
```
