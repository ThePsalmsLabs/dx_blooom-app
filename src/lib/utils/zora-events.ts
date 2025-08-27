/**
 * Zora Event Parsing Utilities
 * 
 * This module provides strict TypeScript implementations for parsing
 * Zora protocol events with proper validation and error handling.
 */

import { type Address, type Hash, type Log, type TransactionReceipt } from 'viem'

// ===== EVENT SIGNATURES =====

import { keccak256, toHex } from 'viem'

/**
 * Zora Event Signatures
 * These are the keccak256 hashes of the actual Zora V3 event signatures
 */
export const ZORA_EVENT_SIGNATURES = {
  // SetupNewContract(address indexed newContract, address indexed creator, string contractURI, string name)
  SETUP_NEW_CONTRACT: keccak256(
    toHex('SetupNewContract(address,address,string,string)')
  ),
  // UpdatedToken(address indexed sender, uint256 indexed tokenId, tuple tokenData)
  UPDATED_TOKEN: keccak256(
    toHex('UpdatedToken(address,uint256,(string,uint256,uint256))')
  ),
  // Purchased(address indexed sender, address indexed minterModule, uint256 indexed tokenId, uint256 quantity, uint256 value)
  PURCHASED: keccak256(
    toHex('Purchased(address,address,uint256,uint256,uint256)')
  ),
  // Minted(address indexed minter, uint256 indexed tokenId, uint256 quantity, uint256 value)
  MINTED: keccak256(
    toHex('Minted(address,uint256,uint256,uint256)')
  )
} as const

// ===== EVENT TYPES =====

/**
 * SetupNewContract Event Data
 */
export interface SetupNewContractEvent {
  readonly eventName: 'SetupNewContract'
  readonly contractAddress: Address
  readonly creator: Address
  readonly contractURI: string
  readonly name: string
  readonly defaultAdmin: Address
  readonly blockNumber: bigint
  readonly transactionHash: Hash
  readonly logIndex: number
}

/**
 * UpdatedToken Event Data
 */
export interface UpdatedTokenEvent {
  readonly eventName: 'UpdatedToken'
  readonly contractAddress: Address
  readonly tokenId: bigint
  readonly sender: Address
  readonly tokenData: {
    readonly uri: string
    readonly maxSupply: bigint
    readonly totalMinted: bigint
  }
  readonly blockNumber: bigint
  readonly transactionHash: Hash
  readonly logIndex: number
}

/**
 * Purchased Event Data
 */
export interface PurchasedEvent {
  readonly eventName: 'Purchased'
  readonly contractAddress: Address
  readonly tokenId: bigint
  readonly sender: Address
  readonly minterModule: Address
  readonly quantity: bigint
  readonly value: bigint
  readonly blockNumber: bigint
  readonly transactionHash: Hash
  readonly logIndex: number
}

/**
 * Minted Event Data
 */
export interface MintedEvent {
  readonly eventName: 'Minted'
  readonly contractAddress: Address
  readonly tokenId: bigint
  readonly minter: Address
  readonly quantity: bigint
  readonly value: bigint
  readonly blockNumber: bigint
  readonly transactionHash: Hash
  readonly logIndex: number
}

/**
 * Union type for all Zora events
 */
export type ZoraEvent = SetupNewContractEvent | UpdatedTokenEvent | PurchasedEvent | MintedEvent

// ===== EVENT PARSING FUNCTIONS =====

/**
 * Parse SetupNewContract event from transaction receipt
 */
export function parseSetupNewContractEvent(
  receipt: TransactionReceipt,
  factoryAddress: Address
): SetupNewContractEvent[] {
  const events: SetupNewContractEvent[] = []

  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== factoryAddress.toLowerCase()) continue
      if (!log.topics[0] || log.topics[0] !== ZORA_EVENT_SIGNATURES.SETUP_NEW_CONTRACT) continue

      // Parse event data
      const eventData = parseSetupNewContractLog(log, receipt.blockNumber, receipt.transactionHash)
      if (eventData) {
        events.push(eventData)
      }
    } catch (error) {
      console.error('Failed to parse SetupNewContract event:', error)
    }
  }

  return events
}

