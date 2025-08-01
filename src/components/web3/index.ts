/**
 * Wallet Connection Components and Hooks
 * 
 * This file exports all the plug-and-play wallet connection components and hooks
 * for easy importing throughout the application.
 */

// Components
export { 
  WalletConnectModal, 
  WalletConnectButton, 
  WalletStatus 
} from './WalletConnectModal'

// Example components
export { 
  WalletConnectExample, 
  WalletConnectUsageInstructions 
} from './WalletConnectExample'

// Hooks
export {
  useWalletConnect,
  useSimpleWalletConnect,
  useSmartAccountConnect,
  useNetworkConnect,
  type UseWalletConnectReturn,
  type UseWalletConnectOptions,
  type WalletConnectionStatus,
  type NetworkInfo,
  type SmartAccountInfo,
  type WalletInfo,
  type TransactionStatus
} from '@/hooks/web3/useWalletConnect'

// Re-export existing components for backward compatibility
// export { default as WalletConnect } from './WalletConnect' 