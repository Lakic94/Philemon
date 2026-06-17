import { Row, Button, Badge } from "@philemon/ui";

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
      maxWidth: 380,
    }}
  >
    {children}
  </div>
);

export function Inline() {
  return (
    <Frame>
      <Row>
        <Badge variant="bought" dot>
          Bought
        </Badge>
        <span style={{ color: "#a1a1aa" }}>Updated 2 days ago</span>
      </Row>
    </Frame>
  );
}

export function Between() {
  return (
    <Frame>
      <Row between>
        <strong>Living room</strong>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </Row>
    </Frame>
  );
}
