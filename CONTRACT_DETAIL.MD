# Complete Content Purchase Payment Flow Guide

## Overview: The Dual Payment Architecture

Your content platform implements **two distinct payment pathways** for purchasing content, each serving different use cases and user preferences:

1. **Direct USDC Payment Path** - Simple, gas-efficient payments using only USDC
2. **Commerce Protocol Integration Path** - Advanced multi-token payments with enhanced features

Both paths ultimately achieve the same goal: granting users access to content while properly distributing earnings to creators and platform fees.

---

## Prerequisites & System Dependencies

### Contract Deployment Order & Dependencies
```solidity
// CRITICAL: Contracts must be deployed in this exact order due to dependencies
1. CreatorRegistry (base registry, no dependencies)
2. PriceOracle (independent pricing system)  
3. ContentRegistry (depends on CreatorRegistry)
4. PayPerView (depends on CreatorRegistry, ContentRegistry, PriceOracle)
5. SubscriptionManager (depends on CreatorRegistry, ContentRegistry)
6. CommerceProtocolIntegration (depends on ALL previous contracts)
```

### Role-Based Permission Matrix
Your system uses a sophisticated hierarchical role structure that MUST be configured correctly:

#### CreatorRegistry Permissions
- **PLATFORM_CONTRACT_ROLE** → Must be granted to:
  - ContentRegistry (for creator validation)
  - PayPerView (for earnings updates) 
  - SubscriptionManager (for subscription tracking)
  - CommerceProtocolIntegration (for payment processing)

#### ContentRegistry Permissions  
- **PURCHASE_RECORDER_ROLE** → Must be granted to:
  - PayPerView (for recording direct purchases)
  - CommerceProtocolIntegration (for recording external payments)

#### PayPerView Permissions
- **PAYMENT_PROCESSOR_ROLE** → Must be granted to:
  - CommerceProtocolIntegration (for completing payment intents)

#### CommerceProtocolIntegration Permissions
- **PAYMENT_MONITOR_ROLE** → Must be granted to:
  - Platform admin (for processing completed payments)
- **SIGNER_ROLE** → Must be granted to:
  - Operator signer wallet (for signing payment intents)

---

## Payment Path 1: Direct USDC Payment Flow

### Function: `PayPerView.purchaseContentDirect(uint256 contentId)`

This is the **simplest payment path** where users pay directly with USDC tokens.

#### Pre-Execution Requirements
```solidity
// 1. User must have sufficient USDC balance
require(usdcToken.balanceOf(user) >= totalCost, "Insufficient USDC balance");

// 2. User must approve PayPerView contract to spend USDC  
require(usdcToken.allowance(user, payPerViewAddress) >= totalCost, "Insufficient allowance");

// 3. Content must exist and be active
ContentRegistry.Content memory content = contentRegistry.getContent(contentId);
require(content.creator != address(0), "Content not found");
require(content.isActive, "Content not active");

// 4. User must not already own the content
require(!purchases[contentId][msg.sender].hasPurchased, "Already purchased");

// 5. Creator must be registered and active
require(creatorRegistry.isActive(content.creator), "Creator not active");
```

#### Step-by-Step Execution Flow

**Step 1: Content & Creator Validation**
```solidity
// Fetches complete content metadata from ContentRegistry
ContentRegistry.Content memory content = contentRegistry.getContent(contentId);
// Validates creator is registered and not suspended
require(creatorRegistry.isActive(content.creator), "Creator not active");
```

**Step 2: Access Control Validation** 
```solidity
// Prevents double purchases by same user
require(!purchases[contentId][msg.sender].hasPurchased, "Already purchased");
// Ensures content is available for purchase
require(content.isActive, "Content not active");
```

**Step 3: Fee Calculation**
```solidity
uint256 contentPrice = content.payPerViewPrice; // e.g., 5.00 USDC (5000000)
uint256 platformFee = creatorRegistry.calculatePlatformFee(contentPrice); // e.g., 3% = 150000
uint256 creatorEarning = contentPrice - platformFee; // e.g., 4.85 USDC (4850000)
uint256 totalCost = contentPrice; // User pays full content price
```

