import json
import asyncio
import websockets
from typing import Dict, Any, Optional, List
from uuid import uuid4

class MCPClient:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.websocket: Any = None
        self.request_id = 0
        self.pending_requests = {}
        
    async def connect(self):
        try:
            self.websocket = await websockets.connect(self.server_url)
            await self._initialize()
        except Exception as e:
            print(f"Failed to connect to MCP server: {e}")
            raise
    
    async def disconnect(self):
        if self.websocket:
            await self.websocket.close()
    
    async def _initialize(self):
        response = await self._send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "roots": {"listChanged": False}
            },
            "clientInfo": {
                "name": "mcp-tictactoe-client",
                "version": "0.1.0"
            }
        })
        return response
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        response = await self._send_request("tools/list", {})
        return response.get("result", {}).get("tools", [])
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        response = await self._send_request("tools/call", {
            "name": name,
            "arguments": arguments
        })
        result = response.get("result", {})
        content = result.get("content", [])
        if content:
            return content[0].get("text", "")
        return ""
    
    async def list_resources(self) -> List[Dict[str, Any]]:
        response = await self._send_request("resources/list", {})
        return response.get("result", {}).get("resources", [])
    
    async def read_resource(self, uri: str) -> str:
        response = await self._send_request("resources/read", {"uri": uri})
        result = response.get("result", {})
        contents = result.get("contents", [])
        if contents:
            return contents[0].get("text", "")
        return ""
    
    async def _send_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if not self.websocket:
            raise Exception("Not connected to server")
            
        self.request_id += 1
        request_id = str(self.request_id)
        
        request = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": request_id
        }
        
        print(f"Sending request: {request}")
        await self.websocket.send(json.dumps(request))
        
        while True:
            response_data = await self.websocket.recv()
            print(f"Received response: {response_data}")
            response = json.loads(response_data)
            
            if response.get("id") == request_id:
                if "error" in response and response["error"] is not None:
                    error_info = response['error']
                    print(f"MCP Error details: {error_info}")
                    raise Exception(f"MCP Error: {error_info}")
                return response
            
    async def __aenter__(self):
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()