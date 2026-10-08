// Netlify Function: Leaderboard API
// Uses Netlify Blobs for persistent storage
// Endpoints via query param ?action=submit|get|weekly-reset
const { getStore, connectLambda } = require("@netlify/blobs");

const CATEGORIES = [
  'prestige', 'regions', 'hellbridge', 'boss_clears',
  'enemies_killed', 'pvp_rank'
];

const MAX_ENTRIES = 100;

// Simple anti-cheat: validate score ranges
function validateScore(category, score, playerData) {
  if (typeof score !== 'number' || score < 0 || !isFinite(score)) return false;
  switch (category) {
    case 'prestige': return score <= 20; // max 20 prestige tiers
    case 'regions': return score <= 174; // max 174 regions
    case 'hellbridge': return score <= 500; // reasonable wave cap
    case 'boss_clears': return score <= 3600; // seconds, max 1hr
    case 'enemies_killed': return score <= 10000000; // 10M lifetime cap
    case 'pvp_rank': return score <= 3000; // Elo cap
    default: return false;
  }
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
    const store = getStore("leaderboards");
    const params = event.queryStringParameters || {};
    const action = params.action || 'get';

    if (action === 'get') {
      // GET leaderboard by category + scope (alltime|weekly)
      const category = params.category || 'prestige';
      const scope = params.scope || 'alltime';
      if (!CATEGORIES.includes(category)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid category' }) };
      }
      const key = `${scope}_${category}`;
      const data = await store.get(key, { type: 'json' }).catch(() => null);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ entries: data?.entries || [], updatedAt: data?.updatedAt || null })
      };
    }

    if (action === 'submit') {
      // POST: submit a score
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST required' }) };
      }

      // Verify auth token
      const authHeader = event.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Auth required' }) };
      }

      const body = JSON.parse(event.body);
      const { category, score, playerName, playerId, playerLevel } = body;

      if (!CATEGORIES.includes(category)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid category' }) };
      }
      if (!validateScore(category, score, body)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid score' }) };
      }

      // Update both alltime and weekly boards
      for (const scope of ['alltime', 'weekly']) {
        const key = `${scope}_${category}`;
        const existing = await store.get(key, { type: 'json' }).catch(() => null);
        const entries = existing?.entries || [];

        // Check if player already has an entry
        const idx = entries.findIndex(e => e.playerId === playerId);
        const isHigherBetter = category !== 'boss_clears'; // boss_clears = lower is better

        const newEntry = {
          playerId,
          playerName: playerName || 'Unknown',
          playerLevel: playerLevel || 1,
          score,
          submittedAt: new Date().toISOString()
        };

        if (idx >= 0) {
          // Update only if better
          const oldScore = entries[idx].score;
          const isBetter = isHigherBetter ? score > oldScore : score < oldScore;
          if (isBetter) {
            entries[idx] = newEntry;
          }
        } else {
          entries.push(newEntry);
        }

        // Sort and trim to top 100
        entries.sort((a, b) => isHigherBetter ? b.score - a.score : a.score - b.score);
        const trimmed = entries.slice(0, MAX_ENTRIES);

        await store.setJSON(key, { entries: trimmed, updatedAt: new Date().toISOString() });
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true })
      };
    }

    if (action === 'weekly-reset') {
      // Clear all weekly boards (call via scheduled function or manual trigger)
      for (const cat of CATEGORIES) {
        await store.setJSON(`weekly_${cat}`, { entries: [], updatedAt: new Date().toISOString() });
      }
      return { statusCode: 200, headers, body: JSON.stringify({ reset: true }) };
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
