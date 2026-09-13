import {
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  FileText,
  CreditCard,
  Loader2,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import type { Job, JobStatus } from '../lib/types';
import { formatPrice } from '../lib/api';

interface JobStatusProps {
  job: Job;
  onCancel: () => void;
  onRetry: () => void;
}

const STATUS_CONFIG: Record<JobStatus, { icon: typeof Clock; label: string; color: string; bgColor: string }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  uploaded: { icon: FileText, label: 'File Uploaded', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  options_set: { icon: FileText, label: 'Options Set', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  payment_pending: { icon: CreditCard, label: 'Payment Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  payment_completed: { icon: CheckCircle2, label: 'Payment Complete', color: 'text-green-500', bgColor: 'bg-green-50' },
  queued: { icon: Clock, label: 'In Queue', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  printing: { icon: Printer, label: 'Printing', color: 'text-primary-500', bgColor: 'bg-primary-50' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-green-500', bgColor: 'bg-green-50' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-500', bgColor: 'bg-red-50' },
  cancelled: { icon: X, label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

const STEPS: { status: JobStatus; label: string }[] = [
  { status: 'uploaded', label: 'Uploaded' },
  { status: 'payment_completed', label: 'Paid' },
  { status: 'queued', label: 'Queued' },
  { status: 'printing', label: 'Printing' },
  { status: 'completed', label: 'Done' },
];

function getStepIndex(status: JobStatus): number {
  if (status === 'completed') return STEPS.length;
  if (status === 'failed' || status === 'cancelled') return -1;
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function JobStatusView({ job, onCancel, onRetry }: JobStatusProps) {
  const config = STATUS_CONFIG[job.status];
  const Icon = config.icon;
  const stepIndex = getStepIndex(job.status);
  const canCancel = ['pending', 'uploaded', 'options_set', 'payment_pending', 'queued'].includes(job.status);
  const isFailed = job.status === 'failed';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', config.bgColor)}>
            {job.status === 'printing' ? (
              <Loader2 className={clsx('w-6 h-6 animate-spin', config.color)} />
            ) : (
              <Icon className={clsx('w-6 h-6', config.color)} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
            {job.estimated_completion && (
              <p className="text-sm text-gray-500">Estimated: {job.estimated_completion}</p>
            )}
          </div>
        </div>

        <div className="space-y-0">
          {STEPS.map((step, idx) => {
            const isCompleted = stepIndex > idx;
            const isCurrent = stepIndex === idx;
            const isFuture = stepIndex < idx;

            return (
              <div key={step.status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                      isCompleted && 'bg-green-500 border-green-500',
                      isCurrent && 'bg-primary-500 border-primary-500',
                      isFuture && 'bg-white border-gray-200'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'w-0.5 h-6 my-1',
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-primary-600',
                      isFuture && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Job Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Job ID</span>
            <span className="text-gray-900 font-mono text-xs">{job.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="text-gray-900 font-semibold">{formatPrice(job.price || job.total_price || 0, job.currency)}</span>
          </div>
        </div>
      </div>

      {isFailed && job.error_message && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{job.error_message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {canCancel && (
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
        {isFailed && (
          <button
            onClick={onRetry}
            className="flex-1 h-12 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
