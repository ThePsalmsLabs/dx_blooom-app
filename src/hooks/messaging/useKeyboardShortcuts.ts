/**
 * Keyboard Shortcuts Hook for Messaging
 * 
 * Provides keyboard shortcuts and focus management for messaging interface.
 * Enhances accessibility and power user experience.
 */

'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: (e: KeyboardEvent) => void
  description: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts() {
  
  // ===== KEYBOARD SHORTCUTS =====
  
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {
        // Send message with Ctrl+Enter
        const sendButton = document.querySelector('[aria-label*="Send message"]:not(:disabled)') as HTMLButtonElement
        sendButton?.click()
      },
      description: 'Send message',
      preventDefault: true
    },
    {
      key: 'Enter',
      metaKey: true,
      action: () => {
        // Send message with Cmd+Enter (Mac)
        const sendButton = document.querySelector('[aria-label*="Send message"]:not(:disabled)') as HTMLButtonElement
        sendButton?.click()
      },
      description: 'Send message (Mac)',
      preventDefault: true
    },
    {
      key: 'Escape',
      action: () => {
        // Clear message input or close modals
        const messageInput = document.querySelector('textarea[aria-label*="Type your message"]') as HTMLTextAreaElement
        if (messageInput && messageInput.value.trim()) {
          messageInput.value = ''
          messageInput.dispatchEvent(new Event('input', { bubbles: true }))
        } else {
          // Close any open modals or panels
          const closeButtons = document.querySelectorAll('[aria-label*="Close"], [aria-label*="close"]')
          const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLButtonElement
          lastCloseButton?.click()
        }
      },
      description: 'Clear input or close modal'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // Start new conversation
        const newButton = document.querySelector('[aria-label*="Start new conversation"]') as HTMLButtonElement
        newButton?.click()
      },
      description: 'New conversation',
      preventDefault: true
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        // Focus search
        const searchInput = document.querySelector('input[role="searchbox"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          // Show search if hidden
          const searchToggle = document.querySelector('[aria-label*="Show search"]') as HTMLButtonElement
          searchToggle?.click()
        }
      },
      description: 'Focus search',
      preventDefault: true
    },
    {
      key: 'ArrowUp',
      action: (e) => {
        // Navigate up in conversation list
        if (document.activeElement?.closest('[role="navigation"]')) {
          const conversations = Array.from(document.querySelectorAll('[role="listitem"]'))
          const currentIndex = conversations.findIndex(conv => conv.contains(document.activeElement!))
          if (currentIndex > 0) {
            (conversations[currentIndex - 1] as HTMLElement).focus()
          }
        }
      },
      description: 'Navigate up in conversations'
    },
    {
      key: 'ArrowDown',
      action: (e) => {
        // Navigate down in conversation list
        if (document.activeElement?.closest('[role="navigation"]')) {
          const conversations = Array.from(document.querySelectorAll('[role="listitem"]'))
          const currentIndex = conversations.findIndex(conv => conv.contains(document.activeElement!))
          if (currentIndex < conversations.length - 1) {
            (conversations[currentIndex + 1] as HTMLElement).focus()
          }
        }
      },
      description: 'Navigate down in conversations'
    },
    {
      key: 'End',
      ctrlKey: true,
      action: () => {
        // Scroll to bottom of messages
        const scrollButton = document.querySelector('[aria-label*="Scroll to bottom"]') as HTMLButtonElement
        if (scrollButton) {
          scrollButton.click()
        } else {
          const messagesContainer = document.querySelector('[data-messages-container]')
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
          }
        }
      },
      description: 'Scroll to bottom',
      preventDefault: true
    },
    {
      key: 'Home',
      ctrlKey: true,
      action: () => {
        // Scroll to top of messages
        const messagesContainer = document.querySelector('[data-messages-container]')
        if (messagesContainer) {
          messagesContainer.scrollTop = 0
        }
      },
      description: 'Scroll to top',
      preventDefault: true
    },
    {
      key: 'Tab',
      action: (e) => {
        // Enhanced tab navigation within messaging interface
        const messagingContainer = document.querySelector('[role="main"][aria-label*="messaging"]')
        if (!messagingContainer?.contains(document.activeElement!)) return
        
        // Let default tab behavior work, but ensure we stay within messaging
        const focusableElements = messagingContainer.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements.length === 0) return
        
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      },
      description: 'Navigate with Tab'
    }
  ]
  
  // ===== KEYBOARD EVENT HANDLER =====
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except for specific shortcuts)
    const isInputActive = document.activeElement?.tagName === 'INPUT' || 
                          document.activeElement?.tagName === 'TEXTAREA'
    
    for (const shortcut of shortcuts) {
      const keyMatches = e.key === shortcut.key
      const ctrlMatches = !!shortcut.ctrlKey === e.ctrlKey
      const metaMatches = !!shortcut.metaKey === e.metaKey
      const shiftMatches = !!shortcut.shiftKey === e.shiftKey
      const altMatches = !!shortcut.altKey === e.altKey
      
      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        // Allow certain shortcuts even when input is active
        const allowInInput = ['Enter', 'Escape'].includes(shortcut.key) || 
                           shortcut.ctrlKey || shortcut.metaKey
        
        if (!isInputActive || allowInInput) {
          if (shortcut.preventDefault) {
            e.preventDefault()
          }
          shortcut.action(e)
          break
        }
      }
    }
  }, [])
  
  // ===== FOCUS MANAGEMENT =====
  
  const focusMessageInput = useCallback(() => {
    const messageInput = document.querySelector('textarea[aria-label*="Type your message"]') as HTMLTextAreaElement
    messageInput?.focus()
  }, [])
  
  const focusConversationList = useCallback(() => {
    const firstConversation = document.querySelector('[role="listitem"]') as HTMLElement
    firstConversation?.focus()
  }, [])
  
  const focusCurrentConversation = useCallback(() => {
    const selectedConversation = document.querySelector('[role="listitem"][aria-selected="true"]') as HTMLElement
    selectedConversation?.focus()
  }, [])
  
  // ===== SETUP AND CLEANUP =====
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
  
  // ===== RETURN UTILITIES =====
  
  return {
    shortcuts: shortcuts.map(s => ({ key: s.key, description: s.description })),
    focusMessageInput,
    focusConversationList,
    focusCurrentConversation
  }
}