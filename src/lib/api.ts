import type { Station, UploadedFile, Job, PriceCalculation, PrintOptions, JobStatus, PaymentStatus } from './types';

const STATUS_MAP: Record<string, JobStatus> = {
  CREATED: 'pending',
  FILE_UPLOADED: 'uploaded',
  PRICE_CALCULATED: 'options_set',
  AWAITING_PAYMENT: 'payment_pending',
  PAYMENT_PROCESSING: 'payment_pending',
  PAID: 'payment_completed',
  AUTHORIZED: 'queued',
  QUEUED: 'queued',
  PRINTING: 'printing',
  COMPLETED: 'completed',
  PRINT_FAILED: 'failed',
  PRINTER_OFFLINE: 'failed',
  PRINTER_ERROR: 'failed',
  CANCELLED: 'cancelled',
};

const PAYMENT_MAP: Record<string, PaymentStatus> = {
  PENDING: 'pending',
  PROCESSING: 'pending',
  SUCCESS: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

function mapJob(raw: any): Job {
  return {
    id: raw.jobId || raw.id,
    station_id: raw.stationId,
    file_id: raw.fileId,
    status: STATUS_MAP[raw.printStatus] || 'pending',
    options: {
      copies: raw.copies || 1,
      color_mode: raw.colorMode?.toLowerCase() || 'bw',
      paper_size: raw.paperSize || 'A4',
      duplex: raw.duplex || false,
      page_range: raw.pageRange || 'all',
    },
    total_price: raw.price || 0,
    currency: raw.currency || 'RWF',
    payment_status: PAYMENT_MAP[raw.paymentStatus] || 'pending',
    created_at: raw.createdAt || new Date().toISOString(),
    updated_at: raw.updatedAt || new Date().toISOString(),
    error_message: raw.errorMessage || undefined,
  };
}

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

export async function getStation(stationId: string): Promise<Station> {
  const raw = await request<any>(`/stations/${stationId}`);
  return {
    id: raw.id,
    name: raw.name,
    logo_url: raw.logoUrl,
    location: raw.location,
    is_active: raw.isActive ?? raw.is_active,
    pricing: raw.pricing || {
      price_per_page_bw: 100,
      price_per_page_color: 300,
      currency: 'RWF',
    },
    settings: raw.settings || {
      max_file_size_mb: 50,
      allowed_formats: ['pdf'],
      max_copies: 10,
    },
  };
}

export async function uploadFile(
  stationId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        if (onProgress) onProgress(10);
        
        const base64 = (reader.result as string).split(',')[1];
        
        if (onProgress) onProgress(30);
        
        const response = await fetch(`${BASE_URL}/jobs/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            stationId,
          }),
        });
        
        if (onProgress) onProgress(80);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(error.error || 'Upload failed');
        }
        
        const json = await response.json();
        const raw = json.data ?? json;
        
        if (onProgress) onProgress(100);
        
        resolve({
          id: raw.fileId || raw.id,
          filename: raw.storedFilename || raw.filename || '',
          original_name: raw.originalFilename || raw.original_name || '',
          size: raw.fileSize || raw.size || 0,
          page_count: raw.pageCount || raw.page_count || 0,
          mime_type: raw.mimeType || raw.mime_type || 'application/pdf',
          url: raw.url || '',
          created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function createJob(jobData: {
  station_id: string;
  file_id: string;
  options: PrintOptions;
}): Promise<Job> {
  const raw = await request<any>('/jobs', {
    method: 'POST',
    body: JSON.stringify({
      stationId: jobData.station_id,
      fileId: jobData.file_id,
      copies: jobData.options.copies,
      colorMode: jobData.options.color_mode === 'color' ? 'COLOR' : 'BW',
      paperSize: jobData.options.paper_size?.toUpperCase() || 'A4',
      duplex: jobData.options.duplex,
      pageRange: jobData.options.page_range === 'all' ? undefined : jobData.options.page_range,
    }),
  });
  return mapJob(raw);
}

export async function getJobStatus(jobId: string): Promise<Job> {
  const raw = await request<any>(`/jobs/${jobId}`);
  return mapJob(raw);
}

export async function processPayment(jobId: string): Promise<Job> {
  const raw = await request<any>(`/jobs/${jobId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ provider: 'MOCK' }),
  });
  return mapJob(raw);
}

export async function cancelJob(jobId: string): Promise<Job> {
  const raw = await request<any>(`/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
  return mapJob(raw);
}

export function calculatePrice(
  options: PrintOptions,
  pageCount: number,
  pricing: { price_per_page_bw: number; price_per_page_color: number; currency: string }
): PriceCalculation {
  const perPage = options.color_mode === 'color' ? pricing.price_per_page_color : pricing.price_per_page_bw;

  let effectivePages = pageCount;
  if (options.page_range && options.page_range !== 'all') {
    const rangeParts = options.page_range.split('-');
    if (rangeParts.length === 2) {
      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        effectivePages = Math.max(0, end - start + 1);
      }
    } else {
      const pageNum = parseInt(options.page_range, 10);
      effectivePages = isNaN(pageNum) ? pageCount : 1;
    }
  }

  const pages = effectivePages;
  const subtotal = perPage * pages;
  const total = subtotal * options.copies;

  return {
    per_page: perPage,
    pages,
    copies: options.copies,
    subtotal,
    total,
    currency: pricing.currency,
  };
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}
