/**
 * Utility Functions - Application Helper Layer  
 * File: src/lib/utils.ts
 * 
 * This file contains the essential utility functions that transform raw blockchain
 * data into polished user experiences. Think of these as your craftsman's tools -
 * small but powerful functions that handle the common operations your application
 * needs throughout the user interface.
 * 
 * These utilities serve several critical purposes:
 * 1. Data Formatting: Convert blockchain data (BigInt, addresses) to readable text
 * 2. UI Consistency: Standardize how information appears across components
 * 3. Input Validation: Ensure user inputs meet blockchain requirements
 * 4. Error Handling: Provide user-friendly error messages
 * 5. Performance: Memoize expensive calculations and transformations
 * 
 * Every function here should be pure (no side effects) and thoroughly tested,
 * since they're used throughout your application's user interface.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Address } from 'viem'
import { ContentCategory } from '@/types/contracts'

// ===== CORE UI UTILITIES =====
// These functions handle styling and className management

/**
 * Combines and merges Tailwind CSS classes intelligently
 * 
 * This is the most important utility in any shadcn/ui project. It combines
 * multiple className strings while handling Tailwind conflicts intelligently.
 * For example, if you pass both "bg-red-500" and "bg-blue-500", it will keep
 * only the last one to avoid CSS conflicts.
 * 
 * @param inputs - Any number of className values (strings, conditionals, arrays)
 * @returns Optimized className string with conflicts resolved
 * 
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "text-white")
 * // Result: "px-4 py-2 bg-blue-500 text-white" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ===== BLOCKCHAIN DATA FORMATTING =====
// These functions convert raw blockchain data into user-friendly formats

/**
 * Formats a blockchain address for display in the UI
 * 
 * Ethereum addresses are 42 characters long (0x + 40 hex chars), which is too
 * long for most UI contexts. This function creates a "truncated" version that
 * shows the beginning and end with "..." in the middle.
 * 
 * @param address - Full Ethereum address
 * @param startLength - Number of characters to show at start (default: 6)
 * @param endLength - Number of characters to show at end (default: 4)
 * @returns Formatted address like "0x1234...abcd"
 * 
 * @example
 * formatAddress("0x742d35CC6Eb6B3d3C6B8A40B5A13E9A9B0B5F0F0")
 * // Result: "0x742d...F0F0"
 */
export function formatAddress(
  address: Address,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return ''
  
  // Handle short addresses (shouldn't happen with real Ethereum addresses)
  if (address.length <= startLength + endLength) {
    return address
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Formats a BigInt amount as a human-readable currency string
 * 
 * Blockchain contracts use BigInt for precise decimal handling, but users expect
 * to see normal decimal numbers. This function converts BigInt amounts (like those
 * from USDC with 6 decimal places) into readable currency strings.
 * 
 * @param amount - BigInt amount (in smallest unit, e.g., USDC micro-units)
 * @param decimals - Number of decimal places the token uses (default: 6 for USDC)
 * @param symbol - Currency symbol to display (default: 'USDC')
 * @param locale - Locale for number formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1500000n, 6, 'USDC')  
 * // Result: "$1.50 USDC"
 * 
 * formatCurrency(1000000000n, 18, 'ETH')
 * // Result: "$1.00 ETH"
 */
export function formatCurrency(
  amount: bigint,
  decimals: number = 6,
  symbol: string = 'USDC',
  locale: string = 'en-US'
): string {
  if (amount === BigInt(0)) return `$0.00 ${symbol}`
  
  // Convert BigInt to decimal number
  const divisor = BigInt(10) ** BigInt(decimals)
  const wholePart = amount / divisor
  const fractionalPart = amount % divisor
  
  // Create decimal number
  const decimalValue = Number(wholePart) + Number(fractionalPart) / Number(divisor)
  
  // Format as currency
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals > 6 ? 6 : decimals, // Cap display decimals
  })
  
  const formattedAmount = formatter.format(decimalValue)
  
  // Replace USD with the actual symbol if different
  if (symbol !== 'USD') {
    return formattedAmount.replace('USD', symbol)
  }
  
  return formattedAmount
}

