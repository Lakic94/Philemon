import { Card, Kicker } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
    }}
  >
    {children}
  </div>
);

export function Default() {
  return (
    <Frame>
      <Card style={{ maxWidth: 360 }}>
        <Kicker>Living room</Kicker>
        <h3 style={{ margin: "0 0 8px" }}>Furnishing plan</h3>
        <p style={{ color: "#a1a1aa", margin: 0 }}>
          12 items across 3 zones. €5,240 of €8,000 committed so far.
        </p>
      </Card>
    </Frame>
  );
}

export function Stat() {
  return (
    <Frame>
      <Card style={{ maxWidth: 240 }}>
        <Kicker>Total budget</Kicker>
        <div style={{ fontSize: "1.85rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          €42,000
        </div>
      </Card>
    </Frame>
  );
}
