import { Address } from 'viem'

// Authentication state that tracks wallet connection and user identity
export interface AuthState {
  address: Address | null
  isConnected: boolean
  isCreator: boolean
  chainId: number | null
}

// Creator profile information for dashboard and public displays
export interface CreatorProfile {
  address: Address
  displayName: string
  subscriptionPrice: bigint
  totalEarnings: bigint
  subscriberCount: bigint
  contentCount: number
  joinedAt: Date
}

// User settings and preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    subscriptionReminders: boolean
    newContentAlerts: boolean
    paymentConfirmations: boolean
  }
  defaultPaymentMethod: 'usdc' | 'eth'
}