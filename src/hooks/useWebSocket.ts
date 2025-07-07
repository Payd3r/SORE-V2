'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WSS_URL || 'ws://localhost:3002';

interface WebSocketState<T> {
  lastMessage: T | null;
  readyState: number;
  sendMessage: (message: any) => void;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'uninstantiated';
}

export function useWebSocket<T = any>(clientId: string): WebSocketState<T> {
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closing' | 'closed' | 'uninstantiated'>('uninstantiated');

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    if (!clientId) return;

    setConnectionStatus('connecting');
    
    const socket = new WebSocket(`${WEBSOCKET_URL}?clientId=${clientId}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setReadyState(WebSocket.OPEN);
      setConnectionStatus('open');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      setReadyState(WebSocket.CLOSED);
      setConnectionStatus('closed');
      
      // Don't reconnect if the close was intentional
      if (event.code !== 1000 && !reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 5000); // Reconnect after 5 seconds
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setReadyState(WebSocket.CLOSED);
      setConnectionStatus('closed');
      socket.close(); // Ensure it closes on error
    };

  }, [clientId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected.');
    }
  };
  
  return { lastMessage, readyState, sendMessage, connectionStatus };
} 