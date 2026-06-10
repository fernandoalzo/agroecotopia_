export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

export type CacheValue = string | number | boolean | null | Record<string, unknown> | unknown[];
