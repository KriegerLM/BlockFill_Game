// ==== Sistema de ranking ====

// === Reiniciar datos al recargar (modo no persistente) ===
localStorage.removeItem("nombreUsuario");
localStorage.removeItem("wormRanking");

let ranking = JSON.parse(localStorage.getItem("wormRanking")) || [];

// ==== Registro y gestión del nombre del jugador ====
function obtenerNombreUsuario() {
  return localStorage.getItem("nombreUsuario");
}

function registrarNombre(forzar = false) {
  let nombreActual = obtenerNombreUsuario();

  if (nombreActual && !forzar) {
    return nombreActual;
  }

  const nombre = prompt("Por favor, ingresa tu nombre:");

  if (nombre && nombre.trim() !== "") {
    localStorage.setItem("nombreUsuario", nombre.trim());
    alert(`¡Bienvenido, ${nombre.trim()}! 😄`);
    return nombre.trim();
  } else {
    alert("No ingresaste un nombre válido 😅");
    return null;
  }
}

function cambiarNombreJugador() {
  if (confirm("¿Quieres cambiar tu nombre de jugador?")) {
    registrarNombre(true);
    renderRanking();
  }
}

// ==== Inicialización del ranking ====
if (!ranking || ranking.length === 0) {
  ranking = [
    { name: "Juan", score: 5 },
    { name: "Omar", score: 4 },
    { name: "Julio", score: 3 },
    { name: "María", score: 2 },
    { name: "Angélica", score: 1 },
  ];
  localStorage.setItem("wormRanking", JSON.stringify(ranking));
}

// ==== Sistema de puntuaciones con arreglo ====
let scoreHistory = JSON.parse(localStorage.getItem("wormScoreHistory")) || [];
const scoreDisplay = document.getElementById("score");

// Mostrar el total de puntuación
function updateScoreDisplay() {
  const totalScore = scoreHistory.reduce((acc, s) => acc + s, 0);
  if (scoreDisplay) scoreDisplay.textContent = totalScore;
}

// Guardar una nueva puntuación
function addScore(points) {
  scoreHistory.push(points);
  localStorage.setItem("wormScoreHistory", JSON.stringify(scoreHistory));
  updateScoreDisplay();
}

// Reiniciar el historial de puntuación
function resetScore() {
  scoreHistory = [];
  localStorage.setItem("wormScoreHistory", JSON.stringify(scoreHistory));
  updateScoreDisplay();
}

// ==== Actualizar el ranking ====
function updateRanking(playerName, playerScore) {
  const existing = ranking.find((p) => p.name === playerName);

  if (existing) {
    if (playerScore > existing.score) {
      existing.score = playerScore;
      showMessage(`🎉 ¡Has mejorado tu récord, ${playerName}!`, "success");
    }
  } else {
    ranking.push({ name: playerName, score: playerScore });
    showMessage(`🏅 ¡Felicidades ${playerName}, entraste al Top 5!`, "success");
  }

  ranking.sort((a, b) => b.score - a.score);
  ranking = ranking.slice(0, 5);
  localStorage.setItem("wormRanking", JSON.stringify(ranking));
  renderRanking();
}

// ==== Mostrar ranking ====
function renderRanking() {
  const rankingContainer = document.getElementById("ranking-container");
  if (!rankingContainer) return;

  rankingContainer.innerHTML = `
    <h3>🏆 Top 5 puntuaciones</h3>
    <button onclick="cambiarNombreJugador()" class="btn-change-name">🔄 Cambiar nombre</button>
  `;

  ranking.forEach((p, i) => {
    const item = document.createElement("div");
    item.innerHTML = `<strong>${i + 1}.</strong> ${p.name} - <span>${
      p.score
    }</span>`;
    rankingContainer.appendChild(item);
  });

  const currentPlayer = obtenerNombreUsuario();
  if (currentPlayer) {
    const active = document.createElement("p");
    active.innerHTML = `👤 Jugador actual: <strong>${currentPlayer}</strong>`;
    rankingContainer.appendChild(active);
  }
}

