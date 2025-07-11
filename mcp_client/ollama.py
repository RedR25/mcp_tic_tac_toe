import httpx  # type: ignore
import json
from typing import Dict, Any, Optional, Tuple

class OllamaClient:
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.client = httpx.AsyncClient()
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 100
            }
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get("message", {}).get("content", "").strip()
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def generate_move(self, board_state: str, available_moves: str) -> Tuple[int, int]:
        system_prompt = """You are playing tic-tac-toe as player O. 
Analyze the board and choose the best move from available positions.
Respond with only the row and column numbers (0-2) separated by a comma.
Example: 1,2"""
        
        prompt = f"""Current board:
{board_state}

Available moves (row,col): {available_moves}

Choose your move:"""
        
        response = await self.generate(prompt, system_prompt)
        
        try:
            parts = response.split(",")
            if len(parts) == 2:
                row = int(parts[0].strip())
                col = int(parts[1].strip())
                if 0 <= row <= 2 and 0 <= col <= 2:
                    return row, col
        except:
            pass
        
        # Fallback to first available move
        try:
            moves = json.loads(available_moves)
            if moves:
                return moves[0]
        except:
            pass
        
        return 0, 0
    
    async def close(self):
        await self.client.aclose()