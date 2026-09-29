import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager
from app.engine.graph_engine import graph_engine
from app.services.stream_service import stream_service

logger = logging.getLogger("ws_routes")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    Bi-directional WebSocket streaming endpoint.
    On connection, sends initial graph snapshot.
    Continuously broadcasts live events and anomalies.
    """
    await ws_manager.connect(websocket)

    # Send initial topology snapshot upon connection
    try:
        snapshot = graph_engine.get_snapshot()
        await websocket.send_text(json.dumps({
            "type": "INITIAL_SNAPSHOT",
            "snapshot": snapshot
        }))
    except Exception as e:
        logger.error(f"Error sending initial snapshot: {e}")

    try:
        while True:
            # Listen for client command messages
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                action = cmd.get("action")
                if action == "inject_scenario":
                    scenario = cmd.get("scenario")
                    if scenario:
                        await stream_service.inject_scenario(scenario)
                elif action == "pause":
                    stream_service.stop()
                elif action == "resume":
                    stream_service.start()
                elif action == "set_speed":
                    speed = cmd.get("tick_seconds", 1.8)
                    stream_service.tick_seconds = float(speed)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
