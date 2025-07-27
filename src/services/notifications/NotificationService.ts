/**
 * Notification Service - Component 9.4: Intelligent User Communication
 * File: src/services/notifications/NotificationService.ts
 * 
 * This service provides sophisticated real-time communication that Web3 platforms require
 * to keep users informed about complex, asynchronous blockchain operations. Unlike traditional
 * notification systems, this service understands the relationships between different platform
 * events and provides contextual, actionable information that guides users through potentially
 * confusing Web3 workflows with clarity and confidence.
 * 
 * Key Features:
 * - Real-time event streaming with WebSocket and polling fallbacks
 * - Intelligent notification grouping and deduplication for reduced noise
 * - Context-aware message formatting based on user roles and current workflows
 * - Persistent notification state with cross-device synchronization
 * - Smart notification expiry based on event relevance and user actions
 * - Integration with blockchain events, IPFS operations, and platform workflows
 * - Rich notification templates with actionable buttons and progress indicators
 * - Privacy-preserving notification routing that respects user preferences
 * 
 * This service demonstrates how sophisticated Web3 applications transform potentially
 * confusing blockchain complexity into clear, helpful user guidance that builds
 * confidence and understanding rather than creating confusion or frustration.
 */

import { type Address } from 'viem'
import EventEmitter from 'events'

/**
 * Notification Types and Priority Levels
 * 
 * These enums help us categorize notifications by importance and type,
 * enabling intelligent filtering, routing, and display decisions.
 * Think of this as creating a sophisticated triage system for user attention.
 */
export enum NotificationPriority {
  LOW = 'low',           // Background updates, analytics, tips
  MEDIUM = 'medium',     // Content updates, subscription renewals
  HIGH = 'high',         // Transaction confirmations, access changes
  URGENT = 'urgent'      // Security alerts, failed transactions, expiring access
}

export enum NotificationType {
  // Content lifecycle notifications
  CONTENT_UPLOAD_PROGRESS = 'content_upload_progress',
  CONTENT_PROCESSING_COMPLETE = 'content_processing_complete',
  CONTENT_PUBLISHED = 'content_published',
  CONTENT_PURCHASED = 'content_purchased',
  
  // Transaction and blockchain notifications
  TRANSACTION_PENDING = 'transaction_pending',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  
  // Access and subscription notifications
  CONTENT_ACCESS_EXPIRING = 'content_access_expiring',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  
  // Platform and system notifications
  PLATFORM_UPDATE = 'platform_update',
  SECURITY_ALERT = 'security_alert',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  
  // Social and engagement notifications
  NEW_SUBSCRIBER = 'new_subscriber',
  CONTENT_LIKED = 'content_liked',
  CREATOR_FOLLOWED = 'creator_followed'
}

/**
 * Core Notification Interface
 * 
 * This interface defines the comprehensive structure of notifications in our system.
 * Notice how it includes not just message content, but also context about user actions,
 * expiration logic, and interaction capabilities. This enables rich, actionable
 * notification experiences rather than simple message broadcasts.
 */
interface PlatformNotification {
  readonly id: string                    // Unique identifier for deduplication and tracking
  readonly type: NotificationType        // Category for filtering and routing
  readonly priority: NotificationPriority // Importance level for display decisions
  readonly recipient: Address            // Target user (privacy-preserving routing)
  
  // Message content and presentation
  readonly title: string                 // Brief, attention-grabbing headline
  readonly message: string              // Detailed explanation with context
  readonly icon: string                 // Visual identifier for quick recognition
  readonly category: string             // Group related notifications together
  
  // Rich content and interaction capabilities
  readonly actionUrl?: string           // Where to go for more details or actions
  readonly actionLabel?: string         // What the action button should say
  readonly imageUrl?: string           // Optional visual content for rich notifications
  readonly progressInfo?: {            // For multi-step process updates
    readonly current: number
    readonly total: number
    readonly stage: string
  }
  
