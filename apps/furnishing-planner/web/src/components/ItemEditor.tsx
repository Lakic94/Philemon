import { useState } from "react";
import { Button, Card, Field, Input, Kicker, Select, Stack, Textarea } from "@philemon/ui";
import type { Category, Item, ItemStatus, RoomGeometry } from "@philemon/types";
import { api, imageUrl, uploadImage } from "../api.js";
import { Lightbox } from "./Lightbox.js";

export function ItemEditor({
  zoneId,
  item,
  categories,
  roomGeometry,
  onClose,
  onSaved,
}: {
  zoneId: string;
  item: Item | null;
  categories: Category[];
  roomGeometry: RoomGeometry | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [kind, setKind] = useState<"flat" | "area">(item?.kind ?? "flat");
  const [estimatedEur, setEstimatedEur] = useState(item ? String(item.estimatedCents / 100) : "0");
  const [areaM2, setAreaM2] = useState(String(item?.areaM2 ?? 0));
  const [rateEur, setRateEur] = useState(item?.ratePerM2Cents ? String(item.ratePerM2Cents / 100) : "");
  const [actualEur, setActualEur] = useState(item?.actualCents != null ? String(item.actualCents / 100) : "");
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "needed");
  const [productUrl, setProductUrl] = useState(item?.productUrl ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [imageKeys, setImageKeys] = useState<string[]>(item?.imageKeys ?? []);
  const [lb, setLb] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const f of files) {
        const { key } = await uploadImage(f);
        setImageKeys((ks) => [...ks, key]);
      }
    } catch {
      setErr("Image upload failed (is MinIO up?)");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const common = {
        name,
        categoryId: categoryId || null,
        quantity: Number(quantity) || 1,
        kind,
        status,
        productUrl: productUrl.trim() || null,
        notes: notes.trim() || null,
        imageKeys,
        actualCents: actualEur === "" ? null : Math.round(Number(actualEur) * 100),
      };
      const body =
        kind === "flat"
          ? { ...common, estimatedCents: Math.round(Number(estimatedEur) * 100), areaM2: null, ratePerM2Cents: null }
          : {
              ...common,
              estimatedCents: 0,
              areaM2: Number(areaM2),
              ratePerM2Cents: rateEur === "" ? null : Math.round(Number(rateEur) * 100),
            };
      if (item) await api.updateItem(item.id, body);
      else await api.createItem({ zoneId, ...body });
      await onSaved();
      onClose();
    } catch {
      setErr("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Card className="modal ph-fade-in" onClick={(e) => e.stopPropagation()}>
        <Stack>
          <Kicker>{item ? "Edit item" : "New item"}</Kicker>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>

          <div className="form-grid">
            <Field label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={kind} onChange={(e) => setKind(e.target.value as "flat" | "area")}>
                <option value="flat">Flat price</option>
                <option value="area">Area (m² × rate)</option>
              </Select>
            </Field>

            {kind === "flat" ? (
              <>
                <Field label="Qty">
                  <Input mono type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </Field>
                <Field label="Estimated (€)">
                  <Input mono type="number" step="0.01" value={estimatedEur} onChange={(e) => setEstimatedEur(e.target.value)} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Area (m²)">
                  <Input mono type="number" step="0.01" value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
                </Field>
                <Field label="Rate (€/m²)">
                  <Input mono type="number" step="0.01" value={rateEur} placeholder="—" onChange={(e) => setRateEur(e.target.value)} />
                </Field>
                {roomGeometry && (
                  <div className="span2 ph-row" style={{ gap: "var(--ph-space-2)", flexWrap: "wrap" }}>
                    <span className="ph-muted ph-mono" style={{ fontSize: "var(--ph-text-xs)" }}>
                      from plan:
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={() => setAreaM2(String(roomGeometry.floorAreaM2))}>
                      Floor {roomGeometry.floorAreaM2} m²
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setAreaM2(String(roomGeometry.wallAreaM2))}>
                      Walls {roomGeometry.wallAreaM2} m²
                    </Button>
                  </div>
                )}
              </>
            )}

            <Field label="Actual paid (€)">
              <Input mono type="number" step="0.01" value={actualEur} placeholder="—" onChange={(e) => setActualEur(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
                <option value="needed">Needed</option>
                <option value="ordered">Ordered</option>
                <option value="bought">Bought</option>
              </Select>
            </Field>

            <Field label="Product link">
              <Input className="span2" value={productUrl} placeholder="https://…" onChange={(e) => setProductUrl(e.target.value)} />
            </Field>
          </div>

          <div className="ph-field">
            <span className="ph-label">Images</span>
            <div className="moodgrid">
              {imageKeys.map((k, idx) => (
                <div key={k} style={{ position: "relative" }}>
                  <img className="clickable" src={imageUrl(k) ?? undefined} alt="" onClick={() => setLb(idx)} />
                  <button
                    type="button"
                    onClick={() => setImageKeys((ks) => ks.filter((x) => x !== k))}
                    title="Remove"
                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, border: "1px solid var(--ph-border-strong)", background: "rgba(0,0,0,0.7)", color: "var(--ph-text)", cursor: "pointer", fontSize: "var(--ph-text-xs)", lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="ph-btn ph-btn--outline" style={{ cursor: "pointer", aspectRatio: "1", height: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {busy ? "…" : "+ Add"}
                <input type="file" accept="image/*" multiple onChange={onFile} style={{ display: "none" }} disabled={busy} />
              </label>
            </div>
          </div>

          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {err && <p style={{ color: "#e57373", fontSize: "var(--ph-text-sm)" }}>{err}</p>}

          <div className="ph-row ph-row--between">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={busy || !name.trim()}>
              {item ? "Save" : "Add item"}
            </Button>
          </div>
        </Stack>
      </Card>
      {lb !== null && <Lightbox keys={imageKeys} index={lb} onClose={() => setLb(null)} />}
    </div>
  );
}
