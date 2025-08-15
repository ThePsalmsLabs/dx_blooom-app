/**
 * Root Layout - The Foundation of Your Web3 Application
 * 
 * This file serves as the foundation for your entire application. Think of it
 * like the electrical panel in a house - if it's not properly wired, nothing
 * else in the house will work correctly, no matter how good the individual
 * components are.
 * 
 * The critical insight here is that Web3 functionality (including wallet
 * connections) requires a specific provider hierarchy to be established at
 * the root level. Every page and component in your app inherits from this
 * layout, so if the providers aren't properly configured here, wallet
 * connections won't work anywhere in your application.
 * 
 * Key Changes Made to Fix Provider Issues:
 * 1. Replaced individual providers with UnifiedAppProvider for proper hierarchy
 * 2. Ensured AuthProvider is available to all components
 * 3. Added development debugging to help identify configuration issues
 * 4. Maintained proper import order for CSS styles
 */

import type { Metadata } from 'next'
import { Providers } from '@/components/providers/Providers'
// Root layout is a Server Component; avoid client hooks here

// Import RainbowKit styles before app globals to ensure base modal styles load correctly
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'

// Comprehensive metadata configuration for SEO and social sharing
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    template: '%s | Bloom',
    default: 'Bloom - Create, Share, and Earn'
  },
  description: 'The decentralized platform where creators own their content, build direct relationships with their audience, and earn fairly for their work through blockchain technology.',
  keywords: ['Web3', 'Content Creation', 'Blockchain', 'Creator Economy', 'USDC', 'Base Network'],
  authors: [{ name: 'Bloom' }],
  creator: 'Bloom',
  publisher: 'Bloom',
  
  // Open Graph configuration for social media sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dxbloom.com',
    title: 'Bloom - Create, Share, and Earn',
    description: 'The decentralized platform where creators own their content and earn fairly through blockchain technology.',
    siteName: 'Bloom',
    images: [
      {
        url: '/images/miniapp-og-square.png',
        width: 400,
        height: 400,
        alt: 'Bloom'
      }
    ]
  },
  
  // Twitter Card configuration
  twitter: {
    card: 'summary_large_image',
    title: 'Bloom - Create, Share, and Earn',
    description: 'The decentralized platform where creators own their content and earn fairly through blockchain technology.',
    images: ['/images/miniapp-og-square.png'],
    creator: '@bloom'
  },
  
  // Search engine optimization
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  
  // Site verification for search engines
  verification: {
    google: 'your-google-verification-code'
  },
  
  // Favicon configuration
  icons: {
    icon: [
      { url: '/images/miniapp-og-square.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/miniapp-og-square.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/miniapp-og-square.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/images/miniapp-og-square.png'
  }
}

/**
 * Root Layout Component - The Provider Connection Foundation
 * 
 * This is the foundation of your entire application. Every page and component
 * in your app will inherit from this layout, so this is where we establish
 * the provider hierarchy that makes context available everywhere.
 * 
 * Key Changes Made:
 * 1. Wrapped everything with UnifiedAppProvider to establish context hierarchy
 * 2. Added WagmiProvider and QueryClientProvider for Web3 functionality
 * 3. Added development debugging to help identify issues
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-context="desktop">
      <body className="min-h-screen bg-background font-sans antialiased bg-amber-glow">
        {/* 
          🔧 KEY FIX: This provider hierarchy ensures that every component
          in your app has access to all the context providers, including AuthProvider.
          
          This is like connecting the main electrical panel to every room in the house.
          Now any component anywhere in your app can use useAuth, useWeb3, etc.
        */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
