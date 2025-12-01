import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  password: string;
  role: "member" | "admin";
  createdAt: Date;
  company_name?: string;
  phone_number?: string;
  status?: "active" | "inactive";
  address?: string;
  dob?: Date;
  avatar?: string; // Base64 encoded image data
  lastActive?: Date;
  announcements?: Array<{
    announcement: mongoose.Schema.Types.ObjectId;
    read: boolean;
    notified: boolean;
    created_at: Date;
  }>;
  // per-user storage quota in bytes
  storage_quota_bytes?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  company_name: {
    type: String,
    trim: true,
  },
  phone_number: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  dob: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  // Storage quota in bytes (admin adjustable). Default: 10GB
  storage_quota_bytes: {
    type: Number,
    default: 10 * 1024 * 1024 * 1024,
  },
  avatar: {
    type: String, // Base64 encoded image
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  announcements: [
    {
      announcement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
      },
      read: {
        type: Boolean,
        default: false,
      },
      notified: {
        type: Boolean,
        default: false,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Hash password before saving
userSchema.pre("save", async function (next: any) {
  const doc = this as any;
  if (!doc.isModified || !doc.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    doc.password = await bcrypt.hash(doc.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (
  this: any,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export const User = mongoose.model<IUser>("User", userSchema);
