# YourBrand - Next.js WooCommerce Marketing Site

A modern, responsive e-commerce website built with Next.js 14, TypeScript, and Tailwind CSS. Features WooCommerce as a headless backend and Stripe for payments.

## Features

- 🛍️ **Product Catalog**: Display products from WooCommerce with ISR (Incremental Static Regeneration)
- 🛒 **Shopping Cart**: Persistent cart with local storage using Zustand
- 💳 **Stripe Checkout**: Secure payment processing
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- ⚡ **Performance**: Optimized with Next.js 14 App Router and ISR
- 🎨 **Dark Theme**: Clean, modern design with dark theme preference
- 📦 **Real-time Inventory**: Live pricing and stock status updates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: WooCommerce REST API
- **Payments**: Stripe Checkout
- **State Management**: Zustand
- **Deployment**: AWS Amplify
- **Hosting**: AWS CloudFront CDN

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WooCommerce store with REST API enabled
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rockited-v1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# WooCommerce Configuration
WOOCOMMERCE_URL=https://your-lightsail-instance.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── product/          # Product-specific components
│   └── layout/           # Layout components
└── lib/                   # Utilities & configs
    ├── woocommerce.ts    # WooCommerce API client
    ├── stripe.ts         # Stripe integration
    ├── store.ts          # Zustand store
    └── types.ts          # TypeScript types
```

## Deployment

### AWS Amplify

1. Connect your GitHub repository to AWS Amplify
2. The `amplify.yml` file is already configured for the build process
3. Set environment variables in the Amplify console
4. Deploy your custom domain

### Environment Variables for Production

Make sure to set these in your Amplify console:

- `WOOCOMMERCE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`

## WooCommerce Setup

1. Enable REST API in your WooCommerce store
2. Generate API credentials (Consumer Key & Secret)
3. Ensure your WooCommerce store is accessible from the internet
4. Configure CORS if needed for your domain

## Stripe Setup

1. Create a Stripe account
2. Get your publishable and secret keys
3. Configure webhook endpoints (optional)
4. Test with Stripe's test mode first

### Testing

See `STRIPE_TEST_CHECKOUT.md` for test card numbers and testing scenarios for the Stripe integration.

## Performance Features

- **ISR (Incremental Static Regeneration)**: Product pages are statically generated and revalidated
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic code splitting with Next.js
- **CDN**: AWS CloudFront for global content delivery

## Cost Optimization

- **ISR over SSR**: Reduces serverless function invocations
- **Static Generation**: Homepage and product listings are pre-built
- **Client-side Inventory**: Real-time checks only when needed
- **AWS Free Tier**: Designed to stay within AWS free tier limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourbrand.com or create an issue in the repository.