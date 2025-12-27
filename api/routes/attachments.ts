import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken, requireActiveUser } from "../middleware/auth";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Debug: module load (dev only)
import { debug } from "../utils/logger.js";
debug("[attachments] module loaded");

const MAX_ATTACHMENT_SIZE = process.env.MAX_ATTACHMENT_SIZE
  ? parseInt(process.env.MAX_ATTACHMENT_SIZE)
  : 10 * 1024 * 1024; // default 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: (req, file, cb) => {
    // Allow common attachment types (images, PDF, Word docs)
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PNG, JPG, JPEG, PDF, DOC and DOCX files are allowed"));
  },
});

// Ensure uploads dir exists
const uploadsDir = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

router.post(
  "/upload",
  authenticateToken,
  requireActiveUser,
  upload.single("file"),
  async (req, res) => {
    try {
      debug("[attachments] upload handler called", {
        path: req.path,
        method: req.method,
        size: req.file ? req.file.size : null,
      });
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const safeName = `${Date.now()}-${req.file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const outPath = path.join(uploadsDir, safeName);
      await fs.promises.writeFile(outPath, req.file.buffer);

      const urlPath = `/uploads/${safeName}`;
      res.json({
        filename: req.file.originalname,
        url: urlPath,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error("Attachment upload failed:", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  }
);

// Support POST /attachments as a fallback for clients that post to the
// base attachments path (some deployments or older clients might do this).
// This endpoint now supports DOC/DOCX and validates maximum attachment size via
// the MAX_ATTACHMENT_SIZE env var (defaults to 10MB).
router.post(
  "/",
  authenticateToken,
  requireActiveUser,
  upload.single("file"),
  async (req, res) => {
    try {
      debug("[attachments] fallback upload handler called", {
        path: req.path,
        method: req.method,
        size: req.file ? req.file.size : null,
      });
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const safeName = `${Date.now()}-${req.file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const outPath = path.join(uploadsDir, safeName);
      await fs.promises.writeFile(outPath, req.file.buffer);

      const urlPath = `/uploads/${safeName}`;
      res.json({
        filename: req.file.originalname,
        url: urlPath,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error("Attachment upload failed (fallback):", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  }
);

export default router;
