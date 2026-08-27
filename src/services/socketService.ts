import { io, Socket } from 'socket.io-client';
import { AvailableClaim } from '../types/mahjong';
import {
  MultiplayerGameState,
  ChatMessage,
  RoomListItem,
  RoomSettings,
} from '../types/multiplayer';

export interface UserProfile {
  userId: string;
  name: string;
  avatar: string;
}

const STORAGE_KEY_USER = 'wuxing_mahjong_user_profile';

export function getLocalUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }

  const randomAvatars = ['🐉', '🦅', '🐅', '🐢', '🦄', '☯️', '🎋', '⚡', '🔥', '🌊'];
  const randomNames = ['五行侠客', '天干道人', '地支仙尊', '太极宗师', '冲战先锋', '八卦掌门', '阴阳圣手'];
  const newProfile: UserProfile = {
    userId: 'user_' + Math.random().toString(36).substring(2, 10),
    name: randomNames[Math.floor(Math.random() * randomNames.length)] + '_' + Math.floor(Math.random() * 900 + 100),
    avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
  };
  saveLocalUserProfile(newProfile);
  return newProfile;
}

export function saveLocalUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
  } catch (e) {
    // ignore
  }
}

export const STORAGE_KEY_SERVER_URL = 'wuxing_mahjong_server_url';
export const DEFAULT_CLOUD_RELAY_URL = 'https://ais-dev-njguhqpd5y2a7es34qgqzk-689354523715.us-east1.run.app';

export function getServerUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved !== null && saved.trim() !== '') {
      return saved.trim();
    }
  } catch (e) {
    // ignore
  }
  // Check build-time env
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_BACKEND_URL) {
      return metaEnv.VITE_BACKEND_URL;
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export function saveServerUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SERVER_URL, url.trim());
  } catch (e) {
    // ignore
  }
}

export function getEffectiveApiUrl(path: string): string {
  const base = getServerUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return cleanPath;
  return `${base.replace(/\/+$/, '')}${cleanPath}`;
}

export async function testServerHealth(targetUrl?: string): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const base = targetUrl !== undefined ? targetUrl.trim() : getServerUrl();
  const testPath = base ? `${base.replace(/\/+$/, '')}/api/health` : '/api/health';
  const start = Date.now();
  try {
    const res = await fetch(testPath, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    const latencyMs = Date.now() - start;
    if (data.status === 'ok') {
      return { success: true, latencyMs };
    }
    return { success: false, error: '服务器返回异常响应' };
  } catch (e: any) {
    return { success: false, error: e.message || '网络无法连接到该地址' };
  }
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  getSocket(): Socket {
    if (!this.socket) {
      const serverUrl = getServerUrl();
      const opts = {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 1000,
        transports: ['polling', 'websocket'] as ('polling' | 'websocket')[],
      };

      if (serverUrl) {
        this.socket = io(serverUrl, opts);
      } else {
        this.socket = io(opts);
      }
    }
    return this.socket;
  }

  reconnectWithServerUrl(newUrl?: string): void {
    if (newUrl !== undefined) {
      saveServerUrl(newUrl);
    }
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {}
      this.socket = null;
    }
    this.isConnecting = false;
    this.connect();
  }

  getServerUrl(): string {
    return getServerUrl();
  }

  getEffectiveApiUrl(path: string): string {
    return getEffectiveApiUrl(path);
  }

  connect(): void {
    const s = this.getSocket();
    if (!s.connected && !this.isConnecting) {
      this.isConnecting = true;
      s.connect();
      s.on('connect', () => {
        this.isConnecting = false;
      });
      s.on('connect_error', () => {
        this.isConnecting = false;
      });
    }
  }

  createRoom(
    roomName: string,
    settings: Partial<RoomSettings>,
    callback: (res: { success: boolean; roomId?: string; state?: MultiplayerGameState; error?: string }) => void
  ): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit(
      'room:create',
      {
        userId: profile.userId,
        name: profile.name,
        avatar: profile.avatar,
        roomName,
        settings,
      },
      callback
    );
  }

  joinRoom(
    roomId: string,
    password?: string,
    callback?: (res: { success: boolean; roomId?: string; state?: MultiplayerGameState; error?: string; message?: string }) => void
  ): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit(
      'room:join',
      {
        roomId,
        userId: profile.userId,
        name: profile.name,
        avatar: profile.avatar,
        password,
      },
      callback
    );
  }

  quickMatch(callback: (res: { success: boolean; roomId?: string; state?: MultiplayerGameState; error?: string }) => void): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit(
      'room:quick_match',
      {
        userId: profile.userId,
        name: profile.name,
        avatar: profile.avatar,
      },
      callback
    );
  }

  syncRoom(
    roomId: string,
    callback?: (res: { success: boolean; state?: MultiplayerGameState; error?: string }) => void
  ): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:sync', { roomId, userId: profile.userId }, callback);
  }

  leaveRoom(roomId: string, callback?: (res: { success: boolean }) => void): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:leave', { roomId, userId: profile.userId }, callback);
  }

  setReady(roomId: string, isReady: boolean): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:set_ready', { roomId, userId: profile.userId, isReady });
  }

  addBot(roomId: string, seatIndex: number): void {
    this.getSocket().emit('room:add_bot', { roomId, seatIndex });
  }

  kickSeat(roomId: string, seatIndex: number): void {
    this.getSocket().emit('room:kick_seat', { roomId, seatIndex });
  }

  startGame(roomId: string, callback?: (res: { success: boolean; error?: string }) => void): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:start_game', { roomId, userId: profile.userId }, callback);
  }

  discard(roomId: string, tileId: string): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:discard', { roomId, userId: profile.userId, tileId });
  }

  submitClaim(roomId: string, claim: AvailableClaim | null): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:claim_action', { roomId, userId: profile.userId, claim });
  }

  selfDrawHu(roomId: string, callback?: (res: { success: boolean }) => void): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:self_draw_hu', { roomId, userId: profile.userId }, callback);
  }

  sendChat(roomId: string, text: string, type: 'text' | 'emoji' | 'shout' = 'text'): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:send_chat', {
      roomId,
      userId: profile.userId,
      name: profile.name,
      avatar: profile.avatar,
      text,
      type,
    });
  }

  restartGame(roomId: string): void {
    const profile = getLocalUserProfile();
    this.getSocket().emit('room:restart_game', { roomId, userId: profile.userId });
  }
}

export const socketService = new SocketService();
