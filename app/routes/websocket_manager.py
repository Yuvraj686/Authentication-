from fastapi import WebSocket, APIRouter, WebSocketDisconnect, Query
from typing import Dict, List
from jose import JWTError, jwt
import json

from ..config import settings

router = APIRouter()

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            payload = json.dumps(message, default=str)
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.disconnect(ws, user_id)

    async def send_to_group(self, member_ids: List[str], message: dict):
        for user_id in member_ids:
            await self.send_to_user(user_id, message)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Clients connect with their JWT as a query param:
      ws://127.0.0.1:8000/ws?token=<access_token>

    The server keeps the socket alive and pushes new messages
    (group_message / dm_message) to the client in real-time.
    """
    # ── Authenticate ──────────────────────────
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = str(payload.get("user_id"))
        if not user_id or user_id == "None":
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    # ── Register ──────────────────────────────
    await manager.connect(websocket, user_id)
    try:
        # Keep the connection alive; the server only *sends* to the client.
        # The client may send pings or any text — we just discard it.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)