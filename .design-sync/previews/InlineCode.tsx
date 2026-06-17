import { InlineCode } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      maxWidth: 460,
      lineHeight: 1.6,
    }}
  >
    {children}
  </div>
);

export function InProse() {
  return (
    <Frame>
      <p style={{ margin: 0 }}>
        Each item carries a status of <InlineCode>needed</InlineCode>,{" "}
        <InlineCode>ordered</InlineCode>, or <InlineCode>bought</InlineCode>. Format
        money with <InlineCode>formatEuro(cents)</InlineCode>.
      </p>
    </Frame>
  );
}
