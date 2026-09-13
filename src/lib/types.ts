export type FlowStep = 'upload' | 'options' | 'payment' | 'processing' | 'completed' | 'failed' | 'status';

export interface Station {
  id: string;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  logo_url?: string;
  pricing?: {
    bwPerPage: number;
    colorPerPage: number;
  };
}

export interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  page_count: number;
  mime_type: string;
  url: string;
  created_at: string;
}

export interface PrintOptions {
  copies: number;
  color_mode: 'bw' | 'color' | 'mixed';
  paper_size: 'A3' | 'A4' | 'A5' | 'LETTER';
  duplex: boolean;
  page_range: string;
  color_pages?: number[];
  cover_color?: boolean;
  include_cover?: boolean;
}

export interface PriceBreakdown {
  colorPages: number;
  bwPages: number;
  colorPrice: number;
  bwPrice: number;
}

export interface PriceCalculation {
  pricePerPage: number;
  pageCount: number;
  copies: number;
  paperSizeMultiplier: number;
  duplexDiscount: number;
  totalPrice: number;
  currency: string;
  colorPagesCount: number;
  bwPagesCount: number;
  breakdown: PriceBreakdown;
}

export interface Job {
  id: string;
  station_id: string;
  status: JobStatus;
  original_name: string;
  page_count: number;
  copies: number;
  color_mode: string;
  paper_size: string;
  duplex: boolean;
  price: number;
  currency: string;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  error_message?: string;
  estimated_completion?: string;
  total_price?: number;
}

export type JobStatus = 'pending' | 'uploaded' | 'options_set' | 'payment_pending' | 'payment_completed' | 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
