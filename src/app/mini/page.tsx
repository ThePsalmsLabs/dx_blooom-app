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
      {/* MiniApp Header - Provides context and navigation within the social environment */}
      <div className="miniapp-header bg-gradient-to-r from-blue-50 to-purple-50 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Content Platform
                </h1>
                <p className="text-sm text-muted-foreground">
                  Premium creator content on Base
                </p>
              </div>
            </div>
            
            {/* MiniApp Environment Indicator */}
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                <span className="mr-1">🖼️</span>
                MiniApp
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Houses the sophisticated content browsing experience */}
      <main className="miniapp-main-content">
        <div className="container mx-auto px-4 py-6">
          {/* Welcome Section - Contextualizes the social commerce experience */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Discover Premium Content
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse and purchase high-quality content from top creators using USDC on Base network. 
              Enjoy instant transactions and support your favorite creators directly through social commerce.
            </p>
          </div>
          
          {/* Enhanced Content Browser - Client-only to support event handlers */}
          <MiniAppHomeClient />
          
          {/* Social Commerce Call-to-Action - Encourages engagement and sharing */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-center">
            <div className="text-white">
              <h3 className="text-lg font-semibold mb-2">
                Share the Experience
              </h3>
              <p className="text-blue-100 mb-4">
                Found amazing content? Share it with your network and help creators grow their audience.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Instant USDC payments</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Creator support</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Social commerce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer - Provides additional context and links for MiniApp users */}
      <footer className="miniapp-footer bg-muted/30 border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Powered by Base network</span>
              <span className="text-muted-foreground/60">•</span>
              <span>Secured by smart contracts</span>
              <span className="text-muted-foreground/60">•</span>
              <span>Enhanced for social commerce</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}