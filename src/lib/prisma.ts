import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

// Modify the DATABASE_URL to include a connection timeout and a higher connection limit
let databaseUrl = process.env.DATABASE_URL
if (databaseUrl && !databaseUrl.includes('connect_timeout')) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  databaseUrl = `${databaseUrl}${separator}connect_timeout=60`
}
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  databaseUrl = `${databaseUrl}${separator}connection_limit=50`
}

const logLevels: (Prisma.LogLevel | Prisma.LogDefinition)[] =
  process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

const prismaOptions: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: logLevels,
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions)
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaOptions)
  }
  prisma = globalForPrisma.prisma
}

export { prisma }