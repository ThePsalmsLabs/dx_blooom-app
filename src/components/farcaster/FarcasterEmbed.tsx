/**
 * Farcaster Mini App Embed Component
 *
 * This component adds the necessary meta tags to make pages shareable
 * as rich cards in Farcaster feeds. It should be included in the head
 * of any page you want to be shareable.
 */

import React from 'react'

interface FarcasterEmbedProps {
  /** Page-specific title for the embed */
  title?: string
  /** Page-specific description */
  description?: string
  /** Page-specific image URL */
  image?: string
  /** Action button text */
  buttonText?: string
  /** URL to navigate to when button is clicked */
  buttonTarget?: string
  /** Action type: 'link' or 'post' */
  buttonAction?: 'link' | 'post'
}

export function FarcasterEmbed({
  title = "Bloom - Premium Content",
  description = "Discover premium content from top creators. Purchase with instant USDC payments on Base.",
  image = "https://dxbloom.com/images/miniapp-og-image.png",
  buttonText = "Open App",
  buttonTarget = "https://dxbloom.com/mini",
  buttonAction = "link"
}: FarcasterEmbedProps) {
  // This component doesn't render anything visible
  // It only adds meta tags to the document head
  React.useEffect(() => {
    // Update existing meta tags or create new ones
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Set Farcaster embed meta tags
    updateMetaTag('fc:miniapp', 'v1')
    updateMetaTag('fc:miniapp:url', buttonTarget)
    updateMetaTag('fc:miniapp:name', 'Bloom')
    updateMetaTag('fc:miniapp:image', image)
    updateMetaTag('fc:miniapp:description', description)
    updateMetaTag('fc:miniapp:button:1', buttonText)
    updateMetaTag('fc:miniapp:button:1:action', buttonAction)
    updateMetaTag('fc:miniapp:button:1:target', buttonTarget)

    // Update Open Graph tags for better sharing
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:image', image)
    updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : buttonTarget)

  }, [title, description, image, buttonText, buttonTarget, buttonAction])

  // Return null since this component only manages meta tags
  return null
}

// Export a hook for easier usage
export function useFarcasterEmbed(props: FarcasterEmbedProps) {
  return <FarcasterEmbed {...props} />
}
