/**
 * Modal System Exports
 * 
 * Complete modal system for V2 components replacing Dialog usage
 */

// Core modal system
export { ModalProvider, useModalContext } from './ModalProvider'
export type { ModalOptions, ModalState, ModalContextType } from './ModalProvider'

// Base modal components
export { 
  BaseModal, 
  StandardModal, 
  CompactModal, 
  LargeModal, 
  FullscreenModal, 
  SlideModal 
} from './BaseModal'

// Modal management hooks
export { useModal, useConfirmation, useNotification } from '../hooks/useModal'