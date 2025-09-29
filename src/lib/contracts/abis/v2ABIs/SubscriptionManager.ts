/**
 * Subscription Manager Contract ABI
 */
export const SUBSCRIPTION_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_creatorRegistry", type: "address" },
      { internalType: "address", name: "_contentRegistry", type: "address" },
      { internalType: "address", name: "_usdcToken", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "neededRole", type: "bytes32" }
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error"
  },
  {
    inputs: [],
    name: "AlreadySubscribed",
    type: "error"
  },
  {
    inputs: [],
    name: "CleanupTooSoon",
    type: "error"
  },
  {
    inputs: [],
    name: "CreatorNotRegistered",
    type: "error"
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error"
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientBalance",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientPayment",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidAutoRenewalConfig",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidSubscriptionPeriod",
    type: "error"
  },
  {
    inputs: [],
    name: "NoEarningsToWithdraw",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" }
    ],
    name: "OwnableInvalidOwner",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error"
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    inputs: [],
    name: "RefundNotEligible",
    type: "error"
  },
  {
    inputs: [],
    name: "RenewalTooSoon",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" }
    ],
    name: "SafeERC20FailedOperation",
    type: "error"
  },
  {
    inputs: [],
    name: "SubscriptionAlreadyExpired",
    type: "error"
  },
  {
    inputs: [],
    name: "SubscriptionNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "TooManyRenewalAttempts",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bool", name: "enabled", type: "bool" },
      { indexed: false, internalType: "uint256", name: "maxPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "depositAmount", type: "uint256" }
    ],
    name: "AutoRenewalConfigured",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newEndTime", type: "uint256" }
    ],
    name: "AutoRenewalExecuted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
      { indexed: false, internalType: "uint256", name: "attemptTime", type: "uint256" }
    ],
    name: "AutoRenewalFailed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "cleanedCount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "ExpiredSubscriptionsCleaned",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "refundAmount", type: "uint256" }
    ],
    name: "ExternalRefundProcessed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "actualAmountPaid", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }
    ],
    name: "ExternalSubscriptionRecorded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "account", type: "address" }
    ],
    name: "Paused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
    ],
    name: "RoleAdminChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" }
    ],
    name: "RoleGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" }
    ],
    name: "RoleRevoked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "platformFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "creatorEarning", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "startTime", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }
    ],
    name: "Subscribed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" },
      { indexed: false, internalType: "bool", name: "immediate", type: "bool" }
    ],
    name: "SubscriptionCancelled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "SubscriptionEarningsWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "SubscriptionExpired",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    name: "SubscriptionRefunded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newEndTime", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "renewalCount", type: "uint256" }
    ],
    name: "SubscriptionRenewed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "account", type: "address" }
    ],
    name: "Unpaused",
    type: "event"
  },
  {
    inputs: [],
    name: "CLEANUP_INTERVAL",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GRACE_PERIOD",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "RENEWAL_BOT_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "RENEWAL_WINDOW",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SUBSCRIPTION_DURATION",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SUBSCRIPTION_PROCESSOR_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "autoRenewals",
    outputs: [
      { internalType: "bool", name: "enabled", type: "bool" },
      { internalType: "uint256", name: "maxPrice", type: "uint256" },
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "lastRenewalAttempt", type: "uint256" },
      { internalType: "uint256", name: "failedAttempts", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "bool", name: "immediate", type: "bool" }
    ],
    name: "cancelSubscription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "cleanupExpiredSubscriptions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "cleanupExpiredSubscriptionsEnhanced",
    outputs: [
      { internalType: "address[]", name: "cleanedUsers", type: "address[]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "bool", name: "enabled", type: "bool" },
      { internalType: "uint256", name: "maxPrice", type: "uint256" },
      { internalType: "uint256", name: "depositAmount", type: "uint256" }
    ],
    name: "configureAutoRenewal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "contentRegistry",
    outputs: [
      { internalType: "contract ContentRegistry", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "creatorRegistry",
    outputs: [
      { internalType: "contract CreatorRegistry", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "creatorSubscriberCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "creatorSubscribers",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "creatorSubscriptionEarnings",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "emergencyTokenRecovery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "executeAutoRenewal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "failedSubscriptions",
    outputs: [
      { internalType: "uint256", name: "attemptTime", type: "uint256" },
      { internalType: "uint256", name: "attemptedPrice", type: "uint256" },
      { internalType: "string", name: "failureReason", type: "string" },
      { internalType: "bool", name: "refunded", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getAutoRenewalConfig",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "enabled", type: "bool" },
          { internalType: "uint256", name: "maxPrice", type: "uint256" },
          { internalType: "uint256", name: "balance", type: "uint256" },
          { internalType: "uint256", name: "lastRenewalAttempt", type: "uint256" },
          { internalType: "uint256", name: "failedAttempts", type: "uint256" }
        ],
        internalType: "struct SubscriptionManager.AutoRenewal",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorActiveSubscribers",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorSubscribers",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorSubscriptionEarnings",
    outputs: [
      { internalType: "uint256", name: "totalEarnings", type: "uint256" },
      { internalType: "uint256", name: "withdrawableEarnings", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPlatformSubscriptionMetrics",
    outputs: [
      { internalType: "uint256", name: "activeSubscriptions", type: "uint256" },
      { internalType: "uint256", name: "totalVolume", type: "uint256" },
      { internalType: "uint256", name: "platformFees", type: "uint256" },
      { internalType: "uint256", name: "totalRenewalCount", type: "uint256" },
      { internalType: "uint256", name: "totalRefundAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" }
    ],
    name: "getRoleAdmin",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getSubscriptionDetails",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "renewalCount", type: "uint256" },
          { internalType: "uint256", name: "totalPaid", type: "uint256" },
          { internalType: "uint256", name: "lastPayment", type: "uint256" },
          { internalType: "uint256", name: "lastRenewalTime", type: "uint256" },
          { internalType: "bool", name: "autoRenewalEnabled", type: "bool" }
        ],
        internalType: "struct SubscriptionManager.SubscriptionRecord",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getSubscriptionEndTime",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getSubscriptionStatus",
    outputs: [
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "inGracePeriod", type: "bool" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "gracePeriodEnd", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserActiveSubscriptions",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserSubscriptions",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "bot", type: "address" }
    ],
    name: "grantRenewalBotRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "processor", type: "address" }
    ],
    name: "grantSubscriptionProcessorRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "handleExternalRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "isSubscribed",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "lastCleanupTime",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "maxRenewalAttemptsPerDay",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "pendingRefunds",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "processRefundPayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "actualAmountPaid", type: "uint256" }
    ],
    name: "recordSubscriptionPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "renewalCooldown",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "callerConfirmation", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "requestSubscriptionRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "subscribeToCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "subscriptionCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "subscriptionEndTime",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "subscriptions",
    outputs: [
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "renewalCount", type: "uint256" },
      { internalType: "uint256", name: "totalPaid", type: "uint256" },
      { internalType: "uint256", name: "lastPayment", type: "uint256" },
      { internalType: "uint256", name: "lastRenewalTime", type: "uint256" },
      { internalType: "bool", name: "autoRenewalEnabled", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes4", name: "interfaceId", type: "bytes4" }
    ],
    name: "supportsInterface",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalActiveSubscriptions",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalPlatformSubscriptionFees",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalRefunds",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalRenewals",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "totalSubscriptionRevenue",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSubscriptionVolume",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newMaxAttempts", type: "uint256" },
      { internalType: "uint256", name: "newCooldown", type: "uint256" }
    ],
    name: "updateRenewalSettings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [
      { internalType: "contract IERC20", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "userSubscriptionSpending",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "userSubscriptions",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawAutoRenewalBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" }
    ],
    name: "withdrawPlatformSubscriptionFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawSubscriptionEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;