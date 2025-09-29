/**
 * Commerce Protocol Permit Contract ABI
 * This file exports the ABI for the CommerceProtocolPermit contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const COMMERCE_PROTOCOL_PERMIT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_baseCommerceIntegration", type: "address" },
      { internalType: "address", name: "_permit2", type: "address" },
      { internalType: "address", name: "_creatorRegistry", type: "address" },
      { internalType: "address", name: "_contentRegistry", type: "address" },
      { internalType: "address", name: "_priceOracle", type: "address" },
      { internalType: "address", name: "_usdcToken", type: "address" },
      { internalType: "address", name: "_operatorFeeDestination", type: "address" },
      { internalType: "address", name: "_operatorSigner", type: "address" },
      { internalType: "address", name: "_adminManager", type: "address" },
      { internalType: "address", name: "_viewManager", type: "address" },
      { internalType: "address", name: "_accessManager", type: "address" },
      { internalType: "address", name: "_signatureManager", type: "address" },
      { internalType: "address", name: "_refundManager", type: "address" },
      { internalType: "address", name: "_permitPaymentManager", type: "address" },
      { internalType: "address", name: "_rewardsIntegration", type: "address" }
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
    inputs: [],
    name: "AmountMismatch",
    type: "error"
  },
  {
    inputs: [],
    name: "ContextIntentMismatch",
    type: "error"
  },
  {
    inputs: [],
    name: "DeadlineExpired",
    type: "error"
  },
  {
    inputs: [],
    name: "DeadlineInPast",
    type: "error"
  },
  {
    inputs: [],
    name: "DeadlineTooFar",
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
    name: "FeeExceedsAmount",
    type: "error"
  },
  {
    inputs: [],
    name: "IntentAlreadyExists",
    type: "error"
  },
  {
    inputs: [],
    name: "IntentAlreadyProcessed",
    type: "error"
  },
  {
    inputs: [],
    name: "IntentExpired",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidContent",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidCreator",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPaymentRequest",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPaymentType",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRecipient",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRefundAmount",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRefundDestination",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error"
  },
  {
    inputs: [],
    name: "NoRefundAvailable",
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
    name: "PaymentContextNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    inputs: [],
    name: "RefundAlreadyProcessed",
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
    inputs: [
      { internalType: "string", name: "str", type: "string" }
    ],
    name: "StringTooLong",
    type: "error"
  },
  {
    inputs: [],
    name: "UnauthorizedSigner",
    type: "error"
  },
  {
    inputs: [],
    name: "ZeroAmount",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "contractName", type: "string" },
      { indexed: false, internalType: "address", name: "oldAddress", type: "address" },
      { indexed: false, internalType: "address", name: "newAddress", type: "address" }
    ],
    name: "ContractAddressUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "creatorAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "platformFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "operatorFee", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "createdAt", type: "uint256" }
    ],
    name: "IntentAuditRecord",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "IntentFinalized",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldDestination", type: "address" },
      { indexed: false, internalType: "address", name: "newDestination", type: "address" }
    ],
    name: "OperatorFeeDestinationUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldRate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newRate", type: "uint256" }
    ],
    name: "OperatorFeeUpdated",
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
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountPaid", type: "uint256" },
      { indexed: false, internalType: "bool", name: "success", type: "bool" }
    ],
    name: "PaymentCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "bool", name: "success", type: "bool" }
    ],
    name: "PaymentExecutedWithPermit",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "creatorAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "platformFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "operatorFee", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "expectedAmount", type: "uint256" }
    ],
    name: "PaymentIntentCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "address", name: "paymentToken", type: "address" },
      { indexed: false, internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    name: "PermitPaymentCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes16", name: "intentId", type: "bytes16" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "RefundProcessed",
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
    name: "RefundRequested",
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
      { indexed: false, internalType: "address", name: "oldSigner", type: "address" },
      { indexed: false, internalType: "address", name: "newSigner", type: "address" }
    ],
    name: "SignerUpdated",
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
    name: "PAYMENT_MONITOR_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SIGNER_ROLE",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "accessManager",
    outputs: [
      { internalType: "contract AccessManager", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "adminManager",
    outputs: [
      { internalType: "contract AdminManager", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
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
      { internalType: "bytes16[]", name: "intentIds", type: "bytes16[]" },
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data[]",
        name: "permitDataArray",
        type: "tuple[]"
      }
    ],
    name: "batchExecuteWithPermit",
    outputs: [
      { internalType: "bool[]", name: "results", type: "bool[]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data",
        name: "permitData",
        type: "tuple"
      }
    ],
    name: "canExecuteWithPermit",
    outputs: [
      { internalType: "bool", name: "canExecute", type: "bool" },
      { internalType: "string", name: "reason", type: "string" }
    ],
    stateMutability: "view",
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
      {
        components: [
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "maxSlippage", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" }
        ],
        internalType: "struct ISharedTypes.PlatformPaymentRequest",
        name: "request",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data",
        name: "permitData",
        type: "tuple"
      }
    ],
    name: "createAndExecuteWithPermit",
    outputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "bool", name: "success", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "maxSlippage", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" }
        ],
        internalType: "struct ISharedTypes.PlatformPaymentRequest",
        name: "request",
        type: "tuple"
      }
    ],
    name: "createPermitIntent",
    outputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
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
        internalType: "struct ISharedTypes.PaymentContext",
        name: "context",
        type: "tuple"
      }
    ],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "eip712Domain",
    outputs: [
      { internalType: "bytes1", name: "fields", type: "bytes1" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "version", type: "string" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "address", name: "verifyingContract", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "uint256[]", name: "extensions", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data",
        name: "permitData",
        type: "tuple"
      }
    ],
    name: "executePaymentWithPermit",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getContractType",
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [],
    name: "getContractVersion",
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [],
    name: "getOperatorMetrics",
    outputs: [
      { internalType: "uint256", name: "intentsCreated", type: "uint256" },
      { internalType: "uint256", name: "paymentsProcessed", type: "uint256" },
      { internalType: "uint256", name: "operatorFees", type: "uint256" },
      { internalType: "uint256", name: "refunds", type: "uint256" }
    ],
    stateMutability: "view",
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
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "getPaymentContext",
    outputs: [
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
        internalType: "struct ISharedTypes.PaymentContext",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPermitDomainSeparator",
    outputs: [
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
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
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "getPermitPaymentStatus",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "bool", name: "processed", type: "bool" },
      { internalType: "bool", name: "expired", type: "bool" },
      { internalType: "bool", name: "hasSignature", type: "bool" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "expectedAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "enum ISharedTypes.PaymentType", name: "paymentType", type: "uint8" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "contentId", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "maxSlippage", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" }
        ],
        internalType: "struct ISharedTypes.PlatformPaymentRequest",
        name: "request",
        type: "tuple"
      }
    ],
    name: "getPermitRequirements",
    outputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" }
    ],
    stateMutability: "nonpayable",
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
    inputs: [
      { internalType: "bytes16", name: "", type: "bytes16" }
    ],
    name: "intentDeadlines",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
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
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "operatorSigner",
    outputs: [
      { internalType: "address", name: "", type: "address" }
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
    name: "pausePermitOperations",
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
    inputs: [],
    name: "payPerView",
    outputs: [
      { internalType: "contract PayPerView", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "", type: "bytes16" }
    ],
    name: "paymentContexts",
    outputs: [
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
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "permit2",
    outputs: [
      { internalType: "contract ISignatureTransfer", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "permitPaymentManager",
    outputs: [
      { internalType: "contract PermitPaymentManager", name: "", type: "address" }
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
      { internalType: "bytes16", name: "", type: "bytes16" }
    ],
    name: "processedIntents",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "refundManager",
    outputs: [
      { internalType: "contract RefundManager", name: "", type: "address" }
    ],
    stateMutability: "view",
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
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "rewardsIntegration",
    outputs: [
      { internalType: "contract RewardsIntegration", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_rewardsIntegration", type: "address" }
    ],
    name: "setRewardsIntegration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "signatureManager",
    outputs: [
      { internalType: "contract SignatureManager", name: "", type: "address" }
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
    name: "totalIntentsCreated",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
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
  },
  {
    inputs: [],
    name: "totalRefundsProcessed",
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
    name: "unpausePermitOperations",
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
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data",
        name: "permitData",
        type: "tuple"
      },
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
        internalType: "struct ISharedTypes.PaymentContext",
        name: "context",
        type: "tuple"
      }
    ],
    name: "validatePermitContext",
    outputs: [
      { internalType: "bool", name: "isValid", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "amount", type: "uint256" }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              { internalType: "uint256", name: "nonce", type: "uint256" },
              { internalType: "uint256", name: "deadline", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "requestedAmount", type: "uint256" }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PermitPaymentManager.Permit2Data",
        name: "permitData",
        type: "tuple"
      },
      { internalType: "address", name: "user", type: "address" }
    ],
    name: "validatePermitData",
    outputs: [
      { internalType: "bool", name: "isValid", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "viewManager",
    outputs: [
      { internalType: "contract ViewManager", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;