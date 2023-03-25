
/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// the main meat of the simulation and infinite grid
let state = {
  // limit how far in and out you can zoom.
  // -- really only necessary for zooming out, because it just crashes if you zoom too far out
  // -- too many lines
  MAX_ZOOM: 4,
  MIN_ZOOM: 0.3,
  // play state
  simulationPaused: true,
  // current zoom level
  zoom: 1,
  // 
  _height: canvas.height,
  _width: canvas.width,
  /**
   * @type {{x: number, y: number}[]}
   */
  cells: [],
  // current mouse state
  mouse: {
    // "drag" "insert"
    tool: "drag",
    down: false,
    // keep track of old pos (click)
    // and new pos (current during drag)
    oldPos: { x: 0, y: 0 },
    newPos: { x: 0, y: 0 },
  },
  // the canvas offset
  // allows the canvas to be drug around, and still render everything
  // correctly
  offset: {
    x: 0, y: 0,
  },
  // size of each cell
  gridSize: 50,

}


const play = document.getElementById("play-pause");
const drag = document.getElementById("drag-hand");
const insert = document.getElementById("insert-hand");
const upload = document.getElementById("upload-position");

// Util events
// set cursor to drag screen
drag.onclick = (ev) => {
  if (drag.classList.contains("active")) return;
  else {
    state.mouse.tool = "drag";

    canvas.classList.remove("insert");
    canvas.classList.add("drag");
    insert.classList.remove("active");
    drag.classList.add("active");
  }
}
// set cursor to update cells
insert.onclick = (ev) => {
  if (insert.classList.contains("active")) return;
  else {
    state.mouse.tool = "insert";

    canvas.classList.remove("drag");
    canvas.classList.add("insert");
    drag.classList.remove("active");
    insert.classList.add("active");
  }
}
// play/pause simulation
play.onclick = () => {
  state.simulationPaused = !state.simulationPaused;

  if (state.simulationPaused) {
    // set to play icon
    play.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.861 163.861" xml:space="preserve"><g><path d="M34.857,3.613C20.084-4.861,8.107,2.081,8.107,19.106v125.637c0,17.042,11.977,23.975,26.75,15.509L144.67,97.275 c14.778-8.477,14.778-22.211,0-30.686L34.857,3.613z" /></g></svg>`
  } else {
    // set to pause icon
    play.innerHTML = `<svg viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="8" x2="12" y2="30" stroke="white" stroke-width="8" stroke-linecap="round"/><line x1="27" y1="8" x2="27" y2="30" stroke="white" stroke-width="8" stroke-linecap="round"/></svg>`
  }
}

upload.onchange = (ev) => {
  const files = ev.target.files;
  const f = files[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const res = ev.target.result;
    const data = JSON.parse(res);

    state.cells = data.data;
    draw();
  }

  reader.readAsText(f);



}

// main loop
setInterval(() => {
  simulation();
}, 30);


function simulation() {
  if (state.simulationPaused) return;
  // main simulation logic

  // CALCULATE NEXT GENERATION
  /**
   * @type {{x: number, y: number}[]}
   */
  const toKillCells = [];

  // for each current cell
  for (const cell of state.cells) {
    // count the amount of neighbors
    const nCount = calculateNeighbors(cell.x, cell.y);

    // 1. Any live cell with fewer than two live neighbours dies, as if by underpopulation.
    if (nCount < 2)
      toKillCells.push({ x: cell.x, y: cell.y });

    // 2. Any live cell with two or three live neighbours lives on to the next generation.
    else if (nCount < 4 && nCount > 1)
      continue;

    // 3. Any live cell with more than three live neighbours dies, as if by overpopulation.
    else if (nCount > 3)
      toKillCells.push({ x: cell.x, y: cell.y });
  }
  // Find dead cells that need to be evauluated
  const nearbyDeadCellList = getDeadCells();

  /**
   * Next generation cells to come to life
   * @type {{x: number, y: number}[]}
   */
  const cellsToBeBorn = [];

  // for each dead cell nearby live cells
  for (const c of nearbyDeadCellList) {
    // there are duplicates, and this just feels like the best way to handle that
    if (cellsToBeBorn.find(v => v.x === c.x && v.y === c.y)) continue;
    // Count neighbors living cells
    const nCount = calculateNeighbors(c.x, c.y);
    // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    if (nCount === 3) cellsToBeBorn.push({ x: c.x, y: c.y });
  }

  // UPDATE TO GENERATION
  for (const cell of toKillCells) {
    const index = state.cells.findIndex(v => v.x === cell.x && v.y === cell.y);
    state.cells.splice(index, 1);
  }
  for (const cell of cellsToBeBorn) {
    state.cells.push(cell);
  }

  draw();
}

/**
 * Calculates the living count of neighbors next to the 
 * current x y coords
 * @param {number} x 
 * @param {number} y 
 * 
 * ---
 * |x|
 * --- : 8 total neighbors to check
 */
function calculateNeighbors(x, y) {
  let count = 0;
  for (let j = -1; j < 2; j++) {
    for (let i = -1; i < 2; i++) {
      if (j === 0 && i === 0) continue;
      const found = state.cells.find((cell) => cell.x === x + j && cell.y === y + i);
      if (found) count++;
    }
  }
  return count;
}

