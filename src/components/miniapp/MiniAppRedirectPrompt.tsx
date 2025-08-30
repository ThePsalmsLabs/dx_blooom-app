/**
 * MiniApp Redirect Prompt Component
 * File: src/components/miniapp/MiniAppRedirectPrompt.tsx
 *
 * This component shows a prompt to redirect back to the MiniApp after wallet connection
 * in the web version. It provides a seamless user experience for returning to the MiniApp context.
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useMiniAppWalletConnect } from '@/hooks/miniapp/useMiniAppWalletConnect'

interface MiniAppRedirectPromptProps {
  className?: string
}

export function MiniAppRedirectPrompt({ className }: MiniAppRedirectPromptProps) {
  const { shouldRedirect, redirectToMiniApp, cancelRedirect } = useMiniAppWalletConnect()

  if (!shouldRedirect) {
    return null
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Wallet Connected!</CardTitle>
          <CardDescription>
            Your wallet has been successfully connected. Would you like to return to the MiniApp?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            You can continue using the web version or return to complete your action in the MiniApp.
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={redirectToMiniApp}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to MiniApp
            </Button>

            <Button
              variant="outline"
              onClick={cancelRedirect}
              className="w-full"
            >
              Continue in Web Version
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
