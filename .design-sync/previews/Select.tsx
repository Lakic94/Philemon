import { Select, Field } from "@philemon/ui";

const Frame = ({ children }: { children?: any }) => (
  <div
    style={{
      background: "#000",
      color: "#fff",
      padding: 24,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      maxWidth: 320,
    }}
  >
    {children}
  </div>
);

export function Default() {
  return (
    <Frame>
      <Field label="Status">
        <Select defaultValue="ordered">
          <option value="needed">Needed</option>
          <option value="ordered">Ordered</option>
          <option value="bought">Bought</option>
        </Select>
      </Field>
    </Frame>
  );
}
