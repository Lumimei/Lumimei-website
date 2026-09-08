import { pgTable, serial, varchar, smallint, timestamp } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(), // 柬埔寨手机号，如 +85511223355
  role: varchar('role', { length: 20 }).default('auditor'),   // super_admin, auditor
  status: smallint('status').default(1),                      // 1: 启用, 0: 禁用
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});
