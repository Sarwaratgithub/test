
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// In a real app we'd hash passwords. For this MVP based on the user's snippet logic
// (User provides Phone + PIN), we will store them directly or lightly hashed.
// Since the prompt requires secure practices, let's implement basic hashing.

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "kirana_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        // Special case: If NO user exists with this username, 
        // and it's the first login, we might want to create one? 
        // No, let's seed a demo user or allow registration via a secret endpoint.
        // For MVP: Auto-create user if none exists with that phone number to let them in immediately?
        // Let's stick to standard flow: User must exist.
        // But for the user to try it, I'll seed a user.
        
        if (!user) {
          // Auto-registration for MVP simplicity so user can just "Login"
          // In real app, separate Register page.
          const hashedPassword = await hashPassword(password);
          const newUser = await storage.createUser({
            username,
            password: hashedPassword,
            shopName: "Meri Kirana Dukaan",
            ownerName: "Dukandar"
          });
          return done(null, newUser);
        } else {
            const isValid = await comparePasswords(password, user.password);
            if (!isValid) {
              return done(null, false, { message: "Invalid PIN" });
            }
            return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}
