/**
 * Zora Event Parsing Utilities - PRODUCTION ENHANCED
 * 
 * This module provides strict TypeScript implementations for parsing
 * Zora protocol events with proper validation and error handling.
 * 
 * ENHANCEMENTS FROM PRODUCTION VERSION:
 * - Custom error handling with ZoraEventParsingError class
 * - Enhanced validation functions for event integrity
 * - Safe parsing with error recovery capabilities
 * - Multiple parsing strategies (manual and decodeEventLog)
 * - Comprehensive error logging and recovery
 * - Type-safe event filtering and validation
 * 
 * USAGE:
 * - Use parseSetupNewContractEvent() for collection creation events
 * - Use parseUpdatedTokenEvent() for token setup events
 * - Use safeParseZoraEvents() for production-safe parsing
 * - Use parseZoraEventsWithDecodeEventLog() for maximum reliability
 */

import { 
  type Address, 
  type Hash, 
  type Log, 
  type TransactionReceipt, 
  decodeAbiParameters, 
  parseAbiParameters,
  decodeEventLog
} from 'viem'

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

// ===== ABI PARAMETERS FOR DECODING =====

/**
 * ABI parameters for decoding event data
 */
const EVENT_ABI_PARAMETERS = {
  // SetupNewContract(address indexed newContract, address indexed creator, string contractURI, string name)
  SETUP_NEW_CONTRACT: parseAbiParameters('string contractURI, string name'),
  
  // UpdatedToken(address indexed sender, uint256 indexed tokenId, tuple tokenData)
  UPDATED_TOKEN: parseAbiParameters('(string uri, uint256 maxSupply, uint256 totalMinted)'),
  
  // Purchased(address indexed sender, address indexed minterModule, uint256 indexed tokenId, uint256 quantity, uint256 value)
  PURCHASED: parseAbiParameters('uint256 quantity, uint256 value'),
  
  // Minted(address indexed minter, uint256 indexed tokenId, uint256 quantity, uint256 value)
  MINTED: parseAbiParameters('uint256 quantity, uint256 value')
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

/**
 * Processed Zora Event for Analytics
 * 
 * Enhanced event data with additional analytics metadata
 * used for dashboard and reporting purposes
 */
export interface ProcessedZoraEvent {
  readonly originalEvent: ZoraEvent
  readonly processedAt: Date
  readonly analytics: {
    readonly eventType: ZoraEvent['eventName']
    readonly contractAddress: Address
    readonly timestamp: Date
    readonly blockNumber: bigint
    readonly transactionHash: Hash
    readonly gasUsed?: bigint
    readonly gasPrice?: bigint
    readonly totalValue?: bigint
    readonly uniqueParticipants?: number
    readonly eventCount?: number
  }
  readonly metadata: {
    readonly source: 'zora_protocol'
    readonly version: 'v3'
    readonly network: string
    readonly processedBy: string
    readonly processingTime: number
    readonly validationStatus: 'valid' | 'warning' | 'error'
    readonly validationErrors?: string[]
  }
}

/**
 * Bulk Event Processing Result
 */
export interface BulkEventProcessingResult {
  readonly processedEvents: ProcessedZoraEvent[]
  readonly summary: {
    readonly totalEvents: number
    readonly validEvents: number
    readonly invalidEvents: number
    readonly processingTime: number
    readonly eventsByType: Record<ZoraEvent['eventName'], number>
    readonly totalValue: bigint
    readonly uniqueContracts: Address[]
    readonly uniqueParticipants: Address[]
  }
  readonly errors: ZoraEventParsingError[]
  readonly warnings: string[]
}

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
      // Continue processing other logs instead of failing completely
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
    if (log.topics.length < 3) {
      console.warn('SetupNewContract event has insufficient topics')
      return null
    }

    // Parse indexed parameters from topics
    // SetupNewContract(address indexed newContract, address indexed creator, string contractURI, string name)
    const newContract = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const creator = `0x${log.topics[2]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('SetupNewContract event has no data')
      return null
    }

    // Decode contractURI and name from data
    const decodedData = decodeAbiParameters(EVENT_ABI_PARAMETERS.SETUP_NEW_CONTRACT, data)
    const [contractURI, name] = decodedData

    return {
      eventName: 'SetupNewContract',
      contractAddress: newContract,
      creator,
      contractURI,
      name,
      defaultAdmin: creator, // In Zora V3, creator is typically the default admin
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

    // Parse indexed parameters from topics
    // UpdatedToken(address indexed sender, uint256 indexed tokenId, tuple tokenData)
    const sender = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[2] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('UpdatedToken event has no data')
      return null
    }

    // Decode tokenData from data
    const decodedData = decodeAbiParameters(EVENT_ABI_PARAMETERS.UPDATED_TOKEN, data)
    const [tokenDataTuple] = decodedData
    const tokenData = {
      uri: tokenDataTuple.uri,
      maxSupply: tokenDataTuple.maxSupply,
      totalMinted: tokenDataTuple.totalMinted
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

    // Parse indexed parameters from topics
    // Purchased(address indexed sender, address indexed minterModule, uint256 indexed tokenId, uint256 quantity, uint256 value)
    const sender = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const minterModule = `0x${log.topics[2]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[3] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('Purchased event has no data')
      return null
    }

    // Decode quantity and value from data
    const decodedData = decodeAbiParameters(EVENT_ABI_PARAMETERS.PURCHASED, data)
    const [quantity, value] = decodedData

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

    // Parse indexed parameters from topics
    // Minted(address indexed minter, uint256 indexed tokenId, uint256 quantity, uint256 value)
    const minter = `0x${log.topics[1]?.slice(26) || '0000000000000000000000000000000000000000'}` as Address
    const tokenId = BigInt(log.topics[2] || '0')

    // Parse non-indexed parameters from data
    const data = log.data
    if (!data || data === '0x') {
      console.warn('Minted event has no data')
      return null
    }

    // Decode quantity and value from data
    const decodedData = decodeAbiParameters(EVENT_ABI_PARAMETERS.MINTED, data)
    const [quantity, value] = decodedData

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

// ===== ERROR HANDLING =====

/**
 * Custom error class for Zora event parsing errors
 */
export class ZoraEventParsingError extends Error {
  constructor(
    message: string,
    public readonly log: Log,
    public readonly originalError?: Error
  ) {
    super(`Zora event parsing failed: ${message}`)
    this.name = 'ZoraEventParsingError'
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

/**
 * Validate Zora event integrity
 */
export function validateZoraEvent(event: ZoraEvent): boolean {
  return (
    event.contractAddress !== '0x0000000000000000000000000000000000000000' &&
    event.transactionHash.length === 66 &&
    event.blockNumber > BigInt(0) &&
    event.logIndex >= 0
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

/**
 * Safe event parsing with error recovery
 */
export function safeParseZoraEvents(
  receipt: TransactionReceipt,
  factoryAddress: Address,
  contractAddresses: Address[] = []
): { events: ZoraEvent[]; errors: ZoraEventParsingError[] } {
  const events: ZoraEvent[] = []
  const errors: ZoraEventParsingError[] = []

  try {
    const parsedEvents = getAllZoraEvents(receipt, factoryAddress, contractAddresses[0] || '0x0000000000000000000000000000000000000000' as Address)
    
    for (const event of parsedEvents) {
      if (validateZoraEvent(event)) {
        events.push(event)
      } else {
        errors.push(new ZoraEventParsingError('Invalid event structure', {} as Log))
      }
    }
  } catch (error) {
    errors.push(new ZoraEventParsingError(
      'Failed to parse events',
      {} as Log,
      error instanceof Error ? error : new Error('Unknown error')
    ))
  }

  return { events, errors }
}

/**
 * Enhanced event parsing using decodeEventLog for better reliability
 */
export function parseZoraEventsWithDecodeEventLog(
  receipt: TransactionReceipt,
  factoryAddress: Address,
  contractAddress: Address
): { events: ZoraEvent[]; errors: ZoraEventParsingError[] } {
  const events: ZoraEvent[] = []
  const errors: ZoraEventParsingError[] = []

  // Define the ABI items for each event
  const setupNewContractAbi = {
    type: 'event',
    name: 'SetupNewContract',
    inputs: [
      { type: 'address', name: 'newContract', indexed: true },
      { type: 'address', name: 'creator', indexed: true },
      { type: 'string', name: 'contractURI', indexed: false },
      { type: 'string', name: 'name', indexed: false }
    ]
  } as const

  const updatedTokenAbi = {
    type: 'event',
    name: 'UpdatedToken',
    inputs: [
      { type: 'address', name: 'sender', indexed: true },
      { type: 'uint256', name: 'tokenId', indexed: true },
      { 
        type: 'tuple', 
        name: 'tokenData', 
        indexed: false,
        components: [
          { type: 'string', name: 'uri' },
          { type: 'uint256', name: 'maxSupply' },
          { type: 'uint256', name: 'totalMinted' }
        ]
      }
    ]
  } as const

  for (const log of receipt.logs) {
    try {
      // Try to decode as SetupNewContract event
      if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: [setupNewContractAbi],
            data: log.data,
            topics: log.topics
          })
          
          if (decoded.eventName === 'SetupNewContract') {
            events.push({
              eventName: 'SetupNewContract',
              contractAddress: decoded.args.newContract,
              creator: decoded.args.creator,
              contractURI: decoded.args.contractURI,
              name: decoded.args.name,
              defaultAdmin: decoded.args.creator, // Creator is typically the default admin
              blockNumber: receipt.blockNumber,
              transactionHash: receipt.transactionHash,
              logIndex: log.logIndex || 0
            })
            continue
          }
        } catch (decodeError) {
          // Not a SetupNewContract event, continue to next check
        }
      }

      // Try to decode as UpdatedToken event
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: [updatedTokenAbi],
            data: log.data,
            topics: log.topics
          })
          
          if (decoded.eventName === 'UpdatedToken') {
            events.push({
              eventName: 'UpdatedToken',
              contractAddress: log.address as Address,
              tokenId: decoded.args.tokenId,
              sender: decoded.args.sender,
              tokenData: {
                uri: decoded.args.tokenData.uri,
                maxSupply: decoded.args.tokenData.maxSupply,
                totalMinted: decoded.args.tokenData.totalMinted
              },
              blockNumber: receipt.blockNumber,
              transactionHash: receipt.transactionHash,
              logIndex: log.logIndex || 0
            })
            continue
          }
        } catch (decodeError) {
          // Not an UpdatedToken event, continue to next check
        }
      }

    } catch (error) {
      errors.push(new ZoraEventParsingError(
        'Failed to decode event log',
        log,
        error instanceof Error ? error : new Error('Unknown error')
      ))
    }
  }

  return { events, errors }
}

