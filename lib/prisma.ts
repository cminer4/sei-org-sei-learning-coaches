import { PrismaClient } from "@prisma/client";

/** Valid placeholder so Prisma can initialize during `next build` when DATABASE_URL is unset (CI). Runtime uses real URL from env. */
const datasourceUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/sei_learning_coaches_build_placeholder";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl,
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var -- Prisma singleton pattern
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
