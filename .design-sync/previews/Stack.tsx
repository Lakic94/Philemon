import { Stack, Card, Row, Badge } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      maxWidth: 360,
    }}
  >
    {children}
  </div>
);

export function StackedRooms() {
  return (
    <Frame>
      <Stack>
        <Card>
          <Row between>
            <span>Living room</span>
            <Badge variant="ordered">In progress</Badge>
          </Row>
        </Card>
        <Card>
          <Row between>
            <span>Kitchen</span>
            <Badge variant="bought">Done</Badge>
          </Row>
        </Card>
        <Card>
          <Row between>
            <span>Bedroom</span>
            <Badge variant="needed">Planning</Badge>
          </Row>
        </Card>
      </Stack>
    </Frame>
  );
}