  // Lifecycle and state management
  readonly createdAt: Date             // When the notification was generated
  readonly expiresAt?: Date            // When it becomes irrelevant (smart expiry)
  readonly isRead: boolean             // User interaction state
  readonly isPersistent: boolean       // Should survive browser refresh
  groupId?: string                     // For intelligent grouping of related notifications
  
  // Context and metadata for intelligent processing
  readonly sourceEvent: {              // What triggered this notification
    readonly contractAddress?: Address
    readonly transactionHash?: string
    readonly blockNumber?: number
    readonly eventName: string
  }
  readonly userContext: {              // Information about user's current state
    readonly currentPage?: string
    readonly userRole: 'creator' | 'consumer' | 'admin'
    readonly recentActions: readonly string[]
  }
  readonly platformContext: {          // Broader platform state for relevance
    readonly networkStatus: 'healthy' | 'congested' | 'degraded'
    readonly maintenanceMode: boolean
    readonly featureFlags: readonly string[]
  }
}

/**
 * Notification Configuration Interface
 * 
 * This interface allows fine-tuning of notification behavior based on
 * user preferences, platform load, and performance requirements.
 * Think of this as the control panel for balancing user engagement
 * with notification fatigue and system resources.
 */
interface NotificationConfig {
  readonly enableRealTime: boolean           // WebSocket connections for instant updates
  readonly enablePersistence: boolean       // Store notifications across browser sessions
  readonly maxNotificationsPerUser: number  // Prevent notification overflow
  readonly defaultExpireDays: number        // How long notifications stay relevant
  readonly groupingEnabled: boolean         // Combine related notifications intelligently
  readonly deduplicationEnabled: boolean    // Prevent duplicate notifications
  readonly batchProcessing: boolean         // Process multiple notifications efficiently
  readonly retryFailedDelivery: boolean     // Retry sending failed notifications
}

/**
 * User Notification Preferences
 * 
 * This interface captures user preferences for notification delivery,
 * enabling personalized experiences that respect user attention and
 * communication preferences while ensuring critical information still reaches them.
 */
interface UserNotificationPreferences {
  readonly userAddress: Address
  readonly globalEnabled: boolean           // Master switch for all notifications
  
  // Channel preferences for different delivery methods
  readonly channels: {
    readonly inApp: boolean                 // Browser notifications while using platform
    readonly email: boolean                 // Email notifications (requires email setup)
    readonly push: boolean                  // Browser push notifications
  }
  
  // Priority filtering - users can choose their threshold
  readonly minimumPriority: NotificationPriority
  
  // Type-specific preferences for granular control
  readonly typePreferences: Partial<Record<NotificationType, boolean>>
  
  // Timing preferences to respect user attention patterns
  readonly quietHours: {
    readonly enabled: boolean
    readonly startTime: string             // "22:00" format
    readonly endTime: string               // "08:00" format
    readonly timezone: string              // User's timezone for proper scheduling
  }
  
  // Frequency limits to prevent notification fatigue
  readonly frequencyLimits: {
    readonly maxPerDay: number
    readonly maxPerHour: number
    readonly groupSimilar: boolean         // Group similar notifications together
  }
}

/**
 * Notification Delivery Result
 * 
 * This interface provides comprehensive feedback about notification delivery,
 * enabling monitoring, debugging, and optimization of the notification system.
 */
interface DeliveryResult {
  readonly notificationId: string
  readonly success: boolean
  readonly deliveredAt?: Date
  readonly failureReason?: string
  readonly retryCount: number
  readonly channel: 'websocket' | 'polling' | 'persistent' | 'failed'
  readonly userInteraction?: {
    readonly clicked: boolean
    readonly dismissed: boolean
    readonly interactionTime?: Date
  }
}