/**
 * Formats a BigInt amount as a simple decimal string without currency symbols
 * 
 * Sometimes you need just the numeric value without dollar signs or currency
 * symbols. This is useful for form inputs or mathematical displays.
 * 
 * @param amount - BigInt amount in smallest unit
 * @param decimals - Number of decimal places
 * @param maxDecimals - Maximum decimal places to show (default: same as decimals)
 * @returns Plain decimal string
 * 
 * @example
 * formatDecimal(1500000n, 6)
 * // Result: "1.50"
 */
export function formatDecimal(
  amount: bigint,
  decimals: number,
  maxDecimals?: number
): string {
  const divisor = BigInt(10) ** BigInt(decimals)
  const wholePart = amount / divisor
  const fractionalPart = amount % divisor
  
  // Convert to decimal
  const decimalValue = Number(wholePart) + Number(fractionalPart) / Number(divisor)
  
  // Format with appropriate decimal places
  const displayDecimals = maxDecimals ?? decimals
  return decimalValue.toFixed(displayDecimals).replace(/\.?0+$/, '')
}

/**
 * Parses a decimal string into BigInt for contract calls
 * 
 * This is the reverse of formatDecimal - it converts user input (like "1.50")
 * into the BigInt format that smart contracts expect.
 * 
 * @param value - Decimal string from user input
 * @param decimals - Number of decimal places the token uses
 * @returns BigInt amount in smallest unit
 * @throws Error if the input is invalid
 * 
 * @example
 * parseDecimalToBigInt("1.50", 6)
 * // Result: 1500000n
 */
export function parseDecimalToBigInt(value: string, decimals: number): bigint {
  if (!value || value.trim() === '') {
    throw new Error('Value cannot be empty')
  }
  
  // Remove any non-numeric characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '')
  
  // Check for valid decimal format
  const decimalParts = cleanValue.split('.')
  if (decimalParts.length > 2) {
    throw new Error('Invalid decimal format')
  }
  
  const [wholePart = '0', fractionalPart = ''] = decimalParts
  
  // Pad or truncate fractional part to match token decimals
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
  
  // Combine whole and fractional parts
  const fullValue = wholePart + paddedFractional
  
  try {
    return BigInt(fullValue)
  } catch {
    throw new Error('Invalid number format')
  }
}


/**
 * Formats a number or BigInt according to locale and formatting options.
 *
 * Use this for quantities, metrics, and any numeric display where you need
 * consistent grouping separators or controlled decimal precision.
 *
 * @param value       - The numeric or bigint value to format.
 * @param locale      - BCP 47 language tag for localization (default: 'en-US').
 * @param options     - Intl.NumberFormatOptions to control grouping, decimals, etc.
 *                      Defaults to grouping enabled and up to 2 decimal places.
 * @returns           - Localized, formatted number string.
 *
 * @example
 * formatNumber(1234567.891) 
 * // "1,234,567.89"
 *
 * formatNumber(1500n)          
 * // "1,500"
 *
 * formatNumber(0.1234, 'de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
 * // "0,1234" (in German locale)
 */
export function formatNumber(
  value: number | bigint,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }
): string {
  const num = typeof value === 'bigint' ? Number(value) : value;
  return new Intl.NumberFormat(locale, options).format(num);
}



// ===== TIME AND DATE FORMATTING =====
// These functions handle blockchain timestamps and time-based calculations

/**
 * Formats a blockchain timestamp as a relative time string
 * 
 * Blockchain timestamps are Unix timestamps (seconds since 1970), but users
 * prefer relative times like "2 hours ago" or "3 days ago". This function
 * provides user-friendly time formatting.
 * 
 * @param timestamp - BigInt timestamp from blockchain
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(1700000000n)
 * // Result: "2 days ago" (depending on current time)
 */
