/**
 * V2 Shared Components and Utilities
 * 
 * Shared infrastructure for the V2 component system
 */

// Modal system
export * from './modals'
export * from './hooks'

// Re-export commonly used components
export { 
  BaseModal, 
  StandardModal, 
  CompactModal, 
  LargeModal, 
  FullscreenModal, 
  SlideModal 
} from './modals'

export { 
  useModal, 
  useConfirmation, 
  useNotification 
} from './hooks'

export { 
  ModalProvider, 
  useModalContext 
} from './modals'

export type { 
  ModalOptions, 
  ModalState, 
  ModalContextType 
} from './modals'