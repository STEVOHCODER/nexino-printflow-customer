import { Minus, Plus, Palette, FileText } from 'lucide-react';
import clsx from 'clsx';
import type { PrintOptions, PriceCalculation, Station } from '../lib/types';
import { formatPrice } from '../lib/api';

interface PrintOptionsProps {
  options: PrintOptions;
  pageCount: number;
  station: Station;
  price: PriceCalculation | null;
  onUpdate: (updates: Partial<PrintOptions>) => void;
}

export default function PrintOptionsView({
  options,
  pageCount,
  station,
  price,
  onUpdate,
}: PrintOptionsProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white rounded-2xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Print Options</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Copies</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdate({ copies: Math.max(1, options.copies - 1) })}
              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
              disabled={options.copies <= 1}
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-20 h-12 rounded-xl border border-gray-200 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-900 tabular-nums">
                {options.copies}
              </span>
            </div>
            <button
              onClick={() =>
                onUpdate({ copies: Math.min(station.settings.max_copies, options.copies + 1) })
              }
              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
              disabled={options.copies >= station.settings.max_copies}
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-500">
              of {station.settings.max_copies} max
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Color Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ color_mode: 'bw' })}
              className={clsx(
                'h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all',
                options.color_mode === 'bw'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              <FileText className="w-5 h-5" />
              <span>B&W</span>
            </button>
            <button
              onClick={() => onUpdate({ color_mode: 'color' })}
              className={clsx(
                'h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all',
                options.color_mode === 'color'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              <Palette className="w-5 h-5" />
              <span>Color</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Paper Size</label>
          <select
            value={options.paper_size}
            onChange={(e) =>
              onUpdate({ paper_size: e.target.value as PrintOptions['paper_size'] })
            }
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-base text-gray-900 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="A3">A3 (297 × 420 mm)</option>
            <option value="A5">A5 (148 × 210 mm)</option>
            <option value="Letter">Letter (8.5 × 11 in)</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Double-Sided</label>
            <button
              onClick={() => onUpdate({ duplex: !options.duplex })}
              className={clsx(
                'relative w-14 h-8 rounded-full transition-colors duration-200',
                options.duplex ? 'bg-primary-500' : 'bg-gray-200'
              )}
              role="switch"
              aria-checked={options.duplex}
            >
              <span
                className={clsx(
                  'absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200',
                  options.duplex && 'translate-x-6'
                )}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {options.duplex ? 'Printing on both sides' : 'Single-sided printing'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Page Range</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ page_range: 'all' })}
              className={clsx(
                'h-11 rounded-xl border-2 text-sm font-medium transition-all',
                options.page_range === 'all'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              All Pages ({pageCount})
            </button>
            <input
              type="text"
              placeholder="e.g. 1-5, 8"
              value={options.page_range === 'all' ? '' : options.page_range}
              onChange={(e) =>
                onUpdate({ page_range: e.target.value || 'all' })
              }
              onFocus={() => {
                if (options.page_range === 'all') onUpdate({ page_range: '' });
              }}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {price && (
        <div className="bg-white rounded-2xl p-5 animate-fade-in">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {price.pages} page{price.pages !== 1 ? 's' : ''} × {options.copies} cop{options.copies !== 1 ? 'ies' : 'y'}
              </span>
              <span>{formatPrice(price.subtotal * options.copies, price.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>
                Per page ({options.color_mode === 'color' ? 'Color' : 'B&W'})
              </span>
              <span>{formatPrice(price.per_page, price.currency)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(price.total, price.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
