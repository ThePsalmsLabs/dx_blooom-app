export const CREATOR_REGISTRY_ABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_usdcToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "registerCreator",
      "inputs": [
        {
          "name": "subscriptionPrice",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateSubscriptionPrice",
      "inputs": [
        {
          "name": "newPrice",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "withdrawCreatorEarnings",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "isRegisteredCreator",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getSubscriptionPrice",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "calculatePlatformFee",
      "inputs": [
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "updateCreatorStats",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "earnings",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "contentDelta",
          "type": "int256",
          "internalType": "int256"
        },
        {
          "name": "subscriberDelta",
          "type": "int256",
          "internalType": "int256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getCreatorProfile",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct ICreatorRegistry.Creator",
          "components": [
            {
              "name": "isRegistered",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "subscriptionPrice",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "isVerified",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "totalEarnings",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "contentCount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "subscriberCount",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "CreatorRegistered",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "subscriptionPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SubscriptionPriceUpdated",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "oldPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "newPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "CreatorEarningsUpdated",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "source",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    }
] as const


  // ContentRegistry ABI - manages content metadata and pay-per-view pricing
export const CONTENT_REGISTRY_ABI = [
    {
        "type": "constructor",
        "inputs": [
        {
            "name": "_creatorRegistry",
            "type": "address",
            "internalType": "address"
        }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "registerContent",
        "inputs": [
        {
            "name": "ipfsHash",
            "type": "string",
            "internalType": "string"
        },
        {
            "name": "title",
            "type": "string",
            "internalType": "string"
        },
        {
            "name": "description",
            "type": "string",
            "internalType": "string"
        },
        {
            "name": "category",
            "type": "uint8",
            "internalType": "enum IContentRegistry.ContentCategory"
        },
        {
            "name": "payPerViewPrice",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "tags",
            "type": "string[]",
            "internalType": "string[]"
        }
        ],
        "outputs": [
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "updateContent",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "newPrice",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
        }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "recordPurchase",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "buyer",
            "type": "address",
            "internalType": "address"
        }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getContent",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        }
        ],
        "outputs": [
        {
            "name": "",
            "type": "tuple",
            "internalType": "struct IContentRegistry.Content",
            "components": [
            {
                "name": "creator",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "ipfsHash",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "title",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "description",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "category",
                "type": "uint8",
                "internalType": "enum IContentRegistry.ContentCategory"
            },
            {
                "name": "payPerViewPrice",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "isActive",
                "type": "bool",
                "internalType": "bool"
            },
            {
                "name": "createdAt",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "purchaseCount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "tags",
                "type": "string[]",
                "internalType": "string[]"
            },
            {
                "name": "isReported",
                "type": "bool",
                "internalType": "bool"
            },
            {
                "name": "reportCount",
                "type": "uint256",
                "internalType": "uint256"
            }
            ]
        }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getCreatorContent",
        "inputs": [
        {
            "name": "creator",
            "type": "address",
            "internalType": "address"
        }
        ],
        "outputs": [
        {
            "name": "",
            "type": "uint256[]",
            "internalType": "uint256[]"
        }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getContentsByCategory",
        "inputs": [
        {
            "name": "category",
            "type": "uint8",
            "internalType": "enum IContentRegistry.ContentCategory"
        }
        ],
        "outputs": [
        {
            "name": "",
            "type": "uint256[]",
            "internalType": "uint256[]"
        }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "ContentRegistered",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
        },
        {
            "name": "creator",
            "type": "address",
            "indexed": true,
            "internalType": "address"
        },
        {
            "name": "ipfsHash",
            "type": "string",
            "indexed": false,
            "internalType": "string"
        },
        {
            "name": "title",
            "type": "string",
            "indexed": false,
            "internalType": "string"
        },
        {
            "name": "category",
            "type": "uint8",
            "indexed": false,
            "internalType": "enum IContentRegistry.ContentCategory"
        },
        {
            "name": "payPerViewPrice",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        },
        {
            "name": "timestamp",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ContentPurchased",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
        },
        {
            "name": "buyer",
            "type": "address",
            "indexed": true,
            "internalType": "address"
        },
        {
            "name": "price",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        },
        {
            "name": "timestamp",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        }
        ],
        "anonymous": false
    }
] as const
  
  // PayPerView ABI - handles one-time content purchases
export const PAY_PER_VIEW_ABI = [
    {
        "type": "constructor",
        "inputs": [
        {
            "name": "_creatorRegistry",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "_contentRegistry",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "_commerceIntegration",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "_priceOracle",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "_usdcToken",
            "type": "address",
            "internalType": "address"
        }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "purchaseContentDirect",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "createPurchaseIntent",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "preferredPoolFee",
            "type": "uint24",
            "internalType": "uint24"
        },
        {
            "name": "paymentToken",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "slippageToleranceBps",
            "type": "uint256",
            "internalType": "uint256"
        }
        ],
        "outputs": [
        {
            "name": "intent",
            "type": "tuple",
            "internalType": "struct ICommercePaymentsProtocol.TransferIntent",
            "components": [
            {
                "name": "recipientAmount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "recipient",
                "type": "address",
                "internalType": "address payable"
            },
            {
                "name": "recipientCurrency",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "refundDestination",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "feeAmount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "id",
                "type": "bytes16",
                "internalType": "bytes16"
            },
            {
                "name": "operator",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "signature",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "prefix",
                "type": "bytes",
                "internalType": "bytes"
            }
            ]
        },
        {
            "name": "context",
            "type": "tuple",
            "internalType": "struct CommerceProtocolIntegration.PaymentContext",
            "components": [
            {
                "name": "user",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "creator",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "paymentType",
                "type": "uint8",
                "internalType": "enum CommerceProtocolIntegration.PaymentType"
            },
            {
                "name": "contentId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "creatorAmount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "platformFee",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "operatorFee",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "paymentToken",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "createdAt",
                "type": "uint256",
                "internalType": "uint256"
            }
            ]
        }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "hasAccess",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "user",
            "type": "address",
            "internalType": "address"
        }
        ],
        "outputs": [
        {
            "name": "",
            "type": "bool",
            "internalType": "bool"
        }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "completePurchase",
        "inputs": [
        {
            "name": "intentId",
            "type": "bytes16",
            "internalType": "bytes16"
        },
        {
            "name": "actualAmountPaid",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "success",
            "type": "bool",
            "internalType": "bool"
        },
        {
            "name": "failureReason",
            "type": "string",
            "internalType": "string"
        }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "DirectPurchaseCompleted",
        "inputs": [
        {
            "name": "contentId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
        },
        {
            "name": "buyer",
            "type": "address",
            "indexed": true,
            "internalType": "address"
        },
        {
            "name": "creator",
            "type": "address",
            "indexed": true,
            "internalType": "address"
        },
        {
            "name": "price",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        },
        {
            "name": "platformFee",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        },
        {
            "name": "creatorEarning",
            "type": "uint256",
            "indexed": false,
            "internalType": "uint256"
        }
        ],
        "anonymous": false
    }
] as const
  
  // SubscriptionManager ABI - manages recurring subscriptions
export const SUBSCRIPTION_MANAGER_ABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_creatorRegistry",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_contentRegistry",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_usdcToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "subscribeToCreator",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "renewSubscription",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "cancelSubscription",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "immediate",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "isSubscribed",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "configureAutoRenewal",
      "inputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "enabled",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "maxPrice",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "depositAmount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "executeAutoRenewal",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getSubscriptionDetails",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct ISubscriptionManager.SubscriptionRecord",
          "components": [
            {
              "name": "isActive",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "startTime",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "endTime",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "renewalCount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "totalPaid",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "lastPayment",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "Subscribed",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "price",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "platformFee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "creatorEarning",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "startTime",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "endTime",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SubscriptionRenewed",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "price",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "newEndTime",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "renewalCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    }
] as const

export const COMMERCE_PROTOCOL_INTEGRATION_ABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_commerceProtocol",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_creatorRegistry",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_contentRegistry",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_priceOracle",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_usdcToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_operatorFeeDestination",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_operatorSigner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "createPaymentIntent",
      "inputs": [
        {
          "name": "request",
          "type": "tuple",
          "internalType": "struct CommerceProtocolIntegration.PlatformPaymentRequest",
          "components": [
            {
              "name": "user",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "creator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "paymentType",
              "type": "uint8",
              "internalType": "enum CommerceProtocolIntegration.PaymentType"
            },
            {
              "name": "contentId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "usdcAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "paymentToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "preferredPoolFee",
              "type": "uint24",
              "internalType": "uint24"
            },
            {
              "name": "slippageToleranceBps",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "intent",
          "type": "tuple",
          "internalType": "struct ICommercePaymentsProtocol.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "context",
          "type": "tuple",
          "internalType": "struct CommerceProtocolIntegration.PaymentContext",
          "components": [
            {
              "name": "user",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "creator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "paymentType",
              "type": "uint8",
              "internalType": "enum CommerceProtocolIntegration.PaymentType"
            },
            {
              "name": "contentId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "creatorAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "platformFee",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "operatorFee",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "paymentToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "createdAt",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "registerAsOperator",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPayPerView",
      "inputs": [
        {
          "name": "_payPerView",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setSubscriptionManager",
      "inputs": [
        {
          "name": "_subscriptionManager",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "PaymentIntentCreated",
      "inputs": [
        {
          "name": "intentId",
          "type": "bytes16",
          "indexed": true,
          "internalType": "bytes16"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "paymentType",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum CommerceProtocolIntegration.PaymentType"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "paymentToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    }
] as const

export const PRICE_ORACLE_ABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_quoterV2",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_usdcToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_wethToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getTokenAmountForUSDC",
      "inputs": [
        {
          "name": "tokenAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "usdcAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "preferredPoolFee",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getETHPrice",
      "inputs": [
        {
          "name": "usdcAmount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "calculateWithSlippage",
      "inputs": [
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "slippageToleranceBps",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "isTokenSupported",
      "inputs": [
        {
          "name": "tokenAddress",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "PriceQueried",
      "inputs": [
        {
          "name": "tokenIn",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "tokenOut",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "amountOut",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "poolFee",
          "type": "uint24",
          "indexed": false,
          "internalType": "uint24"
        }
      ],
      "anonymous": false
    }
] as const

export const BASE_COMMERCE_PROTOCOL_ABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_uniswap",
          "type": "address",
          "internalType": "contract IUniversalRouter"
        },
        {
          "name": "_permit2",
          "type": "address",
          "internalType": "contract Permit2"
        },
        {
          "name": "_initialOperator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_initialFeeDestination",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_wrappedNativeCurrency",
          "type": "address",
          "internalType": "contract IWrappedNativeCurrency"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferNative",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "transferToken",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "_signatureTransferData",
          "type": "tuple",
          "internalType": "struct ITransfers.Permit2SignatureTransferData",
          "components": [
            {
              "name": "permit",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.PermitTransferFrom",
              "components": [
                {
                  "name": "permitted",
                  "type": "tuple",
                  "internalType": "struct ISignatureTransfer.TokenPermissions",
                  "components": [
                    {
                      "name": "token",
                      "type": "address",
                      "internalType": "address"
                    },
                    {
                      "name": "amount",
                      "type": "uint256",
                      "internalType": "uint256"
                    }
                  ]
                },
                {
                  "name": "nonce",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "deadline",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "transferDetails",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.SignatureTransferDetails",
              "components": [
                {
                  "name": "to",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "requestedAmount",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferTokenPreApproved",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "wrapAndTransfer",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "unwrapAndTransfer",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "_signatureTransferData",
          "type": "tuple",
          "internalType": "struct ITransfers.Permit2SignatureTransferData",
          "components": [
            {
              "name": "permit",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.PermitTransferFrom",
              "components": [
                {
                  "name": "permitted",
                  "type": "tuple",
                  "internalType": "struct ISignatureTransfer.TokenPermissions",
                  "components": [
                    {
                      "name": "token",
                      "type": "address",
                      "internalType": "address"
                    },
                    {
                      "name": "amount",
                      "type": "uint256",
                      "internalType": "uint256"
                    }
                  ]
                },
                {
                  "name": "nonce",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "deadline",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "transferDetails",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.SignatureTransferDetails",
              "components": [
                {
                  "name": "to",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "requestedAmount",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "unwrapAndTransferPreApproved",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapAndTransferUniswapV3Native",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "poolFeesTier",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "swapAndTransferUniswapV3Token",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "_signatureTransferData",
          "type": "tuple",
          "internalType": "struct ITransfers.Permit2SignatureTransferData",
          "components": [
            {
              "name": "permit",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.PermitTransferFrom",
              "components": [
                {
                  "name": "permitted",
                  "type": "tuple",
                  "internalType": "struct ISignatureTransfer.TokenPermissions",
                  "components": [
                    {
                      "name": "token",
                      "type": "address",
                      "internalType": "address"
                    },
                    {
                      "name": "amount",
                      "type": "uint256",
                      "internalType": "uint256"
                    }
                  ]
                },
                {
                  "name": "nonce",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "deadline",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "transferDetails",
              "type": "tuple",
              "internalType": "struct ISignatureTransfer.SignatureTransferDetails",
              "components": [
                {
                  "name": "to",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "requestedAmount",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "poolFeesTier",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapAndTransferUniswapV3TokenPreApproved",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "_tokenIn",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "maxWillingToPay",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "poolFeesTier",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "subsidizedTransferToken",
      "inputs": [
        {
          "name": "_intent",
          "type": "tuple",
          "internalType": "struct ITransfers.TransferIntent",
          "components": [
            {
              "name": "recipientAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "deadline",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address payable"
            },
            {
              "name": "recipientCurrency",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "refundDestination",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "feeAmount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "id",
              "type": "bytes16",
              "internalType": "bytes16"
            },
            {
              "name": "operator",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            },
            {
              "name": "prefix",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "_signatureTransferData",
          "type": "tuple",
          "internalType": "struct ITransfers.EIP2612SignatureTransferData",
          "components": [
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "signature",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "registerOperatorWithFeeDestination",
      "inputs": [
        {
          "name": "_feeDestination",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "registerOperator",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "unregisterOperator",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "pause",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "unpause",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "permit2",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract Permit2"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "Transferred",
      "inputs": [
        {
          "name": "operator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "id",
          "type": "bytes16",
          "indexed": false,
          "internalType": "bytes16"
        },
        {
          "name": "recipient",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "sender",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "spentAmount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "spentCurrency",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OperatorRegistered",
      "inputs": [
        {
          "name": "operator",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "feeDestination",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OperatorUnregistered",
      "inputs": [
        {
          "name": "operator",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "InvalidSignature",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExpiredIntent",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NullRecipient",
      "inputs": []
    },
    {
      "type": "error",
      "name": "AlreadyProcessed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "OperatorNotRegistered",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidNativeAmount",
      "inputs": [
        {
          "name": "delta",
          "type": "int256",
          "internalType": "int256"
        }
      ]
    },
    {
      "type": "error",
      "name": "IncorrectCurrency",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "InsufficientBalance",
      "inputs": [
        {
          "name": "shortfall",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidTransferDetails",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InsufficientAllowance",
      "inputs": [
        {
          "name": "shortfall",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InexactTransfer",
      "inputs": []
    },
    {
      "type": "error",
      "name": "SwapFailedString",
      "inputs": [
        {
          "name": "reason",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "SwapFailedBytes",
      "inputs": [
        {
          "name": "reason",
          "type": "bytes",
          "internalType": "bytes"
        }
      ]
    },
    {
      "type": "error",
      "name": "NativeTransferFailed",
      "inputs": [
        {
          "name": "recipient",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "isRefund",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "data",
          "type": "bytes",
          "internalType": "bytes"
        }
      ]
    },
    {
      "type": "receive",
      "stateMutability": "payable"
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