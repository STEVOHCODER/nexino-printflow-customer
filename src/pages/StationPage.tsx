import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { usePrintJob } from '../hooks/usePrintJob';
import StationHeader from '../components/StationHeader';
import StepIndicator from '../components/StepIndicator';
import FileUpload from '../components/FileUpload';
import PrintOptionsView from '../components/PrintOptions';
import PaymentView from '../components/PaymentView';
import JobStatusView from '../components/JobStatus';
import type { PriceCalculation } from '../lib/types';

export default function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const [price, setPrice] = useState<PriceCalculation | null>(null);
  const {
    step,
    station,
    file,
    options,
    job,
    uploadProgress,
    isLoading,
    error,
    loadStation,
    handleUpload,
    updateOptions,
    goToPayment,
    handlePayment,
    handleCancel,
    handleRetry,
    goBack,
  } = usePrintJob(stationId || null);

  useEffect(() => {
    loadStation();
  }, [loadStation]);

  if (isLoading && !station) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading station...</p>
        </div>
      </div>
    );
  }

  if (error && !station) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Station Unavailable</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadStation}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {station && <StationHeader station={station} />}

      <div className="bg-white border-b border-gray-100">
        <StepIndicator currentStep={step} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5">
          {(step === 'upload' || step === 'options' || step === 'payment') && step !== 'upload' && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step === 'upload' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Upload Your PDF</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Start by uploading the document you want to print
                </p>
              </div>
              <FileUpload
                uploadedFile={file}
                uploadProgress={uploadProgress}
                isLoading={isLoading}
                onUpload={handleUpload}
                onRemove={() => handleRetry()}
              />
            </div>
          )}

          {step === 'options' && file && station && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Choose Options</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Customize your print settings
                </p>
              </div>
              <PrintOptionsView
                stationId={station.id}
                pageCount={file.page_count}
                options={options}
                onOptionsChange={updateOptions}
                onConfirm={(p) => { setPrice(p); goToPayment(); }}
                onBack={() => {}}
              />
            </div>
          )}

          {step === 'payment' && file && price && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Review & Pay</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Confirm your order and complete payment
                </p>
              </div>
              <PaymentView
                file={file}
                options={options}
                price={price}
                stationId={station?.id || ''}
                isLoading={isLoading}
                onPay={handlePayment}
              />
            </div>
          )}

          {step === 'status' && job && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Job Status</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Track your print job in real-time
                </p>
              </div>
              <JobStatusView
                job={job}
                onCancel={handleCancel}
                onRetry={handleRetry}
              />
            </div>
          )}

          {error && step !== 'upload' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 px-4 py-3 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">Nexino PrintFlow</span>
        </p>
      </footer>
    </div>
  );
}