export function formatRelativeTime(timestamp: bigint, locale: string = 'en-US'): string {
  const now = Math.floor(Date.now() / 1000) // Current time in seconds
  const timestampSeconds = Number(timestamp)
  
  // Calculate difference in seconds
  const diffSeconds = now - timestampSeconds
  
  // If timestamp is in the future, handle appropriately
  if (diffSeconds < 0) {
    return 'In the future'
  }
  
  // Use Intl.RelativeTimeFormat for proper localization
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  
  // Define time units in seconds
  const timeUnits = [
    { unit: 'year', seconds: 365 * 24 * 60 * 60 },
    { unit: 'month', seconds: 30 * 24 * 60 * 60 },
    { unit: 'week', seconds: 7 * 24 * 60 * 60 },
    { unit: 'day', seconds: 24 * 60 * 60 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ] as const
  
  // Find the largest appropriate unit
  for (const { unit, seconds } of timeUnits) {
    const value = Math.floor(diffSeconds / seconds)
    if (value >= 1) {
      return rtf.format(-value, unit)
    }
  }
  
  return 'Just now'
}

/**
 * Formats a blockchain timestamp as an absolute date/time
 * 
 * Sometimes you need the exact date and time rather than relative time.
 * This function provides standard date formatting for blockchain timestamps.
 * 
 * @param timestamp - BigInt timestamp from blockchain
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale for formatting
 * @returns Formatted date string
 */
export function formatAbsoluteTime(
  timestamp: bigint,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  locale: string = 'en-US'
): string {
  const date = new Date(Number(timestamp) * 1000) // Convert to milliseconds
  return new Intl.DateTimeFormat(locale, options).format(date)
}

// ===== CONTENT AND IPFS UTILITIES =====
// These functions handle content-specific formatting and validation

/**
 * Formats an IPFS hash for display
 * 
 * IPFS hashes are long strings that don't display well in compact UIs.
 * This function truncates them while keeping enough information for identification.
 * 
 * @param ipfsHash - Full IPFS hash
 * @param length - Number of characters to show (default: 12)
 * @returns Truncated hash with ellipsis
 * 
 * @example
 * formatIpfsHash("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG")
 * // Result: "QmYwAPJz...WnPbdG"
 */
export function formatIpfsHash(ipfsHash: string, length: number = 12): string {
  if (!ipfsHash || ipfsHash.length <= length) return ipfsHash
  
  const start = Math.floor(length / 2)
  const end = Math.ceil(length / 2)
  
  return `${ipfsHash.slice(0, start)}...${ipfsHash.slice(-end)}`
}

/**
 * Validates an IPFS hash format
 * 
 * This function checks if a string looks like a valid IPFS hash.
 * Useful for form validation and error prevention.
 * 
 * @param hash - String to validate
 * @returns True if hash appears valid
 */
export function isValidIpfsHash(hash: string): boolean {
  if (!hash) return false
  
  // IPFS v0 hashes start with Qm and are 46 characters
  // IPFS v1 hashes start with b and are longer
  const v0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  const v1Pattern = /^b[A-Za-z2-7]{58}$/
  
  return v0Pattern.test(hash) || v1Pattern.test(hash)
}

/**
 * Converts a ContentCategory enum to a user-friendly string
 * 
 * @param category - ContentCategory enum value
 * @returns Human-readable category name
 */
export function formatContentCategory(category: ContentCategory): string {
  const categoryMap = {
    [ContentCategory.ARTICLE]: 'Article',
    [ContentCategory.VIDEO]: 'Video',
    [ContentCategory.AUDIO]: 'Audio',
    [ContentCategory.IMAGE]: 'Image',
    [ContentCategory.DOCUMENT]: 'Document',
    [ContentCategory.COURSE]: 'Course',
    [ContentCategory.SOFTWARE]: 'Software',
    [ContentCategory.DATA]: 'Data'
  }
  
  return categoryMap[category as keyof typeof categoryMap] || 'Unknown'
}

// ===== ERROR HANDLING UTILITIES =====
// These functions standardize error messages and handling

/**
 * Formats Web3 error messages for user display
 * 
 * Web3 errors can be technical and scary. This function converts them
 * into user-friendly messages that help rather than confuse.
 * 
 * @param error - Error object from Web3 operations
 * @returns User-friendly error message
 */
export function formatWeb3Error(error: Error): string {
  const message = error.message.toLowerCase()
  
  // Common error patterns and their user-friendly translations
  if (message.includes('user rejected')) {
    return 'Transaction was cancelled by user'
  }
  
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds to complete transaction'
  }
  
  if (message.includes('gas')) {
    return 'Transaction failed due to gas issues. Please try again.'
  }
  
  if (message.includes('nonce')) {
    return 'Transaction nonce error. Please refresh and try again.'
  }
  
  if (message.includes('network')) {
    return 'Network connection issue. Please check your internet.'
  }
  
  if (message.includes('revert')) {
    return 'Transaction was rejected by the smart contract'
  }
  
  // Return original message if no pattern matches, but make it more readable
  return error.message.replace(/^Error: /, '').replace(/\.$/, '')
}

