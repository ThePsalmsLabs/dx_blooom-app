import { WalletConnectExample, WalletConnectUsageInstructions } from '@/components/web3/WalletConnectExample'

export default function WalletDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Wallet Connection Demo</h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive, RainbowKit-style wallet connection solution
          </p>
        </div>

        {/* Usage Instructions */}
        <div className="mb-12">
          <WalletConnectUsageInstructions />
        </div>

        {/* Examples */}
        <WalletConnectExample />
      </div>
    </div>
  )
} 