<template>
  <ClientOnly>
    <main
      id="draw-area"
      class="flex flex-col justify-center align-center max-w-screen max-h-screen overflow-hidden"
    >
      <svg
        :width="cellWidth * width"
        :height="cellHeight * height"
      >
        <g
          v-for="(row, y) in matrix"
          :id="`row-${y}`"
          :key="`row-${y}`"
        >
          <rect
            v-for="(cell, x) in row"
            :id="`cell-${x}-${y}`"
            :key="`cell-${x}-${y}`"
            :width="cellWidth"
            :height="cellHeight"
            :x="`${cellWidth * x}px`"
            :y="`${cellHeight * y}px`"
            :data-column="x"
            :data-row="y"
            class="stroke-slate-900"
            :style="handleStyles(x, y)"
            @mouseover="(e) => handleMouseover(e, cell, y, x)"
            @mousedown="(e) => handleMouseover(e, cell, y, x)"
          />
        </g>
      </svg>
      <button
        class="w-16 h-8 fixed top-0 right-2/4 translate-x-1/2 bg-black"
        @click="
          () => {
            matrix = initMatrix();
            wasDraggedMatrix = initMatrix();
            clearYellows();
          }
        "
      >
        clear
      </button>
      <button
        class="w-16 h-8 fixed top-0 right-3/4 bg-black"
        @click="solveMaze"
      >
        start
      </button>
    </main>
  </ClientOnly>
</template>

<script setup lang="ts">
  import { clone } from "ramda";
  import PF from "pathfinding";

  const width = 40;
  const height = 40;
  const cellWidth = 50;
  const cellHeight = 50;

  const startPos = ref<number[]>([width / 2 - 6, 8]);
  const endPos = ref<number[]>([width / 2 + 4, 8]);

  // const initStartEndPos = () => {
  //   const [startX, startY] = [width / 2 - 6, 8];
  //   const [endX, endY] = [width / 2 + 6, 8];

  //   startPos.value = [startX, startY];
  //   endPos.value = [endX, endY];

  //   const startElement = document.getElementById(`cell-${startX}-${startY}`);
  //   const endElement = document.getElementById(`cell-${endX}-${endY}`);

  //   if (!startElement || !endElement) return;
  //   startElement.dataset.start = "true";
  //   endElement.dataset.end = "true";
  // };

  const solvedGrid = ref<number[][]>([]);

  const initMatrix = (): boolean[][] =>
    Array(width).fill(Array(height).fill(false));

  const clearYellows = () => {
    const rects = document.getElementsByTagName("rect");
    if (!rects) return;
    Array.from(rects).forEach((v) => {
      if (v.style.fill === "yellow") {
        // eslint-disable-next-line no-param-reassign
        v.style.fill = "white";
      }
    });
  };

  const matrix = ref(initMatrix());

  const wasDraggedMatrix = ref(initMatrix());

  useEventListener("mouseup", () => {
    wasDraggedMatrix.value = initMatrix();
  });

  const handleMouseover = (
    e: MouseEvent,
    value: boolean,
    y: number,
    x: number
  ) => {
    if (!e.buttons) return;

    if (wasDraggedMatrix.value[y][x]) return;

    if ([x, y].toString() === startPos.value.toString()) return;
    if ([x, y].toString() === endPos.value.toString()) return;

    const row = clone(matrix.value[y]);
    const wasDraggedRow = clone(wasDraggedMatrix.value[y]);

    row.splice(x, 1, !value);
    wasDraggedRow.splice(x, 1, true);

    matrix.value.splice(y, 1, row);
    wasDraggedMatrix.value.splice(y, 1, wasDraggedRow);
  };

  const handleStyles = (x: number, y: number) => {
    if ([x, y].toString() === startPos.value.toString()) return "fill: green";
    if ([x, y].toString() === endPos.value.toString()) return "fill: red";
    if (matrix.value[y][x] === true) return "fill: grey";
    return "fill: white";
  };

  const solveMaze = () => {
    const [startX, startY] = startPos.value;
    const [endX, endY] = endPos.value;
    const newMatrix = matrix.value.map((col) => col.map((v) => (v ? 1 : 0)));
    const grid = new PF.Grid(newMatrix);

    const finder = new PF.AStarFinder();

    const solved = finder.findPath(startX, startY, endX, endY, grid);

    solved.shift();
    solved.pop();
    solvedGrid.value = solved;
  };

  watch(solvedGrid, (value, oldValue) => {
    if (value.toString() === oldValue.toString()) return;
    clearYellows();
    value.forEach((v) => {
      const rect = document.getElementById(`cell-${v[0]}-${v[1]}`);
      if (!rect) return;
      rect.style.fill = "yellow";
    });
  });

  // onMounted(() => {
  //   initStartEndPos();
  // });
</script>
