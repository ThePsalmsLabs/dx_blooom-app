/**
 * Verification Application Component
 * 
 * This component handles the verification application form and submission
 * process for creators who meet the eligibility requirements.
 */

'use client'

import React, { useState, useCallback } from 'react'
import {
  Shield,
  Clock
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea
} from '@/components/ui/index'

/**
 * Verification Application Data Interface
 */
interface VerificationApplicationData {
  readonly bio: string
  readonly websiteUrl: string
  readonly twitterHandle: string
  readonly linkedinProfile: string
  readonly portfolioUrl: string
  readonly verificationReason: string
}

/**
 * Verification Application Card - The actual application form
 */
export function VerificationApplicationCard({ creatorAddress }: { creatorAddress?: string }) {
  const [applicationData, setApplicationData] = useState<VerificationApplicationData>({
    bio: '',
    websiteUrl: '',
    twitterHandle: '',
    linkedinProfile: '',
    portfolioUrl: '',
    verificationReason: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Submit verification application
      const response = await fetch('/api/verification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress,
          ...applicationData
        })
      })

      if (response.ok) {
        setHasApplied(true)
      } else {
        throw new Error('Application submission failed')
      }
    } catch (error) {
      console.error('Verification application error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [creatorAddress, applicationData])

  if (hasApplied) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Clock className="h-5 w-5" />
            Application Submitted
          </CardTitle>
          <CardDescription className="text-blue-700">
            Your verification application is under review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            We\'ll review your application within 3-5 business days. You\'ll receive an email notification 
            when your verification status is updated.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Apply for Creator Verification
        </CardTitle>
        <CardDescription>
          You meet the requirements! Complete this application to request verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Creator Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your content and what makes you unique..."
              value={applicationData.bio}
              onChange={(e) => setApplicationData(prev => ({ ...prev, bio: e.target.value }))}
              required
              minLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 100 characters. This will enhance your profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://your-website.com"
                value={applicationData.websiteUrl}
                onChange={(e) => setApplicationData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Handle</Label>
              <Input
                id="twitter"
                placeholder="@yourusername"
                value={applicationData.twitterHandle}
                onChange={(e) => setApplicationData(prev => ({ ...prev, twitterHandle: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you want to be verified?</Label>
            <Textarea
              id="reason"
              placeholder="Explain why verification would benefit you and your audience..."
              value={applicationData.verificationReason}
              onChange={(e) => setApplicationData(prev => ({ ...prev, verificationReason: e.target.value }))}
              required
              minLength={50}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submit Verification Application
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 