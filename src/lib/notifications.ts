import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

// ─── In-memory cache ───
let notificationsCache: { data: Notification[] | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 3000;

export interface Notification {
  id: string;
  type: "budget_approved" | "budget_rejected" | "order_created" | "order_completed";
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  read: boolean;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
  }
}

function invalidateCache() {
  notificationsCache = { data: null, ts: 0 };
}

export function getNotifications(): Notification[] {
  if (notificationsCache.data && Date.now() - notificationsCache.ts < CACHE_TTL) {
    return notificationsCache.data;
  }
  ensureDataDir();
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    notificationsCache = { data: parsed, ts: Date.now() };
    return parsed;
  } catch (err) {
    console.error("[notifications] Error reading notifications:", err);
    return [];
  }
}

export function createNotification(
  type: Notification["type"],
  title: string,
  message: string,
  orderId: string,
  orderNumber: string
): Notification {
  ensureDataDir();
  const notifications = getNotifications();

  const notification: Notification = {
    id: uuidv4(),
    type,
    title,
    message,
    orderId,
    orderNumber,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(notification); // Add to beginning
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  invalidateCache();

  return notification;
}

export function markAsRead(notificationId: string): boolean {
  ensureDataDir();
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === notificationId);

  if (index === -1) return false;

  notifications[index].read = true;
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  invalidateCache();

  return true;
}

export function markAllAsRead(): boolean {
  ensureDataDir();
  const notifications = getNotifications();

  notifications.forEach((n) => {
    n.read = true;
  });

  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  invalidateCache();

  return true;
}

export function deleteNotification(notificationId: string): boolean {
  ensureDataDir();
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.id !== notificationId);

  if (filtered.length === notifications.length) return false;

  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(filtered, null, 2));
  invalidateCache();

  return true;
}

export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read).length;
}
