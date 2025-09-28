/**
 * View Manager Contract ABI
 * This file exports the ABI for the ViewManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const VIEW_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_baseCommerceIntegration", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "baseCommerceIntegration",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract BaseCommerceIntegration" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOperatorMetrics",
    inputs: [],
    outputs: [
      { name: "intentsCreated", type: "uint256", internalType: "uint256" },
      { name: "paymentsProcessed", type: "uint256", internalType: "uint256" },
      { name: "operatorFees", type: "uint256", internalType: "uint256" },
      { name: "refunds", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOperatorStatus",
    inputs: [],
    outputs: [
      { name: "registered", type: "bool", internalType: "bool" },
      { name: "feeDestination", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPaymentTypeName",
    inputs: [
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" }
    ],
    outputs: [
      { name: "name", type: "string", internalType: "string" }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "getPermitDomainSeparator",
    inputs: [
      { name: "permit2", type: "address", internalType: "contract ISignatureTransfer" }
    ],
    outputs: [
      { name: "domainSeparator", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPermitNonce",
    inputs: [
      { name: "permit2", type: "address", internalType: "contract ISignatureTransfer" },
      { name: "user", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "nonce", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "validatePaymentType",
    inputs: [
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" }
    ],
    outputs: [
      { name: "isValid", type: "bool", internalType: "bool" }
    ],
    stateMutability: "pure"
  }
] as const;
