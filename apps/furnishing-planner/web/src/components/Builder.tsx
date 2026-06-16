import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Field, KeyValue, Kicker, Select, Stack } from "@philemon/ui";
import type { Point, Polygon } from "@philemon/types";
import { api } from "../api.js";
import type { DataState } from "../data.js";
import planRaw from "../plan/s6.json";
import { centroid, distToSegment, nearestVertex, perimeterCm, shoelaceCm2 } from "../plan/geometry.js";

const PLAN = planRaw as {
  width: number;
  height: number;
  walls: number[][];
  columns: number[][][];
  openings: number[][];
  vertices: number[][];
};
const COLS: Polygon[] = PLAN.columns.map((poly) => poly.map((p) => [p[0]!, p[1]!] as Point));
const PAD = 40;
const HIDDEN_KEY = "philemon.s6.hiddenWalls";

export function Builder({ data }: { data: DataState }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<[number, number, number, number]>([-PAD, -PAD, PLAN.width + 2 * PAD, PLAN.height + 2 * PAD]);
  const [mode, setMode] = useState<"idle" | "tracing" | "trim">("idle");
  const [points, setPoints] = useState<Point[]>([]);
  const [hover, setHover] = useState<Point | null>(null);
  const [closed, setClosed] = useState<Polygon | null>(null);
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
  const snapVerts = useMemo(() => {
    const seen = new Set<string>();
    const out: Point[] = [];
    for (const { w } of visibleWalls) {
      for (const v of [[w[0]!, w[1]!] as Point, [w[2]!, w[3]!] as Point]) {
        const k = `${Math.round(v[0] / 2)},${Math.round(v[1] / 2)}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push(v);
        }
      }
    }
    return out;
  }, [visibleWalls]);

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
    return nearestVertex(pt, snapVerts, 14 * sw()) ?? pt;
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
    const panning = e.button === 1 || e.button === 2 || (e.button === 0 && mode === "idle");
    if (panning) {
      pan.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
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
    setMode("idle");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (mode !== "tracing") return;
      if (e.key === "Escape") reset();
      if (e.key === "Backspace") setPoints((ps) => ps.slice(0, -1));
      if (e.key === "Enter") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, points]);

  const livePoly: Polygon = closed ?? (hover && mode === "tracing" ? [...points, hover] : points);
  const tracedFloorM2 = livePoly.length >= 3 ? shoelaceCm2(livePoly) / 10_000 : 0;
  const tracedPerimM = livePoly.length >= 3 ? perimeterCm(livePoly) / 100 : 0;
  const wallM2 = tracedPerimM * ((Number(heightCm) || 0) / 100);

  async function save() {
    if (!closed || !roomId) return;
    setSaving(true);
    try {
      const cols = COLS.filter((c) => {
        const ctr = centroid(c);
        // include columns inside the traced polygon
        let inside = false;
        for (let i = 0, j = closed.length - 1; i < closed.length; j = i++) {
          const a = closed[i]!;
          const b = closed[j]!;
          if (a[1] > ctr[1] !== b[1] > ctr[1] && ctr[0] < ((b[0] - a[0]) * (ctr[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
        }
        return inside;
      });
      await api.updateRoom(roomId, { polygon: closed, columns: cols, heightCm: Number(heightCm) || null });
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
          {/* columns */}
          {COLS.map((c, i) => (
            <polygon key={`c${i}`} points={c.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="#3a3d45" stroke="#52555f" strokeWidth={s} />
          ))}
          {/* openings (doors/windows) */}
          {PLAN.openings.map((o, i) => (
            <line key={`o${i}`} x1={o[0]} y1={o[1]} x2={o[2]} y2={o[3]} stroke="#6bbf85" strokeWidth={2.5 * s} />
          ))}
          {/* walls (visible only) */}
          {visibleWalls.map(({ w, i }) => (
            <line key={`w${i}`} x1={w[0]} y1={w[1]} x2={w[2]} y2={w[3]} stroke={mode === "trim" ? "#c2c7d0" : "#9aa0aa"} strokeWidth={(mode === "trim" ? 3.5 : 2.5) * s} strokeLinecap="round" />
          ))}

          {/* saved rooms */}
          {mode === "idle" &&
            data.tree.map((r) => {
              const poly = r.polygon;
              if (!poly || poly.length < 3) return null;
              const c = centroid(poly as Polygon);
              const sel = r.id === roomId;
              return (
                <g key={r.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setRoomId(r.id); }}>
                  <polygon points={poly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={sel ? "rgba(110,168,254,0.22)" : "rgba(110,168,254,0.08)"} stroke="var(--ph-accent)" strokeWidth={(sel ? 2.5 : 1.5) * s} />
                  <text x={c[0]} y={c[1]} fill="var(--ph-text)" fontSize={13 * s} textAnchor="middle" style={{ fontFamily: "var(--ph-font-mono)", pointerEvents: "none" }}>{r.name}</text>
                </g>
              );
            })}

          {/* snap vertices while tracing */}
          {mode === "tracing" && snapVerts.map((v, i) => <circle key={`v${i}`} cx={v[0]} cy={v[1]} r={2.5 * s} fill="#34373f" />)}

          {/* live trace */}
          {livePoly.length >= 2 && (
            <polyline points={livePoly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={closed ? "rgba(110,168,254,0.22)" : "none"} stroke="var(--ph-accent)" strokeWidth={2.5 * s} />
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
            <Field label="Save to room">
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {data.tree.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}{r.polygon ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ceiling height (cm)">
              <input className="ph-input ph-input--mono" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>

            {mode === "idle" && !closed && (
              <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                <Button variant="primary" onClick={() => { setPoints([]); setClosed(null); setMode("tracing"); }}>Trace room</Button>
                <Button variant="outline" onClick={() => setMode("trim")}>Trim walls</Button>
              </div>
            )}
            {mode === "tracing" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click the room&apos;s inner corners (snaps to wall vertices). First point / Enter to close · Backspace undo · Esc cancel · scroll to zoom.
                </p>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </>
            )}
            {mode === "trim" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click any wall segment that isn&apos;t part of your apartment to remove it. Zoom in for accuracy.
                </p>
                <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                  <Button variant="ghost" size="sm" onClick={() => persistHidden(new Set())}>Restore all</Button>
                  <Button variant="primary" size="sm" onClick={() => setMode("idle")}>Done ({hidden.size} hidden)</Button>
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
              Exact 1:1 cm — no calibration. Floor uses the architect&apos;s official number; trace to get wall area for paint.
            </p>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
