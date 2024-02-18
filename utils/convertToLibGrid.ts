import PF, { type Grid } from "pathfinding";
import type { GridCell } from "@/types/gridPosition";

export default (grid: GridCell[][]): Grid => {
  const { gridSize } = useAppConfig();
  const libGrid = new PF.Grid(gridSize.cols, gridSize.rows);
  grid.forEach((row) =>
    row.forEach((cell) => {
      libGrid.setWalkableAt(cell.x, cell.y, cell.type !== "wall");
    })
  );

  return libGrid;
};