/**
 * Function that fetches every DEAD cell that is surounding currently living cells
 * Dead cells are not stored, so I just use the areas that are not occupied by living cells
 * that are also nearby living cells
 * @returns {{x: number, y: number}[]}
 */
function getDeadCells() {
  /**
   * @type {{x: number, y: number}[]}
   */
  const list = [];
  for (const cell of state.cells) {

    for (let j = -1; j < 2; j++) {
      for (let i = -1; i < 2; i++) {
        if (j === 0 && i === 0) continue;
        const found = state.cells.find((v) => v.x === (cell.x + j) && v.y === (cell.y + i));
        if (found) continue;

        list.push({ x: cell.x + j, y: cell.y + i });
      }
    }

  }
  return list;
}

function draw() {
  ctx.fillStyle = "#424549";
  // reset the canvas
  ctx.fillRect(0, 0, state._width, state._height);

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";

  // calculate the CHANGE in mouse position
  const deltaX = (state.mouse.newPos.x - state.mouse.oldPos.x);
  const deltaY = (state.mouse.newPos.y - state.mouse.oldPos.y);

  // calculate the new offset, while the screen is moving
  // and take into account the current zoom level
  const trueOffSet = {
    x: (state.offset.x + deltaX) / state.zoom,
    y: (state.offset.y + deltaY) / state.zoom,
  };

  // col start for lines
  const startX = (trueOffSet.x % state.gridSize) * state.zoom;
  // row start for lines
  const startY = (trueOffSet.y % state.gridSize) * state.zoom;


  // draw each cell
  for (const cell of state.cells) {
    const x = (cell.x * state.gridSize + trueOffSet.x) * state.zoom;
    const y = (cell.y * state.gridSize + trueOffSet.y) * state.zoom;

    ctx.beginPath();
    ctx.rect(x, y, state.gridSize * state.zoom, state.gridSize * state.zoom);
    ctx.fill();
    ctx.closePath();

  }

  ctx.lineWidth = state.zoom;
  ctx.strokeStyle = "#7289da";

  // Draw the grid

  // Columns
  for (let i = startX; i < state._width; i += state.gridSize * state.zoom) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, state._height);
    ctx.closePath();
    ctx.stroke();
  }

  // Rows
  for (let j = startY; j < state._height; j += state.gridSize * state.zoom) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(state._width, j);
    ctx.closePath();
    ctx.stroke();
  }

}

canvas.onmousedown = (ev) => {
  // only update mouse position if we have the drag tool selected
  if (state.mouse.tool === "drag") {
    state.mouse.down = true;
    state.mouse.oldPos.x = ev.clientX;
    state.mouse.oldPos.y = ev.clientY;
    state.mouse.newPos.x = ev.clientX;
    state.mouse.newPos.y = ev.clientY;
  } else {
    // otherwise, populate/kill the clicked cell

    // Mouse x,y position
    const { mouse_x, mouse_y } = {
      mouse_x: ev.clientX,
      mouse_y: ev.clientY
    };

    // relative x,y position to screen offset
    const { relative_x, relative_y } = {
      relative_x: mouse_x - state.offset.x,
      relative_y: mouse_y - state.offset.y
    };

    // adjust for zoom level, and divide by grid size to get
    // column index
    const x = Math.floor(
      relative_x / state.zoom / state.gridSize
    );

    // same for row index
    const y = Math.floor(
      relative_y / state.zoom / state.gridSize
    );

    // if there is already a cell alive
    const index = state.cells.findIndex(v => v.x === x && v.y === y);
    // if alive
    if (index !== -1) {
      // remove from the list
      state.cells.splice(index, 1);
    } else {
      // otherwise add it
      state.cells.push({
        x, y,
      });
    }

  }
}

canvas.onmousemove = (ev) => {
  if (!state.mouse.down) return;
  // when the mouse moves, and mouse button is pressed
  // update mouse position
  state.mouse.newPos.x = ev.clientX;
  state.mouse.newPos.y = ev.clientY;

  // draw new position of grid/cells
  draw();
}


canvas.onmouseup = (ev) => {
  state.mouse.down = false;
  // calculate final change in mouse position
  const deltaX = state.mouse.newPos.x - state.mouse.oldPos.x;
  const deltaY = state.mouse.newPos.y - state.mouse.oldPos.y;

  // update canvas offset
  state.offset.x = (state.offset.x + deltaX);
  state.offset.y = (state.offset.y + deltaY);

  // update oldPos and newPos to be equal
  state.mouse.oldPos.x = ev.clientX;
  state.mouse.oldPos.y = ev.clientY;
  state.mouse.newPos.x = ev.clientX;
  state.mouse.newPos.y = ev.clientY;

  // draw new position of grid/cells
  draw();

}


// This zoom function is NOT GREAT
// but it works for now
// It does NOT zoom relative to cursor. Will need to figure that out
canvas.onwheel = (ev) => {
  // Up vs Down scroll
  if (Math.sign(ev.deltaY) === -1) {
    state.zoom += 0.05;
  } else state.zoom -= 0.05;

  if (state.zoom > state.MAX_ZOOM)
    state.zoom = state.MAX_ZOOM;
  else if (state.zoom < state.MIN_ZOOM)
    state.zoom = state.MIN_ZOOM;

  // redraw canvas
  draw();
}

// initial draw state
draw();