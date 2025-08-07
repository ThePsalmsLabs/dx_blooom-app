/**
 * Standard ERC20 Token Contract ABI
 */

export const ERC20_ABI = [
  // ===== TOKEN METADATA FUNCTIONS =====
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [
      { name: '', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [
      { name: '', type: 'uint8', internalType: 'uint8' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== BALANCE & ALLOWANCE QUERIES =====
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== TRANSFER FUNCTIONS =====
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== APPROVAL FUNCTIONS =====
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== EVENTS =====
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // ===== MODERN ERC20 ERRORS =====
  {
    type: 'error',
    name: 'ERC20InsufficientBalance',
    inputs: [
      { name: 'sender', type: 'address', internalType: 'address' },
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InsufficientAllowance',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'allowance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidSender',
    inputs: [
      { name: 'sender', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidReceiver',
    inputs: [
      { name: 'receiver', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidApprover',
    inputs: [
      { name: 'approver', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'ERC20InvalidSpender',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' }
    ]
  }
] as const