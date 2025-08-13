// src/app/mini/page.tsx
import React from 'react'
import { Metadata } from 'next'
import MiniAppHomeClient from '@/components/miniapp/MiniAppHomeClient'

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
  title: 'Content Platform - MiniApp',
  description: 'Discover and purchase premium content from top creators using USDC on Base network. Browse content, support creators, and enjoy seamless social commerce.',
  keywords: ['content', 'creators', 'web3', 'base', 'usdc', 'farcaster', 'miniapp'],
  
  // Open Graph metadata for social sharing outside Farcaster
  openGraph: {
    title: 'Content Platform - MiniApp',
    description: 'Discover and purchase premium content from top creators using USDC on Base network.',
    type: 'website',
    locale: 'en_US',
  },
  
  // Twitter Card metadata for additional social platform support
  twitter: {
    card: 'summary_large_image',
    title: 'Content Platform - MiniApp',
    description: 'Discover and purchase premium content from top creators using USDC on Base network.',
  },
  
  // Farcaster Frame metadata for MiniApp integration
  // This configuration enables native Farcaster client integration
  other: {
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/images/miniapp-preview.png`,
      button: {
        title: 'Browse Content',
        action: {
          type: 'launch_frame',
          name: 'Content Platform',
          url: `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/mini`,
          splashImageUrl: `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/images/miniapp-splash.png`,
          splashBackgroundColor: '#000000'
        }
      }
    }),
    
    // Additional Farcaster metadata for enhanced discovery
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:post_url': `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/api/farcaster/frame/mini`,
    
    // MiniApp specific metadata that helps Farcaster clients understand capabilities
    'fc:miniapp:version': '1.0.0',
    'fc:miniapp:name': 'Content Platform',
    'fc:miniapp:manifest_url': `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/.well-known/farcaster.json`
  },
  
  // Robots and crawling directives
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  
  // Verification and canonical URL
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_URL || 'https://content-platform.app'}/mini`,
  }
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
export default function MiniAppHome(): React.ReactElement {
  return (
    <div className="miniapp-container min-h-screen bg-background">
      <main className="miniapp-main-content">
        <div className="container mx-auto px-3 py-4">
          <MiniAppHomeClient />
        </div>
      </main>
    </div>
  )
}