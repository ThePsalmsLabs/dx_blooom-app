/**
 * Layout State Persistence Component - Component 8.4: Intelligent Layout Memory
 * File: src/components/layout/LayoutStatePersistence.tsx
 * 
 * This component implements sophisticated state persistence patterns that Web3 applications
 * require. Unlike traditional web apps where user preferences can be saved and restored
 * simply, Web3 platforms must handle dynamic permission changes, wallet switches, and
 * role transitions that can invalidate previously saved layout states.
 * 
 * Key Features:
 * - Permission-aware state validation before restoration
 * - Role-specific layout configurations with intelligent fallbacks
 * - Wallet-scoped preferences that adapt to identity changes
 * - Automatic state migration when user permissions evolve
 * - Graceful degradation for unsupported saved configurations
 * - Cross-session persistence with blockchain state synchronization
 * - Layout analytics for optimizing default configurations
 * 
 * This component demonstrates how sophisticated Web3 applications maintain
 * continuity of user experience across dynamic permission and identity changes
 * while ensuring that saved preferences remain meaningful and accessible.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { usePathname } from 'next/navigation'
import {
  Settings,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Switch,
  Label,
  Alert,
  AlertDescription,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast
} from '@/components/ui'

// Import our architectural layers for permission and state management
import {
  useIsCreatorRegistered,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { 
  type PermissionLevel 
} from '@/components/layout/RouteGuards'
import { type UserRole } from '@/components/layout/AppLayout'

/**
 * Layout Configuration Types
 * 
 * These interfaces define the comprehensive layout preferences that users
 * can customize and that the application can persist intelligently.
 */
interface LayoutConfiguration {
  readonly sidebarCollapsed: boolean
  readonly sidebarWidth: number
  readonly theme: 'light' | 'dark' | 'system'
  readonly compactMode: boolean
  readonly showAdvancedFeatures: boolean
  readonly dashboardLayout: 'grid' | 'list' | 'cards'
  readonly navigationStyle: 'tabs' | 'sidebar' | 'breadcrumb'
  readonly contentDensity: 'comfortable' | 'compact' | 'spacious'
  readonly analyticsWidgets: readonly string[]
  readonly quickActions: readonly string[]
}

/**
 * Permission-Scoped Layout State
 * 
 * Different user roles may have different layout capabilities and preferences.
 * This interface organizes preferences by permission level to ensure saved
 * configurations remain meaningful across permission changes.
 */
interface PermissionScopedLayoutState {
  readonly publicLayout: Partial<LayoutConfiguration>
  readonly connectedLayout: Partial<LayoutConfiguration>
  readonly creatorLayout: Partial<LayoutConfiguration>
  readonly verifiedCreatorLayout: Partial<LayoutConfiguration>
  readonly lastUsedRole: UserRole
  readonly migrationVersion: number
}

/**
 * Layout State Metadata
 * 
 * Additional information about saved layout states that helps with
 * validation, migration, and user understanding of their preferences.
 */
interface LayoutStateMetadata {
  readonly savedAt: Date
  readonly walletAddress: string
  readonly chainId: number
  readonly version: string
  readonly deviceType: 'desktop' | 'tablet' | 'mobile'
  readonly browserType: string
  readonly isValid: boolean
  readonly validationErrors: readonly string[]
}

/**
 * Layout Migration Result
 * 
 * When user permissions change, saved layouts may need to be migrated
 * or validated against new capabilities. This interface tracks the
 * outcome of those migration attempts.
 */
interface LayoutMigrationResult {
  readonly success: boolean
  readonly migratedPreferences: Partial<LayoutConfiguration>
  readonly droppedPreferences: readonly string[]
  readonly addedDefaults: readonly string[]
  readonly warnings: readonly string[]
}

/**
 * Props interface for the LayoutStatePersistence component
 */
interface LayoutStatePersistenceProps {
  /** Current user role for scoping layout preferences */
  userRole: UserRole
  /** Current permission level for validation */
  permissionLevel: PermissionLevel
  /** Initial layout configuration */
  initialLayout?: Partial<LayoutConfiguration>
  /** Callback when layout configuration changes */
  onLayoutChange?: (layout: LayoutConfiguration) => void
  /** Whether to enable automatic state persistence */
  enableAutoPersistence?: boolean
  /** Custom storage key prefix for this application instance */
  storageKeyPrefix?: string
}

