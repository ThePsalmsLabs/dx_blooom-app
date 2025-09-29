/**
 * Admin Manager Contract ABI
 * This file exports the ABI for the AdminManager contract.
 * The ABI is fully typed as a readonly array of objects, using TypeScript's `as const` for immutability.
 * This ABI is intended for use with ethers.js, viem, or other EVM-compatible libraries.
 */
export const ADMIN_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_operatorFeeDestination", type: "address" },
      { internalType: "address", name: "_operatorSigner", type: "address" },
      { internalType: "address", name: "_baseCommerceIntegration", type: "address" }
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
    name: "EnforcedPause",
    type: "error"
  },
  {
    inputs: [],
    name: "ExpectedPause",
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
    inputs: [
      { internalType: "address", name: "token", type: "address" }
    ],
    name: "SafeERC20FailedOperation",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "signer", type: "address" }
    ],
    name: "AuthorizedSignerAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "signer", type: "address" }
    ],
    name: "AuthorizedSignerRemoved",
    type: "event"
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
    inputs: [
      { indexed: false, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "EmergencyTokenRecovered",
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
      { indexed: false, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "OperatorFeesWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "operator", type: "address" },
      { indexed: false, internalType: "address", name: "feeDestination", type: "address" }
    ],
    name: "OperatorRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldSigner", type: "address" },
      { indexed: false, internalType: "address", name: "newSigner", type: "address" }
    ],
    name: "OperatorSignerUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "operator", type: "address" }
    ],
    name: "OperatorUnregistered",
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
      { indexed: false, internalType: "address", name: "monitor", type: "address" }
    ],
    name: "PaymentMonitorRoleGranted",
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
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "accumulatedFees",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "addAuthorizedSigner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    name: "authorizedSigners",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
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
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "emergencyTokenRecovery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getOperatorConfig",
    outputs: [
      { internalType: "address", name: "feeDestination", type: "address" },
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "uint256", name: "feeRate", type: "uint256" }
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
      { internalType: "address", name: "monitor", type: "address" }
    ],
    name: "grantPaymentMonitorRole",
    outputs: [],
    stateMutability: "nonpayable",
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
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "isAuthorizedSigner",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
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
    name: "pause",
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
    inputs: [],
    name: "registerAsOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "registerAsOperatorSimple",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "removeAuthorizedSigner",
    outputs: [],
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
    inputs: [
      { internalType: "address", name: "_payPerView", type: "address" }
    ],
    name: "setPayPerView",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_subscriptionManager", type: "address" }
    ],
    name: "setSubscriptionManager",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "feeAmount", type: "uint256" }
    ],
    name: "trackOperatorFees",
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
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unregisterAsOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newDestination", type: "address" }
    ],
    name: "updateOperatorFeeDestination",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newRate", type: "uint256" }
    ],
    name: "updateOperatorFeeRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newSigner", type: "address" }
    ],
    name: "updateOperatorSigner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawOperatorFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
