import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = res.locals.requestId as string | undefined;

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.errorCode, message: err.message, details: err.details },
      requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some of that information is not valid.',
        details: err.flatten(),
      },
      requestId,
    });
  }

  logger.error({ err, requestId, path: req.path }, 'unhandled error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      details: env.NODE_ENV === 'production' ? null : String(err?.message ?? err),
    },
    requestId,
  });
};
