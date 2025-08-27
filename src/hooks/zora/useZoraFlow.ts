import { useState, useCallback, useMemo } from 'react'

export type FlowStep = 'setup' | 'content' | 'nft' | 'review' | 'success'

interface FlowState {
  currentStep: FlowStep
  steps: Array<{
    key: FlowStep
    label: string
    description?: string
  }>
  progress: number
  canProceed: boolean
  canGoBack: boolean
}

interface UseZoraFlowReturn extends FlowState {
  setCurrentStep: (step: FlowStep) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: FlowStep) => void
  resetFlow: () => void
}

export function useZoraFlow(initialStep: FlowStep = 'setup'): UseZoraFlowReturn {
  const [currentStep, setCurrentStep] = useState<FlowStep>(initialStep)

  const steps = useMemo(() => [
    { key: 'setup' as FlowStep, label: 'Setup', description: 'Create collection' },
    { key: 'content' as FlowStep, label: 'Content', description: 'Add content details' },
    { key: 'nft' as FlowStep, label: 'NFT Options', description: 'Configure NFT settings' },
    { key: 'review' as FlowStep, label: 'Review', description: 'Review and confirm' },
    { key: 'success' as FlowStep, label: 'Success', description: 'Complete' }
  ], [])

  const currentIndex = useMemo(() => 
    steps.findIndex(step => step.key === currentStep), 
    [steps, currentStep]
  )

  const progress = useMemo(() => 
    Math.round(((currentIndex + 1) / steps.length) * 100), 
    [currentIndex, steps.length]
  )

  const canProceed = useMemo(() => 
    currentIndex < steps.length - 1, 
    [currentIndex, steps.length]
  )

  const canGoBack = useMemo(() => 
    currentIndex > 0, 
    [currentIndex]
  )

  const nextStep = useCallback(() => {
    if (canProceed) {
      const nextIndex = currentIndex + 1
      setCurrentStep(steps[nextIndex].key)
    }
  }, [canProceed, currentIndex, steps])

  const previousStep = useCallback(() => {
    if (canGoBack) {
      const prevIndex = currentIndex - 1
      setCurrentStep(steps[prevIndex].key)
    }
  }, [canGoBack, currentIndex, steps])

  const goToStep = useCallback((step: FlowStep) => {
    setCurrentStep(step)
  }, [])

  const resetFlow = useCallback(() => {
    setCurrentStep(initialStep)
  }, [initialStep])

  return {
    currentStep,
    steps,
    progress,
    canProceed,
    canGoBack,
    setCurrentStep,
    nextStep,
    previousStep,
    goToStep,
    resetFlow
  }
}
