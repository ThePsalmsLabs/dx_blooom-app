/**
 * Price Oracle Contract ABI
 * This file exports the ABI for the PriceOracle contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const PRICE_ORACLE_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_quoterV2", type: "address", internalType: "address" },
      { name: "_weth", type: "address", internalType: "address" },
      { name: "_usdc", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "DEFAULT_POOL_FEE",
    inputs: [],
    outputs: [
      { name: "", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "HIGH_FEE",
    inputs: [],
    outputs: [
      { name: "", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "STABLE_POOL_FEE",
    inputs: [],
    outputs: [
      { name: "", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "USDC",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "WETH",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "applySlippage",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "slippageBps", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "adjustedAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "checkPriceImpact",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "maxPriceImpactBps", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "priceImpactBps", type: "uint256", internalType: "uint256" },
      { name: "isAcceptable", type: "bool", internalType: "bool" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "customPoolFees",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "defaultSlippage",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getETHPrice",
    inputs: [
      { name: "usdcAmount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "ethAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getMultipleQuotes",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "quotes", type: "uint256[3]", internalType: "uint256[3]" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getOptimalPoolFeeForSwap",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "fee", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getQuoteWithRecommendedFee",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "amountOut", type: "uint256", internalType: "uint256" },
      { name: "recommendedFee", type: "uint24", internalType: "uint24" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getTokenAmountForUSDC",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "usdcAmount", type: "uint256", internalType: "uint256" },
      { name: "poolFee", type: "uint24", internalType: "uint24" }
    ],
    outputs: [
      { name: "tokenAmount", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getTokenPrice",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "poolFee", type: "uint24", internalType: "uint24" }
    ],
    outputs: [
      { name: "amountOut", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
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
    name: "quoterV2",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IQuoterV2" }
    ],
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
    name: "setCustomPoolFee",
    inputs: [
      { name: "tokenA", type: "address", internalType: "address" },
      { name: "tokenB", type: "address", internalType: "address" },
      { name: "fee", type: "uint24", internalType: "uint24" }
    ],
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
    name: "updateQuoter",
    inputs: [
      { name: "_newQuoter", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateSlippage",
    inputs: [
      { name: "newSlippage", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "validateQuoteBeforeSwap",
    inputs: [
      { name: "tokenIn", type: "address", internalType: "address" },
      { name: "tokenOut", type: "address", internalType: "address" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "expectedAmountOut", type: "uint256", internalType: "uint256" },
      { name: "toleranceBps", type: "uint256", internalType: "uint256" },
      { name: "poolFee", type: "uint24", internalType: "uint24" }
    ],
    outputs: [
      { name: "isValid", type: "bool", internalType: "bool" },
      { name: "currentAmountOut", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "CustomPoolFeeSet",
    inputs: [
      { name: "tokenA", type: "address", indexed: true, internalType: "address" },
      { name: "tokenB", type: "address", indexed: true, internalType: "address" },
      { name: "fee", type: "uint24", indexed: false, internalType: "uint24" }
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
    name: "QuoterUpdated",
    inputs: [
      { name: "oldQuoter", type: "address", indexed: true, internalType: "address" },
      { name: "newQuoter", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SlippageUpdated",
    inputs: [
      { name: "oldSlippage", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newSlippage", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "InvalidPoolFee",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidQuoterAddress",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSlippage",
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
    name: "QuoteReverted",
    inputs: []
  }
] as const;
