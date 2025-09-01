'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, PanInfo } from 'framer-motion'
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
  gap?: number | { mobile: number; tablet: number; desktop: number }
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
  gap = { mobile: 16, tablet: 24, desktop: 32 },
  infinite = true,
  onSlideChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const totalItems = children.length

  // Calculate items per view and gap based on screen size
  const getResponsiveValues = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        itemsPerView: itemsPerView.mobile,
        gap: typeof gap === 'number' ? gap : gap.mobile
      }
    }

    const width = window.innerWidth
    let currentItemsPerView: number
    let currentGap: number

    if (width >= 1024) {
      currentItemsPerView = itemsPerView.desktop
      currentGap = typeof gap === 'number' ? gap : gap.desktop
    } else if (width >= 768) {
      currentItemsPerView = itemsPerView.tablet
      currentGap = typeof gap === 'number' ? gap : gap.tablet
    } else {
      currentItemsPerView = itemsPerView.mobile
      currentGap = typeof gap === 'number' ? gap : gap.mobile
    }

    return { itemsPerView: currentItemsPerView, gap: currentGap }
  }, [itemsPerView, gap])

  const [{ itemsPerView: itemsPerViewCurrent, gap: currentGap }, setResponsiveValues] = useState(getResponsiveValues())

  useEffect(() => {
    const handleResize = () => {
      setResponsiveValues(getResponsiveValues())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveValues])

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
    <div className={cn('relative w-full px-4 sm:px-6 lg:px-16 xl:px-24', className)}>
      {/* Samsung-Style Curved Border Container */}
      <div className="relative">
        {/* Multi-Layer Outer Glow Effect - Samsung Style */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/25 to-pink-600/30 rounded-[2.5rem] blur-2xl opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/25 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/15 via-purple-600/20 to-pink-600/15 rounded-[2.5rem] blur-lg opacity-40"></div>

        {/* Main Border Container - Premium Samsung Glass Effect */}
        <div className="relative bg-gradient-to-br from-background/95 via-background/98 to-background/95 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Inner Highlight Border - Samsung Glass Reflection */}
          <div className="absolute inset-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent rounded-[2.4rem]"></div>
          <div className="absolute inset-[2px] bg-gradient-to-tl from-black/5 via-transparent to-white/5 rounded-[2.3rem]"></div>

          {/* Samsung Curved Screen Effect - Premium Glass */}
          <div className="relative bg-gradient-to-b from-background/90 via-background/95 to-background/90 rounded-[2.4rem] backdrop-blur-md border border-white/5 shadow-inner">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5 rounded-[2.4rem]"></div>

            {/* Content Area with Samsung-Style Padding */}
            <div className="relative p-6 lg:p-8 xl:p-10">
              <motion.div
                className="flex"
                style={{ gap: `${currentGap}px` }}
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
                      'flex-shrink-0 transition-transform duration-200 hover:scale-105',
                      itemClassName
                    )}
                    style={{
                      width: `calc(${100 / itemsPerViewCurrent}% - ${currentGap * (itemsPerViewCurrent - 1) / itemsPerViewCurrent}px)`
                    }}
                  >
                    {child}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalItems > itemsPerViewCurrent && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute left-6 lg:left-8 xl:left-10 top-1/2 -translate-y-1/2 h-12 w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-full',
              'bg-gradient-to-br from-background/95 via-background/90 to-background/85',
              'backdrop-blur-xl border border-white/30 shadow-2xl',
              'hover:bg-gradient-to-br hover:from-background hover:via-background/95 hover:to-background/90',
              'hover:border-white/40 hover:shadow-3xl hover:scale-110',
              'transition-all duration-300 ease-out',
              'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100',
              !canGoPrev && 'opacity-40 cursor-not-allowed hover:scale-100'
            )}
            onClick={prevSlide}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 relative z-10" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              'absolute right-6 lg:right-8 xl:right-10 top-1/2 -translate-y-1/2 h-12 w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-full',
              'bg-gradient-to-br from-background/95 via-background/90 to-background/85',
              'backdrop-blur-xl border border-white/30 shadow-2xl',
              'hover:bg-gradient-to-br hover:from-background hover:via-background/95 hover:to-background/90',
              'hover:border-white/40 hover:shadow-3xl hover:scale-110',
              'transition-all duration-300 ease-out',
              'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100',
              !canGoNext && 'opacity-40 cursor-not-allowed hover:scale-100'
            )}
            onClick={nextSlide}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 relative z-10" />
          </Button>
        </>
      )}

      {/* Premium Dots Indicator - Samsung Style */}
      {showDots && totalItems > itemsPerViewCurrent && (
        <div className="flex justify-center mt-8 space-x-4">
          {Array.from({ length: Math.ceil(totalItems / itemsPerViewCurrent) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'relative transition-all duration-500 cursor-pointer group',
                currentIndex === index
                  ? 'w-8 h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 scale-110 shadow-lg shadow-purple-500/30'
                  : 'w-3 h-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 hover:scale-125'
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Inner glow effect for active dot */}
              {currentIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-sm opacity-60 animate-pulse"></div>
              )}
              {/* Subtle border effect */}
              <div className={cn(
                'absolute inset-0 rounded-full border',
                currentIndex === index
                  ? 'border-white/30 shadow-inner'
                  : 'border-white/10 group-hover:border-white/20'
              )}></div>
            </button>
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
      className={cn('max-w-7xl mx-auto px-4 lg:px-8 xl:px-12', className)}
      itemsPerView={{ mobile: 1, tablet: 2, desktop: 2 }}
      gap={{ mobile: 20, tablet: 32, desktop: 64 }}
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
      className={cn('max-w-7xl mx-auto px-4 lg:px-8 xl:px-12', className)}
      itemsPerView={{ mobile: 1, tablet: 2, desktop: 2 }}
      gap={{ mobile: 20, tablet: 32, desktop: 64 }}
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
