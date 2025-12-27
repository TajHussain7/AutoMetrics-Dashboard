import "dotenv/config";
import { connectDB } from "../db.js";
import { User } from "../models/user.js";
import crypto from "crypto";

async function main() {
  const email = process.argv[2] || "autometrices@gmail.com";
  await connectDB();

  let user = await User.findOne({ email });
  if (!user) {
    const tempPassword =
      process.env.ADMIN_PASSWORD ||
      process.env.AMIN_PASSWORD ||
      crypto.randomBytes(8).toString("hex");
    console.info(
      `User not found for ${email}. Creating admin user with temporary password.`
    );
    user = new User({
      fullName: "Admin",
      email,
      password: tempPassword,
      role: "admin",
      isVerified: true,
      status: "active",
    });
    await user.save();
    console.info(
      `Created admin user ${email} with temporary password: ${tempPassword}`
    );
  } else {
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    console.info(`Updated user ${email} - set isVerified=true`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
