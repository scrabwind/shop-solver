<template>
  <main class="h-screen overflow-hidden text-white">
    <svg
      id="grid"
      ref="gridRef"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      :width="gridSize.cols * nodeSize"
      :height="gridSize.rows * nodeSize"
    >
      <g
        v-for="(row, i) in grid"
        :key="`row-${i}`"
      >
        <g
          v-for="(node, j) in row"
          :key="`rect-${j}-${i}`"
        >
          <rect
            :id="`rect-${j}-${i}`"
            :width="nodeSize"
            :height="nodeSize"
            :x="node.x * nodeSize"
            :y="node.y * nodeSize"
            class="fill-white stroke-slate-950 stroke-1"
            @mousedown="(e) => handleMouseDown(e, node)"
            @mouseup="handleMouseUp"
            @mouseover="(e) => handleMouseOver(e, node)"
            @contextmenu="(e) => removeWaypoint(e, node)"
          />
        </g>
      </g>
      <g id="lines" />
    </svg>
    <button
      class="w-16 h-8 fixed left-0 top-0 bg-black"
      @click="clearGrid"
    >
      clear
    </button>
    <button
      class="w-16 h-8 fixed left-16 top-0 bg-black"
      @click="resetGrid"
    >
      reset
    </button>
    <button
      class="w-16 h-8 fixed left-32 top-0 bg-black"
      @click="solveGrid"
    >
      solve
    </button>
    <button
      class="w-16 h-8 fixed left-48 top-0 bg-black"
      @click="createWaypoint"
    >
      waypoint
    </button>
    <span class="w-16 h-8 fixed left-0 bottom-0 bg-black text-center">{{
      distanceTraveled
    }}</span>
    <span class="w-16 h-8 fixed left-16 bottom-0 bg-black text-center">{{
      `${startPosition.x}, ${endPosition.y}`
    }}</span>
    <span class="w-16 h-8 fixed left-32 bottom-0 bg-black text-center">{{
      `${endPosition.x}, ${endPosition.y}`
    }}</span>
  </main>
</template>