// ==== Verificar si entra o mejora en el ranking ====
function verificarRanking() {
  let nombreUsuario = obtenerNombreUsuario();
  const totalScore = scoreHistory.reduce((acc, s) => acc + s, 0);
  const peorPuntaje = ranking[ranking.length - 1].score;
  const superaAlguien = ranking.some((player) => totalScore >= player.score);

  if ((superaAlguien || totalScore > peorPuntaje) && !nombreUsuario) {
    nombreUsuario = registrarNombre();
    if (!nombreUsuario) return;
  }

  if (!superaAlguien && totalScore <= peorPuntaje) return;

  updateRanking(nombreUsuario, totalScore);
}

// ==== Selección del tablero ====
const gameBoard = document.getElementById("game-board");

// ==== Tamaño del tablero ====
const boardSizeRow = 9;
const boardSizeColumns = 7;

// ==== Variables de control ====
let isMouseDown = false;
let hasStarted = false;
let board = [];
let startCell = null;
let lastTouchedCell = null; // Track last touched cell to prevent false overlaps

// ==== Función: limpiar tablero ====
function clearBoard() {
  board = [];
  for (let i = 0; i < boardSizeRow; i++) {
    board[i] = [];
    for (let j = 0; j < boardSizeColumns; j++) {
      board[i][j] = 0;
    }
  }
}

// ==== Generación del gusano ====
function createWorm() {
  let success = false;
  let attempts = 0;

  while (!success && attempts < 1000) {
    clearBoard();
    success = tryGeneratePath();
    attempts++;
  }

  if (!success) {
    console.warn(
      "⚠️ No se pudo generar un camino válido. Usando nivel de respaldo."
    );
    createFallbackLevel();
  }
  renderBoard();
}

// ==== Genera el camino del gusano ====
function tryGeneratePath() {
  const totalCells = boardSizeRow * boardSizeColumns;
  const minSteps = Math.floor(totalCells * 0.7);
  const maxSteps = Math.floor(totalCells * 0.85);
  const totalSteps =
    Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;

  let currentRow = Math.floor(Math.random() * boardSizeRow);
  let currentCol = Math.floor(Math.random() * boardSizeColumns);

  startCell = [currentRow, currentCol];
  board[currentRow][currentCol] = 1;

  let path = [[currentRow, currentCol]];

  function getValidDirections(row, col) {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    return dirs
      .map(([dy, dx]) => [row + dy, col + dx])
      .filter(
        ([ny, nx]) =>
          ny >= 0 &&
          nx >= 0 &&
          ny < boardSizeRow &&
          nx < boardSizeColumns &&
          board[ny][nx] === 0
      );
  }

  let iterations = 0;
  const maxIterations = 1000;
  while (path.length < totalSteps && iterations < maxIterations) {
    const [cy, cx] = path[path.length - 1];
    const valid = getValidDirections(cy, cx);

    if (valid.length === 0) {
      const prev = path.pop();
      if (prev) board[prev[0]][prev[1]] = 0;
      if (path.length === 0) break;
      iterations++;
      continue;
    }

    const [ny, nx] = valid[Math.floor(Math.random() * valid.length)];
    board[ny][nx] = 1;
    path.push([ny, nx]);
    iterations++;
  }

  return path.length >= minSteps && iterations < maxIterations;
}

// ==== Nivel de respaldo ====
function createFallbackLevel() {
  clearBoard();
  let row = 0,
    col = 0;
  startCell = [row, col];
  board[row][col] = 1;
  for (let i = 1; i < Math.min(5, boardSizeRow); i++) board[i][col] = 1;
  for (let j = 1; j < Math.min(5, boardSizeColumns); j++) board[row][j] = 1;
}

// ==== Renderizado del tablero ====
function renderBoard() {
  gameBoard.innerHTML = "";
  gameBoard.style.gridTemplateColumns = `repeat(${boardSizeColumns}, 8vmin)`;
  gameBoard.style.gridTemplateRows = `repeat(${boardSizeRow}, 8vmin)`;

  for (let i = 0; i < boardSizeRow; i++) {
    for (let j = 0; j < boardSizeColumns; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (board[i][j] === 1) cell.classList.add("fillable");
      if (board[i][j] === 2 || board[i][j] === 3) cell.classList.add("filled");
      if (startCell && i === startCell[0] && j === startCell[1]) {
        cell.classList.add("start-cell");
      }

      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener("mousedown", handleCellDown);
      cell.addEventListener("mouseenter", handleCellEnter);

      gameBoard.appendChild(cell);
    }
  }
}

