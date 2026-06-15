import { useState } from "react";
import { Button, formatEuro, Progress } from "@philemon/ui";
import type { Tab } from "../App.js";
import { passkey, signOut } from "../auth.js";
import { grandTotals, type DataState } from "../data.js";

export function TopBar({
  email,
  tab,
  setTab,
  data,
}: {
  email: string;
  tab: Tab;
  setTab: (t: Tab) => void;
  data: DataState;
}) {
  const totals = grandTotals(data.tree);
  const [pkMsg, setPkMsg] = useState<string | null>(null);

  async function addPasskey() {
    try {
      await passkey.addPasskey();
      setPkMsg("Passkey added ✓");
    } catch {
      setPkMsg("Passkey add failed");
    }
    setTimeout(() => setPkMsg(null), 2500);
  }

  return (
    <header className="topbar">
      <span className="topbar__brand">Furnishing Planner</span>

      <div className="topbar__budget">
        <span className="ph-mono" style={{ fontSize: "var(--ph-text-xs)", color: "var(--ph-muted)" }}>
          {formatEuro(totals.spent)} spent · {formatEuro(totals.planned)} planned
        </span>
        <Progress value={totals.spent} max={totals.target} />
        <span className="ph-mono" style={{ fontSize: "var(--ph-text-xs)" }}>
          {formatEuro(totals.target)}
        </span>
      </div>

      <div className="topbar__spacer" />

      <nav className="nav">
        <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>
          Plan
        </button>
        <button className={tab === "builder" ? "active" : ""} onClick={() => setTab("builder")}>
          Builder
        </button>
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
        <button className={tab === "mood" ? "active" : ""} onClick={() => setTab("mood")}>
          Mood board
        </button>
      </nav>

      <div className="topbar__spacer" />

      <span className="ph-mono" style={{ fontSize: "var(--ph-text-xs)", color: "var(--ph-muted)" }}>
        {pkMsg ?? email}
      </span>
      <Button variant="ghost" size="sm" onClick={addPasskey}>
        Add passkey
      </Button>
      <Button variant="outline" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </header>
  );
}
