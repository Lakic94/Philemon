import { Table, numCell, Badge } from "@philemon/ui";

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

export function ItemList() {
  return (
    <Frame>
      <Table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Room</th>
            <th>Status</th>
            <th className={numCell}>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sofa — 3 seat</td>
            <td>Living room</td>
            <td>
              <Badge variant="bought" dot>
                Bought
              </Badge>
            </td>
            <td className={numCell}>€2,400</td>
          </tr>
          <tr>
            <td>Dining table</td>
            <td>Kitchen</td>
            <td>
              <Badge variant="ordered" dot>
                Ordered
              </Badge>
            </td>
            <td className={numCell}>€1,150</td>
          </tr>
          <tr>
            <td>Wardrobe</td>
            <td>Bedroom</td>
            <td>
              <Badge variant="needed" dot>
                Needed
              </Badge>
            </td>
            <td className={numCell}>€890</td>
          </tr>
        </tbody>
      </Table>
    </Frame>
  );
}
