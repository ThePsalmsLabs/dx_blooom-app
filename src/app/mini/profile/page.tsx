/**
 * MiniApp User Profile Page - Account Management & Settings
 * File: src/app/mini/profile/page.tsx
 *
 * This page provides comprehensive user profile management and account settings
 * in the mini app, enabling users to customize their experience, manage privacy,
 * and control their account preferences with mobile-optimized interfaces.
 *
 * Mini App Design Philosophy:
 * - Streamlined profile management with mobile-first forms
 * - Clear privacy controls and data management options
 * - Account security settings with easy wallet management
 * - Personalization options for content preferences
 * - Intuitive settings organization with collapsible sections
 *
 * Key Features:
 * - Profile information editing and avatar management
 * - Privacy settings and data control options
 * - Notification preferences and communication settings
 * - Wallet connection management and security options
 * - Content preferences and personalization
 * - Account deletion and data export options
 */

'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  User,
  Settings,
  Bell,
  Shield,
  Wallet,
  Palette,
  Download,
  Trash2,
  Edit,
  Save,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Smartphone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Key,
  BellRing,
  Volume2,
  VolumeX
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'

// Import utilities
import { formatAddress } from '@/lib/utils'

/**
 * Profile Tab Types
 */
type ProfileTab = 'profile' | 'privacy' | 'notifications' | 'wallet' | 'preferences'

/**
 * Profile Data Interface
 */
interface ProfileData {
  displayName: string
  bio: string
  email: string
  website: string
  location: string
  avatar: File | null
}

/**
 * Privacy Settings Interface
 */
interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showPurchaseHistory: boolean
  allowAnalytics: boolean
  allowMarketing: boolean
}

/**
 * Notification Settings Interface
 */
interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  purchaseAlerts: boolean
  contentUpdates: boolean
  creatorMessages: boolean
  marketingEmails: boolean
}

/**
 * MiniApp User Profile Core Component
 *
 * This component orchestrates the complete user profile management experience
 * with mobile-first design and comprehensive account settings.
 */
