import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Verify JWT and attach user to req.user
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies.auth_token;
    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader && authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware that requires the authenticated user's account to be active.
// Allows login (auth route) but blocks mutation actions when a user is deactivated.
export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    if (!user)
      return res.status(401).json({ message: "Authentication required" });

    // Treat explicit 'inactive' status as blocked
    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Account deactivated", code: "ACCOUNT_DEACTIVATED" });
    }

    next();
  } catch (err) {
    console.error("requireActiveUser middleware error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

// Admin middleware - composite: authenticate first, then check admin role
export const isAdmin = [authenticateToken, checkRole(["admin"])];
