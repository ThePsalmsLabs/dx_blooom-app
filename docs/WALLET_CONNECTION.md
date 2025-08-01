# Plug-and-Play Wallet Connection Solution

A comprehensive, RainbowKit-style wallet connection solution that provides everything you need for Web3 wallet management in a single, easy-to-use interface.

## 🚀 Features

- **Simple Integration**: One-line components for basic wallet connection
- **Advanced Features**: Smart Account support, network switching, and gas sponsorship
- **Multiple Hooks**: Specialized hooks for different use cases
- **TypeScript Support**: Fully typed with no `any` types
- **Customizable UI**: Built-in components with extensive customization options
- **Error Handling**: Comprehensive error handling and user feedback
- **Network Validation**: Automatic network detection and switching
- **Smart Account Integration**: Seamless upgrade from EOA to Smart Account

## 📦 Installation

The wallet connection solution is already integrated into your project. It uses the existing dependencies:

- `@rainbow-me/rainbowkit` - Core wallet connection UI
- `wagmi` - Web3 React hooks
- `viem` - Ethereum client
- `@biconomy/account` - Smart Account functionality

## 🎯 Quick Start

### Basic Usage

```tsx
import { WalletConnectButton } from '@/components/web3/WalletConnectModal'

function App() {
  return (
    <div>
      <WalletConnectButton />
    </div>
  )
}
```

### Using Hooks

```tsx
import { useWalletConnect } from '@/hooks/web3/useWalletConnect'

function MyComponent() {
  const wallet = useWalletConnect()
  
  return (
    <div>
      {wallet.isConnected ? (
        <p>Connected: {wallet.formattedAddress}</p>
      ) : (
        <button onClick={wallet.openModal}>Connect Wallet</button>
      )}
    </div>
  )
}
```

## 🧩 Components

### WalletConnectButton

A pre-built button component that handles wallet connection with an optional modal.

```tsx
// Basic usage
<WalletConnectButton />

// Custom styling
<WalletConnectButton 
  variant="outline" 
  size="lg"
  className="custom-class"
  showModal={false} // Disable modal
>
  Connect to Web3
</WalletConnectButton>
```

**Props:**
- `variant`: Button variant ('default' | 'outline' | 'ghost')
- `size`: Button size ('default' | 'sm' | 'lg')
- `className`: Custom CSS classes
- `showModal`: Whether to show modal (default: true)
- `children`: Custom button content

### WalletConnectModal

A comprehensive modal for wallet selection and connection management.

```tsx
import { WalletConnectModal } from '@/components/web3/WalletConnectModal'

function App() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Connect Wallet</button>
      
      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Connect Your Wallet"
        description="Choose your preferred wallet"
      />
    </>
  )
}
```

**Props:**
- `isOpen`: Whether modal is open
- `onClose`: Function to close modal
- `title`: Modal title (optional)
- `description`: Modal description (optional)

### WalletStatus

A component to display current wallet connection status.

```tsx
import { WalletStatus } from '@/components/web3/WalletConnectModal'

<WalletStatus 
  showAddress={true} 
  showNetwork={true} 
  className="custom-class" 
/>
```

**Props:**
- `showAddress`: Show wallet address (default: true)
- `showNetwork`: Show network information (default: true)
- `className`: Custom CSS classes

## 🪝 Hooks

### useWalletConnect

The main hook that provides comprehensive wallet connection functionality.

```tsx
import { useWalletConnect } from '@/hooks/web3/useWalletConnect'

function MyComponent() {
  const wallet = useWalletConnect({
    autoConnect: true,
    enableSmartAccount: true,
    onConnect: (address) => console.log('Connected:', address),
    onDisconnect: () => console.log('Disconnected'),
    onError: (error) => console.error('Error:', error)
  })
  
  return (
    <div>
      <p>Status: {wallet.status}</p>
      <p>Address: {wallet.formattedAddress}</p>
      <p>Network: {wallet.network?.name}</p>
      
      {wallet.isConnected ? (
        <button onClick={wallet.disconnect}>Disconnect</button>
      ) : (
        <button onClick={wallet.openModal}>Connect</button>
      )}
    </div>
  )
}
```

