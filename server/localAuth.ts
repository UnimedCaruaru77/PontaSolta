import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  if (process.env.NODE_ENV === 'development') {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: 86400000,
      ttl: sessionTtl,
    });
    console.log('[session] Using MemoryStore for development');
  } else {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    console.log('[session] Using PostgreSQL session store for production');
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Email ou senha incorretos' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Usuário não configurado para login local' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Email ou senha incorretos' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro no servidor" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Email ou senha incorretos" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        return res.json({ 
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        });
      });
    })(req, res, next);
  });

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const newUser = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      req.logIn(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Usuário criado, mas erro ao fazer login" });
        }
        return res.status(201).json({
          message: "Usuário criado com sucesso",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
          }
        });
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};
