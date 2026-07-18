import { prisma } from "@probable/db";

export class NotificationService {
  static async sendWebhook(endpoint: string, event: string, payload: any, userId?: string) {
    console.log(`[Webhook Dispatcher] Sending ${event} to ${endpoint}`);
    const timestamp = new Date().toISOString();
    let deliveryStatus = "FAILED";
    let httpStatus: number | null = null;
    let errorMsg: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Probable-Event": event },
        body: JSON.stringify({ event, timestamp, data: payload }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      deliveryStatus = res.ok ? "SUCCESS" : "FAILED";
      httpStatus = res.status;

      if (userId) {
        await prisma.webhookDelivery.create({
          data: {
            userId,
            webhookUrl: endpoint,
            event,
            payload: JSON.stringify(payload),
            statusCode: httpStatus,
            status: deliveryStatus,
            error: null
          }
        }).catch(err => console.error("Failed writing webhook log:", err));
      }

      return {
        event,
        endpoint,
        dispatched: res.ok,
        httpStatus: res.status,
        timestamp,
      };
    } catch (e: any) {
      errorMsg = e.name === "AbortError" ? "Request timed out after 8s" : e.message;
      if (userId) {
        await prisma.webhookDelivery.create({
          data: {
            userId,
            webhookUrl: endpoint,
            event,
            payload: JSON.stringify(payload),
            statusCode: null,
            status: "FAILED",
            error: errorMsg
          }
        }).catch(err => console.error("Failed writing webhook log:", err));
      }

      return {
        event,
        endpoint,
        dispatched: false,
        httpStatus: null,
        error: errorMsg,
        timestamp,
      };
    }
  }

  static async notifyUser(userId: string, channel: "EMAIL" | "TELEGRAM", message: string) {
    console.log(`[Notification Service] Notifying user ${userId} via ${channel}: ${message}`);
    return {
      userId,
      channel,
      sent: true,
      timestamp: new Date()
    };
  }
}
