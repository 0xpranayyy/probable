import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

type JobType = "process-trade" | "settle-payout" | "webhook-retry";

let redisConnection: Redis | null = null;
let tradeQueue: Queue | null = null;
let tradeWorker: Worker | null = null;
let useMemoryQueue = false;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

try {
  redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
  });

  redisConnection.on("error", (err) => {
    console.warn("[Queue Service] Redis connection error, falling back to memory queue:", err.message);
    useMemoryQueue = true;
  });

  tradeQueue = new Queue("trade-queue", { connection: redisConnection });

  tradeWorker = new Worker(
    "trade-queue",
    async (job) => {
      console.log(`[Queue Worker] Processing job ${job.id} of type ${job.name}...`);
      // Simulate transaction execution on Polymarket CLOB / Blockchain
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`[Queue Worker] Job ${job.id} executed successfully.`);
      return { status: "success" };
    },
    { connection: redisConnection }
  );

  console.log("[Queue Service] Redis queue initialized successfully.");
} catch (e) {
  console.warn("[Queue Service] Failed to initialize Redis Queue, using memory fallback.", e);
  useMemoryQueue = true;
}

// Memory Queue fallback
const memoryQueue: { id: string; name: JobType; data: any; status: "WAITING" | "COMPLETED" }[] = [];

export class QueueService {
  static async addJob(name: JobType, data: any) {
    if (useMemoryQueue || !tradeQueue) {
      const job = {
        id: `job_mem_${Math.random().toString(36).substring(2, 10)}`,
        name,
        data,
        status: "WAITING" as "WAITING" | "COMPLETED",
      };
      memoryQueue.push(job);

      setTimeout(() => {
        job.status = "COMPLETED";
        console.log(`[Queue Service (Memory)] Job ${job.id} completed.`);
      }, 1500);

      return job;
    }

    const job = await tradeQueue.add(name, data);
    return {
      id: job.id || `job_${Math.random().toString(36).substring(2, 10)}`,
      name,
      data,
      status: "WAITING" as const,
    };
  }

  static getQueueStatus() {
    if (useMemoryQueue || !tradeQueue) {
      return {
        mode: "MEMORY_FALLBACK",
        waiting: memoryQueue.filter((j) => j.status === "WAITING").length,
        completed: memoryQueue.filter((j) => j.status === "COMPLETED").length,
        total: memoryQueue.length,
        jobs: memoryQueue.slice(-10),
      };
    }

    return {
      mode: "REDIS_BULLMQ",
      status: "ACTIVE",
      total: memoryQueue.length, // fallback tracks
    };
  }
}
