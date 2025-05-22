export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  supplierId?: string;
  quantity: number;
  minimumStock: number;
  location: string;
  acquisition_date?: string;
  lastUpdated: string;
  imageUrl?: string;
  details?: ProductDetails;
}

export interface ProductDetails {
  id: string;
  productId: string;
  price: number;
  cost: number;
  expirationDate?: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  auth_user_id: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  notes?: string;
  createdBy: string;
}

export interface StockStatus {
  total: number;
  available: number;
  lowStock: number;
  outOfStock: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface Report {
  type: 'stock' | 'financial' | 'expiration';
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
}