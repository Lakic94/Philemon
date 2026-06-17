import { Button } from "@philemon/ui";

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
      <Button variant="primary">Add item</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="outline">Edit room</Button>
      <Button variant="danger">Delete</Button>
    </Frame>
  );
}

export function Sizes() {
  return (
    <Frame>
      <Button variant="primary" size="md">
        Medium
      </Button>
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="outline" size="sm">
        Small outline
      </Button>
    </Frame>
  );
}

export function Disabled() {
  return (
    <Frame>
      <Button variant="primary" disabled>
        Saving…
      </Button>
      <Button variant="ghost" disabled>
        Unavailable
      </Button>
    </Frame>
  );
}
