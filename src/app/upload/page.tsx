/**
 * Content Upload Page - Creator Content Publishing Interface
 * File: src/app/upload/page.tsx
 * 
 * This page provides creators with a comprehensive interface for uploading and
 * monetizing their content. It demonstrates how sophisticated Web3 workflows
 * can be made accessible through intuitive UI design and clear step-by-step guidance.
 * 
 * Integration Showcase:
 * - ContentUploadForm handles the complete upload workflow
 * - RouteGuards ensure only verified creators can access this page
 * - AppLayout provides consistent navigation and responsive design
 * - useAccount provides wallet connection state for creator verification
 * - Metadata generation for SEO and social sharing optimization
 * 
 * This page represents the critical creator onboarding moment where content
 * creators transform their work into blockchain-secured digital assets.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import {
  ArrowLeft,
  Upload as UploadIcon,
  Lightbulb,
  DollarSign,
  Users,
  Zap
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Separator
} from '@/components/ui/index'

// Import our architectural layers
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentUploadForm } from '@/components/content/ContentUpload'

// Import utility functions

/**
 * Upload Tips Component
 * 
 * This component provides helpful guidance to creators about how to optimize
 * their content for maximum engagement and revenue on the platform.
 */
function UploadTips() {
  const tips = [
    {
      icon: Lightbulb,
      title: "Quality Content",
      description: "High-quality, original content performs better and builds loyal audiences."
    },
    {
      icon: DollarSign,
      title: "Smart Pricing",
      description: "Research similar content to find the sweet spot between accessibility and value."
    },
    {
      icon: Users,
      title: "Know Your Audience",
      description: "Use relevant tags and descriptions to help the right people discover your content."
    },
    {
      icon: Zap,
      title: "Consistent Publishing",
      description: "Regular uploads help build momentum and grow your creator reputation."
    }
  ]

  return (
    <Card className="mb-6 md:mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="leading-tight">Bloom Growth Strategies</span>
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Cultivate your creative garden with these strategies for maximum impact and sustainable growth
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-3 p-3 md:p-4 rounded-lg bg-muted/50">
              <tip.icon className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-sm md:text-base">{tip.title}</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Upload Page Header Component
 * 
 * This component provides clear navigation and context for the upload process,
 * helping creators understand where they are in their content creation journey.
 */
function UploadPageHeader() {
  const router = useRouter()

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-2 md:gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-1 md:gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      <div className="space-y-3 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
          <UploadIcon className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
          <span className="leading-tight">Bloom Your Content</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Transform your creative vision into a flourishing digital asset. Share authentic stories, innovative ideas,
          and transformative content that resonates with real audiences in the Web3 creator economy.
        </p>
      </div>
    </div>
  )
}

/**
 * Creator Onboarding Alert Component
 * 
 * This component helps new users understand what they need to do to become
 * a content creator on the platform, providing clear next steps.
 */
function CreatorOnboardingAlert() {
  const router = useRouter()

  return (
    <Alert className="mb-4 md:mb-6">
      <UploadIcon className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <span className="text-sm">
          New to creating? Learn how to set up your creator profile and start earning.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/onboard')}
          className="self-start sm:self-auto"
        >
          Get Started
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Upload Page Component
 * 
 * This is the main page component that orchestrates the entire upload experience.
 * It demonstrates how complex Web3 workflows can be presented as familiar,
 * user-friendly interfaces that guide creators through content monetization.
 */
export default function UploadPage() {
  const router = useRouter()
  const walletUI = useWalletConnectionUI()

  // Handle successful content upload
  const handleUploadSuccess = React.useCallback((contentId: bigint) => {
    // Redirect to the content page to show the newly uploaded content
    router.push(`/content/${contentId}`)
  }, [router])

  // Handle upload cancellation
  const handleUploadCancel = React.useCallback(() => {
    // Redirect back to dashboard or browse page
    router.push('/dashboard')
  }, [router])

  return (
    <AppLayout>
      <RouteGuards 
        requiredLevel="creator_basic"
        routeConfig={{
          path: '/upload',
          friendlyName: 'Content Upload',
          description: 'Upload and monetize your creative content',
          category: 'creator'
        }}
      >
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
          {/* Page Header */}
          <UploadPageHeader />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-2">
              {/* Creator Onboarding Help */}
              <CreatorOnboardingAlert />

              {/* Upload Form */}
              <ContentUploadForm
                userAddress={walletUI.address && typeof walletUI.address === 'string' ? walletUI.address as `0x${string}` : undefined}
                onSuccess={handleUploadSuccess}
                onCancel={handleUploadCancel}
                variant="page"
                className="w-full"
              />
            </div>

            {/* Sidebar with Tips and Information */}
            <div className="lg:col-span-1">
              <UploadTips />
              
              {/* Additional Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Upload Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-3">
                  <div className="text-xs md:text-sm space-y-2">
                    <p className="font-medium">Supported Formats:</p>
                    <div className="text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">Documents:</strong> PDF, TXT, MD</p>
                      <p><strong className="text-foreground">Images:</strong> JPG, PNG, GIF</p>
                      <p><strong className="text-foreground">Videos:</strong> MP4, WEBM</p>
                      <p><strong className="text-foreground">Audio:</strong> MP3, WAV</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs md:text-sm space-y-2">
                    <p className="font-medium">File Size Limits:</p>
                    <div className="text-muted-foreground space-y-1">
                      <p>Maximum file size: <strong className="text-foreground">100MB</strong></p>
                      <p>For larger files, consider compression or contact support</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs md:text-sm space-y-2">
                    <p className="font-medium">Content Policy:</p>
                    <p className="text-muted-foreground leading-relaxed">
                      All content must be original or properly licensed.
                      Respect copyright and community guidelines.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}