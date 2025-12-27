
import { AppState, PaymentPurpose } from './types';

export const INITIAL_STATE: AppState = {
  houses: [],
  rooms: [],
  tenants: [],
  payments: [],
  showings: [],
  lentItems: [],
  leads: []
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
