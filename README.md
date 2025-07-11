```
mcp-tictactoe/
├── pyproject.toml
├── README.md
├── mcp_server/
│   ├── __init__.py
│   ├── protocol.py      # MCP protocol implementation
│   ├── game.py          # Tic-tac-toe game logic
│   └── server.py        # Main server entry point
├── mcp_client/
│   ├── __init__.py
│   ├── protocol.py      # MCP client implementation
│   ├── ollama.py        # Ollama integration
│   └── client.py        # Main client logic
├── web_ui/
│   ├── __init__.py
│   ├── app.py           # FastAPI application
│   ├── static/
│   │   ├── style.css
│   │   └── script.js
│   └── templates/
│       └── index.html
└── main.py              # Application entry point
```

# MCP Tic-Tac-Toe

Model Context Protocol implementation for playing tic-tac-toe with Ollama.

## Setup

```bash
uv sync
cp .env.example .env
# Edit .env with your Ollama settings
```

## Run

```bash
uv run python main.py
```

Access the game at `http://localhost:8001`

## Architecture

- **MCP Server**: WebSocket server implementing MCP protocol
- **MCP Client**: Protocol client with Ollama integration
- **Web UI**: FastAPI + WebSocket frontend
- **Game Logic**: Tic-tac-toe engine with move validation

## Environment Variables

- `OLLAMA_URL`: Ollama server URL
- `OLLAMA_MODEL`: Model name to use
- `MCP_SERVER_PORT`: MCP WebSocket port
- `WEB_UI_PORT`: Web interface port
