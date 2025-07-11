from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import asyncio
from pathlib import Path
from mcp_client.client import GameClient
import os
from typing import Optional

app = FastAPI()

BASE_DIR = Path(__file__).parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

game_client: Optional[GameClient] = None

@app.on_event("startup")
async def startup_event():
    global game_client
    mcp_url = f"ws://localhost:{os.getenv('MCP_SERVER_PORT', '8000')}"
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    ollama_model = os.getenv('OLLAMA_MODEL', 'llama3.2')
    
    print(f"Waiting for MCP server to start...")
    await asyncio.sleep(2)  # Wait for MCP server to be ready
    
    try:
        game_client = GameClient(mcp_url, ollama_url, ollama_model)
        await game_client.connect()
        print("Connected to MCP server successfully")
    except Exception as e:
        print(f"Failed to connect to MCP server: {e}")
        print("The web interface will start but game functionality may not work")

@app.on_event("shutdown")
async def shutdown_event():
    global game_client
    if game_client:
        await game_client.disconnect()

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    if not game_client:
        await websocket.close(code=1000, reason="Game client not initialized")
        return
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            response = {"action": action}
            
            if action == "start_game":
                player_symbol = message.get("player_symbol", "X")
                await game_client.reset_game()
                response["status"] = f"New game started! You are {player_symbol}"
                
            elif action == "get_board":
                board_state = await game_client.get_board_state()
                response["board_state"] = board_state
                
            elif action == "make_move":
                row = message.get("row")
                col = message.get("col")
                player_symbol = message.get("player_symbol", "X")
                result = await game_client.make_human_move(row, col, player_symbol)
                response["result"] = result
                
                if "successful" in result.lower() and not any(x in result.lower() for x in ["wins", "draw"]):
                    ai_symbol = message.get("ai_symbol", "O")
                    ai_result = await game_client.make_ai_move(ai_symbol)
                    response["ai_result"] = ai_result
                    
            elif action == "ai_move":
                ai_symbol = message.get("ai_symbol", "O")
                ai_result = await game_client.make_ai_move(ai_symbol)
                response["result"] = ai_result
                    
            elif action == "reset_game":
                result = await game_client.reset_game()
                response["result"] = result
                response["status"] = "Game reset! Choose your symbol and start a new game."
                
            elif action == "chat":
                message_text = message.get("message", "")
                reply = await game_client.chat_with_ai(message_text)
                response["reply"] = reply
                
            await websocket.send_text(json.dumps(response))
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()