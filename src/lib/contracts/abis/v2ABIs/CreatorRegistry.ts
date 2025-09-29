/**
 * Creator Registry Contract ABI
 */
export const CREATOR_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_feeRecipient", type: "address" },
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
    name: "CreatorAlreadyRegistered",
    type: "error"
  },
  {
    inputs: [],
    name: "CreatorNotFound",
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
    name: "InvalidFeePercentage",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidFeeRecipient",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidProfileData",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidSubscriptionPrice",
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
    inputs: [
      { internalType: "address", name: "token", type: "address" }
    ],
    name: "SafeERC20FailedOperation",
    type: "error"
  },
  {
    inputs: [],
    name: "UnauthorizedAccess",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "source", type: "string" }
    ],
    name: "CreatorEarningsUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "CreatorEarningsWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "subscriptionPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
      { indexed: false, internalType: "string", name: "profileData", type: "string" }
    ],
    name: "CreatorRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bool", name: "suspended", type: "bool" }
    ],
    name: "CreatorSuspended",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bool", name: "verified", type: "bool" }
    ],
    name: "CreatorVerified",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldRecipient", type: "address" },
      { indexed: false, internalType: "address", name: "newRecipient", type: "address" }
    ],
    name: "FeeRecipientUpdated",
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
      { indexed: false, internalType: "uint256", name: "oldFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newFee", type: "uint256" }
    ],
    name: "PlatformFeeUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "PlatformFeesWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "oldProfileData", type: "string" },
      { indexed: false, internalType: "string", name: "newProfileData", type: "string" }
    ],
    name: "ProfileDataUpdated",
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
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "oldPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newPrice", type: "uint256" }
    ],
    name: "SubscriptionPriceUpdated",
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
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_SUBSCRIPTION_PRICE",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MIN_SUBSCRIPTION_PRICE",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MODERATOR_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "PLATFORM_CONTRACT_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
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
    inputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "addBonusEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "allCreators",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "calculatePlatformFee",
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
    name: "creatorJoinDate",
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
    name: "creatorPendingEarnings",
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
    name: "creatorWithdrawnEarnings",
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
    name: "creators",
    outputs: [
      { internalType: "bool", name: "isRegistered", type: "bool" },
      { internalType: "uint256", name: "subscriptionPrice", type: "uint256" },
      { internalType: "bool", name: "isVerified", type: "bool" },
      { internalType: "uint256", name: "totalEarnings", type: "uint256" },
      { internalType: "uint256", name: "contentCount", type: "uint256" },
      { internalType: "uint256", name: "subscriberCount", type: "uint256" },
      { internalType: "uint256", name: "registrationTime", type: "uint256" },
      { internalType: "string", name: "profileData", type: "string" },
      { internalType: "bool", name: "isSuspended", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "deactivateCreator",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "feeRecipient",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "index", type: "uint256" }
    ],
    name: "getCreatorByIndex",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorEarnings",
    outputs: [
      { internalType: "uint256", name: "pending", type: "uint256" },
      { internalType: "uint256", name: "total", type: "uint256" },
      { internalType: "uint256", name: "withdrawn", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorProfile",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isRegistered", type: "bool" },
          { internalType: "uint256", name: "subscriptionPrice", type: "uint256" },
          { internalType: "bool", name: "isVerified", type: "bool" },
          { internalType: "uint256", name: "totalEarnings", type: "uint256" },
          { internalType: "uint256", name: "contentCount", type: "uint256" },
          { internalType: "uint256", name: "subscriberCount", type: "uint256" },
          { internalType: "uint256", name: "registrationTime", type: "uint256" },
          { internalType: "string", name: "profileData", type: "string" },
          { internalType: "bool", name: "isSuspended", type: "bool" }
        ],
        internalType: "struct CreatorRegistry.Creator",
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
    name: "getCreatorWithActive",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isRegistered", type: "bool" },
          { internalType: "uint256", name: "subscriptionPrice", type: "uint256" },
          { internalType: "bool", name: "isVerified", type: "bool" },
          { internalType: "uint256", name: "totalEarnings", type: "uint256" },
          { internalType: "uint256", name: "contentCount", type: "uint256" },
          { internalType: "uint256", name: "subscriberCount", type: "uint256" },
          { internalType: "uint256", name: "registrationTime", type: "uint256" },
          { internalType: "string", name: "profileData", type: "string" },
          { internalType: "bool", name: "isSuspended", type: "bool" }
        ],
        internalType: "struct CreatorRegistry.Creator",
        name: "",
        type: "tuple"
      },
      { internalType: "bool", name: "active", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPlatformStats",
    outputs: [
      { internalType: "uint256", name: "totalCreators", type: "uint256" },
      { internalType: "uint256", name: "verifiedCount", type: "uint256" },
      { internalType: "uint256", name: "totalEarnings", type: "uint256" },
      { internalType: "uint256", name: "creatorEarnings", type: "uint256" },
      { internalType: "uint256", name: "withdrawnAmount", type: "uint256" }
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
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getSubscriptionPrice",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getTotalCreators",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "index", type: "uint256" }
    ],
    name: "getVerifiedCreatorByIndex",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getVerifiedCreatorCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "contractAddress", type: "address" }
    ],
    name: "grantPlatformRole",
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
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "isActive",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "isRegisteredCreator",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
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
    inputs: [],
    name: "platformFee",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "subscriptionPrice", type: "uint256" },
      { internalType: "string", name: "profileData", type: "string" }
    ],
    name: "registerCreator",
    outputs: [],
    stateMutability: "nonpayable",
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
      { internalType: "address", name: "contractAddress", type: "address" }
    ],
    name: "revokePlatformRole",
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
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "bool", name: "verified", type: "bool" }
    ],
    name: "setCreatorVerification",
    outputs: [],
    stateMutability: "nonpayable",
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
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "bool", name: "suspended", type: "bool" }
    ],
    name: "suspendCreator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalCreatorEarnings",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalPlatformEarnings",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalWithdrawnEarnings",
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
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "earnings", type: "uint256" },
      { internalType: "int256", name: "contentDelta", type: "int256" },
      { internalType: "int256", name: "subscriberDelta", type: "int256" }
    ],
    name: "updateCreatorStats",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newRecipient", type: "address" }
    ],
    name: "updateFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newFee", type: "uint256" }
    ],
    name: "updatePlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "newProfileData", type: "string" }
    ],
    name: "updateProfileData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newPrice", type: "uint256" }
    ],
    name: "updateSubscriptionPrice",
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
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "verifiedCreators",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawCreatorEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawPlatformFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;