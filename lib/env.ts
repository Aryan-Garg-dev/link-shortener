function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} not found`);
  }
  return value;
}

export default {
  MONGO_URI: getEnv("MONGO_URI"),
  NEXT_PUBLIC_BASE_URL: getEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000"),
  UPSTASH_REDIS_REST_URL: getEnv("UPSTASH_REDIS_REST_TOKEN"),
  UPSTASH_REDIS_REST_TOKEN: getEnv("UPSTASH_REDIS_REST_TOKEN"),
  KEEPALIVE_SECRET: getEnv("KEEPALIVE_SECRET"),
  HEALTH_SECRET: getEnv("HEALTH_SECRET")
}