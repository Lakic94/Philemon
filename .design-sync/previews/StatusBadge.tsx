import { StatusBadge } from "@philemon/ui";

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

export function Statuses() {
  return (
    <Frame>
      <StatusBadge status="needed" />
      <StatusBadge status="ordered" />
      <StatusBadge status="bought" />
    </Frame>
  );
}
