import { Kicker } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    {children}
  </div>
);

export function Labels() {
  return (
    <Frame>
      <div>
        <Kicker>Living room</Kicker>
        <h3 style={{ margin: 0 }}>Furnishing plan</h3>
      </div>
      <div>
        <Kicker>Total spent</Kicker>
        <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>€13,630</div>
      </div>
    </Frame>
  );
}
