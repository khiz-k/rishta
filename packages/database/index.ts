export * from "./drizzle";

// Re-export Prisma client and types needed by the notifications package
export { db as prismaDb } from "./prisma/client";
export { NotificationTarget, NotificationType } from "./prisma/generated/client";
export type { Prisma } from "./prisma/generated/client";
