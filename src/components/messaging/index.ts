// Main messaging interface
export { MessagingInterface } from './MessagingInterface'

// Integration components
export { MessageButton } from './MessageButton'

// Smart Platform-Adaptive Components
export { SmartMessagingButton, useMessagingPlatform } from './SmartMessagingButton'

// UX Pattern Components
export { MessagingSlidePanel } from './MessagingSlidePanel'
export { MessagingFloatingWidget } from './MessagingFloatingWidget'
export { MessagingInlineExpander } from './MessagingInlineExpander'
export { MessagingSplitDrawer } from './MessagingSplitDrawer'

// Demo components
export { MessagingDemo, MessagingShowcase } from './MessagingDemo'
export { PlatformAdaptiveDemo } from './PlatformAdaptiveDemo'

// Core components
export { ConversationList } from './ConversationList'
export { ConversationPanel } from './ConversationPanel'
export { MessageBubble, groupMessages } from './MessageBubble'
export { MessageComposer } from './MessageComposer'
export { TypingIndicator } from './TypingIndicator'

// Re-export types for convenience
export type {
  Message,
  Conversation,
  MessageStatus,
  MessageType,
  ConversationContext,
  MessagingPermissionLevel
} from '@/types/messaging'