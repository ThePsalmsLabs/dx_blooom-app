/**
 * Signature Manager Contract ABI
 * This file exports the ABI for the SignatureManager contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const SIGNATURE_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "initialOwner", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "ECDSAInvalidSignature",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "length", type: "uint256" }
    ],
    name: "ECDSAInvalidSignatureLength",
    type: "error"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "s", type: "bytes32" }
    ],
    name: "ECDSAInvalidSignatureS",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidShortString",
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
      { internalType: "string", name: "str", type: "string" }
    ],
    name: "StringTooLong",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "signer", type: "address" }
    ],
    name: "AuthorizedSignerAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "signer", type: "address" }
    ],
    name: "AuthorizedSignerRemoved",
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
      { indexed: true, internalType: "address", name: "signer", type: "address" }
    ],
    name: "IntentSignatureProvided",
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
    inputs: [
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "addAuthorizedSigner",
    outputs: [],
    stateMutability: "nonpayable",
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
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "getIntentHash",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "getIntentSignature",
    outputs: [
      { internalType: "bytes", name: "", type: "bytes" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "hasSignature",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" }
    ],
    name: "intentHashes",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
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
    name: "owner",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "provideIntentSignature",
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
      { internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes16", name: "intentId", type: "bytes16" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "address", name: "signer", type: "address" }
    ],
    name: "verifyIntentSignature",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;
