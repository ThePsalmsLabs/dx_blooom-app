/**
 * Root Layout - Web3 Provider Integration Fix
 * File: src/app/layout.tsx
 * 
 * This file ensures that all pages in your application have access to Web3 
 * functionality by wrapping them in the necessary providers at the root level.
 * 
 * The key insight here is that Next.js App Router requires providers to be
 * set up in the layout file that covers all the routes where you want to
 * use those providers. Since your home page is at the root level, it needs
 * the Web3Provider to be set up in this root layout.
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/index'
import { EnhancedWeb3Provider } from '@/components/providers/Web3Provider'
import './globals.css'


// Configure the Inter font for optimal performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

// Metadata configuration for SEO and social sharing
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
  twitter: {
    card: 'summary_large_image',
    title: 'OnChain Content Platform - Create, Share, and Earn',
    description: 'The decentralized platform where creators own their content and earn fairly through blockchain technology.',
    images: ['/twitter-image.png'],
    creator: '@yourhandle'
  },
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
  verification: {
    google: 'your-google-verification-code'
  }
}

/**
 * Root Layout Component
 * 
 * This component wraps your entire application and provides:
 * 1. Web3 Provider context for all Wagmi hooks to function
 * 2. Global styling and font configuration
 * 3. Toast notifications for user feedback
 * 4. Proper HTML structure with metadata
 * 
 * The critical fix here is ensuring Web3Provider wraps {children},
 * which includes your home page and all other routes.
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
          This is the crucial fix: Web3Provider must wrap all children
          so that every page (including your home page) has access to
          Wagmi hooks like useAccount(), useChainId(), etc.
        */}
        <EnhancedWeb3Provider>
          {/* Your application content */}
          {children}
          
          {/* Global toast notifications for user feedback */}
          <Toaster />
        </EnhancedWeb3Provider>
      </body>
    </html>
  )
}