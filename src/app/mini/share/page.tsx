'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Share2, Copy, CheckCircle, ExternalLink, ArrowLeft, Sparkles, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

export default function MiniAppSharePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const walletUI = useWalletConnectionUI()
  const farcasterContext = useFarcasterContext()
  
  const contentId = searchParams.get('contentId')
  const creatorAddress = searchParams.get('creator')
  const shareType = searchParams.get('type') || 'platform'
  const referralCode = searchParams.get('ref')
  
  const [copied, setCopied] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dxbloom.com'
    let url = `${baseUrl}/mini`
    
    if (contentId) url += `?contentId=${contentId}`
    if (creatorAddress) url += `${contentId ? '&' : '?'}creator=${creatorAddress}`
    if (referralCode) url += `${contentId || creatorAddress ? '&' : '?'}ref=${referralCode}`
    
    setShareUrl(url)
  }, [contentId, creatorAddress, referralCode])

  const getShareText = () => {
    const baseText = "Check out this amazing content platform on Base! 🚀"
    const platformText = "Premium content with instant USDC payments on @dxbloom"
    
    switch (shareType) {
      case 'content': 
        return contentId 
          ? `Just discovered this premium content on @dxbloom! ${platformText}`
          : `Discovering amazing content on @dxbloom! ${platformText}`
      case 'creator': 
        return creatorAddress 
          ? `Supporting this amazing creator on @dxbloom! ${platformText}`
          : `Supporting creators on @dxbloom! ${platformText}`
      default: 
        return `${platformText}. Join the future of content monetization! 💎`
    }
  }

  const handleShare = async (platform: string) => {
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else if (platform === 'farcaster') {
        // Use Farcaster's native sharing if available, otherwise fallback to Warpcast
        const shareText = getShareText()
        const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`
        window.open(farcasterUrl, '_blank')
      } else if (platform === 'twitter') {
        const shareText = getShareText()
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        window.open(twitterUrl, '_blank')
      }
      
      // Track share analytics
      setShareCount(prev => prev + 1)
      
      // Send analytics to your backend
      try {
        await fetch('/api/analytics/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            contentId,
            creatorAddress,
            shareType,
            referralCode,
            userAddress: walletUI.address,
            farcasterFid: farcasterContext?.user?.fid,
            shareUrl,
            timestamp: Date.now()
          })
        })
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError)
      }
      
      console.log('Share tracked:', { platform, contentId, creatorAddress, shareType, referralCode, userAddress: walletUI.address, farcasterContext: farcasterContext?.user?.fid })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-orange-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">Share</span>
          </div>
        </div>

        {/* Share Stats */}
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Share2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Shares</p>
                  <p className="text-2xl font-bold text-orange-600">{shareCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Preview */}
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900">Bloom Platform</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Premium content with instant USDC payments on Base
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="p-2 bg-gray-50 rounded-md">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="w-full text-xs bg-transparent border-none outline-none text-gray-600"
              />
            </div>
            
            {/* Share Preview */}
            <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
              <p className="text-xs font-medium text-orange-800 mb-2">Preview:</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                {getShareText()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-900">Share Options</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => handleShare('farcaster')}
            >
              <MessageCircle className="h-5 w-5 mr-3 text-purple-500" />
              <span className="text-sm font-medium">Share on Farcaster</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start h-12 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => handleShare('twitter')}
            >
              <ExternalLink className="h-5 w-5 mr-3 text-blue-500" />
              <span className="text-sm font-medium">Share on Twitter</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start h-12 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => handleShare('copy')}
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 mr-3 text-gray-500" />
              )}
              <span className="text-sm font-medium">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Farcaster Context */}
        {farcasterContext && (
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900">Sharing from Farcaster</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">
                    {farcasterContext.user.displayName?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {farcasterContext.user.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{farcasterContext.user.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Help Us Grow!</h3>
            <p className="text-sm text-orange-100 mb-4">
              Share this platform with your friends and help creators earn more with instant USDC payments.
            </p>
            <Button
              variant="secondary"
              className="w-full bg-white text-orange-600 hover:bg-orange-50"
              onClick={() => router.push('/mini')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Explore Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
