/**
 * Content Registry Contract ABI
 */

export const CONTENT_REGISTRY_ABI = [
  // ===== CONSTRUCTOR =====
  {
    type: 'constructor',
    inputs: [
      { name: '_creatorRegistry', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
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

  // ===== PRICING CONSTANTS =====
  {
    type: 'function',
    name: 'MIN_PAY_PER_VIEW_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MAX_PAY_PER_VIEW_PRICE',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT REFERENCES =====
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },

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
    name: 'getContentByTag',
    inputs: [
      { name: 'tag', type: 'string', internalType: 'string' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
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
  {
    type: 'function',
    name: 'nextContentId',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== PURCHASE RECORDING =====
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
    name: 'resolveReport',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reportIndex', type: 'uint256', internalType: 'uint256' },
      { name: 'action', type: 'string', internalType: 'string' }
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
    name: 'updateModerationSettings',
    inputs: [
      { name: 'newThreshold', type: 'uint256', internalType: 'uint256' },
      { name: 'newMaxReports', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
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
  {
    type: 'function',
    name: 'nextReportId',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== WORD & PHRASE BANNING =====
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
    name: 'banPhrase',
    inputs: [
      { name: 'phrase', type: 'string', internalType: 'string' }
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
    name: 'bannedPhrasesList',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },

  // ===== ROLE MANAGEMENT =====
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
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'callerConfirmation', type: 'address', internalType: 'address' }
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
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'grantPurchaseRecorderRole',
    inputs: [
      { name: 'contractAddress', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== STATE MAPPINGS =====
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
    name: 'contentPurchasers',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'contentReports',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reporter', type: 'address', internalType: 'address' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'resolved', type: 'bool', internalType: 'bool' },
      { name: 'action', type: 'string', internalType: 'string' }
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
  {
    type: 'function',
    name: 'userDailyReports',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== INTERFACE SUPPORT =====
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [
      { name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== OWNERSHIP & ACCESS CONTROL =====
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
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [
      { name: 'newOwner', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PAUSE FUNCTIONALITY =====
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

  // ===== EVENTS =====
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
    name: 'RoleAdminChanged',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'previousAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' }
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

  // ===== CUSTOM ERRORS =====
  {
    type: 'error',
    name: 'AccessControlBadConfirmation',
    inputs: []
  },
  {
    type: 'error',
    name: 'AccessControlUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'neededRole', type: 'bytes32', internalType: 'bytes32' }
    ]
  },
  {
    type: 'error',
    name: 'AlreadyReported',
    inputs: []
  },
  {
    type: 'error',
    name: 'BannedWordDetected',
    inputs: [
      { name: 'word', type: 'string', internalType: 'string' }
    ]
  },
  {
    type: 'error',
    name: 'ContentAlreadyExists',
    inputs: []
  },
  {
    type: 'error',
    name: 'ContentNotActive',
    inputs: []
  },
  {
    type: 'error',
    name: 'CreatorNotRegistered',
    inputs: []
  },
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: []
  },
  {
    type: 'error',
    name: 'ExpectedPause',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidContentId',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidIPFSHash',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidPrice',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidReportReason',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidStringLength',
    inputs: []
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: []
  },
  {
    type: 'error',
    name: 'ReportNotFound',
    inputs: []
  },
  {
    type: 'error',
    name: 'TooManyReports',
    inputs: []
  },
  {
    type: 'error',
    name: 'UnauthorizedCreator',
    inputs: []
  }
] as const