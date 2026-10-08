// Netlify Function: Guild System API
// Uses Netlify Blobs for persistent guild storage
// Actions: create, get, browse, join, leave, promote, demote, kick, chat, contribute, level-info, raid-start, raid-complete, update-settings
const { getStore, connectLambda } = require("@netlify/blobs");

const MAX_MEMBERS = 20;
const MAX_CHAT_MSGS = 100;
const GUILD_CREATE_COST = 10000; // gold
const BANNER_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280','#fbbf24','#14b8a6'];
const ROLES = { LEADER: 'leader', OFFICER: 'officer', MEMBER: 'member' };
const INVITE_CODE_LEN = 6;

// Guild perk tiers (unlock at guild levels)
const GUILD_PERKS = [
  { level: 1, id: 'xp_i',      label: '+3% XP bonus',           effect: { xpBonus: 0.03 } },
  { level: 2, id: 'gold_i',    label: '+3% gold bonus',         effect: { goldBonus: 0.03 } },
  { level: 3, id: 'pool_i',    label: 'Shared resource pool',   effect: { pool: true } },
  { level: 4, id: 'raid_i',    label: 'Guild raids (4-player)', effect: { raids: true } },
  { level: 5, id: 'xp_ii',     label: '+5% XP bonus (total)',   effect: { xpBonus: 0.05 } },
  { level: 6, id: 'gold_ii',   label: '+5% gold bonus (total)', effect: { goldBonus: 0.05 } },
  { level: 7, id: 'loot_i',    label: '+5% loot rarity',        effect: { lootBonus: 0.05 } },
  { level: 8, id: 'cap_i',     label: '+5 member cap (25)',      effect: { memberCap: 25 } },
  { level: 9, id: 'xp_iii',    label: '+8% XP bonus (total)',   effect: { xpBonus: 0.08 } },
  { level: 10,id: 'gold_iii',  label: '+8% gold bonus (total)', effect: { goldBonus: 0.08 } },
];

// XP needed per guild level
function guildXPForLevel(lv) { return Math.round(500 * Math.pow(1.6, lv - 1)); }

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LEN; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function activePerks(guildLevel) {
  return GUILD_PERKS.filter(p => guildLevel >= p.level);
}

function memberCap(guildLevel) {
  const capPerk = activePerks(guildLevel).find(p => p.effect.memberCap);
  return capPerk ? capPerk.effect.memberCap : MAX_MEMBERS;
}

