import React, { useState, useEffect } from 'react';
import { MultiplayerGameState, ChatMessage } from '../../types/multiplayer';
import { socketService } from '../../services/socketService';
import { MultiplayerLobby } from './MultiplayerLobby';
import { MultiplayerRoomWaiting } from './MultiplayerRoomWaiting';
import { MultiplayerGameBoard } from './MultiplayerGameBoard';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface MultiplayerViewProps {
  onBackToSinglePlayer: () => void;
  onOpenRules: () => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({
  onBackToSinglePlayer,
  onOpenRules,
}) => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    socketService.connect();
    const socket = socketService.getSocket();

    const handleGameState = (state: MultiplayerGameState) => {
      setGameState(state);
      setCurrentRoomId(state.roomId);
      setIsSyncing(false);
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    };

    socket.on('room:game_state', handleGameState);
    socket.on('room:public_state', handleGameState);
    socket.on('room:chat_message', handleChatMessage);

    return () => {
      socket.off('room:game_state', handleGameState);
      socket.off('room:public_state', handleGameState);
      socket.off('room:chat_message', handleChatMessage);
    };
  }, []);

  const handleJoinRoom = (roomId: string, initialState?: MultiplayerGameState) => {
    setCurrentRoomId(roomId);
    if (initialState) {
      setGameState(initialState);
      setIsSyncing(false);
    } else {
      setIsSyncing(true);
      socketService.syncRoom(roomId, res => {
        if (res.success && res.state) {
          setGameState(res.state);
        }
        setIsSyncing(false);
      });
    }
    setChatMessages([]);
  };

  const handleLeaveRoom = () => {
    if (currentRoomId) {
      socketService.leaveRoom(currentRoomId);
    }
    setCurrentRoomId(null);
    setGameState(null);
    setChatMessages([]);
    setIsSyncing(false);
  };

  // If in room ID but game state is syncing
  if (currentRoomId && (!gameState || isSyncing)) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-3xl">
          🀄
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-amber-300">
            正在进入五行对战桌台 #{currentRoomId}
          </h3>
          <p className="text-xs text-slate-400">正在与全服对战服务器同步排盘与座位数据...</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSyncing(true);
              socketService.syncRoom(currentRoomId, res => {
                if (res.success && res.state) setGameState(res.state);
                setIsSyncing(false);
              });
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>重新同步</span>
          </button>
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回大厅</span>
          </button>
        </div>
      </div>
    );
  }

  // If not in a room, render Lobby
  if (!currentRoomId || !gameState) {
    return (
      <MultiplayerLobby
        onJoinRoom={handleJoinRoom}
        onBackToSinglePlayer={onBackToSinglePlayer}
      />
    );
  }

  // If in room and waiting for game to start
  if (gameState.status === 'waiting') {
    return (
      <MultiplayerRoomWaiting
        gameState={gameState}
        chatMessages={chatMessages}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // If in game
  return (
    <MultiplayerGameBoard
      gameState={gameState}
      chatMessages={chatMessages}
      onLeaveRoom={handleLeaveRoom}
      onOpenRules={onOpenRules}
    />
  );
};
