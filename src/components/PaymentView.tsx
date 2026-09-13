import { useState } from 'react';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import type { UploadedFile, PrintOptions, PriceCalculation } from '../lib/types';
import { formatPrice } from '../lib/api';

interface PaymentViewProps {
  file: UploadedFile;
  options: PrintOptions;
  price: PriceCalculation;
  isLoading: boolean;
  onPay: () => void;
}

export default function PaymentView({
  file,
  options,
  price,
  isLoading,
  onPay,
}: PaymentViewProps) {
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await onPay();
    setProcessing(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
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
              {formatPrice(price.total, price.currency)}
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
        disabled={isLoading || processing}
        className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading || processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            PAY NOW — {formatPrice(price.total, price.currency)}
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your print job will start immediately after payment
      </p>
    </div>
  );
}
