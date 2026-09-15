import { useState, useCallback, useRef } from 'react';
import type { Station, UploadedFile, Job, PrintOptions, FlowStep } from '../lib/types';
import { uploadFile, createJob, processPayment, cancelJob, calculatePrice, getStation, checkStationReadiness } from '../lib/api';
import toast from 'react-hot-toast';

const DEFAULT_OPTIONS: PrintOptions = {
  copies: 1,
  color_mode: 'bw',
  paper_size: 'A4',
  duplex: false,
  page_range: 'all',
  color_pages: [],
  cover_color: false,
  include_cover: true,
};

interface PrintJobState {
  step: FlowStep;
  station: Station | null;
  file: UploadedFile | null;
  options: PrintOptions;
  job: Job | null;
  uploadProgress: number;
  isLoading: boolean;
  error: string | null;
}

export function usePrintJob(stationId: string | null) {
  const [state, setState] = useState<PrintJobState>({
    step: 'upload',
    station: null,
    file: null,
    options: { ...DEFAULT_OPTIONS },
    job: null,
    uploadProgress: 0,
    isLoading: false,
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const loadStation = useCallback(async () => {
    if (!stationId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const station = await getStation(stationId);
      setState((s) => ({ ...s, station, isLoading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load station',
      }));
    }
  }, [stationId]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!stationId) return;
      setState((s) => ({ ...s, isLoading: true, error: null, uploadProgress: 0 }));
      try {
        const uploaded = await uploadFile(stationId, file, (progress) => {
          setState((s) => ({ ...s, uploadProgress: progress }));
        });
        setState((s) => ({
          ...s,
          file: uploaded,
          isLoading: false,
          uploadProgress: 100,
          step: 'options',
        }));
        toast.success('File uploaded successfully!');
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          uploadProgress: 0,
          error: err instanceof Error ? err.message : 'Upload failed',
        }));
        toast.error('Upload failed. Please try again.');
      }
    },
    [stationId]
  );

  const updateOptions = useCallback((updates: Partial<PrintOptions>) => {
    setState((s) => ({
      ...s,
      options: { ...s.options, ...updates },
    }));
  }, []);

  const goToPayment = useCallback(() => {
    setState((s) => ({ ...s, step: 'payment' }));
  }, []);

  const handlePayment = useCallback(async () => {
    const { station, file, options } = state;
    if (!station || !file) return;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    // PRE-PAYMENT CHECK: Verify printer hardware is ready before allowing payment
    try {
      const readiness = await checkStationReadiness(station.id);
      if (!readiness.ready) {
        const reason = readiness.blockingReason || 'Printer is not ready';
        setState((s) => ({
          ...s,
          isLoading: false,
          error: reason,
        }));
        toast.error(reason);
        return;
      }
    } catch (err) {
      // If readiness check fails (network error), allow payment to proceed
      // (the agent will handle printer errors downstream)
      console.warn('Readiness check failed, proceeding with payment:', err);
    }

    try {
      const job = await createJob({
        stationId: station.id,
        fileId: file.id,
        pageCount: file.page_count,
        copies: options.copies,
        colorMode: options.color_mode === 'mixed' ? 'MIXED' : options.color_mode === 'color' ? 'COLOR' : 'BW',
        paperSize: options.paper_size,
        duplex: options.duplex,
        idempotencyKey: `job-${Date.now()}`,
      });

      const paidJob = await processPayment(job.id);

      setState((s) => ({
        ...s,
        job: { ...job, payment_status: 'completed' } as any,
        isLoading: false,
        step: 'status',
      }));
      toast.success('Payment successful!');

      startPolling(job.id);
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Payment failed',
      }));
      toast.error('Payment failed. Please try again.');
    }
  }, [state]);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const { getJobStatus } = await import('../lib/api');
          const job = await getJobStatus(jobId);
          setState((s) => ({ ...s, job }));

          if (['completed', 'failed', 'cancelled'].includes(job.status)) {
            stopPolling();
            if (job.status === 'completed') {
              toast.success('Your print job is complete!');
            } else if (job.status === 'failed') {
              toast.error('Print job failed. Please try again.');
            }
          }
        } catch {
          // silently continue polling
        }
      }, 2000);
    },
    [stopPolling]
  );

  const handleCancel = useCallback(async () => {
    const { job } = state;
    if (!job) return;
    try {
      await cancelJob(job.id);
      setState((s) => ({ ...s, job: { ...s.job!, status: 'cancelled' } }));
      stopPolling();
      toast.success('Job cancelled');
    } catch (err) {
      toast.error('Failed to cancel job');
    }
  }, [state.job, stopPolling]);

  const handleRetry = useCallback(() => {
    setState((s) => ({
      ...s,
      step: 'upload',
      file: null,
      job: null,
      options: { ...DEFAULT_OPTIONS },
      uploadProgress: 0,
      error: null,
    }));
    stopPolling();
  }, [stopPolling]);

  const goBack = useCallback(() => {
    setState((s) => {
      switch (s.step) {
        case 'options':
          return { ...s, step: 'upload' };
        case 'payment':
          return { ...s, step: 'options' };
        default:
          return s;
      }
    });
  }, []);

  const price = state.station && state.file
    ? calculatePrice({
        stationId: state.station.id,
        pageCount: state.file.page_count,
        colorMode: state.options.color_mode === 'mixed' ? 'MIXED' : state.options.color_mode === 'color' ? 'COLOR' : 'BW',
        paperSize: state.options.paper_size,
        copies: state.options.copies,
        duplex: state.options.duplex,
        colorPages: state.options.color_pages,
        coverColor: state.options.cover_color,
      })
    : null;

  return {
    ...state,
    price: null,
    loadStation,
    handleUpload,
    updateOptions,
    goToPayment,
    handlePayment,
    handleCancel,
    handleRetry,
    goBack,
  };
}
