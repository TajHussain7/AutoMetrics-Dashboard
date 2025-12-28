import { nanoid } from "nanoid";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { UploadSession, TravelData } from "@shared/schema.js";

// Get directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Filesystem-backed storage for local development. This replaces the Supabase
// storage implementation and persists data under `api/data/` so uploads and
// sessions survive dev server restarts.
const DATA_DIR = join(__dirname, "data");
const TRAVEL_FILE = join(DATA_DIR, "travelData.json");
const SESSIONS_FILE = join(DATA_DIR, "uploadSessions.json");

// NOTE: Filesystem storage is deprecated. The project now uses MongoDB for
// uploads and travel data. We keep this module for reference but disable the
// on-disk behavior to avoid accidentally creating `api/data` in production/dev.
function ensureDataDir() {
  console.warn(
    "Deprecated filesystem storage used — no-op. Use MongoDB-backed models instead."
  );
  return;
}

async function readJson<T>(_file: string): Promise<T> {
  throw new Error(
    "Filesystem storage is disabled. Use MongoDB models (UploadSession, TravelData)."
  );
}

async function writeJson(_file: string, _data: any) {
  throw new Error(
    "Filesystem storage is disabled. Use MongoDB models (UploadSession, TravelData)."
  );
}

class FileSystemStorage {
  async createTravelDataBatch(data: any[]): Promise<TravelData[]> {
    if (!data || data.length === 0) return [];
    const existing = (await readJson<TravelData[]>(TRAVEL_FILE)) || [];
    const created: TravelData[] = data.map((item) => {
      const row: TravelData = {
        id: nanoid(),
        session_id: item.session_id || item.sessionId || null,
        date: item.date || "",
        voucher: item.voucher || "",
        reference: item.reference ?? null,
        narration: item.narration ?? null,
        debit: item.debit ?? null,
        credit: item.credit ?? null,
        balance: item.balance ?? null,
        customer_name: item.customer_name ?? null,
        route: item.route ?? null,
        pnr: item.pnr ?? null,
        flying_date: item.flying_date ?? null,
        flight_status: (item.flight_status ?? item.flying_status) || null,
        customer_rate: item.customer_rate ?? null,
        company_rate: item.company_rate ?? null,
        profit: item.profit ?? null,
        payment_status: item.payment_status || "Pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: item.user_id ?? null,
      } as TravelData;
      existing.push(row);
      return row;
    });
    await writeJson(TRAVEL_FILE, existing);
    return created;
  }

  async getTravelDataBySession(sessionId: string): Promise<TravelData[]> {
    const existing = (await readJson<TravelData[]>(TRAVEL_FILE)) || [];
    return existing.filter((r) => r.session_id === sessionId);
  }

  async createUploadSession(sessionData: any): Promise<UploadSession> {
    if (!sessionData?.filename) throw new Error("Filename is required");
    const sessions = (await readJson<UploadSession[]>(SESSIONS_FILE)) || [];
    const session: UploadSession = {
      id: nanoid(),
      filename: sessionData.filename,
      opening_balance:
        sessionData.opening_balance || sessionData.openingBalance || null,
      total_records: Number(
        sessionData.totalRecords ?? sessionData.total_records ?? 0
      ),
      user_id: sessionData.user_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UploadSession;
    sessions.push(session);
    await writeJson(SESSIONS_FILE, sessions);
    return session;
  }

  async updateTravelData(id: string, updates: any): Promise<TravelData> {
    const existing = (await readJson<TravelData[]>(TRAVEL_FILE)) || [];
    const idx = existing.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Travel data not found");
    const updated = {
      ...existing[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    } as TravelData;
    existing[idx] = updated;
    await writeJson(TRAVEL_FILE, existing);
    return updated;
  }

  async deleteTravelData(id: string): Promise<void> {
    const existing = (await readJson<TravelData[]>(TRAVEL_FILE)) || [];
    const filtered = existing.filter((r) => r.id !== id);
    await writeJson(TRAVEL_FILE, filtered);
  }

  async getUploadSessionsForUser(_userId: string): Promise<UploadSession[]> {
    const sessions = (await readJson<UploadSession[]>(SESSIONS_FILE)) || [];
    return sessions
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);
  }

  async getRecentUploadSessions(): Promise<UploadSession[]> {
    const sessions = (await readJson<UploadSession[]>(SESSIONS_FILE)) || [];
    return sessions
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);
  }
}

const storage = new FileSystemStorage();

export { storage };
