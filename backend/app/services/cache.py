"""Thread-safe, lightweight in-memory cache with Time-To-Live (TTL) expiration."""

import time
import threading
from typing import Any, Dict, Optional, Tuple


class InMemoryTTLCache:
    """In-memory key-value store with per-item TTL expiration."""

    def __init__(self):
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Retrieves an item if it exists and has not expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: float) -> None:
        """Stores an item with an expiration duration in seconds."""
        with self._lock:
            expires_at = time.time() + max(1.0, ttl_seconds)
            self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        """Deletes a key from the cache."""
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Flushes all cached entries."""
        with self._lock:
            self._store.clear()

    def count(self) -> int:
        """Returns the number of active, non-expired cached entries."""
        now = time.time()
        with self._lock:
            active_keys = [k for k, (_, exp) in self._store.items() if exp > now]
            return len(active_keys)


# Global singleton instance for application-wide telemetry caching
memory_cache = InMemoryTTLCache()