/**
 * Bulk event processing for dashboard analytics
 * 
 * Processes multiple events in batch for efficient analytics processing
 * and provides comprehensive summary statistics
 */
export function processBulkZoraEvents(
  events: Log[],
  eventTypes: string[],
  options: {
    factoryAddress?: Address
    contractAddresses?: Address[]
    network?: string
    includeGasData?: boolean
    validateEvents?: boolean
  } = {}
): BulkEventProcessingResult {
  const startTime = Date.now()
  const processedEvents: ProcessedZoraEvent[] = []
  const errors: ZoraEventParsingError[] = []
  const warnings: string[] = []
  
  // Track analytics data
  const eventsByType: Record<ZoraEvent['eventName'], number> = {
    SetupNewContract: 0,
    UpdatedToken: 0,
    Purchased: 0,
    Minted: 0
  }
  
  const uniqueContracts = new Set<Address>()
  const uniqueParticipants = new Set<Address>()
  let totalValue = BigInt(0)
  let validEvents = 0
  let invalidEvents = 0

  // Process each event
  for (const log of events) {
    const eventStartTime = Date.now()
    
    try {
      // Validate event log structure
      if (!validateEventLog(log)) {
        invalidEvents++
        warnings.push(`Invalid event log structure at index ${log.logIndex}`)
        continue
      }

      // Check if event type is requested
      const eventSignature = log.topics[0]
      if (!eventSignature) {
        invalidEvents++
        continue
      }

      // Determine event type and parse accordingly
      let parsedEvent: ZoraEvent | null = null
      let validationStatus: 'valid' | 'warning' | 'error' = 'valid'
      const validationErrors: string[] = []

      // Parse SetupNewContract events
      if (eventSignature === ZORA_EVENT_SIGNATURES.SETUP_NEW_CONTRACT) {
        if (eventTypes.includes('SetupNewContract') && options.factoryAddress) {
          parsedEvent = parseSetupNewContractLog(log, BigInt(0), '0x' as Hash)
          if (parsedEvent) {
            uniqueContracts.add(parsedEvent.contractAddress)
            uniqueParticipants.add(parsedEvent.creator)
            eventsByType.SetupNewContract++
          }
        }
      }
      
      // Parse UpdatedToken events
      else if (eventSignature === ZORA_EVENT_SIGNATURES.UPDATED_TOKEN) {
        if (eventTypes.includes('UpdatedToken') && options.contractAddresses?.length) {
          for (const contractAddress of options.contractAddresses) {
            if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
              parsedEvent = parseUpdatedTokenLog(log, BigInt(0), '0x' as Hash)
              if (parsedEvent) {
                uniqueContracts.add(parsedEvent.contractAddress)
                uniqueParticipants.add(parsedEvent.sender)
                eventsByType.UpdatedToken++
                break
              }
            }
          }
        }
      }
      
      // Parse Purchased events
      else if (eventSignature === ZORA_EVENT_SIGNATURES.PURCHASED) {
        if (eventTypes.includes('Purchased') && options.contractAddresses?.length) {
          for (const contractAddress of options.contractAddresses) {
            if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
              parsedEvent = parsePurchasedLog(log, BigInt(0), '0x' as Hash)
              if (parsedEvent) {
                uniqueContracts.add(parsedEvent.contractAddress)
                uniqueParticipants.add(parsedEvent.sender)
                totalValue += parsedEvent.value
                eventsByType.Purchased++
                break
              }
            }
          }
        }
      }
      
      // Parse Minted events
      else if (eventSignature === ZORA_EVENT_SIGNATURES.MINTED) {
        if (eventTypes.includes('Minted') && options.contractAddresses?.length) {
          for (const contractAddress of options.contractAddresses) {
            if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
              parsedEvent = parseMintedLog(log, BigInt(0), '0x' as Hash)
              if (parsedEvent) {
                uniqueContracts.add(parsedEvent.contractAddress)
                uniqueParticipants.add(parsedEvent.minter)
                totalValue += parsedEvent.value
                eventsByType.Minted++
                break
              }
            }
          }
        }
      }

      // Validate parsed event
      if (parsedEvent && options.validateEvents) {
        if (!validateZoraEvent(parsedEvent)) {
          validationStatus = 'error'
          validationErrors.push('Event validation failed')
          invalidEvents++
        } else {
          validEvents++
        }
      } else if (parsedEvent) {
        validEvents++
      }

      // Create processed event if parsing was successful
      if (parsedEvent) {
        const processingTime = Date.now() - eventStartTime
        
        const processedEvent: ProcessedZoraEvent = {
          originalEvent: parsedEvent,
          processedAt: new Date(),
          analytics: {
            eventType: parsedEvent.eventName,
            contractAddress: parsedEvent.contractAddress,
            timestamp: new Date(), // In production, this would come from block timestamp
            blockNumber: parsedEvent.blockNumber,
            transactionHash: parsedEvent.transactionHash,
            totalValue: 'value' in parsedEvent ? parsedEvent.value : undefined,
            uniqueParticipants: 1, // Simplified - would be calculated across all events
            eventCount: 1
          },
          metadata: {
            source: 'zora_protocol',
            version: 'v3',
            network: options.network || 'unknown',
            processedBy: 'zora-events-processor',
            processingTime,
            validationStatus,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined
          }
        }

        processedEvents.push(processedEvent)
      }

    } catch (error) {
      invalidEvents++
      const parsingError = new ZoraEventParsingError(
        'Failed to process event in bulk',
        log,
        error instanceof Error ? error : new Error('Unknown error')
      )
      errors.push(parsingError)
    }
  }

  const totalProcessingTime = Date.now() - startTime

  return {
    processedEvents,
    summary: {
      totalEvents: events.length,
      validEvents,
      invalidEvents,
      processingTime: totalProcessingTime,
      eventsByType,
      totalValue,
      uniqueContracts: Array.from(uniqueContracts),
      uniqueParticipants: Array.from(uniqueParticipants)
    },
    errors,
    warnings
  }
}

