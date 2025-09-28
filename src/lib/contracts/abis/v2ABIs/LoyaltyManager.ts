/**
 * Loyalty Manager Contract ABI
 */
export const LOYALTY_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_rewardsTreasury",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "DISCOUNT_MANAGER_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "POINTS_MANAGER_ROLE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "applyDiscount",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "originalPrice",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "usePoints",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "pointsToUse",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "finalPrice",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "awardPurchasePoints",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "amountSpent",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "paymentType",
        type: "uint8",
        internalType: "enum ISharedTypes.PaymentType"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "awardReferralPoints",
    inputs: [
      {
        name: "referrer",
        type: "address",
        internalType: "address"
      },
      {
        name: "referee",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "calculateDiscount",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "originalPrice",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "discountAmount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "finalPrice",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "dailyLoginPoints",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRoleAdmin",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTierBenefits",
    inputs: [
      {
        name: "tier",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      }
    ],
    outputs: [
      {
        name: "benefits",
        type: "tuple",
        internalType: "struct LoyaltyManager.TierBenefits",
        components: [
          {
            name: "discountBps",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "pointsMultiplier",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "cashbackBps",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "earlyAccessHours",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "freeTransactionFees",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "monthlyBonus",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "referralBonus",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getUserLoyalty",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "loyalty",
        type: "tuple",
        internalType: "struct LoyaltyManager.UserLoyalty",
        components: [
          {
            name: "totalPoints",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "availablePoints",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "currentTier",
            type: "uint8",
            internalType: "enum LoyaltyManager.LoyaltyTier"
          },
          {
            name: "totalSpent",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "purchaseCount",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "lastActivityTime",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "referralCount",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "joinTimestamp",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getUserPoints",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "totalPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "availablePoints",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getUserStats",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "totalPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "availablePoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "currentTier",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      },
      {
        name: "totalSpent",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "purchaseCount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "tierDiscountBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "freeFees",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getUserTier",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "tier",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "grantEarlyAccess",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "contentId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "grantRole",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "hasEarlyAccess",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasEarlyAccessToContent",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "contentId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "hasAccess",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasRole",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pointsPerDollarSpent",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "referralBonusPoints",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceRole",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "callerConfirmation",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeRole",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "rewardsTreasury",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract RewardsTreasury"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "subscriptionBonusMultiplier",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4",
        internalType: "bytes4"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "tierBenefits",
    inputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      }
    ],
    outputs: [
      {
        name: "discountBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "pointsMultiplier",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "cashbackBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "earlyAccessHours",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "freeTransactionFees",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "monthlyBonus",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "referralBonus",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "tierThresholds",
    inputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "userLoyalty",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "totalPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "availablePoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "currentTier",
        type: "uint8",
        internalType: "enum LoyaltyManager.LoyaltyTier"
      },
      {
        name: "totalSpent",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "purchaseCount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "lastActivityTime",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "referralCount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "joinTimestamp",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "DiscountApplied",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "discountAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "originalPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EarlyAccessGranted",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "contentId",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "accessHours",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PointsEarned",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "points",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PointsSpent",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "points",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ReferralBonus",
    inputs: [
      {
        name: "referrer",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "referee",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "bonusPoints",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleAdminChanged",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "previousAdminRole",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "newAdminRole",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleGranted",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RoleRevoked",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TierUpgraded",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "oldTier",
        type: "uint8",
        indexed: false,
        internalType: "enum LoyaltyManager.LoyaltyTier"
      },
      {
        name: "newTier",
        type: "uint8",
        indexed: false,
        internalType: "enum LoyaltyManager.LoyaltyTier"
      }
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
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "neededRole",
        type: "bytes32",
        internalType: "bytes32"
      }
    ]
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: []
  }
] as const;
