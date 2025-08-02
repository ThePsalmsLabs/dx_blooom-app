/**
 * Creator Verification Demo Page
 * 
 * This page demonstrates the complete creator verification system,
 * showing different states based on creator eligibility and status.
 */

'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { AppLayout } from '@/components/layout/AppLayout'
import { CreatorVerificationStatus } from '@/components/creator/CreatorVerificationStatus'
import { AdminVerificationDashboard } from '@/components/creator/AdminVerificationDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, CheckCircle, Clock } from 'lucide-react'

export default function VerificationPage() {
  const { address, isConnected } = useAccount()

  return (
    <AppLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold">Creator Verification System</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive verification system that helps creators build trust and gain access to exclusive platform features.
            </p>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Connect Your Wallet
                </CardTitle>
                <CardDescription>
                  Connect your wallet to view your verification status and apply for verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The verification system requires a connected wallet to access creator data and submit applications.
                </p>
                <Button className="w-full" disabled>
                  Connect Wallet to Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Creator Verification Status */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Verification Status</h2>
                <CreatorVerificationStatus userAddress={address} />
              </div>

              {/* System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Verification Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Verification badge on profile
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Higher content visibility
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Priority customer support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Access to creator analytics
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">3+</Badge>
                        Content pieces published
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">$100+</Badge>
                        Total earnings
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">10+</Badge>
                        Active subscribers
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Complete</Badge>
                        Profile information
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Process Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Submit application</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span>Admin review (3-5 days)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span>Verification granted</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Demo Section */}
              <div className="border-t pt-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Admin Verification Dashboard</h2>
                  <p className="text-muted-foreground">
                    This is a demo of the admin interface for reviewing verification applications.
                    In production, this would be protected with admin authentication.
                  </p>
                </div>
                <AdminVerificationDashboard />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 