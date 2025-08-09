## Environment Variables (Base Mainnet)

Create a `.env.local` at the repo root with:

```
NEXT_PUBLIC_NETWORK=base

# RPC endpoints (optional; defaults are used if unset)
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org

# Deployed contract addresses (override defaults if you redeploy)
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x13056B1dFE38dA0c058e6b2B2e3DaecCEdCEFFfF
NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS=0x6b88ae6538FB8bf8cbA1ad64fABb458aa0CE4263
NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS=0xB4cbF1923be6FF1bc4D45471246D753d34aB41d7
NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS=0x8A89fcAe4E674d6528A5a743E468eBE9BDCf3101
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS=0x06D92f5A03f177c50A6e14Ac6a231cb371e67Da4
NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS=0x931601610C9491948e7cEeA2e9Df480162e45409

# x402
NEXT_PUBLIC_X402_RESOURCE_WALLET=0xYourResourceWallet

# OnchainKit / App URL
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
NEXT_PUBLIC_URL=https://your.app.url
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
