import asyncio
import json
from typing import Dict, Any
from mcp_server.protocol import MCPServer
from mcp_server.game import TicTacToeGame, Player

class TicTacToeServer:
    def __init__(self):
        self.mcp_server = MCPServer()
        self.game = TicTacToeGame()
        self._setup_tools()
        self._setup_resources()
    
    def _setup_tools(self):
        self.mcp_server.add_tool(
            "make_move",
            "Make a move on the tic-tac-toe board",
            {
                "row": {"type": "integer", "minimum": 0, "maximum": 2},
                "col": {"type": "integer", "minimum": 0, "maximum": 2},
                "player": {"type": "string", "enum": ["X", "O"]}
            },
            self._handle_make_move
        )
        
        self.mcp_server.add_tool(
            "get_board",
            "Get the current board state",
            {},
            self._handle_get_board
        )
        
        self.mcp_server.add_tool(
            "get_available_moves",
            "Get available moves on the board",
            {},
            self._handle_get_available_moves
        )
        
        self.mcp_server.add_tool(
            "reset_game",
            "Reset the game board",
            {},
            self._handle_reset_game
        )
    
    def _setup_resources(self):
        self.mcp_server.add_resource(
            "game://current",
            "Current Game State",
            "The current state of the tic-tac-toe game",
            self._handle_game_resource
        )
    
    async def _handle_make_move(self, row: int, col: int, player: str) -> str:
        player_enum = Player(player)
        success = self.game.make_move(row, col, player_enum)
        if success:
            return f"Move successful. Board:\n{self.game.to_string()}"
        else:
            return f"Invalid move. Board:\n{self.game.to_string()}"
    
    async def _handle_get_board(self) -> str:
        return self.game.to_string()
    
    async def _handle_get_available_moves(self) -> str:
        moves = self.game.get_available_moves()
        return json.dumps(moves)
    
    async def _handle_reset_game(self) -> str:
        self.game.reset()
        return "Game reset successfully"
    
    async def _handle_game_resource(self) -> str:
        return self.game.to_string()
    
    async def handle_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.mcp_server.handle_request(request_data)

async def start_server(host: str = "localhost", port: int = 8000):
    tic_server = TicTacToeServer()
    
    async def handle_client(websocket):
        try:
            print(f"MCP client connected from {websocket.remote_address}")
            async for message in websocket:
                try:
                    print(f"Received message: {message}")
                    request_data = json.loads(message)
                    response = await tic_server.handle_request(request_data)
                    print(f"Sending response: {response}")
                    await websocket.send(json.dumps(response))
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    error_response = {
                        "jsonrpc": "2.0",
                        "error": {"code": -32700, "message": "Parse error"},
                        "id": None
                    }
                    await websocket.send(json.dumps(error_response))
                except Exception as e:
                    print(f"Request handling error: {e}")
                    error_response = {
                        "jsonrpc": "2.0",
                        "error": {"code": -32603, "message": f"Internal error: {str(e)}"},
                        "id": None
                    }
                    await websocket.send(json.dumps(error_response))
        except Exception as e:
            print(f"Client connection error: {e}")
    
    import websockets
    server = await websockets.serve(handle_client, host, port)
    print(f"MCP Server running on ws://{host}:{port}")
    await server.wait_closed()