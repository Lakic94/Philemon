import { useState } from "react";
import { Card, Kicker, Stack } from "@philemon/ui";
import type { Room } from "@philemon/types";
import { api, imageUrl, uploadImage } from "../api.js";
import type { DataState } from "../data.js";
import { Lightbox } from "./Lightbox.js";

export function RoomImages({ room, data }: { room: Room; data: DataState }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lb, setLb] = useState<number | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    try {
      const keys: string[] = [];
      for (const f of files) {
        const { key } = await uploadImage(f);
        keys.push(key);
      }
      await api.updateRoom(room.id, { imageKeys: [...room.imageKeys, ...keys] });
      await data.reload();
    } catch {
      setErr("Upload failed (is MinIO up?)");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(key: string) {
    await api.updateRoom(room.id, { imageKeys: room.imageKeys.filter((k) => k !== key) });
    await data.reload();
  }

  return (
    <Card>
      <Stack>
        <div className="ph-row ph-row--between">
          <Kicker>Room images</Kicker>
          <label className="ph-btn ph-btn--outline ph-btn--sm" style={{ cursor: "pointer" }}>
            {busy ? "Uploading…" : "+ Add images"}
            <input type="file" accept="image/*" multiple onChange={onFile} style={{ display: "none" }} disabled={busy} />
          </label>
        </div>
        {room.imageKeys.length ? (
          <div className="moodgrid">
            {room.imageKeys.map((k, idx) => (
              <div key={k} style={{ position: "relative" }}>
                <img className="clickable" src={imageUrl(k) ?? undefined} alt="" onClick={() => setLb(idx)} />
                <button
                  onClick={() => remove(k)}
                  title="Remove"
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, border: "1px solid var(--ph-border-strong)", background: "rgba(0,0,0,0.7)", color: "var(--ph-text)", cursor: "pointer", fontSize: "var(--ph-text-xs)", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mood-empty">No images yet — add reference photos for this room.</p>
        )}
        {err && <p style={{ color: "#e57373", fontSize: "var(--ph-text-sm)" }}>{err}</p>}
      </Stack>
      {lb !== null && <Lightbox keys={room.imageKeys} index={lb} onClose={() => setLb(null)} />}
    </Card>
  );
}