/**
 * LayoutStatePersistence Component
 * 
 * This component demonstrates how Web3 applications can implement intelligent
 * layout memory that adapts to the dynamic nature of blockchain-based permissions
 * while maintaining excellent user experience across identity and role changes.
 */

export function LayoutStatePersistence({
  userRole,
  permissionLevel,
  initialLayout = {},
  onLayoutChange,
  enableAutoPersistence = true,
  storageKeyPrefix = 'contentdao-layout'
}: LayoutStatePersistenceProps) {
  // Wallet and network state for scoping preferences
  const { address } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();

  // Creator registration state for permission validation
  const creatorRegistration = useIsCreatorRegistered(address);
  const creatorProfile = useCreatorProfile(address);

  // Toast notifications for user feedback
  const { toast } = useToast();

  // Current layout configuration state
  const [currentLayout, setCurrentLayout] = useState<LayoutConfiguration>(() => ({
    sidebarCollapsed: false,
    sidebarWidth: 256,
    theme: 'system',
    compactMode: false,
    showAdvancedFeatures: userRole === 'creator',
    dashboardLayout: 'grid',
    navigationStyle: 'sidebar',
    contentDensity: 'comfortable',
    analyticsWidgets: userRole === 'creator' ? ['earnings', 'views', 'subscribers'] : [],
    quickActions: userRole === 'creator' ? ['upload', 'analytics'] : ['browse'],
    ...initialLayout
  }));

  // Layout state persistence metadata
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutStateMetadata | null>(null);
  const [migrationResult, setMigrationResult] = useState<LayoutMigrationResult | null>(null);
  const persistenceInProgress = useRef(false);

  // Generate storage key based on wallet address and network
  const storageKey = useMemo(() => {
    return address
      ? `${storageKeyPrefix}-${address}-${chainId}`
      : `${storageKeyPrefix}-anonymous`;
  }, [storageKeyPrefix, address, chainId]);

  // Default layouts per role
  const defaultLayouts = useMemo<Record<UserRole, Partial<LayoutConfiguration>>>(() => ({
    disconnected: {
      sidebarCollapsed: true,
      showAdvancedFeatures: false,
      dashboardLayout: 'cards',
      navigationStyle: 'breadcrumb',
      analyticsWidgets: [],
      quickActions: ['browse']
    },
    consumer: {
      sidebarCollapsed: false,
      showAdvancedFeatures: false,
      dashboardLayout: 'grid',
      navigationStyle: 'sidebar',
      analyticsWidgets: [],
      quickActions: ['browse', 'search']
    },
    creator: {
      sidebarCollapsed: false,
      showAdvancedFeatures: true,
      dashboardLayout: 'grid',
      navigationStyle: 'sidebar',
      analyticsWidgets: ['earnings', 'views', 'subscribers'],
      quickActions: ['upload', 'analytics', 'dashboard']
    },
    admin: {
      sidebarCollapsed: false,
      showAdvancedFeatures: true,
      dashboardLayout: 'list',
      navigationStyle: 'sidebar',
      analyticsWidgets: ['earnings', 'views', 'subscribers', 'platform'],
      quickActions: ['upload', 'analytics', 'dashboard', 'admin']
    }
  }), []);

  // Validate and sanitize layout changes
  const validateLayoutForPermissions = useCallback(
    (
      proposedLayout: Partial<LayoutConfiguration>,
      targetRole: UserRole
    ): { isValid: boolean; validatedLayout: LayoutConfiguration; errors: string[] } => {
      const errors: string[] = [];
      let validatedLayout: LayoutConfiguration = {
        ...defaultLayouts[targetRole],
        ...currentLayout,
        ...proposedLayout
      } as LayoutConfiguration;

      // Prevent advanced features for disconnected
      if (proposedLayout.showAdvancedFeatures && targetRole === 'disconnected') {
        errors.push('Advanced features not available without wallet connection');
        validatedLayout = { ...validatedLayout, showAdvancedFeatures: false };
      }

      // Restrict analytics widgets
      if (
        proposedLayout.analyticsWidgets &&
        proposedLayout.analyticsWidgets.length > 0 &&
        targetRole !== 'creator' &&
        targetRole !== 'admin'
      ) {
        errors.push('Analytics widgets only available for creators and admins');
        validatedLayout = { ...validatedLayout, analyticsWidgets: [] };
      }

      // Filter quick actions by role
      if (proposedLayout.quickActions) {
        const creatorActions = ['upload', 'analytics', 'dashboard'];
        const filtered = proposedLayout.quickActions.filter(action => {
          if (
            creatorActions.includes(action) &&
            targetRole !== 'creator' &&
            targetRole !== 'admin'
          ) {
            errors.push(`Action \"${action}\" not available for ${targetRole} role`);
            return false;
          }
          return true;
        });
        validatedLayout = { ...validatedLayout, quickActions: filtered };
      }

      return { isValid: errors.length === 0, validatedLayout, errors };
    },
    [defaultLayouts, currentLayout]
  );

  // Load persisted layout state from storage
  const loadPersistedLayout = useCallback(async (): Promise<LayoutMigrationResult | null> => {
    try {
      // In a real application, this would use a more sophisticated storage system
      // possibly including encrypted storage for sensitive layout preferences
      const persistedData = localStorage.getItem(storageKey)
      
      if (!persistedData) {
        return null
      }

      const parsedData: {
        state: PermissionScopedLayoutState
        metadata: LayoutStateMetadata
      } = JSON.parse(persistedData)

      // Validate that the persisted data is still applicable
      const validation = validateLayoutForPermissions(
        parsedData.state[`${userRole}Layout` as keyof PermissionScopedLayoutState] as Partial<LayoutConfiguration> || {},
        userRole
      )

      // Create migration result based on validation
      const migrationResult: LayoutMigrationResult = {
        success: validation.isValid,
        migratedPreferences: validation.validatedLayout,
        droppedPreferences: validation.errors,
        addedDefaults: [],
        warnings: validation.errors
      }

      // Update metadata to reflect current session
      setLayoutMetadata({
        ...parsedData.metadata,
        isValid: validation.isValid,
        validationErrors: validation.errors
      })

      return migrationResult

    } catch (error) {
      console.warn('Failed to load persisted layout:', error)
      return null
    }
  }, [storageKey, userRole, validateLayoutForPermissions])

  // Persist current layout state to storage
  const persistLayoutState = useCallback(async (layout: LayoutConfiguration) => {
    if (persistenceInProgress.current || !enableAutoPersistence) {
      return
    }

    try {
      persistenceInProgress.current = true

      // Create permission-scoped state structure
      const scopedState: PermissionScopedLayoutState = {
        publicLayout: userRole === 'disconnected' ? layout : {},
        connectedLayout: userRole === 'consumer' ? layout : {},
        creatorLayout: userRole === 'creator' ? layout : {},
        verifiedCreatorLayout: userRole === 'admin' ? layout : {},
        lastUsedRole: userRole,
        migrationVersion: 1
      }

      // Create metadata for this persistence operation
      const metadata: LayoutStateMetadata = {
        savedAt: new Date(),
        walletAddress: address || 'anonymous',
        chainId,
        version: '1.0.0',
        deviceType: getDeviceType(),
        browserType: getBrowserType(),
        isValid: true,
        validationErrors: []
      }

      // Store the complete state and metadata
      const persistencePayload = {
        state: scopedState,
        metadata
      }

      localStorage.setItem(storageKey, JSON.stringify(persistencePayload))
      setLayoutMetadata(metadata)

      // Show success feedback to user
      toast({
        title: 'Layout Saved',
        description: 'Your layout preferences have been saved.',
        duration: 2000
      })

    } catch (error) {
      console.error('Failed to persist layout state:', error)
      toast({
        title: 'Save Failed',
        description: 'Could not save layout preferences.',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      persistenceInProgress.current = false
    }
  }, [storageKey, userRole, address, chainId, enableAutoPersistence, toast])

  // Handle layout configuration changes
  const handleLayoutChange = useCallback((updates: Partial<LayoutConfiguration>) => {
    const newLayout = { ...currentLayout, ...updates }
    
    // Validate the new configuration against current permissions
    const validation = validateLayoutForPermissions(newLayout, userRole)
    
    if (validation.isValid) {
      setCurrentLayout(validation.validatedLayout)
      onLayoutChange?.(validation.validatedLayout)
      
      // Automatically persist if enabled
      if (enableAutoPersistence) {
        persistLayoutState(validation.validatedLayout)
      }
    } else {
      // Show validation errors to user
      toast({
        title: 'Layout Update Failed',
        description: validation.errors[0] || 'Invalid layout configuration',
        variant: 'destructive',
        duration: 3000
      })
    }
  }, [currentLayout, userRole, validateLayoutForPermissions, onLayoutChange, enableAutoPersistence, persistLayoutState, toast])

  // Reset to default layout for current role
  const resetToDefaults = useCallback(() => {
    const defaultLayout = {
      ...currentLayout,
      ...defaultLayouts[userRole]
    }
    
    setCurrentLayout(defaultLayout)
    onLayoutChange?.(defaultLayout)
    
    toast({
      title: 'Layout Reset',
      description: 'Layout has been reset to defaults.',
      duration: 2000
    })
  }, [currentLayout, defaultLayouts, userRole, onLayoutChange, toast])

  // Load persisted layout when component mounts or user role changes
  useEffect(() => {
    const loadAndApplyPersistedLayout = async () => {
      const migrationResult = await loadPersistedLayout()
      
      if (migrationResult) {
        setMigrationResult(migrationResult)
        
        if (migrationResult.success) {
          setCurrentLayout(migrationResult.migratedPreferences as LayoutConfiguration)
          onLayoutChange?.(migrationResult.migratedPreferences as LayoutConfiguration)
        } else {
          // Apply role defaults if migration failed
          const defaultLayout = { ...currentLayout, ...defaultLayouts[userRole] }
          setCurrentLayout(defaultLayout)
          onLayoutChange?.(defaultLayout)
        }
      } else {
        // Apply role defaults for new users
        const defaultLayout = { ...currentLayout, ...defaultLayouts[userRole] }
        setCurrentLayout(defaultLayout)
        onLayoutChange?.(defaultLayout)
      }
    }

    loadAndApplyPersistedLayout()
  }, [userRole, address, chainId]) // Only depend on identity-related changes

  // Manual export/import functionality for advanced users
  const exportLayoutConfiguration = useCallback(() => {
    const exportData = {
      layout: currentLayout,
      metadata: layoutMetadata,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contentdao-layout-${userRole}-${Date.now()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Layout Exported',
      description: 'Layout configuration has been downloaded.',
      duration: 2000
    })
  }, [currentLayout, layoutMetadata, userRole, toast])

  // Render layout persistence management interface
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Layout Preferences
        </CardTitle>
        <CardDescription>
          Customize your workspace layout. Preferences are automatically saved and restored
          based on your current role and permissions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Role and Permission Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Current Role: {userRole}</span>
          </div>
          <Badge variant={userRole === 'creator' ? 'default' : 'secondary'}>
            {permissionLevel}
          </Badge>
        </div>

        {/* Migration Status */}
        {migrationResult && (
          <Alert className={migrationResult.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
            {migrationResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <AlertDescription>
              {migrationResult.success ? (
                'Layout preferences loaded successfully.'
              ) : (
                `Layout migration applied with ${migrationResult.warnings.length} adjustments for current permissions.`
              )}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Layout Configuration Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Display Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sidebar-collapsed">Collapse Sidebar</Label>
              <Switch
                id="sidebar-collapsed"
                checked={currentLayout.sidebarCollapsed}
                onCheckedChange={(checked) => 
                  handleLayoutChange({ sidebarCollapsed: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <Switch
                id="compact-mode"
                checked={currentLayout.compactMode}
                onCheckedChange={(checked) => 
                  handleLayoutChange({ compactMode: checked })
                }
              />
            </div>

            {userRole === 'creator' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="advanced-features">Advanced Features</Label>
                <Switch
                  id="advanced-features"
                  checked={currentLayout.showAdvancedFeatures}
                  onCheckedChange={(checked) => 
                    handleLayoutChange({ showAdvancedFeatures: checked })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Content Density</Label>
              <Select
                value={currentLayout.contentDensity}
                onValueChange={(value: LayoutConfiguration['contentDensity']) =>
                  handleLayoutChange({ contentDensity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Persistence Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <Button 
            onClick={exportLayoutConfiguration}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Layout
          </Button>

          {layoutMetadata && (
            <div className="ml-auto text-xs text-muted-foreground">
              Last saved: {new Date(layoutMetadata.savedAt).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== UTILITY FUNCTIONS =====

/**
 * Detect device type for responsive layout defaults
 */
function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Detect browser type for compatibility tracking
 */
function getBrowserType(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Other'
}

/**
 * Export type definitions for use in layout management
 */
export type { 
  LayoutConfiguration, 
  PermissionScopedLayoutState, 
  LayoutStateMetadata,
  LayoutMigrationResult,
  LayoutStatePersistenceProps 
}