'use client'

import Head from 'next/head'

interface FarcasterMetaTagsProps {
  title?: string
  description?: string
  image?: string
  buttonText?: string
  target?: string
}

/**
 * Farcaster Meta Tags Component
 * 
 * Adds proper Farcaster Frame and MiniApp meta tags to enable
 * automatic wallet connection and proper embedding in Farcaster mobile app.
 */
export function FarcasterMetaTags({
  title = "Bloom - Premium Content Platform",
  description = "Discover premium content from top creators. Purchase with instant USDC payments on Base.",
  image = "https://dxbloom.com/images/miniapp-og-image.png",
  buttonText = "Open Mini App",
  target = "https://dxbloom.com/mini"
}: FarcasterMetaTagsProps) {
  return (
    <Head>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={target} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Critical Farcaster Frame Tags for MiniApp Detection */}
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content={image} />
      <meta name="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta name="fc:frame:button:1" content={buttonText} />
      <meta name="fc:frame:button:1:action" content="link" />
      <meta name="fc:frame:button:1:target" content={target} />
      
      {/* Farcaster MiniApp Specific Tags */}
      <meta name="fc:miniapp" content="true" />
      <meta name="fc:miniapp:manifest" content="https://dxbloom.com/.well-known/farcaster.json" />
      <meta name="fc:miniapp:name" content="Bloom" />
      <meta name="fc:miniapp:icon" content="https://dxbloom.com/favicon.ico" />
      <meta name="fc:miniapp:description" content={description} />
      
      {/* Viewport and Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Preconnect to improve performance */}
      <link rel="preconnect" href="https://mainnet.base.org" />
      <link rel="preconnect" href="https://base-mainnet.g.alchemy.com" />
      
      {/* Icon Links */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  )
}