
/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let state = {
  zoom: 1,
  _height: canvas.height,
  _width: canvas.width,
  cells: [

    { x: 3 * 50, y: 6 * 50 },

  ],
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


  // cells

  for (const cell of state.cells) {
    const x = (cell.x + deltaX * state.zoom) + state.offset.x;
    const y = (cell.y + state.offset.y + deltaY) * state.zoom;

    ctx.beginPath();
    ctx.rect(x, y, state.gridSize * state.zoom, state.gridSize * state.zoom);
    ctx.fill();
    console.log(x, y);
    ctx.closePath();

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
  }
}

canvas.onmousemove = (ev) => {
  if (!state.mouse.down) return;

  state.mouse.newPos.x = ev.clientX;
  state.mouse.newPos.y = ev.clientY;

  mouseDrag();

}


canvas.onmouseup = () => {
  state.mouse.down = false;
  const deltaX = state.mouse.newPos.x - state.mouse.oldPos.x;
  const deltaY = state.mouse.newPos.y - state.mouse.oldPos.y;

  state.offset.x += deltaX;
  state.offset.y += deltaY;
}


canvas.onwheel = (ev) => {
  if (Math.sign(ev.deltaY) === -1) {
    state.zoom += 0.05;
  } else state.zoom -= 0.05;

  draw();
}


function grid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);



}
