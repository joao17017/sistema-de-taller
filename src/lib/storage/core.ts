import fs from "fs";
import path from "path";
import crypto from "crypto";

export const DATA_DIR = path.join(process.cwd(), "data");
export const DATA_FILE = path.join(DATA_DIR, "orders.json");
export const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const PARTS_FILE = path.join(DATA_DIR, "parts.json");
export const AUTH_FILE = path.join(DATA_DIR, "auth.json");
export const SERVICES_FILE = path.join(DATA_DIR, "services.json");
export const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

// ─── In-memory cache ───
const cache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 3000; // 3 seconds

export function getCached<T>(key: string): T | null {
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
}

import { logger } from "../logger";

export function setCache(key: string, data: any) {
    logger.debug("Cache set", { key });
    cache[key] = { data, ts: Date.now() };
}

export function invalidateCache(key: string) {
    logger.debug("Cache invalidated", { key });
    delete cache[key];
}

// ─── File Write Mutex ───
const fileLocks: Record<string, Promise<void>> = {};

export async function withFileLock<T>(filePath: string, fn: () => T): Promise<T> {
    const fileName = path.basename(filePath);
    const key = filePath;
    const previous = fileLocks[key] || Promise.resolve();
    let resolve: () => void;
    fileLocks[key] = new Promise<void>((r) => { resolve = r; });

    await previous;
    try {
        logger.debug("File lock acquired", { file: fileName });
        return fn();
    } finally {
        logger.debug("File lock released", { file: fileName });
        resolve!();
    }
}

// ─── File System Helpers ───
export function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

// ─── Password Hashing ───
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN = 64;
const SALT_LEN = 16;

export function hashPasswordSecure(password: string): string {
    const salt = crypto.randomBytes(SALT_LEN).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPasswordSecure(password: string, stored: string): boolean {
    if (stored.includes(":")) {
        const [salt, hash] = stored.split(":");
        const attempt = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, "sha512").toString("hex");
        return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(hash, "hex"));
    }
    const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
    return legacyHash === stored;
}
