import React, { useState, useEffect } from 'react';
import { MultiplayerGameState, ChatMessage } from '../../types/multiplayer';
import { socketService } from '../../services/socketService';
import { MultiplayerLobby } from './MultiplayerLobby';
import { MultiplayerRoomWaiting } from './MultiplayerRoomWaiting';
import { MultiplayerGameBoard } from './MultiplayerGameBoard';

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

  useEffect(() => {
    socketService.connect();
    const socket = socketService.getSocket();

    const handleGameState = (state: MultiplayerGameState) => {
      setGameState(state);
      setCurrentRoomId(state.roomId);
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    };

    socket.on('room:game_state', handleGameState);
    socket.on('room:chat_message', handleChatMessage);

    return () => {
      socket.off('room:game_state', handleGameState);
      socket.off('room:chat_message', handleChatMessage);
    };
  }, []);

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setChatMessages([]);
  };

  const handleLeaveRoom = () => {
    if (currentRoomId) {
      socketService.leaveRoom(currentRoomId);
    }
    setCurrentRoomId(null);
    setGameState(null);
    setChatMessages([]);
  };

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
