import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production

// Helper: generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create OTP record and send email
async function createAndSendOtp(
  user: any,
  purpose: "email_verification" | "reset_password" = "email_verification"
) {
  const bcrypt = await import("bcryptjs");
  const { EmailVerification } = await import("../models/emailVerification.js");
  const { sendVerificationEmail } = await import("../utils/resend-email.js");

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove any existing verification records for this user/email and purpose
  await EmailVerification.deleteMany({
    userId: user._id,
    email: user.email,
    purpose,
  });

  const verification = new EmailVerification({
    userId: user._id,
    email: user.email,
    otpHash,
    expiresAt,
    purpose,
  });

  await verification.save();

  // Send the OTP email (using SMTP or Resend integration)
  try {
    await sendVerificationEmail(user.email, otp, purpose);
  } catch (err) {
    console.error("Error sending verification email:", err);
    // Rethrow so caller can handle (and client sees the error)
    throw err;
  }

  // Do NOT return or log the OTP in any environment (avoid leaking secrets in logs or responses)
  return null;
}

// Register a new user (creates unverified user and sends OTP)
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user (unverified)
    const user = new User({
      email,
      password,
      fullName,
      role: "member", // Default role
      isVerified: false,
    });

    await user.save();

    // Check if email is configured before sending OTP
    const emailConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    if (emailConfigured) {
      // Send verification OTP to the user's email
      await createAndSendOtp(user);
    } else {
      // If email is not configured, auto-verify the user (development/testing only)
      console.warn(
        "⚠️ Email not configured. Auto-verifying user for testing purposes."
      );
      user.isVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();
    }

    // Return user data (excluding password) and indicate verification is required
    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
      isVerified: user.isVerified,
    };

    const resp: any = {
      user: userData,
      verificationSent: emailConfigured,
      autoVerified: !emailConfigured,
    };

    res.status(201).json(resp);
  } catch (error: any) {
    // If OTP send failed after user was created, remove the user to avoid orphan unverified accounts
    try {
      if (req.body && req.body.email) {
        await User.deleteOne({ email: req.body.email });
        console.warn(
          `Rolled back user creation for ${req.body.email} due to registration error`
        );
      }
    } catch (delErr) {
      console.error("Failed to delete partially created user:", delErr);
    }
    res.status(500).json({ message: error.message });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { EmailVerification } = await import(
      "../models/emailVerification.js"
    );
    const existing = await EmailVerification.findOne({
      userId: user._id,
      email,
    });

    // Simple cooldown: don't allow resend if last OTP was created < 60s ago
    if (
      existing &&
      existing.createdAt &&
      Date.now() - existing.createdAt.getTime() < 60 * 1000
    ) {
      return res
        .status(429)
        .json({ message: "Please wait before resending OTP" });
    }

    await createAndSendOtp(user, "email_verification");

    res.json({ message: "OTP resent" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Request password reset (sends OTP to email)
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always respond with success to avoid account enumeration
    if (!user)
      return res.json({
        message: "If an account exists for this email, an OTP was sent.",
      });

    await createAndSendOtp(user, "reset_password");

    res.json({
      message: "If an account exists for this email, an OTP was sent.",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password using OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res
        .status(400)
        .json({ message: "Email, OTP and new password are required" });

    const { EmailVerification } = await import(
      "../models/emailVerification.js"
    );
    const bcrypt = await import("bcryptjs");
    const verification = await EmailVerification.findOne({
      email,
      purpose: "reset_password",
    }).sort({ createdAt: -1 });

    if (!verification)
      return res
        .status(400)
        .json({ message: "No OTP request found for this email" });

    if (verification.expiresAt < new Date()) {
      await verification.deleteOne();
      return res.status(400).json({ message: "OTP expired" });
    }

    const match = await bcrypt.compare(otp, verification.otpHash);
    if (!match) {
      verification.attempts = (verification.attempts || 0) + 1;
      await verification.save();
      if (verification.attempts >= 5) {
        await verification.deleteOne();
        return res
          .status(429)
          .json({ message: "Too many attempts, request a new OTP" });
      }
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update user's password
    const user = await User.findById(verification.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    // Remove verification record
    await verification.deleteOne();

    // Optionally login the user: set auth cookie
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
    };

    res.json({ user: userData, reset: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP and mark user verified
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const { EmailVerification } = await import(
      "../models/emailVerification.js"
    );
    const bcrypt = await import("bcryptjs");
    const verification = await EmailVerification.findOne({ email }).sort({
      createdAt: -1,
    });

    if (!verification)
      return res
        .status(400)
        .json({ message: "No OTP request found for this email" });

    if (verification.expiresAt < new Date()) {
      await verification.deleteOne();
      return res.status(400).json({ message: "OTP expired" });
    }

    const match = await bcrypt.compare(otp, verification.otpHash);
    if (!match) {
      verification.attempts = (verification.attempts || 0) + 1;
      await verification.save();
      if (verification.attempts >= 5) {
        await verification.deleteOne();
        return res
          .status(429)
          .json({ message: "Too many attempts, request a new OTP" });
      }
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark user verified
    const user = await User.findById(verification.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Remove verification record
    await verification.deleteOne();

    // Generate JWT token and set cookie (login on verify)
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
    };

    res.json({ user: userData, verified: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Prevent login if email not verified
    if (!user.isVerified) {
      console.warn(`Login blocked for ${email}: email not verified`);
      return res.status(403).json({ message: "Email not verified" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Set token in HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Can use "lax" now since we're on same domain
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
    };

    res.json({ user: userData });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // If user exists but is not verified, clear cookie and return unauthorized
    if (!user.isVerified) {
      console.warn(`Rejected session for ${user.email}: email not verified`);
      res.clearCookie("auth_token");
      return res.status(401).json({ message: "Email not verified" });
    }

    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
    };

    res.json({ user: userData });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out successfully" });
});

export default router;
