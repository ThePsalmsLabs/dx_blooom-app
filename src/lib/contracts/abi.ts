export const CREATOR_REGISTRY_ABI = [
    {
      type: 'function',
      name: 'registerCreator',
      inputs: [
        { name: 'subscriptionPrice', type: 'uint256' },
        { name: 'displayName', type: 'string' }
      ],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'updateSubscriptionPrice',
      inputs: [{ name: 'newPrice', type: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'creators',
      inputs: [{ name: 'creator', type: 'address' }],
      outputs: [
        { name: 'isRegistered', type: 'bool' },
        { name: 'subscriptionPrice', type: 'uint256' },
        { name: 'displayName', type: 'string' },
        { name: 'totalEarnings', type: 'uint256' },
        { name: 'subscriberCount', type: 'uint256' }
      ],
      stateMutability: 'view'
    },
    {
      type: 'event',
      name: 'CreatorRegistered',
      inputs: [
        { name: 'creator', type: 'address', indexed: true },
        { name: 'subscriptionPrice', type: 'uint256', indexed: false },
        { name: 'displayName', type: 'string', indexed: false }
      ]
    }
  ] as const


  // ContentRegistry ABI - manages content metadata and pay-per-view pricing
export const CONTENT_REGISTRY_ABI = [
    {
      type: 'function',
      name: 'registerContent',
      inputs: [
        { name: 'ipfsHash', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'uint8' },
        { name: 'payPerViewPrice', type: 'uint256' },
        { name: 'tags', type: 'string[]' }
      ],
      outputs: [{ name: 'contentId', type: 'uint256' }],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'getContent',
      inputs: [{ name: 'contentId', type: 'uint256' }],
      outputs: [
        { name: 'creator', type: 'address' },
        { name: 'ipfsHash', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'uint8' },
        { name: 'payPerViewPrice', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'purchaseCount', type: 'uint256' }
      ],
      stateMutability: 'view'
    },
    {
      type: 'event',
      name: 'ContentRegistered',
      inputs: [
        { name: 'contentId', type: 'uint256', indexed: true },
        { name: 'creator', type: 'address', indexed: true },
        { name: 'title', type: 'string', indexed: false }
      ]
    }
  ] as const
  
  // PayPerView ABI - handles one-time content purchases
  export const PAY_PER_VIEW_ABI = [
    {
      type: 'function',
      name: 'purchaseContent',
      inputs: [{ name: 'contentId', type: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'hasAccess',
      inputs: [
        { name: 'contentId', type: 'uint256' },
        { name: 'user', type: 'address' }
      ],
      outputs: [{ name: 'access', type: 'bool' }],
      stateMutability: 'view'
    },
    {
      type: 'event',
      name: 'ContentPurchased',
      inputs: [
        { name: 'user', type: 'address', indexed: true },
        { name: 'contentId', type: 'uint256', indexed: true },
        { name: 'price', type: 'uint256', indexed: false }
      ]
    }
  ] as const
  
  // SubscriptionManager ABI - manages recurring subscriptions
  export const SUBSCRIPTION_MANAGER_ABI = [
    {
      type: 'function',
      name: 'subscribeToCreator',
      inputs: [{ name: 'creator', type: 'address' }],
      outputs: [],
      stateMutability: 'nonpayable'
    },
    {
      type: 'function',
      name: 'isSubscribed',
      inputs: [
        { name: 'user', type: 'address' },
        { name: 'creator', type: 'address' }
      ],
      outputs: [{ name: 'subscribed', type: 'bool' }],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'getSubscriptionEndTime',
      inputs: [
        { name: 'user', type: 'address' },
        { name: 'creator', type: 'address' }
      ],
      outputs: [{ name: 'endTime', type: 'uint256' }],
      stateMutability: 'view'
    },
    {
      type: 'event',
      name: 'Subscribed',
      inputs: [
        { name: 'user', type: 'address', indexed: true },
        { name: 'creator', type: 'address', indexed: true },
        { name: 'endTime', type: 'uint256', indexed: false }
      ]
    }
  ] as const
  
  // USDC Token ABI - standard ERC20 functions we'll need for payments
  export const USDC_ABI = [
    {
      type: 'function',
      name: 'balanceOf',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: 'balance', type: 'uint256' }],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'allowance',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: 'allowance', type: 'uint256' }],
      stateMutability: 'view'
    },
    {
      type: 'function',
      name: 'approve',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: 'success', type: 'bool' }],
      stateMutability: 'nonpayable'
    }
  ] as const