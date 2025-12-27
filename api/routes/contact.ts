import { Router } from "express";
import { Contact } from "../models/contact";
import { contactSchema } from "@shared/contact-schema";
import { authenticateToken } from "../middleware/auth";
import nodemailer from "nodemailer";
import { debug } from "../utils/logger.js";

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Public: submit contact message
router.post("/", async (req, res) => {
  debug("Incoming POST /api/contact");
  try {
    const parsed = contactSchema.parse(req.body);

    const c = new Contact({
      name: parsed.name,
      email: parsed.email,
      subject: parsed.subject || undefined,
      message: parsed.message,
    });

    await c.save();
    res.status(201).json({ success: true, message: "Submitted" });
  } catch (err: any) {
    console.error("Error submitting contact message:", err);
    return res
      .status(400)
      .json({ success: false, message: err?.message || "Invalid" });
  }
});

// Admin: list contact messages
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user as any;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Contact.find().sort({ created_at: -1 });
    res.json({ success: true, messages });
  } catch (err: any) {
    console.error("Error fetching contact messages:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
});

// Admin: respond to a message
router.patch("/:id/respond", authenticateToken, async (req, res) => {
  try {
    const user = req.user as any;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { response } = req.body;
    if (
      !response ||
      typeof response !== "string" ||
      response.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Response is required" });
    }

    const msg = await Contact.findById(req.params.id);
    if (!msg)
      return res.status(404).json({ success: false, message: "Not found" });

    msg.responded = true;
    msg.response = response;
    msg.response_by = user._id;
    msg.response_at = new Date();
    await msg.save();

    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_USER}>`,
      to: msg.email,
      subject: `Re: ${msg.subject || "Your contact message"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); height: 4px;"></div>
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
            <!-- Icon Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);">
                <span style="font-size: 30px;">📬</span>
              </div>
            </div>

            <!-- Greeting -->
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">Hello <strong>${
              msg.name
            }</strong>,</p>

            <!-- Response Message -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p style="font-size: 15px; color: #334155; margin: 0; line-height: 1.8;">${response}</p>
            </div>

            <!-- Closing -->
            <p style="font-size: 15px; color: #334155; margin-bottom: 10px;">Thank you for reaching out to us. We appreciate your inquiry.</p>

            <p style="font-size: 15px; color: #334155; margin-bottom: 30px;">
              Best regards,<br/>
              <strong style="color: #3b82f6;">Support Team AutoMetrics</strong>
            </p>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">© ${new Date().getFullYear()} Tajamal Hussain. All rights reserved.</p>
              <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0 0;">If you have any further questions, please don't hesitate to contact us.</p>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); height: 4px;"></div>
        </body>
        </html>
      `,
    });

    res.json({ success: true, message: "Responded", msg });
  } catch (err: any) {
    console.error("Error responding to message:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
});

export default router;