**Step 4: USDC Transfer Execution**
```solidity
// Transfers USDC from user to PayPerView contract
// This requires prior approval from user
bool success = usdcToken.transferFrom(msg.sender, address(this), contentPrice);
require(success, "Transfer failed");
```

**Step 5: Purchase Record Creation**
```solidity
purchases[contentId][msg.sender] = PurchaseRecord({
    hasPurchased: true,
    purchasePrice: contentPrice,
    purchaseTime: block.timestamp,
    intentId: bytes16(0), // No intent ID for direct purchases
    paymentToken: address(usdcToken),
    actualAmountPaid: contentPrice,
    refundEligible: true,
    refundDeadline: block.timestamp + REFUND_WINDOW // 24 hours
});
```

**Step 6: User Purchase History Update**
```solidity
userPurchases[msg.sender].push(contentId);
userTotalSpent[msg.sender] += contentPrice;
```

**Step 7: Creator Earnings Distribution**
```solidity
// Updates creator earnings in PayPerView contract
creatorEarnings[content.creator] += creatorEarning;
withdrawableEarnings[content.creator] += creatorEarning;

// Updates creator stats in CreatorRegistry (cross-contract call)
creatorRegistry.updateCreatorStats(
    content.creator, 
    creatorEarning,    // earnings increase
    1,                 // content count delta (already exists, so +1 purchase)
    0                  // subscriber delta (not applicable)
);
```

**Step 8: Platform Metrics Update**
```solidity
totalPlatformFees += platformFee;
totalVolume += contentPrice;
totalPurchases++; // Global platform counter
```

**Step 9: Content Registry Purchase Recording**
```solidity
// Records purchase in ContentRegistry for analytics
// This increments the content's purchaseCount
contentRegistry.recordPurchase(contentId, msg.sender);
```

**Step 10: Event Emission**
```solidity
emit DirectPurchaseCompleted(
    contentId,
    msg.sender,           // buyer
    content.creator,      // creator
    contentPrice,         // price paid
    platformFee,          // platform fee
    creatorEarning        // creator earning
);
```

#### State Changes Summary (Direct Payment)
- **PayPerView Contract**: Purchase recorded, earnings tracked, metrics updated
- **ContentRegistry Contract**: Purchase count incremented
- **CreatorRegistry Contract**: Creator earnings and stats updated  
- **USDC Token Contract**: Balance transferred from user to PayPerView
- **User's Purchase History**: Content ID added to owned content list

---

## Payment Path 2: Commerce Protocol Integration Flow

This is the **advanced multi-token payment system** that supports ETH, ERC20 tokens, and includes sophisticated intent-based processing.

### Phase 1: Payment Intent Creation

#### Function: `CommerceProtocolIntegration.createPaymentIntent(PlatformPaymentRequest memory request)`

**Input Parameters:**
```solidity
struct PlatformPaymentRequest {
    PaymentType paymentType;    // PayPerView (0) or Subscription (1)
    address creator;            // Content creator address
    uint256 contentId;          // Content ID to purchase
    address paymentToken;       // Token user wants to pay with (0x0 for ETH)
    uint256 maxSlippage;        // Max acceptable slippage in basis points
    uint256 deadline;           // Payment deadline timestamp
}
```

**Pre-Execution Validations:**
```solidity
// 1. Creator must be registered
require(creatorRegistry.isRegisteredCreator(request.creator), "Creator not registered");

// 2. Content must exist and be active (for PayPerView)
if (request.paymentType == PaymentType.PayPerView) {
    ContentRegistry.Content memory content = contentRegistry.getContent(request.contentId);
    require(content.creator != address(0), "Content not found");
    require(content.isActive, "Content not active");
    require(content.creator == request.creator, "Creator mismatch");
}

// 3. User must not already own the content
require(!payPerView.hasAccess(request.contentId, msg.sender), "Already purchased");

// 4. Deadline must be reasonable
require(request.deadline > block.timestamp, "Deadline in past");
require(request.deadline <= block.timestamp + 7 days, "Deadline too far");
```

**Step-by-Step Intent Creation:**

