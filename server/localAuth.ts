import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { pool } from "./db";

// Emails que terão papel de administrador automaticamente
const ADMIN_EMAILS = [
  'luciano.filho@unimedcaruaru.com.br',
  'luciano.filho4@unimedcaruaru.com.br',
];

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana

  const isProduction = Boolean(
    process.env.REPL_SLUG ||
    process.env.REPLIT_DEPLOYMENT === '1' ||
    process.env.NODE_ENV === 'production'
  );

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
      pool,
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
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function getCallbackUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
    return `https://${domain}/api/auth/google/callback`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;
  }
  return `http://localhost:5000/api/auth/google/callback`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    console.error('[auth] CRITICAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
    throw new Error('Google OAuth credentials are not configured.');
  }

  const callbackURL = getCallbackUrl();
  console.log(`[auth] Google OAuth enabled. Callback URL: ${callbackURL}`);
  console.log(`[auth] Admin emails: ${ADMIN_EMAILS.join(', ')}`);

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
          return done(new Error('Não foi possível obter o email da conta Google'));
        }

        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        const roleForEmail = isAdmin ? 'admin' : 'member';

        // Buscar usuário por Google ID ou email
        let user = await storage.getUserByGoogleId(profile.id);

        if (!user) {
          user = await storage.getUserByEmail(email);
        }

        if (user) {
          // Atualizar dados do Google e garantir role correto
          const needsUpdate =
            !user.googleId ||
            user.profileImageUrl !== (profile.photos?.[0]?.value || user.profileImageUrl) ||
            (isAdmin && user.role !== 'admin');

          if (needsUpdate) {
            user = await storage.updateUser(user.id, {
              googleId: profile.id,
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
              ...(isAdmin ? { role: 'admin' } : {}),
            });
            console.log(`[auth] User updated via Google OAuth: ${email} (role: ${user.role})`);
          }
        } else {
          // Criar novo usuário
          user = await storage.createUser({
            email,
            googleId: profile.id,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            role: roleForEmail,
          });
          console.log(`[auth] New user created via Google OAuth: ${email} (role: ${roleForEmail})`);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
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

  // Rota de login com Google
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Callback do Google
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Configuração de auth (usado pelo frontend)
  app.get("/api/auth/config", (req, res) => {
    res.json({ googleEnabled: true });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};
