'use client'

import React from 'react'
import { CreatorVerificationStatus } from '@/components/creator/CreatorVerificationStatus'
import { MiniAppWalletProvider } from '@/contexts/MiniAppWalletContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, Users, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function MiniAppVerificationPage() {
  return (
    <MiniAppWalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Bloom Verification</h1>
            </div>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Build trust and unlock premium features with creator verification
            </p>
          </div>

          {/* Verification Status Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardContent className="p-4">
              <CreatorVerificationStatus />
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Verification Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">✨</Badge>
                  <span className="text-xs">Verified Badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">📈</Badge>
                  <span className="text-xs">Higher Visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">🎯</Badge>
                  <span className="text-xs">Priority Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">📊</Badge>
                  <span className="text-xs">Analytics Access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Preview */}
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Pieces</span>
                  <Badge variant="outline" className="text-xs">3+</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Earnings</span>
                  <Badge variant="outline" className="text-xs">$100+</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Subscribers</span>
                  <Badge variant="outline" className="text-xs">10+</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Complete</span>
                  <Badge variant="outline" className="text-xs">✅</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Timeline */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Verification Process
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Meet eligibility requirements</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                  <span>Submit verification application</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <span>Admin review (3-5 business days)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                  <span>Verification granted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MiniAppWalletProvider>
  )
}