/**
 * Parse UpdatedToken event from transaction receipt
 */
export function parseUpdatedTokenEvent(
  receipt: TransactionReceipt,
  contractAddress: Address
): UpdatedTokenEvent[] {
  const events: UpdatedTokenEvent[] = []

  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue
      if (!log.topics[0] || log.topics[0] !== ZORA_EVENT_SIGNATURES.UPDATED_TOKEN) continue

      // Parse event data
      const eventData = parseUpdatedTokenLog(log, receipt.blockNumber, receipt.transactionHash)
      if (eventData) {
        events.push(eventData)
      }
    } catch (error) {
      console.error('Failed to parse UpdatedToken event:', error)
    }
  }

  return events
}

/**
 * Parse Purchased event from transaction receipt
 */
export function parsePurchasedEvent(
  receipt: TransactionReceipt,
  contractAddress: Address
): PurchasedEvent[] {
  const events: PurchasedEvent[] = []

  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue
      if (!log.topics[0] || log.topics[0] !== ZORA_EVENT_SIGNATURES.PURCHASED) continue

      // Parse event data
      const eventData = parsePurchasedLog(log, receipt.blockNumber, receipt.transactionHash)
      if (eventData) {
        events.push(eventData)
      }
    } catch (error) {
      console.error('Failed to parse Purchased event:', error)
    }
  }

  return events
}

/**
 * Parse Minted event from transaction receipt
 */
export function parseMintedEvent(
  receipt: TransactionReceipt,
  contractAddress: Address
): MintedEvent[] {
  const events: MintedEvent[] = []

  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue
      if (!log.topics[0] || log.topics[0] !== ZORA_EVENT_SIGNATURES.MINTED) continue

      // Parse event data
      const eventData = parseMintedLog(log, receipt.blockNumber, receipt.transactionHash)
      if (eventData) {
        events.push(eventData)
      }
    } catch (error) {
      console.error('Failed to parse Minted event:', error)
    }
  }

  return events
}

// ===== INTERNAL PARSING FUNCTIONS =====

/**
 * Parse SetupNewContract log data
 */
function parseSetupNewContractLog(
  log: Log,
  blockNumber: bigint,
  transactionHash: Hash
): SetupNewContractEvent | null {
  try {
    // Validate topics
    if (log.topics.length < 4) {
      console.warn('SetupNewContract event has insufficient topics')
      return null
    }

    // Parse indexed parameters
    const creator = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const contractAddress = `0x${log.topics[2]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const defaultAdmin = `0x${log.topics[3]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('SetupNewContract event has no data')
      return null
    }

    // TODO: Decode contractURI and name from data
    // For now, use placeholders
    const contractURI = '' // Would be decoded from data
    const name = '' // Would be decoded from data

    return {
      eventName: 'SetupNewContract',
      contractAddress,
      creator,
      contractURI,
      name,
      defaultAdmin,
      blockNumber,
      transactionHash,
      logIndex: log.logIndex || 0
    }
  } catch (error) {
    console.error('Failed to parse SetupNewContract log:', error)
    return null
  }
}

/**
 * Parse UpdatedToken log data
 */
function parseUpdatedTokenLog(
  log: Log,
  blockNumber: bigint,
  transactionHash: Hash
): UpdatedTokenEvent | null {
  try {
    // Validate topics
    if (log.topics.length < 3) {
      console.warn('UpdatedToken event has insufficient topics')
      return null
    }

    // Parse indexed parameters
    const sender = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[2] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('UpdatedToken event has no data')
      return null
    }

    // TODO: Decode tokenData from data
    // For now, use placeholders
    const tokenData = {
      uri: '', // Would be decoded from data
      maxSupply: BigInt(0), // Would be decoded from data
      totalMinted: BigInt(0) // Would be decoded from data
    }

    return {
      eventName: 'UpdatedToken',
      contractAddress: log.address || '0x0000000000000000000000000000000000000000' as Address,
      tokenId,
      sender,
      tokenData,
      blockNumber,
      transactionHash,
      logIndex: log.logIndex || 0
    }
  } catch (error) {
    console.error('Failed to parse UpdatedToken log:', error)
    return null
  }
}