<script setup lang="ts">
  import PF, { DiagonalMovement } from "pathfinding";
  import type { GridCell } from "@/types/gridPosition";

  type MouseMode =
    | "drawWall"
    | "removeWall"
    | "moveStart"
    | "moveEnd"
    | "moveWaypoint"
    | "";

  const { gridSize, nodeSize } = useAppConfig();

  // const startPos = ref<GridCell>({
  //   x: gridSize.cols / 2 - 4,
  //   y: gridSize.rows / 2,
  //   type: "start"
  // });

  // const endPosition = ref<GridCell>({
  //   x: gridSize.cols / 2 + 4,
  //   y: gridSize.rows / 2,
  //   type: "end"
  // });

  const distanceTraveled = ref(0);

  // const grid = ref(new PF.Grid(gridSize.cols, gridSize.rows));

  const mouseMode = ref<MouseMode>("");

  const gridRef = ref<SVGElement | null>(null);

  const waypoints = ref<number[][]>([]);
  const orderedWaypoints = ref<number[][]>([]);

  const clickedWaypointIndex = ref<number>(-1);

  const { grid, startPosition, endPosition } = useGrid();

  const { x: mouseX, y: mouseY } = useMouse();

  const mouseGridPos = computed(() => ({
    x: Math.floor(mouseX.value / 30),
    y: Math.floor(mouseY.value / 30)
  }));

  const compareArrays = (arr1: number[][], arr2: number[][]) => {
    const flattenArr1 = arr1.map((coord) => coord.join(","));
    const flattenArr2 = arr2.map((coord) => coord.join(","));
    const diff = flattenArr1
      .filter((item) => !flattenArr2.includes(item))
      .concat(flattenArr2.filter((item) => !flattenArr1.includes(item)));
    return diff.map((coord) => coord.split(",").map(Number));
  };

  const initNodes = () => {
    const startRect = document.getElementById(
      `rect-${startPosition.value.x}-${startPosition.value.y}`
    );
    const endRect = document.getElementById(
      `rect-${endPosition.value.x}-${endPosition.value.y}`
    );

    if (!startRect || !endRect) return;

    startRect.style.fill = "green";
    endRect.style.fill = "red";
  };

  const handleFill = (node: GridCell) => {
    const { x, y, type } = node;

    const rect = document.getElementById(`rect-${x}-${y}`);
    if (!rect) return;
    if (x === startPosition.value.x && y === startPosition.value.y) return;

    if (x === endPosition.value.x && y === endPosition.value.y) return;

    const inWaypointCords = waypoints.value.map(
      (waypoint) => x === waypoint[0] && y === waypoint[1]
    );

    if (inWaypointCords.includes(true)) return;

    if (mouseMode.value === "drawWall") {
      if (type !== "floor") return;

      grid.value[y][x].type = "wall";
      rect.style.fill = "grey";
    }
    if (mouseMode.value === "removeWall") {
      if (node.type !== "wall") return;

      grid.value[node.x][node.y].type = "floor";
      rect.style.fill = "white";
    }
  };

  const handleMouseDown = (e: MouseEvent, node: GridCell) => {
    // if (!node) {
    //   console.log("xd");

    //   console.log(node);
    //   return;
    // }
    // if (typeof node !== "object" || typeof node === "undefined") {
    //   console.log("xd2");

    //   console.log(node);
    //   return;
    // }
    if (e.button === 2) return;

    const { x, y, type } = node;

    if (x === startPosition.value.x && y === startPosition.value.y) {
      mouseMode.value = "moveStart";
      return;
    }
    if (x === endPosition.value.x && y === endPosition.value.y) {
      mouseMode.value = "moveEnd";
      return;
    }

    const isWaypointCords = waypoints.value.map(
      (waypoint) => x === waypoint[0] && y === waypoint[1]
    );

    if (isWaypointCords.includes(true)) {
      mouseMode.value = "moveWaypoint";
      clickedWaypointIndex.value = waypoints.value.findIndex(
        (waypoint) => x === waypoint[0] && y === waypoint[1]
      );
      if (orderedWaypoints.value.toString() === [x, y].toString()) {
        return;
      }
      orderedWaypoints.value = [...orderedWaypoints.value, [x, y]];
      return;
    }

    mouseMode.value = type === "floor" ? "drawWall" : "removeWall";

    handleFill(node);
  };

  const handleMouseUp = () => {
    mouseMode.value = "";
    clickedWaypointIndex.value = -1;
  };

  const handleMouseOver = (event: MouseEvent, node: GridCell) => {
    if (event.buttons !== 1) {
      return;
    }

    if (mouseMode.value === "moveStart") {
      if (
        grid.value[mouseGridPos.value.y][mouseGridPos.value.x].type === "wall"
      ) {
        return;
      }
      startPosition.value = { ...mouseGridPos.value, ...startPosition.value };
      return;
    }

    if (mouseMode.value === "moveEnd") {
      if (
        grid.value[mouseGridPos.value.y][mouseGridPos.value.x].type === "wall"
      ) {
        return;
      }
      endPosition.value = { ...mouseGridPos.value, ...endPosition.value };
      return;
    }

    if (mouseMode.value === "moveWaypoint") {
      waypoints.value[clickedWaypointIndex.value] = [
        mouseGridPos.value.x,
        mouseGridPos.value.y
      ];
    }

    handleFill(node);
  };

  const removeWaypoint = (event: MouseEvent, node: GridCell) => {
    const results = waypoints.value.filter(
      (waypoint) => waypoint[0] !== node.x && waypoint[1] !== node.y
    );
    if (waypoints.value.length === results.length) return;
    waypoints.value = results;
    orderedWaypoints.value = results;
    event.preventDefault();
  };

  const clearGrid = () => {
    mouseMode.value = "removeWall";
    grid.value.forEach((row) => {
      row.forEach((node) => {
        handleFill(node);
      });
    });

    document.getElementById("lines")?.replaceChildren();

    initNodes();

    mouseMode.value = "";
  };

  const solveGrid = () => {
    // const linesGroup = document.createElementNS(
    //   "http://www.w3.org/2000/svg",
    //   "g"
    // );

    // linesGroup.id = "lines";

    // document.getElementById("grid")?.appendChild(linesGroup);

    const finder = new PF.AStarFinder({
      diagonalMovement: DiagonalMovement.Always
    });

    // const backupGrid = grid.value

    let path: any[] = [];

    let start = startPosition.value;
    let end: any[] = [];

    const newNewWaypoints = [...waypoints.value];

    const wasStart: any[] = [];
    for (let i = 0; i < newNewWaypoints.length; i += 1) {
      // console.log(`i: ${i}`);

      let shortestPath: any[] = [];
      let shortestPathIndex = -1;
      const newWaypoints = [...waypoints.value];

      for (let j = 0; j < newWaypoints.length; j += 1) {
        end = newWaypoints[j];

        const isBad = wasStart.map(
          (v) => v[0] === newWaypoints[j][0] && v[1] === newWaypoints[j][1]
        );

        if (isBad.includes(true)) {
          if (j === newWaypoints.length - 1) {
            start = Object.assign(start, {
              x: newWaypoints[shortestPathIndex][0],
              y: newWaypoints[shortestPathIndex][1]
            });

            wasStart.push(start);
            path.push(shortestPath);
          }
          // eslint-disable-next-line no-continue
          continue;
        }

        const newPath = finder.findPath(
          start.x,
          start.y,
          end[0],
          end[1],
          convertToLibGrid(grid.value)
        );
        if (shortestPath.length === 0 || newPath.length < shortestPath.length) {
          shortestPath = newPath;
          shortestPathIndex = j;
        }
        if (j === newWaypoints.length - 1) {
          start = Object.assign(start, {
            x: newWaypoints[shortestPathIndex][0],
            y: newWaypoints[shortestPathIndex][1]
          });

          wasStart.push(start);
          path.push(shortestPath);
        }
      }
    }
    end = [endPosition.value.x, endPosition.value.y];

    const finalPath = finder.findPath(
      start.x,
      start.y,
      end[0],
      end[1],
      convertToLibGrid(grid.value)
    );

    path.push(finalPath);

    path = path.flat();

    const lines = path.map<SVGLineElement | string>((nodePos, idx, array) => {
      const rect = document.getElementById(`rect-${nodePos[0]}-${nodePos[1]}`);
      if (!rect) return "";

      // if (nodePos[0] === startPosition.value[0] && nodePos[1] === startPosition.value[1])
      //   return;

      // if (nodePos[0] === endPosition.value[0] && nodePos[1] === endPosition.value[1])
      //   return;

      // const inWaypointCords = waypoints.value.map(
      //   (waypoint) => nodePos[0] === waypoint[0] && nodePos[1] === waypoint[1]
      // );

      // if (inWaypointCords.includes(true)) return;

      if (idx + 1 === array.length) return "";

      const {
        left: rectLeft,
        top: rectTop,
        width: rectWidth,
        height: rectHeight
      } = rect.getBoundingClientRect();

      const rect2 = document.getElementById(
        `rect-${array[idx + 1][0]}-${array[idx + 1][1]}`
      );

      if (!rect2) return "";

      const {
        left: rect2Left,
        top: rect2Top,
        width: rect2Width,
        height: rect2Height
      } = rect2.getBoundingClientRect();

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      line.setAttribute("x1", `${rectLeft + rectWidth / 2}`);
      line.setAttribute("x2", `${rect2Left + rect2Width / 2}`);
      line.setAttribute("y1", `${rectTop + rectHeight / 2}`);
      line.setAttribute("y2", `${rect2Top + rect2Height / 2}`);

      line.style.stroke = "black";
      line.style.strokeWidth = "3";
      line.style.shapeRendering = "crispEdges";
      line.style.pointerEvents = "none";
      // line.style.strokeDasharray = "5";

      return line;
    });

    distanceTraveled.value = lines.length;

    const lineContainer = document.getElementById("lines");

    lineContainer?.replaceChildren(...lines);
  };

  const resetGrid = () => {
    clearGrid();

    startPosition.value = Object.assign(startPosition.value, {
      x: 32 - 4,
      y: 16
    });
    endPosition.value = Object.assign(endPosition.value, { x: 32 + 4, y: 16 });

    waypoints.value = [];

    grid.value = initGrid();
  };

  const createWaypoint = () => {
    const reserved = waypoints.value.map(
      (waypoint) => waypoint[0] === 32 && waypoint[1] === 16
    );

    if (reserved.includes(true)) return;

    waypoints.value = [...waypoints.value, [32, 16]];
  };

  watch(startPosition, (newPos, _oldPos) => {
    if (grid.value[newPos.y][newPos.x].type === "wall") return;
    // if (!grid.value.getNodeAt(oldPos[0], oldPos[1]).walkable) return;
    if (newPos.toString() === endPosition.value.toString()) return;
    // oldPos.toString() === endPosition.value.toString()
    // const oldRect = document.getElementById(`rect-${oldPos[0]}-${oldPos[1]}`);
    const newRect = document.getElementById(`rect-${newPos.x}-${newPos.y}`);
    if (!newRect) return;

    // oldRect.style.fill = "white";
    const rects = document.getElementsByTagName("rect");

    Array.from(rects).forEach((rect) => {
      if (rect.style.fill !== "green") return;
      // eslint-disable-next-line no-param-reassign
      rect.style.fill = "white";
    });

    newRect.style.fill = "green";
  });

  watch(endPosition, (newPos, _oldPos) => {
    if (grid.value[newPos.y][newPos.x].type === "wall") return;
    // if (!grid.value.getNodeAt(oldPos[0], oldPos[1]).walkable) return;
    if (
      newPos.toString() === startPosition.value.toString()
      // oldPos.toString() === startPosition.value.toString()
    ) {
      return;
    }
    // const oldRect = document.getElementById(`rect-${oldPos[0]}-${oldPos[1]}`);
    const newRect = document.getElementById(`rect-${newPos.x}-${newPos.y}`);
    if (!newRect) return;

    // oldRect.style.fill = "white";

    const rects = document.getElementsByTagName("rect");

    Array.from(rects).forEach((rect) => {
      if (rect.style.fill !== "red") return;
      // eslint-disable-next-line no-param-reassign
      rect.style.fill = "white";
    });

    newRect.style.fill = "red";
  });

  watch(
    waypoints,
    (newArray, oldArray) => {
      // const waypointStartingPosition = [32, 16].toString();
      // const xd = newArray.map((v) => v.toString());
      // if (
      //   xd.includes(waypointStartingPosition) ||
      //   xd.includes(startPosition.value.toString()) ||
      //   endPosition.value.toString()
      // ) {
      //   return;
      // }
      if (newArray.length === 0) {
        const rects = document.getElementsByTagName("rect");
        Array.from(rects).forEach((rect) => {
          if (rect.style.fill !== "blue") return;
          // eslint-disable-next-line no-param-reassign
          rect.style.fill = "white";
        });
      }

      if (newArray.length > oldArray.length) {
        const result = compareArrays(newArray, oldArray);
        const [x, y] = result[0];

        const rect = document.getElementById(`rect-${x}-${y}`);

        if (!rect) return;

        rect.style.fill = "blue";
      }
      if (clickedWaypointIndex.value !== -1) {
        const [x, y] = waypoints.value[clickedWaypointIndex.value];
        const newRect = document.getElementById(`rect-${x}-${y}`);

        if (!newRect) return;

        const rects = document.getElementsByTagName("rect");

        Array.from(rects).forEach((rect) => {
          if (rect.style.fill !== "blue") return;
          const hasWaypoint = waypoints.value.map(
            (waypoint) => rect.id === `rect-${waypoint[0]}-${waypoint[1]}`
          );

          if (hasWaypoint.includes(true)) return;
          // eslint-disable-next-line no-param-reassign
          rect.style.fill = "white";
        });

        newRect.style.fill = "blue";
      }

      // else {
      //   const result = compareArrays(newArray, oldArray);
      //   const [x, y] = result[0];

      //   const rect = document.getElementById(`rect-${x}-${y}`);

      //   if (!rect) return;

      //   rect.style.fill = "white";
      // }
    },
    { deep: true }
  );

  onMounted(() => {
    initNodes();
  });
</script>
