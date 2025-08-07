/**
 * Pay Per View Contract ABI
 */

export const PAY_PER_VIEW_ABI = [
  // ===== CONSTRUCTOR =====
  {
    type: 'constructor',
    inputs: [
      { name: '_creatorRegistry', type: 'address', internalType: 'address' },
      { name: '_contentRegistry', type: 'address', internalType: 'address' },
      { name: '_priceOracle', type: 'address', internalType: 'address' },
      { name: '_usdcToken', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== ROLE CONSTANTS =====
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PAYMENT_PROCESSOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'REFUND_MANAGER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== SYSTEM CONSTANTS =====
  {
    type: 'function',
    name: 'PAYMENT_TIMEOUT',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'REFUND_WINDOW',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT REFERENCES =====
  {
    type: 'function',
    name: 'creatorRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract CreatorRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'contentRegistry',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ContentRegistry' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'priceOracle',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract PriceOracle' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IERC20' }
    ],
    stateMutability: 'view'
  },

  // ===== PURCHASE INTENT MANAGEMENT =====
  {
    type: 'function',
    name: 'createPurchaseIntent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentMethod', type: 'uint8', internalType: 'enum PayPerView.PaymentMethod' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'completePurchase',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'success', type: 'bool', internalType: 'bool' },
      { name: 'failureReason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== DIRECT PURCHASE =====
  {
    type: 'function',
    name: 'purchaseContentDirect',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== EXTERNAL PURCHASE RECORDING =====
  {
    type: 'function',
    name: 'recordExternalPurchase',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'buyer', type: 'address', internalType: 'address' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ACCESS CONTROL & VALIDATION =====
  {
    type: 'function',
    name: 'hasAccess',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'canPurchaseContent',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== PAYMENT OPTIONS & PRICING =====
  {
    type: 'function',
    name: 'getPaymentOptions',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'methods', type: 'uint8[]', internalType: 'enum PayPerView.PaymentMethod[]' },
      { name: 'prices', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== PURCHASE DETAILS & RECORDS =====
  {
    type: 'function',
    name: 'getPurchaseDetails',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct PayPerView.PurchaseRecord',
        components: [
          { name: 'hasPurchased', type: 'bool', internalType: 'bool' },
          { name: 'purchasePrice', type: 'uint256', internalType: 'uint256' },
          { name: 'purchaseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
          { name: 'refundEligible', type: 'bool', internalType: 'bool' },
          { name: 'refundDeadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPurchases',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },

  // ===== REFUND MANAGEMENT =====
  {
    type: 'function',
    name: 'requestRefund',
    inputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefundPayout',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'handleExternalRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CREATOR EARNINGS =====
  {
    type: 'function',
    name: 'getCreatorEarnings',
    inputs: [
      { name: 'creator', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'total', type: 'uint256', internalType: 'uint256' },
      { name: 'withdrawable', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawEarnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== ROLE MANAGEMENT =====
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'callerConfirmation', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'grantPaymentProcessorRole',
    inputs: [
      { name: 'processor', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRefundManagerRole',
    inputs: [
      { name: 'manager', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PLATFORM STATISTICS =====
  {
    type: 'function',
    name: 'totalPurchases',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalVolume',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPlatformFees',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRefunds',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== STATE MAPPINGS =====
  {
    type: 'function',
    name: 'purchases',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'hasPurchased', type: 'bool', internalType: 'bool' },
      { name: 'purchasePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'purchaseTime', type: 'uint256', internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'refundEligible', type: 'bool', internalType: 'bool' },
      { name: 'refundDeadline', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingPurchases',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'usdcPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'isProcessed', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'failedPurchases',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'usdcAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'paidAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'failureTime', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'refunded', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawableEarnings',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingRefunds',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPurchases',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userTotalSpent',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userNonces',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== INTERFACE SUPPORT =====
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [
      { name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== OWNERSHIP & ACCESS CONTROL =====
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [
      { name: 'newOwner', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== PAUSE FUNCTIONALITY =====
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== EMERGENCY FUNCTIONS =====
  {
    type: 'function',
    name: 'emergencyTokenRecovery',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== EVENTS =====
  {
    type: 'event',
    name: 'ContentPurchaseInitiated',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentMethod', type: 'uint8', indexed: false, internalType: 'enum PayPerView.PaymentMethod' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'expectedPaymentAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentPurchaseCompleted',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'actualAmountPaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'DirectPurchaseCompleted',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'price', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'creatorEarning', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalPurchaseRecorded',
    inputs: [
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'usdcPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'actualAmountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PurchaseFailed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ExternalRefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatorEarningsWithdrawn',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [
      { name: 'account', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleAdminChanged',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'previousAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },

  // ===== CUSTOM ERRORS =====
  {
    type: 'error',
    name: 'AccessControlBadConfirmation',
    inputs: []
  },
  {
    type: 'error',
    name: 'AccessControlUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'neededRole', type: 'bytes32', internalType: 'bytes32' }
    ]
  },
  {
    type: 'error',
    name: 'CommerceProtocolError',
    inputs: [
      { name: 'reason', type: 'string', internalType: 'string' }
    ]
  },
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: []
  },
  {
    type: 'error',
    name: 'ExpectedPause',
    inputs: []
  },
  {
    type: 'error',
    name: 'InsufficientRefundBalance',
    inputs: []
  },
  {
    type: 'error',
    name: 'IntentNotFound',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidPaymentMethod',
    inputs: []
  },
  {
    type: 'error',
    name: 'NoEarningsToWithdraw',
    inputs: []
  },
  {
    type: 'error',
    name: 'NotRefundEligible',
    inputs: []
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'PurchaseAlreadyCompleted',
    inputs: []
  },
  {
    type: 'error',
    name: 'PurchaseExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: []
  },
  {
    type: 'error',
    name: 'RefundWindowExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ]
  }
] as const