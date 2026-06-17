import { Panel, PanelHeader, PanelBody, Row, Badge } from "@philemon/ui";

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
      <Panel style={{ maxWidth: 380 }}>
        <PanelHeader>
          <Row between>
            <strong>Living room</strong>
            <Badge variant="ordered">In progress</Badge>
          </Row>
        </PanelHeader>
        <PanelBody>
          <p style={{ color: "#a1a1aa", margin: 0 }}>
            Sofa, media unit, rug and lighting. 5 of 8 items ordered.
          </p>
        </PanelBody>
      </Panel>
    </Frame>
  );
}
