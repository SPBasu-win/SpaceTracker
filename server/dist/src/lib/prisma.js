import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;
export const prisma = global.prismaClient ??
    new PrismaClient({
        log: process.env.NODE_ENV === "production"
            ? ["error"]
            : ["error", "warn"],
    });
if (process.env.NODE_ENV !== "production") {
    global.prismaClient = prisma;
}
