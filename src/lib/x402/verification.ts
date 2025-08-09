// src/lib/x402/verification.ts
import { getSharedPublicClient } from '@/lib/web3/client'
import { type Address, type Hash, type PublicClient, type Log } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractAddresses } from '../contracts/config'

/**
 * Type Guard for ERC20 Transfer Logs
 * 
 * This function checks if a log object is a valid ERC20 Transfer event log
 * by verifying it has the correct number of topics and the correct event signature.
 */
function isERC20TransferLog(log: Log): log is Log & { topics: readonly [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`] } {
  const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  
  return (
    'topics' in log &&
    Array.isArray(log.topics) &&
    log.topics.length >= 3 &&
    log.topics[0] === transferEventSignature
  )
}

/**
 * Extract Address from Topic
 * 
 * This function safely extracts an Ethereum address from a topic string.
 * Topics are 32-byte values, so we need to remove the padding to get the 20-byte address.
 */
function extractAddressFromTopic(topic: `0x${string}`): Address {
  // Remove the 0x prefix and the 24-character padding (12 bytes)
  // Addresses are 20 bytes (40 hex characters), so we take the last 40 characters
  const addressHex = topic.slice(-40)
  return `0x${addressHex}` as Address
}

/**
 * Payment Proof Interface - Complete x402 Payment Proof Structure
 * 
 * This interface defines the exact structure of a payment proof that our system
 * will accept. Each field serves a specific security purpose and must be present
 * for verification to proceed. This structure follows x402 standards while
 * integrating with your existing smart contract infrastructure.
 */
export interface PaymentProof {
  /** The blockchain transaction hash where the payment occurred */
  readonly transactionId: Hash
  
  /** Payment amount in the smallest unit of the token (wei for USDC with 6 decimals) */
  readonly amount: string
  
  /** The content ID this payment was intended to purchase */
  readonly contentId: string
  
  /** Ethereum address of the user who made the payment */
  readonly userAddress: Address
  
  /** Unix timestamp when the payment was initiated (used for replay attack prevention) */
  readonly timestamp: number
  
  /** The token contract address used for payment (should be USDC) */
  readonly tokenAddress: Address
  
  /** The recipient address that should have received the payment (platform wallet) */
  readonly recipientAddress: Address
  
  /** Optional cryptographic signature for additional verification */
  readonly signature?: string
}

/**
 * Payment Verification Result Interface
 * 
 * This interface provides comprehensive information about the verification outcome.
 * Rather than just returning true/false, we provide detailed information about
 * what was verified and what might have failed, enabling better error handling
 * and debugging capabilities.
 */
export interface PaymentVerificationResult {
  /** Whether the payment proof passed all verification checks */
  readonly isValid: boolean
  
  /** Detailed verification status for each check performed */
  readonly verification: {
    /** Whether the transaction exists and is confirmed on the blockchain */
    readonly transactionExists: boolean
    
    /** Whether the payment amount matches the required amount */
    readonly amountMatches: boolean
    
    /** Whether the payment went to the correct recipient address */
    readonly recipientCorrect: boolean
    
    /** Whether the payment used the correct token (USDC) */
    readonly tokenCorrect: boolean
    
    /** Whether this transaction hasn't been used before for this content */
    readonly notReplayAttack: boolean
    
    /** Whether the timestamp is within acceptable range */
    readonly timestampValid: boolean
  }
  
  /** Human-readable reason for failure if verification failed */
  readonly failureReason?: string
  
  /** The actual transaction details retrieved from the blockchain */
  readonly transactionDetails?: {
    readonly blockNumber: bigint
    readonly from: Address
    readonly to: Address
    readonly value: bigint
    readonly gasUsed: bigint
    readonly status: 'success' | 'reverted'
  }
}

/**
 * Transaction Verification Cache
 * 
 * This cache prevents replay attacks by tracking which transactions have already
 * been used for content access. In a production system, this would be backed
 * by a persistent database, but for this implementation we use an in-memory
 * cache that provides the essential security functionality.
 */
class TransactionVerificationCache {
  private readonly usedTransactions = new Map<string, {
    readonly contentId: string
    readonly userAddress: Address
    readonly timestamp: number
  }>()

  /**
   * Check if a transaction has already been used for content access
   */
  public isTransactionUsed(transactionId: Hash, contentId: string): boolean {
    const cacheKey = `${transactionId}-${contentId}`
    return this.usedTransactions.has(cacheKey)
  }

  /**
   * Mark a transaction as used for a specific content purchase
   */
  public markTransactionUsed(
    transactionId: Hash, 
    contentId: string, 
    userAddress: Address
  ): void {
    const cacheKey = `${transactionId}-${contentId}`
    this.usedTransactions.set(cacheKey, {
      contentId,
      userAddress,
      timestamp: Date.now()
    })
  }

  /**
   * Get usage details for a transaction (useful for debugging)
   */
  public getTransactionUsage(transactionId: Hash, contentId: string): {
    readonly contentId: string
    readonly userAddress: Address
    readonly timestamp: number
  } | undefined {
    const cacheKey = `${transactionId}-${contentId}`
    return this.usedTransactions.get(cacheKey)
  }
}

// Global cache instance for tracking used transactions
const transactionCache = new TransactionVerificationCache()

/**
 * Payment Verification Configuration
 * 
 * This configuration object centralizes all the settings needed for payment
 * verification. It ensures that verification parameters are consistent across
 * all verification attempts and makes it easy to adjust security settings
 * as your platform evolves.
 */
interface PaymentVerificationConfig {
  /** Maximum age of a payment proof in milliseconds (prevents old proofs from being reused) */
  readonly maxProofAge: number
  
  /** Minimum confirmations required for a transaction to be considered valid */
  readonly requiredConfirmations: number
  
  /** Address where platform payments should be sent */
  readonly platformWalletAddress: Address
  
  /** USDC token contract address for the current network */
  readonly usdcTokenAddress: Address
  
  /** Whether to perform signature verification (if signatures are provided) */
  readonly requireSignatureVerification: boolean
}

/**
 * Get Payment Verification Configuration
 * 
 * This function creates the configuration object based on environment variables
 * and contract addresses. It ensures that all verification uses consistent
 * settings and provides a single place to manage security parameters.
 */
function getPaymentVerificationConfig(): PaymentVerificationConfig {
  const network = process.env.NETWORK as 'base' | 'base-sepolia'
  const chainId = network === 'base' ? base.id : baseSepolia.id
  
  // Get contract addresses for the current network
  const contractAddresses = getContractAddresses(chainId)
  
  // Platform wallet address should be set in environment variables
  const platformWalletAddress = process.env.RESOURCE_WALLET_ADDRESS as Address
  if (!platformWalletAddress) {
    throw new Error('RESOURCE_WALLET_ADDRESS environment variable is required for payment verification')
  }

  return {
    maxProofAge: 30 * 60 * 1000, // 30 minutes maximum age for payment proofs
    requiredConfirmations: 1, // Require at least 1 confirmation on Base (fast finality)
    platformWalletAddress,
    usdcTokenAddress: contractAddresses.USDC as Address,
    requireSignatureVerification: false // Signatures are optional in this implementation
  }
}

/**
 * Create Blockchain Client
 * 
 * This function creates a properly configured blockchain client for reading
 * transaction data and contract state. It uses the same network configuration
 * as your existing contract interactions to ensure consistency.
 */
function createBlockchainClient(): PublicClient {
  // Use the shared client that routes through Alchemy
  return getSharedPublicClient()
}

/**
 * Verify Transaction Details
 * 
 * This function performs the core blockchain verification by retrieving the
 * actual transaction from the blockchain and validating its properties. It
 * checks that the transaction exists, was successful, and contains the expected
 * payment details. This is the foundation of our security model because it
 * verifies that a real payment actually occurred on the blockchain.
 */
async function verifyTransactionDetails(
  client: PublicClient,
  paymentProof: PaymentProof,
  config: PaymentVerificationConfig
): Promise<{
  readonly isValid: boolean
  readonly transactionDetails?: PaymentVerificationResult['transactionDetails']
  readonly failureReason?: string
}> {
  try {
    // Retrieve the transaction from the blockchain
    const transaction = await client.getTransaction({
      hash: paymentProof.transactionId
    })

    if (!transaction) {
      return {
        isValid: false,
        failureReason: 'Transaction not found on blockchain'
      }
    }

    // Get the transaction receipt to check if it was successful
    const receipt = await client.getTransactionReceipt({
      hash: paymentProof.transactionId
    })

    if (!receipt) {
      return {
        isValid: false,
        failureReason: 'Transaction receipt not found'
      }
    }

    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return {
        isValid: false,
        failureReason: 'Transaction failed or was reverted'
      }
    }

    // Get current block number to check confirmations
    const currentBlock = await client.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber

    // Verify minimum confirmations
    if (confirmations < config.requiredConfirmations) {
      return {
        isValid: false,
        failureReason: `Transaction has ${confirmations} confirmations, requires ${config.requiredConfirmations}`
      }
    }

    // Verify the transaction sender matches the payment proof user address
    if (transaction.from.toLowerCase() !== paymentProof.userAddress.toLowerCase()) {
      return {
        isValid: false,
        failureReason: 'Transaction sender does not match payment proof user address'
      }
    }

    // Create transaction details for the response
    const transactionDetails: PaymentVerificationResult['transactionDetails'] = {
      blockNumber: receipt.blockNumber,
      from: transaction.from,
      to: transaction.to || '0x0000000000000000000000000000000000000000',
      value: transaction.value,
      gasUsed: receipt.gasUsed,
      status: receipt.status
    }

    return {
      isValid: true,
      transactionDetails
    }

  } catch (error) {
    console.error('Error verifying transaction details:', error)
    return {
      isValid: false,
      failureReason: `Failed to retrieve transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Verify USDC Transfer
 * 
 * This function specifically verifies that the transaction was a USDC transfer
 * to the correct recipient for the correct amount. It examines the transaction
 * logs to find the ERC20 Transfer event and validates all the transfer details.
 * This ensures that the payment was made in the correct token and for the
 * correct amount.
 */
async function verifyUSDCTransfer(
  client: PublicClient,
  paymentProof: PaymentProof,
  config: PaymentVerificationConfig
): Promise<{
  readonly isValid: boolean
  readonly verification: Partial<PaymentVerificationResult['verification']>
  readonly failureReason?: string
}> {
  try {
    // Get the transaction receipt to examine logs
    const receipt = await client.getTransactionReceipt({
      hash: paymentProof.transactionId
    })

    if (!receipt) {
      return {
        isValid: false,
        verification: {},
        failureReason: 'Cannot retrieve transaction receipt for USDC verification'
      }
    }

    // Look for USDC Transfer events in the transaction logs
    // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
    const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    
    const transferLogs = receipt.logs.filter(log => {
      // Use type guard to check if this is a valid ERC20 transfer log
      if (!isERC20TransferLog(log)) {
        return false
      }
      return log.topics[0] === transferEventSignature &&
        log.address.toLowerCase() === config.usdcTokenAddress.toLowerCase()
    })

    if (transferLogs.length === 0) {
      return {
        isValid: false,
        verification: {
          tokenCorrect: false
        },
        failureReason: 'No USDC Transfer event found in transaction'
      }
    }

    // Find the transfer log that matches our payment requirements
    const relevantTransfer = transferLogs.find(log => {
      // Type guard ensures log has the correct structure
      if (!isERC20TransferLog(log)) {
        return false
      }
      // Extract 'to' address from the second topic (indexed parameter)
      const toAddress = extractAddressFromTopic(log.topics[2])
      return toAddress.toLowerCase() === config.platformWalletAddress.toLowerCase()
    })

    if (!relevantTransfer) {
      return {
        isValid: false,
        verification: {
          tokenCorrect: true,
          recipientCorrect: false
        },
        failureReason: 'USDC transfer was not sent to the correct platform wallet'
      }
    }

    // Extract the transfer amount from the log data
    const transferAmount = BigInt(relevantTransfer.data)
    const expectedAmount = BigInt(paymentProof.amount)

    // Verify the transfer amount matches the payment proof
    const amountMatches = transferAmount >= expectedAmount

    if (!amountMatches) {
      return {
        isValid: false,
        verification: {
          tokenCorrect: true,
          recipientCorrect: true,
          amountMatches: false
        },
        failureReason: `Transfer amount ${transferAmount.toString()} is less than required ${expectedAmount.toString()}`
      }
    }

    return {
      isValid: true,
      verification: {
        tokenCorrect: true,
        recipientCorrect: true,
        amountMatches: true
      }
    }

  } catch (error) {
    console.error('Error verifying USDC transfer:', error)
    return {
      isValid: false,
      verification: {},
      failureReason: `Failed to verify USDC transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Main Payment Verification Function
 * 
 * This is the primary function that orchestrates the complete payment verification
 * process. It performs all necessary checks in a logical sequence, providing
 * detailed information about what passed and what failed. The function is designed
 * to be both secure and informative, helping with both fraud prevention and
 * debugging legitimate payment issues.
 */
export async function verifyWithExistingContracts(
  paymentProof: PaymentProof
): Promise<PaymentVerificationResult> {
  try {
    // Get verification configuration
    const config = getPaymentVerificationConfig()
    
    // Create blockchain client
    const client = createBlockchainClient()

    // Initialize verification result structure
    let verification: PaymentVerificationResult['verification'] = {
      transactionExists: false,
      amountMatches: false,
      recipientCorrect: false,
      tokenCorrect: false,
      notReplayAttack: false,
      timestampValid: false
    }

    // Step 1: Validate timestamp to prevent old payment proofs
    const proofAge = Date.now() - paymentProof.timestamp
    verification = {
      ...verification,
      timestampValid: proofAge <= config.maxProofAge
    }

    if (!verification.timestampValid) {
      return {
        isValid: false,
        verification,
        failureReason: `Payment proof is too old (${Math.round(proofAge / 1000)} seconds old, maximum ${config.maxProofAge / 1000} seconds allowed)`
      }
    }

    // Step 2: Check for replay attacks
    verification = {
      ...verification,
      notReplayAttack: !transactionCache.isTransactionUsed(
        paymentProof.transactionId, 
        paymentProof.contentId
      )
    }

    if (!verification.notReplayAttack) {
      const usage = transactionCache.getTransactionUsage(paymentProof.transactionId, paymentProof.contentId)
      return {
        isValid: false,
        verification,
        failureReason: `Transaction ${paymentProof.transactionId} has already been used for content ${paymentProof.contentId}${usage ? ` by ${usage.userAddress}` : ''}`
      }
    }

    // Step 3: Verify transaction exists and was successful
    const transactionVerification = await verifyTransactionDetails(client, paymentProof, config)
    verification = {
      ...verification,
      transactionExists: transactionVerification.isValid
    }

    if (!verification.transactionExists) {
      return {
        isValid: false,
        verification,
        failureReason: transactionVerification.failureReason
      }
    }

    // Step 4: Verify USDC transfer details
    const usdcVerification = await verifyUSDCTransfer(client, paymentProof, config)
    
    // Update verification status with USDC check results
    verification = {
      ...verification,
      ...usdcVerification.verification
    }

    if (!usdcVerification.isValid) {
      return {
        isValid: false,
        verification,
        failureReason: usdcVerification.failureReason,
        transactionDetails: transactionVerification.transactionDetails
      }
    }

    // Step 5: All verifications passed - mark transaction as used
    transactionCache.markTransactionUsed(
      paymentProof.transactionId,
      paymentProof.contentId,
      paymentProof.userAddress
    )

    // Return successful verification result
    return {
      isValid: true,
      verification,
      transactionDetails: transactionVerification.transactionDetails
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      isValid: false,
      verification: {
        transactionExists: false,
        amountMatches: false,
        recipientCorrect: false,
        tokenCorrect: false,
        notReplayAttack: false,
        timestampValid: false
      },
      failureReason: `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}