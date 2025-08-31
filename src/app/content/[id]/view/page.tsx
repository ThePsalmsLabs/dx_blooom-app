'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from '@/components/ui/index'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { formatAddress } from '@/lib/utils'

import { AlertCircle, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'

interface ViewPageProps {
  readonly params: Promise<{ readonly id: string }>
}

export default function ContentViewPage({ params }: ViewPageProps) {
  const router = useRouter()
  const walletUI = useWalletConnectionUI()

  // Extract user address from wallet UI with proper type checking
  const userAddress = walletUI.address && typeof walletUI.address === 'string' ? walletUI.address as `0x${string}` : undefined
  const unwrapped = React.use(params) as { readonly id: string }
  const contentId = useMemo(() => {
    try {
      const id = BigInt(unwrapped.id)
      if (id <= BigInt(0)) throw new Error('Invalid id')
      return id
    } catch {
      return undefined
    }
  }, [unwrapped.id])

  // Always call hooks unconditionally
  const contentQuery = useContentById(contentId || (BigInt(0) as unknown as bigint))
  const accessQuery = useHasContentAccess(userAddress, contentId || (BigInt(0) as unknown as bigint))

  // Light polling to mitigate RPC/indexing latency after purchase
  React.useEffect(() => {
    if (!walletUI.address || !contentId) return
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      accessQuery.refetch()
      if (attempts >= 5 || accessQuery.data === true) {
        clearInterval(timer)
      }
    }, 2000)
    return () => {
      clearInterval(timer)
    }
  }, [userAddress, contentId, accessQuery])

  if (!contentId) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Invalid content id</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  const gatewayUrl = contentQuery.data?.ipfsHash
    ? `https://ipfs.io/ipfs/${contentQuery.data.ipfsHash}`
    : undefined

  const handleBackToContent = () => router.push(`/content/${contentId}`)

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBackToContent} className="p-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to content
            </Button>
          </div>

          {contentQuery.isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-[420px] w-full" />
              </CardContent>
            </Card>
          ) : !contentQuery.data ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Content not found</AlertDescription>
            </Alert>
          ) : accessQuery.isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Verifying access…</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[420px] w-full" />
              </CardContent>
            </Card>
          ) : accessQuery.data !== true ? (
            <Card>
              <CardHeader>
                <CardTitle>Access Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You do not have access to view this content. If you purchased recently, wait a few seconds and try again.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleBackToContent} className="w-full">Go to purchase page</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{contentQuery.data.title}</CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Access Granted
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Creator: {formatAddress(contentQuery.data.creator)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {gatewayUrl ? (
                  <div className="w-full">
                    <iframe
                      title="ipfs-content"
                      src={gatewayUrl}
                      className="w-full h-[70vh] rounded-md border"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      If the viewer above does not load, you can open the content directly
                      <Button variant="link" className="h-auto px-1 py-0 align-baseline" onClick={() => window.open(gatewayUrl, '_blank')}>
                        in a new tab <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Missing IPFS hash for this content.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </RouteGuards>
    </AppLayout>
  )
}


