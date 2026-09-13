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
    status: STATUS_MAP[raw.printStatus] || 'pending',
    original_name: raw.originalFilename || '',
    page_count: raw.pageCount || 1,
    copies: raw.copies || 1,
    color_mode: raw.colorMode || 'bw',
    paper_size: raw.paperSize || 'A4',
    duplex: raw.duplex || false,
    price: raw.price || 0,
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
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

export async function getStation(stationId: string): Promise<Station> {
  const raw = await request<any>(`/stations/${stationId}`);
  return {
    id: raw.id,
    code: raw.stationCode || raw.code,
    name: raw.name,
    location: raw.location,
    is_active: raw.isActive ?? true,
    created_at: raw.createdAt || new Date().toISOString(),
  };
}

export async function uploadFile(
  stationId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('loadstart', () => {
      if (onProgress) onProgress(0);
    });

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 90);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText);
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
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('stationId', stationId);

    xhr.open('POST', `${BASE_URL}/jobs/upload`);
    xhr.send(formData);
  });
}

export async function calculatePrice(options: {
  stationId: string;
  pageCount: number;
  colorMode: string;
  paperSize: string;
  copies: number;
  duplex: boolean;
  colorPages?: number[];
  coverColor?: boolean;
}): Promise<PriceCalculation> {
  return request<PriceCalculation>('/jobs/calculate-price', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function createJob(data: {
  stationId: string;
  fileId: string;
  pageCount: number;
  copies: number;
  colorMode: string;
  paperSize: string;
  duplex: boolean;
  pageRange?: string;
  idempotencyKey: string;
}): Promise<Job> {
  const raw = await request<any>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapJob(raw);
}

export function formatPrice(price: number, currency: string = 'RWF'): string {
  return `${price.toLocaleString()} ${currency}`;
}

export async function processPayment(jobId: string): Promise<{ paymentUrl: string }> {
  return request<{ paymentUrl: string }>(`/jobs/${jobId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ provider: 'MOCK' }),
  });
}

export async function getJobStatus(jobId: string): Promise<Job> {
  const raw = await request<any>(`/jobs/${jobId}`);
  return mapJob(raw);
}

export async function cancelJob(jobId: string): Promise<void> {
  await request(`/jobs/${jobId}/cancel`, { method: 'POST' });
}
