import { Input } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 320,
    }}
  >
    {children}
  </div>
);

export function Default() {
  return (
    <Frame>
      <Input placeholder="Search items…" />
      <Input defaultValue="3-seat sofa" />
    </Frame>
  );
}

export function Mono() {
  return (
    <Frame>
      <Input mono defaultValue="€2,400.00" />
    </Frame>
  );
}

export function Disabled() {
  return (
    <Frame>
      <Input defaultValue="Locked field" disabled />
    </Frame>
  );
}
