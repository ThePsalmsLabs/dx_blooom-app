/**
 * Creator Registry Contract ABI
 */

export const CREATOR_REGISTRY_ABI = [
  // ===== CONSTRUCTOR =====
  {
    type: 'constructor',
    inputs: [
      { name: '_feeRecipient', type: 'address', internalType: 'address' },
      { name: '_usdcToken', type: 'address', internalType: 'address' }
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
    name: 'PLATFORM_CONTRACT_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== PRICING CONSTANTS =====
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
    name: 'MAX_SUBSCRIPTION_PRICE',
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

  // ===== CONTRACT REFERENCES =====
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
    name: 'feeRecipient',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },

  // ===== CREATOR REGISTRATION & MANAGEMENT =====
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

  // ===== CREATOR DISCOVERY & QUERYING =====
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
    name: 'getSubscriptionPrice',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CREATOR LISTINGS =====
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
    name: 'getVerifiedCreatorCount',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
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

  // ===== EARNINGS MANAGEMENT =====
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

  // ===== PLATFORM FEE MANAGEMENT =====
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

  // ===== PLATFORM STATISTICS =====
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

  // ===== STATE MAPPINGS =====
  {
    type: 'function',
    name: 'creators',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'isRegistered', type: 'bool', internalType: 'bool' },
      { name: 'subscriptionPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'isVerified', type: 'bool', internalType: 'bool' },
      { name: 'totalEarnings', type: 'uint256', internalType: 'uint256' },
      { name: 'contentCount', type: 'uint256', internalType: 'uint256' },
      { name: 'subscriberCount', type: 'uint256', internalType: 'uint256' },
      { name: 'registrationTime', type: 'uint256', internalType: 'uint256' },
      { name: 'profileData', type: 'string', internalType: 'string' },
      { name: 'isSuspended', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allCreators',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'verifiedCreators',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorJoinDate',
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

  // ===== EMERGENCY FUNCTIONS =====
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

  // ===== EVENTS =====
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
    name: 'PlatformFeeUpdated',
    inputs: [
      { name: 'oldFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newFee', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'CreatorAlreadyRegistered',
    inputs: []
  },
  {
    type: 'error',
    name: 'CreatorNotFound',
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
    name: 'InvalidFeePercentage',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidFeeRecipient',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidProfileData',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSubscriptionPrice',
    inputs: []
  },
  {
    type: 'error',
    name: 'NoEarningsToWithdraw',
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
    name: 'SafeERC20FailedOperation',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'UnauthorizedAccess',
    inputs: []
  }
] as const