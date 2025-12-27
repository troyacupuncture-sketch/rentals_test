
export enum PaymentPurpose {
  RENT = 'Rent',
  DAMAGES = 'Damages',
  HOLDING_FEE = 'Holding Fee',
  SECURITY_DEPOSIT = 'Security Deposit',
  FIRST_MONTH = 'First Month Rent'
}

export interface MaintenanceEntry {
  id: string;
  text: string;
  date: string;
}

export interface House {
  id: string;
  address: string;
  roomCount: number;
  mortgagePayment: number;
  bank: string;
  mortgageBalance: number;
  paymentDate: number; // Day of month
  insuranceAmount: number;
  insuranceRenewalDate: string;
  maintenanceLog?: MaintenanceEntry[];
}

export interface Room {
  id: string;
  houseId: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  job?: string;
  moveInDate: string;
  moveInTime?: string; // Specific time for handover
  durationMonths: number;
  moveOutDate: string;
  securityDeposit: number;
  baseRent: number;
  hasGarage: boolean;
  garagePrice: number;
  monthlyRent: number; // Calculated total: baseRent + garagePrice
  rentDueDate: number; // Day of month rent is due
  houseId: string;
  roomId: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  houseId: string;
  method: string;
  amount: number;
  date: string;
  dueMonth: string; // e.g. "2023-10"
  purposes: PaymentPurpose[];
  isProrated?: boolean;
  proratedDays?: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  targetMoveIn: string;
  budget: number;
  houseId: string;
  roomId: string;
  hasPets: boolean;
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Showing {
  id: string;
  houseId: string;
  roomId: string;
  name: string;
  phone?: string;
  job?: string;
  showingDate: string;
  targetMoveIn?: string;
  showedPrice: number;
  offeredPrice: number;
  isActive: boolean;
  notes?: string;
}

export interface LentItem {
  id: string;
  tenantId: string;
  itemName: string;
  lentDate: string;
  returnDate?: string;
}

export interface AppState {
  houses: House[];
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  showings: Showing[];
  lentItems: LentItem[];
  leads: Lead[];
}