**Step 1: Payment Amount Calculation**
```solidity
function _calculatePaymentAmounts(PlatformPaymentRequest memory request) 
    internal view returns (uint256 totalAmount, uint256 creatorAmount, uint256 platformFee) {
    
    if (request.paymentType == PaymentType.PayPerView) {
        // Get content price from ContentRegistry
        ContentRegistry.Content memory content = contentRegistry.getContent(request.contentId);
        totalAmount = content.payPerViewPrice; // e.g., 5000000 (5.00 USDC)
    } else {
        // Get subscription price from CreatorRegistry  
        totalAmount = creatorRegistry.getSubscriptionPrice(request.creator);
    }
    
    // Calculate platform fee (typically 3%)
    platformFee = creatorRegistry.calculatePlatformFee(totalAmount);
    creatorAmount = totalAmount - platformFee;
}
```

**Step 2: Payment Token Amount Conversion**
```solidity
function _getExpectedPaymentAmount(address paymentToken, uint256 usdcAmount, uint256 slippageBps) 
    internal returns (uint256) {
    
    if (paymentToken == address(usdcToken)) {
        return usdcAmount; // Direct USDC payment, no conversion needed
    } else if (paymentToken == address(0)) {
        // ETH payment - query PriceOracle for ETH/USDC rate
        uint256 ethAmount = priceOracle.getETHPrice(usdcAmount);
        return priceOracle.applySlippage(ethAmount, slippageBps);
    } else {
        // ERC20 token payment - query PriceOracle for token/USDC rate
        uint256 tokenAmount = priceOracle.getTokenAmountForUSDC(paymentToken, usdcAmount, 0);
        return priceOracle.applySlippage(tokenAmount, slippageBps);
    }
}
```

**Step 3: Intent ID Generation**
```solidity
function _generateStandardIntentId(address user, PlatformPaymentRequest memory request) 
    internal returns (bytes16) {
    
    uint256 nonce = ++userNonces[user]; // Increment user's nonce
    IntentIdManager.IntentType intentType = request.paymentType == PaymentType.PayPerView 
        ? IntentIdManager.IntentType.CONTENT_PURCHASE 
        : IntentIdManager.IntentType.SUBSCRIPTION;
        
    return IntentIdManager.generateIntentId(
        user,
        request.creator, 
        request.contentId,
        intentType,
        nonce,
        address(this)
    );
}
```

**Step 4: Transfer Intent Structure Creation**
```solidity
ICommercePaymentsProtocol.TransferIntent memory intent = ICommercePaymentsProtocol.TransferIntent({
    recipientAmount: creatorAmount,           // Amount creator receives
    deadline: request.deadline,               // Payment deadline
    recipient: payable(request.creator),      // Creator's address
    recipientCurrency: address(usdcToken),    // Creator receives USDC
    refundDestination: msg.sender,            // User gets refunds
    feeAmount: operatorFee,                   // Operator fee amount
    id: intentId,                            // Unique intent identifier
    operator: operatorSigner,                // Authorized signer
    signature: new bytes(0),                 // Empty, will be filled later
    prefix: new bytes(0),                    // Commerce protocol prefix
    sender: msg.sender,                      // User initiating payment
    token: request.paymentToken              // Token user pays with
});
```

**Step 5: Payment Context Creation**
```solidity
PaymentContext memory context = PaymentContext({
    paymentType: request.paymentType,
    user: msg.sender,
    creator: request.creator,
    contentId: request.contentId,
    platformFee: platformFee,
    creatorAmount: creatorAmount,
    operatorFee: operatorFee,
    timestamp: block.timestamp,
    processed: false,                        // Will be true after completion
    paymentToken: request.paymentToken,
    expectedAmount: expectedAmount,
    intentId: intentId
});
```

**Step 6: Intent Finalization & Storage**
```solidity
// Store payment context for later processing
paymentContexts[intentId] = context;
intentDeadlines[intentId] = request.deadline;

// Initialize intent state
intentReadyForExecution[intentId] = false;
processedIntents[intentId] = false;

// Update platform metrics
totalIntentsCreated++;
```

