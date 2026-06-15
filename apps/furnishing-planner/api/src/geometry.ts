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
): RoomGeometry | null {
  if (!polygon || polygon.length < 3) return null;
  const floorCm2 = shoelaceAreaCm2(polygon) - columns.reduce((s, c) => s + shoelaceAreaCm2(c), 0);
  const perimCm = perimeterCm(polygon);
  const h = heightCm ?? 0;
  const wallCm2 = perimCm * h;
  return {
    floorAreaM2: round2(floorCm2 / 10_000),
    perimeterM: round2(perimCm / 100),
    wallAreaM2: round2(wallCm2 / 10_000),
    volumeM3: round2((floorCm2 / 10_000) * (h / 100)),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
