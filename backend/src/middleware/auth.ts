import type { Request, Response, NextFunction } from 'express';
import { errors } from '../utils/errors.js';
import { can, loadAccount, verifyToken } from '../services/authService.js';
import type { AppRole, PermissionArea, PermissionLevel } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      auth?: ReturnType<typeof verifyToken>;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.auth = verifyToken(header.slice(7));
    } catch {
      req.auth = undefined;
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(errors.authRequired());
  try {
    const tokenAccount = verifyToken(header.slice(7));
    void loadAccount(tokenAccount.role, tokenAccount.id)
      .then((account) => {
        req.auth = account;
        next();
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(errors.authRequired());
    if (!roles.includes(req.auth.role)) return next(errors.forbidden());
    next();
  };
}

export function requirePermission(area: PermissionArea, level: PermissionLevel = 'view') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(errors.authRequired());
    if (req.auth.role !== 'ADMIN') return next(errors.forbidden());
    if (!can(req.auth.adminRole, area, level)) return next(errors.forbidden());
    next();
  };
}