// ===== INPUT VALIDATION UTILITIES =====
// These functions validate user inputs before sending to blockchain

/**
 * Validates an Ethereum address format
 * 
 * @param address - Address string to validate
 * @returns True if address appears valid
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false
  
  // Basic format check: starts with 0x and is 42 characters total
  const addressPattern = /^0x[a-fA-F0-9]{40}$/
  return addressPattern.test(address)
}

/**
 * Validates a price input for content pricing
 * 
 * @param price - Price string from user input
 * @param minPrice - Minimum allowed price in USDC
 * @param maxPrice - Maximum allowed price in USDC
 * @returns Validation result with error message if invalid
 */
export function validatePrice(
  price: string,
  minPrice: number = 0.01,
  maxPrice: number = 100
): { isValid: boolean; error?: string } {
  if (!price || price.trim() === '') {
    return { isValid: false, error: 'Price is required' }
  }
  
  const numericPrice = parseFloat(price)
  
  if (isNaN(numericPrice)) {
    return { isValid: false, error: 'Price must be a valid number' }
  }
  
  if (numericPrice < minPrice) {
    return { isValid: false, error: `Price must be at least $${minPrice}` }
  }
  
  if (numericPrice > maxPrice) {
    return { isValid: false, error: `Price cannot exceed $${maxPrice}` }
  }
  
  return { isValid: true }
}

// ===== PERFORMANCE UTILITIES =====
// These functions help with performance optimization

/**
 * Debounce function to limit the rate of function calls
 * 
 * Useful for search inputs, form validation, and other scenarios where
 * you want to wait for user input to settle before taking action.
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttle function to limit function calls to once per interval
 * 
 * Unlike debounce, throttle ensures the function is called regularly
 * at the specified interval, which is useful for scroll handlers
 * and other high-frequency events.
 * 
 * @param func - Function to throttle
 * @param interval - Interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= interval) {
      lastCall = now
      func(...args)
    }
  }
}


/**
 * Formats a number or BigInt as a percentage string
 * 
 * Useful for analytics, progress bars, and performance indicators. Accepts
 * either a ratio (0.0–1.0) or a percentage number (e.g. 75).
 * 
 * @param value - The numeric or bigint value (e.g. 0.75 or 75n)
 * @param fromDecimal - If true, input is treated as a decimal ratio (0–1) and converted to %
 * @param maxFractionDigits - Maximum number of decimal places to show (default: 2)
 * @returns Formatted string like "75%" or "75.23%"
 * 
 * @example
 * formatPercentage(0.7532, true) // "75.32%"
 * formatPercentage(75)          // "75%"
 * formatPercentage(987654321n, false) // "987654321%"
 */
export function formatPercentage(
  value: number | bigint,
  fromDecimal: boolean = false,
  maxFractionDigits: number = 2
): string {
  const numericValue = typeof value === 'bigint' ? Number(value) : value
  const percentValue = fromDecimal ? numericValue * 100 : numericValue

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  })

  return formatter.format(percentValue / 100)
}