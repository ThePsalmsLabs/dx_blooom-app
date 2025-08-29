'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface CarouselProps {
  children: React.ReactNode[]
  className?: string
  itemClassName?: string
  showDots?: boolean
  showArrows?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  itemsPerView?: {
    mobile: number
    tablet: number
    desktop: number
  }
  gap?: number
  infinite?: boolean
  onSlideChange?: (index: number) => void
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  itemClassName,
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 16,
  infinite = true,
  onSlideChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const totalItems = children.length

  // Calculate items per view based on screen size
  const getItemsPerView = useCallback(() => {
    if (typeof window === 'undefined') return itemsPerView.mobile

    const width = window.innerWidth
    if (width >= 1024) return itemsPerView.desktop
    if (width >= 768) return itemsPerView.tablet
    return itemsPerView.mobile
  }, [itemsPerView])

  const [itemsPerViewCurrent, setItemsPerViewCurrent] = useState(getItemsPerView())

  useEffect(() => {
    const handleResize = () => {
      setItemsPerViewCurrent(getItemsPerView())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getItemsPerView])

  const maxIndex = Math.max(0, totalItems - itemsPerViewCurrent)
  const canGoNext = infinite || currentIndex < maxIndex
  const canGoPrev = infinite || currentIndex > 0

  const nextSlide = useCallback(() => {
    if (!canGoNext) return

    setCurrentIndex(prev => {
      const next = infinite
        ? (prev + 1) % totalItems
        : Math.min(prev + 1, maxIndex)
      onSlideChange?.(next)
      return next
    })
  }, [canGoNext, infinite, totalItems, maxIndex, onSlideChange])

  const prevSlide = useCallback(() => {
    if (!canGoPrev) return

    setCurrentIndex(prev => {
      const next = infinite
        ? (prev - 1 + totalItems) % totalItems
        : Math.max(prev - 1, 0)
      onSlideChange?.(next)
      return next
    })
  }, [canGoPrev, infinite, totalItems, onSlideChange])

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index > maxIndex) return
    setCurrentIndex(index)
    onSlideChange?.(index)
  }, [maxIndex, onSlideChange])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, nextSlide])

  // Handle drag end
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)

    const threshold = 50
    if (info.offset.x > threshold && canGoPrev) {
      prevSlide()
    } else if (info.offset.x < -threshold && canGoNext) {
      nextSlide()
    }
  }, [canGoPrev, canGoNext, prevSlide, nextSlide])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  if (totalItems === 0) return null

  return (
    <div className={cn('relative w-full', className)}>
      {/* Main carousel container */}
      <div className="overflow-hidden rounded-lg">
        <motion.div
          className="flex"
          style={{ gap: `${gap}px` }}
          animate={{
            x: `-${currentIndex * (100 / itemsPerViewCurrent)}%`
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className={cn(
                'flex-shrink-0',
                itemClassName
              )}
              style={{
                width: `calc(${100 / itemsPerViewCurrent}% - ${gap * (itemsPerViewCurrent - 1) / itemsPerViewCurrent}px)`
              }}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalItems > itemsPerViewCurrent && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full',
              'bg-background/80 backdrop-blur-sm border-border/50',
              'hover:bg-background hover:border-border',
              'transition-all duration-200 shadow-sm',
              !canGoPrev && 'opacity-50 cursor-not-allowed'
            )}
            onClick={prevSlide}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full',
              'bg-background/80 backdrop-blur-sm border-border/50',
              'hover:bg-background hover:border-border',
              'transition-all duration-200 shadow-sm',
              !canGoNext && 'opacity-50 cursor-not-allowed'
            )}
            onClick={nextSlide}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && totalItems > itemsPerViewCurrent && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(totalItems / itemsPerViewCurrent) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                currentIndex === index
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Specialized carousel for creators
export const CreatorsCarousel: React.FC<{
  creators: React.ReactNode[]
  className?: string
  autoPlay?: boolean
}> = ({ creators, className, autoPlay = true }) => {
  return (
    <Carousel
      className={className}
      itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
      gap={12}
      autoPlay={autoPlay}
      autoPlayInterval={4000}
      showDots={true}
      showArrows={true}
      infinite={true}
    >
      {creators}
    </Carousel>
  )
}

// Specialized carousel for content
export const ContentCarousel: React.FC<{
  content: React.ReactNode[]
  className?: string
  autoPlay?: boolean
}> = ({ content, className, autoPlay = true }) => {
  return (
    <Carousel
      className={className}
      itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
      gap={16}
      autoPlay={autoPlay}
      autoPlayInterval={5000}
      showDots={true}
      showArrows={true}
      infinite={true}
    >
      {content}
    </Carousel>
  )
}
