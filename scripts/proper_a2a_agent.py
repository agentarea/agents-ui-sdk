#!/usr/bin/env python3
"""
Proper A2A Agent implementation using Google's official a2a-sdk
Based on the HelloWorld example from a2a-samples
"""

import asyncio
from typing import Optional, AsyncIterator
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.requests import Request
import uvicorn
import argparse
import json
from a2a.server.agent_execution import AgentExecutor
from a2a.server.apps import A2AStarletteApplication
from a2a.types import AgentCard, AgentSkill, AgentCapabilities
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.events.event_queue import EventQueue
from a2a.server.tasks import InMemoryTaskStore
from a2a.server.agent_execution.context import RequestContext
from a2a.utils import new_agent_text_message


class SimpleAgent:
    """Simple agent that processes messages and returns responses"""
    
    async def process_message(self, message: str) -> str:
        """Process a message and return a response"""
        return f"Processed: {message}"

class SimpleAgentExecutor(AgentExecutor):
    """Agent executor that handles A2A protocol requests"""
    
    def __init__(self):
        self.agent = SimpleAgent()
    
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        """Execute the agent logic and send streaming response with A2A protocol events"""
        # Get the message from the request context
        message = "Hello World from A2A Agent!"
        if hasattr(context, 'request') and context.request and hasattr(context.request, 'message'):
            if hasattr(context.request.message, 'content'):
                message = context.request.message.content
            elif hasattr(context.request.message, 'parts') and context.request.message.parts:
                # Extract text from parts
                text_parts = []
                for part in context.request.message.parts:
                    if hasattr(part, 'text') and part.text:
                        text_parts.append(part.text)
                if text_parts:
                    message = ' '.join(text_parts)
        
        # Send task status update - started
        await event_queue.enqueue_event({
            "type": "task-status-update",
            "data": {
                "taskId": context.request_id,
                "status": {
                    "state": "running",
                    "progress": 0.1,
                    "message": "Task started - analyzing request"
                }
            }
        })
        
        # Send initial processing message
        await event_queue.enqueue_event(new_agent_text_message(f"🤖 Processing your request: {message}"))
        await asyncio.sleep(0.8)
        
        # Send progress update
        await event_queue.enqueue_event({
            "type": "task-status-update",
            "data": {
                "taskId": context.request_id,
                "status": {
                    "state": "running",
                    "progress": 0.3,
                    "message": "Gathering information..."
                }
            }
        })
        
        # Simulate streaming response with multiple chunks and different event types
        streaming_responses = [
            {"type": "message", "content": "🔍 I'm analyzing your request and gathering relevant context..."},
            {"type": "progress", "progress": 0.5, "message": "Processing data..."},
            {"type": "message", "content": "📊 Found relevant information. Generating response..."},
            {"type": "progress", "progress": 0.7, "message": "Crafting response..."},
            {"type": "message", "content": f"✨ **Response to '{message}':**\n\nThis is a comprehensive answer that demonstrates the A2A protocol streaming capabilities. The agent can:\n\n• Process complex requests\n• Provide real-time updates\n• Stream responses progressively\n• Handle various message types"},
            {"type": "artifact", "content": "📄 Generated artifact: analysis_report.md"},
            {"type": "progress", "progress": 0.9, "message": "Finalizing response..."},
            {"type": "message", "content": "✅ Task completed successfully! The agent has processed your request and provided a detailed response with streaming updates."}
        ]
        
        for i, response in enumerate(streaming_responses):
            await asyncio.sleep(0.6)  # Simulate processing time
            
            if response["type"] == "message":
                await event_queue.enqueue_event(new_agent_text_message(response["content"]))
            elif response["type"] == "progress":
                await event_queue.enqueue_event({
                    "type": "task-status-update",
                    "data": {
                        "taskId": context.request_id,
                        "status": {
                            "state": "running",
                            "progress": response["progress"],
                            "message": response["message"]
                        }
                    }
                })
            elif response["type"] == "artifact":
                await event_queue.enqueue_event({
                    "type": "artifact-update",
                    "data": {
                        "taskId": context.request_id,
                        "artifact": {
                            "id": f"artifact_{i}",
                            "name": "analysis_report.md",
                            "type": "text/markdown",
                            "content": f"# Analysis Report\n\nRequest: {message}\n\nThis is a mock artifact generated by the A2A agent to demonstrate artifact streaming capabilities.",
                            "metadata": {
                                "created_at": "2024-01-01T12:00:00Z",
                                "size": 156
                            }
                        }
                    }
                })
        
        # Send final task completion status
        await event_queue.enqueue_event({
            "type": "task-status-update",
            "data": {
                "taskId": context.request_id,
                "status": {
                    "state": "completed",
                    "progress": 1.0,
                    "message": "Task completed successfully"
                }
            }
        })
    
    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        """Handle task cancellation"""
        await event_queue.enqueue_event(new_agent_text_message("Task cancelled"))


