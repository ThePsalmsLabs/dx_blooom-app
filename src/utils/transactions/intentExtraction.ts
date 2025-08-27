/**
 * Intent ID Extraction Utility - PRODUCTION READY
 * 
 * This utility extracts critical payment intent data from blockchain transaction logs.
 * It serves as the foundation for the entire ETH payment flow by bridging the gap
 * between transaction completion and subsequent workflow steps.
 * 
 * ALIGNED WITH ACTUAL SMART CONTRACT EVENTS:
 * - PaymentIntentCreated(bytes16,address,address,uint8,uint256,uint256,uint256,uint256,address,uint256)
 * - IntentReadyForSigning(bytes16,bytes32,uint256)
 * - IntentSigned(bytes16,bytes)
 * 
 * Why This Component Matters:
 * - Payment intents are created on-chain and return transaction hashes
 * - The actual intent ID needed for backend polling is embedded in transaction logs
 * - Without intent IDs, we cannot poll for signatures or execute payments
 * - This utility provides the critical link between transaction completion and workflow continuation
 * 
 * Integration Points:
 * - Used by usePaymentIntentFlow to extract IDs after intent creation
 * - Integrates with wagmi transaction receipt data
 * - Works with your existing Commerce Protocol Integration events
 * 
 * File: src/utils/transaction/intentExtraction.ts
 */

import { Log, parseEventLogs, keccak256, toHex } from 'viem'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

// Event topic hashes for efficient log filtering
// These are the ACTUAL keccak256 hashes of the event signatures from your smart contracts
const EVENT_TOPICS = {
  PAYMENT_INTENT_CREATED: keccak256(
    toHex('PaymentIntentCreated(bytes16,address,address,uint8,uint256,uint256,uint256,uint256,address,uint256)')
  ),
  INTENT_READY_FOR_SIGNING: keccak256(
    toHex('IntentReadyForSigning(bytes16,bytes32,uint256)')
  ),
  INTENT_SIGNED: keccak256(
    toHex('IntentSigned(bytes16,bytes)')
  )
} as const

/**
 * Intent Data Interface - ALIGNED WITH ACTUAL CONTRACT EVENTS
 * 
 * Represents the essential data extracted from payment intent creation logs.
 * This interface ensures type safety and provides clear documentation of what
 * data is available after intent extraction.
 */
export interface ExtractedIntentData {
  /** The unique identifier for this payment intent (bytes16) */
  readonly intentId: `0x${string}`
  
  /** The user who created this intent */
  readonly user: `0x${string}`
  
  /** The creator who will receive payment */
  readonly creator: `0x${string}`
  
  /** Payment type (0=pay-per-view, 1=subscription, etc.) */
  readonly paymentType: number
  
  /** Total payment amount including all fees */
  readonly totalAmount: bigint
  
  /** Amount that goes to the creator */
  readonly creatorAmount: bigint
  
  /** Platform fee amount */
  readonly platformFee: bigint
  
  /** Operator fee amount */
  readonly operatorFee: bigint
  
  /** The payment token contract address */
  readonly paymentToken: `0x${string}`
  
  /** The expected payment amount */
  readonly expectedAmount: bigint
  
  /** The transaction hash where this intent was created */
  readonly transactionHash: `0x${string}`
  
  /** The block number where this intent was created */
  readonly blockNumber: bigint
  
  /** Timestamp when this intent was created */
  readonly timestamp: bigint
}

/**
 * Intent Signing Data Interface
 * 
 * Represents data extracted from IntentReadyForSigning and IntentSigned events
 */
export interface IntentSigningData {
  /** The unique identifier for this payment intent */
  readonly intentId: `0x${string}`
  
  /** The hash of the intent data that needs signing */
  readonly intentHash?: `0x${string}`
  
  /** The deadline for signing this intent */
  readonly deadline?: bigint
  
  /** The signature provided for this intent */
  readonly signature?: `0x${string}`
  
  /** The transaction hash where this event occurred */
  readonly transactionHash: `0x${string}`
  
  /** The block number where this event occurred */
  readonly blockNumber: bigint
  
  /** Timestamp when this event occurred */
  readonly timestamp: bigint
}

/**
 * Intent Extraction Error Types
 * 
 * Specific error types for different failure scenarios in intent extraction.
 * This provides better error handling and debugging capabilities.
 */
