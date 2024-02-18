import type { Node as GridNode } from "pathfinding";

export interface GridCell extends Omit<GridNode, "walkable"> {
  type: "start" | "end" | "waypoint" | "wall" | "floor";
}
