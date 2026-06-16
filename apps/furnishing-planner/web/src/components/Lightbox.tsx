import { useEffect, useState } from "react";
import { imageUrl } from "../api.js";

/** Full-screen image carousel. Cycle with ‹ ›, arrow keys, or Esc to close. */
export function Lightbox({ keys, index, onClose }: { keys: string[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const n = keys.length;
  const prev = () => setI((x) => (x - 1 + n) % n);
  const next = () => setI((x) => (x + 1) % n);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  if (!n) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} title="Close (Esc)">✕</button>
      {n > 1 && (
        <button className="lightbox__nav lightbox__prev" onClick={(e) => { e.stopPropagation(); prev(); }} title="Previous (←)">‹</button>
      )}
      <img src={imageUrl(keys[i]) ?? undefined} alt="" onClick={(e) => e.stopPropagation()} />
      {n > 1 && (
        <button className="lightbox__nav lightbox__next" onClick={(e) => { e.stopPropagation(); next(); }} title="Next (→)">›</button>
      )}
      {n > 1 && <div className="lightbox__count">{i + 1} / {n}</div>}
    </div>
  );
}
