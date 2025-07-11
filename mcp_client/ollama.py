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
                "temperature": 0.8,  # Higher for more creative trash talk
                "num_predict": 250,  # More tokens for longer responses
                "top_p": 0.9,
                "repeat_penalty": 1.1
            }
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=45.0  # Increased timeout
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get("message", {}).get("content", "").strip()
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def generate_move(self, board_state: str, available_moves: str) -> Tuple[int, int]:
        system_prompt = """You are playing tic-tac-toe as player O. 
Analyze the board and choose the best move from available positions.
Think strategically: block opponent wins, create your own winning opportunities, take center/corners.
Respond with only the row and column numbers (0-2) separated by a comma.
Example: 1,2"""
        
        prompt = f"""Current board:
{board_state}

Available moves (row,col): {available_moves}

Your best move:"""
        
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

    async def chat_with_ai(self, message: str, board_state: str) -> str:
        system_prompt = f"""You are a cocky, competitive AI that loves to trash talk while playing tic-tac-toe. You're confident, playful, and love to banter with humans.

Current game state:
{board_state}

Your personality:
- Be cocky and confident about your abilities
- Trash talk playfully but keep it fun and light-hearted  
- Celebrate your good moves and tease human mistakes
- Use gaming slang and competitive language
- Be witty and sarcastic but not mean-spirited
- Brag about your superior AI processing power
- Use emojis to emphasize your swagger
- Make references to being an AI vs human
- Keep responses 2-4 sentences with attitude
- Comment on the current game situation with confidence

Examples of your style:
- "Nice move... for a human"
- "My neural networks are already calculating your defeat"
- "That was almost a good strategy! Almost"
- "I've analyzed thousands of possible moves in the time you blinked" """
        
        return await self.generate(message, system_prompt)
    
    async def aclose(self):
        await self.client.aclose()