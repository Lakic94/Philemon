import { Field, Input, Select } from "@philemon/ui";

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

export function LabelledInput() {
  return (
    <Frame>
      <Field label="Item name">
        <Input defaultValue="3-seat sofa" />
      </Field>
    </Frame>
  );
}

export function FormRow() {
  return (
    <Frame>
      <Field label="Room">
        <Select defaultValue="living">
          <option value="living">Living room</option>
          <option value="kitchen">Kitchen</option>
          <option value="bedroom">Bedroom</option>
        </Select>
      </Field>
      <Field label="Price (EUR)">
        <Input mono defaultValue="2400" />
      </Field>
    </Frame>
  );
}
