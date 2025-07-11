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