/**
 * Enhanced bulk processing with transaction receipt context
 * 
 * Processes events from multiple transaction receipts with full context
 */
export function processBulkZoraEventsFromReceipts(
  receipts: TransactionReceipt[],
  eventTypes: string[],
  options: {
    factoryAddress?: Address
    contractAddresses?: Address[]
    network?: string
    includeGasData?: boolean
    validateEvents?: boolean
  } = {}
): BulkEventProcessingResult {
  // Extract all logs from receipts
  const allLogs: Log[] = []
  
  for (const receipt of receipts) {
    allLogs.push(...receipt.logs)
  }

  // Process all logs
  const result = processBulkZoraEvents(allLogs, eventTypes, options)

  // Enhance with receipt-specific data if available
  if (options.includeGasData) {
    const enhancedProcessedEvents = result.processedEvents.map(processedEvent => {
      const receipt = receipts.find(r => r.transactionHash === processedEvent.originalEvent.transactionHash)
      if (receipt) {
        return {
          ...processedEvent,
          analytics: {
            ...processedEvent.analytics,
            gasUsed: receipt.gasUsed,
            gasPrice: receipt.effectiveGasPrice
          }
        }
      }
      return processedEvent
    })

    return {
      ...result,
      processedEvents: enhancedProcessedEvents
    }
  }

  return result
}