exports.handler = async (event) => {
  // Lambda-style handlers must hand the event to Blobs before getStore()
  try { connectLambda(event); } catch (e) { /* fall through: getStore reports the error */ }
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const store = getStore("guilds");
    const indexStore = getStore("guild-index");
    const params = event.queryStringParameters || {};
    const action = params.action || 'get';

    // Auth check for write actions
    const authHeader = event.headers?.authorization || '';
    let userId = null;
    if (authHeader.startsWith('Bearer ')) {
      // In production, decode JWT to get user ID
      // For now, trust the userId from body/params
      userId = 'authenticated';
    }

    // ─── BROWSE: list all guilds ───
    if (action === 'browse') {
      const allIndex = await indexStore.get('all', { type: 'json' }).catch(() => null);
      const guilds = allIndex?.guilds || [];
      // Return summary info only
      const summaries = [];
      for (const gid of guilds.slice(0, 50)) {
        const g = await store.get(gid, { type: 'json' }).catch(() => null);
        if (g && !g.disbanded) {
          summaries.push({
            id: gid,
            name: g.name,
            motto: g.motto,
            bannerColor: g.bannerColor,
            level: g.level,
            memberCount: g.members.length,
            maxMembers: memberCap(g.level),
            leaderName: g.members.find(m => m.role === ROLES.LEADER)?.name || '???',
            isOpen: g.isOpen !== false
          });
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ guilds: summaries }) };
    }

    // ─── GET: get guild details ───
    if (action === 'get') {
      const guildId = params.guildId;
      if (!guildId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId required' }) };
      const g = await store.get(guildId, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          guild: {
            ...g,
            perks: activePerks(g.level),
            nextLevelXP: guildXPForLevel(g.level + 1),
            maxMembers: memberCap(g.level)
          }
        })
      };
    }

    // ─── LEVEL-INFO: get perk tiers ───
    if (action === 'level-info') {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          perks: GUILD_PERKS,
          xpTable: Array.from({ length: 10 }, (_, i) => ({ level: i + 1, xp: guildXPForLevel(i + 1) }))
        })
      };
    }

    // ─── All write actions below require POST + auth ───
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST required' }) };
    }
    if (!authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Auth required' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const playerId = body.playerId;
    const playerName = body.playerName || 'Unknown';

    if (!playerId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'playerId required' }) };
    }

    // ─── CREATE: create a new guild ───
    if (action === 'create') {
      const { name, motto, bannerColor } = body;
      if (!name || name.length < 2 || name.length > 24) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Guild name must be 2-24 chars' }) };
      }
      if (motto && motto.length > 60) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Motto max 60 chars' }) };
      }
      // Check player isn't already in a guild
      const playerGuild = await indexStore.get(`player_${playerId}`, { type: 'json' }).catch(() => null);
      if (playerGuild?.guildId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Already in a guild' }) };
      }

      const guildId = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
      const inviteCode = genInviteCode();
      const guild = {
        name,
        motto: motto || '',
        bannerColor: BANNER_COLORS.includes(bannerColor) ? bannerColor : BANNER_COLORS[0],
        level: 1,
        xp: 0,
        pool: { bones: 0, gold: 0 },
        members: [{
          id: playerId,
          name: playerName,
          role: ROLES.LEADER,
          joinedAt: new Date().toISOString(),
          contributed: 0,
          level: body.playerLevel || 1
        }],
        chat: [],
        inviteCode,
        isOpen: true,
        raidLog: [],
        createdAt: new Date().toISOString(),
        disbanded: false
      };

      await store.setJSON(guildId, guild);
      // Update player → guild index
      await indexStore.setJSON(`player_${playerId}`, { guildId });
      // Update global guild list
      const allIndex = await indexStore.get('all', { type: 'json' }).catch(() => null);
      const guilds = allIndex?.guilds || [];
      guilds.push(guildId);
      await indexStore.setJSON('all', { guilds });

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, guildId, inviteCode, guild })
      };
    }

    // ─── JOIN: join a guild by ID or invite code ───
    if (action === 'join') {
      const { guildId, inviteCode } = body;
      // Check player isn't already in a guild
      const playerGuild = await indexStore.get(`player_${playerId}`, { type: 'json' }).catch(() => null);
      if (playerGuild?.guildId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Already in a guild' }) };
      }

      let targetId = guildId;
      if (!targetId && inviteCode) {
        // Search by invite code
        const allIndex = await indexStore.get('all', { type: 'json' }).catch(() => null);
        for (const gid of (allIndex?.guilds || [])) {
          const g = await store.get(gid, { type: 'json' }).catch(() => null);
          if (g && !g.disbanded && g.inviteCode === inviteCode.toUpperCase()) {
            targetId = gid;
            break;
          }
        }
      }
      if (!targetId) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const g = await store.get(targetId, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };
      if (!g.isOpen && (!inviteCode || g.inviteCode !== inviteCode.toUpperCase())) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Guild is invite-only' }) };
      }
      const cap = memberCap(g.level);
      if (g.members.length >= cap) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Guild is full' }) };
      }

      g.members.push({
        id: playerId,
        name: playerName,
        role: ROLES.MEMBER,
        joinedAt: new Date().toISOString(),
        contributed: 0,
        level: body.playerLevel || 1
      });
      g.chat.push({ system: true, text: `${playerName} joined the guild!`, at: new Date().toISOString() });
      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);

      await store.setJSON(targetId, g);
      await indexStore.setJSON(`player_${playerId}`, { guildId: targetId });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, guildId: targetId, guild: g }) };
    }

    // ─── LEAVE: leave the guild ───
    if (action === 'leave') {
      const playerGuild = await indexStore.get(`player_${playerId}`, { type: 'json' }).catch(() => null);
      if (!playerGuild?.guildId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not in a guild' }) };

      const gid = playerGuild.guildId;
      const g = await store.get(gid, { type: 'json' }).catch(() => null);
      if (!g) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const memberIdx = g.members.findIndex(m => m.id === playerId);
      if (memberIdx < 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not a member' }) };

      const member = g.members[memberIdx];
      if (member.role === ROLES.LEADER && g.members.length > 1) {
        // Transfer leadership to first officer, or first member
        const successor = g.members.find(m => m.id !== playerId && m.role === ROLES.OFFICER) ||
                         g.members.find(m => m.id !== playerId);
        if (successor) successor.role = ROLES.LEADER;
      }

      g.members.splice(memberIdx, 1);
      g.chat.push({ system: true, text: `${member.name} left the guild.`, at: new Date().toISOString() });
      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);

      // Disband if empty
      if (g.members.length === 0) {
        g.disbanded = true;
        const allIndex = await indexStore.get('all', { type: 'json' }).catch(() => null);
        if (allIndex) {
          allIndex.guilds = (allIndex.guilds || []).filter(id => id !== gid);
          await indexStore.setJSON('all', allIndex);
        }
      }

      await store.setJSON(gid, g);
      await indexStore.setJSON(`player_${playerId}`, { guildId: null });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ─── PROMOTE / DEMOTE ───
    if (action === 'promote' || action === 'demote') {
      const { targetPlayerId, guildId: gid2 } = body;
      if (!gid2 || !targetPlayerId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId + targetPlayerId required' }) };

      const g = await store.get(gid2, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const actor = g.members.find(m => m.id === playerId);
      if (!actor || (actor.role !== ROLES.LEADER && actor.role !== ROLES.OFFICER)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Insufficient permissions' }) };
      }

      const target = g.members.find(m => m.id === targetPlayerId);
      if (!target) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Target not found' }) };

      if (action === 'promote') {
        if (target.role === ROLES.MEMBER) target.role = ROLES.OFFICER;
        else if (target.role === ROLES.OFFICER && actor.role === ROLES.LEADER) {
          target.role = ROLES.LEADER;
          actor.role = ROLES.OFFICER;
        }
      } else {
        if (actor.role !== ROLES.LEADER) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only leader can demote' }) };
        if (target.role === ROLES.OFFICER) target.role = ROLES.MEMBER;
      }

      g.chat.push({ system: true, text: `${target.name} is now ${target.role}.`, at: new Date().toISOString() });
      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);
      await store.setJSON(gid2, g);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ─── KICK: remove a member ───
    if (action === 'kick') {
      const { targetPlayerId, guildId: gid3 } = body;
      if (!gid3 || !targetPlayerId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId + targetPlayerId required' }) };

      const g = await store.get(gid3, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const actor = g.members.find(m => m.id === playerId);
      if (!actor || actor.role === ROLES.MEMBER) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Officers+ can kick' }) };
      }

      const targetIdx = g.members.findIndex(m => m.id === targetPlayerId);
      if (targetIdx < 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Target not found' }) };
      const target = g.members[targetIdx];
      if (target.role === ROLES.LEADER) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Cannot kick leader' }) };

      g.members.splice(targetIdx, 1);
      g.chat.push({ system: true, text: `${target.name} was removed from the guild.`, at: new Date().toISOString() });
      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);

      await store.setJSON(gid3, g);
      await indexStore.setJSON(`player_${targetPlayerId}`, { guildId: null });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ─── CHAT: post a message ───
    if (action === 'chat') {
      const { guildId: gid4, message } = body;
      if (!gid4 || !message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId + message required' }) };
      if (message.length > 200) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Max 200 chars' }) };

      const g = await store.get(gid4, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };
      if (!g.members.find(m => m.id === playerId)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not a member' }) };
      }

      g.chat.push({
        from: playerName,
        fromId: playerId,
        text: message.replace(/[<>]/g, ''),
        at: new Date().toISOString()
      });
      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);

      await store.setJSON(gid4, g);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, chat: g.chat.slice(-30) }) };
    }

    // ─── CONTRIBUTE: add resources to guild pool ───
    if (action === 'contribute') {
      const { guildId: gid5, bones: cBones, gold: cGold } = body;
      if (!gid5) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId required' }) };

      const g = await store.get(gid5, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const member = g.members.find(m => m.id === playerId);
      if (!member) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not a member' }) };

      const addBones = Math.max(0, Math.min(cBones || 0, 99999));
      const addGold = Math.max(0, Math.min(cGold || 0, 99999));

      g.pool.bones += addBones;
      g.pool.gold += addGold;
      member.contributed += addBones + addGold;

      // Contributions give guild XP (1 XP per 10 resources)
      const earnedXP = Math.floor((addBones + addGold) / 10);
      g.xp += earnedXP;

      // Level up check
      let leveledUp = false;
      while (g.level < 10) {
        const needed = guildXPForLevel(g.level + 1);
        if (g.xp >= needed) {
          g.xp -= needed;
          g.level++;
          leveledUp = true;
          const newPerk = GUILD_PERKS.find(p => p.level === g.level);
          if (newPerk) {
            g.chat.push({ system: true, text: `🎉 Guild leveled up to ${g.level}! Unlocked: ${newPerk.label}`, at: new Date().toISOString() });
          }
        } else break;
      }

      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);
      await store.setJSON(gid5, g);

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, pool: g.pool, guildLevel: g.level, leveledUp })
      };
    }

    // ─── UPDATE-SETTINGS: leader/officer can change settings ───
    if (action === 'update-settings') {
      const { guildId: gid6, isOpen, motto: newMotto } = body;
      if (!gid6) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId required' }) };

      const g = await store.get(gid6, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const actor = g.members.find(m => m.id === playerId);
      if (!actor || actor.role === ROLES.MEMBER) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Officers+ can change settings' }) };
      }

      if (typeof isOpen === 'boolean') g.isOpen = isOpen;
      if (typeof newMotto === 'string' && newMotto.length <= 60) g.motto = newMotto;

      await store.setJSON(gid6, g);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ─── RAID-START: mark a guild raid as in progress ───
    if (action === 'raid-start') {
      const { guildId: gid7, raidRegion, participants } = body;
      if (!gid7 || !raidRegion) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId + raidRegion required' }) };

      const g = await store.get(gid7, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      if (!activePerks(g.level).find(p => p.effect.raids)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Guild raids unlock at level 4' }) };
      }

      g.raidLog.push({
        region: raidRegion,
        participants: participants || [playerName],
        startedAt: new Date().toISOString(),
        completed: false
      });
      if (g.raidLog.length > 20) g.raidLog = g.raidLog.slice(-20);

      // Guild raids give XP
      g.xp += 25;

      await store.setJSON(gid7, g);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ─── RAID-COMPLETE: complete a guild raid ───
    if (action === 'raid-complete') {
      const { guildId: gid8, raidRegion, success: raidSuccess } = body;
      if (!gid8) return { statusCode: 400, headers, body: JSON.stringify({ error: 'guildId required' }) };

      const g = await store.get(gid8, { type: 'json' }).catch(() => null);
      if (!g || g.disbanded) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };

      const lastRaid = g.raidLog.findLast(r => r.region === raidRegion && !r.completed);
      if (lastRaid) {
        lastRaid.completed = true;
        lastRaid.success = !!raidSuccess;
        lastRaid.completedAt = new Date().toISOString();
      }

      if (raidSuccess) {
        g.xp += 50;
        g.chat.push({ system: true, text: `⚔️ Guild raid on ${raidRegion} completed!`, at: new Date().toISOString() });
      }

      // Level up check
      while (g.level < 10) {
        const needed = guildXPForLevel(g.level + 1);
        if (g.xp >= needed) {
          g.xp -= needed;
          g.level++;
          const newPerk = GUILD_PERKS.find(p => p.level === g.level);
          if (newPerk) {
            g.chat.push({ system: true, text: `🎉 Guild leveled up to ${g.level}! Unlocked: ${newPerk.label}`, at: new Date().toISOString() });
          }
        } else break;
      }

      if (g.chat.length > MAX_CHAT_MSGS) g.chat = g.chat.slice(-MAX_CHAT_MSGS);
      await store.setJSON(gid8, g);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, guildLevel: g.level }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
