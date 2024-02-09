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
      class="w-16 h-8 fixed left-0 top-0 bg-black"
      @click="solveGrid"
    >
      solve
    </button>
  </main>
</template>

<script setup lang="ts">
  import PF, { type Node } from "pathfinding";

  type MouseMode = "drawWall" | "removeWall" | "moveStart" | "moveEnd" | "";

  const nodeSize = 30;
  const gridSize = [64, 32];

  const startPos = [32 - 4, 16];
  const endPos = [32 + 4, 16];

  const grid = ref(new PF.Grid(gridSize[0], gridSize[1]));
  const mouseMode = ref<MouseMode>("");

  const initNodes = () => {
    const startRect = document.getElementById(
      `rect-${startPos[0]}-${startPos[1]}`
    );
    const endRect = document.getElementById(`rect-${endPos[0]}-${endPos[1]}`);

    if (!startRect || !endRect) return;

    startRect.style.fill = "green";
    endRect.style.fill = "red";
  };

  const handleFill = (node: Node) => {
    const rect = document.getElementById(`rect-${node.x}-${node.y}`);
    if (!rect) return;
    if (node.x === startPos[0] && node.y === startPos[1]) {
      rect.style.fill = "green";
      return;
    }
    if (node.x === endPos[0] && node.y === endPos[1]) {
      rect.style.fill = "red";
      return;
    }
    if (mouseMode.value === "drawWall") {
      if (!node.walkable) return;
      grid.value?.setWalkableAt(node.x, node.y, false);
      rect.style.fill = "grey";
    }
    if (mouseMode.value === "removeWall") {
      if (node.walkable) return;
      grid.value?.setWalkableAt(node.x, node.y, true);
      rect.style.fill = "white";
    }
  };

  // const movePos = (_node: Node) => {};

  const handleMouseDown = (node: Node) => {
    const { x, y, walkable } = node;
    const [startX, startY] = startPos;
    const [endX, endY] = endPos;

    if (x === startX && y === startY) {
      mouseMode.value = "moveStart";
      return;
    }
    if (x === endX && y === endY) {
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
    handleFill(node);
  };

  const clearGrid = () => {
    mouseMode.value = "removeWall";
    grid.value.nodes.forEach((row) => {
      row.forEach((node) => {
        handleFill(node);
      });
    });
    initNodes();

    mouseMode.value = "";
  };

  const solveGrid = () => {};

  onMounted(() => {
    initNodes();
  });
</script>