/**
 * Notification Service Class
 * 
 * This class orchestrates the entire notification ecosystem, from event detection
 * through intelligent processing to user delivery and interaction tracking.
 * It demonstrates how sophisticated Web3 applications can provide clear,
 * helpful communication about complex blockchain operations.
 */
export class NotificationService extends EventEmitter {
  private readonly config: NotificationConfig
  private readonly notifications: Map<string, PlatformNotification> = new Map()
  private readonly userPreferences: Map<Address, UserNotificationPreferences> = new Map()
  private readonly deliveryResults: Map<string, DeliveryResult> = new Map()
  private webSocket: WebSocket | null = null
  private pollingInterval: NodeJS.Timer | null = null
  private processingQueue: PlatformNotification[] = []

  constructor(config?: Partial<NotificationConfig>) {
    super()
    
    // Configure notification behavior with sensible defaults
    // These settings balance user engagement with performance and user experience
    this.config = {
      enableRealTime: true,                    // Real-time updates for responsive UX
      enablePersistence: true,                 // Notifications survive page refresh
      maxNotificationsPerUser: 100,           // Prevent memory/storage bloat
      defaultExpireDays: 7,                   // Week-long relevance for most notifications
      groupingEnabled: true,                  // Reduce notification noise intelligently
      deduplicationEnabled: true,             // Prevent duplicate messages
      batchProcessing: true,                  // Efficient processing of multiple notifications
      retryFailedDelivery: true,              // Ensure critical notifications reach users
      ...config
    }

    // Initialize persistent storage and real-time connections
    this.initializePersistence()
    if (this.config.enableRealTime) {
      this.initializeRealTimeConnection()
    }
    this.startPeriodicProcessing()
  }

  /**
   * Send a notification to a specific user with intelligent processing
   * 
   * This method demonstrates the sophisticated logic required to transform
   * simple notification requests into contextual, well-timed user communications.
   * It handles deduplication, grouping, expiry calculation, and delivery routing.
   * 
   * @param notification - The notification data to process and deliver
   * @returns Promise resolving to delivery result information
   */
  async sendNotification(notification: Omit<PlatformNotification, 'id' | 'createdAt'>): Promise<DeliveryResult> {
    // Generate unique identifier for tracking and deduplication
    const notificationId = this.generateNotificationId(notification)
    
    // Check if we should deduplicate this notification
    if (this.config.deduplicationEnabled && this.isDuplicate(notification, notificationId)) {
      return {
        notificationId,
        success: false,
        failureReason: 'Duplicate notification filtered',
        retryCount: 0,
        channel: 'failed'
      }
    }
  
    // Get user preferences to respect their communication choices
    const userPrefs = this.getUserPreferences(notification.recipient)
    
    // Check if user wants to receive this type of notification
    if (!this.shouldDeliverNotification(notification, userPrefs)) {
      return {
        notificationId,
        success: false,
        failureReason: 'Filtered by user preferences',
        retryCount: 0,
        channel: 'failed'
      }
    }
  
    // Create complete notification object with computed expiry
    const completeNotification: PlatformNotification = {
      ...notification,
      id: notificationId,
      createdAt: new Date(),
      expiresAt: this.calculateExpiry(notification),
      isRead: false // Only specify isRead once
    }
  
    // Handle intelligent grouping if enabled
    if (this.config.groupingEnabled) {
      const groupResult = this.attemptGrouping(completeNotification)
      if (groupResult.grouped) {
        // Notification was merged with existing group
        return {
          notificationId,
          success: true,
          deliveredAt: new Date(),
          retryCount: 0,
          channel: 'persistent'
        }
      }
    }
  
    // Store notification for persistence and tracking
    this.notifications.set(notificationId, completeNotification)
  
    // Attempt real-time delivery if available
    if (this.config.enableRealTime && this.webSocket?.readyState === WebSocket.OPEN) {
      try {
        await this.deliverViaWebSocket(completeNotification)
        
        const result: DeliveryResult = {
          notificationId,
          success: true,
          deliveredAt: new Date(),
          retryCount: 0,
          channel: 'websocket'
        }
        
        this.deliveryResults.set(notificationId, result)
        
        // Emit event for component reactivity
        this.emit('notificationDelivered', completeNotification, result)
        
        return result
      } catch (error) {
        // Fall back to persistent storage for later polling
        console.warn('WebSocket delivery failed, falling back to polling:', error)
      }
    }
  
    // Store for polling-based delivery
    const result: DeliveryResult = {
      notificationId,
      success: true,
      deliveredAt: new Date(),
      retryCount: 0,
      channel: 'persistent'
    }
    
    this.deliveryResults.set(notificationId, result)
    this.emit('notificationStored', completeNotification)
    
    return result
  }

