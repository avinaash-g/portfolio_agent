import asyncio
import json
import logging
from typing import AsyncGenerator

logger = logging.getLogger("sse_manager")

class SSEManager:
    def __init__(self):
        # Maps run_id -> list of asyncio.Queue
        self._listeners: dict[str, list[asyncio.Queue]] = {}
        # Maps run_id -> list of event dicts
        self._history: dict[str, list[dict]] = {}
        # Maps run_id -> latest event data
        self._last_state: dict[str, dict] = {}

    def subscribe(self, run_id: str, replay_history: bool = True) -> asyncio.Queue:
        if run_id not in self._listeners:
            self._listeners[run_id] = []
        queue = asyncio.Queue()

        # Replay past events so late-subscribing clients immediately catch up
        if replay_history and run_id in self._history:
            for item in self._history[run_id]:
                payload = json.dumps(item)
                queue.put_nowait(payload)

        self._listeners[run_id].append(queue)
        logger.info(f"Subscribed client to SSE events for run {run_id} (replayed {len(self._history.get(run_id, []))} events)")
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue):
        if run_id in self._listeners:
            try:
                self._listeners[run_id].remove(queue)
                if not self._listeners[run_id]:
                    del self._listeners[run_id]
            except ValueError:
                pass

    def get_last_state(self, run_id: str) -> dict | None:
        return self._last_state.get(run_id)

    def get_history(self, run_id: str) -> list[dict]:
        return list(self._history.get(run_id, []))

    async def broadcast(self, run_id: str, event_type: str, data: dict):
        event_dict = {"event": event_type, "data": data}
        self._history.setdefault(run_id, []).append(event_dict)
        self._last_state[run_id] = data

        if run_id in self._listeners:
            payload = json.dumps(event_dict)
            for queue in self._listeners[run_id]:
                await queue.put(payload)

sse_manager = SSEManager()

