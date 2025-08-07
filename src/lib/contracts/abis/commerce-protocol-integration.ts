/**
 * Commerce Protocol Integration Contract ABI
 */

export const COMMERCE_PROTOCOL_INTEGRATION_ABI = [
  // ===== CONSTRUCTOR =====
  {
    type: 'constructor',
    inputs: [
      { name: '_commerceProtocol', type: 'address', internalType: 'address' },
      { name: '_creatorRegistry', type: 'address', internalType: 'address' },
      { name: '_contentRegistry', type: 'address', internalType: 'address' },
      { name: '_priceOracle', type: 'address', internalType: 'address' },
      { name: '_usdcToken', type: 'address', internalType: 'address' },
      { name: '_operatorFeeDestination', type: 'address', internalType: 'address' },
      { name: '_operatorSigner', type: 'address', internalType: 'address' }
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
    name: 'PAYMENT_MONITOR_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'SIGNER_ROLE',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  // ===== CONTRACT REFERENCES =====
  {
    type: 'function',
    name: 'commerceProtocol',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ICommercePaymentsProtocol' }
    ],
    stateMutability: 'view'
  },
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
  {
    type: 'function',
    name: 'payPerView',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract PayPerView' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'subscriptionManager',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract SubscriptionManager' }
    ],
    stateMutability: 'view'
  },

  // ===== PAYMENT INTENT FUNCTIONS =====
  {
    type: 'function',
    name: 'createPaymentIntent',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PlatformPaymentRequest',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct ICommercePaymentsProtocol.TransferIntent',
        components: [
          { name: 'recipientAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'recipient', type: 'address', internalType: 'address payable' },
          { name: 'recipientCurrency', type: 'address', internalType: 'address' },
          { name: 'refundDestination', type: 'address', internalType: 'address' },
          { name: 'feeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'id', type: 'bytes16', internalType: 'bytes16' },
          { name: 'operator', type: 'address', internalType: 'address' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
          { name: 'prefix', type: 'bytes', internalType: 'bytes' },
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'token', type: 'address', internalType: 'address' }
        ]
      },
      {
        name: 'context',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PaymentContext',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'processed', type: 'bool', internalType: 'bool' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'executePaymentWithSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct ICommercePaymentsProtocol.TransferIntent',
        components: [
          { name: 'recipientAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'recipient', type: 'address', internalType: 'address payable' },
          { name: 'recipientCurrency', type: 'address', internalType: 'address' },
          { name: 'refundDestination', type: 'address', internalType: 'address' },
          { name: 'feeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'id', type: 'bytes16', internalType: 'bytes16' },
          { name: 'operator', type: 'address', internalType: 'address' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
          { name: 'prefix', type: 'bytes', internalType: 'bytes' },
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'token', type: 'address', internalType: 'address' }
        ]
      }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getPaymentInfo',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PlatformPaymentRequest',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'maxSlippage', type: 'uint256', internalType: 'uint256' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [
      { name: 'totalAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  // ===== SIGNATURE MANAGEMENT =====
  {
    type: 'function',
    name: 'provideIntentSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getIntentSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes', internalType: 'bytes' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasSignature',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== INTENT STATUS & CONTEXT =====
  {
    type: 'function',
    name: 'getPaymentContext',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct CommerceProtocolIntegration.PaymentContext',
        components: [
          { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'contentId', type: 'uint256', internalType: 'uint256' },
          { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'processed', type: 'bool', internalType: 'bool' },
          { name: 'paymentToken', type: 'address', internalType: 'address' },
          { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hasActiveIntent',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentReadyForExecution',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  // ===== PAYMENT PROCESSING =====
  {
    type: 'function',
    name: 'processCompletedPayment',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', internalType: 'uint256' },
      { name: 'success', type: 'bool', internalType: 'bool' },
      { name: 'failureReason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== REFUND HANDLING =====
  {
    type: 'function',
    name: 'requestRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefund',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'processRefundWithCoordination',
    inputs: [
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== OPERATOR MANAGEMENT =====
  {
    type: 'function',
    name: 'registerAsOperator',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'registerAsOperatorSimple',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unregisterAsOperator',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getOperatorStatus',
    inputs: [],
    outputs: [
      { name: 'registered', type: 'bool', internalType: 'bool' },
      { name: 'feeDestination', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getOperatorMetrics',
    inputs: [],
    outputs: [
      { name: 'intentsCreated', type: 'uint256', internalType: 'uint256' },
      { name: 'paymentsProcessed', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFees', type: 'uint256', internalType: 'uint256' },
      { name: 'refunds', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operatorFeeDestination',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operatorFeeRate',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operatorSigner',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdrawOperatorFees',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SIGNER MANAGEMENT =====
  {
    type: 'function',
    name: 'addAuthorizedSigner',
    inputs: [
      { name: 'signer', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'removeAuthorizedSigner',
    inputs: [
      { name: 'signer', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'authorizedSigners',
    inputs: [
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
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
    name: 'grantPaymentMonitorRole',
    inputs: [
      { name: 'monitor', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== CONFIGURATION UPDATES =====
  {
    type: 'function',
    name: 'updateOperatorFeeDestination',
    inputs: [
      { name: 'newDestination', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateOperatorFeeRate',
    inputs: [
      { name: 'newRate', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateOperatorSigner',
    inputs: [
      { name: 'newSigner', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setPayPerView',
    inputs: [
      { name: '_payPerView', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setSubscriptionManager',
    inputs: [
      { name: '_subscriptionManager', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ===== SYSTEM STATE & METRICS =====
  {
    type: 'function',
    name: 'totalIntentsCreated',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalPaymentsProcessed',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalOperatorFees',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalRefundsProcessed',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  // ===== STATE MAPPINGS =====
  {
    type: 'function',
    name: 'paymentContexts',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'paymentType', type: 'uint8', internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'contentId', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'processed', type: 'bool', internalType: 'bool' },
      { name: 'paymentToken', type: 'address', internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', internalType: 'bytes16' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentDeadlines',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentHashes',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'intentSignatures',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bytes', internalType: 'bytes' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'processedIntents',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
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
    name: 'refundRequests',
    inputs: [
      { name: '', type: 'bytes16', internalType: 'bytes16' }
    ],
    outputs: [
      { name: 'originalIntentId', type: 'bytes16', internalType: 'bytes16' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
      { name: 'requestTime', type: 'uint256', internalType: 'uint256' },
      { name: 'processed', type: 'bool', internalType: 'bool' }
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

  // ===== EIP712 & SIGNATURE SUPPORT =====
  {
    type: 'function',
    name: 'eip712Domain',
    inputs: [],
    outputs: [
      { name: 'fields', type: 'bytes1', internalType: 'bytes1' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'version', type: 'string', internalType: 'string' },
      { name: 'chainId', type: 'uint256', internalType: 'uint256' },
      { name: 'verifyingContract', type: 'address', internalType: 'address' },
      { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
      { name: 'extensions', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    stateMutability: 'view'
  },
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
    name: 'PaymentIntentCreated',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'creatorAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'expectedAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PaymentCompleted',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'contentId', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'success', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContentAccessGranted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'contentId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubscriptionAccessGranted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'intentId', type: 'bytes16', indexed: false, internalType: 'bytes16' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountPaid', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentAuditRecord',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'creatorAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'operatorFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'paymentToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'createdAt', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentFinalized',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'paymentType', type: 'uint8', indexed: false, internalType: 'enum ISharedTypes.PaymentType' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentReadyForSigning',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'intentHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'deadline', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentSigned',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', indexed: false, internalType: 'bytes' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IntentReadyForExecution',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'signature', type: 'bytes', indexed: false, internalType: 'bytes' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RefundRequested',
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
    name: 'RefundProcessed',
    inputs: [
      { name: 'intentId', type: 'bytes16', indexed: true, internalType: 'bytes16' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OperatorFeeDestinationUpdated',
    inputs: [
      { name: 'oldDestination', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newDestination', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OperatorFeeUpdated',
    inputs: [
      { name: 'oldRate', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newRate', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SignerUpdated',
    inputs: [
      { name: 'oldSigner', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newSigner', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContractAddressUpdated',
    inputs: [
      { name: 'contractName', type: 'string', indexed: false, internalType: 'string' },
      { name: 'oldAddress', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newAddress', type: 'address', indexed: false, internalType: 'address' }
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
  {
    type: 'event',
    name: 'EIP712DomainChanged',
    inputs: [],
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
    name: 'AmountMismatch',
    inputs: []
  },
  {
    type: 'error',
    name: 'ContextIntentMismatch',
    inputs: []
  },
  {
    type: 'error',
    name: 'DeadlineExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'DeadlineInPast',
    inputs: []
  },
  {
    type: 'error',
    name: 'DeadlineTooFar',
    inputs: []
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
    name: 'FeeExceedsAmount',
    inputs: []
  },
  {
    type: 'error',
    name: 'IntentAlreadyExists',
    inputs: []
  },
  {
    type: 'error',
    name: 'IntentAlreadyProcessed',
    inputs: []
  },
  {
    type: 'error',
    name: 'IntentExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidContent',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidCreator',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidPaymentRequest',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidPaymentType',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidRecipient',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidRefundAmount',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidRefundDestination',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidShortString',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSignature',
    inputs: []
  },
  {
    type: 'error',
    name: 'NoRefundAvailable',
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
    name: 'PaymentContextNotFound',
    inputs: []
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: []
  },
  {
    type: 'error',
    name: 'RefundAlreadyProcessed',
    inputs: []
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' }
    ]
  },
  {
    type: 'error',
    name: 'StringTooLong',
    inputs: [
      { name: 'str', type: 'string', internalType: 'string' }
    ]
  },
  {
    type: 'error',
    name: 'UnauthorizedSigner',
    inputs: []
  },
  {
    type: 'error',
    name: 'ZeroAmount',
    inputs: []
  }
] as const