export class IntentExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_LOGS' | 'INVALID_LOG_FORMAT' | 'MISSING_INTENT_DATA' | 'DECODE_ERROR' | 'INVALID_EVENT_DATA',
    public readonly transactionHash?: `0x${string}`,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'IntentExtractionError'
  }
}

/**
 * Extract Intent ID from Transaction Logs - PRODUCTION READY
 * 
 * This is the primary function that extracts a payment intent ID from blockchain
 * transaction logs. It's properly aligned with your Commerce Protocol Integration
 * contract and handles the actual event structure.
 * 
 * @param logs - Array of transaction logs from wagmi transaction receipt
 * @param transactionHash - Optional transaction hash for better error reporting
 * @returns The extracted intent ID as a hex string
 * @throws IntentExtractionError when intent ID cannot be found or extracted
 * 
 * Usage Example:
 * ```typescript
 * const receipt = await waitForTransactionReceipt({ hash: txHash })
 * const intentId = extractIntentIdFromLogs(receipt.logs, txHash)
 * ```
 */
export function extractIntentIdFromLogs(
  logs: readonly Log[],
  transactionHash?: `0x${string}`
): `0x${string}` {
  // Validate input
  if (!logs || logs.length === 0) {
    throw new IntentExtractionError(
      'No logs found in transaction receipt',
      'NO_LOGS',
      transactionHash
    )
  }

  try {
    // Look for PaymentIntentCreated event
    for (const log of logs) {
      // Check if this log matches our expected event topic
      if (log.topics && log.topics.length > 0 && log.topics[0] === EVENT_TOPICS.PAYMENT_INTENT_CREATED) {
        // The intent ID is the first indexed parameter (topics[1])
        if (log.topics.length >= 2 && log.topics[1]) {
          const intentId = log.topics[1] as `0x${string}`
          
          // Validate the intent ID format (should be bytes16, so 34 characters including 0x)
          if (validateIntentIdFormat(intentId)) {
            return intentId
          } else {
            throw new IntentExtractionError(
              `Invalid intent ID format: ${intentId}`,
              'INVALID_LOG_FORMAT',
              transactionHash
            )
          }
        }
      }
    }

    // If we reach here, no PaymentIntentCreated event was found
    throw new IntentExtractionError(
      'PaymentIntentCreated event not found in transaction logs',
      'MISSING_INTENT_DATA',
      transactionHash
    )

  } catch (error) {
    if (error instanceof IntentExtractionError) {
      throw error // Re-throw our custom errors
    }

    // Wrap unexpected errors
    throw new IntentExtractionError(
      `Failed to extract intent ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DECODE_ERROR',
      transactionHash,
      error
    )
  }
}

/**
 * Extract Complete Intent Data from Transaction Logs - PRODUCTION READY
 * 
 * This advanced function extracts comprehensive intent data including all relevant
 * parameters from the transaction logs. It provides complete information aligned
 * with your actual smart contract events.
 * 
 * @param logs - Array of transaction logs from wagmi transaction receipt
 * @param transactionHash - Transaction hash for context
 * @param blockNumber - Block number where transaction was mined
 * @param timestamp - Block timestamp
 * @returns Complete extracted intent data
 * @throws IntentExtractionError when data cannot be extracted
 * 
 * Usage Example:
 * ```typescript
 * const receipt = await waitForTransactionReceipt({ hash: txHash })
 * const block = await getBlock({ blockNumber: receipt.blockNumber })
 * const intentData = extractCompleteIntentData(
 *   receipt.logs, 
 *   txHash, 
 *   receipt.blockNumber, 
 *   block.timestamp
 * )
 * ```
 */
export function extractCompleteIntentData(
  logs: readonly Log[],
  transactionHash: `0x${string}`,
  blockNumber: bigint,
  timestamp: bigint
): ExtractedIntentData {
  try {
    // Parse logs using viem's parseEventLogs for robust parsing
    const parsedLogs = parseEventLogs({
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      logs: logs as Log[]
    })

    // Find the PaymentIntentCreated event
    const intentCreatedEvent = parsedLogs.find(
      log => log.eventName === 'PaymentIntentCreated'
    )

    if (!intentCreatedEvent) {
      throw new IntentExtractionError(
        'PaymentIntentCreated event not found',
        'MISSING_INTENT_DATA',
        transactionHash
      )
    }

    // Extract data from the event args - ALIGNED WITH ACTUAL CONTRACT
    const { args } = intentCreatedEvent
    
    // Validate that all required args are present
    if (!args.intentId || !args.user || !args.creator || !args.expectedAmount) {
      throw new IntentExtractionError(
        'PaymentIntentCreated event missing required arguments',
        'INVALID_EVENT_DATA',
        transactionHash
      )
    }
    
    return {
      intentId: args.intentId as `0x${string}`,
      user: args.user as `0x${string}`,
      creator: args.creator as `0x${string}`,
      paymentType: Number(args.paymentType || 0),
      totalAmount: BigInt(args.totalAmount || 0),
      creatorAmount: BigInt(args.creatorAmount || 0),
      platformFee: BigInt(args.platformFee || 0),
      operatorFee: BigInt(args.operatorFee || 0),
      paymentToken: args.paymentToken as `0x${string}`,
      expectedAmount: args.expectedAmount as bigint,
      transactionHash,
      blockNumber,
      timestamp
    }

  } catch (error) {
    if (error instanceof IntentExtractionError) {
      throw error
    }

    throw new IntentExtractionError(
      `Failed to extract complete intent data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DECODE_ERROR',
      transactionHash,
      error
    )
  }
}

