import { CodeBlock } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      maxWidth: 460,
    }}
  >
    {children}
  </div>
);

export function Default() {
  return (
    <Frame>
      <CodeBlock>{`import { Button, Card } from "@philemon/ui";

export function RoomCard() {
  return (
    <Card>
      <Button variant="primary">Add item</Button>
    </Card>
  );
}`}</CodeBlock>
    </Frame>
  );
}
