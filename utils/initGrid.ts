import type { GridCell } from "@/types/gridPosition";

export default (): GridCell[][] => {
  const { gridSize } = useAppConfig();

  return Array.from({ length: gridSize.rows }, (_, y) =>
    Array.from({ length: gridSize.cols }, (_v, x) => ({
      x,
      y,
      type: "floor"
    }))
  );
};
