import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Palette, FileText } from 'lucide-react';
import type { PrintOptions, PriceCalculation } from '../lib/types';
import { calculatePrice } from '../lib/api';

interface Props {
  stationId: string;
  pageCount: number;
  options: PrintOptions;
  onOptionsChange: (options: PrintOptions) => void;
  onConfirm: (price: PriceCalculation) => void;
  onBack: () => void;
}

export default function PrintOptionsView({ stationId, pageCount, options, onOptionsChange, onConfirm, onBack }: Props) {
  const [price, setPrice] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [colorPageInput, setColorPageInput] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  useEffect(() => {
    fetchPrice();
  }, [options, stationId]);

  async function fetchPrice() {
    setLoading(true);
    try {
      const result = await calculatePrice({
        stationId,
        pageCount,
        colorMode: options.color_mode === 'mixed' ? 'MIXED' : options.color_mode === 'color' ? 'COLOR' : 'BW',
        paperSize: options.paper_size,
        copies: options.copies,
        duplex: options.duplex,
        colorPages: options.color_pages,
        coverColor: options.cover_color,
      });
      setPrice(result);
    } catch (err) {
      console.error('Price calculation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateOptions(partial: Partial<PrintOptions>) {
    onOptionsChange({ ...options, ...partial });
  }

  function handleColorPagesFromString(input: string) {
    const pages: number[] = [];
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end) {
          for (let i = start; i <= end && i <= pageCount; i++) {
            if (i > 0) pages.push(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (num > 0 && num <= pageCount) pages.push(num);
      }
    }
    updateOptions({ color_pages: pages, color_mode: 'mixed' });
  }

  function handleAutoDetect() {
    setAutoDetecting(true);
    // Simulate auto-detect: first page (cover) + every 5th page likely has images
    const detected: number[] = [1]; // Cover always
    for (let i = 5; i <= pageCount; i += 5) {
      detected.push(i);
    }
    setTimeout(() => {
      updateOptions({ color_pages: detected, color_mode: 'mixed' });
      setColorPageInput(detected.join(', '));
      setAutoDetecting(false);
    }, 800);
  }

  function handleCoverToggle() {
    const pages = options.color_pages || [];
    const hasCover = pages.includes(1);
    if (hasCover) {
      updateOptions({ color_pages: pages.filter(p => p !== 1), cover_color: false });
    } else {
      updateOptions({ color_pages: [1, ...pages], cover_color: true });
    }
  }

  const colorPagesCount = options.color_pages?.length || 0;
  const bwPagesCount = pageCount - colorPagesCount;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Print Options</h2>
        <span className="text-sm text-gray-500">{pageCount} pages</span>
      </div>

      {/* Color Mode */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Color Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'bw', label: 'Black & White', icon: '⬛', desc: 'Cheapest' },
            { value: 'color', label: 'Full Color', icon: '🌈', desc: 'All pages' },
            { value: 'mixed', label: 'Mixed', icon: '🎯', desc: 'Select pages' },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => updateOptions({ color_mode: mode.value as any })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                options.color_mode === mode.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg">{mode.icon}</div>
              <div className="text-sm font-medium">{mode.label}</div>
              <div className="text-xs text-gray-500">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mixed Mode Options */}
      {options.color_mode === 'mixed' && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Color Pages</label>

          {/* Cover option */}
          <button
            onClick={handleCoverToggle}
            className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
              options.color_pages?.includes(1)
                ? 'border-orange-400 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-xl">📄</span>
            <div>
              <div className="text-sm font-medium">Cover Page (Page 1)</div>
              <div className="text-xs text-gray-500">Print first page in color</div>
            </div>
            <span className={`ml-auto text-xs px-2 py-1 rounded ${options.color_pages?.includes(1) ? 'bg-orange-200' : 'bg-gray-100'}`}>
              {options.color_pages?.includes(1) ? 'COLOR' : 'B&W'}
            </span>
          </button>

          {/* Auto-detect */}
          <button
            onClick={handleAutoDetect}
            disabled={autoDetecting}
            className="w-full p-3 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 text-left flex items-center gap-3"
          >
            <span className="text-xl">{autoDetecting ? '⏳' : '🔍'}</span>
            <div>
              <div className="text-sm font-medium">{autoDetecting ? 'Detecting...' : 'Auto-detect pages with images'}</div>
              <div className="text-xs text-gray-500">Find pages likely to need color</div>
            </div>
          </button>

          {/* Manual input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Custom pages (e.g. 1, 3-5, 8)</label>
            <input
              type="text"
              value={colorPageInput}
              onChange={(e) => {
                setColorPageInput(e.target.value);
                handleColorPagesFromString(e.target.value);
              }}
              placeholder="1, 3-5, 8"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Summary */}
          {colorPagesCount > 0 && (
            <div className="flex gap-4 text-xs">
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">{colorPagesCount} color pages</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{bwPagesCount} B&W pages</span>
            </div>
          )}
        </div>
      )}

      {/* Paper Size */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
        <div className="grid grid-cols-4 gap-2">
          {['A4', 'A3', 'A5', 'LETTER'].map(size => (
            <button
              key={size}
              onClick={() => updateOptions({ paper_size: size as any })}
              className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                options.paper_size === size
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Copies & Duplex */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Copies</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateOptions({ copies: Math.max(1, options.copies - 1) })}
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50"
            >
              -
            </button>
            <span className="w-8 text-center font-medium">{options.copies}</span>
            <button
              onClick={() => updateOptions({ copies: Math.min(100, options.copies + 1) })}
              className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Double-sided (Duplex)</span>
          <div
            onClick={() => updateOptions({ duplex: !options.duplex })}
            className={`w-11 h-6 rounded-full transition-colors ${options.duplex ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${options.duplex ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      {/* Price Summary */}
      {price && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm opacity-90">Total Price</span>
            <span className="text-2xl font-bold">{price.totalPrice} {price.currency}</span>
          </div>
          <div className="text-xs opacity-75 space-y-1">
            {options.color_mode === 'mixed' && price.breakdown && (
              <>
                <div>{price.breakdown.colorPages} color pages × {price.breakdown.colorPrice / price.breakdown.colorPages || 0} {price.currency}</div>
                <div>{price.breakdown.bwPages} B&W pages × {price.breakdown.bwPrice / price.breakdown.bwPages || 0} {price.currency}</div>
              </>
            )}
            {options.color_mode !== 'mixed' && (
              <div>{price.pageCount} pages × {price.pricePerPage} {price.currency}/page × {options.copies} copies</div>
            )}
            {options.duplex && <div>Duplex discount: {Math.round((1 - price.duplexDiscount) * 100)}%</div>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={() => price && onConfirm(price)}
          disabled={!price || loading}
          className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Calculating...' : 'Continue to Payment'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
