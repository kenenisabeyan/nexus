import type {
  BriefingResponse,
  KnowledgeItemDetail,
  KnowledgeItem,
  SearchResponse,
  Source,
  GraphResponse,
  PublicUser,
  VerifyActionPayload,
} from "@nexus/types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

export const api = {
  briefing: () => get<BriefingResponse>("/briefing"),
  item: (id: string | number) => get<KnowledgeItemDetail>(`/items/${id}`),
  search: (q: string) => get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`),
  sources: () => get<Source[]>("/sources"),
  graph: () => get<GraphResponse>("/graph"),
  pendingIngestion: () => get<{ pending: KnowledgeItem[] }>("/ingestion/pending"),
  verifyIngestion: (id: number, payload: VerifyActionPayload) =>
    post<{ ok: boolean; id: number; status: string }>(`/ingestion/${id}/verify`, payload),
  register: (email: string, password: string) => post<{ user: PublicUser }>("/auth/register", { email, password }),
  login: (email: string, password: string) => post<{ user: PublicUser }>("/auth/login", { email, password }),
  logout: () => post<{ ok: boolean }>("/auth/logout", {}),
  me: () => get<{ user: PublicUser }>("/auth/me"),
};

