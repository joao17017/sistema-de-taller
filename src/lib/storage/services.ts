import fs from "fs";
import {
    SERVICES_FILE,
    ensureDataDir,
    getCached,
    setCache,
    invalidateCache,
    withFileLock
} from "./core";

export interface RepairService {
    id: string;
    name: string;
    description?: string;
    category?: string;
    basePrice: number;
    linkedPartId?: string;
    linkedPartName?: string;
    linkedPartCost?: number;
    createdAt: string;
    updatedAt: string;
}

export function getServices(): RepairService[] {
    const cached = getCached<RepairService[]>("services");
    if (cached) return cached;
    ensureDataDir();
    if (!fs.existsSync(SERVICES_FILE)) {
        fs.writeFileSync(SERVICES_FILE, JSON.stringify([], null, 2));
        return [];
    }
    try {
        const data = JSON.parse(fs.readFileSync(SERVICES_FILE, "utf-8"));
        setCache("services", data);
        return data;
    } catch (err) {
        console.error("[storage] Error reading services:", err);
        return [];
    }
}

export async function saveService(service: RepairService): Promise<RepairService> {
    return withFileLock(SERVICES_FILE, () => {
        ensureDataDir();
        const services: RepairService[] = fs.existsSync(SERVICES_FILE)
            ? JSON.parse(fs.readFileSync(SERVICES_FILE, "utf-8"))
            : [];
        invalidateCache("services");
        const index = services.findIndex((s) => s.id === service.id);
        if (index >= 0) {
            services[index] = service;
        } else {
            services.push(service);
        }
        fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
        setCache("services", services);
        return service;
    });
}

export async function deleteService(id: string): Promise<boolean> {
    return withFileLock(SERVICES_FILE, () => {
        ensureDataDir();
        const services: RepairService[] = fs.existsSync(SERVICES_FILE)
            ? JSON.parse(fs.readFileSync(SERVICES_FILE, "utf-8"))
            : [];
        invalidateCache("services");
        const filtered = services.filter((s) => s.id !== id);
        if (filtered.length === services.length) return false;
        fs.writeFileSync(SERVICES_FILE, JSON.stringify(filtered, null, 2));
        setCache("services", filtered);
        return true;
    });
}
