/**
 * Permit Payment Manager Contract ABI
 */
export const PERMIT_PAYMENT_MANAGER_ABI = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "_baseCommerceIntegration", type: "address", internalType: "address" },
      { name: "_permit2", type: "address", internalType: "address" },
      { name: "_usdcToken", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },

  // Roles
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "PAYMENT_MONITOR_ROLE",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },

  // View functions
  {
    type: "function",
    name: "baseCommerceIntegration",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract BaseCommerceIntegration" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "canExecuteWithPermit",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "hasSignature", type: "bool", internalType: "bool" },
      {
        name: "permitData",
        type: "tuple",
        internalType: "struct PermitPaymentManager.Permit2Data",
        components: [
          {
            name: "permit",
            type: "tuple",
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            components: [
              {
                name: "permitted",
                type: "tuple",
                internalType: "struct ISignatureTransfer.TokenPermissions",
                components: [
                  { name: "token", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" }
                ]
              },
              { name: "nonce", type: "uint256", internalType: "uint256" },
              { name: "deadline", type: "uint256", internalType: "uint256" }
            ]
          },
          {
            name: "transferDetails",
            type: "tuple",
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            components: [
              { name: "to", type: "address", internalType: "address" },
              { name: "requestedAmount", type: "uint256", internalType: "uint256" }
            ]
          },
          { name: "signature", type: "bytes", internalType: "bytes" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "expectedAmount", type: "uint256", internalType: "uint256" }
        ]
      }
    ],
    outputs: [
      { name: "canExecute", type: "bool", internalType: "bool" },
      { name: "reason", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "createAndExecuteWithPermit",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "expectedAmount", type: "uint256", internalType: "uint256" },
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      {
        name: "permitData",
        type: "tuple",
        internalType: "struct PermitPaymentManager.Permit2Data",
        components: [
          {
            name: "permit",
            type: "tuple",
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            components: [
              {
                name: "permitted",
                type: "tuple",
                internalType: "struct ISignatureTransfer.TokenPermissions",
                components: [
                  { name: "token", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" }
                ]
              },
              { name: "nonce", type: "uint256", internalType: "uint256" },
              { name: "deadline", type: "uint256", internalType: "uint256" }
            ]
          },
          {
            name: "transferDetails",
            type: "tuple",
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            components: [
              { name: "to", type: "address", internalType: "address" },
              { name: "requestedAmount", type: "uint256", internalType: "uint256" }
            ]
          },
          { name: "signature", type: "bytes", internalType: "bytes" }
        ]
      }
    ],
    outputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "success", type: "bool", internalType: "bool" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executePaymentWithPermit",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "user", type: "address", internalType: "address" },
      { name: "paymentToken", type: "address", internalType: "address" },
      { name: "expectedAmount", type: "uint256", internalType: "uint256" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "paymentType", type: "uint8", internalType: "enum ISharedTypes.PaymentType" },
      {
        name: "permitData",
        type: "tuple",
        internalType: "struct PermitPaymentManager.Permit2Data",
        components: [
          {
            name: "permit",
            type: "tuple",
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            components: [
              {
                name: "permitted",
                type: "tuple",
                internalType: "struct ISignatureTransfer.TokenPermissions",
                components: [
                  { name: "token", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" }
                ]
              },
              { name: "nonce", type: "uint256", internalType: "uint256" },
              { name: "deadline", type: "uint256", internalType: "uint256" }
            ]
          },
          {
            name: "transferDetails",
            type: "tuple",
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            components: [
              { name: "to", type: "address", internalType: "address" },
              { name: "requestedAmount", type: "uint256", internalType: "uint256" }
            ]
          },
          { name: "signature", type: "bytes", internalType: "bytes" }
        ]
      }
    ],
    outputs: [
      { name: "success", type: "bool", internalType: "bool" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getPermitDomainSeparator",
    inputs: [],
    outputs: [{ name: "domainSeparator", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPermitNonce",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "nonce", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRoleAdmin",
    inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
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
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" },
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "permit2",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract ISignatureTransfer" }],
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
    name: "supportsInterface",
    inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "validatePermitContext",
    inputs: [
      {
        name: "permitData",
        type: "tuple",
        internalType: "struct PermitPaymentManager.Permit2Data",
        components: [
          {
            name: "permit",
            type: "tuple",
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            components: [
              {
                name: "permitted",
                type: "tuple",
                internalType: "struct ISignatureTransfer.TokenPermissions",
                components: [
                  { name: "token", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" }
                ]
              },
              { name: "nonce", type: "uint256", internalType: "uint256" },
              { name: "deadline", type: "uint256", internalType: "uint256" }
            ]
          },
          {
            name: "transferDetails",
            type: "tuple",
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            components: [
              { name: "to", type: "address", internalType: "address" },
              { name: "requestedAmount", type: "uint256", internalType: "uint256" }
            ]
          },
          { name: "signature", type: "bytes", internalType: "bytes" },
          { name: "paymentToken", type: "address", internalType: "address" },
          { name: "expectedAmount", type: "uint256", internalType: "uint256" },
          { name: "commerceProtocolAddress", type: "address", internalType: "address" }
        ]
      }
    ],
    outputs: [{ name: "isValid", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "validatePermitData",
    inputs: [
      {
        name: "permitData",
        type: "tuple",
        internalType: "struct PermitPaymentManager.Permit2Data",
        components: [
          {
            name: "permit",
            type: "tuple",
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            components: [
              {
                name: "permitted",
                type: "tuple",
                internalType: "struct ISignatureTransfer.TokenPermissions",
                components: [
                  { name: "token", type: "address", internalType: "address" },
                  { name: "amount", type: "uint256", internalType: "uint256" }
                ]
              },
              { name: "nonce", type: "uint256", internalType: "uint256" },
              { name: "deadline", type: "uint256", internalType: "uint256" }
            ]
          },
          {
            name: "transferDetails",
            type: "tuple",
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            components: [
              { name: "to", type: "address", internalType: "address" },
              { name: "requestedAmount", type: "uint256", internalType: "uint256" }
            ]
          },
          { name: "signature", type: "bytes", internalType: "bytes" },
          { name: "user", type: "address", internalType: "address" }
        ]
      }
    ],
    outputs: [{ name: "isValid", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  },

  // Events
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
    name: "PaymentExecutedWithPermit",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "success", type: "bool", indexed: false, internalType: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PermitPaymentCreated",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "paymentType", type: "uint8", indexed: false, internalType: "enum ISharedTypes.PaymentType" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "paymentToken", type: "address", indexed: false, internalType: "address" },
      { name: "deadline", type: "uint256", indexed: false, internalType: "uint256" }
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
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  { type: "error", name: "InvalidPermitData", inputs: [] },
  { type: "error", name: "InvalidPermitSignature", inputs: [] },
  { type: "error", name: "InvalidRecipient", inputs: [] },
  { type: "error", name: "InvalidSignature", inputs: [] },
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
  { type: "error", name: "PermitDeadlineExpired", inputs: [] },
  { type: "error", name: "PermitNonceInvalid", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "UnauthorizedSigner", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] }
] as const;
