import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errors.js';

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data, requestId: res.locals.requestId });
}

export function validate<T extends z.ZodTypeAny>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'Some of that information is not valid.', parsed.error.flatten()),
      );
    }
    if (source === 'body') req.body = parsed.data;
    if (source === 'query') req.query = parsed.data as Request['query'];
    if (source === 'params') req.params = parsed.data as Request['params'];
    next();
  };
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
