/**
 * Access Manager Contract ABI
 * This file exports the ABI for the AccessManager contract.
 * The ABI is fully typed as a readonly array of objects, using TypeScript's `as const` for immutability.
 */
export const ACCESS_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_payPerView", type: "address" },
      { internalType: "address", name: "_subscriptionManager", type: "address" },
      { internalType: "address", name: "_creatorRegistry", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountPaid", type: "uint256" }
    ],
    name: "ContentAccessGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    name: "PaymentProcessingCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountPaid", type: "uint256" }
    ],
    name: "SubscriptionAccessGranted",
    type: "event"
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
    inputs: [],
    name: "getMetrics",
    outputs: [
      { internalType: "uint256", name: "paymentsProcessed", type: "uint256" },
      { internalType: "uint256", name: "operatorFees", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
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
        internalType: "struct AccessManager.PaymentContext",
        name: "context",
        type: "tuple"
      },
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "amountPaid", type: "uint256" },
      { internalType: "uint256", name: "operatorFee", type: "uint256" }
    ],
    name: "handleSuccessfulPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "isConfigured",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "payPerView",
    outputs: [
      { internalType: "contract PayPerView", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "subscriptionManager",
    outputs: [
      { internalType: "contract SubscriptionManager", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalOperatorFees",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalPaymentsProcessed",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;
