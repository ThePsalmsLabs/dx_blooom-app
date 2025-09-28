/**
 * Commerce Protocol Core Contract ABI
 * This file exports the ABI for the CommerceProtocolCore contract.
 * The ABI is fully typed as a readonly array of objects, using TypeScript's `as const` for immutability.
 * This ABI is intended for use with ethers.js, viem, or other EVM-compatible libraries.
 */
export const COMMERCE_PROTOCOL_CORE_ABI = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "_usdcToken", type: "address", internalType: "address" },
      { name: "_operatorFeeDestination", type: "address", internalType: "address" },
      { name: "_operatorSigner", type: "address", internalType: "address" },
      { name: "_adminManager", type: "address", internalType: "address" },
      { name: "_viewManager", type: "address", internalType: "address" },
      { name: "_accessManager", type: "address", internalType: "address" },
      { name: "_signatureManager", type: "address", internalType: "address" },
      { name: "_refundManager", type: "address", internalType: "address" },
      { name: "_permitPaymentManager", type: "address", internalType: "address" },
      { name: "_rewardsIntegration", type: "address", internalType: "address" },
      { name: "_baseCommerceIntegration", type: "address", internalType: "address" },
      { name: "_permit2", type: "address", internalType: "address" },
      { name: "_creatorRegistry", type: "address", internalType: "address" },
      { name: "_contentRegistry", type: "address", internalType: "address" },
      { name: "_priceOracle", type: "address", internalType: "address" }
    ]
  },
  // Functions
  { type: "function", name: "DEFAULT_ADMIN_ROLE", inputs: [], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "PAYMENT_MONITOR_ROLE", inputs: [], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "SIGNER_ROLE", inputs: [], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "accessManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract AccessManager" }], stateMutability: "view" },
  { type: "function", name: "addAuthorizedSigner", inputs: [{ name: "signer", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "adminManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract AdminManager" }], stateMutability: "view" },
  { type: "function", name: "baseCommerceIntegration", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract BaseCommerceIntegration" }], stateMutability: "view" },
  { type: "function", name: "contentRegistry", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract ContentRegistry" }], stateMutability: "view" },
  {
    type: "function",
    name: "createPaymentIntent",
    inputs: [
      {
        name: "request",
        type: "tuple",
        internalType: "struct ISharedTypes.PlatformPaymentRequest",
        components: [
          { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "contentId", type: "uint256", internalType: "uint256" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "maxSlippage", type: "uint256", internalType: "uint256" },
          { name: "deadline", type: "uint256", internalType: "uint256" }
        ]
      }
    ],
    outputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      {
        name: "context",
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
      }
    ],
    stateMutability: "nonpayable"
  },
  { type: "function", name: "creatorRegistry", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract CreatorRegistry" }], stateMutability: "view" },
  {
    type: "function",
    name: "eip712Domain",
    inputs: [],
    outputs: [
      { name: "fields", type: "bytes1", internalType: "bytes1" },
      { name: "name", type: "string", internalType: "string" },
      { name: "version", type: "string", internalType: "string" },
      { name: "chainId", type: "uint256", internalType: "uint256" },
      { name: "verifyingContract", type: "address", internalType: "address" },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
      { name: "extensions", type: "uint256[]", internalType: "uint256[]" }
    ],
    stateMutability: "view"
  },
  { type: "function", name: "emergencyTokenRecovery", inputs: [{ name: "token", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "executePaymentWithSignature", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "success", type: "bool", internalType: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "getContractType", inputs: [], outputs: [{ name: "", type: "string", internalType: "string" }], stateMutability: "pure" },
  { type: "function", name: "getContractVersion", inputs: [], outputs: [{ name: "", type: "string", internalType: "string" }], stateMutability: "pure" },
  { type: "function", name: "getIntentSignature", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bytes", internalType: "bytes" }], stateMutability: "view" },
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
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPaymentInfo",
    inputs: [
      {
        name: "request",
        type: "tuple",
        internalType: "struct ISharedTypes.PlatformPaymentRequest",
        components: [
          { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "contentId", type: "uint256", internalType: "uint256" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "maxSlippage", type: "uint256", internalType: "uint256" },
          { name: "deadline", type: "uint256", internalType: "uint256" }
        ]
      }
    ],
    outputs: [
      { name: "totalAmount", type: "uint256", internalType: "uint256" },
      { name: "creatorAmount", type: "uint256", internalType: "uint256" },
      { name: "platformFee", type: "uint256", internalType: "uint256" },
      { name: "operatorFee", type: "uint256", internalType: "uint256" },
      { name: "expectedAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  { type: "function", name: "getRoleAdmin", inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "grantPaymentMonitorRole", inputs: [{ name: "monitor", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "grantRole", inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }, { name: "account", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "hasActiveIntent", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }, { name: "account", type: "address", internalType: "address" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "hasSignature", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "intentDeadlines", inputs: [{ name: "", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "intentHashes", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "intentReadyForExecution", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "operatorFeeDestination", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
  { type: "function", name: "operatorFeeRate", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "operatorSigner", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
  { type: "function", name: "pause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "paused", inputs: [], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "payPerView", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract PayPerView" }], stateMutability: "view" },
  {
    type: "function",
    name: "paymentContexts",
    inputs: [{ name: "", type: "bytes16", internalType: "bytes16" }],
    outputs: [
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
    ],
    stateMutability: "view"
  },
  { type: "function", name: "permit2", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract ISignatureTransfer" }], stateMutability: "view" },
  { type: "function", name: "permitPaymentManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract PermitPaymentManager" }], stateMutability: "view" },
  { type: "function", name: "priceOracle", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract PriceOracle" }], stateMutability: "view" },
  {
    type: "function",
    name: "processCompletedPayment",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "amountPaid", type: "uint256", internalType: "uint256" },
      { name: "success", type: "bool", internalType: "bool" },
      { name: "failureReason", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  { type: "function", name: "processRefund", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "processRefundWithCoordination", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "processedIntents", inputs: [{ name: "", type: "bytes16", internalType: "bytes16" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "provideIntentSignature", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }, { name: "signature", type: "bytes", internalType: "bytes" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "refundManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract RefundManager" }], stateMutability: "view" },
  {
    type: "function",
    name: "refundRequests",
    inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }],
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
  { type: "function", name: "registerAsOperator", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "registerAsOperatorSimple", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "removeAuthorizedSigner", inputs: [{ name: "signer", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceOwnership", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceRole", inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }, { name: "callerConfirmation", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "requestRefund", inputs: [{ name: "intentId", type: "bytes16", internalType: "bytes16" }, { name: "reason", type: "string", internalType: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokeRole", inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }, { name: "account", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "rewardsIntegration", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract RewardsIntegration" }], stateMutability: "view" },
  { type: "function", name: "setPayPerView", inputs: [{ name: "_payPerView", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setRewardsIntegration", inputs: [{ name: "_rewardsIntegration", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setSubscriptionManager", inputs: [{ name: "_subscriptionManager", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "signatureManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract SignatureManager" }], stateMutability: "view" },
  { type: "function", name: "subscriptionManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract SubscriptionManager" }], stateMutability: "view" },
  { type: "function", name: "supportsInterface", inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "view" },
  { type: "function", name: "totalIntentsCreated", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalOperatorFees", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalPaymentsProcessed", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalRefundsProcessed", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unpause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "updateOperatorFeeDestination", inputs: [{ name: "newDestination", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "updateOperatorFeeRate", inputs: [{ name: "newRate", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "updateOperatorSigner", inputs: [{ name: "newSigner", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "usdcToken", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract IERC20" }], stateMutability: "view" },
  { type: "function", name: "userNonces", inputs: [{ name: "", type: "address", internalType: "address" }], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "viewManager", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract ViewManager" }], stateMutability: "view" },
  { type: "function", name: "withdrawOperatorFees", inputs: [{ name: "token", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // Events
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
  { type: "event", name: "EIP712DomainChanged", inputs: [], anonymous: false },
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
    name: "OperatorFeeDestinationUpdated",
    inputs: [
      { name: "oldDestination", type: "address", indexed: false, internalType: "address" },
      { name: "newDestination", type: "address", indexed: false, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OperatorFeeUpdated",
    inputs: [
      { name: "oldRate", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newRate", type: "uint256", indexed: false, internalType: "uint256" }
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
    type: "event",
    name: "SignerUpdated",
    inputs: [
      { name: "oldSigner", type: "address", indexed: false, internalType: "address" },
      { name: "newSigner", type: "address", indexed: false, internalType: "address" }
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
  { type: "error", name: "ContextIntentMismatch", inputs: [] },
  { type: "error", name: "DeadlineExpired", inputs: [] },
  { type: "error", name: "DeadlineInPast", inputs: [] },
  { type: "error", name: "DeadlineTooFar", inputs: [] },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  { type: "error", name: "FeeExceedsAmount", inputs: [] },
  { type: "error", name: "IntentAlreadyExists", inputs: [] },
  { type: "error", name: "IntentAlreadyProcessed", inputs: [] },
  { type: "error", name: "IntentExpired", inputs: [] },
  { type: "error", name: "InvalidContent", inputs: [] },
  { type: "error", name: "InvalidCreator", inputs: [] },
  { type: "error", name: "InvalidPaymentRequest", inputs: [] },
  { type: "error", name: "InvalidPaymentType", inputs: [] },
  { type: "error", name: "InvalidRecipient", inputs: [] },
  { type: "error", name: "InvalidRefundAmount", inputs: [] },
  { type: "error", name: "InvalidRefundDestination", inputs: [] },
  { type: "error", name: "InvalidShortString", inputs: [] },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "NoRefundAvailable", inputs: [] },
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
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "RefundAlreadyProcessed", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }]
  },
  {
    type: "error",
    name: "StringTooLong",
    inputs: [{ name: "str", type: "string", internalType: "string" }]
  },
  { type: "error", name: "UnauthorizedSigner", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] }
] as const;
