import pLimit from "p-limit";

type JobHandler<T = any> = (data: T) => Promise<void>;
type Job<T = any> = { type: string; data: T; retries: number };

const MAX_RETRIES = 3;
const CONCURRENCY = 5;

const limiter = pLimit(CONCURRENCY);
const handlers = new Map<string, JobHandler>();
const queue: Job[] = [];
let processing = false;

export function registerJobHandler<T>(type: string, handler: JobHandler<T>): void {
  handlers.set(type, handler as JobHandler);
}

export async function enqueueJob<T>(type: string, data: T): Promise<void> {
  queue.push({ type, data, retries: 0 });
  if (!processing) {
    processQueue();
  }
}

async function processQueue(): Promise<void> {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const jobs = queue.splice(0, CONCURRENCY);
    await Promise.allSettled(
      jobs.map((job) =>
        limiter(async () => {
          const handler = handlers.get(job.type);
          if (!handler) {
            console.error(`No handler for job type: ${job.type}`);
            return;
          }
          try {
            await handler(job.data);
          } catch (error) {
            console.error(`Job ${job.type} failed:`, error);
            if (job.retries < MAX_RETRIES) {
              queue.push({ ...job, retries: job.retries + 1 });
            } else {
              console.error(`Job ${job.type} exceeded max retries`);
            }
          }
        })
      )
    );
  }

  processing = false;
}

export function getQueueStats(): { pending: number; processing: boolean } {
  return { pending: queue.length, processing };
}
