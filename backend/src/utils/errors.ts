export class AppError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly details: unknown;

  constructor(status: number, errorCode: string, message: string, details: unknown = null) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export const errors = {
  authRequired: () => new AppError(401, 'AUTH_REQUIRED', 'Sign in to continue.'),
  forbidden: (message = 'You do not have permission to do that.') =>
    new AppError(403, 'FORBIDDEN', message),
  notFound: (what = 'that resource') => new AppError(404, 'NOT_FOUND', `We could not find ${what}.`),
  validation: (message: string, details: unknown = null) =>
    new AppError(400, 'VALIDATION_ERROR', message, details),
  propertyDenied: () =>
    new AppError(403, 'PROPERTY_ACCESS_DENIED', 'This stay is not linked to that property.'),
  invalidTransition: (from: string, to: string) =>
    new AppError(409, 'INVALID_STATUS_TRANSITION', `Cannot move from ${from} to ${to}.`),
  vitoriaUnavailable: () =>
    new AppError(
      503,
      'VITORIA_MODEL_UNAVAILABLE',
      'Vitoria is not available because the configured OpenAI model could not be verified.',
    ),
  paymentNotConfigured: () =>
    new AppError(
      503,
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      'Payment processing is not configured in this phase.',
    ),
  partnerBooking: () =>
    new AppError(
      400,
      'PARTNER_BOOKING_NOT_SUPPORTED',
      'My30A does not book partner services. Contact the partner directly.',
    ),
  conflict: (message: string) => new AppError(409, 'CONFLICT', message),
  rateLimited: () => new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait and try again.'),
  service: (message: string) => new AppError(503, 'SERVICE_UNAVAILABLE', message),
};
