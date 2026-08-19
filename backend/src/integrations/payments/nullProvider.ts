export type PaymentResult = {
  success: false;
  code: 'PAYMENT_PROVIDER_NOT_CONFIGURED';
  readyForIntegration: true;
  paymentStatus: 'NOT_IMPLEMENTED';
  provider: 'stripe';
};

export interface PaymentService {
  createPaymentIntent(): Promise<PaymentResult>;
  authorizePayment(): Promise<PaymentResult>;
  capturePayment(): Promise<PaymentResult>;
  refundPayment(): Promise<PaymentResult>;
  cancelAuthorization(): Promise<PaymentResult>;
  savePaymentMethod(): Promise<PaymentResult>;
  chargeTip(): Promise<PaymentResult>;
}

const NOT_CONFIGURED: PaymentResult = {
  success: false,
  code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
  readyForIntegration: true,
  paymentStatus: 'NOT_IMPLEMENTED',
  provider: 'stripe',
};

export class NullPaymentProvider implements PaymentService {
  createPaymentIntent = async () => NOT_CONFIGURED;
  authorizePayment = async () => NOT_CONFIGURED;
  capturePayment = async () => NOT_CONFIGURED;
  refundPayment = async () => NOT_CONFIGURED;
  cancelAuthorization = async () => NOT_CONFIGURED;
  savePaymentMethod = async () => NOT_CONFIGURED;
  chargeTip = async () => NOT_CONFIGURED;
}

export const paymentService = new NullPaymentProvider();
