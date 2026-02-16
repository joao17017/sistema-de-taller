import fs from "fs";
import { ServiceOrder } from "@/types/order";
import {
    DATA_FILE,
    ensureDataDir,
    getCached,
    setCache,
    invalidateCache,
    withFileLock
} from "./core";

export function getOrders(): ServiceOrder[] {
    const cached = getCached<ServiceOrder[]>("orders");
    if (cached) return cached;
    ensureDataDir();
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        setCache("orders", data);
        return data;
    } catch (err) {
        console.error("[storage] Error reading orders:", err);
        return [];
    }
}

export function getOrderById(id: string): ServiceOrder | undefined {
    const orders = getOrders();
    return orders.find((o) => o.id === id);
}

export function getOrderByNumber(orderNumber: string): ServiceOrder | undefined {
    const orders = getOrders();
    return orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
}

export function searchOrdersByPhone(phone: string): ServiceOrder[] {
    const orders = getOrders();
    const clean = phone.replace(/\D/g, "");
    return orders.filter((o) => o.customerPhone.replace(/\D/g, "").includes(clean));
}

export async function saveOrder(order: ServiceOrder): Promise<ServiceOrder> {
    return withFileLock(DATA_FILE, () => {
        // Re-read from disk inside the lock to ensure consistency
        ensureDataDir();
        const orders: ServiceOrder[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        invalidateCache("orders");
        const index = orders.findIndex((o) => o.id === order.id);
        if (index >= 0) {
            orders[index] = order;
        } else {
            orders.push(order);
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
        setCache("orders", orders);
        return order;
    });
}

export async function deleteOrder(id: string): Promise<boolean> {
    return withFileLock(DATA_FILE, () => {
        ensureDataDir();
        const orders: ServiceOrder[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        invalidateCache("orders");
        const filtered = orders.filter((o) => o.id !== id);
        if (filtered.length === orders.length) return false;
        fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
        setCache("orders", filtered);
        return true;
    });
}

export function generateOrderNumber(): string {
    const orders = getOrders();
    const now = new Date();
    const prefix = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const existing = orders.filter((o) => o.orderNumber.startsWith(prefix));
    let maxNum = 0;
    for (const o of existing) {
        const parts = o.orderNumber.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (num > maxNum) maxNum = num;
    }
    return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
}
