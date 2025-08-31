# Base Names (Basenames) Integration

This document explains how Base names (Basenames) have been integrated into your application using Coinbase's OnchainKit.

## Overview

Basenames are human-readable names for Ethereum addresses on the Base network. Instead of showing long addresses like `0x742d35CC6Eb6B3d3C6B8A40B5A13E9A9B0B5F0F0`, users can have readable names like `alice.base.eth`.

## Implementation

### Components Created

1. **Basename Components** (`/src/components/ui/basename.tsx`)
   - `Basename` - Main component with automatic resolution
   - `BasenameWithAddress` - Shows both name and formatted address
   - `CompactBasename` - Space-efficient display for tight spaces

2. **OnchainKit Provider** (`/src/components/providers/OnchainKitProvider.tsx`)
   - Enables OnchainKit functionality throughout the app
   - Configured for Base network and Basename resolution

3. **Demo Page** (`/src/app/basenames/page.tsx`)
   - Interactive demonstration of all Basename display formats
   - Shows integration examples and usage patterns

### Integration Points

#### 1. Creator Dashboard
- Creator addresses now display with Basenames in profile sections
- Shows both the Basename and formatted address for clarity
- Located in `/src/components/creator/CreatorDashBoard.tsx`

#### 2. User Profile Dropdown
- Connected users see their Basename in the header dropdown
- Falls back to formatted address if no Basename is available
- Located in `/src/components/layout/AppLayout.tsx`

#### 3. Provider Setup
- OnchainKitProvider added to the main provider chain
- Enables Basename resolution across the entire application
- Located in `/src/components/providers/Providers.tsx`

## Usage Examples

```typescript
// Basic usage - shows Basename or falls back to formatted address
<Basename address={userAddress} />

// Shows both Basename and address with separator
<BasenameWithAddress
  address={userAddress}
  separator=" • "
/>

// Compact version for navigation and tight spaces
<CompactBasename address={userAddress} />
```

## Configuration

### Environment Variables

Add the following to your `.env.local` file for production Basename resolution:

```bash
# OnchainKit API Key (get from Coinbase Cloud)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
```

### Getting an API Key

1. Visit [Coinbase Cloud](https://cloud.coinbase.com/)
2. Sign up for an account
3. Create a new project
4. Generate an API key
5. Add it to your environment variables

## Features

### Automatic Resolution
- OnchainKit automatically resolves Basenames for Base network addresses
- No manual API calls required
- Built-in caching and performance optimization

### Graceful Fallbacks
- If no Basename exists, shows formatted address
- Custom fallback text can be configured
- Handles loading and error states

### TypeScript Support
- Full TypeScript support with proper typing
- Address validation and type safety
- IntelliSense support in your IDE

### Responsive Design
- Works across all screen sizes
- Different display modes for different contexts
- Consistent with your existing design system

## Testing

Visit `/basenames` to see:
- Your current Basename display (if connected)
- Different display format examples
- Integration points throughout the app
- Technical implementation details

## Technical Details

### OnchainKit Integration
- Uses `@coinbase/onchainkit/identity` for Basename resolution
- Configured for Base network (`base` from `viem/chains`)
- Provider-based architecture for consistent behavior

### Performance Considerations
- OnchainKit handles caching automatically
- Components are memoized for optimal re-rendering
- Lazy loading for better initial page load

### Error Handling
- Graceful degradation when API is unavailable
- Clear fallback to formatted addresses
- No breaking changes to existing functionality

## Benefits

1. **Better UX** - Users see human-readable names instead of long addresses
2. **Professional Appearance** - More polished and modern interface
3. **Base Ecosystem Integration** - Native support for Base's naming system
4. **Future-Proof** - Built on Coinbase's OnchainKit for long-term support
5. **Consistent Experience** - Same naming system used across Base ecosystem

## Next Steps

1. **Get API Key** - Set up Coinbase Cloud API key for production
2. **Test Integration** - Visit `/basenames` to test functionality
3. **Customize Styling** - Adjust component styles to match your design
4. **Add More Locations** - Integrate Basenames in content cards, transaction history, etc.

The integration is complete and ready for use! 🎉


