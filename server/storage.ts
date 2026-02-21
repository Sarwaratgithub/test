
import { db } from "./db";
import { eq, like, desc, and } from "drizzle-orm";
import { 
  users, customers, transactions, sales, purchases, expenses,
  type User, type InsertUser, 
  type Customer, type InsertCustomer, 
  type Transaction, type InsertTransaction, 
  type Sale, type InsertSale,
  type Purchase, type InsertPurchase,
  type Expense, type InsertExpense 
} from "@shared/schema";

export interface IStorage {
  // User / Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Customers
  getCustomers(userId: number, search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer & { userId: number }): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  updateCustomerBalance(id: number, amountChange: number): Promise<void>;

  // Transactions
  getTransactions(userId: number, customerId?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction & { userId: number }): Promise<Transaction>;
  updateTransaction(id: number, updates: any): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  updateCustomerBalance(id: number, amountChange: number): Promise<void>;

  // Sales
  getSales(userId: number): Promise<Sale[]>;
  createSale(sale: InsertSale & { userId: number }): Promise<Sale>;
  updateSale(id: number, updates: any): Promise<Sale>;
  deleteSale(id: number): Promise<void>;

  // Purchases
  getPurchases(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase & { userId: number }): Promise<Purchase>;
  updatePurchase(id: number, updates: any): Promise<Purchase>;
  deletePurchase(id: number): Promise<void>;

  // Expenses
  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense & { userId: number }): Promise<Expense>;
  updateExpense(id: number, updates: any): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return undefined;

      // Update streak logic
      const today = new Date().toISOString().split('T')[0];
      if (user.lastLoginDate !== today) {
        let newStreak = 1;
        if (user.lastLoginDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (user.lastLoginDate === yesterdayStr) {
            newStreak = user.loginStreak + 1;
          }
        }
        
        const [updatedUser] = await db.update(users)
          .set({ 
            lastLoginDate: today, 
            loginStreak: newStreak 
          })
          .where(eq(users.id, id))
          .returning();
        return updatedUser;
      }

      return user;
    } catch (err) {
      // Fallback for missing columns during migration
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getCustomers(userId: number, search?: string): Promise<Customer[]> {
    if (search) {
      return await db.select().from(customers).where(
        and(
          eq(customers.userId, userId),
          like(customers.name, `%${search}%`)
        )
      );
    }
    return await db.select().from(customers).where(eq(customers.userId, userId));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async createCustomer(customer: InsertCustomer & { userId: number }): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values({
      ...customer,
      totalBalance: "0",
      lastUpdated: new Date()
    }).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db.update(customers).set({
      ...updates,
      lastUpdated: new Date()
    }).where(eq(customers.id, id)).returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.customerId, id));
    await db.delete(customers).where(eq(customers.id, id));
  }

  async updateTransaction(id: number, updates: any): Promise<Transaction> {
    const [oldTx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    if (!oldTx) throw new Error("Transaction not found");

    const [newTx] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();

    // Re-calculate balance if amount or type changed
    if (updates.amount !== undefined || updates.type !== undefined) {
      const oldAmount = parseFloat(oldTx.amount as string);
      const oldDiff = oldAmount * (oldTx.type === 'receive' ? -1 : 1);
      await this.updateCustomerBalance(oldTx.customerId, -oldDiff); // Reverse old

      const newAmount = parseFloat(newTx.amount as string);
      const newDiff = newAmount * (newTx.type === 'receive' ? -1 : 1);
      await this.updateCustomerBalance(newTx.customerId, newDiff); // Apply new
    }

    return newTx;
  }

  async deleteTransaction(id: number): Promise<void> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    if (!tx) return;

    const amount = parseFloat(tx.amount as string);
    const diff = amount * (tx.type === 'receive' ? -1 : 1);
    await this.updateCustomerBalance(tx.customerId, -diff);
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async updateCustomerBalance(id: number, amountChange: number): Promise<void> {
    const customer = await this.getCustomer(id);
    if (!customer) return;
    
    // Convert to float for calculation then back to string/decimal
    const currentBalance = parseFloat(customer.totalBalance as string);
    const newBalance = currentBalance + amountChange;
    
    await db.update(customers)
      .set({ 
        totalBalance: newBalance.toFixed(2),
        lastUpdated: new Date()
      })
      .where(eq(customers.id, id));
  }

  async getTransactions(userId: number, customerId?: number): Promise<Transaction[]> {
    if (customerId) {
      return await db.select().from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.customerId, customerId)
        )
      ).orderBy(desc(transactions.date));
    }
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction & { userId: number }): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values({
      ...transaction,
      date: new Date()
    }).returning();
    
    // Update customer balance logic
    // 'give' = Udhar Diya (Balance increases)
    // 'receive' = Wapas Mila (Balance decreases)
    let amountChange = parseFloat(transaction.amount as string);
    if (transaction.type === 'receive') {
      amountChange = -amountChange;
    }
    
    await this.updateCustomerBalance(transaction.customerId, amountChange);
    
    return newTx;
  }

  async getSales(userId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.userId, userId)).orderBy(desc(sales.date));
  }

  async createSale(sale: InsertSale & { userId: number }): Promise<Sale> {
    const [newSale] = await db.insert(sales).values({
      ...sale,
      date: sale.date || new Date()
    }).returning();
    return newSale;
  }

  async updateSale(id: number, updates: any): Promise<Sale> {
    const [updatedSale] = await db.update(sales).set(updates).where(eq(sales.id, id)).returning();
    return updatedSale;
  }

  async deleteSale(id: number): Promise<void> {
    await db.delete(sales).where(eq(sales.id, id));
  }

  async getPurchases(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(desc(purchases.date));
  }

  async createPurchase(purchase: InsertPurchase & { userId: number }): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values({
      ...purchase,
      date: new Date()
    }).returning();
    return newPurchase;
  }

  async updatePurchase(id: number, updates: any): Promise<Purchase> {
    const [updatedPurchase] = await db.update(purchases).set(updates).where(eq(purchases.id, id)).returning();
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({
      ...expense,
      date: new Date()
    }).returning();
    return newExpense;
  }

  async updateExpense(id: number, updates: any): Promise<Expense> {
    const [updatedExpense] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }
}

export const storage = new DatabaseStorage();
