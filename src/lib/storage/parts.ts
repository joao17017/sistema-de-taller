import fs from "fs";
import {
    PARTS_FILE,
    ensureDataDir,
    getCached,
    setCache,
    invalidateCache,
    withFileLock
} from "./core";

export interface Part {
    id: string;
    name: string;
    cost: number;
    stock: number;
    timesUsed?: number;
    createdAt: string;
    updatedAt: string;
}

export interface UsedPart {
    partId: string;
    partName: string;
    quantity: number;
    unitCost: number;
}

export function getParts(): Part[] {
    const cached = getCached<Part[]>("parts");
    if (cached) return cached;
    ensureDataDir();
    if (!fs.existsSync(PARTS_FILE)) {
        fs.writeFileSync(PARTS_FILE, JSON.stringify([], null, 2));
        return [];
    }
    try {
        const data = JSON.parse(fs.readFileSync(PARTS_FILE, "utf-8"));
        setCache("parts", data);
        return data;
    } catch (err) {
        console.error("[storage] Error reading parts:", err);
        return [];
    }
}

export function getPartById(id: string): Part | undefined {
    return getParts().find((p) => p.id === id);
}

export async function savePart(part: Part): Promise<Part> {
    return withFileLock(PARTS_FILE, () => {
        ensureDataDir();
        const parts: Part[] = fs.existsSync(PARTS_FILE)
            ? JSON.parse(fs.readFileSync(PARTS_FILE, "utf-8"))
            : [];
        invalidateCache("parts");
        const index = parts.findIndex((p) => p.id === part.id);
        if (index >= 0) {
            parts[index] = part;
        } else {
            parts.push(part);
        }
        fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2));
        setCache("parts", parts);
        return part;
    });
}

export async function deletePart(id: string): Promise<boolean> {
    return withFileLock(PARTS_FILE, () => {
        ensureDataDir();
        const parts: Part[] = fs.existsSync(PARTS_FILE)
            ? JSON.parse(fs.readFileSync(PARTS_FILE, "utf-8"))
            : [];
        invalidateCache("parts");
        const filtered = parts.filter((p) => p.id !== id);
        if (filtered.length === parts.length) return false;
        fs.writeFileSync(PARTS_FILE, JSON.stringify(filtered, null, 2));
        setCache("parts", filtered);
        return true;
    });
}

export function reducePartStock(partId: string, quantity: number): Part | null {
    const parts = getParts();
    const index = parts.findIndex((p) => p.id === partId);
    if (index < 0) return null;
    parts[index].stock = Math.max(0, parts[index].stock - quantity);
    parts[index].timesUsed = (parts[index].timesUsed || 0) + 1;
    parts[index].updatedAt = new Date().toISOString();
    fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2));
    invalidateCache("parts");
    return parts[index];
}

export function restorePartStock(partId: string, quantity: number): Part | null {
    const parts = getParts();
    const index = parts.findIndex((p) => p.id === partId);
    if (index < 0) return null;
    parts[index].stock += quantity;
    parts[index].updatedAt = new Date().toISOString();
    fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2));
    invalidateCache("parts");
    return parts[index];
}
