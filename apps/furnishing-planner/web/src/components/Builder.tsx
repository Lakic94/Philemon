import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Field, KeyValue, Kicker, Select, Stack } from "@philemon/ui";
import type { Point, Polygon } from "@philemon/types";
import { api } from "../api.js";
import type { DataState } from "../data.js";
import planRaw from "../plan/s6.json";
import { areaCentroid, centroid, distToSegment, nearestVertex, perimeterCm, shoelaceCm2 } from "../plan/geometry.js";

const PLAN = planRaw as {
  width: number;
  height: number;
  walls: number[][];
  columns: number[][][];
  openings: number[][];
  vertices: number[][];
};
const COLS: Polygon[] = PLAN.columns.map((poly) => poly.map((p) => [p[0]!, p[1]!] as Point));
const SNAP_VERTS: Point[] = PLAN.vertices.map((v) => [v[0]!, v[1]!]); // wall + room corners
const PAD = 40;
const HIDDEN_KEY = "philemon.s6.hiddenWalls";

type Mode = "idle" | "tracing" | "trim" | "editing";

export function Builder({ data }: { data: DataState }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<[number, number, number, number]>([-PAD, -PAD, PLAN.width + 2 * PAD, PLAN.height + 2 * PAD]);
  const [mode, setMode] = useState<Mode>("idle");
  const [points, setPoints] = useState<Point[]>([]);
  const [hover, setHover] = useState<Point | null>(null);
  const [closed, setClosed] = useState<Polygon | null>(null);
  const [editPoly, setEditPoly] = useState<Polygon | null>(null);
  const [selVert, setSelVert] = useState<number | null>(null);
  const [dragVert, setDragVert] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(() => {
    try {
      return new Set<number>(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });
  const [roomId, setRoomId] = useState<string>(data.tree[0]?.id ?? "");
  const [heightCm, setHeightCm] = useState("265");
  const [saving, setSaving] = useState(false);
  const pan = useRef<{ x: number; y: number } | null>(null);

  const room = data.tree.find((r) => r.id === roomId);

  const visibleWalls = useMemo(() => PLAN.walls.map((w, i) => ({ w, i })).filter(({ i }) => !hidden.has(i)), [hidden]);
  // snap to wall+room corners plus every saved room's vertices
  const snapVerts = useMemo(() => {
    const out = [...SNAP_VERTS];
    for (const r of data.tree) if (r.polygon) for (const p of r.polygon) out.push(p as Point);
    return out;
  }, [data.tree]);

  const sw = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect ? vb[2] / rect.width : 1;
  };
  function toCm(e: { clientX: number; clientY: number }): Point {
    const svg = svgRef.current!;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const m = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return [m.x, m.y];
  }
  function snap(pt: Point): Point {
    return nearestVertex(pt, snapVerts, 16 * sw()) ?? pt;
  }
  function fit() {
    setVb([-PAD, -PAD, PLAN.width + 2 * PAD, PLAN.height + 2 * PAD]);
  }
  function zoom(factor: number, center?: Point) {
    setVb(([x, y, w, h]) => {
      const c = center ?? [x + w / 2, y + h / 2];
      return [c[0] - (c[0] - x) * factor, c[1] - (c[1] - y) * factor, w * factor, h * factor];
    });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.85 : 1 / 0.85, toCm(e));
  }
  function onPointerDown(e: React.PointerEvent) {
    const panning = e.button === 1 || e.button === 2 || (e.button === 0 && (mode === "idle" || mode === "editing"));
    if (panning) {
      pan.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragVert !== null && editPoly) {
      const sp = snap(toCm(e));
      setEditPoly((poly) => poly!.map((p, i) => (i === dragVert ? sp : p)));
      return;
    }
    if (pan.current) {
      const k = sw();
      const dx = (e.clientX - pan.current.x) * k;
      const dy = (e.clientY - pan.current.y) * k;
      pan.current = { x: e.clientX, y: e.clientY };
      setVb(([x, y, w, h]) => [x - dx, y - dy, w, h]);
      return;
    }
    if (mode === "tracing") setHover(snap(toCm(e)));
  }
  function onPointerUp(e: React.PointerEvent) {
    pan.current = null;
    setDragVert(null);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }
  function persistHidden(next: Set<number>) {
    setHidden(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
  }
  function onClick(e: React.MouseEvent) {
    const pt = toCm(e);
    if (mode === "trim") {
      const thr = 12 * sw();
      let best = -1;
      let bestD = thr;
      for (const { w, i } of visibleWalls) {
        const d = distToSegment(pt, [w[0]!, w[1]!], [w[2]!, w[3]!]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) {
        const next = new Set(hidden);
        next.add(best);
        persistHidden(next);
      }
      return;
    }
    if (mode !== "tracing") return;
    const sp = snap(pt);
    if (points.length >= 3) {
      const first = points[0]!;
      if (Math.hypot(sp[0] - first[0], sp[1] - first[1]) <= 18 * sw()) {
        finish();
        return;
      }
    }
    setPoints((ps) => [...ps, sp]);
  }
  function finish() {
    if (points.length >= 3) {
      setClosed(points);
      setMode("idle");
      setHover(null);
    }
  }
  function reset() {
    setPoints([]);
    setClosed(null);
    setHover(null);
    setEditPoly(null);
    setSelVert(null);
    setMode("idle");
  }

  function startEdit() {
    if (!room?.polygon) return;
    setEditPoly(room.polygon.map((p) => [p[0], p[1]] as Point));
    setSelVert(null);
    setMode("editing");
  }
  function deleteSelected() {
    if (selVert === null || !editPoly || editPoly.length <= 3) return;
    setEditPoly(editPoly.filter((_, i) => i !== selVert));
    setSelVert(null);
  }
  async function saveEdit() {
    if (!editPoly || !roomId) return;
    setSaving(true);
    try {
      await api.updateRoom(roomId, { polygon: editPoly });
      await data.reload();
      reset();
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (mode === "tracing") {
        if (e.key === "Escape") reset();
        if (e.key === "Backspace") setPoints((ps) => ps.slice(0, -1));
        if (e.key === "Enter") finish();
      } else if (mode === "editing") {
        if (e.key === "Escape") reset();
        if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, points, editPoly, selVert]);

  const livePoly: Polygon = closed ?? (hover && mode === "tracing" ? [...points, hover] : points);
  const tracedFloorM2 = livePoly.length >= 3 ? shoelaceCm2(livePoly) / 10_000 : 0;
  const tracedPerimM = livePoly.length >= 3 ? perimeterCm(livePoly) / 100 : 0;
  const wallM2 = tracedPerimM * ((Number(heightCm) || 0) / 100);

  async function save() {
    if (!closed || !roomId) return;
    setSaving(true);
    try {
      await api.updateRoom(roomId, { polygon: closed, columns: [], heightCm: Number(heightCm) || null });
      await data.reload();
      reset();
    } finally {
      setSaving(false);
    }
  }

  const s = sw();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--ph-space-5)", alignItems: "start" }}>
      <Card style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={vb.join(" ")}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "74vh", display: "block", background: "var(--ph-bg)", cursor: mode === "idle" ? "grab" : "crosshair", touchAction: "none" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onClick}
          onDoubleClick={finish}
          onContextMenu={(e) => e.preventDefault()}
        >
          {COLS.map((c, i) => (
            <polygon key={`c${i}`} points={c.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="#3a3d45" stroke="#52555f" strokeWidth={s} />
          ))}
          {PLAN.openings.map((o, i) => (
            <line key={`o${i}`} x1={o[0]} y1={o[1]} x2={o[2]} y2={o[3]} stroke="#8a8f98" strokeWidth={2.5 * s} />
          ))}
          {visibleWalls.map(({ w, i }) => (
            <line key={`w${i}`} x1={w[0]} y1={w[1]} x2={w[2]} y2={w[3]} stroke={mode === "trim" ? "#c2c7d0" : "#9aa0aa"} strokeWidth={(mode === "trim" ? 3.5 : 2.5) * s} strokeLinecap="round" />
          ))}

          {/* saved rooms: subtle outlines; highlight only when selected; the room
              being traced/edited is hidden so the new shape replaces it */}
          {data.tree.map((r) => {
            const poly = r.polygon;
            if (!poly || poly.length < 3) return null;
            const active = mode === "tracing" || mode === "editing" || closed !== null;
            if (r.id === roomId && active) return null;
            const c = areaCentroid(poly as Polygon);
            const sel = r.id === roomId && !active;
            return (
              <g key={r.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setRoomId(r.id); }}>
                <polygon
                  points={poly.map((p) => `${p[0]},${p[1]}`).join(" ")}
                  fill={sel ? "rgba(255,255,255,0.12)" : "transparent"}
                  stroke={sel ? "var(--ph-accent)" : "#5b6270"}
                  strokeWidth={(sel ? 2.5 : 1.2) * s}
                />
                <text x={c[0]} y={c[1]} fill={sel ? "var(--ph-text)" : "var(--ph-muted)"} fontSize={9 * s} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--ph-font-mono)", pointerEvents: "none" }}>{r.name}</text>
              </g>
            );
          })}

          {/* edit mode: the room's polygon + draggable handles */}
          {mode === "editing" && editPoly && (
            <>
              <polygon points={editPoly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="rgba(255,255,255,0.10)" stroke="var(--ph-accent)" strokeWidth={2.5 * s} />
              {editPoly.map((p, i) => (
                <circle
                  key={`h${i}`}
                  cx={p[0]}
                  cy={p[1]}
                  r={(i === selVert ? 8 : 6) * s}
                  fill={i === selVert ? "#ffffff" : "#a1a1aa"}
                  stroke="#fff"
                  strokeWidth={1.5 * s}
                  style={{ cursor: "move" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragVert(i);
                    setSelVert(i);
                    svgRef.current?.setPointerCapture(e.pointerId);
                  }}
                />
              ))}
            </>
          )}

          {mode === "tracing" && snapVerts.map((v, i) => <circle key={`v${i}`} cx={v[0]} cy={v[1]} r={2 * s} fill="#34373f" />)}
          {livePoly.length >= 2 && (
            <polyline points={livePoly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={closed ? "rgba(255,255,255,0.14)" : "none"} stroke="var(--ph-accent)" strokeWidth={2.5 * s} />
          )}
          {points.map((p, i) => <circle key={`p${i}`} cx={p[0]} cy={p[1]} r={(i === 0 ? 5 : 3.5) * s} fill="var(--ph-accent)" />)}
          {hover && mode === "tracing" && <circle cx={hover[0]} cy={hover[1]} r={6 * s} fill="none" stroke="var(--ph-accent)" strokeWidth={1.5 * s} />}
        </svg>

        <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", gap: 6 }}>
          <Button size="sm" variant="outline" onClick={() => zoom(1 / 1.25)}>＋</Button>
          <Button size="sm" variant="outline" onClick={() => zoom(1.25)}>－</Button>
          <Button size="sm" variant="outline" onClick={fit}>Fit</Button>
        </div>
      </Card>

      <Stack>
        <Card>
          <Stack>
            <Kicker>Builder</Kicker>
            <Field label="Room">
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {data.tree.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}{r.polygon ? " ✓" : ""}</option>
                ))}
              </Select>
            </Field>
            <Field label="Ceiling height (cm)">
              <input className="ph-input ph-input--mono" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>

            {mode === "idle" && !closed && (
              <>
                <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                  <Button variant="primary" onClick={() => { setPoints([]); setClosed(null); setMode("tracing"); }}>Trace room</Button>
                  {room?.polygon && <Button variant="outline" onClick={startEdit}>Edit shape</Button>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMode("trim")}>Trim walls</Button>
              </>
            )}
            {mode === "tracing" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click inner corners (snaps to wall/room corners). First point / Enter to close · Backspace undo · Esc cancel.
                </p>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </>
            )}
            {mode === "editing" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Drag corners to move (snaps). Click a corner then Delete to remove it — that&apos;s how you take out the notch wall. Zoom in for accuracy.
                </p>
                <div className="ph-row" style={{ gap: "var(--ph-space-2)", flexWrap: "wrap" }}>
                  <Button variant="outline" size="sm" onClick={deleteSelected} disabled={selVert === null}>Delete point</Button>
                  <Button variant="primary" size="sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save shape"}</Button>
                  <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
                </div>
              </>
            )}
            {mode === "trim" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>Click wall segments that aren&apos;t part of your apartment to remove them.</p>
                <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                  <Button variant="ghost" size="sm" onClick={() => persistHidden(new Set())}>Restore all</Button>
                  <Button variant="primary" size="sm" onClick={() => setMode("idle")}>Done ({hidden.size})</Button>
                </div>
              </>
            )}
            {closed && (
              <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                <Button variant="primary" onClick={save} disabled={saving || !roomId}>{saving ? "Saving…" : "Save to room"}</Button>
                <Button variant="ghost" onClick={reset}>Discard</Button>
              </div>
            )}
          </Stack>
        </Card>

        <Card>
          <Stack>
            <Kicker>Geometry</Kicker>
            <KeyValue
              rows={[
                { k: "Floor (official)", v: room?.floorAreaM2 != null ? `${room.floorAreaM2} m²` : "—" },
                { k: "Floor (traced)", v: tracedFloorM2 ? `${tracedFloorM2.toFixed(2)} m²` : "—" },
                { k: "Perimeter", v: tracedPerimM ? `${tracedPerimM.toFixed(2)} m` : "—" },
                { k: "Walls", v: wallM2 ? `${wallM2.toFixed(2)} m²` : "—" },
              ]}
            />
            <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
              Exact 1:1 cm. Floor uses the architect&apos;s official number; trace/edit shapes for wall area.
            </p>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
