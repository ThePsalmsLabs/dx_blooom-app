/**
 * Animation Variants for V2 Payment Modal
 * 
 * Framer Motion animation presets for smooth, delightful interactions
 */

import { type Variants } from 'framer-motion'

/**
 * Modal container animations
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Backdrop fade animations
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
}

/**
 * Step transition animations
 */
export const stepVariants: Variants = {
  enter: {
    x: 300,
    opacity: 0,
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    zIndex: 0,
    x: -300,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Button press animation
 */
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
  },
}