/**
 * Extract Intent Signing Data from Transaction Logs
 * 
 * Extracts data from IntentReadyForSigning and IntentSigned events
 * 
 * @param logs - Array of transaction logs
 * @param transactionHash - Transaction hash for context
 * @param blockNumber - Block number where transaction was mined
 * @param timestamp - Block timestamp
 * @returns Intent signing data if found
 */
export function extractIntentSigningData(
  logs: readonly Log[],
  transactionHash: `0x${string}`,
  blockNumber: bigint,
  timestamp: bigint
): IntentSigningData | null {
  try {
    const parsedLogs = parseEventLogs({
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      logs: logs as Log[]
    })

    // Look for IntentReadyForSigning event
    const readyForSigningEvent = parsedLogs.find(
      log => log.eventName === 'IntentReadyForSigning'
    )

    if (readyForSigningEvent) {
      const { args } = readyForSigningEvent
      return {
        intentId: args.intentId as `0x${string}`,
        intentHash: args.intentHash as `0x${string}`,
        deadline: args.deadline as bigint,
        transactionHash,
        blockNumber,
        timestamp
      }
    }

    // Look for IntentSigned event
    const signedEvent = parsedLogs.find(
      log => log.eventName === 'IntentSigned'
    )

    if (signedEvent) {
      const { args } = signedEvent
      return {
        intentId: args.intentId as `0x${string}`,
        signature: args.signature as `0x${string}`,
        transactionHash,
        blockNumber,
        timestamp
      }
    }

    return null

  } catch (error) {
    console.error('Error extracting intent signing data:', error)
    return null
  }
}

/**
 * Validate Intent ID Format
 * 
 * Utility function to validate that a string is a properly formatted intent ID.
 * Intent IDs should be bytes16 values represented as 34-character hex strings.
 * 
 * @param intentId - The intent ID string to validate
 * @returns True if the intent ID is properly formatted
 * 
 * Usage Example:
 * ```typescript
 * if (validateIntentIdFormat(intentId)) {
 *   // Proceed with intent operations
 * } else {
 *   // Handle invalid intent ID
 * }
 * ```
 */
export function validateIntentIdFormat(intentId: string): intentId is `0x${string}` {
  return (
    typeof intentId === 'string' &&
    intentId.length === 34 &&
    intentId.startsWith('0x') &&
    /^0x[a-fA-F0-9]{32}$/.test(intentId)
  )
}

/**
 * Find Intent Signing Event
 * 
 * Utility function to check if a transaction contains an IntentSigned event.
 * This is useful for monitoring when backend signatures have been provided
 * for previously created intents.
 * 
 * @param logs - Transaction logs to search
 * @returns Intent ID if IntentSigned event found, null otherwise
 */
