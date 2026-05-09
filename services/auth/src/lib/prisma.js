// Singleton Prisma client for auth-service.
const { PrismaClient } = require("@prisma/client");

const prisma = global.__lablock_auth_prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.__lablock_auth_prisma__ = prisma;
}

module.exports = { prisma };
