import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, FileText, Tag } from 'lucide-react'

interface ContentDetailsStepProps {
  contentData: {
    title: string
    description: string
    category: string
    tags: string[]
    contentType: 'article' | 'video' | 'audio' | 'image'
  }
  onContentDataChange: (data: Partial<ContentDetailsStepProps['contentData']>) => void
  onBack: () => void
  onNext: () => void
}

export default function ContentDetailsStep({
  contentData,
  onContentDataChange,
  onBack,
  onNext
}: ContentDetailsStepProps) {
  const handleTagAdd = (tag: string) => {
    if (tag && !contentData.tags.includes(tag)) {
      onContentDataChange({ tags: [...contentData.tags, tag] })
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    onContentDataChange({ tags: contentData.tags.filter(tag => tag !== tagToRemove) })
  }

  const canProceed = contentData.title.trim() && contentData.description.trim()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>Content Details</CardTitle>
          </div>
          <CardDescription>Tell us about your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={contentData.title}
              onChange={(e) => onContentDataChange({ title: e.target.value })}
              placeholder="Enter your content title..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={contentData.description}
              onChange={(e) => onContentDataChange({ description: e.target.value })}
              placeholder="Describe your content..."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select 
                value={contentData.contentType} 
                onValueChange={(value: 'article' | 'video' | 'audio' | 'image') => 
                  onContentDataChange({ contentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={contentData.category} 
                onValueChange={(value) => onContentDataChange({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {contentData.tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => handleTagRemove(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.target as HTMLInputElement
                    handleTagAdd(input.value.trim())
                    input.value = ''
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  handleTagAdd(input.value.trim())
                  input.value = ''
                }}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="flex-1"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
