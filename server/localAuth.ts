import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Detect if we're in production based on Replit domains
  const isProduction = Boolean(process.env.REPL_SLUG || 
                       process.env.REPLIT_DEPLOYMENT === '1' ||
                       process.env.NODE_ENV === 'production');
  
  let sessionStore;
  if (!isProduction) {
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
      secure: isProduction, // Use secure cookies in production (HTTPS)
      sameSite: 'lax', // CSRF protection
      maxAge: sessionTtl,
    },
  });
}

function getCallbackUrl(): string {
  // In production (published Replit app)
  if (process.env.REPLIT_DEPLOYMENT === '1') {
    const slug = process.env.REPL_SLUG;
    const owner = process.env.REPL_OWNER;
    if (slug && owner) {
      return `https://${slug}.${owner}.repl.co/api/auth/google/callback`;
    }
  }
  
  // In Replit dev environment
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;
  }
  
  // Local development fallback
  return `http://localhost:5000/api/auth/google/callback`;
}

async function initializeAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'luciano.filho@unimedcaruaru.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    // If admin already exists with password or Google auth, we're good
    if (existingAdmin && (existingAdmin.passwordHash || existingAdmin.googleId)) {
      console.log('[auth] Admin user already configured');
      return;
    }
    
    // Admin doesn't exist or has no auth method - we MUST have ADMIN_PASSWORD secret
    if (!adminPassword) {
      const errorMsg = `
╔═══════════════════════════════════════════════════════════════╗
║ CRITICAL ERROR: ADMIN_PASSWORD secret is not configured      ║
║                                                               ║
║ The application cannot start without an admin user.          ║
║ Please set the ADMIN_PASSWORD environment secret and         ║
║ restart the application.                                     ║
║                                                               ║
║ To fix:                                                       ║
║ 1. Go to Replit Secrets                                      ║
║ 2. Add secret: ADMIN_PASSWORD = <your-secure-password>       ║
║ 3. Restart/republish the application                         ║
╚═══════════════════════════════════════════════════════════════╝
      `;
      console.error(errorMsg);
      throw new Error('ADMIN_PASSWORD environment variable is required but not set');
    }
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    if (!existingAdmin) {
      console.log('[auth] Admin user not found in database. Creating default admin user...');
      
      await storage.createUser({
        email: adminEmail,
        passwordHash,
        firstName: 'Luciano',
        lastName: 'Filho',
        role: 'admin',
      });
      
      console.log(`[auth] ✅ Default admin user created: ${adminEmail}`);
    } else if (!existingAdmin.passwordHash) {
      console.log('[auth] Admin user exists but has no password. Setting password...');
      await storage.updateUser(existingAdmin.id, { passwordHash });
      console.log('[auth] ✅ Admin password set successfully');
    }
  } catch (error) {
    console.error('[auth] Fatal error initializing admin user:', error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize admin user if database is empty
  await initializeAdminUser();

  // --- Local Strategy (email/password) ---
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
          return done(null, false, { message: 'Esta conta usa login pelo Google. Clique em "Entrar com Google".' });
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

  // --- Google OAuth Strategy ---
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    const callbackURL = getCallbackUrl();
    console.log(`[auth] Google OAuth enabled. Callback URL: ${callbackURL}`);

    passport.use(new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('Não foi possível obter email da conta Google'));
          }

          // Look for existing user by Google ID first, then by email
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (!user) {
            user = await storage.getUserByEmail(email);
          }

          if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
              user = await storage.updateUser(user.id, {
                googleId: profile.id,
                profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
              });
            }
          } else {
            // Create new user from Google profile
            user = await storage.createUser({
              email,
              googleId: profile.id,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
              role: 'member',
            });
            console.log(`[auth] New user created via Google OAuth: ${email}`);
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    ));

    // Google OAuth routes
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  } else {
    console.warn('[auth] Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
    
    // Return error if Google auth is attempted without credentials
    app.get('/api/auth/google', (req, res) => {
      res.redirect('/login?error=google_not_configured');
    });
  }

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

  // Login endpoint (email/password)
  app.post("/api/auth/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: validation.error.errors 
      });
    }

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
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: validation.error.errors 
        });
      }

      const { email, password, firstName, lastName } = validation.data;

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

  // Check if Google OAuth is configured
  app.get("/api/auth/config", (req, res) => {
    res.json({
      googleEnabled: Boolean(googleClientId && googleClientSecret),
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};
