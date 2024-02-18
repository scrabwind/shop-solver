<template>
  <main class="h-screen overflow-hidden text-white">
    <svg
      id="grid"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      :width="gridSize[0] * nodeSize"
      :height="gridSize[1] * nodeSize"
    >
      <g
        v-for="(row, i) in grid?.nodes"
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
  </main>
</template>

<script setup lang="ts">
  import PF, { DiagonalMovement, type Node } from "pathfinding";

  type MouseMode =
    | "drawWall"
    | "removeWall"
    | "moveStart"
    | "moveEnd"
    | "moveWaypoint"
    | "";

  const nodeSize = 30;
  const gridSize = [64, 32];

  const startPos = ref([32 - 4, 16]);
  const endPos = ref([32 + 4, 16]);

  const distanceTraveled = ref(0);

  const grid = ref(new PF.Grid(gridSize[0], gridSize[1]));
  const mouseMode = ref<MouseMode>("");

  const waypoints = ref<number[][]>([]);
  const orderedWaypoints = ref<number[][]>([]);

  const clickedWaypointIndex = ref<number>(-1);

  const { x: mouseX, y: mouseY } = useMouse();

  const mouseGridPos = computed(() => [
    Math.floor(mouseX.value / 30),
    Math.floor(mouseY.value / 30)
  ]);

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
      `rect-${startPos.value[0]}-${startPos.value[1]}`
    );
    const endRect = document.getElementById(
      `rect-${endPos.value[0]}-${endPos.value[1]}`
    );

    if (!startRect || !endRect) return;

    startRect.style.fill = "green";
    endRect.style.fill = "red";
  };

  const handleFill = (node: Node) => {
    const rect = document.getElementById(`rect-${node.x}-${node.y}`);
    if (!rect) return;
    if (node.x === startPos.value[0] && node.y === startPos.value[1]) return;

    if (node.x === endPos.value[0] && node.y === endPos.value[1]) return;

    const inWaypointCords = waypoints.value.map(
      (waypoint) => node.x === waypoint[0] && node.y === waypoint[1]
    );

    if (inWaypointCords.includes(true)) return;

    if (mouseMode.value === "drawWall") {
      if (!node.walkable) return;
      grid.value?.setWalkableAt(node.x, node.y, false);
      rect.style.fill = "grey";
      return;
    }
    if (mouseMode.value === "removeWall") {
      if (node.walkable) return;
      grid.value?.setWalkableAt(node.x, node.y, true);
      rect.style.fill = "white";
    }
  };

  const handleMouseDown = (e: MouseEvent, node: Node) => {
    if (e.button === 2) return;

    const { x, y, walkable } = node;

    if (x === startPos.value[0] && y === startPos.value[1]) {
      mouseMode.value = "moveStart";
      return;
    }
    if (x === endPos.value[0] && y === endPos.value[1]) {
      mouseMode.value = "moveEnd";
      return;
    }

    const isWaypointCords = waypoints.value.map(
      (waypoint) => node.x === waypoint[0] && node.y === waypoint[1]
    );

    if (isWaypointCords.includes(true)) {
      mouseMode.value = "moveWaypoint";
      clickedWaypointIndex.value = waypoints.value.findIndex(
        (waypoint) => node.x === waypoint[0] && node.y === waypoint[1]
      );
      if (orderedWaypoints.value.toString() === [node.x, node.y].toString()) {
        return;
      }
      orderedWaypoints.value = [...orderedWaypoints.value, [node.x, node.y]];
      return;
    }

    mouseMode.value = walkable ? "drawWall" : "removeWall";

    handleFill(node);
  };

  const handleMouseUp = () => {
    mouseMode.value = "";
    clickedWaypointIndex.value = -1;
  };

  const handleMouseOver = (event: MouseEvent, node: Node) => {
    if (event.buttons !== 1) {
      return;
    }

    if (mouseMode.value === "moveStart") {
      if (
        !grid.value.getNodeAt(mouseGridPos.value[0], mouseGridPos.value[1])
          .walkable
      ) {
        return;
      }
      startPos.value = mouseGridPos.value;
      return;
    }

    if (mouseMode.value === "moveEnd") {
      if (
        !grid.value.getNodeAt(mouseGridPos.value[0], mouseGridPos.value[1])
          .walkable
      ) {
        return;
      }
      endPos.value = mouseGridPos.value;
      return;
    }

    if (mouseMode.value === "moveWaypoint") {
      waypoints.value[clickedWaypointIndex.value] = mouseGridPos.value;
    }

    handleFill(node);
  };

  const removeWaypoint = (event: MouseEvent, node: Node) => {
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
    grid.value.nodes.forEach((row) => {
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

    const backupGrid = grid.value.clone();

    let path: any[] = [];

    let start = startPos.value;
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
            start = newWaypoints[shortestPathIndex];

            wasStart.push(start);
            path.push(shortestPath);
          }
          // eslint-disable-next-line no-continue
          continue;
        }

        const newPath = finder.findPath(
          start[0],
          start[1],
          end[0],
          end[1],
          grid.value.clone()
        );
        if (shortestPath.length === 0 || newPath.length < shortestPath.length) {
          shortestPath = newPath;
          shortestPathIndex = j;
        }
        if (j === newWaypoints.length - 1) {
          start = newWaypoints[shortestPathIndex];

          wasStart.push(start);
          path.push(shortestPath);
        }
      }
    }
    end = endPos.value;

    const finalPath = finder.findPath(
      start[0],
      start[1],
      end[0],
      end[1],
      grid.value.clone()
    );

    path.push(finalPath);

    path = path.flat();

    const lines = path.map<SVGLineElement | string>((nodePos, idx, array) => {
      const rect = document.getElementById(`rect-${nodePos[0]}-${nodePos[1]}`);
      if (!rect) return "";

      // if (nodePos[0] === startPos.value[0] && nodePos[1] === startPos.value[1])
      //   return;

      // if (nodePos[0] === endPos.value[0] && nodePos[1] === endPos.value[1])
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

    grid.value = backupGrid;
  };

  const resetGrid = () => {
    clearGrid();

    startPos.value = [32 - 4, 16];
    endPos.value = [32 + 4, 16];

    waypoints.value = [];

    grid.value = new PF.Grid(gridSize[0], gridSize[1]);
  };

  const createWaypoint = () => {
    const reserved = waypoints.value.map(
      (waypoint) => waypoint[0] === 32 && waypoint[1] === 16
    );

    if (reserved.includes(true)) return;

    waypoints.value = [...waypoints.value, [32, 16]];
  };

  watch(startPos, (newPos, _oldPos) => {
    if (!grid.value.getNodeAt(newPos[0], newPos[1]).walkable) return;
    // if (!grid.value.getNodeAt(oldPos[0], oldPos[1]).walkable) return;
    if (newPos.toString() === endPos.value.toString()) return;
    // oldPos.toString() === endPos.value.toString()
    // const oldRect = document.getElementById(`rect-${oldPos[0]}-${oldPos[1]}`);
    const newRect = document.getElementById(`rect-${newPos[0]}-${newPos[1]}`);
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

  watch(endPos, (newPos, _oldPos) => {
    if (!grid.value.getNodeAt(newPos[0], newPos[1]).walkable) return;
    // if (!grid.value.getNodeAt(oldPos[0], oldPos[1]).walkable) return;
    if (
      newPos.toString() === startPos.value.toString()
      // oldPos.toString() === startPos.value.toString()
    ) {
      return;
    }
    // const oldRect = document.getElementById(`rect-${oldPos[0]}-${oldPos[1]}`);
    const newRect = document.getElementById(`rect-${newPos[0]}-${newPos[1]}`);
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
      //   xd.includes(startPos.value.toString()) ||
      //   endPos.value.toString()
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