**Step 7: Signature Preparation**
```solidity
function _prepareIntentForSigning(ICommercePaymentsProtocol.TransferIntent memory intent) 
    internal returns (bytes32 intentHash) {
    
    // Create EIP-712 structured hash
    bytes32 structHash = keccak256(abi.encode(
        TRANSFER_INTENT_TYPEHASH,
        intent.recipientAmount,
        intent.deadline,
        intent.recipient,
        intent.recipientCurrency,
        intent.refundDestination,
        intent.feeAmount,
        intent.id,
        intent.operator
    ));
    
    intentHash = _hashTypedDataV4(structHash);
    intentHashes[intent.id] = intentHash;
    
    // Emit event for backend signing service
    emit IntentReadyForSigning(intent.id, intentHash, intent.deadline);
}
```

**Step 8: Event Emission**
```solidity
emit PaymentIntentCreated(
    intentId,
    msg.sender,                // user
    request.creator,           // creator
    request.paymentType,       // payment type
    totalAmount,               // total amount in USDC
    creatorAmount,             // creator earnings
    platformFee,               // platform fee
    operatorFee,               // operator fee  
    request.paymentToken,      // payment token
    expectedAmount             // expected payment amount
);
```

**Return Values:**
```solidity
return (intent, context);
```

### Phase 2: Intent Signing & Execution

#### Function: `CommerceProtocolIntegration.provideIntentSignature(bytes16 intentId, bytes memory signature)`

**Access Control:** Only addresses with `SIGNER_ROLE` (operator signer) can call this function.

**Signature Validation Process:**
```solidity
// 1. Verify intent exists and isn't already signed
require(intentHashes[intentId] != bytes32(0), "Intent not found");
require(!intentReadyForExecution[intentId], "Already signed");

// 2. Recover signer from signature
bytes32 intentHash = intentHashes[intentId];
address recoveredSigner = _recoverSigner(intentHash, signature);

// 3. Verify signer is authorized
require(authorizedSigners[recoveredSigner], "Invalid signer");

// 4. Store signature and mark ready for execution
intentSignatures[intentId] = signature;
intentReadyForExecution[intentId] = true;

emit IntentSigned(intentId, signature);
```

#### Function: `CommerceProtocolIntegration.executePaymentWithSignature(bytes16 intentId)`

**Access Control:** Any user can call this, but must provide valid signed intent.

**Execution Process:**
```solidity
// 1. Validate intent is ready for execution
require(intentReadyForExecution[intentId], "Intent not ready");
require(block.timestamp <= intentDeadlines[intentId], "Intent expired");

// 2. Retrieve stored signature
bytes memory signature = intentSignatures[intentId];
require(signature.length > 0, "No signature available");

// 3. Create final transfer intent with signature
ICommercePaymentsProtocol.TransferIntent memory intent = /* reconstruct intent */;
intent.signature = signature;

// 4. Emit execution event
emit IntentReadyForExecution(intentId, signature);

return intent;
```

### Phase 3: Payment Completion Processing

#### Function: `CommerceProtocolIntegration.processCompletedPayment(...)`

**Access Control:** Only addresses with `PAYMENT_MONITOR_ROLE` can call this function.

**Parameters:**
```solidity
function processCompletedPayment(
    bytes16 intentId,           // Intent that was executed
    address user,               // User who paid
    address paymentToken,       // Token used for payment
    uint256 amountPaid,         // Actual amount paid by user
    bool success,               // Whether payment succeeded
    string memory failureReason // Reason if payment failed
) external onlyRole(PAYMENT_MONITOR_ROLE)
```

**Success Flow Processing:**

**Step 1: Intent Validation & Retrieval**
```solidity
// Prevent double processing
require(!processedIntents[intentId], "Already processed");

// Get stored payment context
PaymentContext storage context = paymentContexts[intentId];
require(context.user != address(0), "Payment context not found");

// Validate payment type
require(uint8(context.paymentType) <= uint8(PaymentType.Donation), "Invalid payment type");

// Check expiration
require(block.timestamp <= intentDeadlines[intentId], "Intent expired");
```

**Step 2: Mark as Processed**
```solidity
processedIntents[intentId] = true;
context.processed = true;
```

**Step 3: Delegate to Appropriate Handler**
```solidity
if (success) {
    _handleSuccessfulPayment(context, intentId, paymentToken, amountPaid);
} else {
    _handleFailedPayment(intentId, context, failureReason);
}
```

