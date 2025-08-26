// ========================================================================
// CORRECTED ZORA PROTOCOL INTEGRATION - CURRENT V3 IMPLEMENTATION
// ========================================================================

// File: src/lib/contracts/abis/zora.ts
/**
 * Accurate Zora Protocol V3 ABIs - Current Implementation
 * 
 * CRITICAL: The previous ABIs were completely incorrect. These are the 
 * actual function signatures from the current Zora Protocol V3.
 */

export const ZORA_CREATOR_1155_IMPL_ABI = [
    // ===== TOKEN CREATION =====
    {
      type: 'function',
      name: 'setupNewToken',
      inputs: [
        { name: 'newURI', type: 'string' },
        { name: 'maxSupply', type: 'uint256' }
      ],
      outputs: [{ name: 'tokenId', type: 'uint256' }],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'setupNewTokenWithCreateReferral',
      inputs: [
        { name: 'newURI', type: 'string' },
        { name: 'maxSupply', type: 'uint256' },
        { name: 'createReferral', type: 'address' }
      ],
      outputs: [{ name: 'tokenId', type: 'uint256' }],
      stateMutability: 'nonpayable'
    },
    
    // ===== MINTING FUNCTIONS =====
    {
      type: 'function',
      name: 'mint',
      inputs: [
        { name: 'minter', type: 'address' }, // IMinter1155
        { name: 'tokenId', type: 'uint256' },
        { name: 'quantity', type: 'uint256' },
        { name: 'rewardsRecipients', type: 'address[]' },
        { name: 'minterArguments', type: 'bytes' }
      ],
      outputs: [],
      stateMutability: 'payable'
    },
    
    // ===== TOKEN INFORMATION =====
    {
      type: 'function',
      name: 'getTokenInfo',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [
        {
          type: 'tuple',
          components: [
            { name: 'uri', type: 'string' },
            { name: 'maxSupply', type: 'uint256' },
            { name: 'totalMinted', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'uri',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'totalSupply',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view'
    },
    
    // ===== SALES CONFIGURATION =====
    {
      type: 'function',
      name: 'callSale',
      inputs: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'minterModule', type: 'address' },
        { name: 'data', type: 'bytes' }
      ],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    
    // ===== CONTRACT METADATA =====
    {
      type: 'function',
      name: 'contractURI',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'updateContractMetadata',
      inputs: [
        { name: '_newURI', type: 'string' },
        { name: '_newName', type: 'string' }
      ],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    
    // ===== MINT FEES =====
    {
      type: 'function',
      name: 'mintFee',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view'
    },
    
    // ===== EVENTS =====
    {
      type: 'event',
      name: 'UpdatedToken',
      inputs: [
        { name: 'sender', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
        { 
          name: 'tokenData', 
          type: 'tuple',
          indexed: false,
          components: [
            { name: 'uri', type: 'string' },
            { name: 'maxSupply', type: 'uint256' },
            { name: 'totalMinted', type: 'uint256' }
          ]
        }
      ]
    },
    {
      type: 'event',
      name: 'Purchased',
      inputs: [
        { name: 'sender', type: 'address', indexed: true },
        { name: 'minterModule', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
        { name: 'quantity', type: 'uint256', indexed: false },
        { name: 'value', type: 'uint256', indexed: false }
      ]
    }
  ] as const
  
  export const ZORA_CREATOR_1155_FACTORY_ABI = [
    // ===== FACTORY CREATION =====
    {
      type: 'function',
      name: 'createContract',
      inputs: [
        { name: 'newContractURI', type: 'string' },
        { name: 'name', type: 'string' },
        { 
          name: 'defaultRoyaltyConfiguration', 
          type: 'tuple',
          components: [
            { name: 'royaltyMintSchedule', type: 'uint32' },
            { name: 'royaltyBPS', type: 'uint32' },
            { name: 'royaltyRecipient', type: 'address' }
          ]
        },
        { name: 'defaultAdmin', type: 'address' },
        { name: 'setupActions', type: 'bytes[]' }
      ],
      outputs: [{ name: 'newContract', type: 'address' }],
      stateMutability: 'nonpayable'
    },
    
    // ===== FACTORY UTILITIES =====
    {
      type: 'function',
      name: 'contractDeterministicAddress',
      inputs: [
        { name: 'newContractURI', type: 'string' },
        { name: 'name', type: 'string' },
        { 
          name: 'defaultRoyaltyConfiguration', 
          type: 'tuple',
          components: [
            { name: 'royaltyMintSchedule', type: 'uint32' },
            { name: 'royaltyBPS', type: 'uint32' },
            { name: 'royaltyRecipient', type: 'address' }
          ]
        },
        { name: 'defaultAdmin', type: 'address' },
        { name: 'setupActions', type: 'bytes[]' }
      ],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view'
    },
    
    // ===== EVENTS =====
    {
      type: 'event',
      name: 'SetupNewContract',
      inputs: [
        { name: 'newContract', type: 'address', indexed: true },
        { name: 'creator', type: 'address', indexed: true },
        { name: 'contractURI', type: 'string', indexed: false },
        { name: 'name', type: 'string', indexed: false }
      ]
    }
  ] as const
  
  export const ZORA_FIXED_PRICE_SALE_STRATEGY_ABI = [
    // ===== SALE CONFIGURATION =====
    {
      type: 'function',
      name: 'setSale',
      inputs: [
        { name: 'tokenId', type: 'uint256' },
        {
          name: 'salesConfig',
          type: 'tuple',
          components: [
            { name: 'saleStart', type: 'uint64' },
            { name: 'saleEnd', type: 'uint64' },
            { name: 'maxTokensPerAddress', type: 'uint64' },
            { name: 'pricePerToken', type: 'uint96' },
            { name: 'fundsRecipient', type: 'address' }
          ]
        }
      ],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    
    // ===== MINTING =====
    {
      type: 'function',
      name: 'mint',
      inputs: [
        { name: 'recipient', type: 'address' },
        { name: 'quantity', type: 'uint256' },
        { name: 'comment', type: 'string' },
        { name: 'mintReferral', type: 'address' }
      ],
      outputs: [],
      stateMutability: 'payable'
    },
    
    // ===== SALE INFO =====
    {
      type: 'function',
      name: 'sale',
      inputs: [
        { name: 'tokenContract', type: 'address' },
        { name: 'tokenId', type: 'uint256' }
      ],
      outputs: [
        {
          type: 'tuple',
          components: [
            { name: 'saleStart', type: 'uint64' },
            { name: 'saleEnd', type: 'uint64' },
            { name: 'maxTokensPerAddress', type: 'uint64' },
            { name: 'pricePerToken', type: 'uint96' },
            { name: 'fundsRecipient', type: 'address' }
          ]
        }
      ],
      stateMutability: 'view'
    },
    
    // ===== EVENTS =====
    {
      type: 'event',
      name: 'SaleSet',
      inputs: [
        { name: 'tokenContract', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
        { 
          name: 'salesConfig', 
          type: 'tuple',
          indexed: false,
          components: [
            { name: 'saleStart', type: 'uint64' },
            { name: 'saleEnd', type: 'uint64' },
            { name: 'maxTokensPerAddress', type: 'uint64' },
            { name: 'pricePerToken', type: 'uint96' },
            { name: 'fundsRecipient', type: 'address' }
          ]
        }
      ]
    },
    {
      type: 'event',
      name: 'MintComment',
      inputs: [
        { name: 'sender', type: 'address', indexed: true },
        { name: 'tokenContract', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
        { name: 'quantity', type: 'uint256', indexed: false },
        { name: 'comment', type: 'string', indexed: false }
      ]
    }
  ] as const
  
  export const PROTOCOL_REWARDS_ABI = [
    // ===== REWARDS DEPOSIT =====
    {
      type: 'function',
      name: 'deposit',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'reason', type: 'bytes4' },
        { name: 'comment', type: 'string' }
      ],
      outputs: [],
      stateMutability: 'payable'
    },
    {
      type: 'function',
      name: 'depositBatch',
      inputs: [
        { name: 'recipients', type: 'address[]' },
        { name: 'amounts', type: 'uint256[]' },
        { name: 'reasons', type: 'bytes4[]' },
        { name: 'comment', type: 'string' }
      ],
      outputs: [],
      stateMutability: 'payable'
    },
    
    // ===== REWARDS WITHDRAWAL =====
    {
      type: 'function',
      name: 'withdraw',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    
    // ===== BALANCE QUERIES =====
    {
      type: 'function',
      name: 'balanceOf',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view'
    },
    
    // ===== EVENTS =====
    {
      type: 'event',
      name: 'RewardsDeposit',
      inputs: [
        { name: 'creator', type: 'address', indexed: true },
        { name: 'createReferral', type: 'address', indexed: true },
        { name: 'mintReferral', type: 'address', indexed: true },
        { name: 'firstMinter', type: 'address', indexed: false },
        { name: 'zora', type: 'address', indexed: false },
        { name: 'from', type: 'address', indexed: false },
        { name: 'creatorReward', type: 'uint256', indexed: false },
        { name: 'createReferralReward', type: 'uint256', indexed: false },
        { name: 'mintReferralReward', type: 'uint256', indexed: false },
        { name: 'firstMinterReward', type: 'uint256', indexed: false },
        { name: 'zoraReward', type: 'uint256', indexed: false }
      ]
    }
  ] as const
  