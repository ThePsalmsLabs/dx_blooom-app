/**
 * Privy-based Wallet Connection Components and Hooks
 * 
 * This file exports all the plug-and-play wallet connection components and hooks
 * for easy importing throughout the application. Now powered by Privy.
 */

// New Privy-based Components
export {
  WalletConnectButton,
  WalletStatusDisplay,
  SmartAccountUpgradePrompt
} from './WalletConnectButton'

// Example components (if they still exist)
// export { 
//   WalletConnectExample, 
//   WalletConnectUsageInstructions 
// } from './WalletConnectExample'

// Hooks
export {
  useWalletConnect,
  type UseWalletConnectReturn,
  type WalletConnectionStatus,
  type NetworkInfo,
  type SmartAccountInfo,
  type UserInfo
} from '@/hooks/web3/useWalletConnect'

// Re-export existing components for backward compatibility
export { WalletConnectionButton } from './WalletConnect' 