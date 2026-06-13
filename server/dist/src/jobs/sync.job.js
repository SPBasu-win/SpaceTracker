import { syncCatalog } from "../services/sync.service";
let timer = null;
export async function runSyncJob() {
    console.info("sync.job.start");
    const result = await syncCatalog();
    console.info("sync.job.complete", result);
    return result;
}
export function startSyncJob(intervalMs = Number(process.env.SYNC_INTERVAL_MS ?? 6 * 60 * 60 * 1000)) {
    if (timer)
        return timer;
    timer = setInterval(() => {
        runSyncJob().catch((error) => console.error("sync.job.failed", error));
    }, intervalMs);
    return timer;
}
