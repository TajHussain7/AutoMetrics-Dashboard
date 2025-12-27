import axios from "axios";

export interface Attachment {
  filename: string;
  url: string;
}

export interface QueryMessage {
  author: "user" | "admin";
  message: string;
  attachments?: Attachment[];
  created_at: string;
  // UI-only flag used by the client when optimistically sending messages
  _sending?: boolean;
  _id?: string;
  reactions?: Array<{ user: string; type: "like" | "dislike" }>;
}

export interface QueryItem {
  _id: string;
  user_id: any;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  status?: string;
  created_at: string;
  messages?: QueryMessage[];
  reactions?: Array<{ user: string; type: "like" | "dislike" }>;
}

const api = axios.create({ baseURL: "/api", withCredentials: true });

export const queriesApi = {
  async uploadAttachment(file: File): Promise<Attachment> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      // Do NOT set Content-Type here; letting the browser set it ensures the
      // multipart boundary is included correctly. Setting it manually can
      // result in malformed requests and unexpected server behavior.
      const res = await api.post("/attachments/upload", fd);
      return res.data;
    } catch (err: any) {
      // Fallback in case server mounts the endpoint differently
      if (err?.response?.status === 404) {
        try {
          const res2 = await api.post("/attachments", fd);
          return res2.data;
        } catch (err2: any) {
          throw err2;
        }
      }
      throw err;
    }
  },

  async submitQuery(payload: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
    attachments?: Attachment[];
  }): Promise<QueryItem> {
    // Server currently mounts query creation on the admin router at /api/admin/queries
    const res = await api.post("/admin/queries", payload);
    return res.data;
  },

  async getMyQueries(): Promise<QueryItem[]> {
    // User-scoped query endpoints are under /api/users/queries
    const res = await api.get("/users/queries/me");
    return res.data.queries || [];
  },

  async getQuery(id: string): Promise<QueryItem> {
    const res = await api.get(`/users/queries/${id}`);
    return res.data;
  },

  async postMessage(
    id: string,
    payload: { message: string; attachments?: Attachment[] }
  ) {
    const res = await api.post(`/users/queries/${id}/messages`, payload);
    return res.data;
  },

  async reactOnMessage(
    queryId: string,
    messageId: string,
    type: "like" | "dislike"
  ) {
    const res = await api.post(
      `/users/queries/${queryId}/messages/${messageId}/reactions`,
      { type }
    );
    return res.data;
  },

  async reactOnQuery(queryId: string, type: "like" | "dislike") {
    const res = await api.post(`/users/queries/${queryId}/reactions`, { type });
    return res.data;
  },
};

export default queriesApi;
