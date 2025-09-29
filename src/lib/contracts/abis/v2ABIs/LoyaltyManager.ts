/**
 * Loyalty Manager Contract ABI
 */
export const LOYALTY_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_rewardsTreasury", type: "address" }
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
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "discountAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "originalPrice", type: "uint256" }
    ],
    name: "DiscountApplied",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "accessHours", type: "uint256" }
    ],
    name: "EarlyAccessGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "points", type: "uint256" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    name: "PointsEarned",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "points", type: "uint256" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    name: "PointsSpent",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "referrer", type: "address" },
      { indexed: true, internalType: "address", name: "referee", type: "address" },
      { indexed: false, internalType: "uint256", name: "bonusPoints", type: "uint256" }
    ],
    name: "ReferralBonus",
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
      { indexed: false, internalType: "enum LoyaltyManager.LoyaltyTier", name: "oldTier", type: "uint8" },
      { indexed: false, internalType: "enum LoyaltyManager.LoyaltyTier", name: "newTier", type: "uint8" }
    ],
    name: "TierUpgraded",
    type: "event"
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
    name: "DISCOUNT_MANAGER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "POINTS_MANAGER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "originalPrice", type: "uint256" },
      { internalType: "bool", name: "usePoints", type: "bool" },
      { internalType: "uint256", name: "pointsToUse", type: "uint256" }
    ],
    name: "applyDiscount",
    outputs: [
      { internalType: "uint256", name: "finalPrice", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "amountSpent", type: "uint256" },
      { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    name: "awardPurchasePoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "referrer", type: "address" },
      { internalType: "address", name: "referee", type: "address" }
    ],
    name: "awardReferralPoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "originalPrice", type: "uint256" }
    ],
    name: "calculateDiscount",
    outputs: [
      { internalType: "uint256", name: "discountAmount", type: "uint256" },
      { internalType: "uint256", name: "finalPrice", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "dailyLoginPoints",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
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
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "tier", type: "uint8" }
    ],
    name: "getTierBenefits",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "discountBps", type: "uint256" },
          { internalType: "uint256", name: "pointsMultiplier", type: "uint256" },
          { internalType: "uint256", name: "cashbackBps", type: "uint256" },
          { internalType: "uint256", name: "earlyAccessHours", type: "uint256" },
          { internalType: "bool", name: "freeTransactionFees", type: "bool" },
          { internalType: "uint256", name: "monthlyBonus", type: "uint256" },
          { internalType: "uint256", name: "referralBonus", type: "uint256" }
        ],
        internalType: "struct LoyaltyManager.TierBenefits",
        name: "benefits",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserLoyalty",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalPoints", type: "uint256" },
          { internalType: "uint256", name: "availablePoints", type: "uint256" },
          { internalType: "enum LoyaltyManager.LoyaltyTier", name: "currentTier", type: "uint8" },
          { internalType: "uint256", name: "totalSpent", type: "uint256" },
          { internalType: "uint256", name: "purchaseCount", type: "uint256" },
          { internalType: "uint256", name: "lastActivityTime", type: "uint256" },
          { internalType: "uint256", name: "referralCount", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "joinTimestamp", type: "uint256" }
        ],
        internalType: "struct LoyaltyManager.UserLoyalty",
        name: "loyalty",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserPoints",
    outputs: [
      { internalType: "uint256", name: "totalPoints", type: "uint256" },
      { internalType: "uint256", name: "availablePoints", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserStats",
    outputs: [
      { internalType: "uint256", name: "totalPoints", type: "uint256" },
      { internalType: "uint256", name: "availablePoints", type: "uint256" },
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "currentTier", type: "uint8" },
      { internalType: "uint256", name: "totalSpent", type: "uint256" },
      { internalType: "uint256", name: "purchaseCount", type: "uint256" },
      { internalType: "uint256", name: "tierDiscountBps", type: "uint256" },
      { internalType: "bool", name: "freeFees", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserTier",
    outputs: [
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "tier", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "grantEarlyAccess",
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
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "hasEarlyAccess",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "hasEarlyAccessToContent",
    outputs: [
      { internalType: "bool", name: "hasAccess", type: "bool" }
    ],
    stateMutability: "view",
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
    inputs: [],
    name: "pointsPerDollarSpent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "referralBonusPoints",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
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
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "rewardsTreasury",
    outputs: [
      { internalType: "contract RewardsTreasury", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "subscriptionBonusMultiplier",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
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
    inputs: [
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "", type: "uint8" }
    ],
    name: "tierBenefits",
    outputs: [
      { internalType: "uint256", name: "discountBps", type: "uint256" },
      { internalType: "uint256", name: "pointsMultiplier", type: "uint256" },
      { internalType: "uint256", name: "cashbackBps", type: "uint256" },
      { internalType: "uint256", name: "earlyAccessHours", type: "uint256" },
      { internalType: "bool", name: "freeTransactionFees", type: "bool" },
      { internalType: "uint256", name: "monthlyBonus", type: "uint256" },
      { internalType: "uint256", name: "referralBonus", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "", type: "uint8" }
    ],
    name: "tierThresholds",
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
    name: "userLoyalty",
    outputs: [
      { internalType: "uint256", name: "totalPoints", type: "uint256" },
      { internalType: "uint256", name: "availablePoints", type: "uint256" },
      { internalType: "enum LoyaltyManager.LoyaltyTier", name: "currentTier", type: "uint8" },
      { internalType: "uint256", name: "totalSpent", type: "uint256" },
      { internalType: "uint256", name: "purchaseCount", type: "uint256" },
      { internalType: "uint256", name: "lastActivityTime", type: "uint256" },
      { internalType: "uint256", name: "referralCount", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "joinTimestamp", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;