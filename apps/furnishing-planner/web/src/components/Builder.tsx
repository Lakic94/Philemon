import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Field, KeyValue, Kicker, Select, Stack } from "@philemon/ui";
import type { Point, Polygon } from "@philemon/types";
import { api } from "../api.js";
import type { DataState } from "../data.js";
import s6png from "../plan/s6.png";
import { centroid, perimeterCm, shoelaceCm2 } from "../plan/geometry.js";

// Natural pixel size of the rendered S6 plan image.
const IMG_W = 2820;
const IMG_H = 1820;
const PAD = 60;
const CAL_KEY = "philemon.s6.cmPerPx";
const DEFAULT_CMPERPX = 0.56; // rough; refine with the Calibrate tool

export function Builder({ data }: { data: DataState }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [cmPerPx, setCmPerPx] = useState<number>(() => Number(localStorage.getItem(CAL_KEY)) || DEFAULT_CMPERPX);
  const imgWcm = IMG_W * cmPerPx;
  const imgHcm = IMG_H * cmPerPx;

  const [vb, setVb] = useState<[number, number, number, number]>([-PAD, -PAD, imgWcm + 2 * PAD, imgHcm + 2 * PAD]);
  const [mode, setMode] = useState<"idle" | "tracing" | "calibrating">("idle");
  const [points, setPoints] = useState<Point[]>([]);
  const [hover, setHover] = useState<Point | null>(null);
  const [closed, setClosed] = useState<Polygon | null>(null);
  const [calib, setCalib] = useState<Point[]>([]);
  const [calibCm, setCalibCm] = useState("");
  const [roomId, setRoomId] = useState<string>(data.tree[0]?.id ?? "");
  const [heightCm, setHeightCm] = useState("265");
  const [saving, setSaving] = useState(false);
  const pan = useRef<{ x: number; y: number } | null>(null);

  const room = data.tree.find((r) => r.id === roomId);

  const cmPerScreenPx = () => {
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
  function fit() {
    setVb([-PAD, -PAD, imgWcm + 2 * PAD, imgHcm + 2 * PAD]);
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
      const k = cmPerScreenPx();
      const dx = (e.clientX - pan.current.x) * k;
      const dy = (e.clientY - pan.current.y) * k;
      pan.current = { x: e.clientX, y: e.clientY };
      setVb(([x, y, w, h]) => [x - dx, y - dy, w, h]);
      return;
    }
    if (mode === "tracing") setHover(toCm(e));
  }
  function onPointerUp(e: React.PointerEvent) {
    pan.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }
  function onClick(e: React.MouseEvent) {
    const pt = toCm(e);
    if (mode === "calibrating") {
      setCalib((c) => (c.length >= 2 ? [pt] : [...c, pt]));
      return;
    }
    if (mode !== "tracing") return;
    if (points.length >= 3) {
      const first = points[0]!;
      if (Math.hypot(pt[0] - first[0], pt[1] - first[1]) <= 18 * cmPerScreenPx()) {
        finish();
        return;
      }
    }
    setPoints((ps) => [...ps, pt]);
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
  function applyCalibration() {
    if (calib.length !== 2) return;
    const measuredCm = Math.hypot(calib[1]![0] - calib[0]![0], calib[1]![1] - calib[0]![1]);
    const realCm = Number(calibCm);
    if (!realCm || !measuredCm) return;
    const next = cmPerPx * (realCm / measuredCm);
    setCmPerPx(next);
    localStorage.setItem(CAL_KEY, String(next));
    setCalib([]);
    setCalibCm("");
    setMode("idle");
    setTimeout(fit, 0);
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
  const wallM2 = useMemo(() => tracedPerimM * ((Number(heightCm) || 0) / 100), [tracedPerimM, heightCm]);

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

  const sw = cmPerScreenPx();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--ph-space-5)", alignItems: "start" }}>
      <Card style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={vb.join(" ")}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "74vh", display: "block", background: "#fff", cursor: mode === "idle" ? "grab" : "crosshair", touchAction: "none" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onClick}
          onDoubleClick={finish}
          onContextMenu={(e) => e.preventDefault()}
        >
          <image href={s6png} x={0} y={0} width={imgWcm} height={imgHcm} preserveAspectRatio="none" />

          {mode === "idle" &&
            data.tree.map((r) => {
              const poly = r.polygon;
              if (!poly || poly.length < 3) return null;
              const c = centroid(poly as Polygon);
              const sel = r.id === roomId;
              return (
                <g key={r.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setRoomId(r.id); }}>
                  <polygon points={poly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={sel ? "rgba(110,168,254,0.28)" : "rgba(110,168,254,0.12)"} stroke="#2b6fe0" strokeWidth={(sel ? 3 : 2) * sw} />
                  <text x={c[0]} y={c[1]} fill="#0a0a0a" fontSize={13 * sw} textAnchor="middle" style={{ fontFamily: "var(--ph-font-mono)", pointerEvents: "none" }}>
                    {r.name}
                  </text>
                </g>
              );
            })}

          {livePoly.length >= 2 && (
            <polyline points={livePoly.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={closed ? "rgba(110,168,254,0.3)" : "none"} stroke="#2b6fe0" strokeWidth={3 * sw} />
          )}
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={(i === 0 ? 6 : 4) * sw} fill="#2b6fe0" />
          ))}
          {calib.map((p, i) => (
            <circle key={`cal${i}`} cx={p[0]} cy={p[1]} r={6 * sw} fill="#e5793a" />
          ))}
          {calib.length === 2 && (
            <line x1={calib[0]![0]} y1={calib[0]![1]} x2={calib[1]![0]} y2={calib[1]![1]} stroke="#e5793a" strokeWidth={3 * sw} />
          )}
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
                    {r.name}
                    {r.polygon ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ceiling height (cm)">
              <input className="ph-input ph-input--mono" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>

            {mode === "idle" && !closed && (
              <Button variant="primary" onClick={() => { setPoints([]); setClosed(null); setMode("tracing"); }}>
                Trace room
              </Button>
            )}
            {mode === "tracing" && (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click the room&apos;s inner corners on the plan. Click the first point or press Enter to close · Backspace undo · Esc cancel · scroll to zoom.
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
            <Kicker>Scale</Kicker>
            {mode === "calibrating" ? (
              <>
                <p className="ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>
                  Click two points on a dimension you know (e.g. the ends of the “765” line), then enter its real length.
                </p>
                {calib.length === 2 && (
                  <div className="ph-row" style={{ gap: "var(--ph-space-2)" }}>
                    <input className="ph-input ph-input--mono" type="number" placeholder="cm" value={calibCm} onChange={(e) => setCalibCm(e.target.value)} />
                    <Button variant="primary" size="sm" onClick={applyCalibration} disabled={!calibCm}>Apply</Button>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setMode("idle"); setCalib([]); }}>Cancel</Button>
              </>
            ) : (
              <>
                <p className="ph-mono ph-muted" style={{ fontSize: "var(--ph-text-xs)" }}>{cmPerPx.toFixed(4)} cm/px</p>
                <Button variant="outline" size="sm" onClick={() => { setMode("calibrating"); setCalib([]); }}>Calibrate scale</Button>
              </>
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
              Floor area is the architect&apos;s official number. Trace to capture wall area (paint) — calibrate the scale first for accuracy.
            </p>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
