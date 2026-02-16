import fs from "fs";
import {
    SETTINGS_FILE,
    ensureDataDir,
    getCached,
    setCache,
    invalidateCache
} from "./core";

export interface BusinessSettings {
    businessName: string;
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    logoUrl: string;
    brandColor: string;
    lowStockThreshold: number;
    currency: string;
    schedule: string;
    whatsappTemplateCreated: string;
    whatsappTemplateReady: string;
    countryCode: string;
}

const DEFAULT_SETTINGS: BusinessSettings = {
    businessName: "Mi Taller",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    logoUrl: "",
    brandColor: "#2563eb",
    lowStockThreshold: 3,
    currency: "MXN",
    schedule: "Lun - Vie: 9:00 - 18:00\nSábado: 9:00 - 14:00",
    whatsappTemplateCreated:
        "Hola {nombre}, su equipo {equipo} ha sido recibido. Su número de orden es: {orden}. Le mantendremos informado sobre el progreso.",
    whatsappTemplateReady:
        "Hola {nombre}, su equipo {equipo} está listo para recoger. Orden: {orden}. ¡Gracias por su preferencia!",
    countryCode: "52",
};

export function getSettings(): BusinessSettings {
    const cached = getCached<BusinessSettings>("settings");
    if (cached) return cached;
    ensureDataDir();
    if (!fs.existsSync(SETTINGS_FILE)) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
        return { ...DEFAULT_SETTINGS };
    }
    try {
        const stored = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
        // Merge with defaults to ensure all fields exist
        const result = { ...DEFAULT_SETTINGS, ...stored };
        setCache("settings", result);
        return result;
    } catch (err) {
        console.error("[storage] Error reading settings:", err);
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings: BusinessSettings): BusinessSettings {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    invalidateCache("settings");
    return settings;
}
