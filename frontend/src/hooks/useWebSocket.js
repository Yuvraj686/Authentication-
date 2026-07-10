import { useState, useRef, useEffect, useCallback } from "react";
import { decodeJWT } from "../utils";

export default function useWebSocket({ onGroupMessage, onDMMessage }) {
  const [wsStatus, setWsStatus] = useState("connecting");

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);

  const onGroupMessageRef = useRef(onGroupMessage);
  const onDMMessageRef = useRef(onDMMessage);
  useEffect(() => { onGroupMessageRef.current = onGroupMessage; }, [onGroupMessage]);
  useEffect(() => { onDMMessageRef.current = onDMMessage; }, [onDMMessage]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      setWsStatus("open");
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "group_message") {
          onGroupMessageRef.current?.(msg);
        } else if (msg.type === "dm_message") {
          onDMMessageRef.current?.(msg);
        }
      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    ws.onclose = () => {
      setWsStatus("closed");
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connectWebSocket();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return { wsStatus };
}
