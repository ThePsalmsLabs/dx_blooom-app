/**
 * Contract ABI Definitions - Smart Contract Interface Layer
 * File: src/lib/contracts/abi.ts
 * 
 * This file contains the Application Binary Interface (ABI) definitions for all
 * deployed smart contracts. Think of ABIs as the translation layer between your
 * TypeScript frontend and your Solidity smart contracts - they define exactly
 * how to call contract functions and interpret their responses.
 * 
 * Each ABI array contains the function signatures, event definitions, and data
 * structures that wagmi uses to generate type-safe contract interactions.
 * These definitions must match exactly with your deployed contracts or calls will fail.
 * 
 * Architecture Notes:
 * - ABIs are generated from compiled Solidity contracts
 * - Each function includes inputs, outputs, and state mutability
 * - Events include indexed parameters for efficient filtering
 * - Error definitions enable proper error handling in the frontend
 */

// ===== CREATOR REGISTRY CONTRACT ABI =====
// Manages creator registration, profiles, subscription pricing, and earnings

export const CREATOR_REGISTRY_ABI = [
  // ===== CREATOR MANAGEMENT FUNCTIONS =====
  {
    type: 'function',
    name: 'registerCreator',
    inputs: [
      { name: 'subscriptionPrice', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function', 
    name: 'updateSubscriptionPrice',
    inputs: [
      { name: 'newPrice', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isCreatorRegistered', 
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorProfile',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { 
        name: '', 
        type: 'tuple', 
        internalType: 'struct CreatorRegistry.Creator',
        components: [
          { name: 'isRegistered', type: 'bool', internalType: 'bool' },
          { name: 'subscriptionPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'isVerified', type: 'bool', internalType: 'bool' },
          { name: 'totalEarnings', type: 'uint256', internalType: 'uint256' },
          { name: 'contentCount', type: 'uint256', internalType: 'uint256' },
          { name: 'subscriberCount', type: 'uint256', internalType: 'uint256' },
          { name: 'registrationTime', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },

  // ===== EARNINGS MANAGEMENT =====
  {
    type: 'function',
    name: 'withdrawEarnings',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'creatorPendingEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME UPDATES =====
  {
    type: 'event',
    name: 'CreatorRegistered',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'subscriptionPrice', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'EarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  }
] as const

// ===== CONTENT REGISTRY CONTRACT ABI =====
// Handles content metadata, categorization, and access control

export const CONTENT_REGISTRY_ABI = [
  // ===== CONTENT MANAGEMENT =====
  {
    type: 'function',
    name: 'registerContent',
    inputs: [
      { name: 'ipfsHash', type: 'string', internalType: 'string' },
      { name: 'title', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'category', type: 'uint8', internalType: 'enum ContentRegistry.ContentCategory' },
      { name: 'payPerViewPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'tags', type: 'string[]', internalType: 'string[]' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct ContentRegistry.Content',
        components: [
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'ipfsHash', type: 'string', internalType: 'string' },
          { name: 'title', type: 'string', internalType: 'string' },
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'category', type: 'uint8', internalType: 'enum ContentRegistry.ContentCategory' },
          { name: 'payPerViewPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isActive', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getActiveContentPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'contentIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'total', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorContent',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTENT EVENTS =====
  {
    type: 'event',
    name: 'ContentRegistered',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'title', type: 'string', indexed: false, internalType: 'string' },
      { name: 'category', type: 'uint8', indexed: true, internalType: 'enum ContentRegistry.ContentCategory' }
    ],
    anonymous: false
  }
] as const

// ===== PAY-PER-VIEW CONTRACT ABI =====
// Manages individual content purchases and access control

export const PAY_PER_VIEW_ABI = [
  // ===== PURCHASE FUNCTIONS =====
  {
    type: 'function',
    name: 'purchaseContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasPaid',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasAccess',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== PURCHASE EVENTS =====
  {
    type: 'event',
    name: 'ContentPurchased',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  }
] as const

// ===== SUBSCRIPTION MANAGER CONTRACT ABI =====
// Handles creator subscriptions and recurring access

export const SUBSCRIPTION_MANAGER_ABI = [
  // ===== SUBSCRIPTION FUNCTIONS =====
  {
    type: 'function',
    name: 'subscribe',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isSubscribed',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getSubscriptionExpiry',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== SUBSCRIPTION EVENTS =====
  {
    type: 'event',
    name: 'Subscribed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'expiryTime', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  }
] as const

// ===== COMMERCE PROTOCOL INTEGRATION ABI =====
// Handles advanced payment flows through Base Commerce Protocol

export const COMMERCE_PROTOCOL_INTEGRATION_ABI = [
  // ===== COMMERCE PAYMENT FUNCTIONS =====
  {
    type: 'function',
    name: 'processPayment',
    inputs: [
      { name: 'transferIntent', type: 'bytes', internalType: 'bytes' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'purchaseContentWithIntent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'transferIntent', type: 'bytes', internalType: 'bytes' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== COMMERCE EVENTS =====
  {
    type: 'event',
    name: 'CommercePaymentProcessed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'intentId', type: 'bytes32', indexed: true, internalType: 'bytes32' }
    ],
    anonymous: false
  }
] as const

// ===== PRICE ORACLE CONTRACT ABI =====
// Provides real-time price feeds for token conversions

export const PRICE_ORACLE_ABI = [
  // ===== PRICE FUNCTIONS =====
  {
    type: 'function',
    name: 'getPrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'convertToUSDC',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  }
] as const

// ===== STANDARD ERC20 ABI SUBSET =====
// For interacting with USDC and other tokens

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  }
] as const