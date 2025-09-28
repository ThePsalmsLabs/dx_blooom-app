/**
 * Signature Manager Contract ABI
 * This file exports the ABI for the SignatureManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const SIGNATURE_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "initialOwner", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "addAuthorizedSigner",
    inputs: [
      { name: "signer", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
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
  {
    type: "function",
    name: "getIntentHash",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getIntentSignature",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      { name: "", type: "bytes", internalType: "bytes" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasSignature",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "intentHashes",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" }
    ],
    outputs: [
      { name: "", type: "bytes32", internalType: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isAuthorizedSigner",
    inputs: [
      { name: "signer", type: "address", internalType: "address" }
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
    name: "provideIntentSignature",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "signature", type: "bytes", internalType: "bytes" },
      { name: "signer", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "removeAuthorizedSigner",
    inputs: [
      { name: "signer", type: "address", internalType: "address" }
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
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "verifyIntentSignature",
    inputs: [
      { name: "intentId", type: "bytes16", internalType: "bytes16" },
      { name: "signature", type: "bytes", internalType: "bytes" },
      { name: "signer", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "AuthorizedSignerAdded",
    inputs: [
      { name: "signer", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AuthorizedSignerRemoved",
    inputs: [
      { name: "signer", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "EIP712DomainChanged",
    inputs: [],
    anonymous: false
  },
  {
    type: "event",
    name: "IntentSignatureProvided",
    inputs: [
      { name: "intentId", type: "bytes16", indexed: true, internalType: "bytes16" },
      { name: "signer", type: "address", indexed: true, internalType: "address" }
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
    name: "ECDSAInvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureLength",
    inputs: [
      { name: "length", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureS",
    inputs: [
      { name: "s", type: "bytes32", internalType: "bytes32" }
    ]
  },
  {
    type: "error",
    name: "InvalidShortString",
    inputs: []
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
    name: "StringTooLong",
    inputs: [
      { name: "str", type: "string", internalType: "string" }
    ]
  }
] as const;
