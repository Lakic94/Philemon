import { Panel, PanelHeader, PanelBody, KeyValue } from "@philemon/ui";

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

// PanelBody is the padded content region of a Panel — shown inside its parent.
export function InPanel() {
  return (
    <Frame>
      <Panel style={{ maxWidth: 380 }}>
        <PanelHeader>
          <strong>Bedroom</strong>
        </PanelHeader>
        <PanelBody>
          <KeyValue
            rows={[
              { k: "Items", v: "6" },
              { k: "Budget", v: "€4,000" },
              { k: "Spent", v: "€1,890" },
            ]}
          />
        </PanelBody>
      </Panel>
    </Frame>
  );
}
