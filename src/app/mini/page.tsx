'use client'

import { UpgradedMiniAppInterface } from '@/components/miniapp/UpgradedMiniAppInterface'
import { Suspense } from 'react'

export default function MiniAppPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradedMiniAppInterface />
    </Suspense>
  )
}