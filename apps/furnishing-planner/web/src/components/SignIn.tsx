import { useState } from "react";
import { Button, Card, Field, Input, Kicker, Stack } from "@philemon/ui";
import { signIn } from "../auth.js";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn.magicLink({ email, callbackURL: window.location.origin });
      setSent(true);
    } catch {
      setErr("Could not send the link. Is the auth service running?");
    } finally {
      setBusy(false);
    }
  }

  async function withPasskey() {
    setBusy(true);
    setErr(null);
    try {
      await signIn.passkey();
    } catch {
      setErr("Passkey sign-in failed or was cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="centered">
      <Card className="signin-card ph-fade-in">
        <Stack>
          <div>
            <Kicker>Philemon</Kicker>
            <h1 style={{ fontSize: "var(--ph-text-xl)" }}>Furnishing Planner</h1>
          </div>

          {sent ? (
            <p className="ph-muted">
              Magic link sent to <span className="ph-mono">{email}</span>. In local dev it&apos;s printed
              in the auth service console — open it to sign in.
            </p>
          ) : (
            <form onSubmit={sendLink}>
              <Stack>
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Button type="submit" variant="primary" disabled={busy}>
                  Send magic link
                </Button>
              </Stack>
            </form>
          )}

          <div style={{ borderTop: "1px solid var(--ph-border)", paddingTop: "var(--ph-space-4)" }}>
            <Button variant="outline" onClick={withPasskey} disabled={busy} style={{ width: "100%" }}>
              Sign in with passkey
            </Button>
          </div>

          {err && <p style={{ color: "#e57373", fontSize: "var(--ph-text-sm)" }}>{err}</p>}
        </Stack>
      </Card>
    </div>
  );
}
