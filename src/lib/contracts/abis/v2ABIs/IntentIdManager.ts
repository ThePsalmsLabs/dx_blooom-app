/** * Intent ID Manager Contract ABI */
/**
 * IntentIdManager Contract ABI
 * This file exports the ABI for the IntentIdManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const INTENT_ID_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "generateIntentId",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "timestamp", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getIntentId",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "contentId", type: "uint256", internalType: "uint256" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "timestamp", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    stateMutability: "view"
  }
] as const
