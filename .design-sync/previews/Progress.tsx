import { Progress, Row, Kicker } from "@philemon/ui";

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
      maxWidth: 360,
    }}
  >
    {children}
  </div>
);

export function UnderBudget() {
  return (
    <Frame>
      <div>
        <Row between style={{ marginBottom: 8 }}>
          <Kicker>Living room</Kicker>
          <span style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>€5,240 / €8,000</span>
        </Row>
        <Progress value={5240} max={8000} />
      </div>
    </Frame>
  );
}

export function OverBudget() {
  return (
    <Frame>
      <div>
        <Row between style={{ marginBottom: 8 }}>
          <Kicker>Kitchen</Kicker>
          <span style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>€7,100 / €6,500</span>
        </Row>
        <Progress value={7100} max={6500} />
      </div>
    </Frame>
  );
}
