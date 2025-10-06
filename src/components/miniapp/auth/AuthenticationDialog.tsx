/**
 * Authentication Dialog Component
 * File: src/components/miniapp/auth/AuthenticationDialog.tsx
 * 
 * This component provides a modal dialog for authentication that can be triggered
 * when authentication is needed for specific actions like purchasing content.
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FarcasterWalletPanel } from './FarcasterWalletPanel'
import { useMiniAppAuth } from '@/hooks/business/miniapp-auth'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

interface AuthenticationDialogProps {
  children: React.ReactNode
  title?: string
  description?: string
  requireAuth?: boolean
  onAuthComplete?: () => void
}

export function AuthenticationDialog({
  children,
  title = "Connect Your Account",
  description = "Sign in to access all features and make purchases",
  requireAuth = false,
  onAuthComplete
}: AuthenticationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const miniAppAuth = useMiniAppAuth()
  const walletUI = useMiniAppWalletUI()

  const isAuthenticated = miniAppAuth.isAuthenticated || walletUI.isConnected

  const handleAuthComplete = () => {
    setIsOpen(false)
    onAuthComplete?.()
  }

  // If authentication is required and user is not authenticated, 
  // automatically trigger the auth flow instead of the main action
  if (requireAuth && !isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FarcasterWalletPanel 
            onAuthComplete={handleAuthComplete}
            showWalletFallback={true}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // If user is authenticated or auth is not required, render children normally
  return <>{children}</>
}

// Helper hook to easily trigger authentication dialog
export function useAuthenticationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const miniAppAuth = useMiniAppAuth()
  const walletUI = useMiniAppWalletUI()

  const isAuthenticated = miniAppAuth.isAuthenticated || walletUI.isConnected

  const openAuthDialog = () => setIsOpen(true)
  const closeAuthDialog = () => setIsOpen(false)

  const AuthDialog = ({ title, description }: { title?: string; description?: string }) => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Connect Your Account"}</DialogTitle>
          <DialogDescription>
            {description || "Sign in to access all features and make purchases"}
          </DialogDescription>
        </DialogHeader>
        <FarcasterWalletPanel 
          onAuthComplete={closeAuthDialog}
          showWalletFallback={true}
        />
      </DialogContent>
    </Dialog>
  )

  return {
    isAuthenticated,
    isOpen,
    openAuthDialog,
    closeAuthDialog,
    AuthDialog
  }
}

