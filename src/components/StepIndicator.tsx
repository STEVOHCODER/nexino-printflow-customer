import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { FlowStep } from '../lib/types';

interface StepIndicatorProps {
  currentStep: FlowStep;
}

const STEPS: { key: FlowStep; label: string; number: number }[] = [
  { key: 'upload', label: 'Upload', number: 1 },
  { key: 'options', label: 'Options', number: 2 },
  { key: 'payment', label: 'Pay', number: 3 },
  { key: 'status', label: 'Status', number: 4 },
];

const STEP_ORDER: FlowStep[] = ['upload', 'options', 'payment', 'status'];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100',
                    isFuture && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={clsx(
                    'text-xs mt-1.5 font-medium whitespace-nowrap',
                    isCompleted && 'text-green-600',
                    isCurrent && 'text-primary-600',
                    isFuture && 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-18px]">
                  <div
                    className={clsx(
                      'h-0.5 w-full rounded-full transition-colors duration-300',
                      idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
