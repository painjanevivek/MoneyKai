export const PAYMENT_CONNECTIONS = [
  {
    id: 'google_pay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user',
    statementPath: 'Google Pay → See transaction history → ⋮ → Get Statement → select dates → Continue → Share.',
  },
  {
    id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app',
    statementPath: 'PhonePe → History → My Statements → select dates → download the PDF → save or share.',
  },
  {
    id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm',
    statementPath: 'Paytm → Balance & History → Payment History → ⋮ → Download UPI Statement → select dates → PDF → Request → Requested Statements.',
  },
] as const;

export type PaymentConnectionId = typeof PAYMENT_CONNECTIONS[number]['id'];
