/**
 * Access Manager Contract ABI
 * This file exports the ABI for the AccessManager contract.
 * The ABI is fully typed as a readonly array of objects, using TypeScript's `as const` for immutability.
 * This ABI is intended for use with ethers.js, viem, or other EVM-compatible libraries.
 */
export const ACCESS_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_defaultAdmin", type: "address", internalType: "address" },
      { name: "_usdcToken", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "PLATFORM_ADMIN_ROLE",
    inputs: [],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "addPlatformAdmin",
    inputs: [
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getRoleAdmin",
    inputs: [
      { name: "role", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
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
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
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
    name: "removePlatformAdmin",
    inputs: [
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [],
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
    inputs: [
      { name: "interfaceId", type: "bytes4", internalType: "bytes4" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
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
    name: "updateContractAddress",
    inputs: [
      { name: "contractName", type: "string", internalType: "string" },
      { name: "newAddress", type: "address", internalType: "address" }
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
    name: "withdrawEmergencyFunds",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
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
  {
    type: "event",
    name: "EmergencyFundsWithdrawn",
    inputs: [
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
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
    name: "PlatformAdminAdded",
    inputs: [
      { name: "admin", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PlatformAdminRemoved",
    inputs: [
      { name: "admin", type: "address", indexed: true, internalType: "address" }
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
    type: "error",
    name: "AccessControlBadConfirmation",
    inputs: []
  },
  {
    type: "error",
    name: "AccessControlUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "neededRole", type: "bytes32", internalType: "bytes32" }
    ]
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
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      { name: "token", type: "address", internalType: "address" }
    ]
  }
] as const;
