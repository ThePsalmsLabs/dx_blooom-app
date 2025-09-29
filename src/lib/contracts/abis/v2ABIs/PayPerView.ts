/**
 * Pay Per View Contract ABI
 */
export const PAY_PER_VIEW_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_creatorRegistry", type: "address" },
      { internalType: "address", name: "_contentRegistry", type: "address" },
      { internalType: "address", name: "_priceOracle", type: "address" },
      { internalType: "address", name: "_usdcToken", type: "address" },
      { internalType: "address", name: "_wethToken", type: "address" }
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
    inputs: [
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "CommerceProtocolError",
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
    name: "InsufficientRefundBalance",
    type: "error"
  },
  {
    inputs: [],
    name: "IntentNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPaymentMethod",
    type: "error"
  },
  {
    inputs: [],
    name: "NoEarningsToWithdraw",
    type: "error"
  },
  {
    inputs: [],
    name: "NotRefundEligible",
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
    name: "PurchaseAlreadyCompleted",
    type: "error"
  },
  {
    inputs: [],
    name: "PurchaseExpired",
    type: "error"
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    inputs: [],
    name: "RefundWindowExpired",
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
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "uint256", name: "usdcPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "actualAmountPaid", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" }
    ],
    name: "ContentPurchaseCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "enum PayPerView.PaymentMethod", name: "paymentMethod", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "usdcPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "expectedPaymentAmount", type: "uint256" }
    ],
    name: "ContentPurchaseInitiated",
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
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "platformFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "creatorEarning", type: "uint256" }
    ],
    name: "DirectPurchaseCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "uint256", name: "usdcPrice", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "actualAmountPaid", type: "uint256" }
    ],
    name: "ExternalPurchaseRecorded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "ExternalRefundProcessed",
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
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    name: "PurchaseFailed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    name: "RefundProcessed",
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
    name: "PAYMENT_PROCESSOR_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "PAYMENT_TIMEOUT",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "REFUND_MANAGER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "REFUND_WINDOW",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "canPurchaseContent",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "uint256", name: "actualAmountPaid", type: "uint256" },
      { internalType: "bool", name: "success", type: "bool" },
      { internalType: "string", name: "failureReason", type: "string" }
    ],
    name: "completePurchase",
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
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "enum PayPerView.PaymentMethod", name: "paymentMethod", type: "uint8" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "maxSlippage", type: "uint256" }
    ],
    name: "createPurchaseIntent",
    outputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "uint256", name: "expectedAmount", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "creatorEarnings",
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
      { internalType: "bytes16", name: "", type: "bytes16" }
    ],
    name: "failedPurchases",
    outputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "paidAmount", type: "uint256" },
      { internalType: "uint256", name: "failureTime", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
      { internalType: "bool", name: "refunded", type: "bool" }
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
      { internalType: "uint256", name: "total", type: "uint256" },
      { internalType: "uint256", name: "withdrawable", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "getPaymentOptions",
    outputs: [
      { internalType: "enum PayPerView.PaymentMethod[]", name: "methods", type: "uint8[]" },
      { internalType: "uint256[]", name: "prices", type: "uint256[]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getPurchaseDetails",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "hasPurchased", type: "bool" },
          { internalType: "uint256", name: "purchasePrice", type: "uint256" },
          { internalType: "uint256", name: "purchaseTime", type: "uint256" },
          { internalType: "bytes16", name: "intentId", type: "bytes16" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "actualAmountPaid", type: "uint256" },
          { internalType: "bool", name: "refundEligible", type: "bool" },
          { internalType: "uint256", name: "refundDeadline", type: "uint256" }
        ],
        internalType: "struct PayPerView.PurchaseRecord",
        name: "",
        type: "tuple"
      }
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
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getUserPurchases",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "processor", type: "address" }
    ],
    name: "grantPaymentProcessorRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "manager", type: "address" }
    ],
    name: "grantRefundManagerRole",
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
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "handleExternalRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "hasAccess",
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
      { internalType: "bytes16", name: "", type: "bytes16" }
    ],
    name: "pendingPurchases",
    outputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "usdcPrice", type: "uint256" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "expectedAmount", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bool", name: "isProcessed", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
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
    inputs: [],
    name: "priceOracle",
    outputs: [
      { internalType: "contract PriceOracle", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "processRefundPayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" }
    ],
    name: "purchaseContentDirect",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "purchases",
    outputs: [
      { internalType: "bool", name: "hasPurchased", type: "bool" },
      { internalType: "uint256", name: "purchasePrice", type: "uint256" },
      { internalType: "uint256", name: "purchaseTime", type: "uint256" },
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "actualAmountPaid", type: "uint256" },
      { internalType: "bool", name: "refundEligible", type: "bool" },
      { internalType: "uint256", name: "refundDeadline", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "uint256", name: "usdcPrice", type: "uint256" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "actualAmountPaid", type: "uint256" }
    ],
    name: "recordExternalPurchase",
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
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    name: "requestRefund",
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
    inputs: [],
    name: "totalPlatformFees",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalPurchases",
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
    name: "totalVolume",
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
    name: "userNonces",
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
    name: "userPurchases",
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
    name: "userTotalSpent",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "wethToken",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "withdrawableEarnings",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;