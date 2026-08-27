import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Zap,
  Lock,
  Globe,
  RefreshCw,
  Edit3,
  Play,
  ArrowRight,
  Shield,
  Sparkles,
  Bot,
  UserCheck,
  Radio,
  Gamepad2,
  LogIn,
} from 'lucide-react';
import { RoomListItem, RoomSettings } from '../../types/multiplayer';
import {
  socketService,
  getLocalUserProfile,
  saveLocalUserProfile,
  UserProfile,
} from '../../services/socketService';

interface MultiplayerLobbyProps {
  onJoinRoom: (roomId: string, state?: any) => void;
  onBackToSinglePlayer: () => void;
}

const AVATAR_OPTIONS = [
  '🐉', '🦅', '🐅', '🐢', '🦄', '☯️', '🎋', '⚡', '🔥', '🌊',
  '🏔️', '🌪️', '🪙', '🪵', '👑', '🀄', '🥷', '🧙‍♂️', '🧘', '🪭'
];

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onJoinRoom,
  onBackToSinglePlayer,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(getLocalUserProfile());
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(userProfile.name);
  const [tempAvatar, setTempAvatar] = useState<string>(userProfile.avatar);

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Create room modal state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [customRoomName, setCustomRoomName] = useState<string>('');
  const [turnTimerSetting, setTurnTimerSetting] = useState<number>(20);
  const [autoFillBotsSetting, setAutoFillBotsSetting] = useState<boolean>(true);
  const [isPrivateSetting, setIsPrivateSetting] = useState<boolean>(false);
  const [passwordSetting, setPasswordSetting] = useState<string>('');

  // Join by code modal state
  const [isJoinByCodeOpen, setIsJoinByCodeOpen] = useState<boolean>(false);
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch rooms helper
  const fetchRooms = async (showLoading = false) => {
    if (showLoading) setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/mahjong/rooms');
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (e) {
      console.error('Fetch rooms error:', e);
    } finally {
      if (showLoading) setIsLoadingRooms(false);
    }
  };

  // Fetch initial rooms, listen to socket updates, and periodic sync
  useEffect(() => {
    socketService.connect();
    const socket = socketService.getSocket();

    fetchRooms(true);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleRoomsUpdate = (updatedRooms: RoomListItem[]) => {
      setRooms(updatedRooms);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('lobby:rooms_update', handleRoomsUpdate);

    // Periodic polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchRooms(false);
    }, 3500);

    return () => {
      clearInterval(interval);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('lobby:rooms_update', handleRoomsUpdate);
    };
  }, []);

  const handleSaveProfile = () => {
    if (!tempName.trim()) return;
    const updated = {
      ...userProfile,
      name: tempName.trim(),
      avatar: tempAvatar,
    };
    setUserProfile(updated);
    saveLocalUserProfile(updated);
    setIsEditingProfile(false);
  };

  // Quick match
  const handleQuickMatch = () => {
    setErrorMsg('');
    socketService.quickMatch(res => {
      if (res.success && res.roomId) {
        onJoinRoom(res.roomId, res.state);
      } else {
        setErrorMsg(res.error || '匹配失败，请稍后重试');
      }
    });
  };

  // Create room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const roomTitle = customRoomName.trim() || `${userProfile.name}的五行修真台`;
    const settings: Partial<RoomSettings> = {
      turnTimeLimit: turnTimerSetting,
      autoFillBots: autoFillBotsSetting,
      isPrivate: isPrivateSetting,
      password: isPrivateSetting ? passwordSetting : '',
    };

    socketService.createRoom(roomTitle, settings, res => {
      if (res.success && res.roomId) {
        setIsCreateOpen(false);
        onJoinRoom(res.roomId, res.state);
      } else {
        setErrorMsg(res.error || '创建房间失败');
      }
    });
  };

  // Join by room code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    setErrorMsg('');

    socketService.joinRoom(inputRoomCode.trim(), inputPassword, res => {
      if (res.success && res.roomId) {
        setIsJoinByCodeOpen(false);
        onJoinRoom(res.roomId, res.state);
      } else {
        setErrorMsg(res.error || '加入房间失败');
      }
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2 space-y-4 animate-in fade-in duration-300">
      
      {/* Top Banner / User Profile Card */}
      <div className="bg-gradient-to-r from-[#1E1238] via-[#2A1648] to-[#1E1238] border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* User Info */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-lg flex items-center justify-center text-3xl">
              <div className="w-full h-full bg-[#1A102E] rounded-2xl flex items-center justify-center">
                {userProfile.avatar}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1A102E] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-amber-300 tracking-wide">
                {userProfile.name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setTempName(userProfile.name);
                  setTempAvatar(userProfile.avatar);
                  setIsEditingProfile(true);
                }}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                title="修改昵称与头像"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-mono bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-500/30 text-purple-300">
                ID: {userProfile.userId.slice(-6)}
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> 实时在线
              </span>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onBackToSinglePlayer}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>单机练习</span>
          </button>

          <button
            type="button"
            onClick={handleQuickMatch}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>一键快速匹配</span>
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-[#2D1B4E] to-[#1E1136] border border-purple-500/40 hover:border-amber-400/60 transition-all flex items-center gap-3 group text-left shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-purple-600/30 group-hover:bg-purple-600 text-purple-300 group-hover:text-white transition-colors">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              创建对战房间
            </div>
            <div className="text-[11px] text-slate-400">自定义倒计时与密码</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsJoinByCodeOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-[#2D1B4E] to-[#1E1136] border border-purple-500/40 hover:border-amber-400/60 transition-all flex items-center gap-3 group text-left shadow-md"
        >
          <div className="p-2.5 rounded-xl bg-amber-600/30 group-hover:bg-amber-500 text-amber-300 group-hover:text-amber-950 transition-colors">
            <LogIn className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              输入房号加入
            </div>
            <div className="text-[11px] text-slate-400">6位房间号极速入座</div>
          </div>
        </button>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-br from-[#221538] to-[#180E29] border border-white/5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[11px] text-slate-400">{isConnected ? '服务器在线' : '连接断开中...'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>活跃桌台：<b className="text-amber-300 font-mono">{rooms.length}</b> 局</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchRooms(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="刷新桌台列表"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Room List Container */}
      <div className="bg-[#140D22]/80 border border-purple-500/20 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">全服公开对战大厅</h3>
          </div>
          <span className="text-[11px] text-slate-400">实时对局·满2人可开</span>
        </div>

        {rooms.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-3xl">
              🀄
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">当前暂无等待中的公开房间</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                您可以点击上方“创建对战房间”或“一键快速匹配”开启首桌五行仙局！
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
            >
              立即开房
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {rooms.map(room => (
              <div
                key={room.roomId}
                className="p-3.5 rounded-2xl bg-[#1D1330] border border-purple-500/30 hover:border-amber-400/50 transition-all flex flex-col justify-between gap-3 group shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-300">{room.name}</span>
                      {room.isPrivate && (
                        <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/40 text-[9px] font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> 密码
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      房主：<span className="text-slate-300 font-medium">{room.hostName}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-black/40 border border-purple-500/30 text-purple-300">
                    #{room.roomId}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <b className="text-slate-200">{room.playerCount}/4 人</b>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({room.settings.turnTimeLimit}s限时)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (room.isPrivate) {
                        setInputRoomCode(room.roomId);
                        setIsJoinByCodeOpen(true);
                      } else {
                        socketService.joinRoom(room.roomId, undefined, res => {
                          if (res.success && res.roomId) onJoinRoom(res.roomId, res.state);
                          else setErrorMsg(res.error || '加入失败');
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs transition-transform active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <span>{room.status === 'playing' ? '观战' : '入座'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#1C1230] border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-amber-300">个性名号与头像设置</h3>
            
            {/* Avatar Selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-bold">选择五行道象头像：</label>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-black/30 rounded-2xl border border-white/5">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setTempAvatar(av)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      tempAvatar === av
                        ? 'bg-amber-400 text-black scale-110 shadow-md ring-2 ring-amber-300'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-bold">修道名号 (昵称)：</label>
              <input
                type="text"
                value={tempName}
                maxLength={10}
                onChange={e => setTempName(e.target.value)}
                placeholder="请输入你的昵称"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 text-xs font-black shadow-md transition-transform active:scale-95"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreateRoom} className="w-full max-w-md bg-[#1C1230] border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>创建五行对战桌台</span>
              </h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1.5 block font-bold">房间名称：</label>
                <input
                  type="text"
                  value={customRoomName}
                  onChange={e => setCustomRoomName(e.target.value)}
                  placeholder={`${userProfile.name}的五行修真台`}
                  maxLength={16}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Turn Timer */}
              <div>
                <label className="text-slate-400 mb-1.5 block font-bold">出牌倒计时：</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 20, 35].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurnTimerSetting(t)}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        turnTimerSetting === t
                          ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-md'
                          : 'bg-black/30 text-slate-300 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {t} 秒 / 步
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Fill Bots Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                <div>
                  <div className="font-bold text-slate-200">开局自动补齐 AI 电脑人</div>
                  <div className="text-[10px] text-slate-400">若真实玩家不满4人，自动派驻五行道友陪练</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoFillBotsSetting}
                  onChange={e => setAutoFillBotsSetting(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Private Room Toggle */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200">设为私密房间 (需密码入座)</div>
                  <input
                    type="checkbox"
                    checked={isPrivateSetting}
                    onChange={e => setIsPrivateSetting(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                {isPrivateSetting && (
                  <input
                    type="password"
                    value={passwordSetting}
                    onChange={e => setPasswordSetting(e.target.value)}
                    placeholder="请输入4-6位入房密码"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 text-xs font-black shadow-md transition-transform active:scale-95"
              >
                立即创建
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join By Code Modal */}
      {isJoinByCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleJoinByCode} className="w-full max-w-sm bg-[#1C1230] border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-amber-400" />
                <span>输入 6 位房间号</span>
              </h3>
              <button type="button" onClick={() => setIsJoinByCodeOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1.5 block font-bold">房间号 (6位数字)：</label>
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={e => setInputRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="例如：682910"
                  maxLength={6}
                  className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-purple-500/30 text-center text-amber-300 font-mono text-xl tracking-widest font-black focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1.5 block font-bold">房间密码 (若有)：</label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                  placeholder="无密码可留空"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsJoinByCodeOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 text-xs font-black shadow-md transition-transform active:scale-95"
              >
                加入房间
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
