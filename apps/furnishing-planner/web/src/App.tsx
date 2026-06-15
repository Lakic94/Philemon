import { useState } from "react";
import { useSession } from "./auth.js";
import { useData } from "./data.js";
import { Dashboard } from "./components/Dashboard.js";
import { MoodBoard } from "./components/MoodBoard.js";
import { PlanView } from "./components/PlanView.js";
import { SignIn } from "./components/SignIn.js";
import { TopBar } from "./components/TopBar.js";

export type Tab = "plan" | "dashboard" | "mood";

export function App() {
  const { data: session, isPending } = useSession();
  if (isPending) return <div className="centered ph-muted">Loading…</div>;
  if (!session) return <SignIn />;
  return <Shell email={session.user.email} />;
}

function Shell({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("plan");
  const data = useData();

  if (data.unauthorized) return <SignIn />;

  return (
    <div className="app-shell">
      <TopBar email={email} tab={tab} setTab={setTab} data={data} />
      <main className="page ph-fade-in">
        {data.loading ? (
          <p className="ph-muted">Loading…</p>
        ) : data.error ? (
          <p style={{ color: "#e57373" }}>{data.error}</p>
        ) : tab === "plan" ? (
          <PlanView data={data} />
        ) : tab === "dashboard" ? (
          <Dashboard data={data} />
        ) : (
          <MoodBoard data={data} />
        )}
      </main>
    </div>
  );
}
