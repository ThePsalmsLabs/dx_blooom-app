/**
 * Price Oracle Contract ABI
 * This file exports the ABI for the PriceOracle contract.
 * The ABI is fully typed as a readonly tuple array for maximum type safety.
 */
export const PRICE_ORACLE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_quoterV2", type: "address" },
      { internalType: "address", name: "_weth", type: "address" },
      { internalType: "address", name: "_usdc", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "InvalidPoolFee",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidQuoterAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidSlippage",
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
    name: "QuoteReverted",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "tokenA", type: "address" },
      { indexed: true, internalType: "address", name: "tokenB", type: "address" },
      { indexed: false, internalType: "uint24", name: "fee", type: "uint24" }
    ],
    name: "CustomPoolFeeSet",
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
      { indexed: true, internalType: "address", name: "oldQuoter", type: "address" },
      { indexed: true, internalType: "address", name: "newQuoter", type: "address" }
    ],
    name: "QuoterUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldSlippage", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newSlippage", type: "uint256" }
    ],
    name: "SlippageUpdated",
    type: "event"
  },
  {
    inputs: [],
    name: "DEFAULT_POOL_FEE",
    outputs: [
      { internalType: "uint24", name: "", type: "uint24" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "HIGH_FEE",
    outputs: [
      { internalType: "uint24", name: "", type: "uint24" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "STABLE_POOL_FEE",
    outputs: [
      { internalType: "uint24", name: "", type: "uint24" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "USDC",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "slippageBps", type: "uint256" }
    ],
    name: "applySlippage",
    outputs: [
      { internalType: "uint256", name: "adjustedAmount", type: "uint256" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "maxPriceImpactBps", type: "uint256" }
    ],
    name: "checkPriceImpact",
    outputs: [
      { internalType: "uint256", name: "priceImpactBps", type: "uint256" },
      { internalType: "bool", name: "isAcceptable", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "customPoolFees",
    outputs: [
      { internalType: "uint24", name: "", type: "uint24" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "defaultSlippage",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "usdcAmount", type: "uint256" }
    ],
    name: "getETHPrice",
    outputs: [
      { internalType: "uint256", name: "ethAmount", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" }
    ],
    name: "getMultipleQuotes",
    outputs: [
      { internalType: "uint256[3]", name: "quotes", type: "uint256[3]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" }
    ],
    name: "getOptimalPoolFeeForSwap",
    outputs: [
      { internalType: "uint24", name: "fee", type: "uint24" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" }
    ],
    name: "getQuoteWithRecommendedFee",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint24", name: "recommendedFee", type: "uint24" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { internalType: "uint24", name: "poolFee", type: "uint24" }
    ],
    name: "getTokenAmountForUSDC",
    outputs: [
      { internalType: "uint256", name: "tokenAmount", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint24", name: "poolFee", type: "uint24" }
    ],
    name: "getTokenPrice",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" }
    ],
    stateMutability: "nonpayable",
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
    name: "quoterV2",
    outputs: [
      { internalType: "contract IQuoterV2", name: "", type: "address" }
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
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" }
    ],
    name: "setCustomPoolFee",
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
      { internalType: "address", name: "_newQuoter", type: "address" }
    ],
    name: "updateQuoter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "newSlippage", type: "uint256" }
    ],
    name: "updateSlippage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "expectedAmountOut", type: "uint256" },
      { internalType: "uint256", name: "toleranceBps", type: "uint256" },
      { internalType: "uint24", name: "poolFee", type: "uint24" }
    ],
    name: "validateQuoteBeforeSwap",
    outputs: [
      { internalType: "bool", name: "isValid", type: "bool" },
      { internalType: "uint256", name: "currentAmountOut", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
