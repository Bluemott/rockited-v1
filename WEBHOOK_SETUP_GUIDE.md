# Stripe Webhook Setup Guide

## Overview

This guide explains how to set up and test Stripe webhooks for your application. Webhooks allow Stripe to notify your application when important events occur, such as successful payments.

## Local Development Testing

### Step 1: Install Stripe CLI

1. Download and install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Authenticate with your Stripe account:
   ```bash
   stripe login
   ```

### Step 2: Forward Webhooks to Local Server

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. The CLI will output a webhook signing secret. Copy it:
   ```
   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

4. Add this secret to your `.env.local` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Step 3: Test Webhook Events

1. Trigger a test event using the Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

2. Check your terminal and server logs to verify the webhook was received and processed.

3. Test with actual checkout:
   - Use test card `4242 4242 4242 4242` for successful payments
   - Use test card `4000 0000 0000 0002` for declined payments
   - Complete a checkout and verify the webhook fires

## Production Setup

### Step 1: Deploy Your Application

Ensure your application is deployed and accessible via HTTPS. The webhook endpoint must be:
- Publicly accessible
- Using HTTPS (required by Stripe)
- URL: `https://your-domain.com/api/webhooks/stripe`

### Step 2: Register Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Workbench** > **Webhooks** (or **Developers** > **Webhooks** in older dashboards)
3. Click **Add destination** or **Add endpoint**
4. Configure the endpoint:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   - **Description**: "Production webhook for checkout events"
   - **API Version**: Use your account's API version (or the one specified in your code)
5. Select the events to listen for:
   - `checkout.session.completed` - Payment succeeded
   - `checkout.session.async_payment_succeeded` - Delayed payment succeeded
   - `checkout.session.async_payment_failed` - Delayed payment failed
6. Click **Create destination** or **Add endpoint**

### Step 3: Get Webhook Signing Secret

1. After creating the endpoint, click on it to view details
2. Click **Reveal** or **Click to reveal** next to "Signing secret"
3. Copy the signing secret (starts with `whsec_`)
4. Add it to your production environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Step 4: Test Production Webhook

1. Use the Stripe Dashboard to send a test event:
   - Go to your webhook endpoint
   - Click **Send test webhook**
   - Select `checkout.session.completed`
   - Click **Send test webhook**

2. Check your application logs to verify the webhook was received and processed correctly.

## Webhook Events Handled

The application currently handles the following Stripe webhook events:

### `checkout.session.completed`
- **When**: Customer successfully completes checkout
- **Action**: Creates WooCommerce order
- **Status**: Payment must be `paid`

### `checkout.session.async_payment_succeeded`
- **When**: Delayed payment (e.g., bank transfer) succeeds
- **Action**: Creates WooCommerce order if it doesn't exist
- **Status**: Payment must be `paid`

### `checkout.session.async_payment_failed`
- **When**: Delayed payment fails
- **Action**: Logs the failure (you can extend this to update order status)

## Security Features

The webhook endpoint includes several security measures:

1. **Signature Verification**: All webhooks are verified using Stripe's signature
2. **Replay Attack Prevention**: Events older than 5 minutes are rejected
3. **Idempotency**: Duplicate orders are prevented by checking for existing orders
4. **Error Handling**: Failed webhooks are logged for manual review

## Troubleshooting

### Webhook Not Received

1. **Check endpoint URL**: Ensure it's publicly accessible and using HTTPS
2. **Verify signature secret**: Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
3. **Check firewall**: Ensure your server allows incoming POST requests
4. **View webhook logs**: Check Stripe Dashboard > Webhooks > Your endpoint > Recent events

### Signature Verification Failed

1. Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
2. Verify you're using the correct secret for test vs. live mode
3. Check that the request body is being read correctly (raw body required)

### Orders Not Created

1. **Check webhook logs**: Verify the webhook is being received
2. **Check application logs**: Look for errors in order creation
3. **Verify product IDs**: Ensure Stripe line items have `woocommerce_product_id` in metadata
4. **Check WooCommerce API**: Verify API credentials are correct and have order creation permissions

### Testing Tips

- Use Stripe's test mode for all development
- Test with various payment scenarios (success, decline, 3D Secure)
- Monitor webhook delivery status in Stripe Dashboard
- Check application logs for detailed error messages

## Next Steps

After webhooks are working:

1. Set up monitoring/alerting for failed webhooks
2. Consider adding more event types (refunds, disputes, etc.)
3. Implement order status updates based on payment status
4. Add email notifications for order creation

