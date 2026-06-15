import type { Category, Item, Room, RoomGeometry, Surface, Zone } from "@philemon/types";

export type ZoneWithItems = Zone & { items: Item[] };
export type RoomNode = Room & {
  geometry: RoomGeometry | null;
  surfaces: Surface[];
  zones: ZoneWithItems[];
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const BASE = import.meta.env.VITE_API_URL;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  rooms: () => req<RoomNode[]>("/rooms"),
  categories: () => req<Category[]>("/categories"),
  createCategory: (name: string) =>
    req<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
  deleteCategory: (id: string) => req<void>(`/categories/${id}`, { method: "DELETE" }),

  createRoom: (body: { name: string }) =>
    req<Room>("/rooms", { method: "POST", body: JSON.stringify(body) }),
  updateRoom: (id: string, body: Partial<Room>) =>
    req<Room>(`/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRoom: (id: string) => req<void>(`/rooms/${id}`, { method: "DELETE" }),

  createZone: (body: { roomId: string; name: string; budgetTargetCents?: number }) =>
    req<Zone>("/zones", { method: "POST", body: JSON.stringify(body) }),
  updateZone: (id: string, body: Partial<Zone>) =>
    req<Zone>(`/zones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteZone: (id: string) => req<void>(`/zones/${id}`, { method: "DELETE" }),

  createItem: (body: Partial<Item> & { zoneId: string; name: string }) =>
    req<Item>("/items", { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id: string, body: Partial<Item>) =>
    req<Item>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteItem: (id: string) => req<void>(`/items/${id}`, { method: "DELETE" }),

  createSurface: (body: { roomId: string; name: string; areaM2?: number }) =>
    req<Surface>("/surfaces", { method: "POST", body: JSON.stringify(body) }),
  deleteSurface: (id: string) => req<void>(`/surfaces/${id}`, { method: "DELETE" }),

  presign: (contentType: string, ext?: string) =>
    req<{ key: string; uploadUrl: string; publicUrl: string }>("/uploads/presign", {
      method: "POST",
      body: JSON.stringify({ contentType, ext }),
    }),
};

/** Public URL for a stored image key (MinIO bucket is download-public in dev). */
export function imageUrl(key: string | null | undefined): string | null {
  return key ? `${import.meta.env.VITE_S3_PUBLIC_URL}/${key}` : null;
}

/** Upload a file to MinIO via a presigned PUT; returns the stored key + public URL. */
export async function uploadImage(file: File): Promise<{ key: string; publicUrl: string }> {
  const ext = file.name.split(".").pop();
  const { key, uploadUrl, publicUrl } = await api.presign(file.type || "application/octet-stream", ext);
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error(`upload failed: ${put.status}`);
  return { key, publicUrl };
}
