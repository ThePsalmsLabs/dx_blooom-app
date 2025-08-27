import React from 'react'
import { Progress } from '@/components/ui/progress'
import { CheckCircle } from 'lucide-react'

interface ProgressTrackerProps {
  currentStep: string
  steps: Array<{
    key: string
    label: string
    description?: string
  }>
  progress: number
}

export default function ProgressTracker({ currentStep, steps, progress }: ProgressTrackerProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const currentIndex = steps.findIndex(s => s.key === currentStep)
          const isActive = index === currentIndex
          const isComplete = index < currentIndex
          
          return (
            <div key={step.key} className={`flex items-center space-x-2 ${
              isComplete ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isComplete ? 'bg-green-100 text-green-600' : 
                isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>
                {isComplete ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium">{step.label}</div>
                {step.description && (
                  <div className="text-xs text-gray-500">{step.description}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