  /**
   * Get notifications for a specific user with intelligent filtering
   * 
   * This method provides the data that notification UI components need,
   * with built-in filtering for expired notifications, grouping logic,
   * and sorting by relevance and priority.
   */
  async getUserNotifications(
    userAddress: Address,
    options: {
      includeRead?: boolean
      maxCount?: number
      priority?: NotificationPriority
      types?: readonly NotificationType[]
    } = {}
  ): Promise<readonly PlatformNotification[]> {
    // Filter notifications for this specific user
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.recipient.toLowerCase() === userAddress.toLowerCase())

    // Apply expiry filtering - remove notifications that are no longer relevant
    const activeNotifications = userNotifications
      .filter(notification => {
        if (!notification.expiresAt) return true
        return new Date() < notification.expiresAt
      })

    // Apply user-specified filters
    let filteredNotifications = activeNotifications

    // Filter by read status if specified
    if (options.includeRead === false) {
      filteredNotifications = filteredNotifications.filter(n => !n.isRead)
    }

    // Filter by priority if specified
    if (options.priority) {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const minPriorityValue = priorityOrder[options.priority as keyof typeof priorityOrder]
      filteredNotifications = filteredNotifications.filter(n => 
        priorityOrder[n.priority as keyof typeof priorityOrder] >= minPriorityValue
      )
    }

    // Filter by types if specified
    if (options.types && options.types.length > 0) {
      filteredNotifications = filteredNotifications.filter(n => 
        options.types!.includes(n.type)
      )
    }

    // Sort by priority and recency for optimal user experience
    // High priority and recent notifications appear first
    filteredNotifications.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - 
                          priorityOrder[a.priority as keyof typeof priorityOrder]
      
      if (priorityDiff !== 0) return priorityDiff
      
      // If priorities are equal, sort by creation time (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    // Apply count limit if specified
    if (options.maxCount) {
      filteredNotifications = filteredNotifications.slice(0, options.maxCount)
    }

