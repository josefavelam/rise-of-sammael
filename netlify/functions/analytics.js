// Netlify Function: Analytics API
// Privacy-first player behavior tracking — no PII, aggregate only, opt-in
// Uses Netlify Blobs for persistent storage
const { getStore } = require("@netlify/blobs");

// Event categories we accept
const VALID_EVENTS = [
  'session_start','session_end',
  'level_up','prestige',
  'raid_start','raid_end','raid_death',
  'boss_kill','enemy_kill_batch',
  'spell_cast','hero_deploy',
  'quest_complete','quest_accept',
  'village_upgrade','castle_upgrade',
  'panel_open','feature_discovered',
  'tutorial_step','tutorial_complete','tutorial_skip',
  'pvp_match','coop_match',
  'item_craft','item_equip',
  'minion_evolve','ng_plus_start',
  'achievement_unlock','pet_level',
  'gold_earned','gold_spent'
];

const MAX_BATCH = 50;        // max events per request
const MAX_BODY = 64 * 1024;  // 64KB max payload

// Generate a date key for daily aggregation
function dayKey(d) {
  return d ? d.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

// Merge counts into an aggregate object
function mergeAgg(existing, incoming) {
  const result = { ...existing };
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v === 'number') {
      result[k] = (result[k] || 0) + v;
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result[k] = mergeAgg(result[k] || {}, v);
    }
  }
  return result;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const store = getStore("analytics");
    const params = event.queryStringParameters || {};
    const action = params.action || 'ingest';

    // ── POST: Ingest batched events ──
    if (event.httpMethod === 'POST' && action === 'ingest') {
      if ((event.body || '').length > MAX_BODY) {
        return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large' }) };
      }

      let payload;
      try { payload = JSON.parse(event.body); }
      catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

      const events = Array.isArray(payload.events) ? payload.events.slice(0, MAX_BATCH) : [];
      if (!events.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No events' }) };
      }

      // Validate and filter events
      const valid = events.filter(e =>
        e && typeof e.type === 'string' &&
        VALID_EVENTS.includes(e.type) &&
        typeof e.ts === 'number'
      );

      if (!valid.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid events' }) };
      }

      // Aggregate into daily buckets
      const today = dayKey();
      const sid = payload.sessionId || 'unknown';

      // Read current daily aggregate
      let daily;
      try {
        const raw = await store.get(`daily/${today}`, { type: 'json' });
        daily = raw || {};
      } catch {
        daily = {};
      }

      // Initialize structure
      if (!daily.sessions) daily.sessions = 0;
      if (!daily.uniqueSessions) daily.uniqueSessions = [];
      if (!daily.events) daily.events = {};
      if (!daily.progression) daily.progression = {};
      if (!daily.combat) daily.combat = {};
      if (!daily.economy) daily.economy = {};
      if (!daily.features) daily.features = {};

      // Track unique sessions
      if (!daily.uniqueSessions.includes(sid) && daily.uniqueSessions.length < 10000) {
        daily.uniqueSessions.push(sid);
        daily.sessions++;
      }

      // Process each event
      for (const ev of valid) {
        // Count by type
        daily.events[ev.type] = (daily.events[ev.type] || 0) + 1;

        // Extract metrics by category
        const d = ev.data || {};
        switch (ev.type) {
          case 'session_start':
            if (d.necroLv) {
              const bracket = Math.floor(d.necroLv / 10) * 10;
              const key = `lv${bracket}-${bracket + 9}`;
              daily.progression[key] = (daily.progression[key] || 0) + 1;
            }
            if (d.prestige !== undefined) {
              daily.progression[`p${d.prestige}`] = (daily.progression[`p${d.prestige}`] || 0) + 1;
            }
            break;

          case 'session_end':
            if (d.playTimeSeconds) {
              daily.combat.totalPlayTime = (daily.combat.totalPlayTime || 0) + d.playTimeSeconds;
            }
            break;

          case 'level_up':
            daily.progression.totalLevelUps = (daily.progression.totalLevelUps || 0) + 1;
            break;

          case 'prestige':
            daily.progression.totalPrestiges = (daily.progression.totalPrestiges || 0) + 1;
            if (d.level) {
              daily.progression[`prestige_to_${d.level}`] = (daily.progression[`prestige_to_${d.level}`] || 0) + 1;
            }
            break;

          case 'raid_start':
            daily.combat.raidsStarted = (daily.combat.raidsStarted || 0) + 1;
            if (d.area) {
              if (!daily.combat.raidAreas) daily.combat.raidAreas = {};
              daily.combat.raidAreas[d.area] = (daily.combat.raidAreas[d.area] || 0) + 1;
            }
            break;

          case 'raid_end':
            daily.combat.raidsCompleted = (daily.combat.raidsCompleted || 0) + 1;
            if (d.result === 'win') daily.combat.raidWins = (daily.combat.raidWins || 0) + 1;
            if (d.result === 'loss') daily.combat.raidLosses = (daily.combat.raidLosses || 0) + 1;
            if (d.durationMs) {
              daily.combat.totalRaidTimeMs = (daily.combat.totalRaidTimeMs || 0) + d.durationMs;
            }
            break;

          case 'raid_death':
            daily.combat.totalDeaths = (daily.combat.totalDeaths || 0) + 1;
            if (d.area) {
              if (!daily.combat.deathAreas) daily.combat.deathAreas = {};
              daily.combat.deathAreas[d.area] = (daily.combat.deathAreas[d.area] || 0) + 1;
            }
            break;

          case 'boss_kill':
            daily.combat.bossKills = (daily.combat.bossKills || 0) + 1;
            if (d.boss) {
              if (!daily.combat.bossKillNames) daily.combat.bossKillNames = {};
              daily.combat.bossKillNames[d.boss] = (daily.combat.bossKillNames[d.boss] || 0) + 1;
            }
            break;

          case 'enemy_kill_batch':
            daily.combat.enemiesKilled = (daily.combat.enemiesKilled || 0) + (d.count || 0);
            break;

          case 'gold_earned':
            daily.economy.totalGoldEarned = (daily.economy.totalGoldEarned || 0) + (d.amount || 0);
            if (d.source) {
              if (!daily.economy.goldSources) daily.economy.goldSources = {};
              daily.economy.goldSources[d.source] = (daily.economy.goldSources[d.source] || 0) + (d.amount || 0);
            }
            break;

          case 'gold_spent':
            daily.economy.totalGoldSpent = (daily.economy.totalGoldSpent || 0) + (d.amount || 0);
            if (d.category) {
              if (!daily.economy.spendCategories) daily.economy.spendCategories = {};
              daily.economy.spendCategories[d.category] = (daily.economy.spendCategories[d.category] || 0) + (d.amount || 0);
            }
            break;

          case 'panel_open':
            if (d.panel) {
              if (!daily.features.panelOpens) daily.features.panelOpens = {};
              daily.features.panelOpens[d.panel] = (daily.features.panelOpens[d.panel] || 0) + 1;
            }
            break;

          case 'feature_discovered':
            if (d.feature) {
              if (!daily.features.discovered) daily.features.discovered = {};
              daily.features.discovered[d.feature] = (daily.features.discovered[d.feature] || 0) + 1;
            }
            break;

          case 'tutorial_step':
          case 'tutorial_complete':
          case 'tutorial_skip':
            if (!daily.features.tutorial) daily.features.tutorial = {};
            daily.features.tutorial[ev.type] = (daily.features.tutorial[ev.type] || 0) + 1;
            if (d.step !== undefined) {
              daily.features.tutorial[`step_${d.step}`] = (daily.features.tutorial[`step_${d.step}`] || 0) + 1;
            }
            break;

          case 'achievement_unlock':
            daily.progression.achievementsUnlocked = (daily.progression.achievementsUnlocked || 0) + 1;
            break;

          case 'minion_evolve':
            daily.progression.minionEvolutions = (daily.progression.minionEvolutions || 0) + 1;
            break;

          case 'ng_plus_start':
            daily.progression.ngPlusStarts = (daily.progression.ngPlusStarts || 0) + 1;
            if (d.modifiers) {
              if (!daily.progression.ngModifiers) daily.progression.ngModifiers = {};
              for (const m of d.modifiers) {
                daily.progression.ngModifiers[m] = (daily.progression.ngModifiers[m] || 0) + 1;
              }
            }
            break;

          default:
            // Other valid events are counted by type above
            break;
        }
      }

      // Strip uniqueSessions array before saving (we only need count)
      const saveData = { ...daily };
      // Keep uniqueSessions for dedup within the day, but cap it
      if (saveData.uniqueSessions && saveData.uniqueSessions.length > 5000) {
        saveData.uniqueSessions = saveData.uniqueSessions.slice(-5000);
      }

      await store.setJSON(`daily/${today}`, saveData);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accepted: valid.length, dropped: events.length - valid.length })
      };
    }

    // ── GET: Retrieve stats ──
    if (event.httpMethod === 'GET' && action === 'stats') {
      const range = parseInt(params.days) || 7;
      const days = Math.min(range, 90);
      const results = {};

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = dayKey(d.toISOString());
        try {
          const data = await store.get(`daily/${key}`, { type: 'json' });
          if (data) {
            // Strip uniqueSessions from response (internal dedup only)
            const { uniqueSessions, ...clean } = data;
            results[key] = clean;
          }
        } catch { /* skip missing days */ }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ days, data: results })
      };
    }

    // ── GET: Summary ──
    if (event.httpMethod === 'GET' && action === 'summary') {
      const range = parseInt(params.days) || 7;
      const days = Math.min(range, 30);
      let totalSessions = 0, totalEvents = 0, totalPlayTime = 0;
      let totalRaids = 0, totalDeaths = 0, totalBossKills = 0;
      const eventCounts = {};

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = dayKey(d.toISOString());
        try {
          const data = await store.get(`daily/${key}`, { type: 'json' });
          if (data) {
            totalSessions += data.sessions || 0;
            totalPlayTime += data.combat?.totalPlayTime || 0;
            totalRaids += data.combat?.raidsStarted || 0;
            totalDeaths += data.combat?.totalDeaths || 0;
            totalBossKills += data.combat?.bossKills || 0;
            for (const [k, v] of Object.entries(data.events || {})) {
              eventCounts[k] = (eventCounts[k] || 0) + v;
              totalEvents += v;
            }
          }
        } catch { /* skip */ }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          period: `${days} days`,
          totalSessions,
          totalEvents,
          avgSessionMinutes: totalSessions ? Math.round(totalPlayTime / totalSessions / 60) : 0,
          totalRaids,
          raidDeathRate: totalRaids ? (totalDeaths / totalRaids).toFixed(2) : '0',
          totalBossKills,
          topEvents: Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
        })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use ingest, stats, or summary.' }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};
