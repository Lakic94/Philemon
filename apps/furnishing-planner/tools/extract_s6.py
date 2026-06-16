"""
Extract apartment S6 geometry from the building DXF.

Outputs (coordinates = real centimetres, local top-left origin, y down):
  web/src/plan/s6.json          walls/columns/openings/vertices + roomOutlines (builder backdrop)
  api/src/seed_outlines.json    [{areaM2, polygon}] room outlines for the seed

Key: the POVRSINE layer carries the architect's room-outline polygons — we use
those as the real room shapes (matched to rooms by area in the seed).

Run:  py apps/furnishing-planner/tools/extract_s6.py
"""

import json
import os

import ezdxf

DXF = r"C:\Users\nlaki\AppData\Local\Temp\dwgconv\out\plan.dxf"
HERE = os.path.dirname(__file__)
OUT_WEB = os.path.join(HERE, "..", "web", "src", "plan", "s6.json")
OUT_API = os.path.join(HERE, "..", "api", "src", "seed_outlines.json")

BBOX = (-13990, -5760, -11955, -4470)
X0, Y0, X1, Y1 = BBOX


def inside(x, y, m=30):
    return X0 - m <= x <= X1 + m and Y0 - m <= y <= Y1 + m


def poly_area_cm2(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def main():
    doc = ezdxf.readfile(DXF)
    msp = doc.modelspace()

    raw_walls = []  # (x1,y1,x2,y2)
    for e in msp.query("LINE"):
        if e.dxf.layer.lower() != "zid":
            continue
        a, b = e.dxf.start, e.dxf.end
        if inside(a.x, a.y) and inside(b.x, b.y):
            raw_walls.append((a.x, a.y, b.x, b.y))
    # walls drawn as polylines — explode to segments
    for e in msp.query("LWPOLYLINE"):
        if e.dxf.layer.lower() != "zid":
            continue
        pts = [(p[0], p[1]) for p in e.get_points()]
        n = len(pts)
        rng = range(n) if e.closed else range(n - 1)
        for i in rng:
            a = pts[i]
            b = pts[(i + 1) % n]
            if inside(*a) and inside(*b):
                raw_walls.append((a[0], a[1], b[0], b[1]))

    raw_columns = []
    for e in msp.query("LWPOLYLINE"):
        if e.dxf.layer.lower() != "stubovi" or not e.closed:
            continue
        pts = [(p[0], p[1]) for p in e.get_points()]
        if pts and all(inside(x, y) for x, y in pts):
            raw_columns.append(pts)

    raw_openings = []
    for e in msp.query("LINE"):
        if e.dxf.layer.lower() != "stolarija":
            continue
        a, b = e.dxf.start, e.dxf.end
        if inside(a.x, a.y) and inside(b.x, b.y):
            raw_openings.append((a.x, a.y, b.x, b.y))

    raw_rooms = []  # (area_cm2, [(x,y),...])
    for e in msp.query("LWPOLYLINE"):
        if e.dxf.layer.upper() != "POVRSINE" or not e.closed:
            continue
        pts = [(p[0], p[1]) for p in e.get_points()]
        if not pts:
            continue
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        if not inside(cx, cy):
            continue
        area = poly_area_cm2(pts)
        if 1.5e4 <= area <= 60e4:  # 1.5–60 m²; excludes the whole-flat outline
            raw_rooms.append((area, pts))

    xs = [v[0] for v in raw_walls] + [v[2] for v in raw_walls]
    ys = [v[1] for v in raw_walls] + [v[3] for v in raw_walls]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)

    def tx(x):
        return round(x - minx, 1)

    def ty(y):
        return round(maxy - y, 1)

    walls = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_walls]
    columns = [[[tx(x), ty(y)] for (x, y) in poly] for poly in raw_columns]
    openings = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_openings]
    room_outlines = [
        {"areaM2": round(area / 1e4, 2), "polygon": [[tx(x), ty(y)] for (x, y) in pts]}
        for (area, pts) in sorted(raw_rooms, key=lambda r: -r[0])
    ]

    verts = []
    seen = set()
    for x1, y1, x2, y2 in walls:
        for x, y in ((x1, y1), (x2, y2)):
            key = (round(x / 2), round(y / 2))
            if key not in seen:
                seen.add(key)
                verts.append([x, y])

    web = {
        "unit": "cm",
        "width": round(maxx - minx, 1),
        "height": round(maxy - miny, 1),
        "walls": walls,
        "columns": columns,
        "openings": openings,
        "vertices": verts,
        "roomOutlines": room_outlines,
    }
    os.makedirs(os.path.dirname(OUT_WEB), exist_ok=True)
    with open(OUT_WEB, "w", encoding="utf-8") as f:
        json.dump(web, f, separators=(",", ":"))
    os.makedirs(os.path.dirname(OUT_API), exist_ok=True)
    with open(OUT_API, "w", encoding="utf-8") as f:
        json.dump(room_outlines, f, separators=(",", ":"))

    print(f"web -> {os.path.abspath(OUT_WEB)}")
    print(f"api -> {os.path.abspath(OUT_API)}")
    print(f"  walls: {len(walls)}  columns: {len(columns)}  openings: {len(openings)}  room outlines: {len(room_outlines)}")
    print("  room outline areas (m²):", [r["areaM2"] for r in room_outlines])


if __name__ == "__main__":
    main()
