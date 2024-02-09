<template>
  <main>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      :width="gridSize[0] * nodeSize"
      :height="gridSize[1] * nodeSize"
    >
      <g
        v-for="(_, i) in grid.height"
        :key="`row-${i}`"
      >
        <rect
          v-for="(_, j) in grid.width"
          :key="`column-${j}`"
          :width="nodeSize"
          :height="nodeSize"
          fill="white"
        />
      </g>
    </svg>
  </main>
</template>

<script setup lang="ts">
  import PF from "pathfinding";

  const nodeSize = 30;
  const gridSize = [64, 36];

  const grid = ref(new PF.Grid(gridSize[0], gridSize[1]));

  console.log(grid.value?.nodes);
</script>
