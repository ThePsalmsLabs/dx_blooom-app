// Global MiniApp SDK typings and window augmentation

export interface MiniAppUser {
  fid: number
  username?: string
  displayName?: string
  verifications?: string[]
}

export interface MiniAppActions {
  ready: () => Promise<void>
  share?: (args: { text: string; url?: string; embeds?: Array<{ url: string }> }) => Promise<void>
  composeCast?: (args: { text: string; embeds?: string[] }) => Promise<void>
}

export interface AppMiniAppSDK {
  actions: MiniAppActions
  init?: (args?: { name?: string; version?: string }) => Promise<void>
  user?: {
    getCurrentUser?: () => Promise<MiniAppUser>
  }
  capabilities?: {
    getCapabilities?: () => Promise<string[]>
  }
}

declare global {
  interface Window {
    miniapp?: {
      sdk?: AppMiniAppSDK
      user?: MiniAppUser
    }
    analytics?: {
      track: (event: string, data: unknown) => void
    }
  }
  interface Navigator {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }
}

export {}


