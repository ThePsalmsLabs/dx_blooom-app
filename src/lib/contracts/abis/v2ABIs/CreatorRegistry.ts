/**
 * Creator Registry Contract ABI
 */
export const CREATOR_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_accessManager", type: "address", internalType: "address" },
      { name: "_usdcToken", type: "address", internalType: "address" }
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
    name: "CREATOR_MANAGER_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "PLATFORM_ADMIN_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "accessManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract AccessManager" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "addPlatformAdmin",
    inputs: [
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "creators",
    inputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "isVerified", type: "bool", internalType: "bool" },
      { name: "isSuspended", type: "bool", internalType: "bool" },
      { name: "registeredAt", type: "uint256", internalType: "uint256" },
      { name: "totalEarnings", type: "uint256", internalType: "uint256" },
      { name: "totalSubscribers", type: "uint256", internalType: "uint256" },
      { name: "profileData", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCreator",
    inputs: [
      { name: "creator", type: "address", internalType: "address" }
    ],
    outputs: [
      {
        name: "creatorInfo",
        type: "tuple",
        internalType: "struct CreatorRegistry.Creator",
        components: [
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" },
          { name: "isVerified", type: "bool", internalType: "bool" },
          { name: "isSuspended", type: "bool", internalType: "bool" },
          { name: "registeredAt", type: "uint256", internalType: "uint256" },
          { name: "totalEarnings", type: "uint256", internalType: "uint256" },
          { name: "totalSubscribers", type: "uint256", internalType: "uint256" },
          { name: "profileData", type: "string", internalType: "string" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCreatorCount",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCreators",
    inputs: [
      { name: "startIndex", type: "uint256", internalType: "uint256" },
      { name: "count", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "creators", type: "address[]", internalType: "address[]" }
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
    name: "isCreatorRegistered",
    inputs: [
      { name: "creator", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "registerCreator",
    inputs: [
      { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
      { name: "profileData", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "removePlatformAdmin",
    inputs: [
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
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
    name: "setCreatorSuspended",
    inputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "suspended", type: "bool", internalType: "bool" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setCreatorVerified",
    inputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "verified", type: "bool", internalType: "bool" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setFeeRecipient",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPlatformFee",
    inputs: [
      { name: "feeBps", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
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
    name: "totalPlatformFees",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateCreatorProfile",
    inputs: [
      { name: "profileData", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateSubscriptionPrice",
    inputs: [
      { name: "newPrice", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IERC20" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "withdrawPlatformFees",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "CreatorRegistered",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "subscriptionPrice", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "profileData", type: "string", indexed: false, internalType: "string" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "CreatorSuspended",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "suspended", type: "bool", indexed: false, internalType: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "CreatorVerified",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "verified", type: "bool", indexed: false, internalType: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "FeeRecipientUpdated",
    inputs: [
      { name: "oldRecipient", type: "address", indexed: false, internalType: "address" },
      { name: "newRecipient", type: "address", indexed: false, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PlatformFeeUpdated",
    inputs: [
      { name: "oldFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newFee", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PlatformFeesWithdrawn",
    inputs: [
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ProfileDataUpdated",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "oldProfileData", type: "string", indexed: false, internalType: "string" },
      { name: "newProfileData", type: "string", indexed: false, internalType: "string" }
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
    type: "event",
    name: "SubscriptionPriceUpdated",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "oldPrice", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newPrice", type: "uint256", indexed: false, internalType: "uint256" }
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
    name: "CreatorAlreadyRegistered",
    inputs: []
  },
  {
    type: "error",
    name: "CreatorNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "CreatorNotRegistered",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidFeePercentage",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidFeeRecipient",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidProfileData",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSubscriptionPrice",
    inputs: []
  },
  {
    type: "error",
    name: "NoEarningsToWithdraw",
    inputs: []
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      { name: "owner", type: "address", internalType: "address" }
    ]
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address", internalType: "address" }
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
  },
  {
    type: "error",
    name: "UnauthorizedAccess",
    inputs: []
  }
] as const;
