import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  Bot,
  UserPlus,
  UserX,
  LogOut,
  Sparkles,
  ShieldAlert,
  Send,
  Radio,
  Crown,
  Lock,
} from 'lucide-react';
import { MultiplayerGameState, OnlinePlayer, ChatMessage } from '../../types/multiplayer';
import { socketService, getLocalUserProfile } from '../../services/socketService';

interface MultiplayerRoomWaitingProps {
  gameState: MultiplayerGameState;
  chatMessages: ChatMessage[];
  onLeaveRoom: () => void;
}

const SEAT_DIRECTIONS = ['东位 · 庄家', '南位 · 下家', '西位 · 对家', '北位 · 上家'];
const QUICK_PHRASES = [
  '五行生克，道友请赐教！',
  '准备好了，随时可以开局！',
  '天干地支，尽在掌握！',
  '冲战砍已备好，小心放铳！',
  '各位道友，手下留情！',
];

export const MultiplayerRoomWaiting: React.FC<MultiplayerRoomWaitingProps> = ({
  gameState,
  chatMessages,
  onLeaveRoom,
}) => {
  const myProfile = getLocalUserProfile();
  const myPlayer = gameState.players.find(p => p?.userId === myProfile.userId);
  const isHost = myPlayer?.isHost ?? false;

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');

  const activePlayersCount = gameState.players.filter(p => p !== null).length;
  const allReady = gameState.players
    .filter((p): p is OnlinePlayer => p !== null)
    .every(p => p.isReady || p.isHost || p.isBot);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleReady = () => {
    if (!myPlayer) return;
    socketService.setReady(gameState.roomId, !myPlayer.isReady);
  };

  const handleStartGame = () => {
    setErrorBanner('');
    socketService.startGame(gameState.roomId, res => {
      if (!res.success) {
        setErrorBanner(res.error || '无法开始游戏，请检查所有道友是否就绪');
        setTimeout(() => setErrorBanner(''), 4000);
      }
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketService.sendChat(gameState.roomId, chatInput.trim(), 'text');
    setChatInput('');
  };

  const handleSendQuickPhrase = (phrase: string) => {
    socketService.sendChat(gameState.roomId, phrase, 'shout');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 space-y-4 animate-in fade-in">
      
      {/* Room Header Card */}
      <div className="bg-[#1C1230] border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-500/40 text-amber-300 font-black text-xs">
              桌台 #{gameState.roomId}
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">{gameState.roomName}</h2>
            {gameState.settings.isPrivate && (
              <span className="p-1 rounded-md bg-red-950/80 text-red-400 text-xs">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>限时：<b className="text-amber-300">{gameState.settings.turnTimeLimit}s</b> / 步</span>
            <span>·</span>
            <span>自动补齐电脑人：<b className={gameState.settings.autoFillBots ? 'text-emerald-400' : 'text-slate-500'}>
              {gameState.settings.autoFillBots ? '开启' : '关闭'}
            </b></span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 shadow-sm"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedCode ? '已复制房号' : '邀请好友 (复制房号)'}</span>
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-3.5 py-2 rounded-2xl bg-red-950/40 hover:bg-red-950 text-red-300 text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出</span>
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* 4 Seats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(seatIdx => {
          const player = gameState.players[seatIdx];
          const isMe = player?.userId === myProfile.userId;

          return (
            <div
              key={seatIdx}
              className={`rounded-3xl p-4 border transition-all flex flex-col justify-between min-h-[160px] shadow-lg relative ${
                player
                  ? isMe
                    ? 'bg-gradient-to-b from-[#2E1A50] to-[#1C1230] border-amber-400/60 ring-1 ring-amber-400/30'
                    : 'bg-[#180E29] border-purple-500/30'
                  : 'bg-[#120A20]/60 border-dashed border-purple-500/20'
              }`}
            >
              {/* Seat Direction Tag */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 font-mono">
                  {SEAT_DIRECTIONS[seatIdx]}
                </span>

                {player && (
                  <div className="flex items-center gap-1">
                    {player.isHost && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-amber-950 text-[10px] font-black flex items-center gap-0.5">
                        <Crown className="w-3 h-3 fill-current" /> 房主
                      </span>
                    )}
                    {player.isBot && (
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold flex items-center gap-0.5">
                        <Bot className="w-3 h-3" /> AI
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Player Body / Empty Seat */}
              {player ? (
                <div className="flex items-center gap-3 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md flex items-center justify-center text-2xl">
                    <div className="w-full h-full bg-[#180E29] rounded-2xl flex items-center justify-center">
                      {player.avatar}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-slate-100 truncate flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {isMe && <span className="text-[10px] text-amber-400 font-normal">(你)</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-amber-300">{player.score}分</span>
                      {player.isConnected ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ) : (
                        <span className="text-red-400 text-[10px]">离线</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-auto py-3 text-center space-y-2">
                  <div className="text-xs text-slate-500 font-medium">空闲座位</div>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => socketService.addBot(gameState.roomId, seatIdx)}
                      className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                      <span>添加电脑人</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bottom State / Host Controls */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                {player ? (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        player.isReady || player.isHost || player.isBot
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                          : 'bg-yellow-950/80 border border-yellow-500/40 text-yellow-400'
                      }`}
                    >
                      {player.isHost ? '已就绪 (房主)' : player.isBot ? '已就绪 (AI)' : player.isReady ? '已就绪' : '等待准备'}
                    </span>

                    {isHost && !isMe && (
                      <button
                        type="button"
                        onClick={() => socketService.kickSeat(gameState.roomId, seatIdx)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        title="请离席位"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500">等待玩家入座</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Ready / Start Match Bar */}
      <div className="bg-[#1C1230] border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>当前已入座：<b className="text-amber-300 font-mono">{activePlayersCount}/4</b> 位道友</span>
          <span className="text-slate-500">（支持 2~4 人对战，未满将由 AI 补位）</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isHost && myPlayer && (
            <button
              type="button"
              onClick={handleToggleReady}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                myPlayer.isReady
                  ? 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-emerald-950 shadow-emerald-500/30'
              }`}
            >
              {myPlayer.isReady ? '取消准备' : '立即准备'}
            </button>
          )}

          {isHost && (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={activePlayersCount < 1}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-amber-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>开启五行对战</span>
            </button>
          )}
        </div>
      </div>

      {/* Room Live Chat & Quick Shouts */}
      <div className="bg-[#140D22]/80 border border-purple-500/20 rounded-3xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>道友互勉 · 快速发语</span>
        </h3>

        {/* Quick shout buttons */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuickPhrase(phrase)}
              className="px-2.5 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 hover:text-white text-xs transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Messages feed */}
        <div className="h-32 overflow-y-auto space-y-1.5 p-2 bg-black/40 rounded-2xl border border-white/5 text-xs">
          {chatMessages.length === 0 ? (
            <div className="text-slate-500 text-center py-8">暂无消息，向桌友打个招呼吧！</div>
          ) : (
            chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`p-1.5 rounded-xl ${
                  msg.isSystem
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-500/20'
                    : 'bg-white/5 text-slate-200'
                }`}
              >
                <span className="font-bold mr-1 text-slate-400">{msg.avatar} {msg.senderName}:</span>
                <span className={msg.type === 'shout' ? 'text-amber-300 font-bold' : ''}>{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* Custom chat input */}
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="输入发言与道友交流..."
            maxLength={60}
            className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </form>
      </div>

    </div>
  );
};
