'use client'

import React from 'react'
import { SmartContentPurchaseCard } from '@/components/content/SmartContentPurchaseCard'
import { ContentPurchaseCardDemo } from '@/components/content/ContentPurchaseCardDemo'
import { Button } from '@/components/ui/button'

/**
 * Enhanced UI Demo Page
 * 
 * This page showcases the enhanced purchase card UI improvements.
 * Visit localhost:3002/demo/enhanced-ui to see the improvements in action.
 */
export default function EnhancedUIDemoPage() {
  // Use some real content IDs from your platform
  const demoContentIds = [BigInt(1), BigInt(2), BigInt(3)]

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Enhanced Web3 Purchase Interface
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the improved user interface with cleaner design, better token selection, 
            and enhanced visual feedback for Web3 content purchases.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {/* Enhanced Purchase Cards */}
          {demoContentIds.map((contentId, index) => (
            <div key={contentId.toString()} className="flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Enhanced Card #{index + 1}
              </h3>
              <SmartContentPurchaseCard
                contentId={contentId}
                showBalanceDetails={true}
                enableSwapIntegration={true}
                onPurchaseSuccess={() => {
                  console.log(`Demo purchase successful for content ${contentId}`)
                }}
                className="flex-1"
              />
            </div>
          ))}
        </div>

        {/* Enhanced Content Browser Demo */}
        <div className="bg-card border rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            🎯 New Enhanced Content Browser
          </h2>
          <p className="text-muted-foreground mb-6 text-center max-w-3xl mx-auto">
            The new responsive content browser automatically calculates optimal grid layouts, 
            provides smooth sidebar transitions, and maintains perfect typography scaling across all devices.
          </p>
          
          <div className="text-center">
            <Button asChild size="lg">
              <a href="/browse/enhanced">
                Experience Enhanced Browser
              </a>
            </Button>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-card border rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            ✨ Key UI/UX Improvements
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Clean Token Selection</h3>
              <p className="text-sm text-muted-foreground">
                Dropdown-style token selector with clear balance display and status indicators
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Better Loading States</h3>
              <p className="text-sm text-muted-foreground">
                Skeleton loading and smooth transitions prevent layout shifts
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Theme-Aware Design</h3>
              <p className="text-sm text-muted-foreground">
                Proper light/dark mode support using your design system tokens
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Responsive Grid System</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent column calculation that adapts to any screen size
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Layout</h3>
              <p className="text-sm text-muted-foreground">
                Smooth sidebar transitions and optimal content organization
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Production Ready</h3>
              <p className="text-sm text-muted-foreground">
                Full integration with existing smart contracts and error handling
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggle Demo */}
        <div className="bg-card border rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            🌙 Theme Support Demo
          </h2>
          <p className="text-muted-foreground mb-6">
            The enhanced UI now properly supports both light and dark modes using your project's design tokens. 
            Try switching themes to see how the colors adapt seamlessly!
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Light Mode</h3>
              <p className="text-sm text-muted-foreground">Clean, bright interface with subtle shadows and amber accents</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">Elegant dark interface with proper contrast and accessibility</p>
            </div>
          </div>
        </div>

        {/* How to Access */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            🚀 How to See These Improvements
          </h2>
          
          <div className="space-y-4 text-foreground">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-semibold">Browse Content</p>
                <p className="text-sm text-muted-foreground">Visit <code className="bg-muted px-2 py-1 rounded">/browse</code> to see enhanced purchase cards in the content grid</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-semibold">View Content Details</p>
                <p className="text-sm text-muted-foreground">Click any content to see the enhanced purchase card in the sidebar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-semibold">Try Purchase Flow</p>
                <p className="text-sm text-muted-foreground">Connect your wallet and interact with the enhanced token selector and purchase buttons</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="font-semibold">Enhanced Content Browser</p>
                <p className="text-sm text-muted-foreground">Visit <code className="bg-muted px-2 py-1 rounded">/browse/enhanced</code> to see the new responsive grid system in action</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
              <div>
                <p className="font-semibold">Test Theme Switching</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark modes to see how the UI adapts seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
