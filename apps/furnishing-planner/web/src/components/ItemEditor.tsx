import { useState } from "react";
import { Button, Card, Field, Input, Kicker, PanelBody, Select, Stack, Textarea } from "@philemon/ui";
import type { Category, Item, ItemStatus } from "@philemon/types";
import { api, uploadImage } from "../api.js";

export function ItemEditor({
  zoneId,
  item,
  categories,
  onClose,
  onSaved,
}: {
  zoneId: string;
  item: Item | null;
  categories: Category[];
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
  const [imageKey, setImageKey] = useState<string | null>(item?.imageKey ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const { key, publicUrl } = await uploadImage(f);
      setImageKey(key);
      setPreview(publicUrl);
    } catch {
      setErr("Image upload failed (is MinIO up?)");
    } finally {
      setBusy(false);
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
        imageKey,
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
            <Field label="Reference image">
              <input type="file" accept="image/*" onChange={onFile} />
            </Field>
          </div>

          {(preview || imageKey) && (
            <img src={preview ?? undefined} alt="" className="thumb" style={{ width: 80, height: 80 }} />
          )}

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
    </div>
  );
}