def create_agent_card(port: int) -> AgentCard:
    """Create the agent card that describes this agent's capabilities"""
    
    # Define the agent's skill
    skill = AgentSkill(
        id="simple_chat",
        name="Simple Chat",
        description="A simple chat agent that can respond to messages and provide basic assistance",
        tags=["chat", "assistant", "simple"],
        examples=[
            "Hello, how are you?",
            "Can you help me?",
            "What time is it?"
        ]
    )
    
    # Create the agent card
    agent_card = AgentCard(
        name="Simple A2A Agent",
        description="A simple agent that demonstrates A2A protocol implementation with streaming support",
        url=f"http://localhost:{port}/",
        version="1.0.0",
        defaultInputModes=["text"],
        defaultOutputModes=["text"],
        capabilities=AgentCapabilities(
            streaming=True,
            pushNotifications=False
        ),
        skills=[skill]
    )
    
    return agent_card


def create_extended_agent_card(port: int) -> AgentCard:
    """Create the extended agent card (for authenticated requests)."""
    base_card = create_agent_card(port)
    # Add additional skills for authenticated users
    extended_skills = base_card.skills + [
        AgentSkill(
            id="advanced_help",
            name="Advanced Help",
            description="Get detailed help and advanced features (authenticated users only)",
            examples=["Advanced help", "Show all features"]
        )
    ]
    
    return AgentCard(
        name=base_card.name + " (Extended)",
        description=base_card.description + " with extended features for authenticated users",
        url=f"http://localhost:{port}/",
        version="1.0.0",
        defaultInputModes=["text"],
        defaultOutputModes=["text"],
        capabilities=AgentCapabilities(
            streaming=True,
            pushNotifications=False
        ),
        skills=extended_skills
    )


def main():
    """Main function to run the A2A agent server"""
    parser = argparse.ArgumentParser(description='Run A2A Agent Server')
    parser.add_argument('--port', type=int, default=5055, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='localhost', help='Host to run the server on')
    args = parser.parse_args()
    
    # Create agent card
    agent_card = create_agent_card(args.port)
    
    # Create agent executor
    agent_executor = SimpleAgentExecutor()
    
    # Create task store
    task_store = InMemoryTaskStore()
    
    # Create request handler
    request_handler = DefaultRequestHandler(
        agent_executor=agent_executor,
        task_store=task_store
    )
    
    # Create REST endpoint handlers for frontend compatibility
    async def handle_message_send(request: Request):
        """Handle REST-style message.send requests"""
        try:
            body = await request.json()
            
            # Convert REST request to JSON-RPC format
            jsonrpc_request = {
                "jsonrpc": "2.0",
                "id": f"rest-{asyncio.get_event_loop().time()}",
                "method": "message/send",
                "params": body
            }
            
            # Process through the A2A request handler
            context = RequestContext()
            
            # For REST compatibility, return a simple success response
            # The actual A2A protocol will handle streaming through the proper endpoints
            return JSONResponse({
                "jsonrpc": "2.0",
                "id": jsonrpc_request["id"],
                "result": {
                    "id": jsonrpc_request["id"],
                    "status": {"state": "accepted"},
                    "message": "Task accepted and will be processed via A2A protocol"
                }
            })
            
        except Exception as e:
            return JSONResponse(
                {
                    "jsonrpc": "2.0",
                    "id": "error",
                    "error": {
                        "code": -32603,
                        "message": f"Internal error: {str(e)}"
                    }
                },
                status_code=500
            )
    
    # Create A2A Starlette application
    a2a_app = A2AStarletteApplication(
        agent_card=agent_card,
        http_handler=request_handler
    )
    
    app = a2a_app.build()
    
    # Add REST endpoints for frontend compatibility
    from starlette.routing import Mount
    rest_routes = [
        Route("/message.send", handle_message_send, methods=["POST"]),
        Route("/task.get", handle_message_send, methods=["POST"]),  # Reuse for now
        Route("/task.cancel", handle_message_send, methods=["POST"])  # Reuse for now
    ]
    
    # Mount REST endpoints under /a2a/
    app.mount("/a2a", Starlette(routes=rest_routes))
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    print(f"Starting A2A Agent Server on {args.host}:{args.port}")
    print(f"Agent Card available at: http://{args.host}:{args.port}/.well-known/agent.json")
    print(f"A2A Protocol endpoint: http://{args.host}:{args.port}/a2a")
    
    # Run the server
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )


if __name__ == "__main__":
    main()