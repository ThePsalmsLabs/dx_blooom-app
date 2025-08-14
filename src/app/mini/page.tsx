// src/app/mini/page.tsx
import React from 'react'
import { Metadata } from 'next'
import { ProductionMiniAppHome } from '../../components/miniapp/ProductionMiniAppHome'

/**
 * MiniApp Home Page Metadata Configuration
 * 
 * This metadata configuration establishes the page's identity within both
 * traditional web contexts and Farcaster's social ecosystem. The 'fc:frame'
 * configuration enables your MiniApp to be discovered and launched directly
 * from Farcaster feeds, creating seamless transitions from social discovery
 * to content browsing and purchasing.
 * 
 * The frame metadata follows Farcaster's specifications for MiniApp launch
 * actions, providing the necessary information for Farcaster clients to
 * present your MiniApp with appropriate visual elements and interaction
 * buttons that drive user engagement.
 */
export const metadata: Metadata = {
  title: 'Content Platform - Discover Premium Creator Content',
  description: 'Browse and purchase high-quality content from top creators using USDC on Base network. Instant transactions, creator support, and seamless social commerce in Farcaster.',
  keywords: [
    'content platform', 'creators', 'web3', 'base network', 'usdc',
    'farcaster', 'miniapp', 'social commerce', 'digital content',
    'nft', 'crypto payments', 'decentralized content',
  ],
  openGraph: {
    title: 'Content Platform - Premium Creator Content on Base',
    description: 'Discover and purchase amazing content from top creators. Instant USDC payments on Base network.',
    type: 'website',
    locale: 'en_US',
    url: `${process.env.NEXT_PUBLIC_URL}/mini`,
    siteName: 'Content Platform',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/images/miniapp-og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Content Platform - Premium Creator Content',
        type: 'image/png',
      },
      {
        url: `${process.env.NEXT_PUBLIC_URL}/images/miniapp-og-square.png`,
        width: 400,
        height: 400,
        alt: 'Content Platform Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Content Platform - Premium Creator Content',
    description: 'Discover and purchase amazing content from top creators using USDC on Base network.',
    creator: '@contentplatform',
    site: '@contentplatform',
    images: [`${process.env.NEXT_PUBLIC_URL}/images/miniapp-twitter-card.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_URL}/images/miniapp-frame-preview.png`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Browse Content',
    'fc:frame:button:1:action': 'post',
    'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_URL}/api/farcaster/frame/launch`,
    'fc:frame:post_url': `${process.env.NEXT_PUBLIC_URL}/api/farcaster/frame/mini`,
    'fc:frame:state': JSON.stringify({
      action: 'launch_miniapp',
      version: '1.0.0',
      capabilities: ['wallet', 'sharing', 'notifications'],
    }),
    'fc:miniapp:manifest': `${process.env.NEXT_PUBLIC_URL}/.well-known/farcaster.json`,
    'fc:miniapp:name': 'Content Platform',
    'fc:miniapp:icon': `${process.env.NEXT_PUBLIC_URL}/images/miniapp-icon-192.png`,
    'fc:miniapp:splash': `${process.env.NEXT_PUBLIC_URL}/images/miniapp-splash.png`,
    'fc:miniapp:theme_color': '#3B82F6',
    'fc:miniapp:background_color': '#FFFFFF',
    'application:name': 'Content Platform',
    'application:url': `${process.env.NEXT_PUBLIC_URL}/mini`,
    'theme-color': '#3B82F6',
    'msapplication-TileColor': '#3B82F6',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_URL}/mini`,
    languages: { 'en-US': `${process.env.NEXT_PUBLIC_URL}/mini` },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_TAG,
  },
  manifest: `${process.env.NEXT_PUBLIC_URL}/manifest.json`,
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

/**
 * MiniApp Home Page Component
 * 
 * This component serves as the primary entry point for users accessing your
 * content platform through Farcaster's MiniApp system. It demonstrates how
 * sophisticated Web3 applications can be seamlessly embedded within social
 * contexts while maintaining full functionality and user experience quality.
 * 
 * Key Architectural Features:
 * - Renders the MiniAppContentBrowser for comprehensive content discovery
 * - Uses established container styling patterns for visual consistency
 * - Integrates with existing MiniApp provider system for state management
 * - Provides fallback functionality for non-MiniApp environments
 * - Maintains responsive design across different viewport sizes
 * 
 * Integration Points:
 * - MiniAppContentBrowser: Handles content browsing, purchase flows, and social features
 * - Container styling: Uses 'miniapp-container' class for consistent presentation
 * - Environment detection: Automatically adapts to MiniApp vs web contexts
 * - Social commerce: Enables content discovery and purchasing within social feeds
 * 
 * The component exemplifies how modern Web3 applications can extend beyond
 * traditional web interfaces to provide native-feeling experiences within
 * social platforms, creating new opportunities for user acquisition and
 * engagement through social discovery mechanisms.
 */
export default function MiniAppPage(): React.ReactElement {
  return <ProductionMiniAppHome />
}