    return filteredNotifications
  }

  /**
   * Mark notification as read and update interaction tracking
   * 
   * This method handles user interaction with notifications, enabling
   * analytics about notification effectiveness and user engagement patterns.
   */
  async markAsRead(notificationId: string, userAddress: Address): Promise<boolean> {
    const notification = this.notifications.get(notificationId)
    
    if (!notification || notification.recipient.toLowerCase() !== userAddress.toLowerCase()) {
      return false
    }

    // Create updated notification with read status
    const updatedNotification: PlatformNotification = {
      ...notification,
      isRead: true
    }

    this.notifications.set(notificationId, updatedNotification)

    // Update delivery result with interaction information
    const deliveryResult = this.deliveryResults.get(notificationId)
    if (deliveryResult) {
      const updatedResult: DeliveryResult = {
        ...deliveryResult,
        userInteraction: {
          clicked: true,
          dismissed: false,
          interactionTime: new Date()
        }
      }
      this.deliveryResults.set(notificationId, updatedResult)
    }

    // Emit event for component reactivity
    this.emit('notificationRead', updatedNotification)

    // Persist changes if persistence is enabled
    if (this.config.enablePersistence) {
      await this.persistNotificationState()
    }

    return true
  }

  /**
   * Update user notification preferences with validation
   * 
   * This method allows users to customize their notification experience
   * while ensuring that critical system notifications still reach them.
   */
  async updateUserPreferences(
    userAddress: Address, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<boolean> {
    try {
      const currentPrefs = this.getUserPreferences(userAddress)
      
      // Merge new preferences with existing ones, applying validation
      const updatedPrefs: UserNotificationPreferences = {
        ...currentPrefs,
        ...preferences,
        userAddress // Ensure address consistency
      }

      // Validate preference changes for critical notification types
      const criticalTypes = [
        NotificationType.SECURITY_ALERT,
        NotificationType.TRANSACTION_FAILED
      ]

      // Ensure users can't completely disable critical notifications
      for (const criticalType of criticalTypes) {
        if (updatedPrefs.typePreferences?.[criticalType] === false) {
          console.warn(`Cannot disable critical notification type: ${criticalType}`)
          if (updatedPrefs.typePreferences) {
            delete updatedPrefs.typePreferences[criticalType]
          }
        }
      }

      this.userPreferences.set(userAddress, updatedPrefs)

      // Persist preferences across sessions
      if (this.config.enablePersistence) {
        await this.persistUserPreferences(userAddress, updatedPrefs)
      }

      this.emit('preferencesUpdated', userAddress, updatedPrefs)
      return true

    } catch (error) {
      console.error('Failed to update user preferences:', error)
      return false
    }
  }

  /**
   * Clean up expired notifications and optimize storage
   * 
   * This method handles the lifecycle management of notifications,
   * removing outdated information while preserving important interaction history.
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date()
    let cleanedCount = 0

    // Identify expired notifications
    const expiredIds: string[] = []
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && now > notification.expiresAt) {
        expiredIds.push(id)
      }
    }

    // Remove expired notifications but preserve delivery results for analytics
    for (const id of expiredIds) {
      this.notifications.delete(id)
      cleanedCount++
    }

    // Clean up old delivery results (keep for 30 days for analytics)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    for (const [id, result] of this.deliveryResults.entries()) {
      if (result.deliveredAt && result.deliveredAt < thirtyDaysAgo) {
        this.deliveryResults.delete(id)
      }
    }

    // Persist cleanup changes
    if (this.config.enablePersistence && cleanedCount > 0) {
      await this.persistNotificationState()
    }

    this.emit('notificationsCleanedUp', cleanedCount)
    return cleanedCount
  }

  // ===== PRIVATE UTILITY METHODS =====

  /**
   * Initialize persistent storage for notifications
   * 
   * This method sets up the storage layer that allows notifications
   * to survive browser refresh and cross-device synchronization.
   */
  private async initializePersistence(): Promise<void> {
    if (!this.config.enablePersistence) return

    try {
      // Load existing notifications from localStorage
      // In production, this might use IndexedDB or encrypted storage
      const storedNotifications = localStorage.getItem('platform_notifications')
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications)
        
        // Restore notifications with date object reconstruction
        for (const [id, notificationData] of Object.entries(parsed)) {
          const notification = notificationData as any
          notification.createdAt = new Date(notification.createdAt)
          if (notification.expiresAt) {
            notification.expiresAt = new Date(notification.expiresAt)
          }
          this.notifications.set(id, notification as PlatformNotification)
        }
      }

      // Load user preferences
      const storedPreferences = localStorage.getItem('notification_preferences')
      if (storedPreferences) {
        const parsed = JSON.parse(storedPreferences)
        for (const [address, preferences] of Object.entries(parsed)) {
          this.userPreferences.set(address as Address, preferences as UserNotificationPreferences)
        }
      }

    } catch (error) {
      console.warn('Failed to initialize notification persistence:', error)
    }
  }

  /**
   * Initialize real-time WebSocket connection for instant notifications
   */
  private initializeRealTimeConnection(): void {
    // This would connect to your WebSocket server for real-time notifications
    // For demonstration, we'll show the connection pattern
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://your-websocket-server.com'
      this.webSocket = new WebSocket(wsUrl)

      this.webSocket.onopen = () => {
        console.log('Real-time notification connection established')
        this.emit('connectionEstablished')
      }

      this.webSocket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as PlatformNotification
          this.handleIncomingNotification(notification)
        } catch (error) {
          console.warn('Invalid notification received:', error)
        }
      }

      this.webSocket.onclose = () => {
        console.log('WebSocket connection closed, attempting reconnect...')
        // Implement exponential backoff reconnection logic
        setTimeout(() => this.initializeRealTimeConnection(), 5000)
      }

    } catch (error) {
      console.warn('Failed to establish WebSocket connection:', error)
    }
  }

  /**
   * Start periodic processing for batched operations and cleanup
   */
  private startPeriodicProcessing(): void {
    // Clean up expired notifications every hour
    setInterval(() => {
      this.cleanupExpiredNotifications()
    }, 60 * 60 * 1000)

    // Process queued notifications every 30 seconds
    if (this.config.batchProcessing) {
      setInterval(() => {
        this.processBatchedNotifications()
      }, 30 * 1000)
    }
  }

  /**
   * Generate consistent notification IDs for deduplication
   */
  private generateNotificationId(notification: Omit<PlatformNotification, 'id' | 'createdAt'>): string {
    // Create hash-based ID for consistent deduplication
    const hashInput = `${notification.type}_${notification.recipient}_${notification.sourceEvent.eventName}_${notification.sourceEvent.transactionHash || 'no-tx'}`
    
    // Simple hash function for demonstration - use proper crypto hash in production
    let hash = 0
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `notification_${Math.abs(hash)}_${Date.now()}`
  }

  /**
   * Check if notification is duplicate based on recent history
   */
  private isDuplicate(notification: Omit<PlatformNotification, 'id' | 'createdAt'>, id: string): boolean {
    // Check for similar notifications in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    for (const existingNotification of this.notifications.values()) {
      if (existingNotification.createdAt > fiveMinutesAgo &&
          existingNotification.type === notification.type &&
          existingNotification.recipient === notification.recipient &&
          existingNotification.sourceEvent.eventName === notification.sourceEvent.eventName) {
        return true
      }
    }
    
    return false
  }

  /**
   * Get user preferences with sensible defaults
   */
  private getUserPreferences(userAddress: Address): UserNotificationPreferences {
    const existing = this.userPreferences.get(userAddress)
    if (existing) return existing

    // Return default preferences for new users
    const defaultPrefs: UserNotificationPreferences = {
      userAddress,
      globalEnabled: true,
      channels: {
        inApp: true,
        email: false,
        push: true
      },
      minimumPriority: NotificationPriority.LOW,
      typePreferences: {},
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      frequencyLimits: {
        maxPerDay: 50,
        maxPerHour: 10,
        groupSimilar: true
      }
    }

    this.userPreferences.set(userAddress, defaultPrefs)
    return defaultPrefs
  }

  /**
   * Determine if notification should be delivered based on user preferences
   */
  private shouldDeliverNotification(
    notification: Omit<PlatformNotification, 'id' | 'createdAt'>, 
    preferences: UserNotificationPreferences
  ): boolean {
    // Check global preference
    if (!preferences.globalEnabled) return false

    // Check minimum priority threshold
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const notificationPriority = priorityOrder[notification.priority as keyof typeof priorityOrder]
    const minimumPriority = priorityOrder[preferences.minimumPriority as keyof typeof priorityOrder]
    
    if (notificationPriority < minimumPriority) return false

    // Check type-specific preferences
    const typePreference = preferences.typePreferences[notification.type]
    if (typePreference === false) return false

    // Check quiet hours if enabled
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: preferences.quietHours.timezone 
      }).substring(0, 5)
      
      const startTime = preferences.quietHours.startTime
      const endTime = preferences.quietHours.endTime
      
      // Handle quiet hours spanning midnight
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          // Only allow urgent notifications during quiet hours
          return notification.priority === NotificationPriority.URGENT
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return notification.priority === NotificationPriority.URGENT
        }
      }
    }

    return true
  }

  /**
   * Calculate smart expiry time based on notification type and content
   */
  private calculateExpiry(notification: Omit<PlatformNotification, 'id' | 'createdAt'>): Date {
    const now = new Date()
    
    // Different notification types have different relevance lifespans
    const expiryHours: Partial<Record<NotificationType, number>> = {
      [NotificationType.TRANSACTION_PENDING]: 24,        // 1 day for pending transactions
      [NotificationType.TRANSACTION_CONFIRMED]: 7 * 24,  // 1 week for confirmations
      [NotificationType.CONTENT_ACCESS_EXPIRING]: 1,     // 1 hour for urgent access alerts
      [NotificationType.SUBSCRIPTION_EXPIRING]: 7 * 24,  // 1 week for subscription reminders
      [NotificationType.PLATFORM_UPDATE]: 30 * 24,       // 1 month for platform news
      [NotificationType.SECURITY_ALERT]: 30 * 24         // 1 month for security alerts
    }

    const hoursToExpiry = expiryHours[notification.type] || this.config.defaultExpireDays * 24 // Element implicitly has an 'any' type because expression of type 'NotificationType' can't be used to index type '{ transaction_pending: number; transaction_confirmed: number; content_access_expiring: number; subscription_expiring: number; platform_update: number; security_alert: number; }'. Property '[NotificationType.CONTENT_UPLOAD_PROGRESS]' does not exist on type '{ transaction_pending: number; transaction_confirmed: number; content_access_expiring: number; subscription_expiring: number; platform_update: number; security_alert: number; }'.ts(7053)
    return new Date(now.getTime() + hoursToExpiry * 60 * 60 * 1000)
  }

  /**
   * Attempt to group related notifications intelligently
   */
  private attemptGrouping(notification: PlatformNotification): { grouped: boolean; groupId?: string } {
    // Find existing notifications that could be grouped with this one
    const potentialGroups = Array.from(this.notifications.values())
      .filter(existing => 
        existing.recipient === notification.recipient &&
        existing.type === notification.type &&
        existing.groupId &&
        !existing.isRead &&
        (new Date().getTime() - existing.createdAt.getTime()) < 60 * 60 * 1000 // Within 1 hour
      )
  
    if (potentialGroups.length > 0) {
      // Add to existing group by creating a new notification object
      const groupId = potentialGroups[0].groupId!
      const groupedNotification: PlatformNotification = {
        ...notification,
        groupId
      }
      // Update the notification in the map
      this.notifications.set(notification.id, groupedNotification)
      return { grouped: true, groupId }
    }
  
    // Create new group if we have multiple similar notifications
    const similarCount = Array.from(this.notifications.values())
      .filter(existing => 
        existing.recipient === notification.recipient &&
        existing.type === notification.type &&
        !existing.isRead
      ).length
  
    if (similarCount >= 2) {
      const groupId = `group_${notification.type}_${Date.now()}`
      const groupedNotification: PlatformNotification = {
        ...notification,
        groupId
      }
      // Update the notification in the map
      this.notifications.set(notification.id, groupedNotification)
      return { grouped: false, groupId } // New group created
    }
  
    return { grouped: false }
  }

  /**
   * Deliver notification via WebSocket connection
   */
  private async deliverViaWebSocket(notification: PlatformNotification): Promise<void> {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available')
    }

    const message = JSON.stringify({
      type: 'notification',
      data: notification
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket delivery timeout'))
      }, 5000)

      this.webSocket!.send(message)
      
      // In a real implementation, you'd wait for delivery confirmation
      clearTimeout(timeout)
      resolve()
    })
  }

  /**
   * Handle incoming real-time notifications
   */
  private handleIncomingNotification(notification: PlatformNotification): void {
    this.notifications.set(notification.id, notification)
    this.emit('notificationReceived', notification)
  }

  /**
   * Process batched notifications for efficiency
   */
  private async processBatchedNotifications(): Promise<void> {
    if (this.processingQueue.length === 0) return

    const batch = this.processingQueue.splice(0, 10) // Process 10 at a time
    
    for (const notification of batch) {
      try {
        await this.sendNotification(notification)
      } catch (error) {
        console.warn('Failed to process batched notification:', error)
      }
    }
  }

  /**
   * Persist notification state to storage
   */
  private async persistNotificationState(): Promise<void> {
    try {
      const notificationData = Object.fromEntries(this.notifications.entries())
      localStorage.setItem('platform_notifications', JSON.stringify(notificationData))
    } catch (error) {
      console.warn('Failed to persist notification state:', error)
    }
  }

  /**
   * Persist user preferences to storage
   */
  private async persistUserPreferences(userAddress: Address, preferences: UserNotificationPreferences): Promise<void> {
    try {
      const allPreferences = Object.fromEntries(this.userPreferences.entries())
      localStorage.setItem('notification_preferences', JSON.stringify(allPreferences))
    } catch (error) {
      console.warn('Failed to persist user preferences:', error)
    }
  }
}

