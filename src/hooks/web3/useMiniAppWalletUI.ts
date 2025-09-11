/**
 * MiniApp Wallet UI Hook
 * File: src/hooks/web3/useMiniAppWalletUI.ts
 * 
 * This hook provides a unified wallet UI interface specifically for MiniApp contexts.
 * It bridges the gap between the MiniApp wallet connection system and the regular
 * AppLayout UI components, ensuring state synchronization and proper connection handling.
 * 
 * The issue was that the MiniApp layout uses a separate wagmi provider instance
 * from the regular app, causing state synchronization issues between the wallet
 * connection state and the UI display state.
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { formatAddress } from '@/lib/utils'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import type { EnhancedWalletConnectionUI } from '@/hooks/ui/integration'
import {
  storeWalletState,
  sendWalletStateToParent,
  isMiniAppContext
} from '@/lib/utils/miniapp-communication'

/**
 * MiniApp Wallet UI Hook
 * 
 * This hook provides the same interface as useWalletConnectionUI but uses
 * Farcaster wallet connection logic specifically for MiniApp contexts.
 * This ensures proper integration with Farcaster mini app wallet system.
 */
export function useMiniAppWalletUI(): EnhancedWalletConnectionUI {
  const farcasterWallet = useFarcasterAutoWallet()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const formattedAddress = useMemo(() => {
    return farcasterWallet.address ? formatAddress(farcasterWallet.address as `0x${string}`) : null
  }, [farcasterWallet.address])

  const isCorrectNetwork = useMemo(() => {
    return [8453, 84532].includes(chainId)
  }, [chainId])

  const chainName = useMemo(() => {
    switch (chainId) {
      case 8453: return 'Base Mainnet'
      case 84532: return 'Base Sepolia'
      default: return 'Unsupported Network'
    }
  }, [chainId])

  const handleConnect = useCallback(() => {
    farcasterWallet.connect().catch(err => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
    })
  }, [farcasterWallet.connect])

  const handleDisconnect = useCallback(() => {
    disconnect()
    setError(null)
  }, [disconnect])

  const handleSwitchNetwork = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: 8453 })
    }
  }, [switchChain])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Communicate wallet state to parent window
  useEffect(() => {
    if (isMiniAppContext() && farcasterWallet.isConnected && farcasterWallet.address) {
      const walletState = {
        isConnected: farcasterWallet.isConnected,
        address: farcasterWallet.address,
        chainId: chainId
      }

      try {
        storeWalletState(walletState)
        sendWalletStateToParent(walletState)
      } catch (error) {
        console.error('❌ Failed to communicate wallet state:', error)
      }
    }
  }, [farcasterWallet.isConnected, farcasterWallet.address, chainId])

  return useMemo((): EnhancedWalletConnectionUI => ({
    isConnected: farcasterWallet.isConnected,
    isConnecting: farcasterWallet.isConnecting,
    address: farcasterWallet.address || null,
    formattedAddress,
    chainName,
    isCorrectNetwork,
    accountType: farcasterWallet.isConnected ? 'eoa' : 'disconnected',
    hasSmartAccount: false,
    canUseGaslessTransactions: false,
    smartAccountAddress: null,
    isSmartAccountDeployed: false,
    canUpgradeToSmartAccount: false,
    upgradeToSmartAccount: async () => {},
    isUpgrading: false,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    error: error || farcasterWallet.error?.message || null,
    clearError,
    showNetworkWarning: !isCorrectNetwork && farcasterWallet.isConnected,
    showSmartAccountBenefits: false,
    showWalletModal,
    setShowWalletModal,
    connectors: [],
    handleConnectorSelect: () => {}
  }), [
    farcasterWallet.isConnected,
    farcasterWallet.isConnecting,
    farcasterWallet.address,
    farcasterWallet.error,
    formattedAddress,
    chainName,
    isCorrectNetwork,
    handleConnect,
    handleDisconnect,
    handleSwitchNetwork,
    error,
    clearError,
    showWalletModal
  ])
}
