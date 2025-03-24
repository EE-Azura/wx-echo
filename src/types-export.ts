/**
 * Types export for breeze-request
 */
export type {
  // Core request/response types
  BreezeContext,
  BreezeNext,
  BreezeMiddleware,
  BreezeErrorHandler,
  BreezeRequestOptions,
  BreezeRequestConfig,
  BreezeRequestCustom
} from './types';

// Instance types from breeze-request
export type { BreezeInstance } from './breeze-request';

// Re-export methods type
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
