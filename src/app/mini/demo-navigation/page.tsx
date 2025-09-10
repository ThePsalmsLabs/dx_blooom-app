/**
 * Demo Navigation Page
 * File: src/app/mini/demo-navigation/page.tsx
 * 
 * A demo page to showcase the new ultra-modern MiniAppNavigation component
 */

'use client'

import React from 'react'
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Zap, 
  Heart, 
  Star, 
  Rocket,
  CheckCircle
} from 'lucide-react'

export default function DemoNavigationPage() {
  return (
    <MiniAppLayout
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ultra Modern Navigation
            </h1>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the future of mobile navigation with glassmorphism effects, 
            smooth animations, and Farcaster-native design patterns.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ultra Modern Design
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Smooth Animations
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              <Heart className="h-3 w-3 mr-1" />
              Farcaster Native
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bottom Navigation */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Star className="h-4 w-4 text-white" />
                </div>
                Bottom Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Mobile-first bottom navigation with floating island design, 
                perfect for thumb accessibility and modern mobile UX.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Floating glassmorphism design
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Smooth active state animations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Haptic feedback simulation
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Connect Button */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                Unified Connect Button
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Single connect button that automatically uses the correct 
                connection method based on context (Farcaster vs Web).
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Farcaster auto-wallet integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time connection status
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Animated loading states
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Theme Toggle */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                Theme Toggle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Beautifully animated theme toggle with smooth transitions 
                and modern icon animations.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Smooth icon transitions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  System theme detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Persistent preferences
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Social Integration */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Social Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Native integration with Farcaster social context, 
                displaying user profile and connection status.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Farcaster profile display
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time social context
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Avatar and username
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center">Try It Out!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Navigate between pages using the bottom navigation bar to experience 
              the smooth animations and modern design.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Tap navigation items
              </Button>
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Test connect button
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Toggle theme
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MiniAppLayout
  )
}