
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Authentication
  setupAuth(app);

  // Seed Data Check
  const existingUsers = await storage.getUserByUsername("03001234567");
  if (!existingUsers) {
    const hashedPassword = await hashPassword("1234");
    await storage.createUser({
      username: "03001234567",
      password: hashedPassword,
      shopName: "Meri Kirana Dukaan",
      ownerName: "Dukandar Bhai"
    });
    console.log("Seeded default user: 03001234567 / 1234");
  }

  // Middleware to ensure user is authenticated for API routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // === Customers ===
  app.get(api.customers.list.path, requireAuth, async (req, res) => {
    const search = req.query.search as string | undefined;
    const customers = await storage.getCustomers(req.user!.id, search);
    res.json(customers);
  });

  app.post(api.customers.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer({
        ...input,
        userId: req.user!.id
      });
      res.status(201).json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.customers.get.path, requireAuth, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer || customer.userId !== req.user!.id) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  });

  app.delete(api.customers.delete.path, requireAuth, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer || customer.userId !== req.user!.id) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await storage.deleteCustomer(customer.id);
    res.status(200).send();
  });

  // === Transactions ===
  app.get(api.transactions.list.path, requireAuth, async (req, res) => {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const txs = await storage.getTransactions(req.user!.id, customerId);
    res.json(txs);
  });

  app.post(api.transactions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      // Verify customer belongs to user
      const customer = await storage.getCustomer(input.customerId);
      if (!customer || customer.userId !== req.user!.id) {
        return res.status(400).json({ message: "Invalid customer" });
      }
      
      const tx = await storage.createTransaction({
        ...input,
        userId: req.user!.id
      });
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Sales ===
  app.get(api.sales.list.path, requireAuth, async (req, res) => {
    const sales = await storage.getSales(req.user!.id);
    res.json(sales);
  });

  app.post(api.sales.create.path, requireAuth, async (req, res) => {
    try {
      const saleSchema = z.object({
        amount: z.string(),
        type: z.enum(["cash_sale", "cash_in_hand"]),
        description: z.string().optional(),
        date: z.string().optional().transform(v => v ? new Date(v) : new Date()),
      });
      const input = saleSchema.parse(req.body);
      const sale = await storage.createSale({
        ...input,
        userId: req.user!.id
      });
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Purchases ===
  app.get("/api/purchases", requireAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchases(req.user!.id);
      res.json(purchases);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchases", requireAuth, async (req, res) => {
    try {
      const purchaseSchema = z.object({
        supplierName: z.string(),
        amount: z.string(),
        description: z.string().optional(),
      });
      const input = purchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase({
        ...input,
        userId: req.user!.id
      });
      res.status(201).json(purchase);
    } catch (err) {
      console.error("Error creating purchase:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Expenses ===
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getExpenses(req.user!.id);
      res.json(expenses);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenseSchema = z.object({
        category: z.string(),
        amount: z.string(),
        description: z.string().optional(),
      });
      const input = expenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...input,
        userId: req.user!.id
      });
      res.status(201).json(expense);
    } catch (err) {
      console.error("Error creating expense:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // === Profile Update ===
  app.put(api.auth.updateProfile.path, requireAuth, async (req, res) => {
    try {
       const input = api.auth.updateProfile.input.parse(req.body);
       const updatedUser = await storage.updateUser(req.user!.id, input);
       res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
