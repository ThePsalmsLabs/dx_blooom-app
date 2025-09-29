/**
 * Rewards Integration Contract ABI
 */
export const REWARDS_INTEGRATION_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_rewardsTreasury", type: "address" },
      { internalType: "address", name: "_loyaltyManager", type: "address" },
      { internalType: "address", name: "_commerceProtocol", type: "address" }
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
    inputs: [
      { internalType: "address", name: "token", type: "address" }
    ],
    name: "SafeERC20FailedOperation",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bool", name: "autoRevenue", type: "bool" },
      { indexed: false, internalType: "bool", name: "autoLoyalty", type: "bool" }
    ],
    name: "IntegrationConfigured",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "points", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "purchaseAmount", type: "uint256" }
    ],
    name: "LoyaltyPointsAutoAwarded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "RevenueAutoDistributed",
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
    name: "INTEGRATION_MANAGER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "REWARDS_TRIGGER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "originalAmount", type: "uint256" },
      { internalType: "bool", name: "usePoints", type: "bool" },
      { internalType: "uint256", name: "pointsToUse", type: "uint256" }
    ],
    name: "applyLoyaltyDiscount",
    outputs: [
      { internalType: "uint256", name: "discountedAmount", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "autoAwardLoyaltyPoints",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "autoDistributeRevenue",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "originalAmount", type: "uint256" }
    ],
    name: "calculateDiscountedPrice",
    outputs: [
      { internalType: "uint256", name: "discountedAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "commerceProtocol",
    outputs: [
      { internalType: "contract ICommerceProtocolCore", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "emergencyPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getIntegrationStats",
    outputs: [
      { internalType: "bool", name: "revenueAutoDistribute", type: "bool" },
      { internalType: "bool", name: "loyaltyAutoAward", type: "bool" },
      { internalType: "uint256", name: "minPurchaseThreshold", type: "uint256" },
      { internalType: "address", name: "treasuryAddress", type: "address" },
      { internalType: "address", name: "loyaltyManagerAddress", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "originalAmount", type: "uint256" }
    ],
    name: "getLoyaltyDiscount",
    outputs: [
      { internalType: "uint256", name: "discountAmount", type: "uint256" },
      { internalType: "uint256", name: "finalAmount", type: "uint256" }
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
    name: "loyaltyManager",
    outputs: [
      { internalType: "contract LoyaltyManager", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minPurchaseForRewards",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "", type: "bytes16" },
      {
        components: [
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
          { internalType: "address", name: "user", type: "address" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "uint256", name: "platformFee", type: "uint256" },
          { internalType: "uint256", name: "creatorAmount", type: "uint256" },
          { internalType: "uint256", name: "operatorFee", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "processed", type: "bool" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "expectedAmount", type: "uint256" },
          { internalType: "bytes16", name: "intentId", type: "bytes16" }
        ],
        internalType: "struct ISharedTypes.PaymentContext",
        name: "context",
        type: "tuple"
      }
    ],
    name: "onPaymentSuccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "referrer", type: "address" },
      { internalType: "address", name: "newUser", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "processReferralBonus",
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
    inputs: [],
    name: "resumeIntegration",
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
      { internalType: "bool", name: "_autoDistributeRevenue", type: "bool" },
      { internalType: "bool", name: "_autoAwardLoyaltyPoints", type: "bool" },
      { internalType: "uint256", name: "_minPurchaseForRewards", type: "uint256" }
    ],
    name: "updateConfiguration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;