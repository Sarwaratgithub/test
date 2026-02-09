
import { pgTable, text, serial, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

// User table acts as the Shop Owner profile and Login credentials
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Acts as Phone Number
  password: text("password").notNull(),          // Acts as PIN
  shopName: text("shop_name").notNull().default("Meri Kirana Dukaan"),
  ownerName: text("owner_name").notNull().default("Dukandar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Belongs to a shop owner
  name: text("name").notNull(),
  phone: text("phone"),
  totalBalance: decimal("total_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  customerId: integer("customer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'give' (Udhar Diya) or 'receive' (Wapas Mila)
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull().default("cash_sale"), // 'cash_sale' or 'cash_in_hand'
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  supplierName: text("supplier_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(), 
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

// === RELATIONS ===

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  shopName: true,
  ownerName: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  userId: true, 
  totalBalance: true,
  lastUpdated: true 
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.preprocess((val) => String(val), z.string()),
}).omit({ 
  id: true, 
  userId: true,
  date: true 
});

export const insertSaleSchema = createInsertSchema(sales, {
  amount: z.preprocess((val) => String(val), z.string()),
  date: z.preprocess((val) => val ? new Date(val as string) : new Date(), z.date()),
}).omit({ 
  id: true, 
  userId: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases, {
  amount: z.preprocess((val) => String(val), z.string()),
}).omit({ 
  id: true, 
  userId: true,
  date: true 
});

export const insertExpenseSchema = createInsertSchema(expenses, {
  amount: z.preprocess((val) => String(val), z.string()),
}).omit({ 
  id: true, 
  userId: true,
  date: true 
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Request/Response Types
export type LoginRequest = { username: string; password: string };
export type UpdateProfileRequest = Partial<InsertUser>;
