import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(onConnectCallback) {
    if (this.client && this.isConnected) {
      if (onConnectCallback) onConnectCallback();
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
    const wsUrl = apiUrl.replace('/api', '/ws');

    try {
      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(wsUrl);
          } catch (e) {
            console.warn('SockJS init fallback:', e);
            const nativeWs = wsUrl.replace('http://', 'ws://').replace('https://', 'wss://');
            return new WebSocket(nativeWs);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.isConnected = true;
          // Resubscribe active channels on reconnect
          this.subscriptions.forEach((callback, topic) => {
            this._subscribeToTopic(topic, callback);
          });
          if (onConnectCallback) onConnectCallback();
        },
        onDisconnect: () => {
          this.isConnected = false;
        },
        onStompError: (frame) => {
          console.warn('STOMP broker notice:', frame?.headers?.['message']);
        },
        onWebSocketError: (event) => {
          // Suppress noise if backend is offline
          this.isConnected = false;
        },
      });

      this.client.activate();
    } catch (e) {
      console.warn('WebSocket client activation notice:', e);
    }
  }

  _subscribeToTopic(topic, callback) {
    if (!this.client || !this.isConnected) return;
    try {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (e) {
          callback(message.body);
        }
      });
      return sub;
    } catch (e) {
      console.warn('Subscription notice on topic:', topic);
    }
  }

  subscribeToBus(busNumberOrId, callback) {
    const topic = `/topic/bus/${busNumberOrId}`;
    this.subscriptions.set(topic, callback);
    if (this.isConnected) {
      return this._subscribeToTopic(topic, callback);
    }
  }

  subscribeToAllBuses(callback) {
    const topic = '/topic/buses';
    this.subscriptions.set(topic, callback);
    if (this.isConnected) {
      return this._subscribeToTopic(topic, callback);
    }
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
  }

  disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        // ignore
      }
      this.isConnected = false;
      this.client = null;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
