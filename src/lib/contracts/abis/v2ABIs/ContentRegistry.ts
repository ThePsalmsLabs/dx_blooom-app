/**
 * Content Registry Contract ABI
 */
export const CONTENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_creatorRegistry", type: "address" }
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
    name: "AlreadyReported",
    type: "error"
  },
  {
    inputs: [
      { internalType: "string", name: "word", type: "string" }
    ],
    name: "BannedWordDetected",
    type: "error"
  },
  {
    inputs: [],
    name: "ContentAlreadyExists",
    type: "error"
  },
  {
    inputs: [],
    name: "ContentNotActive",
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
    name: "InvalidContentId",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidIPFSHash",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPrice",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidReportReason",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidStringLength",
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
    name: "ReportNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "TooManyReports",
    type: "error"
  },
  {
    inputs: [],
    name: "UnauthorizedCreator",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "bool", name: "hasAccess", type: "bool" }
    ],
    name: "ContentAccessSetForTesting",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
      { indexed: false, internalType: "address", name: "moderator", type: "address" }
    ],
    name: "ContentDeactivated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "ContentPurchased",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "ipfsHash", type: "string" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "payPerViewPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "ContentRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "reporter", type: "address" },
      { indexed: false, internalType: "string", name: "reason", type: "string" },
      { indexed: false, internalType: "uint256", name: "reportId", type: "uint256" }
    ],
    name: "ContentReported",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newPrice", type: "uint256" },
      { indexed: false, internalType: "bool", name: "isActive", type: "bool" }
    ],
    name: "ContentUpdated",
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
      { indexed: true, internalType: "uint256", name: "reportId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "action", type: "string" },
      { indexed: false, internalType: "address", name: "moderator", type: "address" }
    ],
    name: "ReportResolved",
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
      { indexed: false, internalType: "address", name: "account", type: "address" }
    ],
    name: "Unpaused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "word", type: "string" },
      { indexed: false, internalType: "bool", name: "isPhrase", type: "bool" }
    ],
    name: "WordBanned",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "word", type: "string" },
      { indexed: false, internalType: "bool", name: "isPhrase", type: "bool" }
    ],
    name: "WordUnbanned",
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
    name: "MAX_PAY_PER_VIEW_PRICE",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MIN_PAY_PER_VIEW_PRICE",
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
    name: "PURCHASE_RECORDER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.ContentCategory", name: "", type: "uint8" }
    ],
    name: "activeCategoryCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "activeContentCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "autoModerateThreshold",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "phrase", type: "string" }
    ],
    name: "banPhrase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "word", type: "string" },
      { internalType: "bool", name: "isPhrase", type: "bool" }
    ],
    name: "banWord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    name: "bannedPhrases",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "bannedPhrasesList",
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    name: "bannedWords",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "bannedWordsList",
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.ContentCategory", name: "", type: "uint8" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "categoryContent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.ContentCategory", name: "", type: "uint8" }
    ],
    name: "categoryCount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "contentPurchasers",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "contentReports",
    outputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "reporter", type: "address" },
      { internalType: "string", name: "reason", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "resolved", type: "bool" },
      { internalType: "string", name: "action", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "contents",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" },
      { internalType: "uint256", name: "payPerViewPrice", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "purchaseCount", type: "uint256" },
      { internalType: "bool", name: "isReported", type: "bool" },
      { internalType: "uint256", name: "reportCount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "creatorContent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
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
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "deactivateContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" }
    ],
    name: "getActiveContentByCategory",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "getActiveContentPaginated",
    outputs: [
      { internalType: "uint256[]", name: "contentIds", type: "uint256[]" },
      { internalType: "uint256", name: "total", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "getContent",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" },
          { internalType: "uint256", name: "payPerViewPrice", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "purchaseCount", type: "uint256" },
          { internalType: "string[]", name: "tags", type: "string[]" },
          { internalType: "bool", name: "isReported", type: "bool" },
          { internalType: "uint256", name: "reportCount", type: "uint256" }
        ],
        internalType: "struct ContentRegistry.Content",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" }
    ],
    name: "getContentByCategory",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "tag", type: "string" }
    ],
    name: "getContentByTag",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "getContentPurchasers",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "getContentReports",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "address", name: "reporter", type: "address" },
          { internalType: "string", name: "reason", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "resolved", type: "bool" },
          { internalType: "string", name: "action", type: "string" }
        ],
        internalType: "struct ContentRegistry.ContentReport[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorActiveContent",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "creator", type: "address" }
    ],
    name: "getCreatorContent",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPlatformStats",
    outputs: [
      { internalType: "uint256", name: "totalContent", type: "uint256" },
      { internalType: "uint256", name: "activeContent", type: "uint256" },
      { internalType: "uint256[]", name: "categoryCounts", type: "uint256[]" },
      { internalType: "uint256[]", name: "activeCategoryCounts", type: "uint256[]" }
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
      { internalType: "address", name: "contractAddress", type: "address" }
    ],
    name: "grantPurchaseRecorderRole",
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
    name: "hasReported",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
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
    name: "maxReportsPerUser",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nextContentId",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nextReportId",
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
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "buyer", type: "address" }
    ],
    name: "recordPurchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "enum ISharedTypes.ContentCategory", name: "category", type: "uint8" },
      { internalType: "uint256", name: "payPerViewPrice", type: "uint256" },
      { internalType: "string[]", name: "tags", type: "string[]" }
    ],
    name: "registerContent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
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
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "reportContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "uint256", name: "reportIndex", type: "uint256" },
      { internalType: "string", name: "action", type: "string" }
    ],
    name: "resolveReport",
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
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "tagContent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalContentCount",
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
    inputs: [
      { internalType: "string", name: "word", type: "string" },
      { internalType: "bool", name: "isPhrase", type: "bool" }
    ],
    name: "unbanWord",
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
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "uint256", name: "newPrice", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" }
    ],
    name: "updateContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newThreshold", type: "uint256" },
      { internalType: "uint256", name: "newMaxReports", type: "uint256" }
    ],
    name: "updateModerationSettings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "userDailyReports",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;