import { TableWrap, Table, numCell } from "@philemon/ui";

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

export function PanelledTable() {
  return (
    <Frame>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Zone</th>
              <th className={numCell}>Budget</th>
              <th className={numCell}>Spent</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Living room</td>
              <td className={numCell}>€8,000</td>
              <td className={numCell}>€5,240</td>
            </tr>
            <tr>
              <td>Kitchen</td>
              <td className={numCell}>€6,500</td>
              <td className={numCell}>€6,500</td>
            </tr>
            <tr>
              <td>Bedroom</td>
              <td className={numCell}>€4,000</td>
              <td className={numCell}>€1,890</td>
            </tr>
          </tbody>
        </Table>
      </TableWrap>
    </Frame>
  );
}
