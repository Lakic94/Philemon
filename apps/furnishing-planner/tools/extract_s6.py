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
    W = round(maxx - minx, 1)
    H = round(maxy - miny, 1)

    def tx(x):
        return round(x - minx, 1)

    def ty(y):
        return round(maxy - y, 1)

    walls = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_walls]
    columns = [[[tx(x), ty(y)] for (x, y) in poly] for poly in raw_columns]
    openings = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_openings]
    room_outlines = []
    for area, pts in sorted(raw_rooms, key=lambda r: -r[0]):
        poly = [[tx(x), ty(y)] for (x, y) in pts]
        cx = round(sum(p[0] for p in poly) / len(poly), 1)
        cy = round(sum(p[1] for p in poly) / len(poly), 1)
        room_outlines.append({"areaM2": round(area / 1e4, 2), "polygon": poly, "cx": cx, "cy": cy})

    # Identify S6's real rooms (mirror the seed matcher) and crop everything to
    # the apartment's bounds — removes neighbour walls outside the unit.
    OFFICIAL = [
        (9.32, None), (4.15, None), (18.97, None), (11.47, None), (13.24, None),
        (5.17, None), (3.89, None), (5.27, "TR"), (2.47, "TL"),
    ]

    def quad(o, pos):
        left = o["cx"] < W * 0.45
        right = o["cx"] > W * 0.55
        top = o["cy"] < H * 0.5
        return (right and top) if pos == "TR" else (left and top)

    used = set()
    matched = []
    for area, pos in OFFICIAL:
        if not pos:
            continue
        cs = sorted((abs(o["areaM2"] - area), i) for i, o in enumerate(room_outlines)
                    if i not in used and abs(o["areaM2"] - area) <= 1.5 and quad(o, pos))
        if cs:
            used.add(cs[0][1])
            matched.append(cs[0][1])
    pairs = []
    for area, pos in OFFICIAL:
        if pos:
            continue
        for i, o in enumerate(room_outlines):
            if i not in used:
                pairs.append((abs(o["areaM2"] - area), area, i))
    pairs.sort()
    used_area = set()
    for d, area, i in pairs:
        if area in used_area or i in used or d > 1.5:
            continue
        used_area.add(area)
        used.add(i)
        matched.append(i)
    matched_outlines = [room_outlines[i] for i in matched]

    axs = [p[0] for o in matched_outlines for p in o["polygon"]]
    ays = [p[1] for o in matched_outlines for p in o["polygon"]]
    M = 50  # cm margin to keep exterior wall faces
    ax0, ax1 = min(axs) - M, max(axs) + M
    ay0, ay1 = min(ays) - M, max(ays) + M

    def in_apt(x, y):
        return ax0 <= x <= ax1 and ay0 <= y <= ay1

    walls = [w for w in walls if in_apt((w[0] + w[2]) / 2, (w[1] + w[3]) / 2)]
    columns = [c for c in columns if in_apt(sum(p[0] for p in c) / len(c), sum(p[1] for p in c) / len(c))]
    openings = [o for o in openings if in_apt((o[0] + o[2]) / 2, (o[1] + o[3]) / 2)]
    room_outlines = matched_outlines  # only the 9 real S6 rooms

    # Plan size = the rooms' extent (the real usable area, content starts ~0,0)
    # + a small margin for exterior wall faces. Ignores stray wall stubs so the
    # canvas isn't padded with empty space.
    rx = [p[0] for o in room_outlines for p in o["polygon"]]
    ry = [p[1] for o in room_outlines for p in o["polygon"]]
    OW = round(max(rx) + 40, 1)
    OH = round(max(ry) + 40, 1)

    verts = []
    seen = set()
    def add_vert(x, y):
        key = (round(x / 2), round(y / 2))
        if key not in seen:
            seen.add(key)
            verts.append([x, y])
    for x1, y1, x2, y2 in walls:
        add_vert(x1, y1)
        add_vert(x2, y2)
    # also snap to exact room corners (POVRSINE), even where wall lines are missing
    for ro in room_outlines:
        for p in ro["polygon"]:
            add_vert(p[0], p[1])

    web = {
        "unit": "cm",
        "width": OW,
        "height": OH,
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
        json.dump({"width": web["width"], "height": web["height"], "outlines": room_outlines}, f, separators=(",", ":"))

    print(f"web -> {os.path.abspath(OUT_WEB)}")
    print(f"api -> {os.path.abspath(OUT_API)}")
    print(f"  walls: {len(walls)}  columns: {len(columns)}  openings: {len(openings)}  room outlines: {len(room_outlines)}")
    print("  room outline areas (m²):", [r["areaM2"] for r in room_outlines])


if __name__ == "__main__":
    main()
