/**
 * MiniApp Conditional Rendering Examples
 * File: src/components/farcaster/MiniAppConditionalExample.tsx
 *
 * This file demonstrates how to properly implement Farcaster features
 * with conditional rendering to avoid errors in non-MiniApp environments.
 */

'use client'

import React from 'react'
import { useFarcasterContext, useIsInMiniApp } from '@/hooks/farcaster/useFarcasterContext'
import { MiniAppConditional, MiniAppOnly, WebOnly, FarcasterFeature } from './MiniAppConditional'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Example: Basic conditional rendering
 */
export function FarcasterButton() {
  const farcasterContext = useFarcasterContext()

  return (
    <MiniAppConditional
      fallback={
        <Button variant="outline" disabled>
          Share on Farcaster (MiniApp only)
        </Button>
      }
    >
      <Button
        onClick={() => {
          // Safe to use farcasterContext here - we know we're in MiniApp
          console.log('Sharing with user:', farcasterContext?.user?.username)
        }}
      >
        Share on Farcaster
      </Button>
    </MiniAppConditional>
  )
}

/**
 * Example: Using MiniAppOnly for cleaner code
 */
export function FarcasterProfile() {
  const farcasterContext = useFarcasterContext()

  return (
    <MiniAppOnly>
      {farcasterContext?.user && (
        <Card>
          <CardHeader>
            <CardTitle>Farcaster Profile</CardTitle>
            <CardDescription>Your MiniApp profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Username: @{farcasterContext.user.username}</p>
            <p>FID: {farcasterContext.user.fid}</p>
            <p>Display Name: {farcasterContext.user.displayName}</p>
          </CardContent>
        </Card>
      )}
    </MiniAppOnly>
  )
}

/**
 * Example: Web-only features
 */
export function WebFeatures() {
  return (
    <WebOnly>
      <Card>
        <CardHeader>
          <CardTitle>Web Features</CardTitle>
          <CardDescription>Features available on the web</CardDescription>
        </CardHeader>
        <CardContent>
          <p>These features are only available on the web version.</p>
          <Button>Web-only Action</Button>
        </CardContent>
      </Card>
    </WebOnly>
  )
}

/**
 * Example: Comprehensive feature with both MiniApp and Web variants
 */
export function SocialSharing() {
  const isInMiniApp = useIsInMiniApp()
  const farcasterContext = useFarcasterContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Sharing</CardTitle>
        <CardDescription>
          Share content across platforms ({isInMiniApp ? 'MiniApp' : 'Web'} mode)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MiniApp-specific sharing */}
        <FarcasterFeature
          fallback={
            <Button variant="outline" disabled>
              Cast on Farcaster (MiniApp only)
            </Button>
          }
        >
          <Button
            onClick={() => {
              console.log('Casting from MiniApp:', farcasterContext?.user?.username)
            }}
          >
            Cast on Farcaster
          </Button>
        </FarcasterFeature>

        {/* Web-specific sharing */}
        <WebOnly>
          <Button variant="secondary">
            Share on Twitter/X
          </Button>
        </WebOnly>

        {/* Cross-platform sharing */}
        <Button>
          Copy Link
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Example: Loading states
 */
export function ConditionalWithLoading() {
  return (
    <MiniAppConditional
      showLoading={true}
      loadingComponent={
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-48"></div>
        </div>
      }
      fallback={
        <div className="text-muted-foreground">
          Farcaster features not available in this context
        </div>
      }
    >
      <div className="p-4 bg-primary/10 rounded-lg">
        <h3 className="font-semibold">Farcaster MiniApp Features</h3>
        <p>You're using this in a Farcaster MiniApp!</p>
      </div>
    </MiniAppConditional>
  )
}

/**
 * Example: Hook usage with proper error handling
 */
export function FarcasterUserInfo() {
  const farcasterContext = useFarcasterContext()
  const isInMiniApp = useIsInMiniApp()

  // Handle loading state
  if (isInMiniApp && !farcasterContext) {
    return <div className="text-muted-foreground">Loading Farcaster context...</div>
  }

  // Handle non-MiniApp context
  if (!isInMiniApp) {
    return <div className="text-muted-foreground">Farcaster features not available</div>
  }

  // Additional safety check for TypeScript
  if (!farcasterContext || !farcasterContext.user) {
    return <div className="text-muted-foreground">Farcaster context not available</div>
  }

  // Safe to use farcasterContext - we know we're in MiniApp and context is loaded
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, @{farcasterContext.user.username}!</CardTitle>
        <CardDescription>FID: {farcasterContext.user.fid}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Display Name: {farcasterContext.user.displayName}</p>
        {farcasterContext.user.pfpUrl && (
          <img
            src={farcasterContext.user.pfpUrl}
            alt="Profile"
            className="w-16 h-16 rounded-full mt-2"
          />
        )}
      </CardContent>
    </Card>
  )
}
