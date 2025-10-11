'use client'

import { useMiniAppWallet } from '@/hooks/miniapp/useMiniAppWallet'
import { useMiniAppXMTP } from '@/hooks/miniapp/useMiniAppXMTP'
import { MiniAppMessagingButton, useMessagingReadiness } from '@/components/miniapp/MiniAppMessagingButton'

export default function MiniAppPage() {
  const wallet = useMiniAppWallet()
  const xmtp = useMiniAppXMTP()
  const messaging = useMessagingReadiness()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">MiniApp Integration Test</h1>
        
        <div className="space-y-6">
          {/* Wallet Status */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Wallet Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Connection</h3>
                <p className={`text-sm ${wallet.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {wallet.isConnected ? '✅ Connected' : '❌ Disconnected'}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Status</h3>
                <p className={`text-sm ${wallet.isConnecting ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {wallet.isConnecting ? '🔄 Connecting...' : '⏸️ Ready'}
                </p>
              </div>
            </div>
            
            {wallet.address && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded mt-3">
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-sm font-mono break-all">{wallet.address}</p>
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              {!wallet.isConnected ? (
                <button
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded font-medium"
                >
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <button
                  onClick={wallet.disconnect}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* XMTP Status */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">XMTP Messaging</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">XMTP Status</h3>
                <p className={`text-sm ${xmtp.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {xmtp.isConnected ? '✅ Connected' : '❌ Not Connected'}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h3 className="font-semibold mb-2">Can Connect</h3>
                <p className={`text-sm ${xmtp.canConnect ? 'text-green-600' : 'text-yellow-600'}`}>
                  {xmtp.canConnect ? '✅ Ready' : '⏳ Waiting for wallet'}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded mt-3">
              <h3 className="font-semibold mb-2">Context</h3>
              <p className={`text-sm ${xmtp.isMiniAppContext ? 'text-green-600' : 'text-red-600'}`}>
                {xmtp.isMiniAppContext ? '✅ MiniApp Context' : '❌ Not in MiniApp'}
              </p>
            </div>

            {/* Demo Messaging Button */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Messaging Demo</h3>
              <MiniAppMessagingButton 
                recipientAddress="0x1234567890123456789012345678901234567890"
                className="w-full"
              />
            </div>
          </div>

          {/* System Status */}
          <div>
            <h2 className="text-lg font-semibold mb-3">System Status</h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Messaging Ready:</span>
                  <span className={messaging.isReady ? 'text-green-600' : 'text-red-600'}>
                    {messaging.isReady ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Can Initialize:</span>
                  <span className={messaging.canInitialize ? 'text-green-600' : 'text-red-600'}>
                    {messaging.canInitialize ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>In MiniApp:</span>
                  <span className={messaging.isInMiniApp ? 'text-green-600' : 'text-red-600'}>
                    {messaging.isInMiniApp ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {(wallet.error || xmtp.error) && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
              <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Errors</h3>
              {wallet.error && (
                <p className="text-sm text-red-600 dark:text-red-300 mb-1">
                  Wallet: {wallet.error}
                </p>
              )}
              {xmtp.error && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  XMTP: {xmtp.error.message}
                </p>
              )}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}