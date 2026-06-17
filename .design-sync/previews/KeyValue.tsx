import { KeyValue, Card, Kicker } from "@philemon/ui";

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

export function BudgetSummary() {
  return (
    <Frame>
      <Card style={{ maxWidth: 300 }}>
        <Kicker>Budget</Kicker>
        <KeyValue
          rows={[
            { k: "Total", v: "€42,000" },
            { k: "Spent", v: "€13,630" },
            { k: "Committed", v: "€7,650" },
            { k: "Remaining", v: "€20,720" },
          ]}
        />
      </Card>
    </Frame>
  );
}
