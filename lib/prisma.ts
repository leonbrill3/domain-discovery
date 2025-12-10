/**
 * 🗄️ PRISMA CLIENT - DomainSeek.ai
 *
 * Singleton Prisma client for database operations.
 * Prevents connection pool exhaustion in development.
 */

import { PrismaClient } from '@prisma/client';

// Extend global type to include prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances in development (hot reload)
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[Prisma] Testing database connection...');

    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    console.log('[Prisma] ✅ Database connection successful');

    return true;
  } catch (error) {
    console.error('[Prisma] ❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Graceful disconnect
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Cleanup on process exit
process.on('beforeExit', async () => {
  await disconnectDatabase();
});