function MiniAppUserProfileCore() {
  const router = useRouter()

  // Core state management
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    email: '',
    website: '',
    location: '',
    avatar: null
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPurchaseHistory: false,
    allowAnalytics: true,
    allowMarketing: false
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    purchaseAlerts: true,
    contentUpdates: false,
    creatorMessages: true,
    marketingEmails: false
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  /**
   * Tab Change Handler
   */
  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab)
  }, [])

  /**
   * Profile Update Handlers
   */
  const handleProfileUpdate = useCallback((field: keyof ProfileData, value: string | File | null) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handlePrivacyUpdate = useCallback((field: keyof PrivacySettings, value: string | boolean) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleNotificationUpdate = useCallback((field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Save Profile Handler
   */
  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true)
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsEditing(false)
      // In real implementation, this would save to backend
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  // Initialize profile data (in real app this would come from API)
  useEffect(() => {
    if (userAddress) {
      setProfileData(prev => ({
        ...prev,
        displayName: `User ${userAddress.slice(-4)}`,
        bio: 'Web3 content enthusiast exploring the decentralized future.',
        email: '',
        website: '',
        location: ''
      }))
    }
  }, [userAddress])

  // Handle wallet connection requirement
  if (!walletUI.isConnected || !userAddress) {
    return (
      <MiniAppLayout>
        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to manage your profile
            </p>
          </div>
          <Button onClick={() => router.push('/mini')}>
            Return to Home
          </Button>
        </div>
      </MiniAppLayout>
    )
  }

  return (
    <MiniAppLayout>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          onGoBack={handleGoBack}
          userAddress={userAddress}
          profileData={profileData}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />

        {/* Profile Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        <ProfileTabContent
          activeTab={activeTab}
          profileData={profileData}
          privacySettings={privacySettings}
          notificationSettings={notificationSettings}
          userAddress={userAddress}
          isEditing={isEditing}
          onProfileUpdate={handleProfileUpdate}
          onPrivacyUpdate={handlePrivacyUpdate}
          onNotificationUpdate={handleNotificationUpdate}
        />
      </main>
    </MiniAppLayout>
  )
}

/**
 * Profile Header Component
 *
 * Header with user info and edit controls
 */
function ProfileHeader({
  onGoBack,
  userAddress,
  profileData,
  isEditing,
  onEditToggle,
  onSave,
  isSaving
}: {
  onGoBack: () => void
  userAddress: `0x${string}`
  profileData: ProfileData
  isEditing: boolean
  onEditToggle: () => void
  onSave: () => void
  isSaving: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {profileData.displayName || `User ${userAddress.slice(-4)}`}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {formatAddress(userAddress)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Member since 2024
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button onClick={onSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          ) : (
            <Button onClick={onEditToggle} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Profile Tabs Component
 *
 * Tabbed interface for different profile sections
 */
function ProfileTabs({
  activeTab,
  onTabChange
}: {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
}) {
  const tabs = [
    { id: 'profile' as ProfileTab, label: 'Profile', icon: User },
    { id: 'privacy' as ProfileTab, label: 'Privacy', icon: Shield },
    { id: 'notifications' as ProfileTab, label: 'Notifications', icon: Bell },
    { id: 'wallet' as ProfileTab, label: 'Wallet', icon: Wallet },
    { id: 'preferences' as ProfileTab, label: 'Preferences', icon: Settings }
  ]

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ProfileTab)}>
      <TabsList className="grid grid-cols-3 gap-1 mb-4">
        <TabsTrigger value="profile" className="text-xs">
          Profile
        </TabsTrigger>
        <TabsTrigger value="privacy" className="text-xs">
          Privacy
        </TabsTrigger>
        <TabsTrigger value="notifications" className="text-xs">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsList className="grid grid-cols-2 gap-1 mb-4">
        <TabsTrigger value="wallet" className="text-xs">
          Wallet
        </TabsTrigger>
        <TabsTrigger value="preferences" className="text-xs">
          Preferences
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

/**
 * Profile Tab Content Component
 *
 * Content for each profile tab
 */
function ProfileTabContent({
  activeTab,
  profileData,
  privacySettings,
  notificationSettings,
  userAddress,
  isEditing,
  onProfileUpdate,
  onPrivacyUpdate,
  onNotificationUpdate
}: {
  activeTab: ProfileTab
  profileData: ProfileData
  privacySettings: PrivacySettings
  notificationSettings: NotificationSettings
  userAddress: `0x${string}`
  isEditing: boolean
  onProfileUpdate: (field: keyof ProfileData, value: string | File | null) => void
  onPrivacyUpdate: (field: keyof PrivacySettings, value: string | boolean) => void
  onNotificationUpdate: (field: keyof NotificationSettings, value: boolean) => void
}) {
  switch (activeTab) {
    case 'profile':
      return (
        <ProfileTab
          profileData={profileData}
          isEditing={isEditing}
          onProfileUpdate={onProfileUpdate}
        />
      )
    case 'privacy':
      return (
        <PrivacyTab
          privacySettings={privacySettings}
          onPrivacyUpdate={onPrivacyUpdate}
        />
      )
    case 'notifications':
      return (
        <NotificationsTab
          notificationSettings={notificationSettings}
          onNotificationUpdate={onNotificationUpdate}
        />
      )
    case 'wallet':
      return (
        <WalletTab userAddress={userAddress} />
      )
    case 'preferences':
      return (
        <PreferencesTab />
      )
    default:
      return null
  }
}

/**
 * Profile Tab Component
 *
 * User profile information and editing
 */
function ProfileTab({
  profileData,
  isEditing,
  onProfileUpdate
}: {
  profileData: ProfileData
  isEditing: boolean
  onProfileUpdate: (field: keyof ProfileData, value: string | File | null) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            {isEditing ? (
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => onProfileUpdate('displayName', e.target.value)}
                placeholder="Your display name"
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg">
                {profileData.displayName || 'Not set'}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => onProfileUpdate('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg">
                {profileData.bio || 'No bio set'}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => onProfileUpdate('email', e.target.value)}
                placeholder="your@email.com"
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg">
                {profileData.email || 'Not set'}
              </div>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            {isEditing ? (
              <Input
                id="website"
                value={profileData.website}
                onChange={(e) => onProfileUpdate('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg">
                {profileData.website || 'Not set'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">15</div>
              <div className="text-xs text-muted-foreground">Content Purchased</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-xs text-muted-foreground">Content Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">4.6</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Privacy Tab Component
 *
 * Privacy settings and data controls
 */
function PrivacyTab({
  privacySettings,
  onPrivacyUpdate
}: {
  privacySettings: PrivacySettings
  onPrivacyUpdate: (field: keyof PrivacySettings, value: string | boolean) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Visibility */}
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={privacySettings.profileVisibility}
              onValueChange={(value) => onPrivacyUpdate('profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see my profile</SelectItem>
                <SelectItem value="private">Private - Only I can see my profile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Email Address</Label>
              <p className="text-xs text-muted-foreground">
                Allow others to see your email address
              </p>
            </div>
            <Switch
              checked={privacySettings.showEmail}
              onCheckedChange={(checked) => onPrivacyUpdate('showEmail', checked)}
            />
          </div>

          {/* Show Purchase History */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Purchase History</Label>
              <p className="text-xs text-muted-foreground">
                Display your content purchases publicly
              </p>
            </div>
            <Switch
              checked={privacySettings.showPurchaseHistory}
              onCheckedChange={(checked) => onPrivacyUpdate('showPurchaseHistory', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Data & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allow Analytics */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Usage Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Help improve the platform with anonymous usage data
              </p>
            </div>
            <Switch
              checked={privacySettings.allowAnalytics}
              onCheckedChange={(checked) => onPrivacyUpdate('allowAnalytics', checked)}
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Marketing Communications</Label>
              <p className="text-xs text-muted-foreground">
                Receive updates about new features and content
              </p>
            </div>
            <Switch
              checked={privacySettings.allowMarketing}
              onCheckedChange={(checked) => onPrivacyUpdate('allowMarketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export My Data
            </Button>

            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Notifications Tab Component
 *
 * Notification preferences and settings
 */
function NotificationsTab({
  notificationSettings,
  onNotificationUpdate
}: {
  notificationSettings: NotificationSettings
  onNotificationUpdate: (field: keyof NotificationSettings, value: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) => onNotificationUpdate('pushNotifications', checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => onNotificationUpdate('emailNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Purchase Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Purchase Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Notifications about your purchases
              </p>
            </div>
            <Switch
              checked={notificationSettings.purchaseAlerts}
              onCheckedChange={(checked) => onNotificationUpdate('purchaseAlerts', checked)}
            />
          </div>

          {/* Content Updates */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Content Updates</Label>
              <p className="text-xs text-muted-foreground">
                Updates from creators you follow
              </p>
            </div>
            <Switch
              checked={notificationSettings.contentUpdates}
              onCheckedChange={(checked) => onNotificationUpdate('contentUpdates', checked)}
            />
          </div>

          {/* Creator Messages */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Creator Messages</Label>
              <p className="text-xs text-muted-foreground">
                Direct messages from creators
              </p>
            </div>
            <Switch
              checked={notificationSettings.creatorMessages}
              onCheckedChange={(checked) => onNotificationUpdate('creatorMessages', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Wallet Tab Component
 *
 * Wallet connection and security settings
 */
function WalletTab({ userAddress }: { userAddress: `0x${string}` }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-sm text-green-800">Wallet Connected</div>
              <div className="text-xs text-green-700 font-mono">{formatAddress(userAddress)}</div>
            </div>
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-1" />
              Keys
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Wallet Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Block Explorer
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Private Key
              </Button>
              <Button variant="outline" className="justify-start text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">Two-Factor Authentication</div>
                <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">Backup Recovery Phrase</div>
                <div className="text-xs text-muted-foreground">Secure your wallet access</div>
              </div>
              <Button variant="outline" size="sm">
                Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Preferences Tab Component
 *
 * User preferences and app settings
 */
function PreferencesTab() {
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Content View</Label>
            <Select defaultValue="grid">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Categories</Label>
            <p className="text-xs text-muted-foreground">
              Choose your preferred content categories for better recommendations
            </p>
            <div className="flex flex-wrap gap-2">
              {['Technology', 'Design', 'Business', 'Education'].map((category) => (
                <Badge key={category} variant="secondary" className="cursor-pointer">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Last Updated:</strong> December 2024</p>
            <p><strong>Platform:</strong> Web3 Content Hub</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error Fallback Component
 */
function ProfileErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <MiniAppLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Profile Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading your profile. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MiniAppLayout>
  )
}

/**
 * Loading Skeleton Component
 */
function ProfileLoadingSkeleton() {
  return (
    <MiniAppLayout>
      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        <Skeleton className="h-10 w-full" />

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </MiniAppLayout>
  )
}

/**
 * MiniApp User Profile Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppUserProfilePage() {
  return (
    <ErrorBoundary FallbackComponent={ProfileErrorFallback}>
      <Suspense fallback={<ProfileLoadingSkeleton />}>
        <MiniAppUserProfileCore />
      </Suspense>
    </ErrorBoundary>
  )
}
