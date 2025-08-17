/**
 * Intent ID Extraction Utilities
 * 
 * This module provides robust utilities for extracting intent IDs from 
 * transaction logs, handling the complex parsing of EVM event data.
 */

import { Log, keccak256, toHex } from 'viem'

// PaymentIntentCreated event signature - matches CommerceProtocolIntegration.sol
const PAYMENT_INTENT_CREATED_SIGNATURE = keccak256(toHex('PaymentIntentCreated(bytes16,address,address,uint8,uint256,uint256,uint256,uint256,address,uint256)'))

export interface IntentExtractionResult {
  intentId: string
  userAddress: string
  paymentToken: string
  expectedAmount: bigint
  deadline: bigint
  success: boolean
  error?: string
}

export function extractIntentIdFromLogs(logs: Log[]): IntentExtractionResult | null {
  for (const log of logs) {
    try {
      // Check if this log matches the PaymentIntentCreated event
      if (log.topics[0] === PAYMENT_INTENT_CREATED_SIGNATURE) {
        // Parse the event data according to CommerceProtocolIntegration contract
        // Indexed parameters: intentId, user, creator
        const intentId = log.topics[1] // bytes16 intentId
        const userAddress = `0x${log.topics[2]?.slice(26) || ''}` // address user (remove padding)
        const _creatorAddress = `0x${log.topics[3]?.slice(26) || ''}` // address creator (remove padding)
        
        // Decode non-indexed parameters from log.data
        // Parameters: paymentType, totalAmount, creatorAmount, platformFee, operatorFee, paymentToken, expectedAmount
        const dataHex = log.data.slice(2) // Remove '0x' prefix
        
        // Each parameter is 32 bytes (64 hex chars)
        const _paymentType = parseInt(dataHex.slice(0, 64), 16) // uint8 paymentType
        const _totalAmount = BigInt('0x' + dataHex.slice(64, 128)) // uint256 totalAmount
        const _creatorAmount = BigInt('0x' + dataHex.slice(128, 192)) // uint256 creatorAmount
        const _platformFee = BigInt('0x' + dataHex.slice(192, 256)) // uint256 platformFee
        const _operatorFee = BigInt('0x' + dataHex.slice(256, 320)) // uint256 operatorFee
        const paymentToken = `0x${dataHex.slice(344, 384)}` // address paymentToken (remove padding)
        const expectedAmount = BigInt('0x' + dataHex.slice(384, 448)) // uint256 expectedAmount
        
        return {
          intentId: intentId || '',
          userAddress,
          paymentToken,
          expectedAmount,
          deadline: BigInt(0), // Not in event, would need to query contract
          success: true
        }
      }
    } catch (error) {
      console.error('Error parsing log:', error)
    }
  }
  
  return {
    intentId: '',
    userAddress: '',
    paymentToken: '',
    expectedAmount: BigInt(0),
    deadline: BigInt(0),
    success: false,
    error: 'PaymentIntentCreated event not found in transaction logs'
  }
}

export function validateIntentId(intentId: string): boolean {
  // Intent IDs should be 16-byte hex strings (32 characters + 0x prefix)
  const hexPattern = /^0x[a-fA-F0-9]{32}$/
  return hexPattern.test(intentId)
}