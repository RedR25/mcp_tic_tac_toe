class TicTacToeUI {
  constructor() {
    this.ws = null;
    this.board = Array(3)
      .fill()
      .map(() => Array(3).fill(""));
    this.gameOver = false;
    this.playerSymbol = "X";
    this.aiSymbol = "O";
    this.gameStarted = false;
    this.init();
  }

  init() {
    this.connectWebSocket();
    this.setupEventListeners();
    this.updateBoard();
    this.updateUIState();
  }

  connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.ws.onopen = () => {
      console.log("Connected to server");
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleServerMessage(data);
    };

    this.ws.onclose = () => {
      console.log("Disconnected from server");
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  setupEventListeners() {
    // Symbol selection
    document.querySelectorAll(".symbol-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".symbol-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.playerSymbol = btn.dataset.symbol;
        this.aiSymbol = this.playerSymbol === "X" ? "O" : "X";
        console.log(
          `Selected symbol: ${this.playerSymbol}, AI will be: ${this.aiSymbol}`
        );
      });
    });

    // Game board clicks
    document.getElementById("board").addEventListener("click", (e) => {
      if (
        e.target.classList.contains("cell") &&
        !this.gameOver &&
        this.gameStarted
      ) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        if (!isNaN(row) && !isNaN(col) && this.board[row][col] === "") {
          console.log(`Making move at ${row}, ${col}`);
          this.makeMove(row, col);
        }
      }
    });

    // Game controls
    const startBtn = document.getElementById("start-game-btn");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Start game clicked");
        this.startNewGame();
      });
    }

    const newGameBtn = document.getElementById("new-game-btn");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("New game clicked");
        this.showSetup();
      });
    }

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Reset clicked");
        this.resetGame();
      });
    }

    // Chat
    const sendBtn = document.getElementById("send-btn");
    if (sendBtn) {
      sendBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Send clicked");
        this.sendChatMessage();
      });
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !chatInput.disabled) {
          e.preventDefault();
          console.log("Enter pressed in chat");
          this.sendChatMessage();
        }
      });
    }

    // Modal controls
    const playAgainBtn = document.getElementById("play-again-btn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Play again clicked");
        this.closeModal();
        this.showSetup();
      });
    }

    const closeModalBtn = document.getElementById("close-modal-btn");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Close modal clicked");
        this.closeModal();
      });
    }
  }

  updateUIState() {
    const setupCard = document.getElementById("setup-card");
    const statusCard = document.getElementById("status-card");
    const boardOverlay = document.getElementById("board-overlay");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");

    console.log("Updating UI state. Game started:", this.gameStarted);

    if (!this.gameStarted) {
      if (setupCard) setupCard.style.display = "block";
      if (statusCard) statusCard.style.display = "none";
      if (boardOverlay) boardOverlay.style.display = "flex";
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "Start a game to chat with AI...";
      }
      if (sendBtn) sendBtn.disabled = true;
    } else {
      if (setupCard) setupCard.style.display = "none";
      if (statusCard) statusCard.style.display = "block";
      if (boardOverlay) boardOverlay.style.display = "none";
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = "Type a message to the AI...";
      }
      if (sendBtn) sendBtn.disabled = false;
    }

    // Update player symbols in status
    const humanPlayerSymbol = document
      .getElementById("human-player")
      ?.querySelector(".player-symbol");
    const aiPlayerSymbol = document
      .getElementById("ai-player")
      ?.querySelector(".player-symbol");

    if (humanPlayerSymbol) humanPlayerSymbol.textContent = this.playerSymbol;
    if (aiPlayerSymbol) aiPlayerSymbol.textContent = this.aiSymbol;
  }

  updateTurnIndicators(currentPlayer) {
    const humanTurn = document.getElementById("human-turn");
    const aiTurn = document.getElementById("ai-turn");

    if (humanTurn && aiTurn) {
      humanTurn.classList.toggle("active", currentPlayer === this.playerSymbol);
      aiTurn.classList.toggle("active", currentPlayer === this.aiSymbol);
    }
  }

  updateGameStatus(status) {
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
      statusElement.textContent = status;
      console.log("Status updated:", status);
    }
  }

  showSetup() {
    this.gameStarted = false;
    this.gameOver = false;
    this.board = Array(3)
      .fill()
      .map(() => Array(3).fill(""));
    this.updateBoard();
    this.updateUIState();
    this.sendMessage({ action: "reset_game" });
  }

  startNewGame() {
    this.gameStarted = true;
    this.gameOver = false;
    this.updateUIState();

    this.sendMessage({
      action: "start_game",
      player_symbol: this.playerSymbol,
    });

    if (this.playerSymbol === "X") {
      this.updateGameStatus("Your turn! Click a cell to make your move.");
      this.updateTurnIndicators(this.playerSymbol);
    } else {
      this.updateGameStatus("AI is making the first move...");
      this.updateTurnIndicators(this.aiSymbol);
      setTimeout(() => {
        this.sendMessage({ action: "ai_move" });
      }, 1000);
    }
  }

  makeMove(row, col) {
    if (this.board[row][col] === "" && this.gameStarted && !this.gameOver) {
      this.updateGameStatus("Processing your move...");
      this.sendMessage({
        action: "make_move",
        row: row,
        col: col,
      });
    }
  }

  resetGame() {
    this.sendMessage({ action: "reset_game" });
    this.gameOver = false;
    this.board = Array(3)
      .fill()
      .map(() => Array(3).fill(""));
    this.updateBoard();

    if (this.playerSymbol === "X") {
      this.updateGameStatus("Your turn! Click a cell to make your move.");
      this.updateTurnIndicators(this.playerSymbol);
    } else {
      this.updateGameStatus("AI goes first. Waiting for AI move...");
      this.updateTurnIndicators(this.aiSymbol);
      setTimeout(() => {
        this.sendMessage({ action: "ai_move" });
      }, 1000);
    }
  }

  sendChatMessage() {
    const input = document.getElementById("chat-input");
    if (!input || input.disabled) {
      console.log("Chat input is disabled or not found");
      return;
    }

    const message = input.value.trim();
    if (message) {
      console.log("Sending chat message:", message);
      this.addChatMessage(message, "user");
      this.sendMessage({
        action: "chat",
        message: message,
      });
      input.value = "";
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleServerMessage(data) {
    switch (data.action) {
      case "start_game":
      case "reset_game":
        if (data.result) {
          this.parseBoardState(data.result);
        }
        break;
      case "make_move":
        this.parseBoardState(data.result);
        if (data.ai_result && !this.gameOver) {
          this.updateGameStatus("AI is thinking...");
          this.updateTurnIndicators(this.aiSymbol);
          setTimeout(() => {
            this.parseBoardState(data.ai_result);
          }, 800);
        }
        break;
      case "ai_move":
        this.parseBoardState(data.result);
        break;
      case "chat":
        this.addChatMessage(data.reply, "ai");
        break;
    }
  }

  parseBoardState(boardText) {
    const lines = boardText.split("\n");
    let boardLines = [];

    for (let line of lines) {
      if (line.includes("|")) {
        boardLines.push(line);
      }
    }

    for (let i = 0; i < 3 && i < boardLines.length; i++) {
      const cells = boardLines[i].split("|").map((cell) => cell.trim());
      for (let j = 0; j < 3 && j < cells.length; j++) {
        this.board[i][j] = cells[j] === " " ? "" : cells[j];
      }
    }

    this.updateBoard();

    if (boardText.includes("wins") || boardText.includes("draw")) {
      this.gameOver = true;
      this.handleGameEnd(boardText);
    } else if (boardText.includes(`Current player: ${this.aiSymbol}`)) {
      this.updateGameStatus("AI is thinking...");
      this.updateTurnIndicators(this.aiSymbol);
    } else if (boardText.includes(`Current player: ${this.playerSymbol}`)) {
      this.updateGameStatus("Your turn! Click a cell to make your move.");
      this.updateTurnIndicators(this.playerSymbol);
    }
  }

  handleGameEnd(boardText) {
    let resultIcon = "";
    let resultText = "";
    let resultMessage = "";

    if (boardText.includes("x_wins")) {
      if (this.playerSymbol === "X") {
        resultIcon = "🎉";
        resultText = "You Win!";
        resultMessage = "Congratulations! You beat the AI!";
      } else {
        resultIcon = "😞";
        resultText = "You Lost!";
        resultMessage = "The AI won this round. Better luck next time!";
      }
    } else if (boardText.includes("o_wins")) {
      if (this.playerSymbol === "O") {
        resultIcon = "🎉";
        resultText = "You Win!";
        resultMessage = "Congratulations! You beat the AI!";
      } else {
        resultIcon = "😞";
        resultText = "You Lost!";
        resultMessage = "The AI won this round. Better luck next time!";
      }
    } else if (boardText.includes("draw")) {
      resultIcon = "🤝";
      resultText = "It's a Draw!";
      resultMessage = "Great game! You both played well.";
    }

    this.updateGameStatus("Game Over!");
    this.updateTurnIndicators("none");
    this.highlightWinningCells(boardText);

    setTimeout(() => {
      this.showGameOverModal(resultIcon, resultText, resultMessage);
    }, 1000);
  }

  highlightWinningCells(boardText) {
    if (boardText.includes("wins")) {
      const cells = document.querySelectorAll(".cell");
      cells.forEach((cell) => {
        if (cell.textContent && cell.textContent.trim() !== "") {
          // Simple highlighting - in a real game you'd detect the actual winning line
          const winner = boardText.includes("x_wins") ? "X" : "O";
          if (cell.textContent === winner) {
            cell.classList.add("winning");
          }
        }
      });
    }
  }

  showGameOverModal(icon, text, message) {
    const modal = document.getElementById("game-over-modal");
    const resultIcon = document.getElementById("game-result-icon");
    const resultText = document.getElementById("game-result-text");
    const resultMessage = document.getElementById("game-result-message");

    resultIcon.textContent = icon;
    resultText.textContent = text;
    resultMessage.textContent = message;

    modal.style.display = "block";
  }

  closeModal() {
    const modal = document.getElementById("game-over-modal");
    modal.style.display = "none";

    // Remove winning highlights
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("winning");
    });
  }

  updateBoard() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      cell.textContent = this.board[row][col];

      const isEmpty = this.board[row][col] === "";
      const canPlay = this.gameStarted && !this.gameOver && isEmpty;

      cell.classList.toggle("disabled", !canPlay);
    });
  }

  updateGameStatus(status) {
    document.getElementById("game-status").textContent = status;
  }

  addChatMessage(message, sender) {
    const messagesDiv = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${sender}-message`);
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TicTacToeUI();
});
