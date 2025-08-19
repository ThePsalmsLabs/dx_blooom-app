// 'use client'

// import React, { Suspense } from 'react'
// import { UnifiedContentBrowser } from '@/components/content/UnifiedContentBrowser'
// import { AdaptiveNavigation } from '@/components/layout/AdaptiveNavigation'
// import { useUnifiedApp } from '@/providers/UnifiedAppProvider'

// function MiniAppContent() {
//   const { state } = useUnifiedApp()
  
//   return (
//     <div className="min-h-screen" data-context="miniapp">
//       <AdaptiveNavigation 
//         context="miniapp"
//         userRole={state.user.userRole}
//         showBrand={true}
//       />
      
//       <main className="container-unified space-content-padding">
//         <UnifiedContentBrowser
//           context="miniapp"
//           showCreatorInfo={false}
//           showSocialFeatures={true}
//           enableAdvancedFiltering={false}
//           itemsPerPage={8}
//         />
//       </main>
//     </div>
//   )
// }

// export default function MiniAppPage(): React.ReactElement {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-muted-foreground">Loading MiniApp...</p>
//         </div>
//       </div>
//     }>
//       <MiniAppContent />
//     </Suspense>
//   )
// }


'use client'

import { UpgradedMiniAppInterface } from '@/components/miniapp/UpgradedMiniAppInterface'
import { Suspense } from 'react'

export default function MiniAppPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradedMiniAppInterface />
    </Suspense>
  )
}