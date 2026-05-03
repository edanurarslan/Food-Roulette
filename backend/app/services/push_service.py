"""Send push notifications via Expo Push API."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(
    expo_push_tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Send one Expo push message per token (Expo accepts batched messages).
    """
    tokens = [t for t in expo_push_tokens if t]
    if not tokens:
        return {"skipped": True, "reason": "no_tokens"}

    messages: List[Dict[str, Any]] = []
    for token in tokens:
        msg: Dict[str, Any] = {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
        }
        if data:
            msg["data"] = data
        messages.append(msg)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        return response.json()
