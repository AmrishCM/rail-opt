import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket
from sqlalchemy.orm import Session

from ..models.execution import DomainEvent, Notification

logger = logging.getLogger("railopt.event_bus")

class WebSocketConnectionManager:
    """
    Manages active client WebSocket connections for real-time synchronization
    across Inspector, Manager, Engineer, and Admin devices.
    """
    def __init__(self):
        # Map websocket -> user metadata dict
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_info: Optional[Dict[str, Any]] = None):
        await websocket.accept()
        async with self.lock:
            self.active_connections[websocket] = user_info or {
                "user_id": None,
                "role": "ANONYMOUS",
                "email": "anonymous",
                "full_name": "Anonymous Guest",
                "department": None,
                "connected_at": datetime.now().isoformat()
            }
        logger.info(f"WebSocket connected: {user_info.get('email') if user_info else 'anonymous'} ({len(self.active_connections)} active)")

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            info = self.active_connections.pop(websocket, None)
        if info:
            logger.info(f"WebSocket disconnected: {info.get('email')} ({len(self.active_connections)} remaining)")

    def get_online_users(self) -> List[Dict[str, Any]]:
        """Returns list of currently connected distinct users with roles."""
        seen = set()
        online = []
        for info in self.active_connections.values():
            uid = info.get("user_id") or info.get("email")
            if uid and uid not in seen and uid != "anonymous":
                seen.add(uid)
                online.append({
                    "user_id": info.get("user_id"),
                    "email": info.get("email"),
                    "full_name": info.get("full_name"),
                    "role": info.get("role"),
                    "department": info.get("department"),
                    "connected_at": info.get("connected_at")
                })
        return online

    async def broadcast(self, message: dict, target_role: Optional[str] = None, target_user_id: Optional[int] = None):
        """
        Broadcasts JSON event to connected clients.
        If target_role or target_user_id is specified, filters delivery accordingly.
        """
        data_text = json.dumps(message, default=str)
        dead_sockets: List[WebSocket] = []

        async with self.lock:
            sockets_to_send = list(self.active_connections.items())

        for ws, info in sockets_to_send:
            # Filtering
            if target_user_id and info.get("user_id") != target_user_id:
                continue
            if target_role and info.get("role") != target_role and info.get("role") != "SYSTEM_ADMIN":
                continue

            try:
                await ws.send_text(data_text)
            except Exception as ex:
                logger.warning(f"Error sending to websocket client: {ex}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with self.lock:
                for ws in dead_sockets:
                    self.active_connections.pop(ws, None)

ws_manager = WebSocketConnectionManager()

class DomainEventBus:
    """
    Authoritative Domain Event Bus.
    Every operational mutation publishes an event that:
    1. Persists to the domain_events audit table.
    2. Generates persistent notifications for relevant roles.
    3. Broadcasts real-time WebSocket packets to all connected clients.
    """
    def __init__(self, connection_manager: WebSocketConnectionManager):
        self.ws_manager = connection_manager

    @classmethod
    def publish(
        cls,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        title: Optional[str] = None,
        message: Optional[str] = None,
        target_role: Optional[str] = None,
        target_user_id: Optional[int] = None,
        user_id: Optional[Any] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        notification_type: str = "INFO",
        link: Optional[str] = None,
        db: Optional[Session] = None,
        **kwargs
    ) -> DomainEvent:
        """
        Publishes a domain event synchronously within a DB transaction
        and schedules asynchronous WebSocket distribution.
        """
        payload_str = json.dumps(payload, default=str)
        eff_user_id = str(user_id or payload.get("user_id", payload.get("created_by", "SYSTEM")))

        domain_event = DomainEvent(
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=str(aggregate_id),
            payload=payload_str,
            target_role=target_role,
            user_id=eff_user_id
        )

        if db:
            db.add(domain_event)

            # Persist notification if title & message provided
            if title and message:
                notif = Notification(
                    user_id=target_user_id,
                    target_role=target_role,
                    event_type=event_type,
                    title=title,
                    message=message,
                    link=link,
                    reference_type=reference_type or aggregate_type,
                    reference_id=str(reference_id or aggregate_id),
                    notification_type=notification_type
                )
                db.add(notif)
            try:
                db.commit()
            except Exception as ex:
                logger.error(f"Error committing DomainEvent/Notification: {ex}")

        # Broadcast packet for WebSocket clients
        event_packet = {
            "type": "DOMAIN_EVENT",
            "event_type": event_type,
            "aggregate_type": aggregate_type,
            "aggregate_id": str(aggregate_id),
            "payload": payload,
            "target_role": target_role,
            "target_user_id": target_user_id,
            "timestamp": datetime.now().isoformat(),
            "notification": {
                "title": title,
                "message": message,
                "type": notification_type,
                "link": link
            } if title and message else None
        }

        # Dispatch via active event loop
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(ws_manager.broadcast(event_packet, target_role, target_user_id))
        except RuntimeError:
            # When called outside async event loop (e.g. background threads or sync tests)
            try:
                new_loop = asyncio.new_event_loop()
                new_loop.run_until_complete(ws_manager.broadcast(event_packet, target_role, target_user_id))
                new_loop.close()
            except Exception:
                pass

        return domain_event

event_bus = DomainEventBus(ws_manager)
