import asyncio
import json
from .protocol import MCPClient
from .ollama import OllamaClient

class GameClient:
    def __init__(self, mcp_url: str, ollama_url: str, ollama_model: str):
        self.mcp_client = MCPClient(mcp_url)
        self.ollama_client = OllamaClient(ollama_url, ollama_model)
    
    async def connect(self):
        await self.mcp_client.connect()
    
    async def disconnect(self):
        await self.mcp_client.disconnect()
        await self.ollama_client.close()
    
    async def get_board_state(self) -> str:
        return await self.mcp_client.call_tool("get_board", {})
    
    async def make_human_move(self, row: int, col: int) -> str:
        return await self.mcp_client.call_tool("make_move", {
            "row": row,
            "col": col,
            "player": "X"
        })
    
    async def make_ai_move(self) -> str:
        board_state = await self.get_board_state()
        available_moves = await self.mcp_client.call_tool("get_available_moves", {})
        
        if "playing" not in board_state.lower():
            return "Game over"
        
        try:
            moves_list = json.loads(available_moves)
            if not moves_list:
                return "No moves available"
        except:
            return "Error parsing available moves"
        
        row, col = await self.ollama_client.generate_move(board_state, available_moves)
        
        if (row, col) not in moves_list:
            row, col = moves_list[0]
        
        return await self.mcp_client.call_tool("make_move", {
            "row": row,
            "col": col,
            "player": "O"
        })
    
    async def reset_game(self) -> str:
        return await self.mcp_client.call_tool("reset_game", {})
    
    async def chat_with_ai(self, message: str) -> str:
        board_state = await self.get_board_state()
        
        system_prompt = f"""You are playing tic-tac-toe. Current board state:
{board_state}

Respond conversationally about the game state and your strategy."""
        
        return await self.ollama_client.generate(message, system_prompt)
    
    async def __aenter__(self):
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()