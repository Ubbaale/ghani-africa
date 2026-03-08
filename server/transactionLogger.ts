import { storage } from "./storage";
import { sendAdminTransactionAlert } from "./email";
import { db } from "./db";
import { adminCredentials } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertActivityLog, InsertAdminNotification } from "@shared/schema";

const CRITICAL_EVENTS = new Set([
  "dispute_opened", "dispute_resolved", "refund_issued", 
  "escrow_released", "payment_received", "new_order"
]);

async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await db.select({ email: adminCredentials.email })
      .from(adminCredentials)
      .where(eq(adminCredentials.isActive, true));
    return admins.filter(a => a.email).map(a => a.email!);
  } catch {
    return [];
  }
}

export async function logActivity(data: {
  orderId?: number;
  invoiceId?: number;
  actorId?: string;
  actorType: "buyer" | "seller" | "admin" | "system";
  action: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await storage.createActivityLog({
      orderId: data.orderId ?? null,
      invoiceId: data.invoiceId ?? null,
      actorId: data.actorId ?? "system",
      actorType: data.actorType,
      action: data.action,
      description: data.description,
      metadata: data.metadata ?? null,
    } as InsertActivityLog);
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
}

export async function notifyAdmin(data: {
  type: string;
  title: string;
  message: string;
  orderId?: number;
  userId?: string;
  severity?: "info" | "warning" | "critical";
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await storage.createAdminNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      orderId: data.orderId ?? null,
      userId: data.userId ?? null,
      severity: data.severity || "info",
      metadata: data.metadata ?? null,
    } as InsertAdminNotification);

    if (CRITICAL_EVENTS.has(data.type) || data.severity === "critical" || data.severity === "warning") {
      const adminEmails = await getAdminEmails();
      for (const email of adminEmails) {
        sendAdminTransactionAlert(email, data.type, data.title, {
          orderId: data.orderId,
          amount: data.metadata?.amount,
          userId: data.userId,
          description: data.message,
        }).catch(e => console.error("Admin email alert failed:", e));
      }
    }
  } catch (error) {
    console.error("Failed to create admin notification:", error);
  }
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = "GA";
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

export async function logAndNotify(data: {
  orderId?: number;
  invoiceId?: number;
  actorId?: string;
  actorType: "buyer" | "seller" | "admin" | "system";
  action: string;
  description: string;
  adminTitle: string;
  adminMessage: string;
  adminType: string;
  userId?: string;
  severity?: "info" | "warning" | "critical";
  metadata?: Record<string, any>;
}): Promise<void> {
  await Promise.all([
    logActivity({
      orderId: data.orderId,
      invoiceId: data.invoiceId,
      actorId: data.actorId,
      actorType: data.actorType,
      action: data.action,
      description: data.description,
      metadata: data.metadata,
    }),
    notifyAdmin({
      type: data.adminType,
      title: data.adminTitle,
      message: data.adminMessage,
      orderId: data.orderId,
      userId: data.userId || data.actorId,
      severity: data.severity,
      metadata: data.metadata,
    }),
  ]);
}
