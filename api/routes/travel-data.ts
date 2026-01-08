import { Router } from "express";
import { authenticateToken, requireActiveUser } from "../middleware/auth.js";
import { TravelData, updateTravelDataSchema } from "../../shared/schema.js";
import { db } from "../db.js";
import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";

const router = Router();
let travelDataCollection: Collection;

// Create new travel data entry
router.post("/", authenticateToken, requireActiveUser, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newData = req.body;

    // Insert into MongoDB
    const result = await db.collection("travel_data").insertOne({
      ...newData,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Get the created document
    const createdItem = await db.collection("travel_data").findOne({
      _id: result.insertedId,
    });

    res.status(201).json(createdItem);
  } catch (error: any) {
    console.error("Failed to create travel data:", error);
    res.status(500).json({
      message: error.message || "Failed to create travel data",
    });
  }
});

// Get all travel data for a session with pagination
router.get("/:sessionId", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await db
      .collection("travel_data")
      .countDocuments({ session_id: sessionId });

    // Get paginated data
    const data = await db
      .collection("travel_data")
      .find({ session_id: sessionId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    res.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Failed to fetch travel data:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch travel data",
    });
  }
});

// Update travel data
router.patch("/:id", authenticateToken, requireActiveUser, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updates = req.body;

    // Validate and sanitize incoming partial update payload using Zod schema.
    // We expect a partial object (only the fields the client wants to update).
    // The schema ensures types are correct; afterwards we remove undefined/null
    // values so we only write the fields the client actually provided. This
    // prevents overwriting database fields with null/undefined and avoids
    // server-side validation errors when the client sends a full object.
    const parsed = updateTravelDataSchema.safeParse(updates);
    if (!parsed.success) {
      // Return detailed validation errors to the client
      return res.status(400).json({
        message: "Invalid update payload",
        errors: parsed.error.errors,
      });
    }

    // Remove undefined/null fields to build a minimal $set payload for MongoDB
    const sanitizedUpdates: Partial<TravelData> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined || value === null) continue; // skip empty values
      // Only include fields that are actually present in the parsed input
      (sanitizedUpdates as any)[key] = value;
    }

    // If after sanitization there are no fields to update, return early
    if (Object.keys(sanitizedUpdates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    // Convert string id to MongoDB ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const result = await db
      .collection("travel_data")
      .findOneAndUpdate(
        { _id: objectId },
        { $set: { ...sanitizedUpdates, updated_at: new Date() } },
        { returnDocument: "after" }
      );

    if (!result) {
      return res.status(404).json({ message: "Travel data not found" });
    }

    // Convert MongoDB _id to string and ensure both id and _id are present
    const responseData = {
      ...result,
      _id: result._id.toString(),
      id: result._id.toString(),
    };

    res.json(responseData);
  } catch (error: any) {
    console.error("Failed to update travel data:", error);
    res.status(500).json({
      message: error.message || "Failed to update travel data",
    });
  }
});

// Delete travel data
router.delete(
  "/:id",
  authenticateToken,
  requireActiveUser,
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const objectId = new ObjectId(id);

      const result = await db
        .collection("travel_data")
        .deleteOne({ _id: objectId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Travel data not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete travel data:", error);
      res.status(500).json({
        message: error.message || "Failed to delete travel data",
      });
    }
  }
);

export default router;
export { router as travelDataRouter };
