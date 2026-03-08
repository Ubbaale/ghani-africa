import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "../db";
import { users, type User } from "@shared/models/auth";
import { userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, generate6DigitCode } from "./password";
import { sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import { z } from "zod";
import crypto from "crypto";

const verificationAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkVerificationRateLimit(email: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const attempts = verificationAttempts.get(email);
  
  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_VERIFICATION_ATTEMPTS };
  }
  
  if (now - attempts.firstAttempt > VERIFICATION_LOCKOUT_MS) {
    verificationAttempts.delete(email);
    return { allowed: true, remainingAttempts: MAX_VERIFICATION_ATTEMPTS };
  }
  
  if (attempts.count >= MAX_VERIFICATION_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }
  
  return { allowed: true, remainingAttempts: MAX_VERIFICATION_ATTEMPTS - attempts.count };
}

function recordVerificationAttempt(email: string): void {
  const now = Date.now();
  const attempts = verificationAttempts.get(email);
  
  if (!attempts || now - attempts.firstAttempt > VERIFICATION_LOCKOUT_MS) {
    verificationAttempts.set(email, { count: 1, firstAttempt: now });
  } else {
    attempts.count++;
  }
}

function clearVerificationAttempts(email: string): void {
  verificationAttempts.delete(email);
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Ensure session secret exists - generate one if not configured
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    console.warn("WARNING: SESSION_SECRET not set. Generating random secret for this session.");
    console.warn("This will invalidate sessions on restart. Set SESSION_SECRET in environment variables.");
  }
  
  return session({
    secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  role: z.enum(["consumer", "trader", "manufacturer"]).default("consumer"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
          
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await verifyPassword(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });

  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.errors 
        });
      }

      const { email, password, firstName, lastName, role } = result.data;
      const normalizedEmail = email.toLowerCase();

      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password and create 6-digit verification code
      const passwordHash = await hashPassword(password);
      const verificationCode = generate6DigitCode();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Create user
      const [newUser] = await db.insert(users).values({
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName: lastName || null,
        isEmailVerified: false,
        emailVerificationToken: verificationCode,
        emailVerificationExpires: verificationExpires,
      }).returning();

      // Create user profile with selected role
      await db.insert(userProfiles).values({
        id: newUser.id,
        role: role || "consumer",
        country: "Kenya", // default country
      }).onConflictDoNothing();

      // Send verification email with 6-digit code
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      try {
        console.log(`Attempting to send verification code to ${normalizedEmail}`);
        await sendVerificationEmail(normalizedEmail, firstName, verificationCode, baseUrl);
        console.log(`Verification code sent successfully to ${normalizedEmail}`);
      } catch (emailError: any) {
        console.error("Failed to send verification email:", {
          error: emailError.message,
          code: emailError.code,
          response: JSON.stringify(emailError.response?.body, null, 2),
          email: normalizedEmail
        });
        // Continue registration even if email fails
      }

      res.status(201).json({ 
        message: "Registration successful. Please check your email for the verification code.",
        userId: newUser.id,
        email: normalizedEmail,
        requiresVerification: true
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: result.error.errors 
      });
    }

    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Return user without sensitive data
        res.json({ message: "Login successful", user: sanitizeUser(user) });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
      });
    });
  });

  // Also support GET for logout redirect
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
      });
    });
  });

  // Email verification endpoint - POST with 6-digit code
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const normalizedEmail = email.toLowerCase();
      
      // Check rate limit before processing
      const rateLimit = checkVerificationRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        return res.status(429).json({ 
          message: "Too many verification attempts. Please try again in 15 minutes.",
          retryAfter: 15 * 60
        });
      }
      
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      
      if (!user) {
        recordVerificationAttempt(normalizedEmail);
        return res.status(400).json({ message: "Invalid email address" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      if (user.emailVerificationToken !== code) {
        recordVerificationAttempt(normalizedEmail);
        const remaining = checkVerificationRateLimit(normalizedEmail).remainingAttempts;
        return res.status(400).json({ 
          message: `Invalid verification code. ${remaining} attempts remaining.`
        });
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      // Clear rate limit on successful verification
      clearVerificationAttempts(normalizedEmail);

      await db.update(users)
        .set({ 
          isEmailVerified: true, 
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Email verified successfully", verified: true });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  // Resend verification code endpoint
  app.post("/api/auth/resend-code", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      
      if (!user) {
        return res.status(400).json({ message: "No account found with this email" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new 6-digit code
      const newCode = generate6DigitCode();
      const newExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.update(users)
        .set({ 
          emailVerificationToken: newCode,
          emailVerificationExpires: newExpires,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      
      // Clear rate limit when new code is sent
      clearVerificationAttempts(normalizedEmail);

      // Send new verification email
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      try {
        await sendVerificationEmail(normalizedEmail, user.firstName || "", newCode, baseUrl);
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification code sent successfully" });
    } catch (error) {
      console.error("Resend code error:", error);
      res.status(500).json({ message: "Failed to resend code. Please try again." });
    }
  });

  // Legacy GET endpoint for link-based verification (backward compatibility)
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.redirect("/login?error=invalid_token");
      }

      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
      
      if (!user) {
        return res.redirect("/login?error=invalid_token");
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return res.redirect("/login?error=token_expired");
      }

      await db.update(users)
        .set({ 
          isEmailVerified: true, 
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      res.redirect("/login?verified=true");
    } catch (error) {
      console.error("Email verification error:", error);
      res.redirect("/login?error=verification_failed");
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }

      const resetToken = generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users)
        .set({ 
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      try {
        await sendPasswordResetEmail(normalizedEmail, user.firstName || "", resetToken, baseUrl);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Request failed. Please try again." });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const passwordHash = await hashPassword(password);

      await db.update(users)
        .set({ 
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Password reset failed. Please try again." });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    res.json(sanitizeUser(user));
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