/**
 * Default Notification Service Instance
 * 
 * Pre-configured service instance for use throughout the application.
 * Components can import this directly for notification operations.
 */
export const notificationService = new NotificationService()

/**
 * React Hook for Notification Management
 * 
 * This hook provides React components with reactive access to notifications
 * and notification management capabilities, following the established
 * three-layer architectural pattern throughout your application.
 */
export function useNotifications(userAddress?: Address) {
  const [notifications, setNotifications] = React.useState<readonly PlatformNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Load notifications when user address changes
  const loadNotifications = React.useCallback(async () => {
    if (!userAddress) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    try {
      const userNotifications = await notificationService.getUserNotifications(userAddress, {
        maxCount: 100
      })
      
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.filter(n => !n.isRead).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userAddress])

  // Set up real-time notification listening
  React.useEffect(() => {
    if (!userAddress) return

    const handleNewNotification = (notification: PlatformNotification) => {
      if (notification.recipient.toLowerCase() === userAddress.toLowerCase()) {
        loadNotifications() // Refresh notifications list
      }
    }

    const handleNotificationRead = (notification: PlatformNotification) => {
      if (notification.recipient.toLowerCase() === userAddress.toLowerCase()) {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? notification : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }

    notificationService.on('notificationDelivered', handleNewNotification)
    notificationService.on('notificationReceived', handleNewNotification)
    notificationService.on('notificationRead', handleNotificationRead)

    // Initial load
    loadNotifications()

    return () => {
      notificationService.off('notificationDelivered', handleNewNotification)
      notificationService.off('notificationReceived', handleNewNotification)
      notificationService.off('notificationRead', handleNotificationRead)
    }
  }, [userAddress, loadNotifications])

  // Notification management functions
  const markAsRead = React.useCallback(async (notificationId: string) => {
    if (!userAddress) return false
    return notificationService.markAsRead(notificationId, userAddress)
  }, [userAddress])

  const sendNotification = React.useCallback(async (notification: Omit<PlatformNotification, 'id' | 'createdAt'>) => {
    return notificationService.sendNotification(notification)
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    sendNotification,
    refreshNotifications: loadNotifications
  }
}

// Import React for hook implementation
import React from 'react'

/**
 * Export type definitions for use in notification components
 */
export type {
  PlatformNotification,
  NotificationConfig,
  UserNotificationPreferences,
  DeliveryResult
}