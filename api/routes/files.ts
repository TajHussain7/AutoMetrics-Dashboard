import { Router } from "express";
import multer from "multer";
import { authenticateToken, requireActiveUser } from "../middleware/auth";
import { fileStorage } from "../storage/file-storage";
import { FileStatus, uploadedFileSchema } from "@shared/upload-schema";
import { processExcelData } from "../excel-processor";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Accept excel and CSV files
    if (
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel") ||
      file.originalname.match(/\.(xlsx|xls|csv)$/)
    ) {
      return cb(null, true);
    }
    cb(new Error("Only Excel and CSV files are allowed"));
  },
});

// Upload new file
router.post(
  "/upload",
  authenticateToken,
  requireActiveUser,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file || !req.user?.id) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get current active file for user
      const currentActive = await fileStorage.getActiveFileForUser(req.user.id);

      // If exists, archive it
      if (currentActive) {
        await fileStorage.archiveFile(currentActive.id);
      }

      // Create new file record
      const newFile = await fileStorage.createFile({
        user_id: req.user.id,
        filename: req.file.filename || `file_${Date.now()}`,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        status: FileStatus.Processing,
        metadata: {
          file_type: req.file.mimetype,
        },
      });

      // Process the file
      const processedData = processExcelData(
        req.file.buffer,
        req.file.originalname
      );

      // Update file with processed data
      const updatedFile = await fileStorage.updateFile(newFile.id, {
        status: FileStatus.Active,
        metadata: {
          ...newFile.metadata,
          total_rows: processedData.entries.length,
          processed_rows: processedData.entries.length,
          has_headers: true,
          file_type:
            typeof newFile.metadata?.file_type === "string"
              ? newFile.metadata?.file_type
              : undefined,
        },
      });

      // Save the processed rows
      await fileStorage.saveFileData(newFile.id, processedData.entries);

      res.json({
        file: updatedFile,
        rowCount: processedData.entries.length,
        status: "success",
      });
    } catch (error: any) {
      console.error("File upload failed:", error);
      res.status(500).json({
        message: error.message || "File upload failed",
        status: "error",
      });
    }
  }
);

// Get user's file history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const files = await fileStorage.getFileHistoryForUser(req.user.id);
    res.json(files);
  } catch (error: any) {
    console.error("Failed to get file history:", error);
    res.status(500).json({
      message: error.message || "Failed to get file history",
    });
  }
});

// Get active file data
router.get("/active", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const activeFile = await fileStorage.getActiveFileForUser(req.user.id);
    if (!activeFile) {
      return res.json(null);
    }

    const fileData = await fileStorage.getFileData(activeFile.id);
    res.json({
      file: activeFile,
      data: fileData,
    });
  } catch (error: any) {
    console.error("Failed to get active file:", error);
    res.status(500).json({
      message: error.message || "Failed to get active file",
    });
  }
});

// Update file data rows
router.patch(
  "/data/:fileId",
  authenticateToken,
  requireActiveUser,
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { fileId } = req.params;
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Invalid updates format" });
      }

      await fileStorage.updateFileRows(fileId, updates);

      // Return updated rows
      const updatedData = await fileStorage.getFileData(fileId);
      const updatedRows = updates.map((update) => updatedData[update.index]);

      res.json({
        status: "success",
        updated_rows: updatedRows,
        sync_token: Date.now().toString(),
      });
    } catch (error: any) {
      console.error("Failed to update file data:", error);
      res.status(500).json({
        message: error.message || "Failed to update file data",
      });
    }
  }
);

export default router;
// At the end of the file
export { router as fileRouter };
