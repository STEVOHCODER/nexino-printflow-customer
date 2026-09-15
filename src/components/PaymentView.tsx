import { useState, useEffect } from 'react';
import { CreditCard, Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { UploadedFile, PrintOptions, PriceCalculation } from '../lib/types';
import { formatPrice, checkStationReadiness, type StationReadiness } from '../lib/api';

interface PaymentViewProps {
  file: UploadedFile;
  options: PrintOptions;
  price: PriceCalculation;
  stationId: string;
  isLoading: boolean;
  onPay: () => void;
}

export default function PaymentView({
  file,
  options,
  price,
  stationId,
  isLoading,
  onPay,
}: PaymentViewProps) {
  const [processing, setProcessing] = useState(false);
  const [readiness, setReadiness] = useState<StationReadiness | null>(null);
  const [checkingPrinter, setCheckingPrinter] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkStationReadiness(stationId);
        setReadiness(result);
      } catch {
        setReadiness(null);
      } finally {
        setCheckingPrinter(false);
      }
    };
    check();
    // Re-check every 10 seconds
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [stationId]);

  const handlePay = async () => {
    setProcessing(true);
    await onPay();
    setProcessing(false);
  };

  const printerReady = readiness?.ready ?? true; // default to true if check failed
  const canPay = printerReady && !isLoading && !processing;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Printer Status Banner */}
      {checkingPrinter ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-700">Checking printer status...</span>
        </div>
      ) : readiness && !readiness.ready ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">Printer Not Ready</span>
          </div>
          <p className="text-sm text-red-600 ml-8">{readiness.blockingReason}</p>
          {readiness.printers.length > 0 && (
            <div className="mt-3 ml-8 space-y-1">
              {readiness.printers.map((p, i) => (
                <div key={i} className="text-xs text-red-500">
                  {p.name}: {p.status} | Paper: {p.paperStatus} | Toner: {p.tonerStatus}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : readiness?.ready ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700">Printer is ready</span>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Document</span>
            <span className="text-gray-900 font-medium truncate ml-4 max-w-[60%] text-right">
              {file.original_name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pages</span>
            <span className="text-gray-900">{file.page_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Copies</span>
            <span className="text-gray-900">{options.copies}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Color</span>
            <span className="text-gray-900">{options.color_mode === 'color' ? 'Color' : 'B&W'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paper</span>
            <span className="text-gray-900">{options.paper_size}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Double-Sided</span>
            <span className="text-gray-900">{options.duplex ? 'Yes' : 'No'}</span>
          </div>
          {options.page_range !== 'all' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Page Range</span>
              <span className="text-gray-900">{options.page_range}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-3xl font-bold text-primary-600 tabular-nums">
              {formatPrice(price.totalPrice, price.currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Pay at Station</p>
            <p className="text-xs text-gray-500">Cash or card accepted</p>
          </div>
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={!canPay}
        className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading || processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : !printerReady ? (
          <>
            <AlertTriangle className="w-5 h-5" />
            Printer Not Ready
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            PAY NOW — {formatPrice(price.totalPrice, price.currency)}
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your print job will start immediately after payment
      </p>
    </div>
  );
}
