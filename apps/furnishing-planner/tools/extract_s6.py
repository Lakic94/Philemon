"""
Extract apartment S6's vector geometry from the building DXF into a JSON the
web builder loads. Coordinates are real centimetres (the DWG is 1:1 cm),
translated to a local top-left origin with y increasing downward (SVG-friendly).

Layers used:
  zid       -> walls (LINE)          : backdrop + snap vertices
  STUBOVI   -> columns (closed poly) : subtracted from floor area
  STOLARIJA -> openings (doors/windows): drawn; used for wall-area subtraction

Source DXF (produced by ODA File Converter from the building .dwg):
  C:\\Users\\nlaki\\AppData\\Local\\Temp\\dwgconv\\out\\plan.dxf
Run:  py apps/furnishing-planner/tools/extract_s6.py
"""

import json
import os

import ezdxf

DXF = r"C:\Users\nlaki\AppData\Local\Temp\dwgconv\out\plan.dxf"
OUT = os.path.join(os.path.dirname(__file__), "..", "web", "src", "plan", "s6.json")

# S6 = top band of the 2nd-floor plan (DXF coordinates, cm).
BBOX = (-13990, -5760, -11955, -4470)
X0, Y0, X1, Y1 = BBOX


def inside(x, y, m=20):
    return X0 - m <= x <= X1 + m and Y0 - m <= y <= Y1 + m


def main():
    doc = ezdxf.readfile(DXF)
    msp = doc.modelspace()

    raw_walls = []  # (x1,y1,x2,y2) in DXF coords
    for e in msp.query("LINE"):
        if e.dxf.layer.lower() != "zid":
            continue
        a, b = e.dxf.start, e.dxf.end
        if inside(a.x, a.y) and inside(b.x, b.y):
            raw_walls.append((a.x, a.y, b.x, b.y))

    raw_columns = []
    for e in msp.query("LWPOLYLINE"):
        if e.dxf.layer.lower() != "stubovi" or not e.closed:
            continue
        pts = [(p[0], p[1]) for p in e.get_points()]
        if pts and all(inside(x, y) for x, y in pts):
            raw_columns.append(pts)

    raw_openings = []  # line segments on STOLARIJA
    for e in msp.query("LINE"):
        if e.dxf.layer.lower() != "stolarija":
            continue
        a, b = e.dxf.start, e.dxf.end
        if inside(a.x, a.y) and inside(b.x, b.y):
            raw_openings.append((a.x, a.y, b.x, b.y))

    # bounds from walls; translate to local origin, flip Y for screen space
    xs = [v[0] for v in raw_walls] + [v[2] for v in raw_walls]
    ys = [v[1] for v in raw_walls] + [v[3] for v in raw_walls]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    w = round(maxx - minx, 1)
    h = round(maxy - miny, 1)

    def tx(x):
        return round(x - minx, 1)

    def ty(y):
        return round(maxy - y, 1)  # flip so y grows downward

    walls = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_walls]
    columns = [[[tx(x), ty(y)] for (x, y) in poly] for poly in raw_columns]
    openings = [[tx(x1), ty(y1), tx(x2), ty(y2)] for (x1, y1, x2, y2) in raw_openings]

    # unique snap vertices (merge points within 2cm)
    verts = []
    seen = set()
    for x1, y1, x2, y2 in walls:
        for x, y in ((x1, y1), (x2, y2)):
            key = (round(x / 2), round(y / 2))
            if key not in seen:
                seen.add(key)
                verts.append([x, y])

    data = {
        "unit": "cm",
        "width": w,
        "height": h,
        "walls": walls,
        "columns": columns,
        "openings": openings,
        "vertices": verts,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"S6 vector written -> {os.path.abspath(OUT)}")
    print(f"  size: {w} x {h} cm")
    print(f"  walls: {len(walls)}  columns: {len(columns)}  openings: {len(openings)}  snap-verts: {len(verts)}")


if __name__ == "__main__":
    main()
