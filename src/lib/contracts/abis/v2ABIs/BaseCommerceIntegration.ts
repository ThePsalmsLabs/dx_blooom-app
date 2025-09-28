/**
 * Base Commerce Integration Contract ABI
 */
export const BASE_COMMERCE_INTEGRATION_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_usdcToken", type: "address", internalType: "address" },
      { name: "_operatorFeeDestination", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authCaptureEscrow",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IAuthCaptureEscrow" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "capturePayment",
    inputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" },
      { name: "amount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "success", type: "bool", internalType: "bool" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "defaultAuthExpiry",
    inputs: [],
    outputs: [
      { name: "", type: "uint48", internalType: "uint48" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "defaultRefundWindow",
    inputs: [],
    outputs: [
      { name: "", type: "uint48", internalType: "uint48" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "executeEscrowPayment",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct BaseCommerceIntegration.EscrowPaymentParams",
        components: [
          { name: "payer", type: "address", internalType: "address" },
          { name: "receiver", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
          { name: "permit2Data", type: "bytes", internalType: "bytes" },
          { name: "instantCapture", type: "bool", internalType: "bool" }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getPaymentRecord",
    inputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct BaseCommerceIntegration.PaymentRecord",
        components: [
          { name: "paymentHash", type: "bytes32", internalType: "bytes32" },
          { name: "payer", type: "address", internalType: "address" },
          { name: "receiver", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "status", type: "uint8", internalType: "enum BaseCommerceIntegration.PaymentStatus" },
          { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPaymentState",
    inputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IAuthCaptureEscrow.PaymentState",
        components: [
          { name: "hasCollectedPayment", type: "bool", internalType: "bool" },
          { name: "capturableAmount", type: "uint120", internalType: "uint120" },
          { name: "refundableAmount", type: "uint120", internalType: "uint120" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "operatorFeeDestination",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "operatorFeeRate",
    inputs: [],
    outputs: [
      { name: "", type: "uint16", internalType: "uint16" }
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
    name: "paymentRecords",
    inputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" },
      { name: "payer", type: "address", internalType: "address" },
      { name: "receiver", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "timestamp", type: "uint256", internalType: "uint256" },
      { name: "status", type: "uint8", internalType: "enum BaseCommerceIntegration.PaymentStatus" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "permit2Collector",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IPermit2PaymentCollector" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "refundPayment",
    inputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "permit2Data", type: "bytes", internalType: "bytes" }
    ],
    outputs: [
      { name: "success", type: "bool", internalType: "bool" }
    ],
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
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateOperatorConfig",
    inputs: [
      { name: "newFeeDestination", type: "address", internalType: "address" },
      { name: "newFeeRate", type: "uint16", internalType: "uint16" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateTimingConfig",
    inputs: [
      { name: "newAuthExpiry", type: "uint48", internalType: "uint48" },
      { name: "newRefundWindow", type: "uint48", internalType: "uint48" }
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
    type: "function",
    name: "userNonces",
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
    name: "voidPayment",
    inputs: [
      { name: "paymentHash", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      { name: "success", type: "bool", internalType: "bool" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "EscrowPaymentAuthorized",
    inputs: [
      { name: "paymentHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EscrowPaymentCaptured",
    inputs: [
      { name: "paymentHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "fee", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EscrowPaymentInitiated",
    inputs: [
      { name: "paymentHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "payer", type: "address", indexed: true, internalType: "address" },
      { name: "receiver", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EscrowPaymentRefunded",
    inputs: [
      { name: "paymentHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EscrowPaymentVoided",
    inputs: [
      { name: "paymentHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "operator", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OperatorConfigUpdated",
    inputs: [
      { name: "newFeeDestination", type: "address", indexed: true, internalType: "address" },
      { name: "newFeeRate", type: "uint16", indexed: false, internalType: "uint16" }
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
  }
] as const;
