'use client'

import React from 'react'
import { SmartContentPurchaseCard } from '@/components/content/SmartContentPurchaseCard'
import { ContentPurchaseCardDemo } from '@/components/content/ContentPurchaseCardDemo'

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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
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

        {/* Features Showcase */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ✨ Key UI/UX Improvements
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Clean Token Selection</h3>
              <p className="text-sm text-gray-600">
                Dropdown-style token selector with clear balance display and status indicators
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Better Loading States</h3>
              <p className="text-sm text-gray-600">
                Skeleton loading and smooth transitions prevent layout shifts
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Modern Design</h3>
              <p className="text-sm text-gray-600">
                Gradients, shadows, and improved visual hierarchy for better UX
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile Optimized</h3>
              <p className="text-sm text-gray-600">
                Touch-friendly interface that works seamlessly on all devices
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Feedback</h3>
              <p className="text-sm text-gray-600">
                Color-coded buttons and clear status messages for different payment methods
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Production Ready</h3>
              <p className="text-sm text-gray-600">
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