**Step 4: Successful Payment Processing**
```solidity
function _handleSuccessfulPayment(
    PaymentContext memory context,
    bytes16 intentId,
    address paymentToken,
    uint256 amountPaid
) internal {
    
    if (context.paymentType == PaymentType.PayPerView) {
        // Delegate to PayPerView contract for purchase recording
        payPerView.recordExternalPurchase(
            context.contentId,      // content ID
            context.user,           // buyer
            intentId,               // intent ID
            context.creatorAmount + context.platformFee, // USDC price
            paymentToken,           // payment token used
            amountPaid              // actual amount paid
        );
    } else if (context.paymentType == PaymentType.Subscription) {
        // Delegate to SubscriptionManager for subscription recording
        subscriptionManager.recordSubscriptionPayment(
            context.user,           // subscriber
            context.creator,        // creator
            intentId,               // intent ID  
            context.creatorAmount + context.platformFee, // USDC price
            paymentToken,           // payment token used
            amountPaid              // actual amount paid
        );
    }
}
```

**Step 5: PayPerView External Purchase Recording**

When `PayPerView.recordExternalPurchase()` is called:

```solidity
function recordExternalPurchase(
    uint256 contentId,
    address buyer, 
    bytes16 intentId,
    uint256 usdcPrice,
    address paymentToken,
    uint256 actualAmountPaid
) external onlyRole(PAYMENT_PROCESSOR_ROLE) {
    
    // Validate intent ID format
    require(IntentIdManager.isValidIntentId(intentId), "Invalid intent ID format");
    
    // Get content details
    ContentRegistry.Content memory content = contentRegistry.getContent(contentId);
    require(content.creator != address(0), "Content not found");
    require(content.isActive, "Content not active");
    require(_canPurchaseContent(contentId, buyer), "Cannot purchase");
    
    // Create purchase record
    purchases[contentId][buyer] = PurchaseRecord({
        hasPurchased: true,
        purchasePrice: usdcPrice,
        purchaseTime: block.timestamp,
        intentId: intentId,
        paymentToken: paymentToken,
        actualAmountPaid: actualAmountPaid,
        refundEligible: true,
        refundDeadline: block.timestamp + REFUND_WINDOW
    });
    
    // Update user purchase history
    userPurchases[buyer].push(contentId);
    userTotalSpent[buyer] += usdcPrice;
    
    // Calculate and distribute earnings
    uint256 platformFee = creatorRegistry.calculatePlatformFee(usdcPrice);
    uint256 creatorEarning = usdcPrice - platformFee;
    
    creatorEarnings[content.creator] += creatorEarning;
    withdrawableEarnings[content.creator] += creatorEarning;
    
    // Update platform metrics
    totalPlatformFees += platformFee;
    totalVolume += usdcPrice;
    totalPurchases++;
    
    // Record purchase in ContentRegistry
    contentRegistry.recordPurchase(contentId, buyer);
    
    // Update creator stats
    creatorRegistry.updateCreatorStats(content.creator, creatorEarning, 1, 0);
    
    emit ExternalPurchaseRecorded(contentId, buyer, intentId, usdcPrice, paymentToken, actualAmountPaid);
}
```

**Step 6: Final Event Emission**
```solidity
emit PaymentCompleted(
    intentId,
    user,
    context.creator,
    context.paymentType,
    context.contentId,
    paymentToken,
    amountPaid,
    success
);
```

---

## Cross-Contract Communication Flow

### ContentRegistry.recordPurchase() 

**Access Control:** Only addresses with `PURCHASE_RECORDER_ROLE` can call this.

**Function Implementation:**
```solidity
function recordPurchase(uint256 contentId, address buyer) 
    external onlyRole(PURCHASE_RECORDER_ROLE) {
    
    // Validate content exists
    require(contentId > 0 && contentId < nextContentId, "Invalid content ID");
    
    // Increment purchase count
    contents[contentId].purchaseCount++;
    
    // Add buyer to purchaser list for analytics
    contentPurchasers[contentId].push(buyer);
    
    emit ContentPurchased(
        contentId,
        buyer, 
        contents[contentId].payPerViewPrice,
        block.timestamp
    );
}
```

