import type { GridCell } from "@/types/gridPosition";

export type UseGrid = {
  grid: Ref<GridCell[][]>;
  startPosition: Ref<GridCell>;
  endPosition: Ref<GridCell>;
};

export default (): UseGrid => {
  const { gridSize } = useAppConfig();

  const grid = initGrid();

  // return {
  //   grid: useState("grid", () => grid),
  //   startPosition: useState("startPosition", () => ({
  //     x: gridSize.cols / 2 - 4,
  //     y: gridSize.rows / 2,
  //     type: "start"
  //   })),
  //   endPosition: useState("endPosition", () => ({
  //     x: gridSize.cols / 2 + 4,
  //     y: gridSize.rows / 2,
  //     type: "end"
  //   }))
  // };

  return {
    grid: ref(grid),
    startPosition: ref({
      x: gridSize.cols / 2 - 4,
      y: gridSize.rows / 2,
      type: "start"
    }),
    endPosition: ref({
      x: gridSize.cols / 2 + 4,
      y: gridSize.rows / 2,
      type: "end"
    })
  };
};
