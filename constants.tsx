
import { AppState, PaymentPurpose } from './types';

export const INITIAL_STATE: AppState = {
  houses: [
    {
      id: 'h1',
      address: '123 Maple Avenue',
      roomCount: 3,
      mortgagePayment: 1200,
      bank: 'Chase',
      mortgageBalance: 245000,
      paymentDate: 1,
      insuranceAmount: 150,
      insuranceRenewalDate: '2024-12-01',
      maintenanceLog: [
        { id: 'm1', text: 'Initial house inspection completed', date: '2023-01-01' }
      ]
    }
  ],
  rooms: [
    { id: 'r1', houseId: 'h1', name: 'Room A' },
    { id: 'r2', houseId: 'h1', name: 'Room B' },
    { id: 'r3', houseId: 'h1', name: 'Room C' }
  ],
  tenants: [
    {
      id: 't1',
      name: 'John Doe',
      phone: '555-0101',
      moveInDate: '2023-01-01',
      durationMonths: 12,
      moveOutDate: '2023-12-31',
      securityDeposit: 800,
      baseRent: 800,
      hasGarage: false,
      garagePrice: 0,
      monthlyRent: 800,
      rentDueDate: 1,
      houseId: 'h1',
      roomId: 'r1',
      isActive: true
    }
  ],
  payments: [
    {
      id: 'p1',
      tenantId: 't1',
      houseId: 'h1',
      method: 'Venmo',
      amount: 800,
      date: '2023-01-01',
      dueMonth: '2023-01',
      purposes: [PaymentPurpose.RENT]
    }
  ],
  showings: [],
  lentItems: [],
  leads: []
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
