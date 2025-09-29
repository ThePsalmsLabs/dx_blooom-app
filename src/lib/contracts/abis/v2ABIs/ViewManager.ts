/**
 * View Manager Contract ABI
 * This file exports the ABI for the ViewManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const VIEW_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_baseCommerceIntegration", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "baseCommerceIntegration",
    outputs: [
      { internalType: "contract BaseCommerceIntegration", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "totalIntentsCreated", type: "uint256" },
      { internalType: "uint256", name: "totalPaymentsProcessed", type: "uint256" },
      { internalType: "uint256", name: "totalOperatorFees", type: "uint256" },
      { internalType: "uint256", name: "totalRefundsProcessed", type: "uint256" }
    ],
    name: "getOperatorMetrics",
    outputs: [
      { internalType: "uint256", name: "intentsCreated", type: "uint256" },
      { internalType: "uint256", name: "paymentsProcessed", type: "uint256" },
      { internalType: "uint256", name: "operatorFees", type: "uint256" },
      { internalType: "uint256", name: "refunds", type: "uint256" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [],
    name: "getOperatorStatus",
    outputs: [
      { internalType: "bool", name: "registered", type: "bool" },
      { internalType: "address", name: "feeDestination", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    name: "getPaymentTypeName",
    outputs: [
      { internalType: "string", name: "name", type: "string" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      { internalType: "contract ISignatureTransfer", name: "permit2", type: "address" }
    ],
    name: "getPermitDomainSeparator",
    outputs: [
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "contract ISignatureTransfer", name: "permit2", type: "address" },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "getPermitNonce",
    outputs: [
      { internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    name: "validatePaymentType",
    outputs: [
      { internalType: "bool", name: "isValid", type: "bool" }
    ],
    stateMutability: "pure",
    type: "function"
  }
] as const;