/**
 * Real-time event processing for live dashboard updates
 * 
 * Processes events as they come in for real-time analytics
 */
export function processRealtimeZoraEvents(
  newEvents: Log[],
  previousState: BulkEventProcessingResult,
  eventTypes: string[],
  options: {
    factoryAddress?: Address
    contractAddresses?: Address[]
    network?: string
    maxEventsToKeep?: number
  } = {}
): BulkEventProcessingResult {
  // Process new events
  const newResult = processBulkZoraEvents(newEvents, eventTypes, options)

  // Merge with previous state
  const mergedEvents = [
    ...previousState.processedEvents,
    ...newResult.processedEvents
  ]

  // Limit events if specified
  const maxEvents = options.maxEventsToKeep || 1000
  const limitedEvents = mergedEvents.slice(-maxEvents)

  // Recalculate summary
  const eventsByType: Record<ZoraEvent['eventName'], number> = {
    SetupNewContract: 0,
    UpdatedToken: 0,
    Purchased: 0,
    Minted: 0
  }

  const uniqueContracts = new Set<Address>()
  const uniqueParticipants = new Set<Address>()
  let totalValue = BigInt(0)

  for (const event of limitedEvents) {
    const originalEvent = event.originalEvent
    eventsByType[originalEvent.eventName]++
    uniqueContracts.add(originalEvent.contractAddress)
    
    if ('sender' in originalEvent) {
      uniqueParticipants.add(originalEvent.sender)
    }
    if ('minter' in originalEvent) {
      uniqueParticipants.add(originalEvent.minter)
    }
    if ('creator' in originalEvent) {
      uniqueParticipants.add(originalEvent.creator)
    }
    
    if ('value' in originalEvent) {
      totalValue += originalEvent.value
    }
  }

  return {
    processedEvents: limitedEvents,
    summary: {
      totalEvents: limitedEvents.length,
      validEvents: limitedEvents.length,
      invalidEvents: 0,
      processingTime: newResult.summary.processingTime,
      eventsByType,
      totalValue,
      uniqueContracts: Array.from(uniqueContracts),
      uniqueParticipants: Array.from(uniqueParticipants)
    },
    errors: [...previousState.errors, ...newResult.errors],
    warnings: [...previousState.warnings, ...newResult.warnings]
  }
}
