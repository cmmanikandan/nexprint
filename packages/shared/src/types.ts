// NexPrint 2.0 - Shared Types

export type UserRole = 'user' | 'shop_owner' | 'delivery_partner' | 'admin';
export type OrderStatus = 'pending' | 'shop_accepted' | 'printing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
export type PrintType = 'color' | 'black_white';
export type PrintSide = 'single' | 'double';
export type PaperSize = 'A4' | 'A3' | 'Letter' | 'Legal';
export type PaymentMethod = 'online' | 'cash_pickup' | 'cash_delivery';
export type DeliveryType = 'pickup' | 'delivery';
export type ShopStatus = 'open' | 'closed' | 'busy';

export interface Profile {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface PrintShop {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  status: ShopStatus;
  rating: number;
  total_ratings: number;
  image_url?: string;
  color_price_per_page: number;
  bw_price_per_page: number;
  delivery_available: boolean;
  distance?: number; // Computed
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  shop_id: string;
  status: OrderStatus;
  delivery_type: DeliveryType;
  payment_method?: PaymentMethod;
  total_amount: number;
  pickup_code?: string;
  created_at: string;
  shop?: PrintShop;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  file_name: string;
  file_pages: number;
  print_type: PrintType;
  print_side: PrintSide;
  paper_size: PaperSize;
  copies: number;
  total_pages: number;
  price: number;
}

export interface PrintOptions {
  printType: PrintType;
  printSide: PrintSide;
  paperSize: PaperSize;
  copies: number;
}
