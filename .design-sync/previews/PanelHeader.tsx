import { Panel, PanelHeader, PanelBody, Row } from "@philemon/ui";

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

// PanelHeader is the bordered top strip of a Panel — shown in its only real
// context (inside a Panel, above a PanelBody).
export function InPanel() {
  return (
    <Frame>
      <Panel style={{ maxWidth: 380 }}>
        <PanelHeader>
          <Row between>
            <strong>Budget summary</strong>
            <span style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>Q2 2026</span>
          </Row>
        </PanelHeader>
        <PanelBody>
          <span style={{ color: "#a1a1aa" }}>€13,630 of €42,000 spent</span>
        </PanelBody>
      </Panel>
    </Frame>
  );
}
