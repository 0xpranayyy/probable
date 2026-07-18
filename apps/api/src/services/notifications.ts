export class NotificationService {
  static async sendWebhook(endpoint: string, event: string, payload: any) {
    console.log(`[Webhook Dispatcher] Sending ${event} to ${endpoint}`);
    const timestamp = new Date().toISOString();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Probable-Event": event },
        body: JSON.stringify({ event, timestamp, data: payload }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      return {
        event,
        endpoint,
        dispatched: res.ok,
        httpStatus: res.status,
        timestamp,
      };
    } catch (e: any) {
      return {
        event,
        endpoint,
        dispatched: false,
        httpStatus: null,
        error: e.name === "AbortError" ? "Request timed out after 8s" : e.message,
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
