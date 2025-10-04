/**
 * Refund System Demo Page
 * 
 * Comprehensive demonstration of the V2 Refund Management System
 */

import { RefundSystemDemo } from '@/components/v2/refunds/RefundSystemDemo'

export default function RefundDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <RefundSystemDemo />
    </div>
  )
}

export const metadata = {
  title: 'V2 Refund System Demo | Onchain Content Platform',
  description: 'Demonstration of the advanced V2 refund management system with best-in-class UI/UX',
}