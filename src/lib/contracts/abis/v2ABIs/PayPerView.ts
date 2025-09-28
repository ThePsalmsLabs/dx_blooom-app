/**
 * Pay Per View Contract ABI
 */
export const PAY_PER_VIEW_ABI = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "_creatorRegistry", type: "address", internalType: "address" },
      { name: "_contentRegistry", type: "address", internalType: "address" },
      { name: "_priceOracle", type: "address", internalType: "address" },
      { name: "_usdcToken", type: "address", internalType: "address" },
      { name: "_wethToken", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },

  // Roles
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "PAYMENT_PROCESSOR_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "REFUND_MANAGER_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },

  // Payment Timeout
  {
    type: "function",
    name: "PAYMENT_TIMEOUT",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },

  // Platform Fee
  {
    type: "function",
    name: "addPlatformFee",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "user", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },

  // Registries
  {
    type: "function",
    name: "contentRegistry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract ContentRegistry" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "creatorRegistry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract CreatorRegistry" }],
    stateMutability: "view"
  },

  // Payment Intents
  {
    type: "function",
    name: "createPaymentIntent",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "expectedAmount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [{ name: "", type: "bytes16", internalType: "bytes16" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executePayment",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [{ name: "success", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable"
  },

  // Price
  {
    type: "function",
    name: "getContentPrice",
    inputs: [
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "paymentToken", type: "address", internalType: "address" }
    ],
    outputs: [{ name: "price", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },

  // Payment Context
  {
    type: "function",
    name: "getPaymentContext",
    inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }],
    outputs: [
      {
        name: "",
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
      },
      { name: "deadline", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },

  // Role Management
  {
    type: "function",
    name: "getRoleAdmin",
    inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
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
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
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

  // Intent Deadlines
  {
    type: "function",
    name: "intentDeadlines",
    inputs: [{ name: "", type: "bytes16", internalType: "bytes16" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },

  // Ownership
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
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

  // Pause/Unpause
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },

  // Oracles and Tokens
  {
    type: "function",
    name: "priceOracle",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract PriceOracle" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "wethToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },

  // Refunds
  {
    type: "function",
    name: "processRefund",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },

  // External Payments
  {
    type: "function",
    name: "recordExternalPayment",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "usdcAmount", type: "uint256", internalType: "uint256" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "actualAmountPaid", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },

  // Interface Support
  {
    type: "function",
    name: "supportsInterface",
    inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },

  // Stats
  {
    type: "function",
    name: "totalIntentsCreated",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalPaymentsProcessed",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalPlatformFees",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalRefundsProcessed",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },

  // Content Access
  {
    type: "function",
    name: "validateContentAccess",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "contentId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "hasAccess", type: "bool", internalType: "bool" },
      { name: "accessType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" }
    ],
    stateMutability: "view"
  },

  // Events
  {
    type: "event",
    name: "ContentAccessGranted",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "contentId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "accessType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ExternalPaymentRecorded",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "contentId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "usdcAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "actualAmountPaid", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "IntentAuditRecord",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "creatorAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "platformFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "operatorFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "deadline", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "createdAt", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "IntentFinalized",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "deadline", type: "uint256", indexed: false, internalType: "uint256" }
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
    name: "Paused",
    inputs: [
      { name: "account", type: "address", indexed: false, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PaymentCompleted",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "contentId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "amountPaid", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "success", type: "bool", indexed: false, internalType: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PaymentIntentCreated",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "totalAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "creatorAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "platformFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "operatorFee", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "expectedAmount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RefundProcessed",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
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
    name: "Unpaused",
    inputs: [
      { name: "account", type: "address", indexed: false, internalType: "address" }
    ],
    anonymous: false
  },

  // Errors
  { type: "error", name: "AccessControlBadConfirmation", inputs: [] },
  {
    type: "error",
    name: "AccessControlUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "neededRole", type: "bytes32", internalType: "bytes32" }
    ]
  },
  { type: "error", name: "AmountMismatch", inputs: [] },
  { type: "error", name: "ContentNotFound", inputs: [] },
  { type: "error", name: "CreatorNotRegistered", inputs: [] },
  { type: "error", name: "DeadlineExpired", inputs: [] },
  { type: "error", name: "DeadlineInPast", inputs: [] },
  { type: "error", name: "DeadlineTooFar", inputs: [] },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  { type: "error", name: "FeeExceedsAmount", inputs: [] },
  { type: "error", name: "InsufficientPayment", inputs: [] },
  { type: "error", name: "IntentAlreadyExists", inputs: [] },
  { type: "error", name: "IntentAlreadyProcessed", inputs: [] },
  { type: "error", name: "IntentExpired", inputs: [] },
  { type: "error", name: "InvalidContent", inputs: [] },
  { type: "error", name: "InvalidCreator", inputs: [] },
  { type: "error", name: "InvalidPaymentRequest", inputs: [] },
  { type: "error", name: "InvalidPaymentType", inputs: [] },
  { type: "error", name: "InvalidRefundAmount", inputs: [] },
  { type: "error", name: "InvalidRefundDestination", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }]
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }]
  },
  { type: "error", name: "PaymentContextNotFound", inputs: [] },
  { type: "error", name: "RefundAlreadyProcessed", inputs: [] },
  { type: "error", name: "UnauthorizedSigner", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] }
] as const;
