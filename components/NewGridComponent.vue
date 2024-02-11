<template>
  <main class="h-screen overflow-hidden">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      :width="gridSize[0] * nodeSize"
      :height="gridSize[1] * nodeSize"
    >
      <g
        v-for="(row, i) in grid?.nodes"
        :key="`row-${i}`"
      >
        <rect
          v-for="(node, j) in row"
          :id="`rect-${j}-${i}`"
          :key="`rect-${j}-${i}`"
          :width="nodeSize"
          :height="nodeSize"
          :x="node.x * nodeSize"
          :y="node.y * nodeSize"
          class="fill-white stroke-slate-950 stroke-1"
          @mousedown="() => handleMouseDown(node)"
          @mouseup="handleMouseUp"
          @mouseover="(e) => handleMouseOver(e, node)"
        />
      </g>
    </svg>
    <button
      class="w-16 h-8 fixed left-0 top-0 bg-black"
      @click="clearGrid"
    >
      clear
    </button>
    <button
      class="w-16 h-8 fixed left-16 top-0 bg-black"
      @click="solveGrid"
    >
      solve
    </button>
    <div class="w-16 h-8 fixed left-32 top-0 bg-black">
      {{ mouseGridPos }}
    </div>
    <div class="w-16 h-8 fixed left-48 top-0 bg-black">
      {{ startPos }}
    </div>
  </main>
</template>

<script setup lang="ts">
  import PF, { type Node } from "pathfinding";

  type MouseMode = "drawWall" | "removeWall" | "moveStart" | "moveEnd" | "";

  const nodeSize = 30;
  const gridSize = [64, 32];

  const startPos = ref([32 - 4, 16]);
  const endPos = ref([32 + 4, 16]);

  const grid = ref(new PF.Grid(gridSize[0], gridSize[1]));
  const mouseMode = ref<MouseMode>("");

  const { x: mouseX, y: mouseY } = useMouse();

  const mouseGridPos = computed(() => [
    Math.floor(mouseX.value / 30),
    Math.floor(mouseY.value / 30)
  ]);

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
    if (node.x === startPos.value[0] && node.y === startPos.value[1]) {
      return;
    }
    if (node.x === endPos.value[0] && node.y === endPos.value[1]) {
      return;
    }
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

    // if (mouseMode.value === "moveStart") {
    //   rect.style.fill = "green";
    // }
    // if (mouseMode.value === "moveEnd") {
    //   rect.style.fill = "red";
    // }
  };

  const handleMouseDown = (node: Node) => {
    const { x, y, walkable } = node;

    if (x === startPos.value[0] && y === startPos.value[1]) {
      mouseMode.value = "moveStart";
      return;
    }
    if (x === endPos.value[0] && y === endPos.value[1]) {
      mouseMode.value = "moveEnd";
      return;
    }

    mouseMode.value = walkable ? "drawWall" : "removeWall";

    handleFill(node);
  };

  const handleMouseUp = () => {
    mouseMode.value = "";
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
    handleFill(node);
  };

  const clearGrid = () => {
    mouseMode.value = "removeWall";
    grid.value.nodes.forEach((row) => {
      row.forEach((node) => {
        handleFill(node);
      });
    });

    const rects = document.getElementsByTagName("rect");

    Array.from(rects).forEach((rect) => {
      if (rect.style.fill !== "yellow") return;
      // eslint-disable-next-line no-param-reassign
      rect.style.fill = "white";
    });

    initNodes();

    mouseMode.value = "";
  };

  const solveGrid = () => {
    const rects = document.getElementsByTagName("rect");

    Array.from(rects).forEach((rect) => {
      if (rect.style.fill !== "yellow") return;
      // eslint-disable-next-line no-param-reassign
      rect.style.fill = "white";
    });

    const finder = new PF.AStarFinder();

    const backupGrid = grid.value.clone();

    const path = finder.findPath(
      startPos.value[0],
      startPos.value[1],
      endPos.value[0],
      endPos.value[1],
      grid.value
    );

    path.shift();

    path.pop();

    path.forEach((nodePos) => {
      const rect = document.getElementById(`rect-${nodePos[0]}-${nodePos[1]}`);
      if (!rect) return;
      rect.style.fill = "yellow";
    });

    grid.value = backupGrid;
  };

  watch(startPos, (newPos, _oldPos) => {
    if (!grid.value.getNodeAt(newPos[0], newPos[1]).walkable) return;
    // if (!grid.value.getNodeAt(oldPos[0], oldPos[1]).walkable) return;
    if (
      newPos.toString() === endPos.value.toString()
      // oldPos.toString() === endPos.value.toString()
    )
      return;
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

  // watchEffect(() => {
  //   if (
  //     grid.value.getNodeAt(mouseGridPos.value[0], mouseGridPos.value[1])
  //       .walkable
  //   ) {
  //     return;
  //   }
  //   const oldRect = document.getElementById(`rect-${oldPos[0]}-${oldPos[1]}`);
  //   const newRect = document.getElementById(`rect-${newPos[0]}-${newPos[1]}`);
  //   if (!oldRect || !newRect) return;
  //   oldRect.style.fill = "white";
  //   newRect.style.fill = "red";
  // });

  onMounted(() => {
    initNodes();
  });
</script>
