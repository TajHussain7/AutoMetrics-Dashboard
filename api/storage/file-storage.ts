import { File } from "../models/file.js";
import { FileData } from "../models/file-data.js";
import {
  FileStatus,
  type UploadedFileBase,
} from "../../shared/upload-schema.js";

export class FileStorage {
  async getFileHistoryForUser(userId: string) {
    // Return all files for a user, sorted by most recent
    return await File.find({ user_id: userId }).sort({ created_at: -1 });
  }
  async createFile(fileData: Partial<UploadedFileBase>) {
    const file = new File(fileData);
    await file.save();
    return file;
  }

  async updateFile(id: string, updates: Partial<UploadedFileBase>) {
    return await File.findByIdAndUpdate(
      id,
      { ...updates, updated_at: new Date() },
      { new: true }
    );
  }

  async archiveFile(id: string) {
    return await this.updateFile(id, { status: FileStatus.Archived });
  }

  async getActiveFileForUser(userId: string) {
    return await File.findOne({
      user_id: userId,
      status: FileStatus.Active,
    });
  }

  async saveFileData(fileId: string, rows: any[]) {
    const fileData = new FileData({
      file_id: fileId,
      rows: rows.map((data, index) => ({
        row_number: index + 1,
        data,
      })),
    });
    await fileData.save();
  }

  async getFileData(fileId: string) {
    const fileData = await FileData.findOne({ file_id: fileId });
    return fileData?.rows.map((row) => row.data) || [];
  }

  async updateFileRows(
    fileId: string,
    updates: { index: number; data: any }[]
  ) {
    const fileData = await FileData.findOne({ file_id: fileId });
    if (!fileData) throw new Error("File data not found");

    for (const update of updates) {
      const row = fileData.rows[update.index];
      if (row) {
        row.data = { ...row.data, ...update.data };
        row.modified_at = new Date();
      }
    }

    await fileData.save();
  }
}

export const fileStorage = new FileStorage();
