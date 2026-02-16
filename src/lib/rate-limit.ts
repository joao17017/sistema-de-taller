/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per key (usually IP address).
 */

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(store.entries())) {
        entry.timestamps = entry.timestamps.filter((t: number) => now - t < 600_000);
        if (entry.timestamps.length === 0) store.delete(key);
    }
}, 600_000);

/**
 * Check if a key has exceeded the rate limit.
 * @param key - Unique identifier (e.g. IP address)
 * @param maxAttempts - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, retryAfterMs: number }
 */
export function checkRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number
): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxAttempts) {
        const oldest = entry.timestamps[0];
        const retryAfterMs = windowMs - (now - oldest);
        return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    entry.timestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
}
