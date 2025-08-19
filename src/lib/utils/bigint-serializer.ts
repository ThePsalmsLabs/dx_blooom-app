// src/lib/utils/bigint-serializer.ts
/**
 * Utility functions for safely serializing BigInt values in console logs and JSON operations
 */

/**
 * Safely stringify an object that may contain BigInt values
 * @param obj - The object to stringify
 * @param space - Number of spaces for indentation (default: 2)
 * @returns JSON string with BigInt values converted to strings
 */
export function safeStringify(obj: any, space: number = 2): string {
  try {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    , space)
  } catch (error) {
    return `[Serialization Error]: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Safely log an object that may contain BigInt values
 * @param label - Label for the log
 * @param obj - The object to log
 */
export function safeLog(label: string, obj: any): void {
  console.log(label, safeStringify(obj))
}

/**
 * Convert BigInt values in an object to strings for safe serialization
 * @param obj - The object to convert
 * @returns New object with BigInt values converted to strings
 */
export function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString)
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value)
    }
    return converted
  }
  
  return obj
}

/**
 * Format BigInt values for display in UI
 * @param value - The BigInt value
 * @param decimals - Number of decimal places for token amounts (default: 18)
 * @returns Formatted string
 */
export function formatBigInt(value: bigint, decimals: number = 18): string {
  if (decimals === 0) {
    return value.toString()
  }
  
  const divisor = BigInt(10 ** decimals)
  const quotient = value / divisor
  const remainder = value % divisor
  
  if (remainder === BigInt(0)) {
    return quotient.toString()
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmedRemainder = remainderStr.replace(/0+$/, '')
  
  return `${quotient}.${trimmedRemainder}`
}

/**
 * Parse a string representation of a BigInt back to BigInt
 * @param str - String representation (may end with 'n')
 * @returns BigInt value
 */
export function parseBigInt(str: string): bigint {
  if (str.endsWith('n')) {
    return BigInt(str.slice(0, -1))
  }
  return BigInt(str)
}
