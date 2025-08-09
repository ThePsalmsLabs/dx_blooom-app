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
 * 1. Replaced individual providers with AllProviders for proper hierarchy
 * 2. Ensured AuthProvider is available to all components
 * 3. Added development debugging to help identify configuration issues
 * 4. Maintained proper import order for CSS styles
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AllProviders } from '@/components/providers/AllProviders'
// Root layout is a Server Component; avoid client hooks here

// Import global styles - the order here matters!
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import '../styles/rainbowkit-fixes.css'

// Configure the Inter font for optimal performance and accessibility
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevents layout shift while font loads
  variable: '--font-inter' // CSS custom property for the font
})

// Comprehensive metadata configuration for SEO and social sharing
export const metadata: Metadata = {
  title: {
    template: '%s | OnChain Content Platform',
    default: 'OnChain Content Platform - Create, Share, and Earn'
  },
  description: 'The decentralized platform where creators own their content, build direct relationships with their audience, and earn fairly for their work through blockchain technology.',
  keywords: ['Web3', 'Content Creation', 'Blockchain', 'Creator Economy', 'USDC', 'Base Network'],
  authors: [{ name: 'OnChain Content Platform' }],
  creator: 'OnChain Content Platform',
  publisher: 'OnChain Content Platform',
  
  // Open Graph configuration for social media sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    title: 'OnChain Content Platform - Create, Share, and Earn',
    description: 'The decentralized platform where creators own their content and earn fairly through blockchain technology.',
    siteName: 'OnChain Content Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OnChain Content Platform'
      }
    ]
  },
  
  // Twitter Card configuration
  twitter: {
    card: 'summary_large_image',
    title: 'OnChain Content Platform - Create, Share, and Earn',
    description: 'The decentralized platform where creators own their content and earn fairly through blockchain technology.',
    images: ['/twitter-image.png'],
    creator: '@yourhandle'
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
 * 1. Wrapped everything with AllProviders to establish context hierarchy
 * 2. Removed the individual provider imports since they're now in AllProviders
 * 3. Added development debugging to help identify issues
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased bg-white bg-amber-glow">
        {/* 
          🔧 KEY FIX: This AllProviders wrapper ensures that every component
          in your app has access to all the context providers, including AuthProvider.
          
          This is like connecting the main electrical panel to every room in the house.
          Now any component anywhere in your app can use useAuth, useWeb3, etc.
        */}
        <AllProviders>
          {/* 
            Development Debug Info - Remove this in production
            This helps you verify that providers are working correctly
          */}
          {/* Debug UI removed to keep layout a pure Server Component */}
          
          {children}
        </AllProviders>
      </body>
    </html>
  )
}

/**
 * Provider Debug Component
 * 
 * This component helps you verify that your providers are working correctly
 * during development. It will show you the current state of your contexts.
 */
// Removed client-only debug helpers from Server Component

/**
 * Environment Variables Checklist
 * 
 * For wallet connections to work properly, make sure you have these
 * environment variables configured in your .env.local file:
 * 
 * Required for basic functionality:
 * - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (get from WalletConnect Cloud)
 * - NEXT_PUBLIC_ALCHEMY_API_KEY (get from Alchemy dashboard)
 * 
 * Optional for enhanced features:
 * - NEXT_PUBLIC_COINBASE_PROJECT_ID (for Coinbase-specific features)
 * - NEXT_PUBLIC_ONCHAINKIT_API_KEY (for OnchainKit enhanced UI)
 * - NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY (for gasless transactions)
 * 
 * The ProviderDebugInfo component will show you which of these
 * are properly configured when you run the app in development mode.
 */

/**
 * Testing Your Provider Fix
 * 
 * After applying these changes, test your provider setup by:
 * 1. Starting your development server (npm run dev)
 * 2. Navigate to your dashboard page
 * 3. Check the debug info in the bottom-left corner
 * 4. You should see both AuthProvider and Web3Provider showing as available
 * 5. The dashboard should load without the "useAuth must be used within an AuthProvider" error
 * 
 * If you still see errors, check the ProviderDebugInfo
 * in the bottom-left corner for configuration issues, and look at
 * the browser console for any error messages.
 */