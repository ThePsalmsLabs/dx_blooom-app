/**
 * Content Registry Contract ABI
 */
export const CONTENT_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_contentIdManager", type: "address", internalType: "address" },
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
    name: "accessManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract AccessManager" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "addContent",
    inputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentType", type: "uint8", internalType: "enum ContentRegistry.ContentType" },
      { name: "contentHash", type: "bytes32", internalType: "bytes32" },
      { name: "metadata", type: "string", internalType: "string" },
      {
        name: "pricing",
        type: "tuple",
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      },
      { name: "tags", type: "string[]", internalType: "string[]" }
    ],
    outputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "contentExists",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "contentIdManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract ContentIdManager" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "contents",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentType", type: "uint8", internalType: "enum ContentRegistry.ContentType" },
      { name: "contentHash", type: "bytes32", internalType: "bytes32" },
      { name: "metadata", type: "string", internalType: "string" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "createdAt", type: "uint256", internalType: "uint256" },
      { name: "lastUpdated", type: "uint256", internalType: "uint256" },
      { name: "totalViews", type: "uint256", internalType: "uint256" },
      { name: "totalRevenue", type: "uint256", internalType: "uint256" },
      { name: "tags", type: "string[]", internalType: "string[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "deactivateContent",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getContent",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      {
        name: "content",
        type: "tuple",
        internalType: "struct ContentRegistry.Content",
        components: [
          { name: "creator", type: "address", internalType: "address" },
          { name: "contentType", type: "uint8", internalType: "enum ContentRegistry.ContentType" },
          { name: "contentHash", type: "bytes32", internalType: "bytes32" },
          { name: "metadata", type: "string", internalType: "string" },
          { name: "isActive", type: "bool", internalType: "bool" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "lastUpdated", type: "uint256", internalType: "uint256" },
          { name: "totalViews", type: "uint256", internalType: "uint256" },
          { name: "totalRevenue", type: "uint256", internalType: "uint256" },
          { name: "tags", type: "string[]", internalType: "string[]" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getContentByCreator",
    inputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "startIndex", type: "uint256", internalType: "uint256" },
      { name: "count", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "contentIds", type: "uint256[]", internalType: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getContentCount",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getContentPricing",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      {
        name: "pricing",
        type: "tuple",
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCreatorContent",
    inputs: [
      { name: "creator", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "contentIds", type: "uint256[]", internalType: "uint256[]" }
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
    name: "incrementViewCount",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
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
    name: "recordRevenue",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" }
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
    name: "searchContent",
    inputs: [
      { name: "query", type: "string", internalType: "string" },
      { name: "contentType", type: "uint8", internalType: "enum ContentRegistry.ContentType" },
      { name: "limit", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "contentIds", type: "uint256[]", internalType: "uint256[]" }
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
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateContent",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "metadata", type: "string", internalType: "string" },
      {
        name: "pricing",
        type: "tuple",
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      },
      { name: "tags", type: "string[]", internalType: "string[]" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateContentPricing",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" },
      {
        name: "pricing",
        type: "tuple",
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      }
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
    type: "event",
    name: "ContentAdded",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "contentType", type: "uint8", indexed: false, internalType: "enum ContentRegistry.ContentType" },
      { name: "contentHash", type: "bytes32", indexed: false, internalType: "bytes32" },
      { name: "metadata", type: "string", indexed: false, internalType: "string" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ContentDeactivated",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ContentPricingUpdated",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "oldPricing",
        type: "tuple",
        indexed: false,
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      },
      {
        name: "newPricing",
        type: "tuple",
        indexed: false,
        internalType: "struct ContentRegistry.ContentPricing",
        components: [
          { name: "payPerViewPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPrice", type: "uint256", internalType: "uint256" },
          { name: "subscriptionPeriod", type: "uint256", internalType: "uint256" },
          { name: "isActive", type: "bool", internalType: "bool" }
        ]
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ContentRevenueRecorded",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "totalRevenue", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ContentUpdated",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "oldMetadata", type: "string", indexed: false, internalType: "string" },
      { name: "newMetadata", type: "string", indexed: false, internalType: "string" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ContentViewIncremented",
    inputs: [
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "newViewCount", type: "uint256", indexed: false, internalType: "uint256" }
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
    name: "ContentNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidContentPricing",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidContentType",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMetadata",
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
    name: "UnauthorizedAccess",
    inputs: []
  }
] as const;
