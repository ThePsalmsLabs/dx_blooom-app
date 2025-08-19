// src/components/debug/RPCHealthMonitor.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

interface RPCHealth {
  latency: number
  status: 'healthy' | 'degraded' | 'down'
  provider: string
  lastCheck: number
}

export function RPCHealthMonitor() {
  const client = usePublicClient()
  const [health, setHealth] = useState<RPCHealth | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!client) return

    const checkHealth = async () => {
      const start = Date.now()
      try {
        await client.getBlockNumber()
        const latency = Date.now() - start
        
        setHealth({
          latency,
          status: latency < 500 ? 'healthy' : latency < 2000 ? 'degraded' : 'down',
          provider: (client.transport as any)?.url || 'fallback',
          lastCheck: Date.now()
        })
      } catch (error) {
        setHealth({
          latency: -1,
          status: 'down',
          provider: 'unknown',
          lastCheck: Date.now()
        })
      }
    }

    // Initial check
    checkHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [client])

  // Only show in development or when there are issues
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    (health && health.status !== 'healthy')

  if (!health || !shouldShow) return null

  const getStatusColor = (status: RPCHealth['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'down': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 p-3 rounded-lg text-xs border cursor-pointer transition-all duration-200 ${
        isVisible ? 'w-auto' : 'w-12 h-12'
      } ${getStatusColor(health.status)}`}
      onClick={() => setIsVisible(!isVisible)}
    >
      {isVisible ? (
        <div className="space-y-1">
          <div className="font-semibold">RPC Status: {health.status}</div>
          <div>Latency: {health.latency === -1 ? 'N/A' : `${health.latency}ms`}</div>
          <div>Provider: {health.provider.split('/').pop()}</div>
          <div className="text-xs opacity-70">
            Last check: {new Date(health.lastCheck).toLocaleTimeString()}
          </div>
          <div className="text-xs opacity-50">Click to minimize</div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className={`w-3 h-3 rounded-full ${
            health.status === 'healthy' ? 'bg-green-500' :
            health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      )}
    </div>
  )
}
