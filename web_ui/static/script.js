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
    document.getElementById("board").addEventListener("click", (e) => {
      if (
        e.target.classList.contains("cell") &&
        !this.gameOver &&
        this.gameStarted
      ) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        this.makeMove(row, col);
      }
    });

    document.getElementById("start-game-btn").addEventListener("click", () => {
      this.startNewGame();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      this.resetGame();
    });

    document.getElementById("send-btn").addEventListener("click", () => {
      this.sendChatMessage();
    });

    document.getElementById("chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendChatMessage();
      }
    });

    document.getElementById("play-again-btn").addEventListener("click", () => {
      this.closeModal();
      this.startNewGame();
    });

    document.getElementById("close-modal-btn").addEventListener("click", () => {
      this.closeModal();
    });
  }

  startNewGame() {
    const playerChoice = document.getElementById("player-choice").value;
    this.playerSymbol = playerChoice;
    this.aiSymbol = playerChoice === "X" ? "O" : "X";
    this.gameStarted = true;

    this.sendMessage({
      action: "start_game",
      player_symbol: this.playerSymbol,
    });

    if (this.playerSymbol === "X") {
      this.updateGameStatus("Your turn!");
    } else {
      this.updateGameStatus("AI is making the first move...");
      setTimeout(() => {
        this.sendMessage({ action: "ai_move" });
      }, 1000);
    }
  }

  makeMove(row, col) {
    if (this.board[row][col] === "" && this.gameStarted) {
      this.sendMessage({
        action: "make_move",
        row: row,
        col: col,
      });
    }
  }

  resetGame() {
    this.gameStarted = false;
    this.sendMessage({ action: "reset_game" });
  }

  sendChatMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    if (message) {
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
        this.gameOver = false;
        this.board = Array(3)
          .fill()
          .map(() => Array(3).fill(""));
        this.updateBoard();
        this.updateGameStatus(data.status || "Game ready!");
        break;
      case "make_move":
        this.parseBoardState(data.result);
        if (data.ai_result) {
          setTimeout(() => {
            this.parseBoardState(data.ai_result);
          }, 500);
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
      let resultText = "";
      let resultClass = "";

      if (boardText.includes("x_wins")) {
        if (this.playerSymbol === "X") {
          resultText = "🎉 You Win! 🎉";
          resultClass = "win";
        } else {
          resultText = "😞 You Lost! 😞";
          resultClass = "lose";
        }
      } else if (boardText.includes("o_wins")) {
        if (this.playerSymbol === "O") {
          resultText = "🎉 You Win! 🎉";
          resultClass = "win";
        } else {
          resultText = "😞 You Lost! 😞";
          resultClass = "lose";
        }
      } else if (boardText.includes("draw")) {
        resultText = "🤝 It's a Draw! 🤝";
        resultClass = "draw";
      }

      this.showGameOverModal(resultText, resultClass);
      this.highlightWinningCells(boardText);
    } else if (boardText.includes(`Current player: ${this.aiSymbol}`)) {
      this.updateGameStatus("AI is thinking...");
    } else if (boardText.includes(`Current player: ${this.playerSymbol}`)) {
      this.updateGameStatus("Your turn!");
    }
  }

  highlightWinningCells(boardText) {
    // Simple winning line detection - could be enhanced
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      if (cell.textContent && boardText.includes("wins")) {
        cell.classList.add("winning");
      }
    });
  }

  showGameOverModal(resultText, resultClass) {
    const modal = document.getElementById("game-over-modal");
    const gameResult = document.getElementById("game-result");

    gameResult.textContent = resultText;
    gameResult.className = resultClass;
    modal.style.display = "block";

    setTimeout(() => {
      modal.style.animation = "fadeIn 0.3s ease";
    }, 10);
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
      cell.classList.toggle(
        "disabled",
        this.gameOver || this.board[row][col] !== "" || !this.gameStarted
      );
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
