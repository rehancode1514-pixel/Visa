import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

console.log('[DB_INIT]: Initializing Prisma Client...');

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

db.$connect()
  .then(() => console.log('[DB_INIT]: Prisma Client connected successfully.'))
  .catch((err) => console.error('[DB_INIT]: Prisma Client connection failed:', err));

