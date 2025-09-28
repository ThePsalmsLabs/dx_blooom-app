/**
 * Rewards Integration Contract ABI
 */
export const REWARDS_INTEGRATION_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_rewardsTreasury", type: "address", internalType: "address" },
      { name: "_loyaltyManager", type: "address", internalType: "address" },
      { name: "_commerceProtocol", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "INTEGRATION_MANAGER_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "REWARDS_TRIGGER_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "applyLoyaltyDiscount",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "originalAmount", type: "uint256", internalType: "uint256" },
      { name: "usePoints", type: "bool", internalType: "bool" },
      { name: "pointsToUse", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "discountedAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "autoAwardLoyaltyPoints",
    inputs: [],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "autoDistributeRevenue",
    inputs: [],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "calculateDiscountedPrice",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "originalAmount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "discountedAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "commerceProtocol",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract ICommerceProtocolCore" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "emergencyPause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getIntegrationStats",
    inputs: [],
    outputs: [
      { name: "revenueAutoDistribute", type: "bool", internalType: "bool" },
      { name: "loyaltyAutoAward", type: "bool", internalType: "bool" },
      { name: "minPurchaseThreshold", type: "uint256", internalType: "uint256" },
      { name: "treasuryAddress", type: "address", internalType: "address" },
      { name: "loyaltyManagerAddress", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getLoyaltyDiscount",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "originalAmount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "discountAmount", type: "uint256", internalType: "uint256" },
      { name: "finalAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRoleAdmin",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "grantRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "loyaltyManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract LoyaltyManager" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "minPurchaseForRewards",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "onPaymentSuccess",
    inputs: [
      { name: "", type: "bytes16", internalType: "bytes16" },
      {
        name: "context",
        type: "tuple",
        internalType: "struct ISharedTypes.PaymentContext",
        components: [
          { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
          { name: "user", type: "address", internalType: "address" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "contentId", type: "uint256", internalType: "uint256" },
          { name: "platformFee", type: "uint256", internalType: "uint256" },
          { name: "creatorAmount", type: "uint256", internalType: "uint256" },
          { name: "operatorFee", type: "uint256", internalType: "uint256" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "processed", type: "bool", internalType: "bool" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "expectedAmount", type: "uint256", internalType: "uint256" },
          { name: "intentId", type: "bytes16", internalType: "bytes16" }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "processReferralBonus",
    inputs: [
      { name: "referrer", type: "address", internalType: "address" },
      { name: "newUser", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "renounceRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "callerConfirmation", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "resumeIntegration",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "rewardsTreasury",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract RewardsTreasury" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      { name: "interfaceId", type: "bytes4", internalType: "bytes4" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "updateConfiguration",
    inputs: [
      { name: "_autoDistributeRevenue", type: "bool", internalType: "bool" },
      { name: "_autoAwardLoyaltyPoints", type: "bool", internalType: "bool" },
      { name: "_minPurchaseForRewards", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "IntegrationConfigured",
    inputs: [
      { name: "autoRevenue", type: "bool", indexed: false, internalType: "bool" },
      { name: "autoLoyalty", type: "bool", indexed: false, internalType: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "LoyaltyPointsAutoAwarded",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "points", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "purchaseAmount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RevenueAutoDistributed",
    inputs: [
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleAdminChanged",
    inputs: [
      { name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "previousAdminRole", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "newAdminRole", type: "bytes32", indexed: true, internalType: "bytes32" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleGranted",
    inputs: [
      { name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "sender", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleRevoked",
    inputs: [
      { name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "sender", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AccessControlBadConfirmation",
    inputs: []
  },
  {
    type: "error",
    name: "AccessControlUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "neededRole", type: "bytes32", internalType: "bytes32" }
    ]
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: []
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      { name: "token", type: "address", internalType: "address" }
    ]
  }
] as const;
