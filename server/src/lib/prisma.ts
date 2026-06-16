// @prisma/client is CommonJS; named ESM imports fail under compiled `node`
// (they only work via tsx in dev). Use a default import + destructure so the
// build runs in both dev and production/Docker.
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;
type PrismaClient = PrismaClientType;

declare global {
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaClient = prisma;
}
