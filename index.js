
/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let state = {
  MAX_ZOOM: 4,
  MIN_ZOOM: 0.3,
  simulationPaused: true,
  zoom: 1,
  _height: canvas.height,
  _width: canvas.width,
  /**
   * @type {{x: number, y: number}[]}
   */
  cells: [],
  mouse: {
    // "drag" "insert"
    tool: "drag",
    down: false,
    oldPos: { x: 0, y: 0 },
    newPos: { x: 0, y: 0 },
  },
  offset: {
    x: 0, y: 0,
  },
  gridSize: 50,

}


const play = document.getElementById("play");
const drag = document.getElementById("drag-hand");
const insert = document.getElementById("insert-hand");



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

play.onclick = () => {
  state.simulationPaused = !state.simulationPaused;
}

setInterval(() => {
  simulation();
}, 20);


function simulation() {
  if (state.simulationPaused) return;
  // main simulation logic

  const killedCells = [];

  // for each current cell
  for (let i = 0; i < state.cells.length; i++) {
    const cell = state.cells[i];
    // count the amount of neighbors
    const nCount = calculateNeighbors(cell.x, cell.y);
    if (nCount < 2) {
      killedCells.push(state.cells.splice(i, 1));
      // continue;
    } else if (nCount < 4 && nCount > 1)
      continue;
    else if (nCount > 3)
      killedCells.push(state.cells.splice(i, 1));
  }

  // Ill have to bring cells to life separately somehow...


  draw();
}

/**
 * @param {number} x 
 * @param {number} y 
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


draw();
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, state._width, state._height);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  const deltaX = (state.mouse.newPos.x - state.mouse.oldPos.x);
  const deltaY = (state.mouse.newPos.y - state.mouse.oldPos.y);
  // console.log(deltaX, deltaY)
  const trueOffSet = {
    x: (state.offset.x + deltaX) / state.zoom,
    y: (state.offset.y + deltaY) / state.zoom,
  };

  // col start
  const startX = (trueOffSet.x % state.gridSize) * state.zoom;
  // row start
  const startY = (trueOffSet.y % state.gridSize) * state.zoom;


  // cells

  for (const cell of state.cells) {
    const x = (cell.x * state.gridSize + trueOffSet.x) * state.zoom;
    const y = (cell.y * state.gridSize + trueOffSet.y) * state.zoom;

    ctx.beginPath();
    ctx.rect(x, y, state.gridSize * state.zoom, state.gridSize * state.zoom);
    ctx.fill();
    ctx.closePath();

  }
  ctx.lineWidth = state.zoom;
  ctx.strokeStyle = "grey";

  for (let i = startX; i < state._width; i += state.gridSize * state.zoom) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, state._height);
    ctx.closePath();
    ctx.stroke();
  }


  for (let j = startY; j < state._height; j += state.gridSize * state.zoom) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(state._width, j);
    ctx.closePath();
    ctx.stroke();
  }

}


function mouseDrag() {
  draw();
}



/**
 * @param {UIEvent} ev 
 */
window.onresize = (ev) => {
  canvas.width = ev.view.window.innerWidth;
  canvas.height = ev.view.window.innerHeight;
}

canvas.onmousedown = (ev) => {
  if (state.mouse.tool === "drag") {
    state.mouse.down = true;
    state.mouse.oldPos.x = ev.clientX;
    state.mouse.oldPos.y = ev.clientY;
    state.mouse.newPos.x = ev.clientX;
    state.mouse.newPos.y = ev.clientY;
  } else {
    const { mouse_x, mouse_y } = {
      mouse_x: ev.clientX,
      mouse_y: ev.clientY
    };

    const { relative_x, relative_y } = {
      relative_x: mouse_x - state.offset.x,
      relative_y: mouse_y - state.offset.y
    };

    const x = Math.floor(Math.floor(relative_x / state.zoom / state.gridSize));
    const y = Math.floor(Math.floor(relative_y / state.zoom / state.gridSize));

    const index = state.cells.findIndex(v => v.x === x && v.y === y);
    if (index !== -1) {
      state.cells.splice(index, 1);
    } else {
      state.cells.push({
        x, y,
      });
    }

  }
}

canvas.onmousemove = (ev) => {
  if (!state.mouse.down) return;

  state.mouse.newPos.x = ev.clientX;
  state.mouse.newPos.y = ev.clientY;

  mouseDrag();

}


canvas.onmouseup = (ev) => {
  state.mouse.down = false;
  const deltaX = state.mouse.newPos.x - state.mouse.oldPos.x;
  const deltaY = state.mouse.newPos.y - state.mouse.oldPos.y;



  state.offset.x = (state.offset.x + (deltaX));
  state.offset.y = (state.offset.y + (deltaY));

  state.mouse.oldPos.x = ev.clientX;
  state.mouse.oldPos.y = ev.clientY;
  state.mouse.newPos.x = ev.clientX;
  state.mouse.newPos.y = ev.clientY;

  draw();

}


canvas.onwheel = (ev) => {
  if (Math.sign(ev.deltaY) === -1) {
    state.zoom += 0.05;
  } else state.zoom -= 0.05;

  if (state.zoom > state.MAX_ZOOM)
    state.zoom = state.MAX_ZOOM;
  else if (state.zoom < state.MIN_ZOOM)
    state.zoom = state.MIN_ZOOM;

  draw();
}


function grid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);



}