**Options:**
- `autoConnect`: Auto-connect on mount (default: true)
- `enableSmartAccount`: Enable Smart Account features (default: true)
- `supportedNetworks`: Array of supported network IDs
- `onConnect`: Callback when wallet connects
- `onDisconnect`: Callback when wallet disconnects
- `onNetworkChange`: Callback when network changes
- `onError`: Callback when errors occur

**Return Value:**
```tsx
interface UseWalletConnectReturn {
  // Connection State
  isConnected: boolean
  isConnecting: boolean
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  address: Address | null
  formattedAddress: string | null
  
  // Network Information
  network: NetworkInfo | null
  isCorrectNetwork: boolean
  supportedNetworks: readonly NetworkInfo[]
  
  // Smart Account Features
  smartAccount: SmartAccountInfo
  canUpgradeToSmartAccount: boolean
  isUpgrading: boolean
  
  // Available Wallets
  availableWallets: readonly WalletInfo[]
  installedWallets: readonly WalletInfo[]
  
  // Actions
  connect: (connector?: Connector) => Promise<void>
  disconnect: () => Promise<void>
  switchNetwork: (networkId: number) => Promise<void>
  upgradeToSmartAccount: () => Promise<void>
  copyAddress: () => Promise<void>
  
  // Modal Control
  showModal: boolean
  openModal: () => void
  closeModal: () => void
  
  // Error Handling
  error: string | null
  clearError: () => void
  
  // Utility Functions
  getWalletIcon: (connector: Connector) => string
  getWalletName: (connector: Connector) => string
  getWalletDescription: (connector: Connector) => string
}
```

### useSimpleWalletConnect

A simplified hook for basic wallet connection needs.

```tsx
import { useSimpleWalletConnect } from '@/hooks/web3/useWalletConnect'

function SimpleComponent() {
  const wallet = useSimpleWalletConnect()
  
  return (
    <div>
      {wallet.isConnected ? (
        <p>Connected: {wallet.formattedAddress}</p>
      ) : (
        <button onClick={() => wallet.connect()}>Connect</button>
      )}
    </div>
  )
}
```

### useSmartAccountConnect

A specialized hook for Smart Account functionality.

```tsx
import { useSmartAccountConnect } from '@/hooks/web3/useWalletConnect'

function SmartAccountComponent() {
  const smartAccount = useSmartAccountConnect()
  
  return (
    <div>
      <p>Smart Account: {smartAccount.smartAccount.isEnabled ? 'Enabled' : 'Disabled'}</p>
      {smartAccount.canUpgrade && (
        <button onClick={smartAccount.upgrade}>
          Upgrade to Smart Account
        </button>
      )}
    </div>
  )
}
```

### useNetworkConnect

A specialized hook for network management.

```tsx
import { useNetworkConnect } from '@/hooks/web3/useWalletConnect'

function NetworkComponent() {
  const network = useNetworkConnect()
  
  return (
    <div>
      <p>Current Network: {network.network?.name}</p>
      {!network.isCorrectNetwork && (
        <button onClick={() => network.switchNetwork(8453)}>
          Switch to Base
        </button>
      )}
    </div>
  )
}
```

## 🔧 Configuration

### Environment Variables

The wallet connection solution uses the following environment variables:

```env
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Alchemy (for RPC)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Coinbase
NEXT_PUBLIC_COINBASE_PROJECT_ID=your_coinbase_project_id

# Biconomy (for Smart Accounts)
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY=your_paymaster_key
NEXT_PUBLIC_BICONOMY_BUNDLER_URL=your_bundler_url
```

### Supported Networks

