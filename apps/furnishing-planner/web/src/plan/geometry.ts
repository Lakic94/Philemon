import type { Point, Polygon } from "@philemon/types";

export function shoelaceCm2(poly: Polygon): number {
  let acc = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (!a || !b) continue;
    acc += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(acc) / 2;
}

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

export function pointInPolygon(pt: Point, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    const intersect =
      a[1] > pt[1] !== b[1] > pt[1] &&
      pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

export function centroid(poly: Polygon): Point {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

export interface Geo {
  floorAreaM2: number;
  perimeterM: number;
  wallAreaM2: number;
  volumeM3: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Precision level (a): floor − columns; wall = perimeter × height. */
export function computeGeometry(polygon: Polygon, columns: Polygon[], heightCm: number): Geo {
  const floorCm2 = shoelaceCm2(polygon) - columns.reduce((s, c) => s + shoelaceCm2(c), 0);
  const perimCm = perimeterCm(polygon);
  return {
    floorAreaM2: r2(floorCm2 / 10_000),
    perimeterM: r2(perimCm / 100),
    wallAreaM2: r2((perimCm * heightCm) / 10_000),
    volumeM3: r2((floorCm2 / 10_000) * (heightCm / 100)),
  };
}

export function nearestVertex(pt: Point, verts: Point[], maxDistCm: number): Point | null {
  let best: Point | null = null;
  let bestD = maxDistCm;
  for (const v of verts) {
    const d = Math.hypot(v[0] - pt[0], v[1] - pt[1]);
    if (d <= bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}
