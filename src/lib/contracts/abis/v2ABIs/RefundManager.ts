/**
 * Refund Manager Contract ABI
 * This file exports the ABI for the RefundManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const REFUND_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_payPerView", type: "address", internalType: "address" },
      { name: "_subscriptionManager", type: "address", internalType: "address" },
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
    name: "PAYMENT_MONITOR_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPendingRefund",
    inputs: [
      { name: "user", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRefundMetrics",
    inputs: [],
    outputs: [
      { name: "totalRefunds", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRefundRequest",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct RefundManager.RefundRequest",
        components: [
          { name: "originalIntentId", type: "bytes16", internalType: "bytes16" },
          { name: "user", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "reason", type: "string", internalType: "string" },
          { name: "requestTime", type: "uint256", internalType: "uint256" },
          { name: "processed", type: "bool", internalType: "bool" }
        ]
      }
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
    name: "handleFailedPayment",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "creatorAmount", type: "uint256", internalType: "uint256" },
      { name: "platformFee", type: "uint256", internalType: "uint256" },
      { name: "operatorFee", type: "uint256", internalType: "uint256" },
      { name: "reason", type: "string", internalType: "string" }
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
    name: "owner",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "payPerView",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract PayPerView" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pendingRefunds",
    inputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "processRefund",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "processRefundWithCoordination",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "creator", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "refundRequests",
    inputs: [
      { name: "", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      { name: "originalIntentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "reason", type: "string", internalType: "string" },
      { name: "requestTime", type: "uint256", internalType: "uint256" },
      { name: "processed", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
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
    name: "requestRefund",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "creatorAmount", type: "uint256", internalType: "uint256" },
      { name: "platformFee", type: "uint256", internalType: "uint256" },
      { name: "operatorFee", type: "uint256", internalType: "uint256" },
      { name: "reason", type: "string", internalType: "string" }
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
    name: "setPayPerView",
    inputs: [
      { name: "_payPerView", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setSubscriptionManager",
    inputs: [
      { name: "_subscriptionManager", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "subscriptionManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract SubscriptionManager" }
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
    name: "totalRefundsProcessed",
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
    name: "usdcToken",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IERC20" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "ContractAddressUpdated",
    inputs: [
      { name: "contractName", type: "string", indexed: false, internalType: "string" },
      { name: "oldAddress", type: "address", indexed: false, internalType: "address" },
      { name: "newAddress", type: "address", indexed: false, internalType: "address" }
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
    name: "RefundRequested",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "reason", type: "string", indexed: false, internalType: "string" }
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
    name: "SafeERC20FailedOperation",
    inputs: [
      { name: "token", type: "address", internalType: "address" }
    ]
  }
] as const;
