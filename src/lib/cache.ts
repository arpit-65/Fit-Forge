import { unstable_cache, revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  FEATURED_STUDENTS: "featured-students",
  ANALYTICS_SUMMARY: "analytics-summary",
  MECHANIC_EXAMPLE: "mechanic-example",
  COLLEGE_ANALYTICS: "college-analytics",
  PUBLIC_METRICS: "public-metrics",
} as const;

/**
 * Robust wrapper around Next.js unstable_cache.
 * In Next.js server runtime, it leverages the Next.js Data Cache with revalidation & tags.
 * In standalone scripts or tests (where Next.js incrementalCache is absent),
 * it transparently executes the underlying function without throwing invariant errors.
 */
export function safeUnstableCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] }
): T {
  try {
    const cachedFn = unstable_cache(fn, keyParts, options);
    return (async (...args: any[]) => {
      try {
        return await cachedFn(...args);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("incrementalCache missing") || msg.includes("Invariant")) {
          return await fn(...args);
        }
        throw err;
      }
    }) as T;
  } catch {
    return fn;
  }
}

/**
 * Revalidates all public metrics cache tags.
 * Safe to call from server actions, API routes, or cron jobs.
 */
export function revalidateMetricsTags() {
  try {
    revalidateTag(CACHE_TAGS.FEATURED_STUDENTS);
    revalidateTag(CACHE_TAGS.ANALYTICS_SUMMARY);
    revalidateTag(CACHE_TAGS.MECHANIC_EXAMPLE);
    revalidateTag(CACHE_TAGS.COLLEGE_ANALYTICS);
    revalidateTag(CACHE_TAGS.PUBLIC_METRICS);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("static generation store missing") && !msg.includes("Invariant")) {
      console.warn("[Cache] revalidateTag warning:", err);
    }
  }
}
