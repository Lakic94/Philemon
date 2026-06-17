import { Badge } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
    }}
  >
    {children}
  </div>
);

export function Variants() {
  return (
    <Frame>
      <Badge variant="needed">Needed</Badge>
      <Badge variant="ordered">Ordered</Badge>
      <Badge variant="bought">Bought</Badge>
      <Badge variant="accent">Priority</Badge>
    </Frame>
  );
}

export function WithDot() {
  return (
    <Frame>
      <Badge variant="needed" dot>
        Needed
      </Badge>
      <Badge variant="ordered" dot>
        Ordered
      </Badge>
      <Badge variant="bought" dot>
        Bought
      </Badge>
    </Frame>
  );
}

export function Plain() {
  return (
    <Frame>
      <Badge>3 rooms</Badge>
      <Badge>12 items</Badge>
    </Frame>
  );
}
