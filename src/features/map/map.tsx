import React, { useState, useMemo, useCallback } from "react";
import styles from "./Grid.module.css";

type CellData = {
  key: string;
  row: number;
  col: number;
  isSelected: boolean;
};

type CellProps = CellData & {
  onClick: (row: number, col: number) => void;
  cellSize: number;
  strokeWidth: number;
};

const Cell: React.FC<CellProps> = React.memo(
  ({ row, col, isSelected, onClick, cellSize, strokeWidth }) => (
    <rect
      className={`${styles.cell} ${isSelected ? styles.selected : ""}`}
      x={strokeWidth / 2 + col * cellSize}
      y={strokeWidth / 2 + row * cellSize}
      width={cellSize}
      height={cellSize}
      strokeWidth={strokeWidth}
      onClick={() => onClick(row, col)}
    />
  )
);

const Grid: React.FC = () => {
  const [cellSize, setCellSize] = useState(30);
  const [rowCount, setRowCount] = useState(10);
  const [colCount, setColCount] = useState(10);
  const strokeWidth = 1;

  const width = cellSize * colCount;
  const height = cellSize * rowCount;
  const actualWidth = width + strokeWidth;
  const actualHeight = height + strokeWidth;

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const handleCellClick = useCallback((row: number, col: number) => {
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

  const handleCellSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(event.target.value);
    if (newSize >= 10 && newSize <= 100) {
      setCellSize(newSize);
    }
  };

  const handleRowCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Number(event.target.value);
    if (newCount >= 1 && newCount <= 20) {
      setRowCount(newCount);
    }
  };

  const handleColCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Number(event.target.value);
    if (newCount >= 1 && newCount <= 20) {
      setColCount(newCount);
    }
  };

  const clearOutOfBoundsCells = useCallback(() => {
    setSelectedCells((prevSelected) => {
      const newSelected = new Set<string>();
      for (const cellKey of prevSelected) {
        const [row, col] = cellKey.split(",").map(Number);
        if (row < rowCount && col < colCount) {
          newSelected.add(cellKey);
        }
      }
      return newSelected;
    });
  }, [rowCount, colCount]);

  const fillEnclosedAreas = useCallback(() => {
    const isSelected = (row: number, col: number) =>
      selectedCells.has(`${row},${col}`);
    const isValid = (row: number, col: number) =>
      row >= 0 && row < rowCount && col >= 0 && col < colCount;

    const dfs = (row: number, col: number, visited: Set<string>): boolean => {
      if (!isValid(row, col)) {
        return false; // グリッドの端に到達した場合、閉じていない
      }
      if (isSelected(row, col)) {
        return true; // 選択されたセルに到達
      }
      if (visited.has(`${row},${col}`)) {
        return true; // 既に訪問済み
      }

      visited.add(`${row},${col}`);

      // 四方向を探索
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dx, dy] of directions) {
        if (!dfs(row + dx, col + dy, visited)) {
          return false; // 閉じていない領域を発見
        }
      }

      return true; // この領域は閉じている
    };

    const newSelectedCells = new Set(selectedCells);

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (!isSelected(row, col)) {
          const visited = new Set<string>();
          if (dfs(row, col, visited)) {
            // 閉じた領域を発見したので、訪問したすべてのセルを選択状態にする
            for (const cell of visited) {
              newSelectedCells.add(cell);
            }
          }
        }
      }
    }

    setSelectedCells(newSelectedCells);
  }, [selectedCells, rowCount, colCount]);

  const gridLinesPath = useMemo(() => {
    let path = "";
    for (let i = 0; i <= colCount; i++) {
      const x = i * cellSize;
      path += `M${x},0 V${height} `;
    }
    for (let i = 0; i <= rowCount; i++) {
      const y = i * cellSize;
      path += `M0,${y} H${width} `;
    }
    return path.trim();
  }, [width, height, cellSize, rowCount, colCount]);

  const cellsData = useMemo(() => {
    const data: CellData[] = [];
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const key = `${row},${col}`;
        data.push({
          key,
          row,
          col,
          isSelected: selectedCells.has(key),
        });
      }
    }
    return data;
  }, [rowCount, colCount, selectedCells]);

  const outlinePath = useMemo(() => {
    const paths: string[] = [];
    for (const cellKey of selectedCells) {
      const [row, col] = cellKey.split(",").map(Number);
      const x = strokeWidth / 2 + col * cellSize;
      const y = strokeWidth / 2 + row * cellSize;

      if (!selectedCells.has(`${row - 1},${col}`))
        paths.push(`M${x},${y}h${cellSize}`);
      if (!selectedCells.has(`${row},${col + 1}`))
        paths.push(`M${x + cellSize},${y}v${cellSize}`);
      if (!selectedCells.has(`${row + 1},${col}`))
        paths.push(`M${x},${y + cellSize}h${cellSize}`);
      if (!selectedCells.has(`${row},${col - 1}`))
        paths.push(`M${x},${y}v${cellSize}`);
    }
    return paths.join(" ");
  }, [selectedCells, cellSize, strokeWidth]);

  return (
    <div>
      <div>
        <label htmlFor="cellSize">Cell Size: </label>
        <input
          id="cellSize"
          type="range"
          min="10"
          max="100"
          value={cellSize}
          onChange={handleCellSizeChange}
        />
        <span>{cellSize}px</span>
      </div>
      <div>
        <label htmlFor="rowCount">Row Count: </label>
        <input
          id="rowCount"
          type="range"
          min="1"
          max="20"
          value={rowCount}
          onChange={handleRowCountChange}
        />
        <span>{rowCount}</span>
      </div>
      <div>
        <label htmlFor="colCount">Column Count: </label>
        <input
          id="colCount"
          type="range"
          min="1"
          max="20"
          value={colCount}
          onChange={handleColCountChange}
        />
        <span>{colCount}</span>
      </div>
      <button onClick={clearOutOfBoundsCells}>Clear Out-of-Bounds Cells</button>
      <button onClick={fillEnclosedAreas}>Fill Enclosed Areas</button>
      <svg
        width={actualWidth}
        height={actualHeight}
        viewBox={`0 0 ${actualWidth} ${actualHeight}`}
      >
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width}
          height={height}
          fill="white"
          stroke="black"
          strokeWidth={strokeWidth}
        />
        <path
          d={gridLinesPath}
          stroke="black"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <g>
          {cellsData.map((cellData) => (
            <Cell
              {...cellData}
              onClick={handleCellClick}
              cellSize={cellSize}
              strokeWidth={strokeWidth}
            />
          ))}
        </g>
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
          {[...selectedCells].map((cellKey) => (
            <li key={cellKey}>{cellKey}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Grid;
