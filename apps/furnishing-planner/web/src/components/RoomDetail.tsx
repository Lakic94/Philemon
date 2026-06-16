import { useState } from "react";
import { Button, formatEuro, KeyValue, Kicker, Panel, PanelBody, PanelHeader, Progress, StatusBadge, Table } from "@philemon/ui";
import type { Item } from "@philemon/types";
import { api, imageUrl, type RoomNode, type ZoneWithItems } from "../api.js";
import { zoneTotals, type DataState } from "../data.js";
import { ItemEditor } from "./ItemEditor.js";
import { Lightbox } from "./Lightbox.js";

function itemPlanned(it: Item): number {
  return it.kind === "area"
    ? Math.round((it.areaM2 ?? 0) * (it.ratePerM2Cents ?? 0))
    : it.estimatedCents * it.quantity;
}

export function RoomDetail({ room, data, hideGeometry }: { room: RoomNode; data: DataState; hideGeometry?: boolean }) {
  const [editing, setEditing] = useState<{ zoneId: string; item: Item | null } | null>(null);
  const catName = new Map(data.categories.map((c) => [c.id, c.name]));
  const g = room.geometry;

  return (
    <div>
      <div className="ph-row ph-row--between" style={{ marginBottom: "var(--ph-space-4)" }}>
        <h2>{room.name}</h2>
      </div>

      {!hideGeometry && (
        <Panel style={{ marginBottom: "var(--ph-space-5)" }}>
          <PanelHeader>
            <Kicker>Geometry</Kicker>
          </PanelHeader>
          <PanelBody>
            {g ? (
              <KeyValue
                rows={[
                  { k: "Floor", v: `${g.floorAreaM2} m²` },
                  { k: "Walls", v: `${g.wallAreaM2} m²` },
                  { k: "Perimeter", v: `${g.perimeterM} m` },
                  { k: "Height", v: room.heightCm ? `${(room.heightCm / 100).toFixed(2)} m` : "—" },
                  { k: "Volume", v: `${g.volumeM3} m³` },
                ]}
              />
            ) : (
              <p className="ph-muted" style={{ fontSize: "var(--ph-text-sm)" }}>
                No floor plan traced yet — draw this room in the builder to get exact areas.
              </p>
            )}
          </PanelBody>
        </Panel>
      )}

      {room.zones.map((zone) => (
        <ZoneCard
          key={zone.id}
          zone={zone}
          catName={catName}
          onAdd={() => setEditing({ zoneId: zone.id, item: null })}
          onEdit={(item) => setEditing({ zoneId: zone.id, item })}
          onDelete={async (id) => {
            await api.deleteItem(id);
            await data.reload();
          }}
        />
      ))}

      {editing && (
        <ItemEditor
          zoneId={editing.zoneId}
          item={editing.item}
          categories={data.categories}
          roomGeometry={room.geometry}
          onClose={() => setEditing(null)}
          onSaved={data.reload}
        />
      )}
    </div>
  );
}

function ZoneCard({
  zone,
  catName,
  onAdd,
  onEdit,
  onDelete,
}: {
  zone: ZoneWithItems;
  catName: Map<string, string>;
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}) {
  const t = zoneTotals(zone);
  const [lb, setLb] = useState<string[] | null>(null);
  return (
    <Panel className="zone-block">
      <PanelHeader>
        <div className="ph-row ph-row--between">
          <div>
            <Kicker>Zone</Kicker>
            <strong>{zone.name}</strong>
          </div>
          <div style={{ textAlign: "right", minWidth: 220 }}>
            <div className="ph-mono" style={{ fontSize: "var(--ph-text-xs)", color: "var(--ph-muted)" }}>
              {formatEuro(t.planned)} planned · {formatEuro(t.spent)} spent · {formatEuro(t.target)} target
            </div>
            <Progress value={t.planned} max={t.target} />
          </div>
        </div>
      </PanelHeader>
      <PanelBody>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 44 }}></th>
              <th>Item</th>
              <th>Category</th>
              <th className="ph-num">Planned</th>
              <th className="ph-num">Actual</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zone.items.map((it) => {
              const img = imageUrl(it.imageKeys[0]);
              return (
                <tr key={it.id}>
                  <td>{img && <img src={img} alt="" className="thumb clickable" onClick={() => setLb(it.imageKeys)} />}</td>
                  <td>
                    {it.productUrl ? (
                      <a href={it.productUrl} target="_blank" rel="noreferrer">
                        {it.name}
                      </a>
                    ) : (
                      it.name
                    )}
                    {it.kind === "area" && (
                      <span className="ph-muted ph-mono" style={{ fontSize: "var(--ph-text-xs)" }}>
                        {" "}
                        · {it.areaM2 ?? 0} m²{it.ratePerM2Cents ? ` × ${formatEuro(it.ratePerM2Cents)}` : " · rate?"}
                      </span>
                    )}
                  </td>
                  <td className="ph-muted">{it.categoryId ? catName.get(it.categoryId) : "—"}</td>
                  <td className="ph-num">{formatEuro(itemPlanned(it))}</td>
                  <td className="ph-num">{it.actualCents != null ? formatEuro(it.actualCents) : "—"}</td>
                  <td>
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="ph-num">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(it)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(it.id)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              );
            })}
            {zone.items.length === 0 && (
              <tr>
                <td colSpan={7} className="ph-muted">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <div style={{ marginTop: "var(--ph-space-3)" }}>
          <Button variant="outline" size="sm" onClick={onAdd}>
            + Add item
          </Button>
        </div>
      </PanelBody>
      {lb && lb.length > 0 && <Lightbox keys={lb} index={0} onClose={() => setLb(null)} />}
    </Panel>
  );
}
