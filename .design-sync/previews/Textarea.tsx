import { Textarea, Field } from "@philemon/ui";

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

export function Default() {
  return (
    <Frame>
      <Field label="Notes">
        <Textarea defaultValue="Walnut finish, must match the media unit. Lead time ~6 weeks from the supplier." />
      </Field>
    </Frame>
  );
}
