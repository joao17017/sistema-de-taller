import fs from "fs";
import {
    CATEGORIES_FILE,
    ensureDataDir,
    getCached,
    setCache,
    invalidateCache,
    withFileLock
} from "./core";

export interface Category {
    id: string;
    name: string;
}

export function getCategories(): Category[] {
    const cached = getCached<Category[]>("categories");
    if (cached) return cached;
    ensureDataDir();
    if (!fs.existsSync(CATEGORIES_FILE)) {
        const defaults = [
            { id: "1", name: "Software" },
            { id: "2", name: "Instalación de SSD" },
            { id: "3", name: "Formateos" },
            { id: "4", name: "Mantenimiento" },
            { id: "5", name: "Diagnóstico" },
            { id: "6", name: "General" }
        ];
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    try {
        const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"));
        setCache("categories", data);
        return data;
    } catch (err) {
        return [];
    }
}

export async function saveCategory(category: Category): Promise<Category> {
    return withFileLock(CATEGORIES_FILE, () => {
        ensureDataDir();
        const categories: Category[] = fs.existsSync(CATEGORIES_FILE)
            ? JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"))
            : [];
        invalidateCache("categories");
        const index = categories.findIndex((c) => c.id === category.id);
        if (index >= 0) {
            categories[index] = category;
        } else {
            categories.push(category);
        }
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        setCache("categories", categories);
        return category;
    });
}

export async function deleteCategory(id: string): Promise<boolean> {
    return withFileLock(CATEGORIES_FILE, () => {
        ensureDataDir();
        const categories: Category[] = fs.existsSync(CATEGORIES_FILE)
            ? JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"))
            : [];
        invalidateCache("categories");
        const filtered = categories.filter((c) => c.id !== id);
        if (filtered.length === categories.length) return false;
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(filtered, null, 2));
        setCache("categories", filtered);
        return true;
    });
}