export function findIntentSigningEvent(logs: readonly Log[]): `0x${string}` | null {
  try {
    for (const log of logs) {
      if (log.topics && log.topics[0] === EVENT_TOPICS.INTENT_SIGNED) {
        const intentId = log.topics[1] as `0x${string}`
        if (validateIntentIdFormat(intentId)) {
          return intentId
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error finding intent signing event:', error)
    return null
  }
}

/**
 * Find Intent Ready for Signing Event
 * 
 * Utility function to check if a transaction contains an IntentReadyForSigning event.
 * 
 * @param logs - Transaction logs to search
 * @returns Intent ID if IntentReadyForSigning event found, null otherwise
 */
export function findIntentReadyForSigningEvent(logs: readonly Log[]): `0x${string}` | null {
  try {
    for (const log of logs) {
      if (log.topics && log.topics[0] === EVENT_TOPICS.INTENT_READY_FOR_SIGNING) {
        const intentId = log.topics[1] as `0x${string}`
        if (validateIntentIdFormat(intentId)) {
          return intentId
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error finding intent ready for signing event:', error)
    return null
  }
}

// Export utility constants for use in other components
export { EVENT_TOPICS }

/**
 * Development and Testing Utilities
 * 
 * These functions are useful during development and testing to validate
 * that intent extraction is working correctly with your smart contracts.
 */
export const DevUtils = {
  /**
   * Log detailed information about transaction logs for debugging
   */
  debugTransactionLogs(logs: readonly Log[], transactionHash?: `0x${string}`) {
    console.group(`🔍 Transaction Log Analysis ${transactionHash ? `(${transactionHash})` : ''}`)
    console.log(`Total logs: ${logs.length}`)
    
    logs.forEach((log, index) => {
      console.group(`Log ${index}`)
      console.log(`Address: ${log.address}`)
      console.log(`Topics: ${log.topics?.length || 0}`)
      if (log.topics && log.topics.length > 0) {
        console.log(`Topic[0] (Event Signature): ${log.topics[0]}`)
        
        // Check for specific events
        if (log.topics[0] === EVENT_TOPICS.PAYMENT_INTENT_CREATED) {
          console.log('✅ Found PaymentIntentCreated event')
          console.log(`Intent ID: ${log.topics[1] || 'Missing'}`)
          console.log(`User: ${log.topics[2] || 'Missing'}`)
          console.log(`Creator: ${log.topics[3] || 'Missing'}`)
        } else if (log.topics[0] === EVENT_TOPICS.INTENT_READY_FOR_SIGNING) {
          console.log('✅ Found IntentReadyForSigning event')
          console.log(`Intent ID: ${log.topics[1] || 'Missing'}`)
        } else if (log.topics[0] === EVENT_TOPICS.INTENT_SIGNED) {
          console.log('✅ Found IntentSigned event')
          console.log(`Intent ID: ${log.topics[1] || 'Missing'}`)
        }
      }
      console.log(`Data: ${log.data}`)
      console.groupEnd()
    })
    
    console.groupEnd()
  },

  /**
   * Validate that the Commerce Protocol Integration ABI includes required events
   */
  validateABI() {
    const requiredEvents = ['PaymentIntentCreated', 'IntentReadyForSigning', 'IntentSigned']
    const abiEvents = COMMERCE_PROTOCOL_INTEGRATION_ABI
      .filter((item: any) => item.type === 'event')
      .map((item: any) => item.name)

    const missingEvents = requiredEvents.filter(event => !abiEvents.includes(event))
    
    if (missingEvents.length > 0) {
      console.warn(`⚠️  Missing events in Commerce Protocol Integration ABI: ${missingEvents.join(', ')}`)
      return false
    }

    console.log('✅ Commerce Protocol Integration ABI includes all required events')
    return true
  },

  /**
   * Validate event topic hashes against the ABI
   */
  validateEventTopics() {
    try {
      // Test the actual event signatures
      const testPaymentIntentCreated = keccak256(
        toHex('PaymentIntentCreated(bytes16,address,address,uint8,uint256,uint256,uint256,uint256,address,uint256)')
      )
      const testIntentReadyForSigning = keccak256(
        toHex('IntentReadyForSigning(bytes16,bytes32,uint256)')
      )
      const testIntentSigned = keccak256(
        toHex('IntentSigned(bytes16,bytes)')
      )

      const isValid = 
        testPaymentIntentCreated === EVENT_TOPICS.PAYMENT_INTENT_CREATED &&
        testIntentReadyForSigning === EVENT_TOPICS.INTENT_READY_FOR_SIGNING &&
        testIntentSigned === EVENT_TOPICS.INTENT_SIGNED

      if (isValid) {
        console.log('✅ Event topic hashes are correctly calculated')
      } else {
        console.warn('⚠️  Event topic hashes mismatch detected')
        console.log('Expected PaymentIntentCreated:', testPaymentIntentCreated)
        console.log('Actual PaymentIntentCreated:', EVENT_TOPICS.PAYMENT_INTENT_CREATED)
      }

      return isValid
    } catch (error) {
      console.error('❌ Error validating event topics:', error)
      return false
    }
  }
}