// ==== Eventos globales del ratón ====
gameBoard.addEventListener("mousedown", () => (isMouseDown = true));
gameBoard.addEventListener("mouseleave", () => (isMouseDown = false));
gameBoard.addEventListener("mouseup", () => {
  if (hasStarted) {
    const remaining = board.flat().filter((v) => v === 1).length;
    if (remaining === 0) {
      showMessage("¡Nivel completado!", "success");
      addScore(1);
      verificarRanking();
      setTimeout(resetLevel, 1200);
    } else {
      showMessage("¡Nivel no completado!", "fail");
      resetScore();
      setTimeout(resetLevel, 1200);
    }
  }
  isMouseDown = false;
  hasStarted = false;
  lastTouchedCell = null; // Reset
});

// ==== Eventos de toque para móviles ====
gameBoard.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isMouseDown = true;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains("cell")) {
    lastTouchedCell = `${target.dataset.row}-${target.dataset.col}`; // Track
    handleCellDown({ target });
  }
});

gameBoard.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isMouseDown || !hasStarted) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains("cell")) {
    const currentCell = `${target.dataset.row}-${target.dataset.col}`;
    if (currentCell !== lastTouchedCell) {
      // Only process if different cell
      lastTouchedCell = currentCell;
      handleCellEnter({ target });
    }
  }
});

gameBoard.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (hasStarted) {
    const remaining = board.flat().filter((v) => v === 1).length;
    if (remaining === 0) {
      showMessage("¡Nivel completado!", "success");
      addScore(1);
      verificarRanking();
      setTimeout(resetLevel, 1200);
    } else {
      showMessage("¡Nivel no completado!", "fail");
      resetScore();
      setTimeout(resetLevel, 1200);
    }
  }
  isMouseDown = false;
  hasStarted = false;
  lastTouchedCell = null; // Reset
});

// ==== Manejo de celdas ====
function handleCellDown(event) {
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);
  if (startCell && row === startCell[0] && col === startCell[1]) {
    hasStarted = true;
    isMouseDown = true;
    if (board[row][col] === 1) {
      board[row][col] = 2;
      updateCell(event.target, "filled");
    }
  }
}

function handleCellEnter(event) {
  if (!isMouseDown || !hasStarted) return;
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  if (board[row][col] === 1) {
    board[row][col] = 2;
    updateCell(event.target, "filled");
    const remaining = board.flat().filter((v) => v === 1).length;
    if (remaining === 0) {
      showMessage("¡Nivel completado!", "success");
      addScore(1);
      verificarRanking();
      setTimeout(resetLevel, 1200);
      isMouseDown = false;
      hasStarted = false;
    }
  } else if (board[row][col] === 0) {
    showMessage("¡Error! No puedes tocar celdas no rellenables.", "fail");
    resetScore();
    setTimeout(resetLevel, 1200);
    isMouseDown = false;
    hasStarted = false;
  } else if (board[row][col] === 2) {
    showMessage(
      "¡Error! No puedes pasar por un cuadrado ya rellenado.",
      "fail"
    );
    resetScore();
    setTimeout(resetLevel, 1200);
    isMouseDown = false;
    hasStarted = false;
  }
}

// ==== Actualiza una celda ====
function updateCell(cellElement, state) {
  cellElement.classList.remove("fillable", "filled");
  if (state === "filled") cellElement.classList.add("filled");
}

// ==== Reinicia el nivel ====
function resetLevel() {
  hasStarted = false;
  isMouseDown = false;
  createWorm();
}

// ==== Mensaje flotante ====
function showMessage(text, type = "success") {
  const msgBox = document.getElementById("message-container");
  const msgText = document.getElementById("message-text");

  msgText.textContent = text;
  msgBox.className = `show ${type}`;
  setTimeout(() => (msgBox.className = "hidden"), 1500);
}

// ==== Inicialización ====
createWorm();
updateScoreDisplay();
renderRanking();
