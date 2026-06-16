import type { Polygon, RoomGeometry } from "@philemon/types";

/** Signed-area magnitude (cm²) of a simple polygon via the shoelace formula. */
export function shoelaceAreaCm2(poly: Polygon): number {
  let acc = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (!a || !b) continue;
    acc += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(acc) / 2;
}

/** Perimeter (cm) of a closed polygon. */
export function perimeterCm(poly: Polygon): number {
  let p = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (!a || !b) continue;
    p += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return p;
}

/**
 * Compute room geometry from a traced polygon (cm), interior column cut-outs,
 * and ceiling height. Floor subtracts columns. Wall = perimeter × height
 * (opening subtraction is layered on in PHI-11). Returns m² / m / m³.
 */
export function computeRoomGeometry(
  polygon: Polygon | null,
  columns: Polygon[],
  heightCm: number | null,
  officialFloorM2: number | null = null,
): RoomGeometry | null {
  const h = heightCm ?? 0;
  const traced = polygon && polygon.length >= 3;
  const tracedFloorM2 = traced
    ? (shoelaceAreaCm2(polygon!) - columns.reduce((s, c) => s + shoelaceAreaCm2(c), 0)) / 10_000
    : 0;
  const perimM = traced ? perimeterCm(polygon!) / 100 : 0;
  // Official area is authoritative for floor/volume when present.
  const floorM2 = officialFloorM2 ?? tracedFloorM2;
  if (!traced && officialFloorM2 == null) return null;
  return {
    floorAreaM2: round2(floorM2),
    perimeterM: round2(perimM),
    wallAreaM2: round2((perimM * h * 100) / 10_000), // perim(m)*h(cm) -> m²
    volumeM3: round2(floorM2 * (h / 100)),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
