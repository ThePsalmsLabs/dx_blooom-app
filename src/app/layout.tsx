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
 * Key Changes Made to Fix Wallet Connection:
 * 1. Properly imported the fixed EnhancedWeb3Provider
 * 2. Ensured the provider wraps all children (including your home page)
 * 3. Added development debugging to help identify configuration issues
 * 4. Maintained proper import order for CSS styles
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/index'
import { EnhancedWeb3Provider, Web3ProviderDebugInfo } from '@/components/providers/Web3Provider'

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
 * Root Layout Component - The Web3 Connection Foundation
 * 
 * This component represents the architectural foundation that enables wallet
 * connections throughout your application. The key insight here is understanding
 * the provider hierarchy and why each layer is necessary.
 * 
 * Provider Hierarchy Explanation:
 * 1. EnhancedWeb3Provider (outermost): Provides the complete Web3 infrastructure
 *    including QueryClient, WagmiProvider, RainbowKitProvider, and OnchainKitProvider
 * 2. Your application content (children): All pages and components
 * 3. Toaster (global): Toast notifications for transaction feedback
 * 4. Web3ProviderDebugInfo (development only): Debugging information
 * 
 * Why This Fixes Your Wallet Connection Issue:
 * Previously, your Connect Wallet button wasn't working because the RainbowKit
 * modal system wasn't properly initialized in the provider chain. Even though
 * you had wagmi configuration, the UI components that actually display the
 * wallet selection modal weren't connected to your button clicks.
 * 
 * This corrected layout ensures that:
 * - RainbowKit's modal system is properly initialized
 * - The modal styles are loaded (imported in the provider)
 * - All pages have access to wallet connection functionality
 * - Error handling and debugging information is available during development
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* 
          The Enhanced Web3 Provider Wrapper
          
          This is the critical fix for your wallet connection issue. The
          EnhancedWeb3Provider component now properly sets up the entire
          Web3 provider chain, including RainbowKit's modal system.
          
          Everything inside this provider (including your home page with
          the Connect Wallet button) now has access to:
          - Wallet connection functionality via useAccount()
          - Network information via useChainId()
          - The actual connection modal via useConnectModal()
          - Transaction capabilities via contract interaction hooks
          
          This is why your button wasn't working before - it was like trying
          to make a phone call without being connected to a phone network.
          The button existed, but the underlying infrastructure wasn't there.
        */}
        <EnhancedWeb3Provider>
          {/* Your application content - now properly connected to Web3 infrastructure */}
          {children}
          
          {/* 
            Global Toast Notifications
            
            This provides user feedback for Web3 operations like transaction
            confirmations, error messages, and connection status updates.
            Positioned here so it appears above all other content.
          */}
          <Toaster />
          
          {/* 
            Development Debugging Information
            
            This component only appears in development mode and shows you
            whether all the necessary environment variables and configurations
            are properly set up. If you're still having issues after applying
            these fixes, check the debug info in the bottom-right corner.
          */}
          <Web3ProviderDebugInfo />
        </EnhancedWeb3Provider>
      </body>
    </html>
  )
}

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
 * The Web3ProviderDebugInfo component will show you which of these
 * are properly configured when you run the app in development mode.
 */

/**
 * Testing Your Wallet Connection Fix
 * 
 * After applying these changes, test your wallet connection by:
 * 1. Starting your development server (npm run dev)
 * 2. Navigate to your home page
 * 3. Click the Connect Wallet button
 * 4. You should now see the RainbowKit wallet selection modal
 * 5. Choose a wallet (MetaMask, Coinbase Wallet, etc.)
 * 6. Complete the connection process
 * 
 * If the modal still doesn't appear, check the Web3ProviderDebugInfo
 * in the bottom-right corner for configuration issues, and look at
 * the browser console for any error messages.
 */