from typing import Dict, Any, Optional, List
import json
import asyncio
from pydantic import BaseModel

class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[str] = None

class JsonRpcResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[str] = None
    
    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        # Remove error field if it's None to avoid confusion
        if data.get("error") is None:
            data.pop("error", None)
        return data

class MCPServer:
    def __init__(self):
        self.capabilities = {
            "tools": {},
            "resources": {}
        }
        self.tools = {}
        self.resources = {}
        
    def add_tool(self, name: str, description: str, parameters: Dict[str, Any], handler):
        self.tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": {
                "type": "object",
                "properties": parameters
            },
            "handler": handler
        }
        
    def add_resource(self, uri: str, name: str, description: str, handler):
        self.resources[uri] = {
            "uri": uri,
            "name": name,
            "description": description,
            "handler": handler
        }
        
    async def handle_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            request = JsonRpcRequest(**request_data)
            print(f"MCP Server received: {request.method}")
            
            if request.method == "initialize":
                return self._handle_initialize(request)
            elif request.method == "tools/list":
                return self._handle_tools_list(request)
            elif request.method == "tools/call":
                return await self._handle_tools_call(request)
            elif request.method == "resources/list":
                return self._handle_resources_list(request)
            elif request.method == "resources/read":
                return await self._handle_resources_read(request)
            else:
                return self._error_response(request.id, -32601, "Method not found")
                
        except Exception as e:
            print(f"MCP Server error: {e}")
            return self._error_response(None, -32603, f"Internal error: {str(e)}")
    
    def _handle_initialize(self, request: JsonRpcRequest) -> Dict[str, Any]:
        print(f"Initialize request params: {request.params}")
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": False},
                "resources": {"listChanged": False}
            },
            "serverInfo": {
                "name": "mcp-tictactoe",
                "version": "0.1.0"
            }
        }
        response = JsonRpcResponse(id=request.id, result=result).model_dump()
        print(f"Initialize response: {response}")
        return response
    
    def _handle_tools_list(self, request: JsonRpcRequest) -> Dict[str, Any]:
        tools = [
            {
                "name": tool["name"],
                "description": tool["description"],
                "inputSchema": tool["inputSchema"]
            }
            for tool in self.tools.values()
        ]
        return JsonRpcResponse(id=request.id, result={"tools": tools}).model_dump()
    
    async def _handle_tools_call(self, request: JsonRpcRequest) -> Dict[str, Any]:
        params = request.params or {}
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name not in self.tools:
            return self._error_response(request.id, -32602, "Tool not found")
            
        try:
            handler = self.tools[tool_name]["handler"]
            result = await handler(**arguments)
            return JsonRpcResponse(
                id=request.id,
                result={"content": [{"type": "text", "text": str(result)}]}
            ).model_dump()
        except Exception as e:
            return self._error_response(request.id, -32603, f"Tool execution failed: {str(e)}")
    
    def _handle_resources_list(self, request: JsonRpcRequest) -> Dict[str, Any]:
        resources = [
            {
                "uri": resource["uri"],
                "name": resource["name"],
                "description": resource["description"]
            }
            for resource in self.resources.values()
        ]
        return JsonRpcResponse(id=request.id, result={"resources": resources}).model_dump()
    
    async def _handle_resources_read(self, request: JsonRpcRequest) -> Dict[str, Any]:
        params = request.params or {}
        uri = params.get("uri")
        
        if uri not in self.resources:
            return self._error_response(request.id, -32602, "Resource not found")
            
        try:
            handler = self.resources[uri]["handler"]
            result = await handler()
            return JsonRpcResponse(
                id=request.id,
                result={"contents": [{"uri": uri, "text": str(result)}]}
            ).model_dump()
        except Exception as e:
            return self._error_response(request.id, -32603, f"Resource read failed: {str(e)}")
    
    def _error_response(self, id: Optional[str], code: int, message: str) -> Dict[str, Any]:
        return JsonRpcResponse(
            id=id,
            error={"code": code, "message": message}
        ).model_dump()