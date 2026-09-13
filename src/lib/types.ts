export interface Station {
  id: string;
  name: string;
  logo_url?: string;
  location?: string;
  is_active: boolean;
  pricing: PricingConfig;
  settings: StationSettings;
}

export interface PricingConfig {
  price_per_page_bw: number;
  price_per_page_color: number;
  currency: string;
}

export interface StationSettings {
  max_file_size_mb: number;
  allowed_formats: string[];
  max_copies: number;
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
  color_mode: 'bw' | 'color';
  paper_size: 'A4' | 'A3' | 'A5' | 'Letter';
  duplex: boolean;
  page_range: string;
}

export interface Job {
  id: string;
  station_id: string;
  file_id: string;
  file?: UploadedFile;
  status: JobStatus;
  options: PrintOptions;
  total_price: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export type JobStatus =
  | 'pending'
  | 'uploaded'
  | 'options_set'
  | 'payment_pending'
  | 'payment_completed'
  | 'queued'
  | 'printing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type FlowStep = 'upload' | 'options' | 'payment' | 'status';

export interface PriceCalculation {
  per_page: number;
  pages: number;
  copies: number;
  subtotal: number;
  total: number;
  currency: string;
}
