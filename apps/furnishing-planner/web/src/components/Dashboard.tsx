import { Card, formatEuro, KeyValue, Kicker, Panel, PanelBody, PanelHeader, Progress, Stack, Table } from "@philemon/ui";
import { grandTotals, zoneTotals, type DataState } from "../data.js";

export function Dashboard({ data }: { data: DataState }) {
  const g = grandTotals(data.tree);
  const rows = data.tree.flatMap((r) => r.zones.map((z) => ({ room: r.name, zone: z.name, ...zoneTotals(z) })));

  return (
    <Stack>
      <Card>
        <Stack>
          <Kicker>Budget</Kicker>
          <div className="ph-row ph-row--between" style={{ alignItems: "flex-end" }}>
            <KeyValue
              rows={[
                { k: "Target", v: formatEuro(g.target) },
                { k: "Planned", v: formatEuro(g.planned) },
                { k: "Spent", v: formatEuro(g.spent) },
                { k: "Remaining", v: formatEuro(g.target - g.spent) },
              ]}
            />
          </div>
          <div>
            <div className="ph-mono" style={{ fontSize: "var(--ph-text-xs)", color: "var(--ph-muted)", marginBottom: 4 }}>
              spent vs target
            </div>
            <Progress value={g.spent} max={g.target} />
          </div>
          <div>
            <div className="ph-mono" style={{ fontSize: "var(--ph-text-xs)", color: "var(--ph-muted)", marginBottom: 4 }}>
              planned vs target
            </div>
            <Progress value={g.planned} max={g.target} />
          </div>
        </Stack>
      </Card>

      <Panel>
        <PanelHeader>
          <Kicker>Per zone</Kicker>
        </PanelHeader>
        <PanelBody>
          <Table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Zone</th>
                <th className="ph-num">Target</th>
                <th className="ph-num">Planned</th>
                <th className="ph-num">Spent</th>
                <th className="ph-num">Remaining</th>
                <th style={{ width: 160 }}>Spent / target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="ph-muted">{r.room}</td>
                  <td>{r.zone}</td>
                  <td className="ph-num">{formatEuro(r.target)}</td>
                  <td className="ph-num">{formatEuro(r.planned)}</td>
                  <td className="ph-num">{formatEuro(r.spent)}</td>
                  <td className="ph-num">{formatEuro(r.target - r.spent)}</td>
                  <td>
                    <Progress value={r.spent} max={r.target} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </PanelBody>
      </Panel>
    </Stack>
  );
}
