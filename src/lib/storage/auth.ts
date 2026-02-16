import fs from "fs";
import { AUTH_FILE, ensureDataDir, hashPasswordSecure, verifyPasswordSecure } from "./core";

export function getStoredPasswordHash(): string | null {
    ensureDataDir();
    if (!fs.existsSync(AUTH_FILE)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
        return data.passwordHash || null;
    } catch (err) {
        console.error("[storage] Error reading auth file:", err);
        return null;
    }
}

export function savePassword(newPassword: string): void {
    ensureDataDir();
    const data = { passwordHash: hashPasswordSecure(newPassword), updatedAt: new Date().toISOString() };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

export function verifyStoredPassword(password: string): boolean {
    const storedHash = getStoredPasswordHash();
    if (!storedHash) {
        const envPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();
        if (password.trim() === envPassword) {
            // Auto-migrate: save with secure hash on first successful login
            savePassword(password.trim());
            return true;
        }
        return false;
    }

    const isValid = verifyPasswordSecure(password, storedHash);

    // Auto-upgrade legacy SHA-256 hash to PBKDF2 on successful login
    if (isValid && !storedHash.includes(":")) {
        savePassword(password);
    }

    return isValid;
}
