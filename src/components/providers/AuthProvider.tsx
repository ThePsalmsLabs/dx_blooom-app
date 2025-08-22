'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'

// Define what information we track about authenticated users
interface User {
  address: string
  isCreator: boolean
  displayName?: string
  subscriptionPrice?: bigint
  totalEarnings?: bigint
}

// Define the authentication context interface
// This tells TypeScript what functions and data the context provides
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isCreator: boolean
  login: () => Promise<void>
  logout: () => void
  updateCreatorStatus: (isCreator: boolean, displayName?: string) => void
}

// Create the authentication context
// This is like creating a communication channel that any component can access
const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  
  // State for tracking user information
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // This effect runs whenever the wallet connection status changes
  // It automatically updates the user state when wallets connect or disconnect
  useEffect(() => {
    if (isConnected && address) {
      // When a wallet connects, create a user object
      setUser({
        address,
        isCreator: false, // We'll check this against the CreatorRegistry contract later
      })
    } else {
      // When wallet disconnects, clear user state
      setUser(null)
    }
  }, [isConnected, address])

  // Function to handle user login
  // In Web3 apps, "login" usually means connecting a wallet
  const login = async () => {
    setIsLoading(true)
    try {
      // The actual wallet connection is handled by Privy
      // This function can perform additional setup like checking creator status
      console.log('User login initiated')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle user logout
  const logout = () => {
    disconnect()
    setUser(null)
    router.push('/')
  }

  // Function to update creator status when users register as creators
  const updateCreatorStatus = (isCreator: boolean, displayName?: string) => {
    if (user) {
      setUser({
        ...user,
        isCreator,
        displayName,
      })
    }
  }

  // Calculate derived state
  const isCreator = user?.isCreator ?? false

  // Provide the authentication context to all child components
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isCreator,
    login,
    logout,
    updateCreatorStatus,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for accessing authentication context
// This makes it easy for components to access auth state without importing context directly
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Optional version that returns null instead of throwing
export function useOptionalAuth() {
  const context = useContext(AuthContext)
  return context || null
}