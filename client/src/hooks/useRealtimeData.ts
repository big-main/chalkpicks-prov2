import { useState, useEffect, useCallback, useRef } from "react";

interface UseRealtimeDataOptions {
  channel: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

/**
 * Hook for subscribing to real-time WebSocket data
 * 
 * Usage:
 * const { data, isConnected, error } = useRealtimeData({ channel: "live-scores" });
 */
export function useRealtimeData<T = any>({
  channel,
  reconnectInterval = 5000,
  maxReconnectAttempts = 3,
  enabled = true,
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${channel}`);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to channel
        ws.send(
          JSON.stringify({
            type: "subscribe",
            channel,
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Only process updates for this channel
          if (message.channel === channel && message.type === "update") {
            setData(message.data);
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffDelay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, backoffDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Max reconnection attempts reached");
        }
      };
    } catch (err) {
      console.error("[WebSocket] Connection error:", err);
      setError(String(err));
    }
  }, [channel, reconnectInterval, maxReconnectAttempts, enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);

  return { data, isConnected, error };
}

/**
 * Hook for subscribing to multiple channels
 */
export function useRealtimeDataMultiple(channels: string[], enabled = true) {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected to multiple channels");
        setIsConnected(true);
        setError(null);

        // Subscribe to all channels
        channels.forEach((ch) => {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel: ch,
              timestamp: Date.now(),
            })
          );
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "update" && message.channel) {
            setAllData((prev) => ({
              ...prev,
              [message.channel]: message.data,
            }));
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected from multiple channels");
        setIsConnected(false);
        wsRef.current = null;
      };
    } catch (err) {
      console.error("[WebSocket] Connection error:", err);
      setError(String(err));
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channels, enabled]);

  return { allData, isConnected, error };
}
