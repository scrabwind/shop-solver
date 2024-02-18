import PF from "pathfinding";

export default () => {
  const { gridSize } = useAppConfig();
  const grid = new PF.Grid(gridSize.x, gridSize.y);
  const state = useState("grid", () => grid);
  const reset = () => (state.value = grid);

  return { grid: state, reset };
};