/**
 * Parse Purchased log data
 */
function parsePurchasedLog(
  log: Log,
  blockNumber: bigint,
  transactionHash: Hash
): PurchasedEvent | null {
  try {
    // Validate topics
    if (log.topics.length < 4) {
      console.warn('Purchased event has insufficient topics')
      return null
    }

    // Parse indexed parameters
    const sender = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const minterModule = `0x${log.topics[2]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[3] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('Purchased event has no data')
      return null
    }

    // TODO: Decode quantity and value from data
    // For now, use placeholders
    const quantity = BigInt(0) // Would be decoded from data
    const value = BigInt(0) // Would be decoded from data

    return {
      eventName: 'Purchased',
      contractAddress: log.address || '0x0000000000000000000000000000000000000000' as Address,
      tokenId,
      sender,
      minterModule,
      quantity,
      value,
      blockNumber,
      transactionHash,
      logIndex: log.logIndex || 0
    }
  } catch (error) {
    console.error('Failed to parse Purchased log:', error)
    return null
  }
}

/**
 * Parse Minted log data
 */
function parseMintedLog(
  log: Log,
  blockNumber: bigint,
  transactionHash: Hash
): MintedEvent | null {
  try {
    // Validate topics
    if (log.topics.length < 3) {
      console.warn('Minted event has insufficient topics')
      return null
    }

    // Parse indexed parameters
    const minter = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[2] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('Minted event has no data')
      return null
    }

    // TODO: Decode quantity and value from data
    // For now, use placeholders
    const quantity = BigInt(0) // Would be decoded from data
    const value = BigInt(0) // Would be decoded from data

    return {
      eventName: 'Minted',
      contractAddress: log.address || '0x0000000000000000000000000000000000000000' as Address,
      tokenId,
      minter,
      quantity,
      value,
      blockNumber,
      transactionHash,
      logIndex: log.logIndex || 0
    }
  } catch (error) {
    console.error('Failed to parse Minted log:', error)
    return null
  }
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate event signature
 */
export function validateEventSignature(
  topic: string,
  expectedSignature: string
): boolean {
  return topic.toLowerCase() === expectedSignature.toLowerCase()
}

/**
 * Validate address format
 */
export function validateAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate event log structure
 */
export function validateEventLog(log: Log): boolean {
  return (
    log.address !== undefined &&
    log.topics !== undefined &&
    log.topics.length > 0 &&
    log.data !== undefined
  )
}

// ===== UTILITY FUNCTIONS =====

/**
 * Extract contract address from SetupNewContract event
 */
export function extractContractAddressFromSetupEvent(
  receipt: TransactionReceipt,
  factoryAddress: Address
): Address | null {
  const events = parseSetupNewContractEvent(receipt, factoryAddress)
  return events.length > 0 ? events[0].contractAddress : null
}

/**
 * Extract token ID from UpdatedToken event
 */
export function extractTokenIdFromUpdatedEvent(
  receipt: TransactionReceipt,
  contractAddress: Address
): bigint | null {
  const events = parseUpdatedTokenEvent(receipt, contractAddress)
  return events.length > 0 ? events[0].tokenId : null
}

/**
 * Get all Zora events from transaction receipt
 */
export function getAllZoraEvents(
  receipt: TransactionReceipt,
  factoryAddress: Address,
  contractAddress: Address
): ZoraEvent[] {
  const setupEvents = parseSetupNewContractEvent(receipt, factoryAddress)
  const updatedEvents = parseUpdatedTokenEvent(receipt, contractAddress)
  const purchasedEvents = parsePurchasedEvent(receipt, contractAddress)
  const mintedEvents = parseMintedEvent(receipt, contractAddress)

  return [
    ...setupEvents,
    ...updatedEvents,
    ...purchasedEvents,
    ...mintedEvents
  ]
}

/**
 * Filter events by type
 */
export function filterEventsByType<T extends ZoraEvent['eventName']>(
  events: ZoraEvent[],
  eventName: T
): Extract<ZoraEvent, { eventName: T }>[] {
  return events.filter(event => event.eventName === eventName) as Extract<ZoraEvent, { eventName: T }>[]
}
