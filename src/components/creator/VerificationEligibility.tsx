/**
 * Verification Eligibility Components
 * 
 * This file contains components that show creators their progress toward
 * verification and what requirements they need to meet.
 */

'use client'

import React from 'react'
import {
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Progress,
  Separator
} from '@/components/ui/index'

import { VERIFICATION_REQUIREMENTS } from './CreatorVerificationStatus'

/**
 * Verified Creator Card - Shows benefits and status for verified creators
 */
export function VerifiedCreatorCard({ creatorProfile }: { creatorProfile: any }) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Verified Creator
        </CardTitle>
        <CardDescription className="text-green-700">
          You're a verified creator with full access to all platform benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VERIFICATION_REQUIREMENTS.verifiedBenefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="text-sm text-green-700">
          <p><strong>Verification Date:</strong> {new Date(creatorProfile.registrationTime * 1000).toLocaleDateString()}</p>
          <p className="mt-1">Your verified status helps build trust with your audience and improves content discoverability.</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Verification Eligibility Card - Shows progress toward verification
 */
export function VerificationEligibilityCard({ 
  eligibilityCheck 
}: { 
  eligibilityCheck: { eligible: boolean; issues: string[]; score: number } 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Creator Verification Progress
        </CardTitle>
        <CardDescription>
          Complete these requirements to become eligible for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Verification Readiness</span>
            <span>{eligibilityCheck.score}%</span>
          </div>
          <Progress value={eligibilityCheck.score} className="h-2" />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Outstanding Requirements:</h4>
          {eligibilityCheck.issues.map((issue, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
        </div>

        {eligibilityCheck.score >= 50 && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              You're making good progress! Complete the remaining requirements to apply for verification.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 