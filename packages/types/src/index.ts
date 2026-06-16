// Shared domain types for the Philemon platform.

// ---- Furnishing Planner domain ----

export type ItemStatus = "needed" | "ordered" | "bought";
export const ITEM_STATUSES: ItemStatus[] = ["needed", "ordered", "bought"];

export type ItemKind = "flat" | "area";

/** A 2D point in centimetres (floor-plan coordinate space). */
export type Point = [number, number];

/** A simple polygon: an ordered ring of points (cm). */
export type Polygon = Point[];

export interface Category {
  id: string;
  name: string;
  /** false for the seeded defaults that shouldn't be deleted, true for user-added. */
  userCreated: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  /** Traced outline in cm; null until drawn in the builder. */
  polygon: Polygon | null;
  /** Interior cut-outs (columns/pillars) subtracted from floor area. */
  columns: Polygon[];
  /** Ceiling height in cm (for wall-area math). */
  heightCm: number | null;
  /** Official floor area in m² (e.g. from the architect's schedule); authoritative when set. */
  floorAreaM2: number | null;
  /** Room-level reference images (MinIO object keys). */
  imageKeys: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  roomId: string;
  name: string;
  /** Budget target in EUR cents. */
  budgetTargetCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Surface {
  id: string;
  roomId: string;
  name: string;
  /** Area in m² (typed, or derived from a wall edge × height). */
  areaM2: number;
  createdAt: string;
}

export interface Item {
  id: string;
  zoneId: string;
  name: string;
  categoryId: string | null;
  quantity: number;
  kind: ItemKind;
  /** Estimated cost in EUR cents (flat kind). */
  estimatedCents: number;
  /** Actual cost paid in EUR cents; null until known. */
  actualCents: number | null;
  status: ItemStatus;
  // area-item fields (kind === "area")
  areaM2: number | null;
  ratePerM2Cents: number | null;
  surfaceId: string | null;
  // metadata
  imageKeys: string[];
  productUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Computed geometry returned by the API / builder. */
export interface RoomGeometry {
  floorAreaM2: number;
  perimeterM: number;
  wallAreaM2: number;
  volumeM3: number;
}
