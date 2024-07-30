import { useState } from "react";

export function App() {
  const cellSize = 24; // 各セルのサイズ
  const cellCount = 20; // セルの数
  const size = cellSize * cellCount; // SVGの全体サイズ
  const strokeWidth = 1; // 線の太さ
  const actualSize = size + strokeWidth; // 実際のSVGサイズ

  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);

  const clickCell = (row: number, col: number) => {
    setSelectedCells((prevSelected) => {
      const cellIndex = prevSelected.findIndex(
        (cell) => cell[0] === row && cell[1] === col
      );
      if (cellIndex !== -1) {
        // セルが既に選択されている場合は、選択を解除
        return prevSelected.filter((_, index) => index !== cellIndex);
      } else {
        // セルが選択されていない場合は、選択リストに追加
        return [...prevSelected, [row, col]];
      }
    });
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some((cell) => cell[0] === row && cell[1] === col);
  };

  const renderOutline = () => {
    const outlinePaths = [];

    selectedCells.forEach(([row, col]) => {
      const top = !isCellSelected(row - 1, col);
      const right = !isCellSelected(row, col + 1);
      const bottom = !isCellSelected(row + 1, col);
      const left = !isCellSelected(row, col - 1);

      const x = strokeWidth / 2 + col * cellSize;
      const y = strokeWidth / 2 + row * cellSize;

      if (top) outlinePaths.push(`M${x},${y}h${cellSize}`);
      if (right) outlinePaths.push(`M${x + cellSize},${y}v${cellSize}`);
      if (bottom) outlinePaths.push(`M${x},${y + cellSize}h${cellSize}`);
      if (left) outlinePaths.push(`M${x},${y}v${cellSize}`);
    });

    return (
      <path
        d={outlinePaths.join(" ")}
        fill="none"
        stroke="red"
        strokeWidth={2}
        pointerEvents="none"
      />
    );
  };

  return (
    <>
      <svg
        width={actualSize}
        height={actualSize}
        viewBox={`0 0 ${actualSize} ${actualSize}`}
      >
        {/* 背景の白い四角形 */}
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={size}
          height={size}
          fill="white"
          stroke="black"
          strokeWidth={strokeWidth}
        />

        {[...Array(cellCount)].map((_, rowIndex) =>
          [...Array(cellCount)].map((_, colIndex) => (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={strokeWidth / 2 + colIndex * cellSize}
              y={strokeWidth / 2 + rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              stroke="#cdcdcd"
              fill={isCellSelected(rowIndex, colIndex) ? "yellow" : "white"}
              onClick={() => clickCell(rowIndex, colIndex)}
            />
          ))
        )}

        {/* 選択されたセルのアウトライン */}
        {renderOutline()}
      </svg>
      <div>
        <h3>Selected cells:</h3>
        <ul>
          {selectedCells.map(([row, col], index) => (
            <li key={index}>
              [row: {row}, cell: {col}]
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
