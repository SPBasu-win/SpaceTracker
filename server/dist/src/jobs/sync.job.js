import { syncCatalog } from "../services/sync.service.js";
let timer = null;
let running = false;
export async function runSyncJob() {
    if (running) {
        console.info("sync.job.skip already_running");
        return { skipped: true };
    }
    running = true;
    console.info("sync.job.start");
    try {
        const result = await syncCatalog();
        console.info("sync.job.complete", result);
        return result;
    }
    finally {
        running = false;
    }
}
export function startSyncJob(intervalMs = Number(process.env.SYNC_INTERVAL_MS ?? 6 * 60 * 60 * 1000)) {
    if (timer) {
        console.info("sync.job.already_started");
        return timer;
    }
    console.info("sync.job.schedule", { intervalMs });
    runSyncJob().catch((error) => console.error("sync.job.initial_failed", error));
    timer = setInterval(() => {
        runSyncJob().catch((error) => console.error("sync.job.failed", error));
    }, intervalMs);
    return timer;
}
