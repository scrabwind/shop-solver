import type { GridPosition } from "@/types/gridPosition";

export default () => {
  const { gridSize } = useAppConfig();
  return useState<GridPosition>("startPosition", () => ({
    x: gridSize.x / 2 - 4,
    y: gridSize.y / 2
  }));
};
