import React, { useState, useMemo, useCallback } from "react";
import styles from "./Grid.module.css";

type CellProps = {
  row: number;
  col: number;
  cellSize: number;
  strokeWidth: number;
  color: string | undefined;
  hasOutline: boolean;
  onToggle: (row: number, col: number) => void;
};

const Cell: React.FC<CellProps> = React.memo(
  ({ row, col, cellSize, strokeWidth, color, hasOutline, onToggle }) => {
    const handleClick = useCallback(() => {
      onToggle(row, col);
    }, [onToggle, row, col]);

    return (
      <rect
        className={styles.cell}
        x={strokeWidth / 2 + col * cellSize}
        y={strokeWidth / 2 + row * cellSize}
        width={cellSize}
        height={cellSize}
        fill={color || "white"}
        stroke="black"
        strokeWidth={strokeWidth}
        onClick={handleClick}
      />
    );
  }
);

type HistoryEntry = {
  cells: Map<string, { color: string; hasOutline: boolean }>;
  lastAction: string;
};

const Grid: React.FC = () => {
  const [cellSize, setCellSize] = useState(30);
  const [rowCount, setRowCount] = useState(10);
  const [colCount, setColCount] = useState(10);
  const strokeWidth = 1;

  const width = cellSize * colCount;
  const height = cellSize * rowCount;
  const actualWidth = width + strokeWidth;
  const actualHeight = height + strokeWidth;

  const [history, setHistory] = useState<HistoryEntry[]>([
    { cells: new Map(), lastAction: "Initial state" },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showOutline, setShowOutline] = useState(true);

  const cellStates = useMemo(
    () => history[historyIndex].cells,
    [history, historyIndex]
  );

  const updateHistory = useCallback(
    (
      newCellStates: Map<string, { color: string; hasOutline: boolean }>,
      action: string
    ) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push({ cells: new Map(newCellStates), lastAction: action });
        return newHistory;
      });
      setHistoryIndex((prevIndex) => prevIndex + 1);
    },
    [historyIndex]
  );

  const handleCellToggle = useCallback(
    (row: number, col: number) => {
      const key = `${row},${col}`;
      const newCellStates = new Map(cellStates);
      const currentState = newCellStates.get(key);

      if (
        currentState?.color === selectedColor &&
        currentState?.hasOutline === showOutline
      ) {
        newCellStates.delete(key);
        updateHistory(newCellStates, `Cleared cell (${row}, ${col})`);
      } else {
        newCellStates.set(key, {
          color: selectedColor,
          hasOutline: showOutline,
        });
        updateHistory(
          newCellStates,
          `Colored cell (${row}, ${col}) with ${selectedColor}`
        );
      }
    },
    [cellStates, selectedColor, showOutline, updateHistory]
  );

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
    const newCellStates = new Map<
      string,
      { color: string; hasOutline: boolean }
    >();
    for (const [key, state] of cellStates) {
      const [row, col] = key.split(",").map(Number);
      if (row < rowCount && col < colCount) {
        newCellStates.set(key, state);
      }
    }
    updateHistory(newCellStates, "Cleared out-of-bounds cells");
  }, [cellStates, rowCount, colCount, updateHistory]);

  const clearAllCells = useCallback(() => {
    updateHistory(new Map(), "Cleared all cells");
  }, [updateHistory]);

  const fillEnclosedAreas = useCallback(() => {
    const isColored = (row: number, col: number) =>
      cellStates.has(`${row},${col}`);
    const isValid = (row: number, col: number) =>
      row >= 0 && row < rowCount && col >= 0 && col < colCount;

    const dfs = (row: number, col: number, visited: Set<string>): boolean => {
      if (!isValid(row, col)) {
        return false; // グリッドの端に到達した場合、閉じていない
      }
      if (isColored(row, col)) {
        return true; // 色付きのセルに到達
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

    const newCellStates = new Map(cellStates);

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (!isColored(row, col)) {
          const visited = new Set<string>();
          if (dfs(row, col, visited)) {
            // 閉じた領域を発見したので、訪問したすべてのセルを選択色で塗る
            for (const cell of visited) {
              newCellStates.set(cell, {
                color: selectedColor,
                hasOutline: showOutline,
              });
            }
          }
        }
      }
    }

    updateHistory(newCellStates, "Filled enclosed areas");
  }, [
    cellStates,
    rowCount,
    colCount,
    selectedColor,
    showOutline,
    updateHistory,
  ]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
    }
  }, [history.length, historyIndex]);

  const restoreHistory = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        setHistoryIndex(index);
      }
    },
    [history.length]
  );

  const cellsData = useMemo(() => {
    const data: { key: string; row: number; col: number }[] = [];
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        data.push({ key: `${row},${col}`, row, col });
      }
    }
    return data;
  }, [rowCount, colCount]);

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

  const outlinePath = useMemo(() => {
    const paths: string[] = [];
    for (const [key, { hasOutline }] of cellStates) {
      if (!hasOutline) continue;
      const [row, col] = key.split(",").map(Number);
      const x = strokeWidth / 2 + col * cellSize;
      const y = strokeWidth / 2 + row * cellSize;

      if (!cellStates.get(`${row - 1},${col}`)?.hasOutline)
        paths.push(`M${x},${y}h${cellSize}`);
      if (!cellStates.get(`${row},${col + 1}`)?.hasOutline)
        paths.push(`M${x + cellSize},${y}v${cellSize}`);
      if (!cellStates.get(`${row + 1},${col}`)?.hasOutline)
        paths.push(`M${x},${y + cellSize}h${cellSize}`);
      if (!cellStates.get(`${row},${col - 1}`)?.hasOutline)
        paths.push(`M${x},${y}v${cellSize}`);
    }
    return paths.join(" ");
  }, [cellStates, cellSize, strokeWidth]);

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
  ];

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
      <div>
        <h3>Color Palette:</h3>
        {colors.map((color) => (
          <button
            key={color}
            style={{
              backgroundColor: color,
              width: "30px",
              height: "30px",
              margin: "0 5px",
              border:
                color === selectedColor ? "3px solid black" : "1px solid gray",
            }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={showOutline}
            onChange={() => setShowOutline((prev) => !prev)}
          />
          Show Outline for New Cells
        </label>
      </div>
      <button onClick={clearOutOfBoundsCells}>Clear Out-of-Bounds Cells</button>
      <button onClick={fillEnclosedAreas}>Fill Enclosed Areas</button>
      <button onClick={clearAllCells}>Clear All Cells</button>
      <button onClick={undo} disabled={historyIndex === 0}>
        Undo
      </button>
      <button onClick={redo} disabled={historyIndex === history.length - 1}>
        Redo
      </button>
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
          stroke="#a0a0a0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <g>
          {cellsData.map(({ key, row, col }) => {
            const cellState = cellStates.get(key);
            return (
              <Cell
                key={key}
                row={row}
                col={col}
                cellSize={cellSize}
                strokeWidth={strokeWidth}
                color={cellState?.color}
                hasOutline={cellState?.hasOutline ?? false}
                onToggle={handleCellToggle}
              />
            );
          })}
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
        <h3>History:</h3>
        <ul>
          {history.map((entry, index) => (
            <li
              key={index}
              style={{
                fontWeight: index === historyIndex ? "bold" : "normal",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => restoreHistory(index)}
            >
              {entry.lastAction} - {entry.cells.size} cells modified
              {index === historyIndex && " (current)"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Grid;
