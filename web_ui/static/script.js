class TicTacToeUI {
  constructor() {
    this.ws = null;
    this.board = Array(3)
      .fill()
      .map(() => Array(3).fill(""));
    this.gameOver = false;
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
      this.requestBoardState();
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
      if (e.target.classList.contains("cell") && !this.gameOver) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        this.makeMove(row, col);
      }
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
  }

  makeMove(row, col) {
    if (this.board[row][col] === "") {
      this.sendMessage({
        action: "make_move",
        row: row,
        col: col,
      });
    }
  }

  resetGame() {
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

  requestBoardState() {
    this.sendMessage({ action: "get_board" });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleServerMessage(data) {
    switch (data.action) {
      case "get_board":
        this.parseBoardState(data.board_state);
        break;
      case "make_move":
        this.parseBoardState(data.result);
        if (data.ai_result) {
          this.parseBoardState(data.ai_result);
        }
        break;
      case "reset_game":
        this.gameOver = false;
        this.board = Array(3)
          .fill()
          .map(() => Array(3).fill(""));
        this.updateBoard();
        this.updateGameStatus("Your turn (X)");
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
      if (boardText.includes("x_wins")) {
        this.updateGameStatus("You win!");
      } else if (boardText.includes("o_wins")) {
        this.updateGameStatus("AI wins!");
      } else if (boardText.includes("draw")) {
        this.updateGameStatus("Draw!");
      }
    } else if (boardText.includes("Current player: O")) {
      this.updateGameStatus("AI is thinking...");
    } else {
      this.updateGameStatus("Your turn (X)");
    }
  }

  updateBoard() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      cell.textContent = this.board[row][col];
      cell.classList.toggle(
        "disabled",
        this.gameOver || this.board[row][col] !== ""
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
