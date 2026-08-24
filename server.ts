import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { roomManager } from './server/mahjongRoomManager';
import { AvailableClaim } from './src/types/mahjong';
import { RoomSettings } from './src/types/multiplayer';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Multiplayer room list REST endpoint
app.get('/api/mahjong/rooms', (req, res) => {
  res.json({ rooms: roomManager.getPublicRooms() });
});

// AI Time Ju Analysis
app.post('/api/gemini/analyze-timeju', async (req, res) => {
  try {
    const { chartData, userQuestion } = req.body;
    if (!chartData) {
      return res.status(400).json({ error: 'Missing chartData' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback deterministic interpretation if API key is not present in local test
      const { genderLabel, zodiac, lunarText, overviewPillars, stemHints, branchHints, dominantElement, favoredElement } = chartData;
      const fallbackText = `### 【五行时间局·气场断验】
- **局象定格**：${genderLabel} ${zodiac}，${lunarText}。
- **四柱排盘**：年柱【${overviewPillars.year.stem}${overviewPillars.year.branch}】、月柱【${overviewPillars.month.stem}${overviewPillars.month.branch}】、日柱【${overviewPillars.day.stem}${overviewPillars.day.branch}】、时柱【${overviewPillars.hour.stem}${overviewPillars.hour.branch}】。
- **干支生克**：${stemHints}；${branchHints}。
- **能量喜忌**：全局五行中【${dominantElement}】气最旺，喜用以【${favoredElement}】为调候化解之机。
- **当下时辰决断建议**：此时天干透出七杀与正官，官杀有气，适合稳健谋划、签署合约与定夺事务，忌急躁妄动。`;
      return res.json({ analysis: fallbackText, isFallback: true });
    }

    const prompt = `你是一位精通中国传统干支历法、子平命理、五行生克与时家奇门时间局的国学导师。请基于以下【五行时间局】排盘数据，给出一份详尽、典雅、实用且积极向上的时辰气象与运势指引：

【排盘数据】：
- 局名/性别：${chartData.genderLabel} (${chartData.xunShou}) ${chartData.zodiac}，笔画：${chartData.strokeCount}划
- 农历与时辰：${chartData.lunarText}
- 公历时间：${chartData.gregorianDateStr}
- 年柱：${chartData.overviewPillars.year.stem}${chartData.overviewPillars.year.branch} (主星：${chartData.overviewPillars.year.stemGod})
- 月柱：${chartData.overviewPillars.month.stem}${chartData.overviewPillars.month.branch} (主星：${chartData.overviewPillars.month.stemGod})
- 日柱：${chartData.overviewPillars.day.stem}${chartData.overviewPillars.day.branch} (主星：${chartData.overviewPillars.day.stemGod})
- 时柱：${chartData.overviewPillars.hour.stem}${chartData.overviewPillars.hour.branch} (主星：${chartData.overviewPillars.hour.stemGod})
- 天干提示：${chartData.stemHints}
- 地支提示：${chartData.branchHints}
- 五行能量：木${chartData.fiveElementsStats.wood}% 火${chartData.fiveElementsStats.fire}% 土${chartData.fiveElementsStats.earth}% 金${chartData.fiveElementsStats.metal}% 水${chartData.fiveElementsStats.water}% (最旺：${chartData.dominantElement}，喜用建议：${chartData.favoredElement})
${userQuestion ? `- 用户特定求问：${userQuestion}` : ''}

【输出要求】：
1. **时辰局象总论**：精辟提炼当前时局的气机特点、十神格局意象。
2. **干支刑冲合害解读**：专门解释提示中的关键作用（如暗合、自刑、相害等在现实生活中的对应象征）。
3. **五行调候与开运指南**：给出适宜的方位、颜色、穿戴或环境调节建议。
4. **即时行动与决策宜忌**：对于工作谈判、求财、沟通、出行、静养等具体场景的黄金指引。
排版请使用清晰的 Markdown 结构，语言兼具传统国学韵味与现代实用启发。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze-timeju:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Socket.IO Real-Time Multiplayer Mahjong Handlers
io.on('connection', socket => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  // Create Room
  socket.on(
    'room:create',
    (
      data: {
        userId: string;
        name: string;
        avatar: string;
        roomName?: string;
        settings?: Partial<RoomSettings>;
      },
      callback
    ) => {
      try {
        const { userId, name, avatar, roomName, settings } = data;
        const room = roomManager.createRoom(userId, name, roomName, settings);
        currentRoomId = room.roomId;
        currentUserId = userId;

        socket.join(room.roomId);
        room.addPlayer(socket.id, userId, name, avatar);
        room.broadcastState(io);

        io.emit('lobby:rooms_update', roomManager.getPublicRooms());
        if (callback) callback({ success: true, roomId: room.roomId });
      } catch (e: any) {
        if (callback) callback({ success: false, error: e.message });
      }
    }
  );

  // Join Room
  socket.on(
    'room:join',
    (
      data: {
        roomId: string;
        userId: string;
        name: string;
        avatar: string;
        password?: string;
      },
      callback
    ) => {
      try {
        const { roomId, userId, name, avatar, password } = data;
        const room = roomManager.getRoom(roomId);
        if (!room) {
          if (callback) callback({ success: false, error: '房间不存在或已解散' });
          return;
        }

        if (room.settings.isPrivate && room.settings.password && room.settings.password !== password) {
          if (callback) callback({ success: false, error: '房间密码错误' });
          return;
        }

        currentRoomId = roomId;
        currentUserId = userId;
        socket.join(roomId);

        const joinResult = room.addPlayer(socket.id, userId, name, avatar);
        room.broadcastState(io);
        io.emit('lobby:rooms_update', roomManager.getPublicRooms());

        if (callback) {
          callback({
            success: true,
            roomId,
            state: room.getClientState(userId),
            message: joinResult.message,
          });
        }
      } catch (e: any) {
        if (callback) callback({ success: false, error: e.message });
      }
    }
  );

  // Quick Match
  socket.on(
    'room:quick_match',
    (data: { userId: string; name: string; avatar: string }, callback) => {
      try {
        let room = roomManager.findQuickMatch();
        if (!room) {
          room = roomManager.createRoom(data.userId, data.name, `${data.name}的五行速配房`, {
            autoFillBots: true,
            turnTimeLimit: 20,
          });
        }

        currentRoomId = room.roomId;
        currentUserId = data.userId;
        socket.join(room.roomId);

        room.addPlayer(socket.id, data.userId, data.name, data.avatar);
        room.broadcastState(io);
        io.emit('lobby:rooms_update', roomManager.getPublicRooms());

        if (callback) callback({ success: true, roomId: room.roomId });
      } catch (e: any) {
        if (callback) callback({ success: false, error: e.message });
      }
    }
  );

  // Leave Room
  socket.on('room:leave', (data: { roomId: string; userId: string }, callback) => {
    try {
      const room = roomManager.getRoom(data.roomId);
      if (room) {
        room.handleDisconnect(socket.id);
        socket.leave(data.roomId);
        room.broadcastState(io);
        roomManager.cleanupEmptyRooms();
        io.emit('lobby:rooms_update', roomManager.getPublicRooms());
      }
      currentRoomId = null;
      if (callback) callback({ success: true });
    } catch (e: any) {
      if (callback) callback({ success: false, error: e.message });
    }
  });

  // Toggle Ready
  socket.on('room:set_ready', (data: { roomId: string; userId: string; isReady: boolean }) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      room.setReady(data.userId, data.isReady);
      room.broadcastState(io);
    }
  });

  // Host Add Bot
  socket.on('room:add_bot', (data: { roomId: string; seatIndex: number }) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      room.addBot(data.seatIndex);
      room.broadcastState(io);
    }
  });

  // Host Kick Seat / Remove Bot
  socket.on('room:kick_seat', (data: { roomId: string; seatIndex: number }) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      room.kickSeat(data.seatIndex);
      room.broadcastState(io);
    }
  });

  // Host Start Game
  socket.on('room:start_game', (data: { roomId: string; userId: string }, callback) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) {
      if (callback) callback({ success: false, error: '房间不存在' });
      return;
    }
    if (room.hostUserId !== data.userId) {
      if (callback) callback({ success: false, error: '仅房主可开启对局' });
      return;
    }

    const started = room.startGame(io);
    io.emit('lobby:rooms_update', roomManager.getPublicRooms());
    if (callback) callback({ success: started });
  });

  // Player Discard Tile
  socket.on('room:discard', (data: { roomId: string; userId: string; tileId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      room.playerDiscard(io, data.userId, data.tileId);
    }
  });

  // Player Claim Action (Eat/Pung/Clash/Kong/Hu/Pass)
  socket.on(
    'room:claim_action',
    (data: { roomId: string; userId: string; claim: AvailableClaim | null }) => {
      const room = roomManager.getRoom(data.roomId);
      if (room) {
        room.submitClaimAction(io, data.userId, data.claim);
      }
    }
  );

  // Player Self-Draw Hu
  socket.on('room:self_draw_hu', (data: { roomId: string; userId: string }, callback) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      const success = room.playerSelfDrawHu(io, data.userId);
      if (callback) callback({ success });
    }
  });

  // In-Game Chat / Quick Shouts
  socket.on(
    'room:send_chat',
    (data: {
      roomId: string;
      userId: string;
      name: string;
      avatar: string;
      text: string;
      type?: 'text' | 'emoji' | 'shout';
    }) => {
      const room = roomManager.getRoom(data.roomId);
      if (room) {
        room.addChatMessage(io, {
          senderId: data.userId,
          senderName: data.name,
          avatar: data.avatar,
          text: data.text,
          type: data.type || 'text',
        });
      }
    }
  );

  // Restart Round
  socket.on('room:restart_game', (data: { roomId: string; userId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (room) {
      room.status = 'waiting';
      room.players.forEach(p => {
        if (p) {
          p.isReady = p.isHost || p.isBot;
          p.hand = [];
          p.melds = [];
          p.discards = [];
          p.lastDrawnTile = null;
        }
      });
      room.winnerData = null;
      room.broadcastState(io);
      io.emit('lobby:rooms_update', roomManager.getPublicRooms());
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = roomManager.getRoom(currentRoomId);
      if (room) {
        room.handleDisconnect(socket.id);
        room.broadcastState(io);
        roomManager.cleanupEmptyRooms();
        io.emit('lobby:rooms_update', roomManager.getPublicRooms());
      }
    }
  });
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`五行麻将 & 时间局 server running on http://localhost:${PORT}`);
  });
}

start();