### CreatorRegistry.updateCreatorStats()

**Access Control:** Only addresses with `PLATFORM_CONTRACT_ROLE` can call this.

**Function Implementation:**
```solidity
function updateCreatorStats(
    address creator,
    uint256 earnings,        // Additional earnings to add
    int256 contentDelta,     // Change in content count (+1 for new purchase tracking)
    int256 subscriberDelta   // Change in subscriber count (0 for content purchases)
) external onlyRole(PLATFORM_CONTRACT_ROLE) {
    
    Creator storage creatorData = creators[creator];
    require(creatorData.isRegistered, "Creator not registered");
    
    // Update earnings
    creatorData.totalEarnings += earnings;
    creatorPendingEarnings[creator] += earnings;
    
    // Update content count (if applicable)
    if (contentDelta != 0) {
        creatorData.contentCount = uint256(int256(creatorData.contentCount) + contentDelta);
    }
    
    // Update subscriber count (if applicable) 
    if (subscriberDelta != 0) {
        creatorData.subscriberCount = uint256(int256(creatorData.subscriberCount) + subscriberDelta);
    }
    
    // Update platform totals
    totalCreatorEarnings += earnings;
    
    emit CreatorEarningsUpdated(creator, earnings, "Payment completed");
}
```

### CreatorRegistry.calculatePlatformFee()

**Access Control:** Public view function, no restrictions.

**Function Implementation:**
```solidity
function calculatePlatformFee(uint256 amount) external view returns (uint256) {
    // Platform fee is typically 3% (300 basis points)
    // fee = amount * platformFee / 10000
    // Example: 5000000 * 300 / 10000 = 150000 (0.15 USDC)
    return (amount * platformFee) / 10000;
}
```

---

## Error Handling & Validation

### Common Error Conditions

#### Content Validation Errors
```solidity
error InvalidContentId();           // Content doesn't exist
error ContentNotActive();           // Content deactivated by creator/moderator  
error CreatorNotRegistered();       // Creator not in registry
error CreatorSuspended();           // Creator account suspended
```

#### Payment Validation Errors
```solidity
error InsufficientBalance();        // User lacks required tokens
error InsufficientAllowance();      // User hasn't approved enough spending
error PurchaseAlreadyCompleted();   // User already owns this content
error IntentAlreadyProcessed();     // Payment intent already handled
error IntentExpired();              // Payment deadline passed
error InvalidSignature();          // Signature verification failed
```

#### Access Control Errors
```solidity
error UnauthorizedCreator();        // Caller isn't registered creator
error UnauthorizedSigner();         // Invalid operator signer
error PaymentContextNotFound();     // Intent context missing
```

### Validation Checkpoints

**Pre-Purchase Validations:**
1. Content exists and is active
2. Creator is registered and not suspended  
3. User doesn't already own content
4. User has sufficient balance/allowance
5. Payment deadline hasn't passed

**Mid-Process Validations:**
1. Intent hasn't been processed already
2. Signature is valid and from authorized signer
3. Payment amounts match expected values
4. Token transfers complete successfully

**Post-Purchase Validations:** 
1. Purchase records are created correctly
2. Earnings are distributed properly
3. Platform metrics are updated
4. Cross-contract calls succeed

---

## Gas Optimization Strategies

### Direct Payment Path Gas Usage
- **Estimated Gas:** ~200,000-250,000 gas
- **Primary Costs:** USDC transfer, storage writes, cross-contract calls

### Commerce Protocol Path Gas Usage  
- **Intent Creation:** ~150,000-200,000 gas
- **Signature Provision:** ~50,000-75,000 gas
- **Execution:** ~100,000-150,000 gas  
- **Completion:** ~200,000-300,000 gas
- **Total:** ~500,000-725,000 gas across multiple transactions

### Optimization Techniques Used
1. **Packed Structs:** Minimize storage slots
2. **Batch Operations:** Update multiple values in single transaction
3. **Event Over Storage:** Use events for historical data when possible
4. **Efficient Mappings:** Optimize key structures for gas efficiency

---

