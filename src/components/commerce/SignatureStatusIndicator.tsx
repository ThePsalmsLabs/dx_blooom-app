import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { BackendSignatureStatus } from '@/services/commerce/BackendSignatureService'

interface SignatureStatusProps {
  status: BackendSignatureStatus
  className?: string
}

export function SignatureStatusIndicator({ status, className }: SignatureStatusProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'signed': return 'bg-green-100 text-green-800'
      case 'failed':
      case 'expired': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <Badge variant="secondary" className={getStatusColor()}>
          {formatStatus(status.status)}
        </Badge>
        {status.queuePosition && (
          <span className="text-sm text-muted-foreground">
            Position {status.queuePosition} in queue
          </span>
        )}
      </div>
      
      {status.estimatedWaitTime && status.status === 'processing' && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Processing signature...</span>
            <span>{Math.ceil(status.estimatedWaitTime / 1000)}s remaining</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      )}
      
      {status.error && (
        <div className="text-sm text-red-600">
          Error: {status.error}
        </div>
      )}
    </div>
  )
}
