import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getJobStatus } from '../lib/api';
import JobStatusView from '../components/JobStatus';
import type { Job } from '../lib/types';

export default function JobStatusPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getJobStatus(jobId);
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (!job || ['completed', 'failed', 'cancelled'].includes(job.status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getJobStatus(jobId!);
        setJob(updated);
      } catch {
        // continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [job, jobId]);

  const handleCancel = async () => {
    if (!job) return;
    try {
      const { cancelJob } = await import('../lib/api');
      await cancelJob(job.id);
      setJob({ ...job, status: 'cancelled' });
    } catch {
      // error handled by toast
    }
  };

  const handleRetry = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading job status...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'This job could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-gray-900">Print Job Status</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <JobStatusView
          job={job}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      </main>

      <footer className="bg-white border-t border-gray-100 px-4 py-3 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">Nexino PrintFlow</span>
        </p>
      </footer>
    </div>
  );
}
