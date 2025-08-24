export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export type UserRole =
  | 'admin'           // مدير النظام
  | 'financial'       // القسم المالي
  | 'sales'           // المبيعات
  | 'customer_service' // خدمات العملاء
  | 'operations';     // العمليات

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
