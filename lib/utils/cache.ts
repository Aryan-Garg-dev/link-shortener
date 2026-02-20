import { redis } from "@/lib/redis";

type CacheOptions<TArgs extends any[]> = {
  ttl?: number;                // seconds
  prefix?: string;
  keyResolver?: (...args: TArgs) => string;
};

export function withCache<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult | null>,
  options?: CacheOptions<TArgs>
) {
  const ttl = options?.ttl ?? 60 * 60 * 24; // default 24h
  const prefix = options?.prefix ?? "cache";
  const keyResolver = options?.keyResolver ?? ((...args) => String(args[0]));

  return async (...args: TArgs): Promise<TResult | null> => {
    const key = `${prefix}:${keyResolver(...args)}`;

    const cached = await redis.get<TResult>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    if (result === null) return null;

    await redis.set(key, result, { ex: ttl });

    return result;
  };
}