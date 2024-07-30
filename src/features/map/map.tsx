import React, { useState, useMemo, useCallback } from "react";

const Cell = React.memo(
  ({
    row,
    col,
    isSelected,
    isHovered,
    onMouseEnter,
    onMouseLeave,
    onClick,
    cellSize,
    strokeWidth,
  }) => (
    <rect
      x={strokeWidth / 2 + col * cellSize}
      y={strokeWidth / 2 + row * cellSize}
      width={cellSize}
      height={cellSize}
      fill={isSelected ? "yellow" : isHovered ? "lightblue" : "white"}
      stroke="black"
      strokeWidth={strokeWidth}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    />
  )
);

const Grid = () => {
  const size = 300;
  const cellSize = 30;
  const strokeWidth = 1;
  const actualSize = size + strokeWidth;
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());

  const handleCellClick = useCallback((row, col) => {
    setSelectedCells((prevSelected) => {
      const newSelected = new Set(prevSelected);
      const key = `${row},${col}`;
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      return newSelected;
    });
  }, []);

  const handleMouseEnter = useCallback((row, col) => {
    setHoveredCell(`${row},${col}`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const outlinePath = useMemo(() => {
    const outlinePaths = [];

    for (const cellKey of selectedCells) {
      const [row, col] = cellKey.split(",").map(Number);
      const top = !selectedCells.has(`${row - 1},${col}`);
      const right = !selectedCells.has(`${row},${col + 1}`);
      const bottom = !selectedCells.has(`${row + 1},${col}`);
      const left = !selectedCells.has(`${row},${col - 1}`);

      const x = strokeWidth / 2 + col * cellSize;
      const y = strokeWidth / 2 + row * cellSize;

      if (top) outlinePaths.push(`M${x},${y}h${cellSize}`);
      if (right) outlinePaths.push(`M${x + cellSize},${y}v${cellSize}`);
      if (bottom) outlinePaths.push(`M${x},${y + cellSize}h${cellSize}`);
      if (left) outlinePaths.push(`M${x},${y}v${cellSize}`);
    }

    return outlinePaths.join(" ");
  }, [selectedCells, cellSize, strokeWidth]);

  const gridPath = useMemo(() => {
    const paths = [];
    for (let i = 0; i <= 10; i++) {
      paths.push(
        `M${strokeWidth / 2 + i * cellSize},${strokeWidth / 2}v${size}`
      );
      paths.push(
        `M${strokeWidth / 2},${strokeWidth / 2 + i * cellSize}h${size}`
      );
    }
    return paths.join(" ");
  }, [size, cellSize, strokeWidth]);

  return (
    <div>
      <svg
        width={actualSize}
        height={actualSize}
        viewBox={`0 0 ${actualSize} ${actualSize}`}
        style={{ border: "none" }}
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

        {/* グリッド線 */}
        <path
          d={gridPath}
          stroke="black"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* セル */}
        {[...Array(10)].map((_, rowIndex) =>
          [...Array(10)].map((_, colIndex) => (
            <Cell
              key={`${rowIndex},${colIndex}`}
              row={rowIndex}
              col={colIndex}
              isSelected={selectedCells.has(`${rowIndex},${colIndex}`)}
              isHovered={hoveredCell === `${rowIndex},${colIndex}`}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              cellSize={cellSize}
              strokeWidth={strokeWidth}
            />
          ))
        )}

        {/* 選択されたセルのアウトライン */}
        <path
          d={outlinePath}
          fill="none"
          stroke="red"
          strokeWidth={2}
          pointerEvents="none"
        />
      </svg>
      <div>
        <h3>Selected cells:</h3>
        <ul>
          {[...selectedCells].map((cellKey) => {
            const [row, col] = cellKey.split(",");
            return (
              <li key={cellKey}>
                [row: {row}, cell: {col}]
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
