/**
 * Admin Verification Dashboard
 * 
 * This component allows platform moderators to review and approve verification requests.
 * It should be placed in a protected admin route with appropriate access controls.
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
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
  Textarea,
  Badge,
  Separator
} from '@/components/ui/index'

/**
 * Admin Verification Dashboard
 * This component allows platform moderators to review and approve verification requests
 */
export function AdminVerificationDashboard() {
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load pending verification applications
  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await fetch('/api/admin/verification/pending')
        const data = await response.json()
        setApplications(data)
      } catch (error) {
        console.error('Failed to load applications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [])

  // Handle verification decision
  const handleVerification = useCallback(async (
    creatorAddress: string, 
    approved: boolean, 
    reason?: string
  ) => {
    try {
      const response = await fetch('/api/admin/verification/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress,
          approved,
          reason
        })
      })

      if (response.ok) {
        // Remove from pending list
        setApplications(prev => prev.filter(app => app.creatorAddress !== creatorAddress))
        setSelectedApplication(null)
      }
    } catch (error) {
      console.error('Verification decision error:', error)
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Loading verification applications...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Creator Verification Dashboard</h2>
        <p className="text-muted-foreground">
          Review and approve creator verification applications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {applications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No pending applications
                </div>
              ) : (
                <div className="space-y-1">
                  {applications.map((app, index) => (
                    <button
                      key={app.creatorAddress}
                      onClick={() => setSelectedApplication(app)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedApplication?.creatorAddress === app.creatorAddress 
                          ? 'bg-muted' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {formatAddress(app.creatorAddress)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {app.contentCount} content
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Detail */}
        <div className="lg:col-span-2">
          {selectedApplication ? (
            <VerificationApplicationReview 
              application={selectedApplication}
              onDecision={handleVerification}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select an application to review
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Application Review Component
 */
function VerificationApplicationReview({ 
  application, 
  onDecision 
}: { 
  application: any; 
  onDecision: (address: string, approved: boolean, reason?: string) => void 
}) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Review</CardTitle>
        <CardDescription>
          Review creator verification request for {formatAddress(application.creatorAddress)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Creator Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{application.contentCount}</p>
            <p className="text-sm text-muted-foreground">Content Pieces</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">${application.totalEarnings}</p>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{application.subscriberCount}</p>
            <p className="text-sm text-muted-foreground">Subscribers</p>
          </div>
        </div>

        <Separator />

        {/* Application Details */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Bio</Label>
            <p className="text-sm mt-1">{application.bio}</p>
          </div>

          {application.websiteUrl && (
            <div>
              <Label className="text-sm font-medium">Website</Label>
              <a 
                href={application.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                {application.websiteUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Verification Reason</Label>
            <p className="text-sm mt-1">{application.verificationReason}</p>
          </div>
        </div>

        <Separator />

        {/* Decision Interface */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={decision === 'approve' ? 'default' : 'outline'}
              onClick={() => setDecision('approve')}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant={decision === 'reject' ? 'destructive' : 'outline'}
              onClick={() => setDecision('reject')}
              className="flex-1"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>

          {decision && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                {decision === 'approve' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  decision === 'approve' 
                    ? 'Welcome message or additional notes...'
                    : 'Please explain why this application was rejected...'
                }
                required={decision === 'reject'}
              />
              
              <Button 
                onClick={() => onDecision(application.creatorAddress, decision === 'approve', reason)}
                disabled={decision === 'reject' && !reason.trim()}
                className="w-full"
              >
                Confirm {decision === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to format addresses
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
} 