import { ParseAndSend } from '../windowManager.ts'
import WebSocket from 'ws'

interface WSConfig {
    token: string;
    heartbeatInterval?: number;
    heartbeatTimeout?: number;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    exponentialBackoff?: boolean;
}

interface HeartbeatTimer {
    ping: NodeJS.Timeout | null;
    pong: NodeJS.Timeout | null;
}

enum WSState {
    CLOSED = 'closed',
    CONNECTING = 'connecting', 
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting'
}

class WebSocketManager {
    private ws: WebSocket | null = null;
    private wsUrl: string = '';
    private config: Required<WSConfig>;
    private state: WSState = WSState.CLOSED;
    private reconnectAttempts: number = 0;
    private heartbeatTimers: HeartbeatTimer = { ping: null, pong: null };
    private lastPongTime: number = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    constructor() {
        this.config = {
            token: '',
            heartbeatInterval: 30000,    // 30秒发送一次心跳
            heartbeatTimeout: 10000,     // 10秒未收到响应则重连
            maxReconnectAttempts: 99,
            reconnectDelay: 3000,
            exponentialBackoff: true
        };
    }

    public init(config: WSConfig): void {
        this.config = { ...this.config, ...config };
        this.wsUrl = `${import.meta.env.VITE_WS_URL}?token=${this.config.token}`;
        this.connect();
    }

    public close(): void {
        this.state = WSState.CLOSED;
        this.clearAllTimers();
        
        if (this.ws) {
            // 移除事件监听器避免触发重连
            this.ws.onclose = null;
            this.ws.onerror = null;
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
    }

    public send(data: any): boolean {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
            return true;
        }
        return false;
    }

    public getState(): WSState {
        return this.state;
    }

    public isConnected(): boolean {
        return this.state === WSState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
    }

    private connect(): void {
        if (this.state === WSState.CONNECTING || this.state === WSState.CONNECTED) {
            return;
        }

        this.state = WSState.CONNECTING;
        this.clearAllTimers();

        try {
            this.ws = new WebSocket(this.wsUrl);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleConnectionError();
        }
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.state = WSState.CONNECTED;
            this.reconnectAttempts = 0;
            this.lastPongTime = Date.now();
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            this.handleDisconnection();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleConnectionError();
        };
    }

    private handleMessage(event: WebSocket.MessageEvent): void {
        try {
            const res = JSON.parse(event.data.toString());
            // 处理心跳响应
            if (res.code === 200) {
                if (res.type === "pong") {
                    this.lastPongTime = Date.now();
                    this.clearPongTimeout();
                    return;
                }
                ParseAndSend(res);
            } else {
                console.log("error: "+res.msg)  
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    private startHeartbeat(): void {
        this.clearHeartbeatTimers();
        
        // 定期发送心跳
        this.heartbeatTimers.ping = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.heartbeatInterval);
    }

    private sendHeartbeat(): void {
        if (!this.isConnected()) {
            this.clearHeartbeatTimers();
            return;
        }

        // 检查上次心跳响应时间
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > this.config.heartbeatInterval + this.config.heartbeatTimeout) {
            console.warn('Heartbeat timeout, reconnecting...');
            this.handleConnectionError();
            return;
        }

        // 发送心跳
        if (this.send('ping')) {
            // 设置心跳超时检查
            this.heartbeatTimers.pong = setTimeout(() => {
                console.warn('Heartbeat pong timeout, reconnecting...');
                this.handleConnectionError();
            }, this.config.heartbeatTimeout);
        }
    }

    private clearPongTimeout(): void {
        if (this.heartbeatTimers.pong) {
            clearTimeout(this.heartbeatTimers.pong);
            this.heartbeatTimers.pong = null;
        }
    }

    private clearHeartbeatTimers(): void {
        if (this.heartbeatTimers.ping) {
            clearInterval(this.heartbeatTimers.ping);
            this.heartbeatTimers.ping = null;
        }
        this.clearPongTimeout();
    }

    private clearAllTimers(): void {
        this.clearHeartbeatTimers();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private handleDisconnection(): void {
        if (this.state === WSState.CLOSED) {
            return;
        }

        this.clearHeartbeatTimers();
        this.attemptReconnect();
    }

    private handleConnectionError(): void {
        if (this.state === WSState.CLOSED) {
            return;
        }

        this.clearAllTimers();
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.attemptReconnect();
    }

    private attemptReconnect(): void {
        if (this.state === WSState.CLOSED) {
            return;
        }

        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.state = WSState.CLOSED;
            return;
        }

        if (this.state !== WSState.RECONNECTING) {
            this.state = WSState.RECONNECTING;
            console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})...`);
        }

        const delay = this.calculateReconnectDelay();
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    private calculateReconnectDelay(): number {
        if (!this.config.exponentialBackoff) {
            return this.config.reconnectDelay;
        }

        // 指数退避算法：基础延迟 * 2^重试次数，最大不超过30秒
        const exponentialDelay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        return Math.min(exponentialDelay, 30000);
    }
}

// 单例实例
const wsManager = new WebSocketManager();

// 导出的接口函数保持向后兼容
export function initWs(config: WSConfig): void {
    wsManager.init(config);
}

export function closeWs(): void {
    wsManager.close();
}

export function sendMessage(data: any): boolean {
    return wsManager.send(data);
}

export function getWSState(): WSState {
    return wsManager.getState();
}

export function isWSConnected(): boolean {
    return wsManager.isConnected();
}

// 导出类和枚举供高级用法
export { WebSocketManager, WSState };
export type { WSConfig };