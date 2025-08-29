/**
 * Subscription Manager Contract ABI
 */

export const SUBSCRIPTION_MANAGER_ABI = [
  // ===== CONSTRUCTOR =====
  {
    type: 'constructor',
    inputs: [
      { name: '_creatorRegistry', type: 'address', internalType: 'address' },
      { name: '_contentRegistry', type: 'address', internalType: 'address' },
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

  // ===== SYSTEM CONSTANTS =====
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

  // ===== SUBSCRIPTION MANAGEMENT =====
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
    name: 'subscribeToCreatorWithPermit',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'v', type: 'uint8', internalType: 'uint8' },
      { name: 'r', type: 'bytes32', internalType: 'bytes32' },
      { name: 's', type: 'bytes32', internalType: 'bytes32' }
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

  // ===== SUBSCRIPTION STATUS & DETAILS =====
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

  // ===== USER SUBSCRIPTION MANAGEMENT =====
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

  // ===== CREATOR SUBSCRIBER MANAGEMENT =====
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
  {
    type: 'function',
    name: 'maxRenewalAttemptsPerDay',
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

  // ===== SUBSCRIPTION CLEANUP =====
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

  // ===== REFUND MANAGEMENT =====
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

  // ===== CREATOR EARNINGS =====
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
  {
    type: 'function',
    name: 'withdrawPlatformSubscriptionFees',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM STATISTICS =====
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
    name: 'totalPlatformSubscriptionFees',
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

  // ===== STATE MAPPINGS =====
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
    name: 'totalSubscriptionRevenue',
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
    name: 'subscriptionCount',
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
    name: 'lastCleanupTime',
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
    name: 'SubscriptionEarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
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
    name: 'AlreadySubscribed',
    inputs: []
  },
  {
    type: 'error',
    name: 'CleanupTooSoon',
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
    name: 'InsufficientBalance',
    inputs: []
  },
  {
    type: 'error',
    name: 'InsufficientPayment',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidAutoRenewalConfig',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSubscriptionPeriod',
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
    name: 'RefundNotEligible',
    inputs: []
  },
  {
    type: 'error',
    name: 'RenewalTooSoon',
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
    name: 'SubscriptionAlreadyExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'SubscriptionNotFound',
    inputs: []
  },
  {
    type: 'error',
    name: 'TooManyRenewalAttempts',
    inputs: []
  }
] as const