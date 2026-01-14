# Stripe Test Checkout Information

This file contains test card numbers and information for testing your Stripe integration in test mode.

## Test Card Numbers

### Successful Payments

**Visa (Default)**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Visa (Debit)**
- Card Number: `4000 0566 5566 5556`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Mastercard**
- Card Number: `5555 5555 5555 4444`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**American Express**
- Card Number: `3782 822463 10005`
- Expiry: Any future date
- CVC: Any 4 digits
- ZIP: Any 5 digits

**Discover**
- Card Number: `6011 1111 1111 1117`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Declined Cards (for error testing)

**Card Declined (Generic)**
- Card Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Insufficient Funds**
- Card Number: `4000 0000 0000 9995`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Lost Card**
- Card Number: `4000 0000 0000 9987`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Stolen Card**
- Card Number: `4000 0000 0000 9979`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Expired Card**
- Card Number: `4000 0000 0000 0069`
- Expiry: Any past date (e.g., `12/20`)
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Incorrect CVC**
- Card Number: `4000 0000 0000 0127`
- Expiry: Any future date
- CVC: Any incorrect CVC
- ZIP: Any 5 digits

**Processing Error**
- Card Number: `4000 0000 0000 0119`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## 3D Secure (Authentication Required)

**3D Secure Authentication Required**
- Card Number: `4000 0027 6000 3184`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits
- Note: This will trigger 3D Secure authentication flow

**3D Secure Authentication Failed**
- Card Number: `4000 0000 0000 3055`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Test Email Addresses

Use any email address for testing. Examples:
- `test@example.com`
- `customer@test.com`
- `buyer@stripe-test.com`

## Test Shipping Addresses

**US Address (Standard)**
- Address Line 1: `123 Main Street`
- Address Line 2: `Apt 4B` (optional)
- City: `San Francisco`
- State: `CA`
- ZIP: `94102`
- Country: `United States`

**International Address (Testing Shipping Zones)**
- Address Line 1: `10 Downing Street`
- City: `London`
- Postal Code: `SW1A 2AA`
- Country: `United Kingdom`

## Test Phone Numbers

Any phone number format works in test mode:
- `(555) 123-4567`
- `555-123-4567`
- `+1 555 123 4567`

## Testing Scenarios

### Basic Checkout Flow
1. Add items to cart
2. Go to checkout
3. Enter shipping address (triggers shipping calculation)
4. Use card: `4242 4242 4242 4242`
5. Complete payment

### Tax Calculation Testing
- Ensure `STRIPE_TAX_ENABLED` is set in your `.env.local`
- Stripe Tax will automatically calculate taxes based on the shipping address
- Test with different US states to see varying tax rates

### Shipping Calculation Testing
- Enter different shipping addresses to test WooCommerce shipping zone calculations
- Verify shipping options appear correctly in Stripe checkout
- Test with international addresses if you have international shipping zones configured

### Error Handling Testing
- Use declined card numbers to test error handling
- Test expired cards
- Test 3D Secure authentication flow

### Promotion Codes (if enabled)
- Create test promotion codes in your Stripe Dashboard
- Enter them in the checkout to test discount application

## Important Notes

⚠️ **Test Mode Only**
- These card numbers only work in Stripe test mode
- Never use these in production
- Ensure `STRIPE_SECRET_KEY` starts with `sk_test_` for test mode

🔑 **API Keys**
- Test Publishable Key: Starts with `pk_test_`
- Test Secret Key: Starts with `sk_test_`
- Check your `.env.local` file to verify you're using test keys

✅ **No Real Charges**
- Test mode never charges real money
- You can use any card number, expiry, CVC, etc.
- All transactions are simulated

## Stripe Dashboard

Access your test dashboard at: https://dashboard.stripe.com/test

- View all test payments
- Inspect checkout sessions
- Check webhook events
- Monitor API requests

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Test Card Numbers Reference](https://stripe.com/docs/testing#cards)
- [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test)

