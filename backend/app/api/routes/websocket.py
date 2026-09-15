import asyncio
import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session

from ...db.session import get_db, SessionLocal
from ...models.auth import User
from ...utils.security import decode_token
from ...services.event_bus import ws_manager, event_bus

logger = logging.getLogger("railopt.websocket")

router = APIRouter()

async def get_user_from_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        if not payload:
            return None
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == payload.get("sub")).first()
            if user:
                return {
                    "user_id": user.user_id,
                    "employee_id": user.employee_id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "department": user.department,
                    "section_code": user.section_code
                }
        finally:
            db.close()
    except Exception as ex:
        logger.warning(f"Failed to authenticate WebSocket token: {ex}")
    return None

@router.websocket("/ws/events")
@router.websocket("/ws/notifications")
@router.websocket("/ws/workflow")
async def websocket_event_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    Unified WebSocket endpoint for real-time domain events, workflow updates,
    and push notifications across all connected clients.
    """
    user_info = await get_user_from_token(token)
    await ws_manager.connect(websocket, user_info)

    # Send initial connection acknowledgment
    try:
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "status": "connected",
            "user": user_info,
            "message": "Connected to RailOpt-AI Realtime Event Bus"
        }))
    except Exception:
        pass

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle client ping
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": str(asyncio.get_event_loop().time())}))
                elif msg.get("type") == "SUBSCRIBE":
                    # Subscription ack
                    await websocket.send_text(json.dumps({"type": "SUBSCRIBED", "channels": msg.get("channels", ["all"])}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as ex:
        logger.warning(f"WebSocket session terminated: {ex}")
        await ws_manager.disconnect(websocket)

@router.get("/online-users")
def list_online_users():
    """Returns list of currently active users connected over WebSockets."""
    users = ws_manager.get_online_users()
    return {
        "count": len(users),
        "users": users
    }
