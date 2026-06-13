import "dotenv/config";
import { app } from "./src/app.js";
import { prisma } from "./src/lib/prisma.js";
import { startSyncJob } from "./src/jobs/sync.job.js";

const port = Number(process.env.PORT ?? 3000);

async function boot() {
  await prisma.$connect();
  console.info("database.connected");
  if (process.env.DISABLE_SYNC_JOB !== "true") startSyncJob();

  app.listen(port, () => {
    console.info(`server.listening ${port}`);
  });
}

boot().catch((error) => {
  console.error("server.boot_failed", error);
  process.exit(1);
});
