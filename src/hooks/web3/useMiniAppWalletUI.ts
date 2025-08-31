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
import { useChainId, useDisconnect } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { formatAddress } from '@/lib/utils'
import { useMiniAppWalletConnect } from './useMiniAppWalletConnect'
import type { EnhancedWalletConnectionUI } from '@/hooks/ui/integration'
import {
  storeWalletState,
  sendWalletStateToParent,
  isMiniAppContext,
  getWalletState
} from '@/lib/utils/miniapp-communication'

/**
 * MiniApp Wallet UI Hook
 * 
 * This hook provides the same interface as useWalletConnectionUI but uses
 * the MiniApp-specific wallet connection logic underneath. This ensures
 * that the AppLayout components receive the correct wallet state when
 * running in MiniApp context.
 */
export function useMiniAppWalletUI(): EnhancedWalletConnectionUI {
  // Get the MiniApp-specific wallet state
  const miniAppWallet = useMiniAppWalletConnect()

  // Use unified wallet connection UI
  const walletUI = useWalletConnectionUI()
  const address = walletUI.address as `0x${string}` | undefined
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const chainId = useChainId()
  
  // Local state for UI feedback
  const [showWalletModal, setShowWalletModal] = useState(false)
  
  // Network validation
  const { chainName, isCorrectNetwork } = useMemo(() => {
    const supportedChains = [8453, 84532] // Base Mainnet and Base Sepolia
    const isCorrect = supportedChains.includes(chainId)
    
    let name: string
    switch (chainId) {
      case 8453:
        name = 'Base Mainnet'
        break
      case 84532:
        name = 'Base Sepolia'
        break
      default:
        name = 'Unsupported Network'
    }
    
    return { chainName: name, isCorrectNetwork: isCorrect }
  }, [chainId])
  
  // Format address for display
  const formattedAddress = useMemo(() => {
    return address ? formatAddress(address) : null
  }, [address])
  
  // Connection handler - uses MiniApp wallet connect
  const handleConnect = useCallback(async () => {
    console.log('🔗 MiniApp wallet connect triggered')
    try {
      await miniAppWallet.connect()
    } catch (error) {
      console.error('❌ MiniApp wallet connect failed:', error)
    }
  }, [miniAppWallet])
  
  // Disconnect handler - uses MiniApp wallet disconnect
  const handleDisconnect = useCallback(async () => {
    console.log('🔌 MiniApp wallet disconnect triggered')
    try {
      await miniAppWallet.disconnect()
    } catch (error) {
      console.error('❌ MiniApp wallet disconnect failed:', error)
    }
  }, [miniAppWallet])
  
  // Network switching handler
  const handleSwitchNetwork = useCallback(async () => {
    console.log('🔄 MiniApp network switch triggered')
    try {
      // Switch to Base Mainnet by default
      await miniAppWallet.switchNetwork(8453)
    } catch (error) {
      console.error('❌ MiniApp network switch failed:', error)
    }
  }, [miniAppWallet])
  
  // Clear error handler
  const clearError = useCallback(() => {
    miniAppWallet.clearError()
  }, [miniAppWallet])
  
  // Connector selection handler
  const handleConnectorSelect = useCallback((connector: any) => {
    console.log('🔗 MiniApp connector selected:', connector)
    miniAppWallet.connect(connector)
  }, [miniAppWallet])
  
  // MiniApp communication - send wallet state to parent window
  useEffect(() => {
    if (isMiniAppContext() && miniAppWallet.isConnected && walletUI.address) {
      const walletState = {
        isConnected: miniAppWallet.isConnected,
        address: walletUI.address,
        chainId: chainId
      }

      // Store in localStorage for persistence
      storeWalletState(walletState)

      // Send to parent window for immediate communication
      sendWalletStateToParent(walletState)

      console.log('📤 Sent wallet state to parent:', walletState)
    }
  }, [miniAppWallet.isConnected, walletUI.address, chainId])

  // Debug logging to track state synchronization
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MiniApp Wallet UI State:', {
        miniAppConnected: miniAppWallet.isConnected,
        unifiedConnected: walletUI.isConnected,
        miniAppConnecting: miniAppWallet.isConnecting,
        unifiedConnecting: walletUI.isConnecting,
        address: walletUI.address ? `${walletUI.address.slice(0, 6)}...${walletUI.address.slice(-4)}` : null,
        miniAppError: miniAppWallet.error?.message,
        miniAppStatus: miniAppWallet.status,
        isMiniAppContext: isMiniAppContext()
      })
    }
  }, [
    miniAppWallet.isConnected,
    miniAppWallet.isConnecting,
    miniAppWallet.error,
    miniAppWallet.status,
    walletUI.isConnected,
    walletUI.isConnecting,
    walletUI.address
  ])
  
  // Return the unified interface that AppLayout expects
  return {
    // Connection status - prioritize MiniApp state for accurate display
    isConnected: miniAppWallet.isConnected,
    isConnecting: miniAppWallet.isConnecting,
    
    // Address information - provide both full and formatted addresses
    address, // Full address for contract calls
    formattedAddress, // Formatted address for UI display
    chainName,
    isCorrectNetwork,
    
    // Action functions - use MiniApp wallet methods
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    
    // Error handling - use MiniApp error state
    error: miniAppWallet.error?.message || null,
    clearError,
    showNetworkWarning: walletUI.isConnected && !isCorrectNetwork,
    
    // Smart Account features (disabled for MiniApp for now)
    accountType: miniAppWallet.isConnected ? 'eoa' as const : 'disconnected' as const,
    hasSmartAccount: false,
    canUseGaslessTransactions: false,
    smartAccountAddress: null,
    isSmartAccountDeployed: false,
    canUpgradeToSmartAccount: false,
    upgradeToSmartAccount: async () => {},
    isUpgrading: false,
    showSmartAccountBenefits: false,
    
    // Custom modal state
    showWalletModal,
    setShowWalletModal,
    connectors: miniAppWallet.availableConnectors,
    handleConnectorSelect
  }
}
