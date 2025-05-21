import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/chat/ws/3"
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuaWtpdGFAZXhhbXBsZS5jb20iLCJleHAiOjE3NDczMzM0MzYsInR5cGUiOiJhY2Nlc3MifQ.D84LG4rkzO7EX_h70WBkMMTeeIqQnD3wQspRfeJrObs"  # Замени на реальный токен
    }
    async with websockets.connect(uri, extra_headers=headers) as websocket:
        message = {
            "task_id": 1,
            "message": "Привет, гавно!",
            "to": 2
        }
        await websocket.send(json.dumps(message))
        response = await websocket.recv()
        print(f"Получено: {response}")

asyncio.run(test_websocket())