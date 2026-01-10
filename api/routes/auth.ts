import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production

// Register a new user (automatically verified)
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user (automatically verified)
    const user = new User({
      email,
      password,
      fullName,
      role: "member", // Default role
      isVerified: true, // Auto-verify on registration
      emailVerifiedAt: new Date(),
    });

    await user.save();

    // Generate JWT token and log the user in immediately
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

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt,
      isVerified: user.isVerified,
    };

    res.status(201).json({ user: userData });
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
