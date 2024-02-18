import type { GridPosition } from "@/types/gridPosition";

export default () => useState<GridPosition[]>("waypoints", () => []);
