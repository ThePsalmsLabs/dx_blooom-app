import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  X, 
  TrendingUp, 
  Star, 
  Users,
  Calendar,
  CheckCircle2,
  FileText
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Discover Creators ({filteredCount.toLocaleString()})
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creators by address..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.verified === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({ verified: null })}
          >
            All Creators
          </Button>
          <Button
            variant={filters.verified === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({ verified: true })}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Verified Only
          </Button>
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Advanced
          </Button>
        </div>

        {/* Sort Options */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Sort By</Label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={filters.sortBy === value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange({ sortBy: value as any })}
                className="justify-start text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium mb-2 block">
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
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxSubscriptionPrice || ''}
                  onChange={(e) => handleFilterChange({ 
                    maxSubscriptionPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Sort Order:</Label>
              <Button
                variant={filters.sortOrder === 'desc' ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange({ sortOrder: 'desc' })}
              >
                High to Low
              </Button>
              <Button
                variant={filters.sortOrder === 'asc' ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange({ sortOrder: 'asc' })}
              >
                Low to High
              </Button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} creators
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
