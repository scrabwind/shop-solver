import type { GridCell } from "@/types/gridPosition";

export default () => useState<GridCell[]>("waypoints", () => []);
