import { Application, Request, Response, NextFunction } from 'express';

export interface CrashlessOptions {
  maskMessages?: boolean;
  log?: boolean;
  onTelemetry?: (err: any, meta: any) => void;
}

export interface CrashlessMiddleware {
  (err: any, req: Request, res: Response, next: NextFunction): any;
  createError: (message: string, status?: number, code?: string, details?: any) => Error;
  handleAsync: (app: Application, options?: { methods?: string[] }) => void;
  registerExporter: (name: string, fn: (err: any, meta: any) => void) => void;
}

declare const crashless: CrashlessMiddleware;
export default crashless;

export function crashlessFactory(opts?: CrashlessOptions): CrashlessMiddleware;
export function createError(message: string, status?: number, code?: string, details?: any): Error;
export function handleAsync(app: Application, options?: { methods?: string[] }): void;
export function registerExporter(name: string, fn: (err: any, meta: any) => void): void;