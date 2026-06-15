import { useState } from "react";
import { formatEuro, Kicker } from "@philemon/ui";
import { zoneTotals, type DataState } from "../data.js";
import { RoomDetail } from "./RoomDetail.js";

export function PlanView({ data }: { data: DataState }) {
  const [selId, setSelId] = useState<string | null>(data.tree[0]?.id ?? null);
  const selected = data.tree.find((r) => r.id === selId) ?? data.tree[0] ?? null;

  return (
    <div className="plan-layout">
      <div className="room-list">
        <Kicker>Rooms</Kicker>
        {data.tree.map((r) => {
          const planned = r.zones.reduce((s, z) => s + zoneTotals(z).planned, 0);
          return (
            <button
              key={r.id}
              className={"room-list__item" + (r.id === selected?.id ? " active" : "")}
              onClick={() => setSelId(r.id)}
            >
              <div>{r.name}</div>
              <div className="room-list__meta">
                {r.zones.length} zone{r.zones.length === 1 ? "" : "s"} · {formatEuro(planned)}
                {r.geometry ? ` · ${r.geometry.floorAreaM2} m²` : ""}
              </div>
            </button>
          );
        })}
        <p className="room-list__meta" style={{ marginTop: "var(--ph-space-3)" }}>
          The interactive floor plan replaces this list once the builder lands.
        </p>
      </div>

      {selected ? <RoomDetail room={selected} data={data} /> : <p className="ph-muted">No rooms.</p>}
    </div>
  );
}
