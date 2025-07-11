# MCP Tic-Tac-Toe

Model Context Protocol implementation for playing tic-tac-toe with Ollama.

## Requirements

- Python 3.11+
- uv package manager
- Ollama running on your network

## Setup

```bash
uv sync
cp .env .env.local
# Edit .env.local with your Ollama settings
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

- `OLLAMA_URL`: Ollama server URL (default: http://192.168.1.27:11434)
- `OLLAMA_MODEL`: Model name to use
- `MCP_SERVER_PORT`: MCP WebSocket port (default: 8000)
- `WEB_UI_PORT`: Web interface port (default: 8001)
