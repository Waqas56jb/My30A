import type { RequestHandler } from 'express';

type MiddlewareFactory = (options?: object) => RequestHandler;

/** NodeNext + TS 5.9 can type CJS/ESM default exports as a namespace, not a function. */
export function middlewareFactory(mod: unknown): MiddlewareFactory {
  if (typeof mod === 'function') return mod as MiddlewareFactory;
  if (mod && typeof mod === 'object' && 'default' in mod && typeof (mod as { default: unknown }).default === 'function') {
    return (mod as { default: MiddlewareFactory }).default;
  }
  throw new Error('Middleware package did not export a function');
}
