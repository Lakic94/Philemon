import { Kicker, Panel, PanelBody, PanelHeader, Stack } from "@philemon/ui";
import { imageUrl } from "../api.js";
import type { DataState } from "../data.js";

export function MoodBoard({ data }: { data: DataState }) {
  return (
    <Stack>
      <p className="ph-muted" style={{ fontSize: "var(--ph-text-sm)" }}>
        Reference images from each zone&apos;s items, grouped so you can see it come together.
      </p>
      {data.tree.map((room) =>
        room.zones.map((zone) => {
          const imgs = zone.items
            .map((it) => ({ url: imageUrl(it.imageKey), name: it.name }))
            .filter((x): x is { url: string; name: string } => x.url !== null);
          return (
            <Panel key={zone.id}>
              <PanelHeader>
                <Kicker>
                  {room.name} · {zone.name}
                </Kicker>
              </PanelHeader>
              <PanelBody>
                {imgs.length ? (
                  <div className="moodgrid">
                    {imgs.map((img, i) => (
                      <img key={i} src={img.url} alt={img.name} title={img.name} />
                    ))}
                  </div>
                ) : (
                  <p className="mood-empty">No reference images yet — add them to items in the Plan tab.</p>
                )}
              </PanelBody>
            </Panel>
          );
        }),
      )}
    </Stack>
  );
}