The solution supports the following networks by default:

- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)

You can customize supported networks by passing the `supportedNetworks` option to `useWalletConnect`.

### Wallet Connectors

The solution includes support for:

- **MetaMask** - Browser extension wallet
- **Coinbase Wallet** - Integrated with Coinbase ecosystem
- **WalletConnect** - Mobile wallet compatibility

## 🎨 Customization

### Custom Styling

All components support custom styling through the `className` prop and use Tailwind CSS classes.

```tsx
<WalletConnectButton 
  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
/>
```

### Custom Modal Implementation

You can create custom modal implementations using the hooks:

```tsx
function CustomWalletModal({ isOpen, onClose }) {
  const wallet = useWalletConnect()
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2>Custom Wallet Modal</h2>
        {/* Your custom content */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
```

### Custom Wallet Icons

You can customize wallet icons by modifying the utility functions in the hook:

```tsx
const getWalletIcon = (connector: Connector): string => {
  const name = connector.name.toLowerCase()
  if (name.includes('metamask')) return '🦊'
  if (name.includes('coinbase')) return '🪙'
  if (name.includes('walletconnect')) return '📱'
  return '🔗'
}
```

## 🚀 Advanced Features

### Smart Account Integration

The solution includes seamless Smart Account integration:

```tsx
function SmartAccountExample() {
  const wallet = useWalletConnect()
  
  return (
    <div>
      {wallet.canUpgradeToSmartAccount && (
        <button onClick={wallet.upgradeToSmartAccount}>
          Upgrade to Smart Account
        </button>
      )}
      
      {wallet.smartAccount.isEnabled && (
        <div>
          <p>Smart Account Active</p>
          <p>Address: {wallet.smartAccount.address}</p>
          <p>Gas Sponsorship: {wallet.smartAccount.canSponsorGas ? 'Enabled' : 'Disabled'}</p>
        </div>
      )}
    </div>
  )
}
```

### Network Switching

Automatic network detection and switching:

```tsx
function NetworkExample() {
  const wallet = useWalletConnect()
  
  return (
    <div>
      <p>Current Network: {wallet.network?.name}</p>
      
      {!wallet.isCorrectNetwork && (
        <button onClick={() => wallet.switchNetwork(8453)}>
          Switch to Base Mainnet
        </button>
      )}
    </div>
  )
}
```

### Error Handling

Comprehensive error handling with user feedback:

```tsx
function ErrorExample() {
  const wallet = useWalletConnect({
    onError: (error) => {
      console.error('Wallet error:', error)
      // Show toast notification
    }
  })
  
  return (
    <div>
      {wallet.error && (
        <div className="error-message">
          {wallet.error}
          <button onClick={wallet.clearError}>Clear</button>
        </div>
      )}
    </div>
  )
}
```

## 📱 Mobile Support

The solution includes full mobile support through WalletConnect:

- QR code scanning for mobile wallets
- Deep linking for mobile apps
- Responsive design for all components

## 🔒 Security

- All wallet interactions are handled securely through wagmi
- No private keys are stored or transmitted
- Smart Account integration uses Biconomy's secure infrastructure
- Network validation prevents transactions on wrong networks

## 🧪 Testing

The solution includes comprehensive examples in `src/components/web3/WalletConnectExample.tsx` that demonstrate all features and usage patterns.

## 🤝 Contributing

When contributing to the wallet connection solution:

1. Maintain TypeScript strict mode
2. Avoid using `any` types
3. Add comprehensive error handling
4. Include proper documentation
5. Test on multiple networks and wallets

## 📄 License

This wallet connection solution is part of the onchain-content-platform project and follows the same licensing terms.

## 🆘 Support

For issues or questions about the wallet connection solution:

1. Check the examples in `WalletConnectExample.tsx`
2. Review the hook documentation above
3. Check the existing Web3 provider implementation
4. Ensure all environment variables are properly configured 