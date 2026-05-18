import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function createRateLimiter(requests: number, window: `${number} s` | `${number} m`) {
  const r = redis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "mibarberia",
  });
}

export async function enforceRateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<void> {
  if (!limiter) return;
  try {
    const { success } = await limiter.limit(key);
    if (!success) {
      throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Demasiados intentos")) {
      throw err;
    }
    console.warn("[ratelimit] skipped:", err);
  }
}
