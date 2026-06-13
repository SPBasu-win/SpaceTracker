import "dotenv/config";
import { prisma } from "../lib/prisma";
import { runSyncJob } from "./sync.job";
runSyncJob()
    .then(async (result) => {
    console.info(result);
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