## Frontend Integration Guide

### Direct Payment Implementation
```typescript
// 1. Check if user has access
const hasAccess = await payPerViewContract.read.hasAccess([contentId, userAddress]);
if (hasAccess) return; // User already owns content

// 2. Get content details and calculate total cost
const content = await contentRegistryContract.read.getContent([contentId]);
const totalCost = content.payPerViewPrice;

// 3. Check user balance
const userBalance = await usdcContract.read.balanceOf([userAddress]);
if (userBalance < totalCost) throw new Error('Insufficient balance');

// 4. Check and approve allowance if needed
const allowance = await usdcContract.read.allowance([userAddress, payPerViewAddress]);
if (allowance < totalCost) {
    await usdcContract.write.approve([payPerViewAddress, totalCost]);
}

// 5. Execute direct purchase
await payPerViewContract.write.purchaseContentDirect([contentId]);
```

### Commerce Protocol Implementation
```typescript
// 1. Create payment intent
const paymentRequest = {
    paymentType: 0, // PayPerView
    creator: content.creator,
    contentId: contentId,
    paymentToken: selectedToken, // ETH = 0x0, other tokens = address
    maxSlippage: 500, // 5%
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
};

const { intent, context } = await commerceIntegrationContract.write.createPaymentIntent([paymentRequest]);

// 2. Wait for signature (backend process)
const checkSignature = async () => {
    const hasSignature = await commerceIntegrationContract.read.hasSignature([intent.id]);
    return hasSignature;
};

// 3. Execute when signature is ready
if (await checkSignature()) {
    const signedIntent = await commerceIntegrationContract.write.executePaymentWithSignature([intent.id]);
    
    // 4. Backend monitors and calls processCompletedPayment when commerce protocol confirms
}
```

---

## Security Considerations

### Access Control Hierarchy
1. **Platform Owner:** Can pause contracts, update fees, grant roles
2. **Payment Monitor:** Can process completed payments, handle refunds
3. **Operator Signer:** Can sign payment intents for commerce protocol
4. **Content Creators:** Can register content, update prices, withdraw earnings

### Critical Security Measures
1. **Reentrancy Protection:** All payment functions use `nonReentrant` modifier
2. **Intent Expiration:** All payment intents have deadlines to prevent stale transactions
3. **Signature Verification:** EIP-712 structured signatures prevent replay attacks
4. **Amount Validation:** Payment amounts are validated within acceptable variance
5. **Role-Based Access:** Functions are restricted to authorized callers only

### Emergency Procedures
1. **Pause Functionality:** All contracts can be paused to halt operations
2. **Token Recovery:** Emergency withdrawal of accidentally sent tokens
3. **Intent Cancellation:** Expired intents are automatically invalid
4. **Refund Processing:** Failed payments can be refunded through authorized channels

---

## Analytics & Monitoring

### Platform Metrics Tracked
- Total purchases count
- Total volume in USDC
- Platform fees collected
- Creator earnings distributed
- Active content count
- User purchase history

### Per-Content Analytics
- Purchase count
- Revenue generated  
- Creator earnings
- Purchase timestamps
- User demographics

### Per-Creator Analytics
- Total earnings
- Content count
- Purchase volume
- Subscriber metrics
- Verification status

### Per-User Analytics
- Purchase history
- Total spent
- Refund history
- Access tokens owned

---

## Maintenance & Monitoring

### Regular Operations
1. **Signature Service:** Ensure operator signer is responding to intent signing requests
2. **Payment Monitoring:** Process completed payments from commerce protocol
3. **Refund Processing:** Handle legitimate refund requests within refund windows
4. **Analytics Aggregation:** Collect and analyze platform metrics

### Health Checks
1. **Contract Paused Status:** Ensure contracts are not unexpectedly paused
2. **Role Assignments:** Verify all required roles are properly assigned
3. **Balance Monitoring:** Check contract token balances for irregularities
4. **Gas Price Tracking:** Monitor transaction costs for users

This comprehensive guide covers every aspect of your content purchase payment flows. Use it as your definitive reference for understanding how payments move through your platform, what functions to call from your frontend, and how the various contracts coordinate to provide a seamless user experience.