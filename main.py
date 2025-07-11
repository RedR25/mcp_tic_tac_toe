import asyncio
import uvicorn
import os
from dotenv import load_dotenv

async def start_mcp_server():
    from mcp_server.server import start_server
    mcp_port = int(os.getenv('MCP_SERVER_PORT', '8000'))
    await start_server("localhost", mcp_port)

async def start_web_server():
    from web_ui.app import app
    web_port = int(os.getenv('WEB_UI_PORT', '8001'))
    config = uvicorn.Config(app, host="localhost", port=web_port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    load_dotenv()
    
    mcp_port = int(os.getenv('MCP_SERVER_PORT', '8000'))
    web_port = int(os.getenv('WEB_UI_PORT', '8001'))
    
    print(f"Starting MCP Server on port {mcp_port}")
    print(f"Starting Web UI on port {web_port}")
    print(f"Ollama URL: {os.getenv('OLLAMA_URL')}")
    print(f"Ollama Model: {os.getenv('OLLAMA_MODEL')}")
    
    # Start MCP server first, then web server
    mcp_task = asyncio.create_task(start_mcp_server())
    await asyncio.sleep(0.5)  # Small delay to ensure MCP server starts first
    web_task = asyncio.create_task(start_web_server())
    
    await asyncio.gather(mcp_task, web_task)

if __name__ == "__main__":
    asyncio.run(main())