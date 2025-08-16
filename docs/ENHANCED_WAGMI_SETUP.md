# Enhanced Wagmi Configuration Setup Guide

## 🚀 Overview

This guide will help you implement the enhanced Wagmi configuration that provides:

- **Multi-tier RPC provider fallbacks** - Never lose connectivity
- **Automatic request batching** - Reduce API calls and improve performance
- **Intelligent failover** - Switch providers automatically when issues occur
- **Production-ready reliability** - Handle high traffic and rate limiting gracefully

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Existing Next.js project with Wagmi setup
- Infura API key (you already have this!)

## 🔧 Step-by-Step Implementation

### Step 1: Environment Variables Setup

1. **Copy the template variables** from `env-template.txt` to your `.env.local` file
2. **Add your Infura API key** (you already have this):
   ```bash
   NEXT_PUBLIC_INFURA_API_KEY=your_actual_infura_key_here
   ```
3. **Get a free Alchemy API key** for redundancy:
   - Visit [Alchemy](https://www.alchemy.com/)
   - Sign up for free
   - Create a new app for Base mainnet
   - Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
   ```
4. **Get a free WalletConnect project ID**:
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Sign up and create a new project
   - Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

### Step 2: Files Already Created

The following files have been automatically created for you:

- ✅ `src/lib/web3/enhanced-wagmi-config.ts` - Enhanced configuration
- ✅ `scripts/validate-rpc-config.ts` - Validation script
- ✅ `env-template.txt` - Environment variable template
- ✅ Updated `src/components/providers/Providers.tsx` - Uses new config

### Step 3: Verify Configuration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Run the validation script**:
   ```bash
   npm run validate-rpc
   ```

3. **Check the console output** for any warnings or recommendations

## 🏗️ How It Works

### RPC Provider Tiers

The enhanced configuration uses a 3-tier system:

1. **Tier 1: Premium Providers** (Infura, Alchemy, QuickNode, Ankr)
   - Highest performance and rate limits
   - Automatic failover between providers
   - Exponential backoff retry logic

2. **Tier 2: Public Providers** (Base official, BlockPI)
   - Reliable fallbacks when premium providers fail
   - Conservative rate limiting to respect public endpoints
   - Good for development and testing

3. **Tier 3: Emergency Fallback**
   - Last resort when all other providers fail
   - Single requests with long delays
   - Maximum chance of success

### Request Batching

- **Multicall batching**: Combines multiple contract calls into single requests
- **Batch size optimization**: 200KB batches for premium providers, smaller for public
- **Wait time optimization**: 16ms for premium, longer for public providers

### Automatic Failover

- **Health monitoring**: Providers are ranked every minute based on performance
- **Smart routing**: Automatically routes requests to the best available provider
- **Seamless switching**: Users never experience connectivity issues

## 🧪 Testing Your Setup

### 1. Basic Connectivity Test

```typescript
import { useChainId, useReadContract } from 'wagmi'
import { getCreatorRegistryContract } from '@/lib/contracts/config'

function TestComponent() {
  const chainId = useChainId()
  const contract = getCreatorRegistryContract(chainId)
  
  const { data, isLoading, error } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getTotalCreators',
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>Total creators: {data?.toString()}</div>
}
```

### 2. Provider Failover Test

1. Temporarily disable your primary RPC provider
2. Check that requests automatically fall back to secondary providers
3. Re-enable the primary provider and verify it resumes as primary

### 3. Performance Monitoring

Check your browser's Network tab to see:
- Request batching in action
- Provider switching when needed
- Overall reduction in API calls

## 🔍 Troubleshooting

### Common Issues

1. **"No premium RPC providers configured"**
   - Add your Infura API key to `.env.local`
   - Restart your development server

2. **"WalletConnect not configured"**
   - Get a free project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to `.env.local`

3. **Rate limiting still occurring**
   - Check that your API keys are correct
   - Verify you're not exceeding free tier limits
   - Consider upgrading to paid tiers for production

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```bash
NEXT_PUBLIC_DEBUG_WAGMI=true
```

## 📈 Performance Benefits

### Before (Single RPC Provider)
- ❌ Single point of failure
- ❌ Rate limiting issues
- ❌ No request batching
- ❌ Poor failover handling

### After (Enhanced Configuration)
- ✅ Multi-provider redundancy
- ✅ Automatic failover
- ✅ Intelligent request batching
- ✅ Production-grade reliability
- ✅ Better user experience

## 🚀 Production Deployment

### Environment Variables

Ensure these are set in your production environment:
```bash
NEXT_PUBLIC_INFURA_API_KEY=your_production_key
NEXT_PUBLIC_ALCHEMY_API_KEY=your_production_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_id
```

### Monitoring

1. **Track RPC usage** in your provider dashboards
2. **Monitor failover events** in your application logs
3. **Set up alerts** for unusual provider switching patterns

## 🔗 Additional Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [Base Chain Documentation](https://docs.base.org/)
- [Infura API Documentation](https://docs.infura.io/)
- [Alchemy API Documentation](https://docs.alchemy.com/)

## 📞 Support

If you encounter issues:

1. Check the console for configuration warnings
2. Run `npm run validate-rpc` for diagnostics
3. Verify your environment variables are correct
4. Check that your API keys are active and have sufficient quota

---

**Next Steps**: After completing this setup, your application will have enterprise-grade RPC infrastructure that can handle high traffic, automatically recover from failures, and provide a seamless user experience even during network issues.
