import { useSession } from "./auth.js";
import { useData } from "./data.js";
import { Builder } from "./components/Builder.js";
import { SignIn } from "./components/SignIn.js";
import { TopBar } from "./components/TopBar.js";

export function App() {
  const { data: session, isPending } = useSession();
  if (isPending) return <div className="centered ph-muted">Loading…</div>;
  if (!session) return <SignIn />;
  return <Shell email={session.user.email} />;
}

function Shell({ email }: { email: string }) {
  const data = useData();
  if (data.unauthorized) return <SignIn />;

  return (
    <div className="app-shell">
      <TopBar email={email} data={data} />
      <main className="page wide ph-fade-in">
        {data.loading ? (
          <p className="ph-muted">Loading…</p>
        ) : data.error ? (
          <p style={{ color: "#e57373" }}>{data.error}</p>
        ) : (
          <Builder data={data} />
        )}
      </main>
    </div>
  );
}
