/**
 * Base Commerce Integration Contract ABI
 */
export const BASE_COMMERCE_INTEGRATION_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_usdcToken", type: "address" },
      { internalType: "address", name: "_operatorFeeDestination", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
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
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "EscrowPaymentAuthorized",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "fee", type: "uint256" }
    ],
    name: "EscrowPaymentCaptured",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { indexed: true, internalType: "address", name: "payer", type: "address" },
      { indexed: true, internalType: "address", name: "receiver", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    name: "EscrowPaymentInitiated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "EscrowPaymentRefunded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { indexed: true, internalType: "address", name: "operator", type: "address" }
    ],
    name: "EscrowPaymentVoided",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "newFeeDestination", type: "address" },
      { indexed: false, internalType: "uint16", name: "newFeeRate", type: "uint16" }
    ],
    name: "OperatorConfigUpdated",
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
    inputs: [],
    name: "authCaptureEscrow",
    outputs: [
      { internalType: "contract IAuthCaptureEscrow", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "capturePayment",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "defaultAuthExpiry",
    outputs: [
      { internalType: "uint48", name: "", type: "uint48" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "defaultRefundWindow",
    outputs: [
      { internalType: "uint48", name: "", type: "uint48" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "payer", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
          { internalType: "bytes", name: "permit2Data", type: "bytes" },
          { internalType: "bool", name: "instantCapture", type: "bool" }
        ],
        internalType: "struct BaseCommerceIntegration.EscrowPaymentParams",
        name: "params",
        type: "tuple"
      }
    ],
    name: "executeEscrowPayment",
    outputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" }
    ],
    name: "getPaymentRecord",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "paymentHash", type: "bytes32" },
          { internalType: "address", name: "payer", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "enum BaseCommerceIntegration.PaymentStatus", name: "status", type: "uint8" },
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
        ],
        internalType: "struct BaseCommerceIntegration.PaymentRecord",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" }
    ],
    name: "getPaymentState",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "hasCollectedPayment", type: "bool" },
          { internalType: "uint120", name: "capturableAmount", type: "uint120" },
          { internalType: "uint120", name: "refundableAmount", type: "uint120" }
        ],
        internalType: "struct IAuthCaptureEscrow.PaymentState",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "operatorFeeDestination",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "operatorFeeRate",
    outputs: [
      { internalType: "uint16", name: "", type: "uint16" }
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
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    name: "paymentRecords",
    outputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { internalType: "address", name: "payer", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "enum BaseCommerceIntegration.PaymentStatus", name: "status", type: "uint8" },
      { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "permit2Collector",
    outputs: [
      { internalType: "contract IPermit2PaymentCollector", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes", name: "permit2Data", type: "bytes" }
    ],
    name: "refundPayment",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" }
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
      { internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newFeeDestination", type: "address" },
      { internalType: "uint16", name: "newFeeRate", type: "uint16" }
    ],
    name: "updateOperatorConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint48", name: "newAuthExpiry", type: "uint48" },
      { internalType: "uint48", name: "newRefundWindow", type: "uint48" }
    ],
    name: "updateTimingConfig",
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
      { internalType: "bytes32", name: "paymentHash", type: "bytes32" }
    ],
    name: "voidPayment",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
