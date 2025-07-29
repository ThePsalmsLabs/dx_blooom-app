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
  // ===== CREATOR REGISTRATION & PROFILE MANAGEMENT =====
  {
    type: 'function',
    name: 'registerCreator',
    inputs: [
      { name: 'subscriptionPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'profileData', type: 'string', internalType: 'string' }
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
    name: 'updateProfileData',
    inputs: [
      { name: 'newProfileData', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'deactivateCreator',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CREATOR QUERY FUNCTIONS =====
  {
    type: 'function',
    name: 'isRegisteredCreator',
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
    name: 'isActive',
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
          { name: 'registrationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'profileData', type: 'string', internalType: 'string' },
          { name: 'isSuspended', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorWithActive',
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
          { name: 'registrationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'profileData', type: 'string', internalType: 'string' },
          { name: 'isSuspended', type: 'bool', internalType: 'bool' }
        ]
      },
      { name: 'active', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getSubscriptionPrice',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CREATOR EARNINGS MANAGEMENT =====
  {
    type: 'function',
    name: 'withdrawCreatorEarnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'addBonusEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateCreatorStats',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'earnings', type: 'uint256', internalType: 'uint256' },
      { name: 'contentDelta', type: 'int256', internalType: 'int256' },
      { name: 'subscriberDelta', type: 'int256', internalType: 'int256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getCreatorEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'pending', type: 'uint256', internalType: 'uint256' },
      { name: 'total', type: 'uint256', internalType: 'uint256' },
      { name: 'withdrawn', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorPendingEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorWithdrawnEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CREATOR VERIFICATION & MODERATION =====
  {
    type: 'function',
    name: 'setCreatorVerification',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'verified', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'suspendCreator',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'suspended', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM STATISTICS & DISCOVERY =====
  {
    type: 'function',
    name: 'getTotalCreators',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVerifiedCreatorCount',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorByIndex',
    inputs: [
      { name: 'index', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVerifiedCreatorByIndex',
    inputs: [
      { name: 'index', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPlatformStats',
    inputs: [],
    outputs: [
      { name: 'totalCreators', type: 'uint256', internalType: 'uint256' },
      { name: 'verifiedCount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalEarnings', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorEarnings', type: 'uint256', internalType: 'uint256' },
      { name: 'withdrawnAmount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== PLATFORM ADMINISTRATION =====
  {
    type: 'function',
    name: 'updatePlatformFee',
    inputs: [
      { name: 'newFee', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateFeeRecipient',
    inputs: [
      { name: 'newRecipient', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdrawPlatformFees',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'calculatePlatformFee',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ACCESS CONTROL & ROLE MANAGEMENT =====
  {
    type: 'function',
    name: 'grantPlatformRole',
    inputs: [
      { name: 'contractAddress', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokePlatformRole',
    inputs: [
      { name: 'contractAddress', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE & CONSTANTS =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== VIEW FUNCTIONS FOR CONTRACT INFO =====
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'feeRecipient',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'platformFee',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IERC20' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalCreatorEarnings',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPlatformEarnings',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalWithdrawnEarnings',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MODERATOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PLATFORM_CONTRACT_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MAX_SUBSCRIPTION_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MIN_SUBSCRIPTION_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'SUBSCRIPTION_DURATION',
    inputs: [],
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
      { name: 'subscriptionPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'profileData', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorEarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorEarningsUpdated',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'source', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorVerified',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'verified', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorSuspended',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'suspended', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionPriceUpdated',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ProfileDataUpdated',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldProfileData', type: 'string', indexed: false, internalType: 'string' },
      { name: 'newProfileData', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PlatformFeeUpdated',
    inputs: [
      { name: 'oldFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newFee', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PlatformFeesWithdrawn',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'FeeRecipientUpdated',
    inputs: [
      { name: 'oldRecipient', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newRecipient', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const

// ===== CONTENT REGISTRY CONTRACT ABI =====
// Handles content metadata, categorization, and access control

export const CONTENT_REGISTRY_ABI = [
  // ===== CONTENT REGISTRATION & MANAGEMENT =====
  {
    type: 'function',
    name: 'registerContent',
    inputs: [
      { name: 'ipfsHash', type: 'string', internalType: 'string' },
      { name: 'title', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'category', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' },
      { name: 'payPerViewPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'tags', type: 'string[]', internalType: 'string[]' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'isActive', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'deactivateContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CONTENT DISCOVERY & QUERYING =====
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
          { name: 'category', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' },
          { name: 'payPerViewPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'isActive', type: 'bool', internalType: 'bool' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
          { name: 'purchaseCount', type: 'uint256', internalType: 'uint256' },
          { name: 'tags', type: 'string[]', internalType: 'string[]' },
          { name: 'isReported', type: 'bool', internalType: 'bool' },
          { name: 'reportCount', type: 'uint256', internalType: 'uint256' }
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
  {
    type: 'function',
    name: 'getCreatorActiveContent',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== CATEGORY-BASED DISCOVERY =====
  {
    type: 'function',
    name: 'getContentByCategory',
    inputs: [
      { name: 'category', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getActiveContentByCategory',
    inputs: [
      { name: 'category', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'categoryCount',
    inputs: [
      { name: '', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'activeCategoryCount',
    inputs: [
      { name: '', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== TAG-BASED DISCOVERY =====
  {
    type: 'function',
    name: 'getContentByTag',
    inputs: [
      { name: 'tag', type: 'string', internalType: 'string' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== PURCHASE TRACKING =====
  {
    type: 'function',
    name: 'recordPurchase',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'buyer', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CONTENT REPORTING & MODERATION =====
  {
    type: 'function',
    name: 'reportContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getContentReports',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct ContentRegistry.ContentReport[]',
        components: [
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'reporter', type: 'address', internalType: 'address' },
          { name: 'reason', type: 'string', internalType: 'string' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'resolved', type: 'bool', internalType: 'bool' },
          { name: 'action', type: 'string', internalType: 'string' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'resolveReport',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reportIndex', type: 'uint256', internalType: 'uint256' },
      { name: 'action', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== AUTOMATED CONTENT MODERATION =====
  {
    type: 'function',
    name: 'banWord',
    inputs: [
      { name: 'word', type: 'string', internalType: 'string' },
      { name: 'isPhrase', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unbanWord',
    inputs: [
      { name: 'word', type: 'string', internalType: 'string' },
      { name: 'isPhrase', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'banPhrase',
    inputs: [
      { name: 'phrase', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateModerationSettings',
    inputs: [
      { name: 'newThreshold', type: 'uint256', internalType: 'uint256' },
      { name: 'newMaxReports', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM STATISTICS =====
  {
    type: 'function',
    name: 'getPlatformStats',
    inputs: [],
    outputs: [
      { name: 'totalContent', type: 'uint256', internalType: 'uint256' },
      { name: 'activeContent', type: 'uint256', internalType: 'uint256' },
      { name: 'categoryCounts', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'activeCategoryCounts', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalContentCount',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'activeContentCount',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE-BASED ACCESS CONTROL =====
  {
    type: 'function',
    name: 'grantPurchaseRecorderRole',
    inputs: [
      { name: 'contractAddress', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE MANAGEMENT =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },

  // ===== CONFIGURATION & CONSTANTS =====
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'nextContentId',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'nextReportId',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'autoModerateThreshold',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'maxReportsPerUser',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== PRICE CONSTRAINTS =====
  {
    type: 'function',
    name: 'MAX_PAY_PER_VIEW_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MIN_PAY_PER_VIEW_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MODERATOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PURCHASE_RECORDER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== STORAGE MAPPINGS (for advanced queries) =====
  {
    type: 'function',
    name: 'contents',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'ipfsHash', type: 'string', internalType: 'string' },
      { name: 'title', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'category', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' },
      { name: 'payPerViewPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'isActive', type: 'bool', internalType: 'bool' },
      { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
      { name: 'purchaseCount', type: 'uint256', internalType: 'uint256' },
      { name: 'isReported', type: 'bool', internalType: 'bool' },
      { name: 'reportCount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorContent',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'categoryContent',
    inputs: [
      { name: '', type: 'uint8', internalType: 'enum ISharedTypes.ContentCategory' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'tagContent',
    inputs: [
      { name: '', type: 'string', internalType: 'string' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'bannedWords',
    inputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'bannedPhrases',
    inputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasReported',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME UPDATES =====
  {
    type: 'event',
    name: 'ContentRegistered',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'ipfsHash', type: 'string', indexed: false, internalType: 'string' },
      { name: 'title', type: 'string', indexed: false, internalType: 'string' },
      { name: 'category', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.ContentCategory' },
      { name: 'payPerViewPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentUpdated',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'isActive', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentDeactivated',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
      { name: 'moderator', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentPurchased',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentReported',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'reporter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
      { name: 'reportId', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ReportResolved',
    inputs: [
      { name: 'reportId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'action', type: 'string', indexed: false, internalType: 'string' },
      { name: 'moderator', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'WordBanned',
    inputs: [
      { name: 'word', type: 'string', indexed: false, internalType: 'string' },
      { name: 'isPhrase', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'WordUnbanned',
    inputs: [
      { name: 'word', type: 'string', indexed: false, internalType: 'string' },
      { name: 'isPhrase', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const

// ===== PAY-PER-VIEW CONTRACT ABI =====
// Manages individual content purchases and access control

export const PAY_PER_VIEW_ABI = [
  // ===== PURCHASE INTENT SYSTEM =====
  {
    type: 'function',
    name: 'createPurchaseIntent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentMethod', type: 'uint8', internalType: 'enum PayPerView.PaymentMethod' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'completePurchase',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'success', type: 'bool', internalType: 'bool' },
      { name: 'failureReason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'recordExternalPurchase',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'buyer', type: 'address', internalType: 'address' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== DIRECT PURCHASE SYSTEM =====
  {
    type: 'function',
    name: 'purchaseContentDirect',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ACCESS CONTROL & VALIDATION =====
  {
    type: 'function',
    name: 'hasAccess',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'canPurchaseContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== PAYMENT OPTIONS & PRICING =====
  {
    type: 'function',
    name: 'getPaymentOptions',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'methods', type: 'uint8[]', internalType: 'enum PayPerView.PaymentMethod[]' },
      { name: 'prices', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== PURCHASE HISTORY & DETAILS =====
  {
    type: 'function',
    name: 'getPurchaseDetails',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PayPerView.PurchaseRecord',
        components: [
          { name: 'hasPurchased', type: 'bool', internalType: 'bool' },
          { name: 'purchasePrice', type: 'uint256', internalType: 'uint256' },
          { name: 'purchaseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
          { name: 'refundEligible', type: 'bool', internalType: 'bool' },
          { name: 'refundDeadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPurchases',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== REFUND MANAGEMENT SYSTEM =====
  {
    type: 'function',
    name: 'requestRefund',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefundPayout',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'handleExternalRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CREATOR EARNINGS MANAGEMENT =====
  {
    type: 'function',
    name: 'getCreatorEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'total', type: 'uint256', internalType: 'uint256' },
      { name: 'withdrawable', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawEarnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ROLE-BASED ACCESS CONTROL =====
  {
    type: 'function',
    name: 'grantPaymentProcessorRole',
    inputs: [
      { name: 'processor', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRefundManagerRole',
    inputs: [
      { name: 'manager', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== PLATFORM ANALYTICS & STATISTICS =====
  {
    type: 'function',
    name: 'totalVolume',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPurchases',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRefunds',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPlatformFees',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== USER ANALYTICS =====
  {
    type: 'function',
    name: 'userTotalSpent',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userNonces',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT CONFIGURATION =====
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'contentRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ContentRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'priceOracle',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract PriceOracle' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IERC20' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE MANAGEMENT =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SYSTEM CONSTANTS =====
  {
    type: 'function',
    name: 'PAYMENT_TIMEOUT',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'REFUND_WINDOW',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PAYMENT_PROCESSOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'REFUND_MANAGER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== STORAGE MAPPINGS (for advanced queries) =====
  {
    type: 'function',
    name: 'purchases',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'hasPurchased', type: 'bool', internalType: 'bool' },
      { name: 'purchasePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'purchaseTime', type: 'uint256', internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'refundEligible', type: 'bool', internalType: 'bool' },
      { name: 'refundDeadline', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingPurchases',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'usdcPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'isProcessed', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'failedPurchases',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'paidAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'failureTime', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'refunded', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawableEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingRefunds',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPurchases',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME UPDATES =====
  {
    type: 'event',
    name: 'ContentPurchaseInitiated',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentMethod', type: 'uint8', indexed: false, internalType: 'enum PayPerView.PaymentMethod' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'expectedPaymentAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentPurchaseCompleted',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'actualAmountPaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'DirectPurchaseCompleted',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'creatorEarning', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PurchaseFailed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalPurchaseRecorded',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalRefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorEarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const

// ===== SUBSCRIPTION MANAGER CONTRACT ABI =====
// Handles creator subscriptions and recurring access

export const SUBSCRIPTION_MANAGER_ABI = [
  // ===== CORE SUBSCRIPTION MANAGEMENT =====
  {
    type: 'function',
    name: 'subscribeToCreator',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'cancelSubscription',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'immediate', type: 'bool', internalType: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'recordSubscriptionPayment',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SUBSCRIPTION STATUS & QUERIES =====
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
    name: 'getSubscriptionStatus',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'isActive', type: 'bool', internalType: 'bool' },
      { name: 'inGracePeriod', type: 'bool', internalType: 'bool' },
      { name: 'endTime', type: 'uint256', internalType: 'uint256' },
      { name: 'gracePeriodEnd', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getSubscriptionDetails',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct SubscriptionManager.SubscriptionRecord',
        components: [
          { name: 'isActive', type: 'bool', internalType: 'bool' },
          { name: 'startTime', type: 'uint256', internalType: 'uint256' },
          { name: 'endTime', type: 'uint256', internalType: 'uint256' },
          { name: 'renewalCount', type: 'uint256', internalType: 'uint256' },
          { name: 'totalPaid', type: 'uint256', internalType: 'uint256' },
          { name: 'lastPayment', type: 'uint256', internalType: 'uint256' },
          { name: 'lastRenewalTime', type: 'uint256', internalType: 'uint256' },
          { name: 'autoRenewalEnabled', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getSubscriptionEndTime',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== AUTO-RENEWAL SYSTEM =====
  {
    type: 'function',
    name: 'configureAutoRenewal',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'enabled', type: 'bool', internalType: 'bool' },
      { name: 'maxPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'depositAmount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'executeAutoRenewal',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getAutoRenewalConfig',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct SubscriptionManager.AutoRenewal',
        components: [
          { name: 'enabled', type: 'bool', internalType: 'bool' },
          { name: 'maxPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          { name: 'lastRenewalAttempt', type: 'uint256', internalType: 'uint256' },
          { name: 'failedAttempts', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawAutoRenewalBalance',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateRenewalSettings',
    inputs: [
      { name: 'newMaxAttempts', type: 'uint256', internalType: 'uint256' },
      { name: 'newCooldown', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SUBSCRIPTION DISCOVERY & ANALYTICS =====
  {
    type: 'function',
    name: 'getUserSubscriptions',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserActiveSubscriptions',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorSubscribers',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorActiveSubscribers',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'view'
  },

  // ===== CREATOR EARNINGS MANAGEMENT =====
  {
    type: 'function',
    name: 'getCreatorSubscriptionEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'totalEarnings', type: 'uint256', internalType: 'uint256' },
      { name: 'withdrawableEarnings', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawSubscriptionEarnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SUBSCRIPTION CLEANUP & MAINTENANCE =====
  {
    type: 'function',
    name: 'cleanupExpiredSubscriptions',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'cleanupExpiredSubscriptionsEnhanced',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'cleanedUsers', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== REFUND MANAGEMENT SYSTEM =====
  {
    type: 'function',
    name: 'requestSubscriptionRefund',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefundPayout',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'handleExternalRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM ANALYTICS & METRICS =====
  {
    type: 'function',
    name: 'getPlatformSubscriptionMetrics',
    inputs: [],
    outputs: [
      { name: 'activeSubscriptions', type: 'uint256', internalType: 'uint256' },
      { name: 'totalVolume', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFees', type: 'uint256', internalType: 'uint256' },
      { name: 'totalRenewalCount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalRefundAmount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalActiveSubscriptions',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSubscriptionVolume',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRenewals',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRefunds',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== PLATFORM FEE MANAGEMENT =====
  {
    type: 'function',
    name: 'totalPlatformSubscriptionFees',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawPlatformSubscriptionFees',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ROLE-BASED ACCESS CONTROL =====
  {
    type: 'function',
    name: 'grantSubscriptionProcessorRole',
    inputs: [
      { name: 'processor', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRenewalBotRole',
    inputs: [
      { name: 'bot', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT CONFIGURATION =====
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'contentRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ContentRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IERC20' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE MANAGEMENT =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SYSTEM CONSTANTS & CONFIGURATION =====
  {
    type: 'function',
    name: 'SUBSCRIPTION_DURATION',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'GRACE_PERIOD',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'RENEWAL_WINDOW',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'CLEANUP_INTERVAL',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'renewalCooldown',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'maxRenewalAttemptsPerDay',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'SUBSCRIPTION_PROCESSOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'RENEWAL_BOT_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== STORAGE MAPPINGS (for advanced queries) =====
  {
    type: 'function',
    name: 'subscriptions',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'isActive', type: 'bool', internalType: 'bool' },
      { name: 'startTime', type: 'uint256', internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', internalType: 'uint256' },
      { name: 'renewalCount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'lastPayment', type: 'uint256', internalType: 'uint256' },
      { name: 'lastRenewalTime', type: 'uint256', internalType: 'uint256' },
      { name: 'autoRenewalEnabled', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'autoRenewals',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'enabled', type: 'bool', internalType: 'bool' },
      { name: 'maxPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'lastRenewalAttempt', type: 'uint256', internalType: 'uint256' },
      { name: 'failedAttempts', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'failedSubscriptions',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'attemptTime', type: 'uint256', internalType: 'uint256' },
      { name: 'attemptedPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'failureReason', type: 'string', internalType: 'string' },
      { name: 'refunded', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorSubscriberCount',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorSubscribers',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorSubscriptionEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userSubscriptions',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userSubscriptionSpending',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingRefunds',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'subscriptionEndTime',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'lastCleanupTime',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSubscriptionRevenue',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME UPDATES =====
  {
    type: 'event',
    name: 'Subscribed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'creatorEarning', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'startTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionRenewed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newEndTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'renewalCount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionCancelled',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'endTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'immediate', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionExpired',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'AutoRenewalConfigured',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'enabled', type: 'bool', indexed: false, internalType: 'bool' },
      { name: 'maxPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'depositAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'AutoRenewalExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newEndTime', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'AutoRenewalFailed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
      { name: 'attemptTime', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionRefunded',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalSubscriptionRecorded',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'usdcAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalRefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'refundAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExpiredSubscriptionsCleaned',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'cleanedCount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionEarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const

// ===== COMMERCE PROTOCOL INTEGRATION ABI =====
// Handles advanced payment flows through Base Commerce Protocol

export const COMMERCE_PROTOCOL_INTEGRATION_ABI = [
  // ===== PAYMENT INTENT CREATION & MANAGEMENT =====
  {
    type: 'function',
    name: 'createPaymentIntent',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PlatformPaymentRequest',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct ICommercePaymentsProtocol.TransferIntent',
        components: [
          { name: 'recipientAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'recipient', type: 'address', internalType: 'address payable' },
          { name: 'recipientCurrency', type: 'address', internalType: 'address' },
          { name: 'refundDestination', type: 'address', internalType: 'address' },
          { name: 'feeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'id', type: 'bytes16', internalType: 'bytes16' },
          { name: 'operator', type: 'address', internalType: 'address' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
          { name: 'prefix', type: 'bytes', internalType: 'bytes' },
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'token', type: 'address', internalType: 'address' }
        ]
      },
      {
        name: 'context',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PaymentContext',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'processed', type: 'bool', internalType: 'bool' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getPaymentInfo',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PlatformPaymentRequest',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [
      { name: 'totalAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== PAYMENT EXECUTION & PROCESSING =====
  {
    type: 'function',
    name: 'executePaymentWithSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct ICommercePaymentsProtocol.TransferIntent',
        components: [
          { name: 'recipientAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'recipient', type: 'address', internalType: 'address payable' },
          { name: 'recipientCurrency', type: 'address', internalType: 'address' },
          { name: 'refundDestination', type: 'address', internalType: 'address' },
          { name: 'feeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'id', type: 'bytes16', internalType: 'bytes16' },
          { name: 'operator', type: 'address', internalType: 'address' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
          { name: 'prefix', type: 'bytes', internalType: 'bytes' },
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'token', type: 'address', internalType: 'address' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processCompletedPayment',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'success', type: 'bool', internalType: 'bool' },
      { name: 'failureReason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SIGNATURE MANAGEMENT SYSTEM =====
  {
    type: 'function',
    name: 'provideIntentSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getIntentSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes', internalType: 'bytes' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'addAuthorizedSigner',
    inputs: [
      { name: 'signer', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'removeAuthorizedSigner',
    inputs: [
      { name: 'signer', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PAYMENT CONTEXT & STATUS QUERIES =====
  {
    type: 'function',
    name: 'getPaymentContext',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PaymentContext',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'processed', type: 'bool', internalType: 'bool' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasActiveIntent',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentReadyForExecution',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== REFUND MANAGEMENT SYSTEM =====
  {
    type: 'function',
    name: 'requestRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefundWithCoordination',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== OPERATOR MANAGEMENT & CONFIGURATION =====
  {
    type: 'function',
    name: 'registerAsOperator',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateOperatorFeeRate',
    inputs: [
      { name: 'newRate', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateOperatorFeeDestination',
    inputs: [
      { name: 'newDestination', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateOperatorSigner',
    inputs: [
      { name: 'newSigner', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdrawOperatorFees',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM INTEGRATION MANAGEMENT =====
  {
    type: 'function',
    name: 'setPayPerView',
    inputs: [
      { name: '_payPerView', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setSubscriptionManager',
    inputs: [
      { name: '_subscriptionManager', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ANALYTICS & METRICS =====
  {
    type: 'function',
    name: 'getOperatorMetrics',
    inputs: [],
    outputs: [
      { name: 'intentsCreated', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentsProcessed', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFees', type: 'uint256', internalType: 'uint256' },
      { name: 'refunds', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalIntentsCreated',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPaymentsProcessed',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalOperatorFees',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRefundsProcessed',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE-BASED ACCESS CONTROL =====
  {
    type: 'function',
    name: 'grantPaymentMonitorRole',
    inputs: [
      { name: 'monitor', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT CONFIGURATION & REFERENCES =====
  {
    type: 'function',
    name: 'commerceProtocol',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ICommercePaymentsProtocol' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'contentRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ContentRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'payPerView',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract PayPerView' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'subscriptionManager',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract SubscriptionManager' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'priceOracle',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract PriceOracle' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IERC20' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE MANAGEMENT =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== EIP-712 DOMAIN MANAGEMENT =====
  {
    type: 'function',
    name: 'eip712Domain',
    inputs: [],
    outputs: [
      { name: 'fields', type: 'bytes1', internalType: 'bytes1' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'version', type: 'string', internalType: 'string' },
      { name: 'chainId', type: 'uint256', internalType: 'uint256' },
      { name: 'verifyingContract', type: 'address', internalType: 'address' },
      { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
      { name: 'extensions', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== CONFIGURATION CONSTANTS & SETTINGS =====
  {
    type: 'function',
    name: 'operatorFeeDestination',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operatorFeeRate',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operatorSigner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PAYMENT_MONITOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'SIGNER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== STORAGE MAPPINGS (for advanced queries) =====
  {
    type: 'function',
    name: 'authorizedSigners',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'paymentContexts',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'processed', type: 'bool', internalType: 'bool' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentSignatures',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes', internalType: 'bytes' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentHashes',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentDeadlines',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'processedIntents',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'refundRequests',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'originalIntentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'requestTime', type: 'uint256', internalType: 'uint256' },
      { name: 'processed', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingRefunds',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userNonces',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME UPDATES =====
  {
    type: 'event',
    name: 'PaymentIntentCreated',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentReadyForSigning',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'intentHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentSigned',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', indexed: false, internalType: 'bytes' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentReadyForExecution',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', indexed: false, internalType: 'bytes' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentFinalized',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PaymentCompleted',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'contentId', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'success', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentAccessGranted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionAccessGranted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RefundRequested',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentAuditRecord',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'creatorAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'createdAt', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OperatorFeeUpdated',
    inputs: [
      { name: 'oldRate', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newRate', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OperatorFeeDestinationUpdated',
    inputs: [
      { name: 'oldDestination', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newDestination', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SignerUpdated',
    inputs: [
      { name: 'oldSigner', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newSigner', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContractAddressUpdated',
    inputs: [
      { name: 'contractName', type: 'string', indexed: false, internalType: 'string' },
      { name: 'oldAddress', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newAddress', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'EIP712DomainChanged',
    inputs: [],
    anonymous: false
  }
] as const

// ===== PRICE ORACLE CONTRACT ABI =====
// Provides real-time price feeds for token conversions

export const PRICE_ORACLE_ABI = [
  // ===== CORE PRICE QUERY FUNCTIONS =====
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
    name: 'getPriceWithAge',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'lastUpdated', type: 'uint256', internalType: 'uint256' },
      { name: 'isStale', type: 'bool', internalType: 'bool' }
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
  },
  {
    type: 'function',
    name: 'convertFromUSDC',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'convertWithSlippage',
    inputs: [
      { name: 'fromToken', type: 'address', internalType: 'address' },
      { name: 'toToken', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'convertedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'actualSlippage', type: 'uint256', internalType: 'uint256' },
      { name: 'withinTolerance', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== BATCH PRICE OPERATIONS =====
  {
    type: 'function',
    name: 'getBatchPrices',
    inputs: [
      { name: 'tokens', type: 'address[]', internalType: 'address[]' }
    ],
    outputs: [
      { name: 'prices', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'lastUpdated', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'convertBatchToUSDC',
    inputs: [
      { name: 'tokens', type: 'address[]', internalType: 'address[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [
      { name: 'usdcAmounts', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== PRICE FEED MANAGEMENT =====
  {
    type: 'function',
    name: 'addPriceFeed',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'priceFeed', type: 'address', internalType: 'address' },
      { name: 'decimals', type: 'uint8', internalType: 'uint8' },
      { name: 'description', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updatePriceFeed',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'newPriceFeed', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'removePriceFeed',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'enableToken',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'disableToken',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PRICE FEED CONFIGURATION =====
  {
    type: 'function',
    name: 'setPriceStalenessTolerance',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'maxAge', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setPriceDeviationThreshold',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'threshold', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setEmergencyPrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'emergencyPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'validUntil', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PRICE VALIDATION & CIRCUIT BREAKERS =====
  {
    type: 'function',
    name: 'validatePriceUpdate',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'newPrice', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'isValid', type: 'bool', internalType: 'bool' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'triggerCircuitBreaker',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'resetCircuitBreaker',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isCircuitBreakerTriggered',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== HISTORICAL PRICE DATA =====
  {
    type: 'function',
    name: 'getHistoricalPrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'available', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPriceRange',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'fromTime', type: 'uint256', internalType: 'uint256' },
      { name: 'toTime', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'minPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'maxPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'avgPrice', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTimeWeightedAveragePrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'period', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'twap', type: 'uint256', internalType: 'uint256' },
      { name: 'confidence', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== AGGREGATION & MULTI-SOURCE PRICING =====
  {
    type: 'function',
    name: 'addAggregationSource',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'source', type: 'address', internalType: 'address' },
      { name: 'weight', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'removeAggregationSource',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'source', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateSourceWeight',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'source', type: 'address', internalType: 'address' },
      { name: 'newWeight', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getAggregatedPrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'aggregatedPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'sourcesUsed', type: 'uint256', internalType: 'uint256' },
      { name: 'confidence', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== TOKEN & FEED INFORMATION =====
  {
    type: 'function',
    name: 'getSupportedTokens',
    inputs: [],
    outputs: [
      { name: '', type: 'address[]', internalType: 'address[]' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTokenInfo',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PriceOracle.TokenInfo',
        components: [
          { name: 'isSupported', type: 'bool', internalType: 'bool' },
          { name: 'isEnabled', type: 'bool', internalType: 'bool' },
          { name: 'decimals', type: 'uint8', internalType: 'uint8' },
          { name: 'priceFeed', type: 'address', internalType: 'address' },
          { name: 'lastUpdated', type: 'uint256', internalType: 'uint256' },
          { name: 'staleTolerance', type: 'uint256', internalType: 'uint256' },
          { name: 'deviationThreshold', type: 'uint256', internalType: 'uint256' },
          { name: 'description', type: 'string', internalType: 'string' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getFeedInfo',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PriceOracle.FeedInfo',
        components: [
          { name: 'feedAddress', type: 'address', internalType: 'address' },
          { name: 'lastPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'lastUpdated', type: 'uint256', internalType: 'uint256' },
          { name: 'updateCount', type: 'uint256', internalType: 'uint256' },
          { name: 'isHealthy', type: 'bool', internalType: 'bool' },
          { name: 'circuitBreakerActive', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },

  // ===== ORACLE HEALTH & MONITORING =====
  {
    type: 'function',
    name: 'getOracleHealth',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'isHealthy', type: 'bool', internalType: 'bool' },
      { name: 'lastHeartbeat', type: 'uint256', internalType: 'uint256' },
      { name: 'consecutiveFailures', type: 'uint256', internalType: 'uint256' },
      { name: 'healthScore', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPlatformHealthMetrics',
    inputs: [],
    outputs: [
      { name: 'totalFeeds', type: 'uint256', internalType: 'uint256' },
      { name: 'healthyFeeds', type: 'uint256', internalType: 'uint256' },
      { name: 'staleFeeds', type: 'uint256', internalType: 'uint256' },
      { name: 'circuitBreakersActive', type: 'uint256', internalType: 'uint256' },
      { name: 'averageUpdateFrequency', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'performHealthCheck',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'passed', type: 'bool', internalType: 'bool' },
      { name: 'issues', type: 'string[]', internalType: 'string[]' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== MANUAL PRICE UPDATES (Emergency Use) =====
  {
    type: 'function',
    name: 'forceUpdatePrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'refreshPrice',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'newPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'updated', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'refreshBatchPrices',
    inputs: [
      { name: 'tokens', type: 'address[]', internalType: 'address[]' }
    ],
    outputs: [
      { name: 'updatedCount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== ROLE-BASED ACCESS CONTROL =====
  {
    type: 'function',
    name: 'grantFeedManagerRole',
    inputs: [
      { name: 'manager', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantPriceUpdaterRole',
    inputs: [
      { name: 'updater', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantEmergencyRole',
    inputs: [
      { name: 'emergency', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT STATE MANAGEMENT =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SYSTEM CONSTANTS & CONFIGURATION =====
  {
    type: 'function',
    name: 'DEFAULT_STALE_TOLERANCE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'DEFAULT_DEVIATION_THRESHOLD',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MAX_PRICE_AGE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PRICE_DECIMALS',
    inputs: [],
    outputs: [
      { name: '', type: 'uint8', internalType: 'uint8' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'FEED_MANAGER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PRICE_UPDATER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'EMERGENCY_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== STORAGE MAPPINGS (for advanced queries) =====
  {
    type: 'function',
    name: 'tokenFeeds',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'feedAddress', type: 'address', internalType: 'address' },
      { name: 'isEnabled', type: 'bool', internalType: 'bool' },
      { name: 'decimals', type: 'uint8', internalType: 'uint8' },
      { name: 'staleTolerance', type: 'uint256', internalType: 'uint256' },
      { name: 'deviationThreshold', type: 'uint256', internalType: 'uint256' },
      { name: 'lastPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'lastUpdated', type: 'uint256', internalType: 'uint256' },
      { name: 'updateCount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'circuitBreakers',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'isTriggered', type: 'bool', internalType: 'bool' },
      { name: 'triggerTime', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'emergencyPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'emergencyPriceValidUntil', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'priceHistory',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'price', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'source', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'aggregationSources',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'source', type: 'address', internalType: 'address' },
      { name: 'weight', type: 'uint256', internalType: 'uint256' },
      { name: 'isActive', type: 'bool', internalType: 'bool' },
      { name: 'lastPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'lastUpdated', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== EVENTS FOR REAL-TIME MONITORING =====
  {
    type: 'event',
    name: 'PriceUpdated',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'source', type: 'address', indexed: false, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PriceFeedAdded',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'priceFeed', type: 'address', indexed: true, internalType: 'address' },
      { name: 'decimals', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'description', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PriceFeedUpdated',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldFeed', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newFeed', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PriceFeedRemoved',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'priceFeed', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'TokenEnabled',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'TokenDisabled',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CircuitBreakerTriggered',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
      { name: 'triggerPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'emergencyPrice', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CircuitBreakerReset',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'resetBy', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'EmergencyPriceSet',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'emergencyPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'validUntil', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'setBy', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PriceForceUpdated',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'updatedBy', type: 'address', indexed: false, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'AggregationSourceAdded',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'source', type: 'address', indexed: true, internalType: 'address' },
      { name: 'weight', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'AggregationSourceRemoved',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'source', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SourceWeightUpdated',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'source', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldWeight', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newWeight', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PriceDeviationDetected',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'expectedPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'actualPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'deviationPercent', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'StalePriceDetected',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'lastUpdated', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'currentTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'maxAge', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'HealthCheckFailed',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'issues', type: 'string[]', indexed: false, internalType: 'string[]' }
    ],
    anonymous: false
  },

  // ===== STANDARD CONTRACT EVENTS =====
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const

// ===== STANDARD ERC20 ABI SUBSET =====
// For interacting with USDC and other tokens

export const ERC20_ABI = [
  // ===== TOKEN METADATA FUNCTIONS =====
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [
      { name: '', type: 'uint8', internalType: 'uint8' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== BALANCE & SUPPLY QUERIES =====
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

  // ===== TRANSFER FUNCTIONS =====
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== APPROVAL SYSTEM =====
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
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

  // ===== STANDARD ERC20 EVENTS =====
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // ===== MODERN ERC20 CUSTOM ERRORS =====
  {
    type: 'error',
    name: 'ERC20InsufficientBalance',
    inputs: [
      { name: 'sender', type: 'address', internalType: 'address' },
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InsufficientAllowance',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'allowance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidSender',
    inputs: [
      { name: 'sender', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidReceiver',
    inputs: [
      { name: 'receiver', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidApprover',
    inputs: [
      { name: 'approver', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidSpender',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' }
    ]
  }
] as const