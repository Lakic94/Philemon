import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, formatEuro, Field, KeyValue, Kicker, Select, Stack } from "@philemon/ui";
import type { Point, Polygon } from "@philemon/types";
import { api } from "../api.js";
import type { DataState } from "../data.js";
import planRaw from "../plan/s6.json";
import { centroid, computeGeometry, nearestVertex, pointInPolygon } from "../plan/geometry.js";

const PLAN = planRaw as {
  width: number;
  height: number;
  walls: number[][];
  columns: number[][][];
  openings: number[][];
  vertices: number[][];
};
const VERTS: Point[] = PLAN.vertices.map((v) => [v[0]!, v[1]!]);
const COLS: Polygon[] = PLAN.columns.map((poly) => poly.map((p) => [p[0]!, p[1]!] as Point));
const PAD = 40;

export function Builder({ data }: { data: DataState }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<[number, number, number, number]>([
    -PAD,
    -PAD,
    PLAN.width + 2 * PAD,
    PLAN.height + 2 * PAD,
  ]);
  const [tracing, setTracing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hover, setHover] = useState<Point | null>(null);
  const [closed, setClosed] = useState<Polygon | null>(null);
  const [roomId, setRoomId] = useState<string>(data.tree[0]?.id ?? "");
  const [heightCm, setHeightCm] = useState("265");
  const [saving, setSaving] = useState(false);
  const pan = useRef<{ x: number; y: number } | null>(null);

  // cm-per-pixel for thresholds/pan
  const cmPerPx = () => {
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
    const v = nearestVertex(pt, VERTS, 14 * cmPerPx());
    return v ?? pt;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const f = e.deltaY < 0 ? 0.85 : 1 / 0.85;
    const m = toCm(e);
    setVb(([x, y, w, h]) => [m[0] - (m[0] - x) * f, m[1] - (m[1] - y) * f, w * f, h * f]);
  }

  function onPointerDown(e: React.PointerEvent) {
    // Pan with middle/right button, or plain left-drag when not tracing.
    const panning = e.button === 1 || e.button === 2 || (e.button === 0 && !tracing);
    if (panning) {
      pan.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pan.current) {
      const k = cmPerPx();
      const dx = (e.clientX - pan.current.x) * k;
      const dy = (e.clientY - pan.current.y) * k;
      pan.current = { x: e.clientX, y: e.clientY };
      setVb(([x, y, w, h]) => [x - dx, y - dy, w, h]);
      return;
    }
    if (tracing) setHover(snap(toCm(e)));
  }

  function onPointerUp(e: React.PointerEvent) {
    pan.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  function onClick(e: React.MouseEvent) {
    if (!tracing) return;
    const pt = snap(toCm(e));
    if (points.length >= 3) {
      const first = points[0]!;
      if (Math.hypot(pt[0] - first[0], pt[1] - first[1]) <= 16 * cmPerPx()) {
        finish();
        return;
      }
    }
    setPoints((ps) => [...ps, pt]);
  }

  function finish() {
    if (points.length >= 3) {
      setClosed(points);
      setTracing(false);
      setHover(null);
    }
  }

  function reset() {
    setPoints([]);
    setClosed(null);
    setHover(null);
    setTracing(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!tracing) return;
      if (e.key === "Escape") reset();
      if (e.key === "Backspace") setPoints((ps) => ps.slice(0, -1));
      if (e.key === "Enter") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracing, points]);

  // live polygon = closed, else in-progress points (+ hover preview)
  const livePoly: Polygon =
    closed ?? (hover && tracing ? [...points, hover] : points);
  const colsInside = useMemo(
    () => (livePoly.length >= 3 ? COLS.filter((c) => pointInPolygon(centroid(c), livePoly)) : []),
    [livePoly],
  );
  const geo = livePoly.length >= 3 ? computeGeometry(livePoly, colsInside, Number(heightCm) || 0) : null;

  async function save() {
    if (!closed || !roomId) return;
    setSaving(true);
    try {
      await api.updateRoom(roomId, {
        polygon: closed,
        columns: colsInside,
        heightCm: Number(heightCm) || null,
      });
      await data.reload();
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--ph-space-5)", alignItems: "start" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <svg
          ref={svgRef}
          viewBox={vb.join(" ")}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "72vh", display: "block", background: "var(--ph-bg)", cursor: tracing ? "crosshair" : "grab", touchAction: "none" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onClick}
          onDoubleClick={finish}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* all saved room polygons (labeled, click to select) */}
          {!tracing &&
            data.tree.map((r) => {
              const poly = r.polygon;
              if (!poly || poly.length < 3) return null;
              const c = centroid(poly as Polygon);
              const sel = r.id === roomId;
              return (
                <g key={r.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setRoomId(r.id); }}>
                  <polygon
                    points={poly.map((p) => `${p[0]},${p[1]}`).join(" ")}
                    fill={sel ? "rgba(110,168,254,0.18)" : "rgba(110,168,254,0.06)"}
                    stroke="var(--ph-accent)"
                    strokeWidth={(sel ? 2.5 : 1.5) * cmPerPx()}
                  />
                  <text x={c[0]} y={c[1]} fill="var(--ph-text)" fontSize={13 * cmPerPx()} textAnchor="middle" style={{ fontFamily: "var(--ph-font-mono)", pointerEvents: "none" }}>
                    {r.name}
                  </text>
                </g>
              );
            })}
          {/* walls */}
          {PLAN.walls.map((w, i) => (
            <line key={`w${i}`} x1={w[0]} y1={w[1]} x2={w[2]} y2={w[3]} stroke="#6a6e78" strokeWidth={2 * cmPerPx()} />
          ))}
          {/* columns */}
          {COLS.map((c, i) => (
            <polygon key={`c${i}`} points={c.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="#3a3d45" stroke="#52555f" strokeWidth={cmPerPx()} />
          ))}
          {/* openings (doors/windows) */}
          {PLAN.openings.map((o, i) => (
            <line key={`o${i}`} x1={o[0]} y1={o[1]} x2={o[2]} y2={o[3]} stroke="#6bbf85" strokeWidth={2 * cmPerPx()} />
          ))}
          {/* snap vertices while tracing */}
          {tracing &&
            VERTS.map((v, i) => (
              <circle key={`v${i}`} cx={v[0]} cy={v[1]} r={2.5 * cmPerPx()} fill="#34373f" />
            ))}
          {/* live polygon */}
          {livePoly.length >= 2 && (
            <polyline
              points={livePoly.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={closed ? "rgba(110,168,254,0.18)" : "none"}
              stroke="var(--ph-accent)"
              strokeWidth={2.5 * cmPerPx()}
            />
          )}
          {points.map((p, i) => (
            <circle key={`p${i}`} cx={p[0]} cy={p[1]} r={(i === 0 ? 5 : 3.5) * cmPerPx()} fill="var(--ph-accent)" />
          ))}
          {hover && tracing && <circle cx={hover[0]} cy={hover[1]} r={6 * cmPerPx()} fill="none" stroke="var(--ph-accent)" strokeWidth={1.5 * cmPerPx()} />}
        </svg>
      </Card>

      <Stack>
        <Card>
          <Stack>
            <Kicker>Builder</Kicker>
            <Field label="Save to room">
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {data.tree.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.polygon ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ceiling height (cm)">
              <input className="ph-input ph-input--mono" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>

            {!tracing && !closed && (
              <Button variant="primary" onClick={() => { setPoints([]); setClosed(null); setTracing(true); }}>
                Trace room
              </Button>
            )}
            {tracing && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click wall corners (snaps to vertices). Click the first point or press Enter to close · Backspace undo · Esc cancel.
                </p>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </>
            )}
            {closed && (
              <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                <Button variant="primary" onClick={save} disabled={saving || !roomId}>
                  {saving ? "Saving…" : "Save to room"}
                </Button>
                <Button variant="ghost" onClick={reset}>Discard</Button>
              </div>
            )}
          </Stack>
        </Card>

        <Card>
          <Stack>
            <Kicker>Live geometry</Kicker>
            {geo ? (
              <KeyValue
                rows={[
                  { k: "Floor", v: `${geo.floorAreaM2} m²` },
                  { k: "Walls", v: `${geo.wallAreaM2} m²` },
                  { k: "Perimeter", v: `${geo.perimeterM} m` },
                  { k: "Volume", v: `${geo.volumeM3} m³` },
                  { k: "Columns", v: `${colsInside.length} cut out` },
                ]}
              />
            ) : (
              <p className="ph-muted" style={{ fontSize: "var(--ph-text-sm)" }}>
                Trace at least 3 corners to see live area.
              </p>
            )}
            <p className="ph-muted ph-mono" style={{ fontSize: "var(--ph-text-xs)" }}>
              Scroll to zoom · drag to pan · plan is real cm (S6 = {(PLAN.width / 100).toFixed(2)} m wide)
            </p>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
