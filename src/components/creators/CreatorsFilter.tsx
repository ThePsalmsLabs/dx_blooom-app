import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  Filter, 
  X, 
  TrendingUp, 
  Star, 
  Users,
  Calendar,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export interface CreatorFilters {
  search: string
  verified: boolean | null // null = all, true = verified only, false = unverified only
  sortBy: 'newest' | 'earnings' | 'subscribers' | 'content' | 'alphabetical' | 'trending'
  sortOrder: 'asc' | 'desc'
  minSubscriptionPrice?: number
  maxSubscriptionPrice?: number
}

interface CreatorsFilterProps {
  filters: CreatorFilters
  onFiltersChange: (filters: CreatorFilters) => void
  totalCount: number
  filteredCount: number
  className?: string
}

export function CreatorsFilter({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  className
}: CreatorsFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.verified !== null) count++
    if (filters.minSubscriptionPrice || filters.maxSubscriptionPrice) count++
    return count
  }, [filters])

  const handleFilterChange = (updates: Partial<CreatorFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      verified: null,
      sortBy: 'newest',
      sortOrder: 'desc',
      minSubscriptionPrice: undefined,
      maxSubscriptionPrice: undefined
    })
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Calendar },
    { value: 'earnings', label: 'Top Earners', icon: TrendingUp },
    { value: 'subscribers', label: 'Most Subscribers', icon: Users },
    { value: 'content', label: 'Most Content', icon: FileText },
    { value: 'alphabetical', label: 'A-Z', icon: Star },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            Discover Creators ({filteredCount.toLocaleString()})
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs sm:text-sm">
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creators by address..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-10 text-sm sm:text-base"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button
            variant={filters.verified === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({ verified: null })}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            All Creators
          </Button>
          <Button
            variant={filters.verified === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({ verified: true })}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Verified Only
          </Button>
        </div>

        {/* Sort Options */}
        <div>
          <Label className="text-xs sm:text-sm font-medium mb-2 block">Sort By</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={filters.sortBy === value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange({ sortBy: value as any })}
                className="justify-start text-xs sm:text-sm h-8 sm:h-9"
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Advanced Filters
              {showAdvanced ? (
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
              ) : (
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3 sm:space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 block">
                  Subscription Price Range (USDC/month)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={filters.minSubscriptionPrice || ''}
                    onChange={(e) => handleFilterChange({ 
                      minSubscriptionPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxSubscriptionPrice || ''}
                    onChange={(e) => handleFilterChange({ 
                      maxSubscriptionPrice: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Label className="text-xs sm:text-sm whitespace-nowrap">Sort Order:</Label>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={filters.sortOrder === 'desc' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange({ sortOrder: 'desc' })}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    High to Low
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'asc' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange({ sortOrder: 'asc' })}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    Low to High
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Results Summary */}
        <div className="text-xs sm:text-sm text-muted-foreground text-center pt-2 border-t">
          <div className="mb-1">
            Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} creators
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
