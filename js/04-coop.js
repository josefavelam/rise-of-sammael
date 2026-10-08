// ════════════════════════════════════════════════════════════════════════════
//  CO-OP MULTIPLAYER v2  —  PeerJS P2P, host-authoritative
//
//  Bug-fixes in this version:
//  1. Shared map: host serializes genFloor() result + enemies, sends with
//     'start'. Guest uses host map data directly — identical layout for all.
//  2. Remote necros visible: host sends maxHP; rci always explicit.
//  3. Correct robe colors: local necro drawn with team color when in co-op.
//  4. Rejoin support: host sends 'welcome_back' + current state on reconnect.
//  5. Independent movement: each client controls RS.necro; guest's inputs
//     are NOT overridden by host state (only enemies are synced server-side).
//  6. Keyboard input: global keydown guard added (INPUT/TEXTAREA focus).
//  7. Mobile keyboard: aviaryCode input has inputmode/autocapitalize attrs.
// ════════════════════════════════════════════════════════════════════════════

// ── Robe palette: [robeTop, robeMid, robeBot, accentHex, colorName] ──────────
const COOP_ROBE_COLORS = [
  ['#150028','#1e003a','#0d001e','#a78bfa','Violet'],   // P1 host
  ['#002818','#00391f','#001208','#34d399','Emerald'],   // P2
  ['#280000','#3a0000','#1a0000','#f87171','Crimson'],   // P3
  ['#181200','#261b00','#0e0a00','#fbbf24','Gold'],      // P4
];

// ── Session state ─────────────────────────────────────────────────────────────
var MP = null;

// ── Aviary screen ──────────────────────────────────────────────────────────
function openAviaryScreen() {
  showScreen('aviary');
  _mpSetStatus('');
  renderAviaryRaidPicker();
}

// Aviary raid picker: grouped by country (faction), showing all 60 raids
// with unlocked/locked status and cleared indicator.
function renderAviaryRaidPicker() {
  const container = document.getElementById('aviaryRaidPicker');
  if (!container) return;
  const diffEl = document.getElementById('aviaryDiff');
  let selected = diffEl ? diffEl.value : '';

  container.innerHTML = '';

  // Pick first available raid if nothing selected
  if (!selected || !RAID_CONFIGS[selected]) {
    const firstAvail = WORLD_REGIONS.find(r => isRegionAccessible(r) && REGION_RAID_MAP[r.id]);
    if (firstAvail) {
      const keys = REGION_RAID_MAP[firstAvail.id] || [];
      selected = keys[0] || '';
    }
    if (diffEl) diffEl.value = selected;
  }

  const FACTION_INFO = {
    shire:  {label:'The Shire',    color:'#86efac'},
    rohan:  {label:'Rohan',        color:PALETTE.holyDk},
    elves:  {label:'Elven Realms', color:'#60a5fa'},
    gondor: {label:'Gondor',       color:'#93c5fd'},
    mordor: {label:'Mordor',       color:'#ef4444'},
  };
  const DIFF_COLOR = {easy:'#22c55e',medium:'#f59e0b',hard:'#ef4444',ascended:'#c084fc'};
  const DIFF_ICO   = {easy:'⚔',medium:'⚔⚔',hard:'⚔⚔⚔'};

  // Group regions by faction
  const facOrder = ['shire','rohan','elves','gondor','mordor'];
  facOrder.forEach(facId => {
    const fac = WM_FACTIONS[facId];
    const fi  = FACTION_INFO[facId] || {label:facId, color:'#818cf8'};
    if (!fac) return;

    // Only show regions the player has fully unlocked (level + faction progression)
    const facRegions = WORLD_REGIONS.filter(r =>
      fac.members.includes(r.id) && REGION_RAID_MAP[r.id] && isRegionAccessible(r)
    );
    // Skip entire faction if none of its regions are accessible
    if (!facRegions.length) return;

    // Faction collapsible section
    const details = document.createElement('details');
    details.open = facRegions.some(r =>
      (REGION_RAID_MAP[r.id]||[]).some(k => k === selected)
    );
    details.style.cssText = `border:1px solid ${fi.color}30;border-radius:10px;overflow:hidden;margin-bottom:4px`;

    const summary = document.createElement('summary');
    summary.style.cssText = `padding:9px 12px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:10px;
      color:${fi.color};background:${fi.color}12;list-style:none;display:flex;align-items:center;gap:8px;
      -webkit-tap-highlight-color:transparent;user-select:none`;
    const facCleared = facRegions.every(r => {
      const keys = REGION_RAID_MAP[r.id] || [];
      return keys.every(k => {
        const diff = k.replace(r.id + '_','');
        return GS.conquered[r.id]?.[diff];
      });
    });
    summary.innerHTML = `<span style="font-size:14px">${facCleared?'✅':'🏴'}</span>
      <span style="flex:1">${fi.label}</span>
      <span style="font-size:12px;color:${fi.color}99">${facRegions.length} regions ▸</span>`;
    details.appendChild(summary);

    const body = document.createElement('div');
    body.style.cssText = 'padding:6px 8px;display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,.2)';

    facRegions.forEach(region => {
      const rkeys = REGION_RAID_MAP[region.id] || [];
      const conq = GS.conquered[region.id] || {};

      // Region header
      const rhdr = document.createElement('div');
      rhdr.style.cssText = `font-family:'Almendra','Cinzel',serif;font-size:9px;color:${region.color};
        padding:3px 4px 1px;margin-top:2px;border-bottom:1px solid ${region.color}30`;
      rhdr.textContent = `${region.name} · Lv.${region.lv}`;
      body.appendChild(rhdr);

      rkeys.forEach((rkey, di) => {
        const cfg = RAID_CONFIGS[rkey];
        if (!cfg) return;
        const diffStyle = ['easy','medium','hard'][di];
        const diffLabel = ['Easy','Medium','Hard'][di];
        const cleared = conq[diffStyle];
        // Hide raids locked by difficulty progression (must clear Easy before Medium, etc.)
        const diffLocked = (di===1 && !conq.easy) || (di===2 && (!conq.easy||!conq.medium));
        if (diffLocked) return;

        const isSelected = rkey === selected;

        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 10px;
          background:${isSelected?'rgba(129,140,248,.18)':cleared?'rgba(252,211,77,.05)':'rgba(0,0,0,.1)'};
          border:1px solid ${isSelected?'rgba(129,140,248,.8)':cleared?'rgba(252,211,77,.3)':'rgba(255,255,255,.06)'};
          border-radius:7px;cursor:pointer`;

        row.innerHTML = `
          <span style="font-size:13px">${cfg.ico}</span>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${isSelected?'#c7d2fe':cleared?'#fcd34d':'#9ca3af'};
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cfg.name}</div>
            <div style="display:flex;gap:5px;align-items:center;margin-top:1px">
              <span style="font-size:11px;color:${DIFF_COLOR[diffStyle]}">${DIFF_ICO[diffStyle]} ${diffLabel}</span>
              <span style="font-size:11px;color:#4b5563">${cfg.floors}F</span>
              ${cleared?'<span style="font-size:11px;color:#fcd34d">★ Cleared</span>':''}
            </div>
          </div>
          ${isSelected?'<span style="color:#a5b4fc;font-size:13px">✓</span>':''}`;

        row.onclick = () => {
          if (diffEl) diffEl.value = rkey;
          selected = rkey;
          renderAviaryRaidPicker();
        };
        body.appendChild(row);
      });
    });

    details.appendChild(body);
    container.appendChild(details);
  });
}
function closeAviary() {
  _mpDestroy();
  openCastle();
}
function _mpSetStatus(txt, id='aviaryStatus') {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

// ═══════════════════════════════════════════════════════
//  HOST
// ═══════════════════════════════════════════════════════

function aviaryCreate() {
  const diff  = document.getElementById('aviaryDiff')?.value || 'cemetery';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  _mpSetStatus('🐦 Summoning the raven…');

  const peer = new Peer('NECRO-' + code, { debug: 0 });

  peer.on('open', id => {
    MP = {
      role: 'host', peer, peerId: id, code, raidKey: diff,
      playerIdx: 0,
      players: [{ id, name: 'You (Host)', playerIdx: 0, ready: false }],
      conns: [], started: false, _remoteNecros: {}, _retreated: new Set(),
      _mapData: null,  // set when raid starts; shared with guests
    };
    showScreen('coopLobby');
    _lobbyRender();
    peer.on('connection', conn => _hostOnConn(conn));
    peer.on('error', e => {
      if (e.type === 'unavailable-id') { peer.destroy(); setTimeout(aviaryCreate, 200); }
      else _mpSetStatus('❌ Server error — try again.');
      console.error(e);
    });
  });
  peer.on('error', e => {
    _mpSetStatus('❌ Could not reach relay server.');
    console.error(e);
  });
}

function _hostOnConn(conn) {
  if (!MP || MP.role !== 'host') return;
  // Don't immediately add — wait for code-verified hello message
  // But close right away if already at cap with verified players
  if (MP.players.length >= 4) { conn.close(); return; }

  // Track pending (unverified) connections — they get a short window to send hello
  if (!MP._pendingConns) MP._pendingConns = new Set();
  MP._pendingConns.add(conn.peer);

  const _rejectTimer = setTimeout(() => {
    // If still pending after 4 seconds, reject
    if (MP._pendingConns && MP._pendingConns.has(conn.peer)) {
      MP._pendingConns.delete(conn.peer);
      try { conn.close(); } catch(_) {}
    }
  }, 4000);

  conn.on('open', () => {
    // Connection opened — wait for hello with code
  });

  conn.on('data', data => {
    // Handle hello/code verification before routing to main handler
    if (data && data.type === 'hello' && MP._pendingConns && MP._pendingConns.has(conn.peer)) {
      clearTimeout(_rejectTimer);
      MP._pendingConns.delete(conn.peer);
      // Validate code
      if (data.code !== MP.code) {
        try { conn.close(); } catch(_) {}
        return;
      }
      // Code verified — now admit the player
      const existing = MP.players.find(p => p.id === conn.peer);
      if (!existing) {
        if (MP.players.length >= 4) { conn.close(); return; }
        const playerIdx = MP.players.length;
        MP.players.push({ id: conn.peer, name: data.necroName || ('Ally ' + playerIdx),
                          playerIdx, ready: false });
        MP.conns.push(conn);
        MP.players.forEach((p, i) => p.playerIdx = i);
      } else {
        const oldConn = MP.conns.find(c => c.peer === conn.peer);
        if (oldConn) MP.conns = MP.conns.filter(c => c !== oldConn);
        MP.conns.push(conn);
      }
      if (MP.started && MP._mapData) {
        conn.send({
          type: 'welcome_back',
          raidKey: MP.raidKey,
          playerIdx: MP.players.find(p => p.id === conn.peer)?.playerIdx ?? 1,
          mapData: MP._mapData,
        });
      } else {
        _hostBroadcastLobby();
        _lobbyRender();
      }
      return;
    }
    // Route all other messages only if this peer is verified (in players list)
    if (!MP._pendingConns || !MP._pendingConns.has(conn.peer)) {
      _hostOnData(data, conn.peer);
    }
  });

  conn.on('close', () => {
    if (MP._pendingConns) MP._pendingConns.delete(conn.peer);
    clearTimeout(_rejectTimer);
    MP.conns = MP.conns.filter(c => c.peer !== conn.peer);
    if (MP.started && MP.conns.length === 0 && MP.players.length <= 1) endRaid('retreat');
  });
}

function _hostOnData(data, fromPeerId) {
  if (!data?.type || !MP) return;
  const player = MP.players.find(p => p.id === fromPeerId);
  if (!player) return;

  if (data.type === 'ready') {
    player.ready = true;
    _hostBroadcastLobby();
    _lobbyRender();
    _checkAllReady();
  }

  if (data.type === 'input' && MP.started && RS) {
    // Ignore input from players who have retreated
    if (MP._retreated && MP._retreated.has(player.playerIdx)) return;
    // Store remote necro position (with explicit rci for robe color)
    MP._remoteNecros[player.playerIdx] = {
      x: data.necro.x, y: data.necro.y,
      hp: data.necro.hp, maxHP: data.necro.maxHP,
      dead: data.necro.dead,
      _wp: data.necro._wp || 0,
      playerIdx: player.playerIdx,
      rci: player.playerIdx,
      cosm: data.necro.cosm || null,
      necroName: data.necro.necroName || player.name || '',
      _ts: Date.now(),
      minions: data.minions || [],
      activePet: data.activePet || null,
      activeHeroes: data.activeHeroes || [],
    };
  }

  if (data.type === 'rise_attempt' && MP.started && RS && RS.bossCorpse && !RS.bossCorpse.raised) {
    const bc = RS.bossCorpse;
    const bd = bc.def || BOSSES.lich;
    // Increment fail count on the authoritative host copy
    // (success doesn't increment — but we check the 3-attempt total first)
    const attemptNum = (bc.failCount || 0) + 1;
    const _riseChance = data.lichForm ? 1.0 : 0.20;
    if (Math.random() < _riseChance) {
      // ── SUCCESS ──
      bc.raised = true;
      const alreadyOwned = GS.raisedBosses.some(r => r.bossKey === bc.bossKey);
      if (!alreadyOwned) {
        GS.raisedBosses.push({ bossKey: bc.bossKey, name: bd.name, type: bc.type, def: bd });
        saveGame(false);
      }
      // Broadcast success to all
      const _successMsg = { type: 'rise_result', outcome: 'success', bossName: bd.name, bossKey: bc.bossKey };
      MP.conns.forEach(c => { try { c.send(_successMsg); } catch (_) {} });
      // Also run locally on host
      _riseApplySuccess(bc, bd);
    } else {
      bc.failCount = attemptNum;
      RS._riseFailCount = attemptNum;
      if (attemptNum >= 3) {
        // Third failure — boss escaped but raid still counts as victory
        RS.bossCorpse = null;
        const _defeatMsg = { type: 'rise_result', outcome: 'rise_defeat', bossName: bd.name };
        MP.conns.forEach(c => { try { c.send(_defeatMsg); } catch (_) {} });
        _riseApplyDefeat(bd);
      } else {
        // Failure — boss respawns
        RS.bossCorpse = null;
        RS.boss.dead = false;
        RS.boss.hp = Math.ceil(bd.maxHP * 0.25);
        RS.boss.fortitudeUsed = true;
        RS.bossReady = true;
        const _failMsg = { type: 'rise_result', outcome: 'fail', failCount: attemptNum, bossName: bd.name, bossHP: RS.boss.hp, bossMaxHP: bd.maxHP };
        MP.conns.forEach(c => { try { c.send(_failMsg); } catch (_) {} });
        _riseApplyFail(bd, attemptNum);
      }
    }
    _hostBroadcastState && _hostBroadcastState();
  }

  if (data.type === 'retreat') {
    // Mark as permanently retreated so future input messages are ignored
    if (!MP._retreated) MP._retreated = new Set();
    MP._retreated.add(player.playerIdx);
    // Remove retreated player immediately from remote necros so they vanish from the map
    delete MP._remoteNecros[player.playerIdx];
    // Broadcast updated remotes so all guests also remove the retreater
    _hostBroadcastState && _hostBroadcastState();
    // If last guest left, host ends the raid
    if (MP.started && MP.conns.length === 0) endRaid('retreat');
  }
}

function _hostBroadcastLobby() {
  if (!MP || MP.role !== 'host') return;
  const msg = {
    type: 'lobby', code: MP.code, raidKey: MP.raidKey,
    players: MP.players.map(p => ({ id: p.id, name: p.name,
                                    playerIdx: p.playerIdx, ready: p.ready })),
  };
  MP.conns.forEach(c => { try { c.send(msg); } catch (_) {} });
}

function _hostBroadcastState() {
  if (!MP || MP.role !== 'host' || !MP.started || !RS) return;
  const msg = {
    type: 'state',
    // Host's own necro (P0) for guests to render as remote
    hostNecro: {
      x: RS.necro.x, y: RS.necro.y,
      hp: RS.necro.hp, maxHP: RS.necro.maxHP,
      dead: RS.necro.dead,
      _wp: RS.necro._wp || 0,
      playerIdx: 0, rci: 0,
      cosm: _getLocalCosmetics(),
      necroName: GS.necroName||'',
      shield: RS.shield||0, atkMult: RS.atkMult||1, revive: !!RS.revive,
    },
    // All other remote necros the host has received
    remotes: MP._remoteNecros,
    // Authoritative enemy state (types are fixed; only position/hp/dead changes)
    enemies: RS.enemies.map(e => ({
      x: e.x, y: e.y, hp: e.hp, dead: e.dead, corpse: e.corpse, _alerted: e._alerted,
    })),
    // Boss state — full sync so guest renders correctly and fortitude is in sync
    boss: RS.boss ? {
      hp: RS.boss.hp, dead: RS.boss.dead, x: RS.boss.x, y: RS.boss.y,
      fortitudeUsed: RS.boss.fortitudeUsed, maxHP: RS.boss.maxHP,
    } : null,
    bossReady: RS.bossReady,
    bossPhase: RS.bossPhase || 1,
    // Key/stair state
    hasKey: RS.hasKey, stairLocked: RS.stairLocked,
    key: RS.key ? { x: RS.key.x, y: RS.key.y } : null,
    keyHolder: RS._keyHolder ?? -1,
    done: RS.done, result: RS.result,
    // Boss corpse state — guests need this to show the rise panel
    bossCorpse: RS.bossCorpse && !RS.bossCorpse.raised ? {
      bossKey: RS.bossCorpse.bossKey,
      name:    RS.bossCorpse.name,
      type:    RS.bossCorpse.type,
      x: RS.bossCorpse.x, y: RS.bossCorpse.y,
      failCount: RS.bossCorpse.failCount || 0,
      raised: false,
      def: RS.bossCorpse.def,
    } : (RS.bossCorpse?.raised ? { raised: true } : null),
    // Loot totals (authoritative on host — guests mirror these)
    bonesGained: RS.bonesGained,
    wGained: RS.wGained,
    xpGained: RS.xpGained,
    // Host minions — broadcast so guests can render them
    hostMinions: RS.minions.filter(m => !m.dead).map(m => ({
      type: m.type, x: m.x, y: m.y, hp: m.hp, maxHP: m.maxHP, _wp: m._wp || 0,
    })),
    // Host pet — broadcast so guests can render it
    hostPet: RS.activePet ? {
      type: RS.activePet.type, x: RS.activePet.x, y: RS.activePet.y,
      hp: RS.activePet.hp, maxHP: RS.activePet.maxHP, _wp: RS.activePet._wp || 0,
    } : null,
  };
  MP.conns.forEach(c => { try { c.send(msg); } catch (_) {} });
}

// ── Serialize map for sending to guests ──────────────────────────────────────
function _serializeMap() {
  if (!RS) return null;
  // Grid: run-length encode Uint8Array rows as base64
  const rows = RS.grid.length;
  const cols = RS.grid[0].length;
  const flat = new Uint8Array(rows * cols);
  for (let r = 0; r < rows; r++) flat.set(RS.grid[r], r * cols);
  const b64 = btoa(String.fromCharCode(...flat));
  return {
    gridB64: b64, rows, cols,
    rooms: RS.rooms.map(r => ({ cx: r.cx, cy: r.cy, x: r.x, y: r.y, w: r.w, h: r.h })),
    startX: RS.necro.x, startY: RS.necro.y,
    stairX: RS.stairX, stairY: RS.stairY,
    floorNum:    RS.floorNum,
    floorTotal:  RS.floorTotal,
    isFinalFloor: RS.isFinalFloor,
    enemies: RS.enemies.map(e => ({
      type: e.type, x: e.x, y: e.y,
      hp: e.hp, maxHP: e.maxHP,
      patX: e.patX, patY: e.patY,
      isMB: e.isMB || false,
      dmgMult: e.dmgMult || 1,
    })),
  };
}

// ═══════════════════════════════════════════════════════
//  GUEST
// ═══════════════════════════════════════════════════════

function aviaryJoin() {
  const code = (document.getElementById('aviaryCode')?.value || '').toUpperCase().trim();
  if (code.length !== 6) { showToast('Enter the 6-letter code'); return; }
  _mpSetStatus('🐦 Seeking the raven…');

  const peer = new Peer(undefined, { debug: 0 });
  peer.on('open', myId => {
    MP = {
      role: 'guest', peer, peerId: myId, code,
      raidKey: 'cemetery', playerIdx: 1,
      players: [], conns: [], hostConn: null,
      started: false, _remoteNecros: {},
    };

    const conn = peer.connect('NECRO-' + code, { reliable: true });
    MP.hostConn = conn;

    conn.on('open', () => {
      _mpSetStatus('✓ Connected — authenticating…');
      // Send hello with code so host can verify before adding to party
      try { conn.send({ type: 'hello', code, necroName: GS.necroName || 'Ally' }); } catch(_) {}
    });
    conn.on('data', data => _guestOnData(data));
    conn.on('close', () => {
      if (!MP?.started) { showToast('🐦 Disconnected'); closeAviary(); }
      else { showToast('🐦 Host disconnected'); _mpDestroy(); openCastle(); }
    });
    conn.on('error', e => { _mpSetStatus('❌ Could not connect. Check the code.'); console.error(e); });
  });
  peer.on('error', e => { _mpSetStatus('❌ Connection failed. Check code.'); console.error(e); });
}

function _guestOnData(data) {
  if (!data?.type || !MP) return;

  if (data.type === 'lobby') {
    MP.raidKey = data.raidKey;
    MP.players = data.players;
    const me = MP.players.find(p => p.id === MP.peerId);
    if (me) MP.playerIdx = me.playerIdx;
    showScreen('coopLobby');
    _lobbyRender();
  }

  if (data.type === 'start') {
    MP.started = true;
    MP.raidKey = data.raidKey;
    MP.playerIdx = data.playerIdx ?? MP.playerIdx;
    _playDoorOpen();
    TransitionManager.play('raidFade',700,{hold:true,
      onMid:()=>{
        showScreen('raid');
        _initRaidFromHostData(data);
      }
    });
  }

  if (data.type === 'welcome_back') {
    // Reconnected mid-raid
    MP.started = true;
    MP.raidKey = data.raidKey;
    MP.playerIdx = data.playerIdx ?? MP.playerIdx;
    showScreen('raid');
    _initRaidFromHostData(data);
  }

  // ── FIX: Floor change — follow host to next floor ──────────────────────────
  if (data.type === 'floor_change' && MP.started) {
    _playDoorOpen();
    flash(`🪜 Descending to Floor ${data.floorNum || ''}...`, 16, '#fcd34d');
    // Save current HP so initRaid doesn't start the new floor at full health
    if (RS && RS.necro) GS.necroHP = Math.max(1, Math.round(RS.necro.hp));
    TransitionManager.play('irisWipe',800,{
      onMid:()=>{
        showScreen('raid');
        _initRaidFromHostData(data);
      }
    });
  }

  // ── FIX: Host ended the raid — guests must follow ─────────────────────────
  if (data.type === 'revive_player' && RS && RS.necro.dead && data.targetIdx === MP.playerIdx) {
    RS.necro.dead = false;
    RS.necro.hp = Math.round(RS.necro.maxHP * 0.3);
    flash('✨ An ally used Revive Dust — you rise again!', 16, '#fcd34d');
  }

  if (data.type === 'end_raid' && MP.started) {
    if (RS && !RS.done) {
      // Sync final loot totals from host before showing summary
      if (data.bonesGained !== undefined) RS.bonesGained = data.bonesGained;
      if (data.wGained)    RS.wGained    = data.wGained;
      if (data.xpGained !== undefined) RS.xpGained = data.xpGained;
      // Sync isFinalFloor and floor metadata so trophy is awarded correctly
      if (data.isFinalFloor !== undefined) RS.isFinalFloor = data.isFinalFloor;
      if (data.floorNum    !== undefined) RS.floorNum     = data.floorNum;
      if (data.floorTotal  !== undefined) RS.floorTotal   = data.floorTotal;
      endRaid(data.result || 'retreat');
    }
    _mpDestroy();
  }

  if (data.type === 'state' && RS) {
    // ── FIX: Authoritative enemy sync — only update if host also says dead, or enemy is alive locally
    // Never resurrect an enemy the guest has already killed (would cause visible undying enemies)
    if (data.enemies) {
      data.enemies.forEach((he, i) => {
        const e = RS.enemies[i]; if (!e) return;
        e.x = he.x; e.y = he.y; e._alerted = he._alerted;
        // Host is authoritative for enemy HP — always accept
        e.hp = he.hp;
        // Only sync dead/corpse if host says dead OR enemy is not yet locally dead
        if (he.dead || !e.dead) {
          e.dead = he.dead; e.corpse = he.corpse;
        }
      });
    }
    // Sync boss — host is authoritative; spawn on guest if needed
    if (data.bossReady && !RS.bossReady) {
      RS.bossReady = true;
      if (data.boss && !RS.boss) {
        // Boss spawned on host — spawn it locally too (visual only; no combat)
        spawnBoss();
      }
    }
    if (data.boss && RS.boss) {
      RS.boss.hp   = data.boss.hp;
      // Never un-kill a locally-dead boss on guest
      if (data.boss.dead || !RS.boss.dead) RS.boss.dead = data.boss.dead;
      RS.boss.x    = data.boss.x;   RS.boss.y    = data.boss.y;
      RS.boss.fortitudeUsed = data.boss.fortitudeUsed ?? RS.boss.fortitudeUsed;
    } else if (data.boss && !RS.boss && data.bossReady) {
      spawnBoss(); // ensure boss object exists for rendering
    }
    if (data.bossPhase && RS.bossPhase !== data.bossPhase) RS.bossPhase = data.bossPhase;

    // Sync bossCorpse — lets guests see and attempt the rise
    if (data.bossCorpse !== undefined) {
      if (data.bossCorpse && !data.bossCorpse.raised) {
        RS.bossCorpse = data.bossCorpse;
        // Show rise button so guest can attempt
        const _rBtn = document.getElementById('asp_rise');
        if (_rBtn) { _rBtn.classList.remove('ready'); _rBtn.classList.add('rise-highlight'); }
        document.getElementById('bossBar').style.display = 'none';
      } else if (data.bossCorpse?.raised) {
        if (RS.bossCorpse) RS.bossCorpse.raised = true;
        closeRisePanel && closeRisePanel();
      } else {
        // null — corpse gone (boss respawned after failed rise)
        RS.bossCorpse = null;
        closeRisePanel && closeRisePanel();
      }
    }
    // Sync key/stair
    if (data.hasKey !== undefined) RS.hasKey = data.hasKey;
    if (data.stairLocked !== undefined) RS.stairLocked = data.stairLocked;
    if (data.key) RS.key = data.key; else if (data.key === null) RS.key = null;
    if (data.keyHolder !== undefined) RS._keyHolder = data.keyHolder;

    // ── FIX 7: Loot sync — mirror host's authoritative loot totals ──────────
    if (data.bonesGained !== undefined) RS.bonesGained = data.bonesGained;
    if (data.wGained)    RS.wGained    = data.wGained;
    if (data.xpGained !== undefined) RS.xpGained = data.xpGained;

    // Build remote necro display dict
    const newRemotes = {};
    const _stateTs = Date.now();
    if (data.hostNecro) {
      newRemotes[0] = { ...data.hostNecro, minions: data.hostMinions || [], activePet: data.hostPet || null, _ts: _stateTs };
    }
    if (data.remotes) {
      Object.values(data.remotes).forEach(rn => {
        if (rn && rn.playerIdx !== MP.playerIdx) newRemotes[rn.playerIdx] = { ...rn, _ts: _stateTs };
      });
    }
    MP._remoteNecros = newRemotes;

    if (data.done && !RS.done) { RS.done = true; RS.result = data.result; }
    // Note: RS.done may be set true here by state broadcast arriving before end_raid.
    // The end_raid handler resets it before calling endRaid() so conquest/loot always fires.
  }
}

// ── Guest: initialize raid from host's serialized map ────────────────────────
function _initRaidFromHostData(data) {
  const md = data.mapData;
  if (!md) { initRaid(data.raidKey || MP.raidKey, 1); return; }

  // Decode grid
  const flat = Uint8Array.from(atob(md.gridB64), c => c.charCodeAt(0));
  const grid = Array.from({ length: md.rows }, (_, r) =>
    new Uint8Array(flat.buffer, r * md.cols, md.cols).slice()
  );

  // Use host's startX/Y as spawn but offset for multiplayer
  const pIdx = MP.playerIdx;
  const spawnX = clamp(md.startX + (pIdx % 2) * 40 - 20, TILE_SIZE * 1.5, MAP - TILE_SIZE * 1.5);
  const spawnY = clamp(md.startY + Math.floor(pIdx / 2) * 40, TILE_SIZE * 1.5, MAP - TILE_SIZE * 1.5);

  // Call initRaid using host's floor number so isFinalFloor is correct
  const floorNum   = data.floorNum   ?? 1;
  const floorTotal = data.floorTotal ?? 1;
  initRaid(data.raidKey || MP.raidKey, floorNum, { floorTotal });

  // Override RS with host's map data
  if (!RS) return;
  RS.grid = grid;
  RS.rooms = md.rooms;
  RS.stairX = md.stairX;
  RS.stairY = md.stairY;
  RS.necro.x = spawnX; RS.necro.y = spawnY;
  RS.necro.tx = spawnX; RS.necro.ty = spawnY;
  // Carry isFinalFloor exactly as host computed it
  RS.isFinalFloor = data.isFinalFloor ?? (floorNum >= floorTotal);
  RS.floorTotal   = floorTotal;
  RS.floorNum     = floorNum;

  // Replace enemies with host's enemy list (same types + positions)
  RS.enemies = md.enemies.map(he => {
    const d = EDEF[he.type] || {};
    return {
      type: he.type, x: he.x, y: he.y,
      hp: he.hp, maxHP: he.maxHP,
      patX: he.patX, patY: he.patY,
      isMB: he.isMB || false,
      dmgMult: he.dmgMult || 1,
      lat: 0, dead: false, deadAt: 0, corpse: false, slowUntil: 0,
    };
  });
}

// ── Guest: send my position + state to host ───────────────────────────────────
function _guestSendInput() {
  if (!MP?.hostConn || !RS) return;
  try {
    MP.hostConn.send({
      type: 'input',
      necro: {
        x: RS.necro.x, y: RS.necro.y,
        hp: RS.necro.hp, maxHP: RS.necro.maxHP,
        dead: RS.necro.dead,
        _wp: RS.necro._wp || 0,
        cosm: _getLocalCosmetics(),
        necroName: GS.necroName || '',
        shield: RS.shield||0, atkMult: RS.atkMult||1, revive: !!RS.revive,
      },
      // Send guest minions so host can relay them to other guests
      minions: RS.minions.filter(m => !m.dead).map(m => ({
        type: m.type, x: m.x, y: m.y, hp: m.hp, maxHP: m.maxHP, _wp: m._wp || 0,
      })),
      // Send guest pet so host can relay it
      activePet: RS.activePet ? {
        type: RS.activePet.type, x: RS.activePet.x, y: RS.activePet.y,
        hp: RS.activePet.hp, maxHP: RS.activePet.maxHP, _wp: RS.activePet._wp || 0,
      } : null,
    });
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════
//  LOBBY
// ═══════════════════════════════════════════════════════

function _lobbyRender() {
  if (!MP) return;
  const codeEl    = document.getElementById('lobbyCodeDisplay');
  const playersEl = document.getElementById('lobbyPlayers');
  const infoEl    = document.getElementById('lobbyRaidInfo');
  const statusEl  = document.getElementById('lobbyStatus');
  const readyBtn  = document.getElementById('lobbyReadyBtn');

  if (codeEl) codeEl.textContent = MP.code || '------';

  const cfg = (typeof RAID_CONFIGS !== 'undefined') && RAID_CONFIGS[MP.raidKey];
  if (infoEl && cfg) infoEl.textContent = cfg.ico + ' ' + cfg.name;

  if (playersEl) {
    const slots = MP.players.length ? MP.players
      : [{ name: 'You', playerIdx: 0, ready: false, id: MP.peerId }];
    let html = slots.map(p => {
      const rc  = COOP_ROBE_COLORS[p.playerIdx] || COOP_ROBE_COLORS[0];
      const acc = rc[3];
      const isMe = p.id === MP.peerId;
      const bord = p.ready ? 'rgba(34,197,94,.45)' : acc + '44';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(0,0,0,.25);border:1px solid ${bord};border-radius:9px">
        <div style="width:11px;height:11px;border-radius:50%;background:${acc};box-shadow:0 0 6px ${acc}88;flex-shrink:0"></div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${acc};flex:1">${p.name||'Ally'}${isMe?' <span style="opacity:.5">(You)</span>':''}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${p.ready?'#86efac':'#4b5563'}">${p.ready?'✓ Ready':'Waiting…'}</div>
      </div>`;
    }).join('');
    for (let i = slots.length; i < 4; i++) {
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(0,0,0,.08);border:1px dashed rgba(129,140,248,.1);border-radius:9px;opacity:.35">
        <div style="width:11px;height:11px;border-radius:50%;background:#1f1f2e;flex-shrink:0"></div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#374151">Awaiting ally…</div></div>`;
    }
    playersEl.innerHTML = html;
  }

  const me = MP.players.find(p => p.id === MP.peerId);
  const iAmReady = me?.ready || false;
  if (readyBtn) {
    readyBtn.textContent = iAmReady ? '✓ Ready!' : '✓ Mark Ready';
    readyBtn.style.background    = iAmReady ? 'rgba(34,197,94,.3)' : 'rgba(34,197,94,.12)';
    readyBtn.style.borderColor   = iAmReady ? 'rgba(34,197,94,.9)' : 'rgba(34,197,94,.45)';
    readyBtn.disabled = iAmReady;
  }

  const rc = MP.players.filter(p => p.ready).length;
  const tc = MP.players.length;
  if (statusEl) {
    if (tc === 0)                                   statusEl.textContent = 'Waiting for allies…';
    else if (MP.players.every(p => p.ready) && tc)  statusEl.textContent = '⚔ All ready — the gate opens!';
    else                                             statusEl.textContent = rc + '/' + tc + ' ready';
  }
}

function lobbyReady() {
  if (!MP) return;
  const me = MP.players.find(p => p.id === MP.peerId);
  if (me) me.ready = true;
  _lobbyRender();
  if (MP.role === 'host') {
    _hostBroadcastLobby();
    _checkAllReady();
  } else if (MP.hostConn) {
    try { MP.hostConn.send({ type: 'ready' }); } catch (_) {}
  }
}

function lobbyReturn() {
  if (MP?.role === 'guest' && MP.hostConn) {
    try { MP.hostConn.send({ type: 'retreat' }); } catch (_) {}
  }
  _mpDestroy();
  openCastle();
}

function _checkAllReady() {
  if (!MP || MP.role !== 'host' || MP.started || !MP.players.every(p => p.ready)) return;
  if (MP.players.length < 1) return;
  MP.started = true;
  _playDoorOpen();

  // Start raid, then serialize map for guests
  TransitionManager.play('raidFade',700,{hold:true,
    onMid:()=>{
      showScreen('raid');
      initRaid(MP.raidKey, 1);
    },
    onDone:()=>{
      // After initRaid has built RS, serialize and send to guests
      MP._mapData = _serializeMap();
      const msg = {
        type: 'start', raidKey: MP.raidKey,
        mapData: MP._mapData,
        players: MP.players.map(p => ({ id: p.id, playerIdx: p.playerIdx })),
        floorNum:    RS ? RS.floorNum    : 1,
        floorTotal:  RS ? RS.floorTotal  : 1,
        isFinalFloor: RS ? RS.isFinalFloor : false,
      };
      // Send each guest their own playerIdx
      MP.conns.forEach((c, ci) => {
        const guestPlayer = MP.players.find(p => p.id === c.peer);
        try { c.send({ ...msg, playerIdx: guestPlayer?.playerIdx ?? (ci + 1) }); } catch (_) {}
      });
    }
  });
}

// ── Door-open visual ──────────────────────────────────────────────────────────
function _playDoorOpen() {
  /* playTone door-open SFX removed */
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:none;background:rgba(129,140,248,0);transition:background .25s ease-in,opacity .35s ease-out .25s';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.background = 'rgba(129,140,248,0.35)';
    setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),400); },250);
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function _mpDestroy() {
  if (MP?.peer) { try { MP.peer.destroy(); } catch (_) {} }
  MP = null;
}

// ═══════════════════════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════════════════════

// Team-colored / cosmetic necromancer sprite — reads window._mpRobeRC + window._mpCosm
SPR.necromancer_coop = (c, t, w = 0) => {
  const cosm = window._mpCosm || null;
  const rc = window._mpRobeRC || COOP_ROBE_COLORS[1];
  // If player has custom cosmetics, use the full cosmetic sprite
  if (cosm && (cosm.robe || cosm.hat || cosm.staff)) {
    SPR.necromancer(c, t, w, cosm);
    // Add team accent ring for co-op identification
    const racc = rc[3];
    c.save(); c.strokeStyle=racc+'66'; c.lineWidth=1.2;
    c.beginPath(); c.arc(0,0,16,0,Math.PI*2); c.stroke(); c.restore();
    return;
  }
  // Default team-colored robe
  const [rt, rmid, rbot, racc] = rc;
  const bob = Math.abs(w) * 1.5, lean = w * 1.5;
  c.save(); c.translate(lean * 0.4, -bob);
  const rg = c.createLinearGradient(-9, -8, 9, 16);
  rg.addColorStop(0, rt); rg.addColorStop(.5, rmid); rg.addColorStop(1, rbot);
  c.fillStyle = rg;
  c.beginPath();
  c.moveTo(-9+w,-8); c.lineTo(9+w,-8); c.lineTo(13+w*2,16); c.lineTo(-13+w*2,16);
  c.closePath(); c.fill();
  c.strokeStyle = racc + '55'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-9+w,-8); c.lineTo(-13+w*2,16); c.stroke();
  c.beginPath(); c.moveTo(9+w,-8);  c.lineTo(13+w*2,16);  c.stroke();
  c.fillStyle = rbot; c.fillRect(-7,14,4,4); c.fillRect(1,14,4,4);
  c.restore();
  c.save(); c.translate(lean*.2,-bob*.7);
  c.fillStyle='#0d001e'; c.beginPath(); c.arc(0,-17,8.5,Math.PI,0); c.lineTo(9,-17); c.lineTo(-9,-17); c.closePath(); c.fill();
  fc(c,0,-17,7,'#c8b8a0');
  c.fillStyle=racc; c.shadowColor=racc; c.shadowBlur=7;
  fc(c,-2.5,-19,2,''); fc(c,2.5,-19,2,''); c.shadowBlur=0;
  c.restore();
  c.save(); c.translate(0,-bob*.3); c.rotate(-w*.18);
  c.strokeStyle='#4a2810'; c.lineWidth=2.5;
  c.beginPath(); c.moveTo(11,16); c.lineTo(10,-22); c.stroke();
  const og=c.createRadialGradient(10,-26,1,10,-26,5);
  og.addColorStop(0,racc); og.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=og; c.shadowColor=racc; c.shadowBlur=8;
  fc(c,10,-26,5,''); c.shadowBlur=0; fc(c,10,-26,4,racc+'bb');
  c.restore();
};

// Draw all remote allied necromancers (in world-space, inside camera transform)
function _mpDrawRemotes(t) {
  if (!MP?._remoteNecros) return;
  Object.values(MP._remoteNecros).forEach(rn => {
    if (!rn || rn.dead) return;
    if (rn.playerIdx === MP.playerIdx) return; // never draw self
    _mpDrawOneRemote(rn, t);
  });
}

function _mpDrawOneRemote(rn, t) {
  const rci = rn.rci ?? rn.playerIdx ?? 1;
  const rc  = COOP_ROBE_COLORS[Math.max(0, Math.min(rci, COOP_ROBE_COLORS.length-1))];
  const acc = rc[3];

  // Ground shadow ellipse
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(rn.x,rn.y+14,11,4,0,0,Math.PI*2); ctx.fill();

  // Radial team aura
  try {
    const ag=ctx.createRadialGradient(rn.x,rn.y,4,rn.x,rn.y,28);
    ag.addColorStop(0,acc+'30'); ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(rn.x,rn.y,28,0,Math.PI*2); ctx.fill();
  } catch (_) {}

  // Sprite — lich form or normal
  ctx.save();
  ctx.translate(rn.x, rn.y);
  if (rn.cosm?._isLich) {
    // Draw Sammael/lich form for this remote player
    const lichGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
    lichGlow.addColorStop(0, 'rgba(220,0,0,.22)'); lichGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lichGlow; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.4, 1.4);
    try { if (SPR.sammaels) SPR.sammaels(ctx, t, 0); } catch (_) {}
  } else {
    window._mpRobeRC = rc;
    window._mpCosm = rn.cosm || null;
    drawSprite(ctx,'necromancer_coop',0,0,1,1,t,Math.sin(rn._wp||0));
    window._mpRobeRC = null;
    window._mpCosm = null;
  }
  ctx.restore();

  // Player badge
  ctx.save();
  ctx.font='bold 7px "Almendra","Cinzel",monospace'; ctx.textAlign='center';
  ctx.fillStyle=acc; ctx.shadowColor=acc; ctx.shadowBlur=5;
  const pName=rn.necroName||(rn.name&&rn.name!=='You'?rn.name:null)||('P'+(rci+1));
  ctx.fillText(pName, rn.x, rn.y-38);
  ctx.shadowBlur=0; ctx.textAlign='left';
  ctx.restore();

  // HP bar
  if (rn.maxHP) hpBar(rn.x, rn.y-32, 34, 4, Math.max(0,rn.hp/rn.maxHP), acc);
}

// ── Patch drawNecro: render remote allies + tint local necro in co-op ─────────
const _origDrawNecro = drawNecro;
drawNecro = function(t) {
  // If in co-op, draw local necro with team robe color
  if (MP?.started && RS && !RS.necro.dead) {
    const n   = RS.necro;
    const rci = MP.playerIdx;
    const rc  = COOP_ROBE_COLORS[Math.max(0,Math.min(rci, COOP_ROBE_COLORS.length-1))];

    // Draw movement trail line
    if (Math.hypot(n.x-n.tx,n.y-n.ty) > 10) {
      ctx.save(); ctx.setLineDash([5,6]); ctx.strokeStyle='rgba(124,58,237,.28)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(n.tx,n.ty); ctx.stroke(); ctx.restore();
    }
    // Aura (colored by team)
    try {
      const aura=ctx.createRadialGradient(n.x,n.y,4,n.x,n.y,28);
      aura.addColorStop(0,rc[3]+'33'); aura.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(n.x,n.y,28,0,Math.PI*2); ctx.fill();
    } catch(_) {}
    if (typeof autoMode!=='undefined'&&autoMode) {
      ctx.strokeStyle='rgba(34,197,94,.5)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(n.x,n.y,32,0,Math.PI*2);ctx.stroke();
    }
    const anim=n._attackAnim&&t<n._attackAnim?'attack':'idle';
    ctx.save(); ctx.translate(n.x,n.y);
    if (_sammAelActive) {
      // Lich form — draw Sammael sprite with red aura
      const lg = ctx.createRadialGradient(0,0,0,0,0,32);
      lg.addColorStop(0,'rgba(220,0,0,.22)'); lg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(0,0,32,0,Math.PI*2); ctx.fill();
      ctx.scale(1.4,1.4);
      try { if(SPR.sammaels) SPR.sammaels(ctx,t,0); } catch(_) {}
    } else {
      window._mpRobeRC = rc;
      window._mpCosm = GS.cosmetics || null;
      drawSprite(ctx,'necromancer_coop',0,0,1,1,t,Math.sin(n._wp||0),anim,n._hurtUntil);
      window._mpRobeRC = null;
      window._mpCosm = null;
    }
    ctx.restore();
    hpBar(n.x,n.y-32,34,4,n.hp/n.maxHP,'#f87171');
    // Show local player's name in co-op
    if(GS.necroName){
      ctx.save();
      ctx.font='bold 7px "Almendra","Cinzel",monospace';ctx.textAlign='center';
      const localRC=COOP_ROBE_COLORS[Math.max(0,Math.min(MP.playerIdx||0,COOP_ROBE_COLORS.length-1))];
      ctx.fillStyle=localRC[3]||'#f87171';ctx.shadowColor=localRC[3]||'#f87171';ctx.shadowBlur=5;
      ctx.fillText(GS.necroName,n.x,n.y-40);
      ctx.shadowBlur=0;ctx.restore();
    }
  } else {
    _origDrawNecro(t);
  }
  // Draw remote allies
  _mpDrawRemotes(t);
};

// ── Patch loop: sync state + skip enemy AI on guests ─────────────────────────
const _origLoop = loop;
let _mpTick = 0;
loop = function(ts) {
  _origLoop(ts);
  if (!MP?.started) return;
  _mpTick++;
  if (MP.role === 'host'  && _mpTick % 3 === 0) _hostBroadcastState();
  if (MP.role === 'guest' && _mpTick % 2 === 0) _guestSendInput();
};

// ── FIX: Guest skips enemy AI entirely — host is authoritative ───────────────
const _origTickEnemies = tickEnemies;
tickEnemies = function(t, dt) {
  if (MP?.started && MP.role === 'guest') return;
  _origTickEnemies(t, dt);
};

const _origCheckVictory = checkVictory;
checkVictory = function(t) {
  if (MP?.started && MP.role === 'guest') return;
  _origCheckVictory(t);
};

const _origTickBoss = tickBoss;
tickBoss = function(t, dt) {
  if (MP?.started && MP.role === 'guest') {
    // Render boss HP bar from synced state only
    const b = RS?.boss;
    if (!b || b.dead) return;
    const bd = b.def || BOSSES.lich;
    const fill = document.getElementById('bossFill');
    if (fill) fill.style.width = Math.max(0, b.hp / bd.maxHP * 100) + '%';
    return;
  }
  _origTickBoss(t, dt);
};

// ════════════════════════════════════════════════════════════════════════════
//  CO-OP FIXES v3
// ════════════════════════════════════════════════════════════════════════════

// ── FIX 1: Enemy deaths on P2 screen ─────────────────────────────────────────
// Root cause: guests reduce enemy HP locally but host has the authoritative HP.
// The state sync restores hp from host before the kill message is processed,
// and the local dead-flag check only prevents VISUAL resurrection, but enemies
// killed purely by host were not being synced fast enough to visually die.
//
// Solution: guest sends 'hit_enemy' with damage on every hit so host applies it
// immediately. Guest's onEnemyKilled still marks dead locally for instant
// feedback and sends 'kill_enemy' as a safety net.

const _origOnEnemyKilled = onEnemyKilled;
onEnemyKilled = function(en, t) {
  if (MP?.started && MP.role === 'guest') {
    // Guest shouldn't reach here (HP never hits 0 locally), but if it does:
    // mark dead visually and tell host as safety net — don't run loot logic
    en.dead = true; en.corpse = true; en.deadAt = RS ? RS.lastTs / 1000 : 0;
    const idx = RS ? RS.enemies.indexOf(en) : -1;
    if (idx >= 0) try { MP.hostConn?.send({ type: 'kill_enemy', idx }); } catch (_) {}
    return;
  }
  _origOnEnemyKilled(en, t);
};

// Helper: on guest, send spell damage to host instead of reducing HP locally.
// Pass in the array of hit enemies and dmg; returns true if guest-intercepted.
function _guestSpellHitEnemies(hits, dmg, t) {
  if (!MP?.started || MP.role !== 'guest' || !RS) return false;
  hits.forEach(e => {
    const idx = RS.enemies.indexOf(e);
    if (idx >= 0) try { MP.hostConn?.send({ type: 'hit_enemy', idx, dmg }); } catch (_) {}
    // Visual float only
    RS.parts.push({ k: 'dmg', x: e.x, y: e.y - 22, txt: `-${dmg}`, col: '#c084fc', life: .8, ml: .8, vy: -30 });
  });
  return true;
}

// Patch castSpell: intercept at entry for guests — visuals run but enemy HP reductions
// are captured and routed to the host instead of applied locally.
const _origCastSpell = typeof castSpell === 'function' ? castSpell : null;
if (_origCastSpell) {
  castSpell = function(key, t) {
    if (!MP?.started || MP.role !== 'guest' || !RS) { _origCastSpell(key, t); return; }
    // Snapshot all enemy HPs before the spell runs
    const _savedHPs = RS.enemies.map(e => e.hp);
    _origCastSpell(key, t);
    // After spell: for any enemy whose HP changed, restore it and send the damage to host
    RS.enemies.forEach((e, idx) => {
      const dmgDealt = _savedHPs[idx] - e.hp;
      if (dmgDealt > 0) {
        e.hp = _savedHPs[idx]; // restore — host will apply authoritatively
        try { MP.hostConn?.send({ type: 'hit_enemy', idx, dmg: dmgDealt }); } catch (_) {}
      }
    });
  };
}

// Patch _executeAOE: intercept enemy hits for guests
const _origExecuteAOE = typeof _executeAOE === 'function' ? _executeAOE : null;
if (_origExecuteAOE) {
  _executeAOE = function(key, wx, wy) {
    if (!MP?.started || MP.role !== 'guest') { _origExecuteAOE(key, wx, wy); return; }
    if (!RS || RS.done || RS.necro.dead) return;
    const sp = SPELLS[key]; if (!sp) return;
    const t = RS.lastTs / 1000;
    const staffM = getStaffMult();
    const effCD = sp.cd * staffM.cd;
    const _lvDmgMult = 1 + (GS.necroLv - 1) * 0.08;
    const _lichMult0 = _sammAelActive ? 2 : 1;
    const dmgMult = (GS.hasPassive(9) ? 1.25 : 1) * staffM.dmg * GS.prestDmgMult() * _lvDmgMult * _lichMult0;
    const sammBonus = _sammAelActive ? _SAMM_POISON_DMG_BONUS : 0;
    const dmg = Math.round(sp.dmg * dmgMult) + sammBonus;
    const allE = RS._liveE || [...RS.enemies.filter(e => !e.dead)];
    const hits = allE.filter(e => Math.hypot(wx - e.x, wy - e.y) <= sp.rng && RS.enemies.includes(e));
    // Visuals
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; RS.parts.push({ k: 'spark', x: wx, y: wy, vx: Math.cos(a) * sp.rng * .7, vy: Math.sin(a) * sp.rng * .7, col: sp.color, life: .65, ml: .65 }); }
    RS.parts.push({ k: 'aoe', x: wx, y: wy, r: 10, maxR: sp.rng, col: sp.color, life: .55, ml: .55 });
    // Route damage to host
    _guestSpellHitEnemies(hits, dmg, t);
    if (GS.hasPassive(1)) { const heal = sp.lv * 2; RS.necro.hp = Math.min(RS.necro.maxHP, RS.necro.hp + heal); }
    RS._aoeOnArrival = null;
  };
}

// Patch attackTarget: guests skip local enemy HP reduction — host is authoritative.
// Guests still run visuals (particles, sounds) but send damage to host to apply.
const _origAttackTarget = typeof attackTarget === 'function' ? attackTarget : null;
if (_origAttackTarget) {
  attackTarget = function(tgt, dmg, t, attacker, src) {
    if (MP?.started && MP.role === 'guest' && RS) {
      const idx = RS.enemies.indexOf(tgt);
      if (idx >= 0) {
        // Visuals only — don't reduce HP locally (host is authoritative)
        // Re-use the visual portion of attackTarget by temporarily inflating HP so it won't trigger kill
        const savedHp = tgt.hp;
        tgt.hp = dmg + 1; // ensure hp won't reach 0 locally
        _origAttackTarget(tgt, dmg, t, attacker, src);
        tgt.hp = savedHp; // restore — host state will update it
        try { MP.hostConn?.send({ type: 'hit_enemy', idx, dmg }); } catch (_) {}
        return;
      }
    }
    _origAttackTarget(tgt, dmg, t, attacker, src);
  };
}

// ── FIX: Guest boss kill — mark locally dead + tell host → host ends raid ─────
const _origOnBossKilled = onBossKilled;
onBossKilled = function() {
  if (MP?.started && MP.role === 'guest') {
    const b = RS?.boss;
    if (b) { b.dead = true; }
    try { MP.hostConn?.send({ type: 'kill_boss' }); } catch (_) {}
    const bCol = (b?.def || BOSSES.lich).color || '#22ff44';
    SND.victory();
    if (b) for (let i = 0; i < 40; i++) {
      const a = rnd(0, Math.PI * 2);
      RS?.parts.push({ k: 'spark', x: b.x, y: b.y, vx: Math.cos(a) * rnd(40, 120), vy: Math.sin(a) * rnd(40, 120), col: i % 2 ? bCol : '#fcd34d', life: rnd(.4, 1), ml: 1 });
    }
    document.getElementById('bossBar').style.display = 'none';
    return; // do NOT call endRaid — wait for host's end_raid message
  }
  _origOnBossKilled();
};

// ── Host: handle kill_enemy / hit_enemy / kill_boss from guests ───────────────
const _origHostOnData = _hostOnData;
_hostOnData = function(data, fromPeerId) {
  _origHostOnData(data, fromPeerId);
  if (!MP || MP.role !== 'host' || !RS) return;
  const t = RS.lastTs / 1000;

  // Guest did damage to enemy — apply on host authoritatively
  if (data.type === 'hit_enemy') {
    const en = RS.enemies[data.idx];
    if (en && !en.dead && data.dmg > 0) {
      en.hp -= data.dmg;
      en._hurtUntil = Date.now() + 140;
      if (en.hp <= 0) onEnemyKilled(en, t);
      else {
        // Show hit number on host canvas (guests see it via state lag, acceptable)
        RS.parts.push({ k: 'dmg', x: en.x, y: en.y - 22, txt: `-${data.dmg}`, col: '#fff', life: .7, ml: .7, vy: -30 });
      }
    }
  }

  // Safety net: guest explicitly says this enemy is dead
  if (data.type === 'kill_enemy') {
    const en = RS.enemies[data.idx];
    if (en && !en.dead) onEnemyKilled(en, t);
  }

  if (data.type === 'kill_boss') {
    if (RS.boss && !RS.boss.dead) {
      if (RS.boss.fortitudeUsed) {
        RS.boss.hp = 0; RS.boss.dead = true; onBossKilled();
      } else {
        RS.boss.hp = 0; // tickBoss will detect hp=0 and trigger fortitude/death
      }
    }
  }
};

// ── FIX 2 & 3: Summons visible on all screens + Floor change ─────────────────
// Minion data is already broadcast in state/remotes. The draw function already
// handles them. Confirmed working — no additional fix needed beyond ensuring
// the host's own minions are always included in the broadcast (already done via
// hostMinions field). Guest minions in remotes[idx].minions — also confirmed.
//
// Floor change: the original check `floorNum > 1` misses floor 1 on welcome_back.
// Also, initRaid is called with floorNum=undefined in some paths. Fix by using
// RS.floorNum after initRaid completes.
const _origInitRaid = initRaid;
initRaid = function(raidKey, floorNum, opts) {
  // Clear stale MP if solo raid starts (not a co-op session)
  if (MP && !MP.started) _mpDestroy();
  // Reset retreated set on each new floor/raid
  if (MP?.role === 'host' && MP._retreated) MP._retreated.clear();
  _origInitRaid(raidKey, floorNum, opts);
  // Host broadcasts floor change to all guests for ANY floor (not just > 1)
  if (MP?.role === 'host' && MP.started && RS) {
    setTimeout(() => {
      MP._mapData = _serializeMap();
      const msg = {
        type: 'floor_change',
        raidKey: RS.raidKey,
        floorNum: RS.floorNum,
        floorTotal: RS.floorTotal,
        isFinalFloor: RS.isFinalFloor,
        mapData: MP._mapData,
      };
      MP.conns.forEach(c => { try { c.send(msg); } catch (_) {} });
    }, 150);
  }
};

// ── FIX 4 & 5 & 7: Retreat, Trophy, Loot sharing ─────────────────────────────
// Bug 4: When host retreats, guests receive 'end_raid' and call endRaid('retreat').
//   The patched endRaid on guest does try { MP.hostConn.send({type:'retreat'}) }
//   but at that point host is already destroyed. Fix: guest skips the send-back
//   when receiving an 'end_raid' from host (host already knows).
// Bug 5: Guests call endRaid → showSummary → trophy awarded only if
//   RS.isFinalFloor && RS.result === 'victory' && RS.cfg.regionId exists.
//   Guests get isFinalFloor/result synced but RS.cfg may differ. Fix: also sync
//   raidKey+cfg in end_raid message and apply before endRaid is called.
// Bug 7: Loot division already exists in showSummary but only on local MP.players.
//   Guests may have MP.players with different counts. Fix: include party count in
//   end_raid message so both host and guest divide by the same number.
const _origEndRaid = endRaid;
endRaid = function(result) {
  if (MP?.role === 'host' && MP.started && RS) {
    const partyCount = Math.max(1, MP.players.length);
    const endMsg = {
      type: 'end_raid',
      result,
      raidKey:      RS.raidKey,
      bonesGained:  RS.bonesGained,
      wGained:      RS.wGained,
      xpGained:     RS.xpGained,
      isFinalFloor: RS.isFinalFloor,
      floorNum:     RS.floorNum,
      floorTotal:   RS.floorTotal,
      partyCount,
    };
    MP.conns.forEach(c => { try { c.send(endMsg); } catch (_) {} });
  }
  // Guest retreating: notify host
  if (MP?.role === 'guest' && result === 'retreat' && !MP._hostEndedRaid) {
    try { MP.hostConn?.send({ type: 'retreat' }); } catch (_) {}
  }
  _origEndRaid(result);
  // Host cleans up after broadcast
  if (MP?.role === 'host') _mpDestroy();
};

// Update _guestOnData 'end_raid' handler to set _hostEndedRaid flag and partyCount
// We do this by patching _guestOnData after it's defined.
const _origGuestOnData = _guestOnData;
_guestOnData = function(data) {
  if (data?.type === 'end_raid' && MP?.started) {
    if (RS) {
      if (data.bonesGained !== undefined) RS.bonesGained = data.bonesGained;
      if (data.wGained)    RS.wGained    = data.wGained;
      if (data.xpGained !== undefined) RS.xpGained = data.xpGained;
      if (data.isFinalFloor !== undefined) RS.isFinalFloor = data.isFinalFloor;
      if (data.floorNum    !== undefined) RS.floorNum     = data.floorNum;
      if (data.floorTotal  !== undefined) RS.floorTotal   = data.floorTotal;
      // Sync party count so loot is divided the same way on guest
      if (data.partyCount && MP) MP._partyCount = data.partyCount;
      // Mark flag so endRaid on guest doesn't try to send retreat back to host
      if (MP) MP._hostEndedRaid = true;
      // Reset done flag — a state broadcast may have set it early, which would
      // cause endRaid()'s guard to bail before awarding loot/conquest/XP.
      RS.done = false;
      endRaid(data.result || 'retreat');
    }
    _mpDestroy();
    return; // handled here — don't pass to original
  }

  // Rise result from host — apply outcome on guest's screen
  if (data?.type === 'rise_result' && MP?.started && RS) {
    const _bd = RS.bossCorpse?.def || (data.bossKey && BOSSES[data.bossKey]) || { name: data.bossName || 'Boss', maxHP: 1 };
    if (data.outcome === 'success') {
      // Record the risen boss in guest's own save
      if (data.bossKey) {
        const alreadyOwned = GS.raisedBosses.some(r => r.bossKey === data.bossKey);
        if (!alreadyOwned) {
          GS.raisedBosses.push({ bossKey: data.bossKey, name: data.bossName || _bd.name, type: RS.bossCorpse?.type || data.bossKey, def: _bd });
          saveGame(false);
        }
      }
      _riseApplySuccess(RS.bossCorpse, _bd);
    } else if (data.outcome === 'defeat' || data.outcome === 'rise_defeat') {
      RS.bossCorpse = null;
      _riseApplyDefeat(_bd);
    } else if (data.outcome === 'fail') {
      RS.bossCorpse = null;
      if (RS.boss) {
        RS.boss.dead = false;
        RS.boss.hp = data.bossHP || Math.ceil((_bd.maxHP || 100) * 0.25);
        RS.boss.fortitudeUsed = true;
        RS.bossReady = true;
      }
      _riseApplyFail(_bd, data.failCount || 1);
    }
    return;
  }

  _origGuestOnData(data);
};

// ── FIX 6: Ghost P2 when P1 starts a new solo raid ───────────────────────────
// The initRaid patch above already calls _mpDestroy() if MP && !MP.started.
// But if P1 ends a coop session and immediately starts solo, MP.started may
// still be true. Patch openCastle/finishRaid to always clear MP.
const _origFinishRaid = finishRaid;
finishRaid = function() {
  // Destroy any stale co-op session so ghost remotes can't persist
  if (MP) _mpDestroy();
  _origFinishRaid();
};

// ── FIX 2 (complete): Ensure ALL players' minions appear on ALL screens ────────
// The state broadcast already includes hostMinions. Guest minions are in
// remotes[playerIdx].minions. On guest screen, _mpDrawRemotes draws them.
// Issue: the patched _mpDrawRemotes shadow-copies the original but the
// original _mpDrawRemotes variable reference inside drawNecro points to
// whatever _mpDrawRemotes is at CALL time (dynamic lookup) — so it's fine.
// Additional fix: ensure local minions are also sent by host in the remotes
// dict so P3/P4 can see P2's minions too.
_mpDrawRemotes = function(t) {
  if (!MP?._remoteNecros) return;
  const now = Date.now();
  Object.values(MP._remoteNecros).forEach(rn => {
    if (!rn || rn.dead) return;
    if (rn.playerIdx === MP.playerIdx) return; // never draw self
    // Don't draw remotes whose last update is older than 3 seconds (retreated/disconnected)
    if (rn._ts && now - rn._ts > 3000) return;
    _mpDrawOneRemote(rn, t);
    // Draw this ally's minions
    if (rn.minions?.length) {
      const rci = rn.rci ?? rn.playerIdx ?? 1;
      const rc  = COOP_ROBE_COLORS[Math.max(0, Math.min(rci, COOP_ROBE_COLORS.length-1))];
      const acc = rc[3];
      rn.minions.forEach(rm => {
        if (!rm) return;
        ctx.save();
        ctx.globalAlpha = 0.78;
        ctx.translate(rm.x, rm.y);
        try { drawSprite(ctx, rm.type, 0, 0, 1, 1, t, Math.sin(rm._wp || 0)); } catch (_) {}
        ctx.restore();
        if (rm.maxHP) hpBar(rm.x, rm.y - 18, 22, 3, Math.max(0, rm.hp / rm.maxHP), acc);
      });
    }
    // Draw this ally's active pet
    if (rn.activePet) {
      const rp = rn.activePet;
      const rci = rn.rci ?? rn.playerIdx ?? 1;
      const rc  = COOP_ROBE_COLORS[Math.max(0, Math.min(rci, COOP_ROBE_COLORS.length-1))];
      const acc = rc[3];
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.translate(rp.x, rp.y);
      try {
        const petSprKey = getPetSprKey ? getPetSprKey(rp.type) : rp.type;
        drawSprite(ctx, petSprKey, 0, 0, 0.9, 1, t, Math.sin(rp._wp || 0));
      } catch (_) {}
      ctx.restore();
      if (rp.maxHP) hpBar(rp.x, rp.y - 16, 20, 3, Math.max(0, rp.hp / rp.maxHP), acc);
    }
  });
};

// ── FIX 7 (complete): Loot division uses synced partyCount on guest ──────────
// showSummary divides loot by MP.players.length. On guest, MP.players may be
// incomplete. Patch showSummary to use MP._partyCount if available.
const _origShowSummary = showSummary;
showSummary = function() {
  // Inject partyCount if host sent it
  if (MP && MP._partyCount && MP._partyCount > 1) {
    MP.players = MP.players.length >= MP._partyCount
      ? MP.players
      : Array.from({ length: MP._partyCount }, (_, i) => ({ playerIdx: i }));
  }
  _origShowSummary();
};

// ════════════════════════════════════════════════════════════════════════════
//  CO-OP STABILITY PASS v4 — Reconnection, Quality Indicator, Edge Cases
// ════════════════════════════════════════════════════════════════════════════

// ── AUTO-RECONNECT: Guest attempts to rejoin on brief host disconnects ──────
// Instead of immediately destroying the session, guest gets a 12-second window
// to reconnect. Host already supports welcome_back for reconnecting guests.

const _RECONNECT_MAX_ATTEMPTS = 6;
const _RECONNECT_INTERVAL_MS  = 2000; // 2s between attempts → 12s total window
let _reconnectState = null;

function _startGuestReconnect() {
  if (!MP || MP.role !== 'host') {
    // Only guests reconnect; hosts don't need to (they own the session)
  }
  if (_reconnectState) return; // already reconnecting

  const code = MP?.code;
  const raidKey = MP?.raidKey;
  const playerIdx = MP?.playerIdx;
  const started = MP?.started;
  const peerId = MP?.peerId;

  if (!code || !started) {
    // Not in an active raid — just disconnect normally
    showToast('🐦 Host disconnected');
    _mpDestroy();
    openCastle();
    return;
  }

  // Save guest's current progress before attempting reconnect
  _saveGuestProgressSnapshot();

  _reconnectState = {
    code, raidKey, playerIdx, peerId,
    attempt: 0,
    maxAttempts: _RECONNECT_MAX_ATTEMPTS,
    timer: null,
  };

  // Show reconnection overlay
  _showReconnectOverlay();

  // Destroy old peer cleanly (the connection is already dead)
  if (MP?.peer) { try { MP.peer.destroy(); } catch(_) {} }

  // Start first attempt
  _attemptReconnect();
}

function _attemptReconnect() {
  if (!_reconnectState) return;
  _reconnectState.attempt++;

  if (_reconnectState.attempt > _reconnectState.maxAttempts) {
    // All attempts exhausted — give up
    _hideReconnectOverlay();
    _applyGuestProgressSnapshot(); // save what we had before disconnect
    showToast('🐦 Could not reconnect to host');
    _reconnectState = null;
    _mpDestroy();
    openCastle();
    return;
  }

  _updateReconnectOverlay(_reconnectState.attempt, _reconnectState.maxAttempts);

  const code = _reconnectState.code;
  const peer = new Peer(undefined, { debug: 0 });

  peer.on('open', myId => {
    const conn = peer.connect('NECRO-' + code, { reliable: true });

    conn.on('open', () => {
      // Send hello with code — host will verify and send welcome_back
      try { conn.send({ type: 'hello', code, necroName: GS.necroName || 'Ally' }); } catch(_) {}
    });

    conn.on('data', data => {
      if (data?.type === 'welcome_back' || data?.type === 'lobby') {
        // Reconnected successfully!
        _hideReconnectOverlay();

        MP = {
          role: 'guest', peer, peerId: myId, code,
          raidKey: _reconnectState.raidKey,
          playerIdx: data.playerIdx ?? _reconnectState.playerIdx,
          players: data.players || [], conns: [], hostConn: conn,
          started: true, _remoteNecros: {},
        };
        _reconnectState = null;

        if (data.type === 'welcome_back') {
          showScreen('raid');
          _initRaidFromHostData(data);
          // Restore HP from snapshot if we had one
          if (_guestProgressSnapshot && RS && RS.necro) {
            RS.necro.hp = Math.min(RS.necro.maxHP, _guestProgressSnapshot.necroHP || RS.necro.hp);
          }
          _guestProgressSnapshot = null;
          flash('✓ Reconnected to host!', 14, '#86efac');
        } else {
          // Back in lobby (host must have restarted)
          showScreen('coopLobby');
          _lobbyRender();
          showToast('✓ Reconnected — back in lobby');
        }

        // Set up normal data handler
        conn.on('data', d => _guestOnData(d));
        conn.on('close', () => {
          if (!MP?.started) { showToast('🐦 Disconnected'); closeAviary(); }
          else _startGuestReconnect();
        });
        return;
      }
      // Not a welcome — route normally once reconnected
      _guestOnData(data);
    });

    conn.on('error', () => {
      // This attempt failed — try again after delay
      try { peer.destroy(); } catch(_) {}
      _reconnectState.timer = setTimeout(_attemptReconnect, _RECONNECT_INTERVAL_MS);
    });

    // If connection doesn't open in 3 seconds, try again
    const openTimeout = setTimeout(() => {
      try { peer.destroy(); } catch(_) {}
      if (_reconnectState) {
        _reconnectState.timer = setTimeout(_attemptReconnect, _RECONNECT_INTERVAL_MS);
      }
    }, 3000);

    conn.on('open', () => clearTimeout(openTimeout));
  });

  peer.on('error', () => {
    try { peer.destroy(); } catch(_) {}
    if (_reconnectState) {
      _reconnectState.timer = setTimeout(_attemptReconnect, _RECONNECT_INTERVAL_MS);
    }
  });
}

function _cancelReconnect() {
  if (_reconnectState?.timer) clearTimeout(_reconnectState.timer);
  _hideReconnectOverlay();
  _applyGuestProgressSnapshot();
  _reconnectState = null;
  _mpDestroy();
  openCastle();
}

// Reconnect overlay UI
function _showReconnectOverlay() {
  let ov = document.getElementById('mpReconnectOverlay');
  if (ov) { ov.style.display = 'flex'; return; }
  ov = document.createElement('div');
  ov.id = 'mpReconnectOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.82);gap:16px;font-family:"Almendra","Cinzel",monospace';
  ov.innerHTML = `
    <div style="font-size:24px;animation:pulse 1.5s infinite">🐦</div>
    <div style="color:#fcd34d;font-size:14px">Connection lost — reconnecting…</div>
    <div id="mpReconnectProgress" style="color:#9ca3af;font-size:13px">Attempt 1/${_RECONNECT_MAX_ATTEMPTS}</div>
    <div style="width:180px;height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;margin-top:4px">
      <div id="mpReconnectBar" style="width:0%;height:100%;background:#818cf8;transition:width .3s"></div>
    </div>
    <button onclick="_cancelReconnect()" style="margin-top:12px;padding:8px 20px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:#f87171;border-radius:2px;font-family:'Almendra','Cinzel',serif;font-size:10px;cursor:pointer">Give Up</button>
  `;
  document.body.appendChild(ov);
}

function _updateReconnectOverlay(attempt, max) {
  const prog = document.getElementById('mpReconnectProgress');
  if (prog) prog.textContent = `Attempt ${attempt}/${max}`;
  const bar = document.getElementById('mpReconnectBar');
  if (bar) bar.style.width = Math.round(attempt / max * 100) + '%';
}

function _hideReconnectOverlay() {
  const ov = document.getElementById('mpReconnectOverlay');
  if (ov) ov.style.display = 'none';
}

// ── GUEST PROGRESS SNAPSHOT: Save state on disconnect to prevent loss ────────
let _guestProgressSnapshot = null;

function _saveGuestProgressSnapshot() {
  if (!RS || !GS) return;
  _guestProgressSnapshot = {
    necroHP:     RS.necro?.hp || GS.necroHP,
    necroMaxHP:  RS.necro?.maxHP || GS.necroMaxHP,
    bonesGained: RS.bonesGained || 0,
    xpGained:    RS.xpGained || 0,
    wGained:     RS.wGained || {},
    floorNum:    RS.floorNum || 1,
    raidKey:     RS.raidKey || '',
  };
}

function _applyGuestProgressSnapshot() {
  if (!_guestProgressSnapshot) return;
  // Apply partial loot — guest keeps what was earned up to disconnect
  const snap = _guestProgressSnapshot;
  const partyDiv = Math.max(1, MP?._partyCount || 2);
  const bonesShare = Math.floor(snap.bonesGained / partyDiv);
  const xpShare    = Math.floor(snap.xpGained / partyDiv);
  if (bonesShare > 0) GS.bones = (GS.bones || 0) + bonesShare;
  if (xpShare > 0)    GS.necroXP = (GS.necroXP || 0) + xpShare;
  GS.necroHP = Math.max(1, snap.necroHP);
  saveGame(false);
  if (bonesShare > 0 || xpShare > 0) {
    showToast(`Saved progress: +${bonesShare} bones, +${xpShare} XP`);
  }
  _guestProgressSnapshot = null;
}

// ── Patch guest disconnect handler to use auto-reconnect ────────────────────
// The original conn.on('close') at line ~28989-28991 fires _guestOnData's
// internal reference. We re-patch _guestOnData's close handler here.
// Since we can't retroactively change event listeners on the original conn,
// we patch the aviaryJoin function to use the new reconnect logic.
const _origAviaryJoin = aviaryJoin;
aviaryJoin = function() {
  const code = (document.getElementById('aviaryCode')?.value || '').toUpperCase().trim();
  if (code.length !== 6) { showToast('Enter the 6-letter code'); return; }
  _mpSetStatus('🐦 Seeking the raven…');

  const peer = new Peer(undefined, { debug: 0 });
  peer.on('open', myId => {
    MP = {
      role: 'guest', peer, peerId: myId, code,
      raidKey: 'cemetery', playerIdx: 1,
      players: [], conns: [], hostConn: null,
      started: false, _remoteNecros: {},
    };

    const conn = peer.connect('NECRO-' + code, { reliable: true });
    MP.hostConn = conn;

    conn.on('open', () => {
      _mpSetStatus('✓ Connected — authenticating…');
      try { conn.send({ type: 'hello', code, necroName: GS.necroName || 'Ally' }); } catch(_) {}
    });
    conn.on('data', data => _guestOnData(data));
    conn.on('close', () => {
      if (!MP?.started) { showToast('🐦 Disconnected'); closeAviary(); }
      else _startGuestReconnect(); // ← auto-reconnect instead of immediate destroy
    });
    conn.on('error', e => { _mpSetStatus('❌ Could not connect. Check the code.'); console.error(e); });
  });
  peer.on('error', e => { _mpSetStatus('❌ Connection failed. Check code.'); console.error(e); });
};

// ── CONNECTION QUALITY INDICATOR ─────────────────────────────────────────────
// Tracks round-trip latency via periodic ping/pong messages.
// Displays signal strength bars in the raid HUD.

let _mpPingState = { lastPing: 0, latency: -1, samples: [], _interval: null };

function _mpStartPingLoop() {
  if (_mpPingState._interval) clearInterval(_mpPingState._interval);
  _mpPingState = { lastPing: 0, latency: -1, samples: [], _interval: null };

  _mpPingState._interval = setInterval(() => {
    if (!MP?.started) { _mpStopPingLoop(); return; }
    _mpPingState.lastPing = Date.now();
    const pingMsg = { type: '_ping', t: _mpPingState.lastPing };
    if (MP.role === 'guest' && MP.hostConn) {
      try { MP.hostConn.send(pingMsg); } catch(_) {}
    } else if (MP.role === 'host') {
      MP.conns.forEach(c => { try { c.send(pingMsg); } catch(_) {} });
    }
  }, 2000); // ping every 2 seconds
}

function _mpStopPingLoop() {
  if (_mpPingState._interval) clearInterval(_mpPingState._interval);
  _mpPingState._interval = null;
}

function _mpHandlePong(sendTime) {
  const rtt = Date.now() - sendTime;
  _mpPingState.samples.push(rtt);
  if (_mpPingState.samples.length > 10) _mpPingState.samples.shift();
  // Rolling average
  _mpPingState.latency = Math.round(
    _mpPingState.samples.reduce((a, b) => a + b, 0) / _mpPingState.samples.length
  );
}

// Inject ping/pong handling into host and guest data handlers
const _origHostOnData2 = _hostOnData;
_hostOnData = function(data, fromPeerId) {
  if (data?.type === '_ping') {
    // Respond with pong
    const conn = MP?.conns?.find(c => c.peer === fromPeerId);
    if (conn) try { conn.send({ type: '_pong', t: data.t }); } catch(_) {}
    return;
  }
  if (data?.type === '_pong') {
    _mpHandlePong(data.t);
    return;
  }
  _origHostOnData2(data, fromPeerId);
};

const _origGuestOnData2 = _guestOnData;
_guestOnData = function(data) {
  if (data?.type === '_ping') {
    if (MP?.hostConn) try { MP.hostConn.send({ type: '_pong', t: data.t }); } catch(_) {}
    return;
  }
  if (data?.type === '_pong') {
    _mpHandlePong(data.t);
    return;
  }
  _origGuestOnData2(data);
};

// Start ping loop when raid starts (patch _checkAllReady for host, aviaryJoin data handler for guest)
const _origCheckAllReady = _checkAllReady;
_checkAllReady = function() {
  _origCheckAllReady();
  if (MP?.started) _mpStartPingLoop();
};

// Guest: start ping when receiving 'start' message — already handled by _guestOnData
// We patch the start handler via the loop that calls _guestSendInput
const _origLoop2 = loop;
loop = function(ts) {
  _origLoop2(ts);
  // Start ping loop on first tick after raid starts (both host and guest)
  if (MP?.started && !_mpPingState._interval) _mpStartPingLoop();
};

// Draw connection quality indicator in raid HUD
function _drawConnectionQuality(ctx, x, y) {
  if (!MP?.started) return;
  const lat = _mpPingState.latency;
  const bars = lat < 0 ? 0 : lat < 80 ? 4 : lat < 150 ? 3 : lat < 300 ? 2 : 1;
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#86efac', '#22c55e'];
  const barColor = colors[bars] || '#ef4444';
  const labelColor = lat < 0 ? '#4b5563' : barColor;

  ctx.save();
  // Draw 4 bars of increasing height
  for (let i = 0; i < 4; i++) {
    const bh = 4 + i * 3; // heights: 4, 7, 10, 13
    const bx = x + i * 5;
    const by = y + 13 - bh;
    ctx.fillStyle = i < bars ? barColor : 'rgba(255,255,255,.12)';
    ctx.fillRect(bx, by, 3, bh);
  }
  // Latency text
  ctx.font = '9px monospace';
  ctx.fillStyle = labelColor;
  ctx.textAlign = 'left';
  ctx.fillText(lat < 0 ? '...' : lat + 'ms', x + 24, y + 12);
  ctx.restore();
}

// Inject connection quality drawing into the raid HUD
// We hook into the existing loop to draw it after the main HUD renders
const _origLoop3 = loop;
loop = function(ts) {
  _origLoop3(ts);
  if (!MP?.started || !RS) return;
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const _ctx = canvas.getContext('2d');
  if (!_ctx) return;
  // Draw in top-right area, below boss bar
  _drawConnectionQuality(_ctx, canvas.width - 70, 8);
};

// ── LOOT DIVISION ROUNDING FIX ──────────────────────────────────────────────
// Ensure consistent Math.floor for bone/XP division across host and guest.
// The showSummary function already divides, but we patch to ensure floor is used.
const _origShowSummary2 = showSummary;
showSummary = function() {
  // Normalize loot values with Math.floor before summary runs
  if (RS && MP?.started) {
    const partyCount = Math.max(1, MP._partyCount || MP.players?.length || 1);
    if (partyCount > 1) {
      RS.bonesGained = Math.floor((RS.bonesGained || 0) / partyCount) * partyCount;
      RS.xpGained    = Math.floor((RS.xpGained || 0) / partyCount) * partyCount;
    }
  }
  _origShowSummary2();
};

// ── HOST DISCONNECT MID-BOSS: Enhanced handling ─────────────────────────────
// When host disconnects during a boss fight, guest saves the boss kill progress
// and floor state so the player doesn't lose everything.
// (Already handled by _saveGuestProgressSnapshot + auto-reconnect above.)
// Additional: if reconnect fails and boss was dead, credit the victory.
const _origApplyGuestProgress = _applyGuestProgressSnapshot;
_applyGuestProgressSnapshot = function() {
  if (!_guestProgressSnapshot) return;
  const snap = _guestProgressSnapshot;

  // Check if boss was dead when we disconnected — if so, count it as a win
  if (RS?.boss?.dead && RS?.isFinalFloor && RS?.raidKey) {
    const cfg = RAID_CONFIGS[RS.raidKey];
    if (cfg?.regionId) {
      const diff = RS.raidKey.replace(cfg.regionId + '_', '');
      if (!GS.conquered[cfg.regionId]) GS.conquered[cfg.regionId] = {};
      if (!GS.conquered[cfg.regionId][diff]) {
        GS.conquered[cfg.regionId][diff] = true;
        showToast('🏆 Victory preserved — raid conquered!');
      }
    }
  }

  _origApplyGuestProgress();
};

// ── FLOOR TRANSITION DESYNC GUARD ───────────────────────────────────────────
// When guest receives floor_change, validate the floor number is sequential.
// If it's not, request a full resync from host.
const _origGuestOnData3 = _guestOnData;
_guestOnData = function(data) {
  if (data?.type === 'floor_change' && MP?.started && RS) {
    const expectedFloor = (RS.floorNum || 1) + 1;
    const receivedFloor = data.floorNum || 1;
    // If floor jumped more than 1 ahead, it might be a desync
    if (receivedFloor > expectedFloor + 1) {
      console.warn('[Co-op] Floor desync detected: expected ~' + expectedFloor + ' got ' + receivedFloor);
      // Request full state resync from host
      if (MP.hostConn) {
        try { MP.hostConn.send({ type: 'request_resync' }); } catch(_) {}
      }
    }
  }
  _origGuestOnData3(data);
};

// Host: handle resync request from guest
const _origHostOnData3 = _hostOnData;
_hostOnData = function(data, fromPeerId) {
  if (data?.type === 'request_resync' && MP?.role === 'host' && MP.started && RS) {
    const conn = MP.conns.find(c => c.peer === fromPeerId);
    const player = MP.players.find(p => p.id === fromPeerId);
    if (conn && player) {
      MP._mapData = _serializeMap();
      try {
        conn.send({
          type: 'welcome_back',
          raidKey: MP.raidKey,
          playerIdx: player.playerIdx,
          mapData: MP._mapData,
          floorNum: RS.floorNum,
          floorTotal: RS.floorTotal,
          isFinalFloor: RS.isFinalFloor,
        });
      } catch(_) {}
    }
    return;
  }
  _origHostOnData3(data, fromPeerId);
};

// ── HOST: Detect stale guest connections and clean up ────────────────────────
// If a guest hasn't sent input for 10 seconds, consider them disconnected.
// This prevents ghost players from staying in the party.
const _GUEST_STALE_TIMEOUT = 10000;
const _origHostBroadcastState = _hostBroadcastState;
_hostBroadcastState = function() {
  if (MP?.role === 'host' && MP.started && MP._remoteNecros) {
    const now = Date.now();
    Object.keys(MP._remoteNecros).forEach(idx => {
      const rn = MP._remoteNecros[idx];
      if (rn && rn._ts && now - rn._ts > _GUEST_STALE_TIMEOUT) {
        // Guest went silent — mark as stale but don't remove yet
        // (they might be reconnecting via the auto-reconnect system)
        if (!rn._stale) {
          rn._stale = true;
          rn._staleAt = now;
        }
        // After 30 seconds of silence, remove them
        if (rn._stale && now - rn._staleAt > 30000) {
          delete MP._remoteNecros[idx];
        }
      }
    });
  }
  _origHostBroadcastState();
};

// ── Enemy AI: enemies only target RS.necro / RS.minions / RS.activePet
//    Remote necros are visual-only and are NOT in any of those arrays → ✓


// ════════════════════════════════════════════════════════════════════════════
//  PVP ARENA — 1v1 Necromancer Army Duels
// ════════════════════════════════════════════════════════════════════════════

// ── PvP State ────────────────────────────────────────────────────────────────
let PVP = null; // active PvP session state

// PvP rating titles
const PVP_TITLES = [
  {rating:0,    title:'Gravedigger',    color:'#6b7280'},
  {rating:800,  title:'Bone Warden',    color:'#9ca3af'},
  {rating:1000, title:'Crypt Knight',   color:'#60a5fa'},
  {rating:1200, title:'Death Marshal',  color:'#a855f7'},
  {rating:1400, title:'Lich Commander', color:'#f59e0b'},
  {rating:1600, title:'Overlord',       color:'#ef4444'},
  {rating:1800, title:'Grand Lich',     color:'#ec4899'},
  {rating:2000, title:'Samma\'el\'s Champion', color:'#fcd34d'},
];

function pvpGetTitle(rating){
  let t=PVP_TITLES[0];
  for(const tt of PVP_TITLES) if(rating>=tt.rating) t=tt;
  return t;
}

// PvP Cosmetic Shop
const PVP_SHOP = [
  {id:'robe_blood',   type:'robe', label:'Bloodstained Robe',  cost:200, color:PALETTE.dmgRedDeep, desc:'Crimson robes stained by arena victories'},
  {id:'robe_shadow',  type:'robe', label:'Shadow Weave Robe',  cost:350, color:'#1e1b4b', desc:'Woven from the darkness between worlds'},
  {id:'hat_crown',    type:'hat',  label:'Arena Champion Crown',cost:500, color:'#fcd34d', desc:'A crown forged from conquered bones'},
  {id:'staff_arena',  type:'staff',label:'Duelist\'s Staff',    cost:300, color:'#ef4444', desc:'Crackles with competitive fury'},
  {id:'aura_fire',    type:'aura', label:'Infernal Aura',       cost:400, color:'#f97316', desc:'Wreathed in arena flames'},
  {id:'banner_skull', type:'banner',label:'Skull Banner',       cost:150, color:'#d1d5db', desc:'Display your arena prowess'},
  {id:'trail_blood',  type:'trail',label:'Blood Trail',         cost:250, color:'#dc2626', desc:'Leave crimson footsteps in battle'},
  {id:'emote_taunt',  type:'emote',label:'Taunt Emote',         cost:100, color:'#fbbf24', desc:'Mock your fallen enemies'},
];

// ── PvP Queue Screen ─────────────────────────────────────────────────────────
function openPvPQueue() {
  showScreen('pvpQueue');
  const t = pvpGetTitle(GS.pvpRating||1000);
  const rEl = document.getElementById('pvpRatingDisplay');
  if(rEl) rEl.innerHTML = `<span style="color:${t.color}">${t.title}</span> · Rating: <b>${GS.pvpRating||1000}</b><br>` +
    `<span style="font-size:12px;color:#6b7280">W: ${GS.pvpWins||0} / L: ${GS.pvpLosses||0} · Glory: ${GS.pvpCurrency||0} ⚜</span>`;
  // Hide sub-panels
  const sp = document.getElementById('pvpStatsPanel'); if(sp) sp.style.display='none';
  const sh = document.getElementById('pvpShopPanel'); if(sh) sh.style.display='none';
}

function pvpQueueReturn() {
  if(PVP) _pvpDestroy();
  showScreen('castle');
}

// ── PvP Stats Panel ──────────────────────────────────────────────────────────
function pvpOpenStats() {
  const p = document.getElementById('pvpStatsPanel');
  if(!p) return;
  if(p.style.display !== 'none') { p.style.display='none'; return; }
  const t = pvpGetTitle(GS.pvpRating||1000);
  const total = (GS.pvpWins||0)+(GS.pvpLosses||0);
  const winRate = total ? Math.round((GS.pvpWins||0)/total*100) : 0;
  let html = `<div style="text-align:center;margin-bottom:8px;font-size:13px;color:${t.color}">${t.title}</div>`;
  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">`;
  html += `<div>Rating: <b>${GS.pvpRating||1000}</b></div>`;
  html += `<div>Win Rate: <b>${winRate}%</b></div>`;
  html += `<div style="color:#86efac">Wins: <b>${GS.pvpWins||0}</b></div>`;
  html += `<div style="color:#fca5a5">Losses: <b>${GS.pvpLosses||0}</b></div>`;
  html += `<div>Glory: <b>${GS.pvpCurrency||0} ⚜</b></div>`;
  html += `<div>Duels: <b>${total}</b></div>`;
  html += `</div>`;
  // Title progression
  html += `<div style="margin-top:10px;border-top:1px solid rgba(239,68,68,.15);padding-top:8px;font-size:12px;color:#6b7280">`;
  html += `<div style="margin-bottom:4px">Title Progression:</div>`;
  PVP_TITLES.forEach(tt => {
    const active = (GS.pvpRating||1000) >= tt.rating;
    html += `<div style="color:${active?tt.color:'#374151'};${active?'font-weight:bold':''}"> ${active?'★':'☆'} ${tt.rating}+ — ${tt.title}</div>`;
  });
  html += `</div>`;
  p.innerHTML = html;
  p.style.display = 'block';
}

// ── PvP Glory Shop ───────────────────────────────────────────────────────────
function pvpOpenShop() {
  const p = document.getElementById('pvpShopPanel');
  if(!p) return;
  if(p.style.display !== 'none') { p.style.display='none'; return; }
  let html = `<div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#fcd34d;text-align:center;margin-bottom:10px">🏪 Glory Shop</div>`;
  html += `<div style="text-align:center;font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;margin-bottom:12px">Glory: ${GS.pvpCurrency||0} ⚜</div>`;
  PVP_SHOP.forEach(item => {
    const owned = GS.pvpCosmetics?.[item.id];
    const canBuy = !owned && (GS.pvpCurrency||0) >= item.cost;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:6px;background:rgba(0,0,0,.3);border:1px solid ${owned?'rgba(34,197,94,.3)':canBuy?'rgba(239,68,68,.3)':'rgba(107,114,128,.2)'};border-radius:8px">`;
    html += `<div style="width:32px;height:32px;border-radius:6px;background:${item.color}22;border:1px solid ${item.color}55;display:flex;align-items:center;justify-content:center;font-size:16px">${item.type==='robe'?'👘':item.type==='hat'?'👑':item.type==='staff'?'🪄':item.type==='aura'?'✨':item.type==='banner'?'🏴':item.type==='trail'?'💫':'💬'}</div>`;
    html += `<div style="flex:1"><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${item.color}">${item.label}</div>`;
    html += `<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">${item.desc}</div></div>`;
    if(owned) {
      html += `<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">Owned</div>`;
    } else {
      html += `<button onclick="pvpBuyItem('${item.id}')" style="padding:5px 10px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:${canBuy?'rgba(239,68,68,.2)':'rgba(107,114,128,.1)'};border:1px solid ${canBuy?'rgba(239,68,68,.4)':'rgba(107,114,128,.2)'};border-radius:2px;color:${canBuy?'#fca5a5':'#4b5563'};cursor:${canBuy?'pointer':'default'};-webkit-appearance:none">${item.cost} ⚜</button>`;
    }
    html += `</div>`;
  });
  p.innerHTML = html;
  p.style.display = 'block';
}

function pvpBuyItem(id) {
  const item = PVP_SHOP.find(i=>i.id===id);
  if(!item || GS.pvpCosmetics?.[id] || (GS.pvpCurrency||0) < item.cost) return;
  GS.pvpCurrency -= item.cost;
  if(!GS.pvpCosmetics) GS.pvpCosmetics = {};
  GS.pvpCosmetics[id] = true;
  // Apply cosmetic to GS.cosmetics if it's a wearable
  if(item.type==='robe'||item.type==='hat'||item.type==='staff') {
    if(!GS.cosmetics) GS.cosmetics = {};
    GS.cosmetics[item.type] = id;
  }
  saveGame(false);
  showToast(`⚜ Purchased ${item.label}!`);
  pvpOpenShop(); // refresh
  // Also refresh the header
  openPvPQueue();
  const sh = document.getElementById('pvpShopPanel');
  if(sh) sh.style.display = 'block';
}

// ── Create / Join PvP Duel ───────────────────────────────────────────────────
function pvpCreateDuel() {
  const code = String(Math.floor(1000+Math.random()*9000));
  PVP = {
    role: 'host',
    code,
    peer: null,
    conn: null,
    started: false,
    round: 0,
    totalRounds: 3,
    myScore: 0,
    opScore: 0,
    normalize: !!document.getElementById('pvpNormalize')?.checked,
    opponentData: null,
    myReady: false,
    opReady: false,
    roundTimer: 0,
    roundDuration: 180, // 3 minutes per round in seconds
  };
  try {
    PVP.peer = new Peer('PVP-' + code, { debug: 0 });
  } catch(e) {
    showToast('⚠ PeerJS failed: ' + e.message);
    PVP = null;
    return;
  }
  PVP.peer.on('open', () => {
    showScreen('pvpLobby');
    document.getElementById('pvpCodeDisplay').textContent = code;
    _pvpRenderLobby();
    _pvpSetStatus('Waiting for challenger...');
  });
  PVP.peer.on('connection', conn => {
    if(PVP.conn) { conn.close(); return; } // only 1v1
    PVP.conn = conn;
    conn.on('open', () => {
      conn.send({ type:'pvp_welcome', hostName: GS.necroName||'Host', hostLv: GS.necroLv, normalize: PVP.normalize });
      _pvpSetStatus('Challenger connected!');
      _pvpRenderLobby();
    });
    conn.on('data', d => _pvpHostOnData(d));
    conn.on('close', () => {
      if(PVP && !PVP.started) {
        PVP.conn = null;
        PVP.opponentData = null;
        _pvpSetStatus('Challenger disconnected.');
        _pvpRenderLobby();
      }
    });
  });
  PVP.peer.on('error', e => {
    _pvpSetStatus('Connection error: ' + e.type);
  });
}

function pvpJoinPrompt() {
  const code = prompt('Enter duel code:');
  if(!code || !/^\d{4}$/.test(code.trim())) return;
  pvpJoinDuel(code.trim());
}

function pvpJoinDuel(code) {
  PVP = {
    role: 'guest',
    code,
    peer: null,
    hostConn: null,
    started: false,
    round: 0,
    totalRounds: 3,
    myScore: 0,
    opScore: 0,
    normalize: false,
    opponentData: null,
    myReady: false,
    opReady: false,
    roundTimer: 0,
    roundDuration: 180,
  };
  try {
    PVP.peer = new Peer(null, { debug: 0 });
  } catch(e) {
    showToast('⚠ PeerJS failed: ' + e.message);
    PVP = null;
    return;
  }
  PVP.peer.on('open', () => {
    const conn = PVP.peer.connect('PVP-' + code, { reliable: true });
    PVP.hostConn = conn;
    conn.on('open', () => {
      conn.send({ type:'pvp_join', name: GS.necroName||'Challenger', lv: GS.necroLv });
      showScreen('pvpLobby');
      document.getElementById('pvpCodeDisplay').textContent = code;
      _pvpSetStatus('Connected! Waiting for host...');
      _pvpRenderLobby();
    });
    conn.on('data', d => _pvpGuestOnData(d));
    conn.on('close', () => {
      if(PVP && !PVP.started) {
        _pvpSetStatus('Host disconnected.');
        setTimeout(() => { if(PVP && !PVP.started) pvpLobbyReturn(); }, 3000);
      }
    });
  });
  PVP.peer.on('error', e => {
    _pvpSetStatus('Connection error: ' + e.type);
    showToast('⚠ Could not connect — check the code');
  });
}

// ── PvP Data Handlers ────────────────────────────────────────────────────────
function _pvpHostOnData(d) {
  if(!PVP || PVP.role !== 'host') return;
  if(d.type === 'pvp_join') {
    PVP.opponentData = { name: d.name, lv: d.lv };
    _pvpRenderLobby();
    _pvpSetStatus(d.name + ' has entered the arena!');
  }
  if(d.type === 'pvp_ready') {
    PVP.opReady = true;
    _pvpRenderLobby();
    _pvpCheckBothReady();
  }
  if(d.type === 'pvp_state') {
    // Guest sends their army position+HP each tick during combat
    if(PVP._opArmy) {
      d.army.forEach((u,i) => {
        if(PVP._opArmy[i]) {
          PVP._opArmy[i].x = u.x; PVP._opArmy[i].y = u.y;
          PVP._opArmy[i].hp = u.hp; PVP._opArmy[i].tx = u.tx; PVP._opArmy[i].ty = u.ty;
        }
      });
    }
    if(PVP._opNecro && d.necro) {
      PVP._opNecro.x = d.necro.x; PVP._opNecro.y = d.necro.y;
      PVP._opNecro.hp = d.necro.hp;
    }
  }
  if(d.type === 'pvp_round_result_ack') {
    // Guest acknowledged round result
  }
}

function _pvpGuestOnData(d) {
  if(!PVP || PVP.role !== 'guest') return;
  if(d.type === 'pvp_welcome') {
    PVP.opponentData = { name: d.hostName, lv: d.hostLv };
    PVP.normalize = d.normalize;
    _pvpRenderLobby();
  }
  if(d.type === 'pvp_host_ready') {
    PVP.opReady = true;
    _pvpRenderLobby();
    _pvpCheckBothReady();
  }
  if(d.type === 'pvp_start_round') {
    PVP.round = d.round;
    PVP.arenaW = d.arenaW;
    PVP.arenaH = d.arenaH;
    PVP.obstacles = d.obstacles;
    _pvpStartRound();
  }
  if(d.type === 'pvp_state') {
    if(PVP._opArmy) {
      d.army.forEach((u,i) => {
        if(PVP._opArmy[i]) {
          PVP._opArmy[i].x = u.x; PVP._opArmy[i].y = u.y;
          PVP._opArmy[i].hp = u.hp; PVP._opArmy[i].tx = u.tx; PVP._opArmy[i].ty = u.ty;
        }
      });
    }
    if(PVP._opNecro && d.necro) {
      PVP._opNecro.x = d.necro.x; PVP._opNecro.y = d.necro.y;
      PVP._opNecro.hp = d.necro.hp;
    }
  }
  if(d.type === 'pvp_round_end') {
    _pvpRoundEnd(d.winner, d.round);
    try { (PVP.hostConn||PVP.conn)?.send({type:'pvp_round_result_ack'}); } catch(_) {}
  }
  if(d.type === 'pvp_match_end') {
    _pvpMatchEnd(d.winner, d.myScore, d.opScore);
  }
}

// ── PvP Lobby Rendering ──────────────────────────────────────────────────────
function _pvpSetStatus(msg) {
  const el = document.getElementById('pvpLobbyStatus');
  if(el) el.textContent = msg;
}

function _pvpRenderLobby() {
  const container = document.getElementById('pvpLobbyPlayers');
  if(!container) return;
  const myName = GS.necroName || 'You';
  const myLv = GS.necroLv;
  let html = '';
  // Player 1 (me)
  html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px">`;
  html += `<div style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;font-size:18px">⚔</div>`;
  html += `<div style="flex:1"><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#fca5a5">${myName} <span style="font-size:9px;color:#6b7280">Lv.${myLv}</span></div>`;
  html += `<div style="font-size:12px;color:#6b7280">${PVP?.myReady?'<span style="color:#86efac">✓ READY</span>':'Waiting...'}</div></div></div>`;
  // Player 2 (opponent)
  if(PVP?.opponentData) {
    const op = PVP.opponentData;
    html += `<div style="text-align:center;font-family:'Almendra','Cinzel',serif;font-size:11px;color:#ef4444;padding:4px">⚔ VS ⚔</div>`;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.25);border-radius:8px">`;
    html += `<div style="width:36px;height:36px;border-radius:50%;background:rgba(168,85,247,.2);display:flex;align-items:center;justify-content:center;font-size:18px">💀</div>`;
    html += `<div style="flex:1"><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#d8b4fe">${op.name} <span style="font-size:9px;color:#6b7280">Lv.${op.lv}</span></div>`;
    html += `<div style="font-size:12px;color:#6b7280">${PVP?.opReady?'<span style="color:#86efac">✓ READY</span>':'Waiting...'}</div></div></div>`;
  } else {
    html += `<div style="display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(107,114,128,.05);border:1px dashed rgba(107,114,128,.2);border-radius:2px;color:#4b5563;font-family:'Almendra','Cinzel',serif;font-size:10px">Waiting for challenger...</div>`;
  }
  // Match info
  const infoEl = document.getElementById('pvpLobbyInfo');
  if(infoEl) {
    infoEl.innerHTML = `Best of ${PVP?.totalRounds||3} · ${PVP?.normalize?'Normalized':'Level-scaled'} · 3 min rounds`;
  }
  container.innerHTML = html;
}

// ── PvP Ready & Start ────────────────────────────────────────────────────────
function pvpReady() {
  if(!PVP || !PVP.opponentData) { showToast('Waiting for an opponent...'); return; }
  PVP.myReady = true;
  _pvpRenderLobby();
  if(PVP.role === 'host') {
    try { PVP.conn?.send({type:'pvp_host_ready'}); } catch(_) {}
  } else {
    try { PVP.hostConn?.send({type:'pvp_ready'}); } catch(_) {}
  }
  _pvpCheckBothReady();
}

function _pvpCheckBothReady() {
  if(!PVP?.myReady || !PVP?.opReady) return;
  _pvpSetStatus('Starting duel...');
  if(PVP.role === 'host') {
    setTimeout(() => _pvpHostStartRound(), 1500);
  }
}

function pvpLobbyReturn() {
  _pvpDestroy();
  showScreen('castle');
}

// ── PvP Arena Generation ─────────────────────────────────────────────────────
function _pvpGenArena() {
  // Symmetrical open arena with scattered obstacles
  const W = 800, H = 600;
  const obstacles = [];
  // Central divider pillars
  const pillarCount = 3;
  for(let i = 0; i < pillarCount; i++) {
    const py = H * (0.25 + i * 0.25);
    obstacles.push({x: W/2 - 20, y: py - 15, w: 40, h: 30, type:'pillar'});
  }
  // Symmetrical cover rocks
  const rockPositions = [
    {x: 150, y: 150}, {x: 150, y: 450},
    {x: 650, y: 150}, {x: 650, y: 450},
    {x: 300, y: 300}, {x: 500, y: 300},
  ];
  rockPositions.forEach(p => {
    obstacles.push({x: p.x - 18, y: p.y - 14, w: 36, h: 28, type:'rock'});
  });
  return {W, H, obstacles};
}

// ── PvP Round Start ──────────────────────────────────────────────────────────
function _pvpHostStartRound() {
  if(!PVP || PVP.role !== 'host') return;
  PVP.round++;
  PVP.myReady = false;
  PVP.opReady = false;
  const arena = _pvpGenArena();
  PVP.arenaW = arena.W;
  PVP.arenaH = arena.H;
  PVP.obstacles = arena.obstacles;
  // Tell guest
  try {
    PVP.conn?.send({type:'pvp_start_round', round: PVP.round, arenaW: arena.W, arenaH: arena.H, obstacles: arena.obstacles});
  } catch(_) {}
  _pvpStartRound();
}

function _pvpStartRound() {
  if(!PVP) return;
  // Switch to raid canvas for the arena
  showScreen('raid');
  canvas = document.getElementById('gameCanvas');
  const {W,H} = gameWH(0), DPR = window.devicePixelRatio||1;
  canvas.width = W*DPR; canvas.height = H*DPR;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx = canvas.getContext('2d'); ctx.scale(DPR,DPR);

  // Build my army from raid party
  const normalize = PVP.normalize;
  const lScale = normalize ? 1 : (1 + Math.max(0, GS.necroLv-1) * 0.08);
  const myArmy = GS.raiders().map((s, i) => {
    const md = MINIONS[s.type] || {};
    const mhp = normalize ? (md.maxHP||20) : Math.round((md.maxHP||20) * lScale);
    const isLeft = PVP.role === 'host';
    const baseX = isLeft ? 80 : (PVP.arenaW - 80);
    const cols = 3, spacing = 30;
    const col2 = i % cols, row2 = Math.floor(i/cols);
    const mx = baseX + (isLeft ? 1 : -1) * col2 * spacing;
    const my = PVP.arenaH/2 + (row2 - 2) * spacing;
    return {
      type: s.type, x: mx, y: my, tx: mx, ty: my,
      hp: mhp, maxHP: mhp,
      dmg: Math.round((md.dmg||5) * lScale),
      spd: md.spd||1.5, rng: md.rng||30,
      dead: false, lat: 0, _aiMode: 'aggressive',
      _wp: Math.random()*6, _atkCd: 0,
    };
  });

  // Opponent army placeholder — gets synced from peer
  const opArmy = [];
  if(PVP.opponentData) {
    const opLv = normalize ? 1 : PVP.opponentData.lv;
    const opScale = normalize ? 1 : (1 + Math.max(0, opLv-1) * 0.08);
    // Create opponent minion placeholders (will be updated by state sync)
    const cap = armyCap(opLv);
    for(let i = 0; i < Math.min(cap, 20); i++) {
      const isRight = PVP.role === 'host';
      const baseX = isRight ? (PVP.arenaW - 80) : 80;
      const mx = baseX + (isRight ? -1 : 1) * (i%3) * 30;
      const my = PVP.arenaH/2 + (Math.floor(i/3) - 2) * 30;
      opArmy.push({
        type:'skeleton', x: mx, y: my, tx: mx, ty: my,
        hp: 20, maxHP: 20, dmg: 5, spd: 1.5, rng: 30,
        dead: false, lat: 0, _wp: Math.random()*6, _atkCd: 0,
      });
    }
  }

  // Necro positions
  const isLeft = PVP.role === 'host';
  const myNecro = {
    x: isLeft ? 60 : PVP.arenaW-60,
    y: PVP.arenaH/2,
    hp: normalize ? 100 : GS.necroMaxHP,
    maxHP: normalize ? 100 : GS.necroMaxHP,
    dead: false
  };
  const opNecro = {
    x: isLeft ? PVP.arenaW-60 : 60,
    y: PVP.arenaH/2,
    hp: 100, maxHP: 100, dead: false,
    name: PVP.opponentData?.name || 'Opponent'
  };

  PVP._myArmy = myArmy;
  PVP._opArmy = opArmy;
  PVP._myNecro = myNecro;
  PVP._opNecro = opNecro;
  PVP._roundStart = Date.now();
  PVP._tick = 0;
  PVP.started = true;

  // Hide HUD elements not needed for PvP
  const mmCluster = document.getElementById('minimapCluster'); if(mmCluster) mmCluster.style.display='none';
  const bossBar = document.getElementById('bossBar'); if(bossBar) bossBar.style.display='none';
  const spellArea = document.getElementById('spellArea'); if(spellArea) spellArea.style.display='none';

  // Start PvP render loop
  _pvpLoop();
}

// ── PvP Game Loop ────────────────────────────────────────────────────────────
function _pvpLoop() {
  if(!PVP?.started) return;
  const W = PVP.arenaW, H = PVP.arenaH;
  const {W: cW, H: cH} = gameWH(0);
  const scaleX = cW / W, scaleY = cH / H;
  const scale = Math.min(scaleX, scaleY);

  ctx.clearRect(0, 0, cW, cH);

  // Draw arena background
  ctx.save();
  ctx.translate((cW - W*scale)/2, (cH - H*scale)/2);
  ctx.scale(scale, scale);

  // Arena floor
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
  // Grid lines
  ctx.strokeStyle = 'rgba(239,68,68,.06)';
  ctx.lineWidth = 1;
  for(let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  // Arena border
  ctx.strokeStyle = 'rgba(239,68,68,.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W-4, H-4);
  // Center line
  ctx.setLineDash([8,6]);
  ctx.strokeStyle = 'rgba(239,68,68,.15)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.setLineDash([]);

  // Obstacles
  PVP.obstacles.forEach(ob => {
    if(ob.type === 'pillar') {
      ctx.fillStyle = '#374151';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
    } else {
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(ob.x+ob.w/2, ob.y+ob.h/2, ob.w/2, ob.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  const t = Date.now()/1000;

  // Draw my army (red team)
  PVP._myArmy.forEach(u => {
    if(u.dead) return;
    ctx.save();
    ctx.translate(u.x, u.y);
    try { drawSprite(ctx, u.type, 0, 0, 0.8, 1, t, Math.sin(u._wp||0)); } catch(_) {
      ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // HP bar
    const pct = Math.max(0, u.hp / u.maxHP);
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(u.x-12, u.y-18, 24, 3);
    ctx.fillStyle = pct > .5 ? '#22c55e' : pct > .25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(u.x-12, u.y-18, 24*pct, 3);
  });

  // Draw opponent army (purple team)
  PVP._opArmy.forEach(u => {
    if(u.dead) return;
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.globalAlpha = 0.85;
    try { drawSprite(ctx, u.type, 0, 0, 0.8, 1, t, Math.sin(u._wp||0)); } catch(_) {
      ctx.fillStyle='#a855f7'; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    const pct = Math.max(0, u.hp / u.maxHP);
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(u.x-12, u.y-18, 24, 3);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(u.x-12, u.y-18, 24*pct, 3);
  });

  // Draw necromancers
  // My necro
  const mn = PVP._myNecro;
  if(!mn.dead) {
    ctx.save(); ctx.translate(mn.x, mn.y);
    try { drawSprite(ctx, 'necromancer', 0, 0, 1, 1, t, 0); } catch(_) {
      ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    hpBar(mn.x, mn.y-32, 34, 4, mn.hp/mn.maxHP, '#ef4444');
    // Player name hidden by default
  }
  // Opponent necro
  const on = PVP._opNecro;
  if(on && !on.dead) {
    ctx.save(); ctx.translate(on.x, on.y);
    const orc = COOP_ROBE_COLORS[2]; // purple team color
    window._mpRobeRC = orc;
    try { drawSprite(ctx, 'necromancer_coop', 0, 0, 1, 1, t, 0); } catch(_) {
      ctx.fillStyle='#a855f7'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    }
    window._mpRobeRC = null;
    ctx.restore();
    hpBar(on.x, on.y-32, 34, 4, on.hp/on.maxHP, '#a855f7');
    // Opponent name hidden by default
  }

  ctx.restore(); // end arena transform

  // HUD overlay
  const elapsed = (Date.now() - PVP._roundStart) / 1000;
  const remaining = Math.max(0, PVP.roundDuration - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);

  ctx.save();
  // Round & Timer
  ctx.font = 'bold 9px "Almendra","Cinzel",monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`Round ${PVP.round} / ${PVP.totalRounds}`, cW/2, 24);
  ctx.font = 'bold 11px "Almendra","Cinzel",monospace';
  ctx.fillStyle = remaining < 30 ? '#ef4444' : '#fca5a5';
  ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, cW/2, 48);
  // Score
  ctx.font = 'bold 10px "Almendra","Cinzel",monospace';
  ctx.fillStyle = '#fca5a5'; ctx.textAlign = 'left';
  ctx.fillText(`You: ${PVP.myScore}`, 16, 30);
  ctx.fillStyle = '#d8b4fe'; ctx.textAlign = 'right';
  ctx.fillText(`${PVP.opponentData?.name||'Opponent'}: ${PVP.opScore}`, cW-16, 30);
  // Army counts
  const myAlive = PVP._myArmy.filter(u=>!u.dead).length;
  const opAlive = PVP._opArmy.filter(u=>!u.dead).length;
  ctx.font = '7px "Almendra","Cinzel",monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`Army: ${myAlive}/${PVP._myArmy.length}`, 16, 50);
  ctx.textAlign = 'right';
  ctx.fillText(`Army: ${opAlive}/${PVP._opArmy.length}`, cW-16, 50);
  ctx.restore();

  // ── AI: move my army toward opponents ──
  PVP._tick++;
  const dt = 1/60;
  PVP._myArmy.forEach(u => {
    if(u.dead) return;
    u._wp = (u._wp||0) + dt * 3;
    // Find nearest enemy
    let nearest = null, nd = Infinity;
    PVP._opArmy.forEach(e => {
      if(e.dead) return;
      const d = Math.hypot(e.x-u.x, e.y-u.y);
      if(d < nd) { nd = d; nearest = e; }
    });
    // Also target opponent necro if closer and no minions left
    if(PVP._opNecro && !PVP._opNecro.dead) {
      const dnecro = Math.hypot(PVP._opNecro.x-u.x, PVP._opNecro.y-u.y);
      if(!nearest || dnecro < nd) { nearest = PVP._opNecro; nd = dnecro; }
    }
    if(!nearest) return;
    u._atkCd = Math.max(0, (u._atkCd||0) - dt);
    if(nd <= (u.rng||30)) {
      // Attack
      if(u._atkCd <= 0) {
        nearest.hp -= u.dmg;
        u._atkCd = 1.0 / (u.spd||1);
        if(nearest.hp <= 0) { nearest.hp = 0; nearest.dead = true; }
      }
    } else {
      // Move toward target
      const angle = Math.atan2(nearest.y-u.y, nearest.x-u.x);
      const spd = (MINIONS[u.type]?.moveSpd || 60) * dt;
      let nx = u.x + Math.cos(angle)*spd;
      let ny = u.y + Math.sin(angle)*spd;
      // Collision with obstacles
      let blocked = false;
      PVP.obstacles.forEach(ob => {
        if(nx > ob.x-10 && nx < ob.x+ob.w+10 && ny > ob.y-10 && ny < ob.y+ob.h+10) blocked = true;
      });
      if(!blocked) { u.x = clamp(nx,10,PVP.arenaW-10); u.y = clamp(ny,10,PVP.arenaH-10); }
    }
  });

  // Send state to peer
  if(PVP._tick % 3 === 0) {
    const armyState = PVP._myArmy.map(u => ({x:u.x,y:u.y,hp:u.hp,tx:u.tx,ty:u.ty}));
    const necroState = {x:PVP._myNecro.x, y:PVP._myNecro.y, hp:PVP._myNecro.hp};
    const msg = {type:'pvp_state', army: armyState, necro: necroState};
    try { (PVP.conn||PVP.hostConn)?.send(msg); } catch(_) {}
  }

  // Check round end conditions
  if(remaining <= 0 || myAlive === 0 || opAlive === 0) {
    if(PVP.role === 'host') {
      // Host determines winner
      let winner;
      if(myAlive === 0 && opAlive === 0) winner = 'draw';
      else if(opAlive === 0) winner = 'host';
      else if(myAlive === 0) winner = 'guest';
      else {
        // Time's up — most surviving units wins
        winner = myAlive >= opAlive ? 'host' : 'guest';
      }
      try { PVP.conn?.send({type:'pvp_round_end', winner, round: PVP.round}); } catch(_) {}
      _pvpRoundEnd(winner, PVP.round);
    }
    // Guest waits for host's pvp_round_end message
    return;
  }

  requestAnimationFrame(_pvpLoop);
}

// ── PvP Round End ────────────────────────────────────────────────────────────
function _pvpRoundEnd(winner, round) {
  PVP.started = false;
  const iWon = (PVP.role === 'host' && winner === 'host') || (PVP.role === 'guest' && winner === 'guest');
  const isDraw = winner === 'draw';
  if(iWon) PVP.myScore++;
  else if(!isDraw) PVP.opScore++;

  // Check if match is over (best of 3 = first to 2)
  const winsNeeded = Math.ceil(PVP.totalRounds / 2);
  if(PVP.myScore >= winsNeeded || PVP.opScore >= winsNeeded) {
    const matchWinner = PVP.myScore >= winsNeeded ? 'me' : 'opponent';
    if(PVP.role === 'host') {
      try {
        PVP.conn?.send({type:'pvp_match_end', winner: matchWinner === 'me' ? 'host' : 'guest', myScore: PVP.opScore, opScore: PVP.myScore});
      } catch(_) {}
    }
    _pvpMatchEnd(matchWinner === 'me' ? PVP.role : (PVP.role==='host'?'guest':'host'), PVP.myScore, PVP.opScore);
    return;
  }

  // Show round result then start next round
  _pvpShowRoundResult(iWon ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT', round);
  if(PVP.role === 'host') {
    setTimeout(() => { PVP.myReady=true; PVP.opReady=true; _pvpHostStartRound(); }, 4000);
  }
}

function _pvpShowRoundResult(result, round) {
  const {W:cW, H:cH} = gameWH(0);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.7)';
  ctx.fillRect(0, 0, cW, cH);
  ctx.font = 'bold 14px "Almendra","Cinzel",monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = result === 'VICTORY' ? '#86efac' : result === 'DRAW' ? '#fcd34d' : '#fca5a5';
  ctx.fillText(result, cW/2, cH/2 - 10);
  ctx.font = '9px "Almendra","Cinzel",monospace';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(`Round ${round} Complete`, cW/2, cH/2 + 20);
  ctx.font = '10px "Almendra","Cinzel",monospace';
  ctx.fillStyle = '#d1d5db';
  ctx.fillText(`${PVP.myScore} — ${PVP.opScore}`, cW/2, cH/2 + 50);
  ctx.restore();
}

// ── PvP Match End ────────────────────────────────────────────────────────────
function _pvpMatchEnd(winner, myScore, opScore) {
  PVP.started = false;
  const iWon = (PVP.role === winner) || (winner === 'me');

  // Update stats
  Analytics.pvpMatch(iWon?'win':'loss');
  if(iWon) {
    GS.pvpWins = (GS.pvpWins||0) + 1;
    const ratingGain = Math.max(8, Math.round(32 * (1 - (GS.pvpRating||1000)/2000)));
    GS.pvpRating = (GS.pvpRating||1000) + ratingGain;
    const gloryGain = 25 + Math.floor(Math.random()*15);
    GS.pvpCurrency = (GS.pvpCurrency||0) + gloryGain;
    // Check for title unlocks
    const newTitle = pvpGetTitle(GS.pvpRating);
    if(!GS.pvpTitles.includes(newTitle.title)) GS.pvpTitles.push(newTitle.title);
  } else {
    GS.pvpLosses = (GS.pvpLosses||0) + 1;
    const ratingLoss = Math.max(5, Math.round(16 * ((GS.pvpRating||1000)/2000)));
    GS.pvpRating = Math.max(0, (GS.pvpRating||1000) - ratingLoss);
    const consolation = 5 + Math.floor(Math.random()*5);
    GS.pvpCurrency = (GS.pvpCurrency||0) + consolation;
  }
  saveGame(false);

  // Show match result screen
  _pvpShowMatchResult(iWon, myScore, opScore);
}

function _pvpShowMatchResult(iWon, myScore, opScore) {
  showScreen('pvpQueue');
  const {W:cW} = gameWH(0);

  // Restore HUD elements
  const mmCluster = document.getElementById('minimapCluster'); if(mmCluster) mmCluster.style.display='';
  const spellArea = document.getElementById('spellArea'); if(spellArea) spellArea.style.display='';

  // Build result overlay in pvpQueue
  const t = pvpGetTitle(GS.pvpRating||1000);
  const rEl = document.getElementById('pvpRatingDisplay');
  if(rEl) {
    let html = `<div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${iWon?'#86efac':'#fca5a5'};margin-bottom:8px">${iWon?'⚔ VICTORY ⚔':'💀 DEFEAT 💀'}</div>`;
    html += `<div style="font-size:18px;color:#d1d5db;margin-bottom:6px">${myScore} — ${opScore}</div>`;
    html += `<div style="font-size:13px;color:#6b7280">vs ${PVP?.opponentData?.name||'Opponent'}</div>`;
    html += `<div style="margin-top:10px;padding:8px;background:rgba(0,0,0,.3);border-radius:8px;font-size:13px">`;
    html += `<div style="color:${t.color}">${t.title} · Rating: <b>${GS.pvpRating}</b></div>`;
    html += `<div style="color:${iWon?'#86efac':'#fca5a5'}">${iWon?'▲':'▼'} ${iWon?'Won':'Lost'} rating</div>`;
    html += `<div style="color:#fcd34d">+${iWon ? (25+Math.floor(Math.random()*15)) : (5+Math.floor(Math.random()*5))} ⚜ Glory earned</div>`;
    html += `</div>`;
    rEl.innerHTML = html;
  }

  // Cleanup PvP
  setTimeout(() => _pvpDestroy(), 500);
}

// ── PvP Cleanup ──────────────────────────────────────────────────────────────
function _pvpDestroy() {
  if(PVP?.peer) { try { PVP.peer.destroy(); } catch(_) {} }
  PVP = null;
}

// ── loadGame: restore PvP state ──────────────────────────────────────────────
const _origLoadGamePvp = loadGame;
loadGame = function() {
  _origLoadGamePvp();
  // Ensure PvP fields exist
  if(GS.pvpWins===undefined) GS.pvpWins = 0;
  if(GS.pvpLosses===undefined) GS.pvpLosses = 0;
  if(GS.pvpCurrency===undefined) GS.pvpCurrency = 0;
  if(GS.pvpRating===undefined) GS.pvpRating = 1000;
  if(!GS.pvpTitles) GS.pvpTitles = [];
  if(!GS.pvpCosmetics) GS.pvpCosmetics = {};
  // Leaderboard fields
  if(GS.hbBestWave===undefined) GS.hbBestWave = 0;
  if(GS.totalEnemiesKilled===undefined) GS.totalEnemiesKilled = 0;
  if(!GS.fastestBossClears) GS.fastestBossClears = {};
  if(!GS.lbName) GS.lbName = '';
};


// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD SYSTEM
// ═══════════════════════════════════════════════════════════════
const LB_CATEGORIES=[
  {key:'prestige',      label:'Prestige',         ico:'👑', unit:'tier',  fmt:v=>`Tier ${v}`},
  {key:'regions',       label:'Regions Conquered', ico:'🌍', unit:'/174', fmt:v=>`${v}/174`},
  {key:'hellbridge',    label:'Hellbridge Wave',   ico:'🔥', unit:'wave', fmt:v=>`Wave ${v}`},
  {key:'boss_clears',   label:'Fastest Boss',      ico:'💀', unit:'sec',  fmt:v=>{const m=Math.floor(v/60);const s=v%60;return m?`${m}m ${s}s`:`${s}s`;}},
  {key:'enemies_killed',label:'Enemies Killed',    ico:'⚔️', unit:'',    fmt:v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`},
  {key:'pvp_rank',      label:'PvP Rank',          ico:'🏆', unit:'elo', fmt:v=>`${v} ELO`}
];
const LB_API='/.netlify/functions/leaderboard';
let _lbCache={};
let _lbCurrentCat='prestige';
let _lbCurrentScope='alltime';

function _lbGetMyScores(){
  const conquered=Object.keys(GS.conquered||{}).filter(r=>r!=='coop').length;
  // Find fastest boss clear (lowest seconds across all bosses)
  let bestBoss=null;
  if(GS.fastestBossClears){
    for(const bk in GS.fastestBossClears){
      const t=GS.fastestBossClears[bk];
      if(bestBoss===null||t<bestBoss) bestBoss=t;
    }
  }
  return {
    prestige: GS.prestige||0,
    regions: conquered,
    hellbridge: GS.hbBestWave||0,
    boss_clears: bestBoss||0,
    enemies_killed: GS.totalEnemiesKilled||0,
    pvp_rank: GS.pvpRating||1000
  };
}

async function _lbFetch(category,scope){
  const ck=`${scope}_${category}`;
  // Use cache if fresh (<60s)
  if(_lbCache[ck]&&Date.now()-_lbCache[ck].ts<60000) return _lbCache[ck].data;
  try{
    const r=await fetch(`${LB_API}?action=get&category=${category}&scope=${scope}`);
    if(!r.ok) throw new Error(r.statusText);
    const d=await r.json();
    _lbCache[ck]={data:d,ts:Date.now()};
    return d;
  }catch(e){
    console.warn('Leaderboard fetch failed:',e);
    return {entries:[],updatedAt:null};
  }
}

async function _lbSubmitAll(){
  if(!CloudSave.enabled||!CloudSave.token) return false;
  const scores=_lbGetMyScores();
  const name=GS.lbName||GS.heroName||'Necromancer';
  const pid=CloudSave.user?.id||'anon';
  let ok=0;
  for(const cat of LB_CATEGORIES){
    const val=scores[cat.key];
    if(!val&&cat.key!=='boss_clears') continue; // skip zeros except boss (lower=better)
    if(cat.key==='boss_clears'&&!val) continue;
    try{
      const r=await fetch(`${LB_API}?action=submit`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+CloudSave.token},
        body:JSON.stringify({category:cat.key,score:val,playerName:name,playerId:pid,playerLevel:GS.necroLv||1})
      });
      if(r.ok) ok++;
    }catch(e){console.warn('LB submit failed:',cat.key,e);}
  }
  // Clear cache so next open shows fresh
  _lbCache={};
  return ok>0;
}

function openLeaderboard(){
  SND.tap?.();
  let el=document.getElementById('leaderboardOverlay');
  if(!el){
    el=document.createElement('div');
    el.id='leaderboardOverlay';
    el.style.cssText='display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.88);align-items:center;justify-content:center;';
    el.innerHTML=`
    <div style="background:linear-gradient(180deg,#0d0b1a 0%,#1a0f2e 100%);border:1px solid rgba(251,191,36,.35);border-radius:16px;padding:0;max-width:420px;width:94%;max-height:85vh;display:flex;flex-direction:column;position:relative;overflow:hidden">
      <div style="padding:18px 20px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#fbbf24">🏅 Leaderboards</div>
        <div id="lbNameRow" style="display:flex;align-items:center;gap:6px">
          <span style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Display Name:</span>
          <input id="lbNameInput" maxlength="20" spellcheck="false" autocomplete="off"
            style="background:#060412;border:1px solid rgba(251,191,36,.3);color:#fbbf24;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:4px 8px;border-radius:2px;width:120px;outline:none;text-align:center"
            oninput="GS.lbName=this.value" />
        </div>
        <div id="lbScopeTabs" style="display:flex;gap:6px">
          <button onclick="_lbSetScope('alltime')" id="lbScopeAll" style="padding:5px 12px;font-family:'Almendra','Cinzel',serif;font-size:9px;border-radius:2px;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.15);color:#fbbf24;cursor:pointer">All-Time</button>
          <button onclick="_lbSetScope('weekly')" id="lbScopeWeek" style="padding:5px 12px;font-family:'Almendra','Cinzel',serif;font-size:9px;border-radius:2px;border:1px solid rgba(107,114,128,.3);background:rgba(107,114,128,.08);color:#9ca3af;cursor:pointer">Weekly</button>
        </div>
        <div id="lbCatTabs" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center"></div>
      </div>
      <div id="lbContent" style="flex:1;overflow-y:auto;padding:8px 16px 14px;min-height:200px"></div>
      <div style="padding:10px 16px 14px;display:flex;gap:8px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06)">
        <button onclick="_lbSubmitAndRefresh()" id="lbSubmitBtn" style="flex:1;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);border-radius:2px;color:#fbbf24;cursor:pointer">⬆ Submit Scores</button>
        <button onclick="closeLeaderboard()" style="flex:0 0 70px;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(107,114,128,.1);border:1px solid rgba(107,114,128,.3);border-radius:2px;color:#9ca3af;cursor:pointer">✕ Close</button>
      </div>
    </div>`;
    document.body.appendChild(el);
  }
  el.style.display='flex';
  // Init name input
  const ni=document.getElementById('lbNameInput');
  if(ni) ni.value=GS.lbName||GS.heroName||'';
  // Build category tabs
  _lbBuildCatTabs();
  // Load current category
  _lbLoadCategory(_lbCurrentCat);
  // Update submit button state
  _lbUpdateSubmitBtn();
}

function closeLeaderboard(){
  const el=document.getElementById('leaderboardOverlay');
  if(el) el.style.display='none';
}

function _lbBuildCatTabs(){
  const ct=document.getElementById('lbCatTabs');
  if(!ct) return;
  ct.innerHTML='';
  LB_CATEGORIES.forEach(cat=>{
    const active=cat.key===_lbCurrentCat;
    const btn=document.createElement('button');
    btn.id='lbCat_'+cat.key;
    btn.style.cssText=`padding:4px 10px;font-family:'Almendra','Cinzel',serif;font-size:9px;border-radius:2px;cursor:pointer;border:1px solid ${active?'rgba(251,191,36,.5)':'rgba(107,114,128,.25)'};background:${active?'rgba(251,191,36,.15)':'rgba(0,0,0,.2)'};color:${active?'#fbbf24':'#6b7280'}`;
    btn.textContent=cat.ico+' '+cat.label;
    btn.onclick=()=>{_lbCurrentCat=cat.key;_lbBuildCatTabs();_lbLoadCategory(cat.key);};
    ct.appendChild(btn);
  });
}

function _lbSetScope(scope){
  _lbCurrentScope=scope;
  const allBtn=document.getElementById('lbScopeAll');
  const weekBtn=document.getElementById('lbScopeWeek');
  if(allBtn){allBtn.style.background=scope==='alltime'?'rgba(251,191,36,.15)':'rgba(107,114,128,.08)';allBtn.style.borderColor=scope==='alltime'?'rgba(251,191,36,.4)':'rgba(107,114,128,.3)';allBtn.style.color=scope==='alltime'?'#fbbf24':'#9ca3af';}
  if(weekBtn){weekBtn.style.background=scope==='weekly'?'rgba(251,191,36,.15)':'rgba(107,114,128,.08)';weekBtn.style.borderColor=scope==='weekly'?'rgba(251,191,36,.4)':'rgba(107,114,128,.3)';weekBtn.style.color=scope==='weekly'?'#fbbf24':'#9ca3af';}
  _lbLoadCategory(_lbCurrentCat);
}

async function _lbLoadCategory(catKey){
  const content=document.getElementById('lbContent');
  if(!content) return;
  const catDef=LB_CATEGORIES.find(c=>c.key===catKey);
  content.innerHTML='<div style="text-align:center;color:#6b7280;font-family:\'Almendra\',monospace;font-size:10px;padding:40px 0">Loading…</div>';
  const data=await _lbFetch(catKey,_lbCurrentScope);
  const entries=data.entries||[];
  const myScores=_lbGetMyScores();
  const myScore=myScores[catKey]||0;
  const pid=CloudSave.user?.id||'__local__';
  // Find player's rank
  let myRank=-1;
  entries.forEach((e,i)=>{if(e.playerId===pid) myRank=i;});

  let html='';
  // My stats bar
  html+=`<div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#d1d5db">Your ${catDef.label}</div>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#fbbf24">${catDef.fmt(myScore)}</div>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">${myRank>=0?'Rank #'+(myRank+1):'Unranked'}</div>
  </div>`;

  if(entries.length===0){
    html+='<div style="text-align:center;color:#4b5563;font-family:\'Almendra\',monospace;font-size:10px;padding:30px 0">No entries yet — be the first!</div>';
  } else {
    entries.forEach((e,i)=>{
      const isMe=e.playerId===pid;
      const medalIco=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      const rankCol=i<3?'#fbbf24':'#6b7280';
      const rowBg=isMe?'rgba(251,191,36,.08)':'transparent';
      const rowBorder=isMe?'1px solid rgba(251,191,36,.2)':'1px solid rgba(255,255,255,.04)';
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:${rowBg};border-bottom:${rowBorder};${isMe?'box-shadow:inset 0 0 20px rgba(251,191,36,.05)':''}">
        <div style="width:28px;text-align:center;font-family:'Almendra','Cinzel',serif;font-size:${i<3?'14':'11'}px;color:${rankCol}">${medalIco||'#'+(i+1)}</div>
        <div style="flex:1;overflow:hidden">
          <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${isMe?'#fbbf24':'#d1d5db'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_lbEsc(e.playerName||'Unknown')}${isMe?' (You)':''}</div>
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#4b5563">Lv.${e.playerLevel||1}</div>
        </div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${i<3?'#fbbf24':'#9ca3af'}">${catDef.fmt(e.score)}</div>
      </div>`;
    });
  }
  // Updated timestamp
  if(data.updatedAt){
    const ago=Math.round((Date.now()-new Date(data.updatedAt).getTime())/60000);
    html+=`<div style="text-align:center;font-family:'Almendra','Cinzel',serif;font-size:9px;color:#374151;padding:8px 0">Updated ${ago<1?'just now':ago+'m ago'}</div>`;
  }
  content.innerHTML=html;
}

function _lbEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function _lbUpdateSubmitBtn(){
  const btn=document.getElementById('lbSubmitBtn');
  if(!btn) return;
  if(!CloudSave.enabled||!CloudSave.token){
    btn.textContent='🔒 Sign in to Submit';
    btn.style.opacity='.5';
  } else {
    btn.textContent='⬆ Submit Scores';
    btn.style.opacity='1';
  }
}

async function _lbSubmitAndRefresh(){
  const btn=document.getElementById('lbSubmitBtn');
  if(!CloudSave.enabled||!CloudSave.token){
    CloudSave.openLoginModal();
    return;
  }
  if(btn){btn.textContent='⬆ Submitting…';btn.style.opacity='.6';}
  const ok=await _lbSubmitAll();
  if(btn){
    btn.textContent=ok?'✓ Submitted!':'✗ Failed';
    btn.style.opacity='1';
    setTimeout(()=>{if(btn)btn.textContent='⬆ Submit Scores';},2000);
  }
  if(ok) _lbLoadCategory(_lbCurrentCat);
}

// Auto-submit scores on cloud save (piggyback) — deferred until CloudSave is ready
(function _patchCloudSave(){
  if(typeof CloudSave==='undefined'||!CloudSave){setTimeout(_patchCloudSave,500);return;}
  const _origCloudSave=CloudSave.saveToCloud?.bind(CloudSave);
  if(_origCloudSave){
    CloudSave.saveToCloud=async function(gsj){
      const r=await _origCloudSave(gsj);
      // Fire-and-forget leaderboard submit
      if(r) _lbSubmitAll().catch(()=>{});
      return r;
    };
  }
})();

// ═══════════════════════════════════════════════════════════════
//  GUILD SYSTEM
// ═══════════════════════════════════════════════════════════════
const GUILD_API='/.netlify/functions/guild';
let _guildTab='overview'; // overview|chat|members|perks|raids|settings
let _guildBrowseData=null;
let _guildCreateStep=false;

// ── Guild API helpers ──
async function _guildFetch(action,params={},postBody=null){
  const qs=new URLSearchParams({action,...params}).toString();
  const opts={headers:{}};
  if(CloudSave.token)opts.headers['Authorization']='Bearer '+CloudSave.token;
  if(postBody){
    opts.method='POST';
    opts.headers['Content-Type']='application/json';
    opts.body=JSON.stringify({playerId:CloudSave.user?.id||'',playerName:GS.lbName||GS.heroName||'Necromancer',playerLevel:GS.necroLv||1,...postBody});
  }
  const r=await fetch(`${GUILD_API}?${qs}`,opts);
  return r.json();
}

async function _guildRefresh(){
  if(!GS.guildId)return null;
  try{
    const d=await _guildFetch('get',{guildId:GS.guildId});
    if(d.error){GS.guildId=null;GS.guildCache=null;return null;}
    GS.guildCache=d.guild;GS.guildLastFetch=Date.now();
    return d.guild;
  }catch(e){console.warn('Guild refresh failed:',e);return GS.guildCache;}
}

// ── Get active guild bonuses (called by combat/reward systems) ──
function getGuildBonuses(){
  const g=GS.guildCache;
  if(!g||!g.level)return{xpBonus:0,goldBonus:0,lootBonus:0};
  // Return the highest-tier bonus active at this guild level
  const PERKS=[
    {level:1,xpBonus:0.03},{level:5,xpBonus:0.05},{level:9,xpBonus:0.08},
    {level:2,goldBonus:0.03},{level:6,goldBonus:0.05},{level:10,goldBonus:0.08},
    {level:7,lootBonus:0.05}
  ];
  let xpBonus=0,goldBonus=0,lootBonus=0;
  for(const p of PERKS){
    if(g.level>=p.level){
      if(p.xpBonus)xpBonus=p.xpBonus;
      if(p.goldBonus)goldBonus=p.goldBonus;
      if(p.lootBonus)lootBonus=p.lootBonus;
    }
  }
  return{xpBonus,goldBonus,lootBonus};
}

// ── Main Guild Panel ──
function openGuildPanel(){
  SND.tap?.();
  if(!CloudSave.enabled||!CloudSave.token){
    CloudSave.openLoginModal();
    showToast('☁️ Log in to access guilds');
    return;
  }
  let el=document.getElementById('guildOverlay');
  if(!el){
    el=document.createElement('div');
    el.id='guildOverlay';
    el.style.cssText='display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.88);align-items:center;justify-content:center;';
    document.body.appendChild(el);
  }
  el.style.display='flex';
  if(GS.guildId){
    _guildRefresh().then(()=>_guildRenderMain());
  }else{
    _guildRenderLobby();
  }
}

function closeGuildPanel(){
  const el=document.getElementById('guildOverlay');
  if(el)el.style.display='none';
}

// ── Lobby (no guild yet) ──
function _guildRenderLobby(){
  const el=document.getElementById('guildOverlay');if(!el)return;
  _guildCreateStep=false;
  el.innerHTML=`
  <div style="background:linear-gradient(180deg,#0d0b1a 0%,#1a0f2e 100%);border:1px solid rgba(139,92,246,.35);border-radius:16px;padding:0;max-width:420px;width:94%;max-height:85vh;display:flex;flex-direction:column;position:relative;overflow:hidden">
    <div style="padding:18px 20px 10px;text-align:center;flex-shrink:0">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#a78bfa">👥 Guild Hall</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:4px">Join or create a guild</div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:12px 16px">
      <div style="display:flex;flex-direction:column;gap:8px">
        <button onclick="_guildShowCreate()" style="padding:14px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.4);border-radius:2px;color:#a78bfa;cursor:pointer;text-align:left">
          ⚔ <strong>Create Guild</strong><br><span style="font-size:12px;color:#6b7280">Cost: 10,000 GP · Name your guild, choose a banner</span>
        </button>
        <button onclick="_guildShowBrowse()" style="padding:14px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.3);border-radius:2px;color:#60a5fa;cursor:pointer;text-align:left">
          🔍 <strong>Browse Guilds</strong><br><span style="font-size:12px;color:#6b7280">Find an open guild to join</span>
        </button>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
          <input id="guildInviteInput" placeholder="Invite code" maxlength="6" spellcheck="false"
            style="flex:1;background:#060412;border:1px solid rgba(139,92,246,.3);color:#a78bfa;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:10px;border-radius:2px;outline:none;text-transform:uppercase;text-align:center" />
          <button onclick="_guildJoinByCode()" style="padding:10px 16px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:2px;color:#22c55e;cursor:pointer">Join</button>
        </div>
      </div>
      <div id="guildLobbyContent" style="margin-top:12px"></div>
    </div>
    <div style="padding:10px 16px 14px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06)">
      <button onclick="closeGuildPanel()" style="width:100%;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(107,114,128,.1);border:1px solid rgba(107,114,128,.3);border-radius:2px;color:#9ca3af;cursor:pointer">✕ Close</button>
    </div>
  </div>`;
}

// ── Create Guild Form ──
function _guildShowCreate(){
  const ct=document.getElementById('guildLobbyContent');if(!ct)return;
  const colors=['#ef4444','#f97316',PALETTE.holyDk,'#22c55e','#3b82f6',PALETTE.frameInner,'#ec4899','#6b7280','#fbbf24','#14b8a6'];
  _guildCreateStep=true;
  ct.innerHTML=`
  <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.2);border-radius:10px;padding:14px">
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#a78bfa;margin-bottom:10px">⚔ Create Your Guild</div>
    <div style="margin-bottom:8px">
      <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Guild Name</label>
      <input id="gcName" maxlength="24" placeholder="Enter guild name…"
        style="width:100%;box-sizing:border-box;background:#060412;border:1px solid rgba(139,92,246,.3);color:#e2e8f0;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none;margin-top:2px" />
    </div>
    <div style="margin-bottom:8px">
      <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Motto (optional)</label>
      <input id="gcMotto" maxlength="60" placeholder="Guild motto…"
        style="width:100%;box-sizing:border-box;background:#060412;border:1px solid rgba(139,92,246,.3);color:#e2e8f0;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none;margin-top:2px" />
    </div>
    <div style="margin-bottom:10px">
      <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Banner Color</label>
      <div id="gcColors" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
        ${colors.map((c,i)=>`<div onclick="_gcPickColor('${c}')" id="gcc_${i}" style="width:24px;height:24px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${i===0?'#fff':'transparent'}" data-color="${c}"></div>`).join('')}
      </div>
    </div>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#f59e0b;margin-bottom:8px">Cost: 10,000 GP (you have ${GS.wallet.gp||0} GP)</div>
    <button onclick="_guildDoCreate()" id="gcCreateBtn" style="width:100%;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.4);border-radius:2px;color:#a78bfa;cursor:pointer${(GS.wallet.gp||0)<10000?' ;opacity:.5':''}">
      ${(GS.wallet.gp||0)>=10000?'⚔ Found Guild':'Not enough gold'}
    </button>
  </div>`;
}

let _gcSelectedColor='#ef4444';
function _gcPickColor(c){
  _gcSelectedColor=c;
  document.querySelectorAll('#gcColors div').forEach(d=>{
    d.style.borderColor=d.dataset.color===c?'#fff':'transparent';
  });
}

async function _guildDoCreate(){
  if((GS.wallet.gp||0)<10000){showToast('Need 10,000 GP to create a guild');return;}
  const name=(document.getElementById('gcName')?.value||'').trim();
  if(name.length<2){showToast('Name must be 2+ characters');return;}
  const motto=(document.getElementById('gcMotto')?.value||'').trim();
  const btn=document.getElementById('gcCreateBtn');
  if(btn){btn.textContent='Creating…';btn.style.opacity='.6';}
  try{
    const d=await _guildFetch('create',{},{name,motto,bannerColor:_gcSelectedColor});
    if(d.error){showToast('❌ '+d.error);if(btn){btn.textContent='⚔ Found Guild';btn.style.opacity='1';}return;}
    GS.wallet.gp-=10000;
    GS.guildId=d.guildId;
    GS.guildCache=d.guild;
    saveGame(false);
    showToast('⚔ Guild "'+name+'" founded! Invite code: '+d.inviteCode);
    _guildRenderMain();
  }catch(e){
    showToast('Failed: '+e.message);
    if(btn){btn.textContent='⚔ Found Guild';btn.style.opacity='1';}
  }
}

// ── Browse Guilds ──
async function _guildShowBrowse(){
  const ct=document.getElementById('guildLobbyContent');if(!ct)return;
  ct.innerHTML='<div style="text-align:center;color:#6b7280;font-family:\'Almendra\',monospace;font-size:10px;padding:20px">Loading guilds…</div>';
  try{
    const d=await _guildFetch('browse');
    const guilds=d.guilds||[];
    if(guilds.length===0){
      ct.innerHTML='<div style="text-align:center;color:#6b7280;font-family:\'Almendra\',monospace;font-size:10px;padding:20px">No guilds found. Be the first!</div>';
      return;
    }
    ct.innerHTML=guilds.map(g=>`
      <div style="background:rgba(0,0,0,.3);border:1px solid ${g.bannerColor}33;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:${g.bannerColor};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">👥</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.name}</div>
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">${g.motto||'No motto'}</div>
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af">Lv${g.level} · ${g.memberCount}/${g.maxMembers} · Leader: ${g.leaderName}</div>
        </div>
        ${g.isOpen&&g.memberCount<g.maxMembers?`<button onclick="_guildJoinById('${g.id}')" style="padding:6px 12px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:2px;color:#22c55e;cursor:pointer;flex-shrink:0">Join</button>`:'<span style="font-family:\'Almendra\',monospace;font-size:9px;color:#6b7280">Full</span>'}
      </div>
    `).join('');
  }catch(e){
    ct.innerHTML='<div style="text-align:center;color:#f87171;font-family:\'Almendra\',monospace;font-size:9px;padding:20px">Failed to load guilds</div>';
  }
}

async function _guildJoinById(gid){
  try{
    const d=await _guildFetch('join',{},{guildId:gid});
    if(d.error){showToast('❌ '+d.error);return;}
    GS.guildId=d.guildId;GS.guildCache=d.guild;saveGame(false);
    showToast('✓ Joined '+d.guild.name+'!');
    _guildRenderMain();
  }catch(e){showToast('Failed: '+e.message);}
}

async function _guildJoinByCode(){
  const code=(document.getElementById('guildInviteInput')?.value||'').trim().toUpperCase();
  if(code.length<4){showToast('Enter a valid invite code');return;}
  try{
    const d=await _guildFetch('join',{},{inviteCode:code});
    if(d.error){showToast('❌ '+d.error);return;}
    GS.guildId=d.guildId;GS.guildCache=d.guild;saveGame(false);
    showToast('✓ Joined '+d.guild.name+'!');
    _guildRenderMain();
  }catch(e){showToast('Failed: '+e.message);}
}

// ── Main Guild View (member of a guild) ──
function _guildRenderMain(){
  const el=document.getElementById('guildOverlay');if(!el)return;
  const g=GS.guildCache;
  if(!g){_guildRenderLobby();return;}
  const me=g.members?.find(m=>m.id===(CloudSave.user?.id||''));
  const myRole=me?.role||'member';
  const tabs=[
    {id:'overview',label:'Overview',ico:'📊'},
    {id:'chat',label:'Chat',ico:'💬'},
    {id:'members',label:'Members',ico:'👥'},
    {id:'perks',label:'Perks',ico:'⭐'},
    {id:'raids',label:'Raids',ico:'⚔️'}
  ];
  if(myRole==='leader'||myRole==='officer')tabs.push({id:'settings',label:'Settings',ico:'⚙'});

  el.innerHTML=`
  <div style="background:linear-gradient(180deg,#0d0b1a 0%,#1a0f2e 100%);border:1px solid ${g.bannerColor||'rgba(139,92,246,.35)'};border-radius:16px;padding:0;max-width:440px;width:94%;max-height:85vh;display:flex;flex-direction:column;position:relative;overflow:hidden">
    <div style="padding:14px 16px 8px;display:flex;align-items:center;gap:10px;flex-shrink:0">
      <div style="width:36px;height:36px;border-radius:50%;background:${g.bannerColor||PALETTE.frameInner};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">👥</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af">${g.motto||''} · Lv ${g.level}</div>
      </div>
      <button onclick="closeGuildPanel()" style="background:none;border:none;color:#6b7280;font-size:18px;cursor:pointer;padding:4px">✕</button>
    </div>
    <div style="display:flex;gap:2px;padding:4px 12px 0;flex-shrink:0;overflow-x:auto">
      ${tabs.map(t=>`<button onclick="_guildTab='${t.id}';_guildRenderTab()" id="gt_${t.id}" style="padding:6px 10px;font-family:'Almendra','Cinzel',serif;font-size:9px;border-radius:2px 6px 0 0;cursor:pointer;white-space:nowrap;border:1px solid ${_guildTab===t.id?'rgba(139,92,246,.5)':'rgba(107,114,128,.2)'};border-bottom:none;background:${_guildTab===t.id?'rgba(139,92,246,.12)':'transparent'};color:${_guildTab===t.id?'#a78bfa':'#6b7280'}">${t.ico} ${t.label}</button>`).join('')}
    </div>
    <div id="guildTabContent" style="flex:1;overflow-y:auto;padding:12px 16px;border-top:1px solid rgba(139,92,246,.15);min-height:180px"></div>
  </div>`;
  _guildRenderTab();
}

function _guildRenderTab(){
  const ct=document.getElementById('guildTabContent');if(!ct)return;
  const g=GS.guildCache;if(!g)return;
  // Highlight active tab
  document.querySelectorAll('[id^="gt_"]').forEach(b=>{
    const active=b.id==='gt_'+_guildTab;
    b.style.background=active?'rgba(139,92,246,.12)':'transparent';
    b.style.borderColor=active?'rgba(139,92,246,.5)':'rgba(107,114,128,.2)';
    b.style.color=active?'#a78bfa':'#6b7280';
  });

  switch(_guildTab){
    case 'overview': _guildRenderOverview(ct,g);break;
    case 'chat': _guildRenderChat(ct,g);break;
    case 'members': _guildRenderMembers(ct,g);break;
    case 'perks': _guildRenderPerks(ct,g);break;
    case 'raids': _guildRenderRaids(ct,g);break;
    case 'settings': _guildRenderSettings(ct,g);break;
  }
}

// ── Overview Tab ──
function _guildRenderOverview(ct,g){
  const xpNeeded=g.nextLevelXP||500;
  const xpPct=Math.min(100,Math.round((g.xp/xpNeeded)*100));
  const me=g.members?.find(m=>m.id===(CloudSave.user?.id||''));
  const bonuses=getGuildBonuses();
  ct.innerHTML=`
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${g.bannerColor||'#a78bfa'};margin-bottom:4px">${g.name}</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af">${g.motto||'No motto set'}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#a78bfa">${g.level}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Guild Level</div>
      </div>
      <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#60a5fa">${g.members?.length||0}/${g.maxMembers||20}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Members</div>
      </div>
    </div>
    ${g.level<10?`<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-bottom:3px">
        <span>Guild XP</span><span>${g.xp}/${xpNeeded}</span>
      </div>
      <div style="height:6px;background:rgba(139,92,246,.1);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,#8b5cf6,#a78bfa);border-radius:3px;transition:width .3s"></div>
      </div>
    </div>`:'<div style="text-align:center;font-family:\'Almendra\',monospace;font-size:9px;color:#22c55e;margin-bottom:12px">✦ Max Guild Level!</div>'}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:8px;padding:8px;text-align:center">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#fbbf24">🦴 ${g.pool?.bones||0}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">Pool Bones</div>
      </div>
      <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:8px;padding:8px;text-align:center">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:#fbbf24">💰 ${g.pool?.gold||0}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">Pool Gold</div>
      </div>
    </div>
    ${bonuses.xpBonus||bonuses.goldBonus||bonuses.lootBonus?`<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:8px;padding:8px;margin-bottom:12px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#22c55e;margin-bottom:4px">Active Bonuses</div>
      ${bonuses.xpBonus?`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ +${Math.round(bonuses.xpBonus*100)}% XP</div>`:''}
      ${bonuses.goldBonus?`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ +${Math.round(bonuses.goldBonus*100)}% Gold</div>`:''}
      ${bonuses.lootBonus?`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ +${Math.round(bonuses.lootBonus*100)}% Loot Rarity</div>`:''}
    </div>`:''}
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-bottom:6px">Invite Code: <span style="color:#a78bfa;font-size:10px;letter-spacing:2px">${g.inviteCode||'???'}</span></div>
    <div style="display:flex;gap:8px">
      <button onclick="_guildContributePrompt()" style="flex:1;padding:8px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:2px;color:#fbbf24;cursor:pointer">💰 Contribute</button>
      <button onclick="_guildRefresh().then(()=>_guildRenderMain())" style="flex:0 0 auto;padding:8px 12px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:rgba(107,114,128,.1);border:1px solid rgba(107,114,128,.3);border-radius:2px;color:#9ca3af;cursor:pointer">↻</button>
    </div>
    <button onclick="_guildLeave()" style="width:100%;margin-top:10px;padding:8px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:2px;color:#f87171;cursor:pointer">Leave Guild</button>
  `;
}

// ── Contribute prompt ──
function _guildContributePrompt(){
  const ct=document.getElementById('guildTabContent');if(!ct)return;
  ct.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#fbbf24;margin-bottom:12px">💰 Contribute to Guild Pool</div>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-bottom:8px">Your resources: 🦴 ${GS.bones} bones · 💰 ${GS.wallet.gp||0} GP</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <div style="flex:1">
        <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Bones</label>
        <input id="gcBones" type="number" min="0" max="${GS.bones}" value="0"
          style="width:100%;box-sizing:border-box;background:#060412;border:1px solid rgba(251,191,36,.3);color:#fbbf24;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none;margin-top:2px" />
      </div>
      <div style="flex:1">
        <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Gold (GP)</label>
        <input id="gcGold" type="number" min="0" max="${GS.wallet.gp||0}" value="0"
          style="width:100%;box-sizing:border-box;background:#060412;border:1px solid rgba(251,191,36,.3);color:#fbbf24;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none;margin-top:2px" />
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="_guildDoContribute()" style="flex:1;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);border-radius:2px;color:#fbbf24;cursor:pointer">Contribute</button>
      <button onclick="_guildRenderTab()" style="flex:0 0 70px;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(107,114,128,.1);border:1px solid rgba(107,114,128,.3);border-radius:2px;color:#9ca3af;cursor:pointer">Cancel</button>
    </div>
  `;
}

async function _guildDoContribute(){
  const bones=Math.max(0,parseInt(document.getElementById('gcBones')?.value)||0);
  const gold=Math.max(0,parseInt(document.getElementById('gcGold')?.value)||0);
  if(bones<=0&&gold<=0){showToast('Enter an amount to contribute');return;}
  if(bones>GS.bones){showToast('Not enough bones');return;}
  if(gold>(GS.wallet.gp||0)){showToast('Not enough gold');return;}
  try{
    const d=await _guildFetch('contribute',{},{guildId:GS.guildId,bones,gold});
    if(d.error){showToast('❌ '+d.error);return;}
    GS.bones-=bones;GS.wallet.gp=(GS.wallet.gp||0)-gold;
    if(GS.guildCache){GS.guildCache.pool=d.pool;GS.guildCache.level=d.guildLevel;}
    saveGame(false);
    showToast(`✓ Contributed ${bones?bones+' bones':''}${bones&&gold?' + ':''}${gold?gold+' GP':''}`+(d.leveledUp?' 🎉 Guild leveled up!':''));
    _guildTab='overview';_guildRenderMain();
  }catch(e){showToast('Failed: '+e.message);}
}

// ── Chat Tab ──
function _guildRenderChat(ct,g){
  const msgs=g.chat||[];
  ct.innerHTML=`
    <div id="guildChatLog" style="max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:3px">
      ${msgs.length===0?'<div style="text-align:center;color:#6b7280;font-family:\'Almendra\',monospace;font-size:9px;padding:20px">No messages yet</div>':''}
      ${msgs.map(m=>{
        if(m.system)return`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;text-align:center;padding:2px 0">⚔ ${m.text}</div>`;
        const isMe=m.fromId===(CloudSave.user?.id||'');
        return`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${isMe?'#a78bfa':'#e2e8f0'}"><span style="color:#6b7280;font-size:10px">${new Date(m.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span> <strong style="color:${isMe?PALETTE.frameGlow:'#94a3b8'}">${m.from}:</strong> ${m.text}</div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:6px">
      <input id="guildChatInput" maxlength="200" placeholder="Type a message…"
        style="flex:1;background:#060412;border:1px solid rgba(139,92,246,.3);color:#e2e8f0;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none"
        onkeydown="if(event.key==='Enter')_guildSendChat()" />
      <button onclick="_guildSendChat()" style="padding:8px 14px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.4);border-radius:2px;color:#a78bfa;cursor:pointer">Send</button>
    </div>
    <button onclick="_guildRefresh().then(()=>{_guildTab='chat';_guildRenderTab()})" style="width:100%;margin-top:6px;padding:6px;font-family:'Almendra','Cinzel',serif;font-size:9px;background:none;border:1px solid rgba(107,114,128,.2);border-radius:2px;color:#6b7280;cursor:pointer">↻ Refresh</button>
  `;
  // Auto-scroll to bottom
  const log=document.getElementById('guildChatLog');
  if(log)log.scrollTop=log.scrollHeight;
}

async function _guildSendChat(){
  const inp=document.getElementById('guildChatInput');if(!inp)return;
  const msg=inp.value.trim();if(!msg)return;
  inp.value='';
  try{
    const d=await _guildFetch('chat',{},{guildId:GS.guildId,message:msg});
    if(d.error){showToast('❌ '+d.error);return;}
    if(GS.guildCache&&d.chat)GS.guildCache.chat=d.chat;
    _guildRenderChat(document.getElementById('guildTabContent'),GS.guildCache);
  }catch(e){showToast('Failed: '+e.message);}
}

// ── Members Tab ──
function _guildRenderMembers(ct,g){
  const me=g.members?.find(m=>m.id===(CloudSave.user?.id||''));
  const myRole=me?.role||'member';
  const roleIco={leader:'👑',officer:'⚔',member:'🛡'};
  const roleCol={leader:'#fbbf24',officer:'#60a5fa',member:'#9ca3af'};
  const sorted=[...g.members].sort((a,b)=>{const o={leader:0,officer:1,member:2};return(o[a.role]||2)-(o[b.role]||2);});
  ct.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#a78bfa;margin-bottom:8px">👥 Members (${g.members.length}/${g.maxMembers||20})</div>
    ${sorted.map(m=>{
      const isMe=m.id===(CloudSave.user?.id||'');
      const canManage=(myRole==='leader'||(myRole==='officer'&&m.role==='member'))&&!isMe;
      return`<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;background:rgba(0,0,0,.2);border-radius:6px;border:1px solid ${isMe?'rgba(139,92,246,.3)':'rgba(107,114,128,.1)'}">
        <span style="font-size:14px">${roleIco[m.role]||'🛡'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${roleCol[m.role]||'#9ca3af'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}${isMe?' (you)':''}</div>
          <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">Lv${m.level||1} · ${m.role} · Contributed: ${m.contributed||0}</div>
        </div>
        ${canManage?`<div style="display:flex;gap:3px">
          ${myRole==='leader'&&m.role==='member'?`<button onclick="_guildPromote('${m.id}')" style="padding:3px 6px;font-size:10px;font-family:'Almendra','Cinzel',serif;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:2px;color:#60a5fa;cursor:pointer" title="Promote to Officer">⬆</button>`:''}
          ${myRole==='leader'&&m.role==='officer'?`<button onclick="_guildDemote('${m.id}')" style="padding:3px 6px;font-size:10px;font-family:'Almendra','Cinzel',serif;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:2px;color:#fbbf24;cursor:pointer" title="Demote to Member">⬇</button>`:''}
          ${canManage?`<button onclick="_guildKick('${m.id}')" style="padding:3px 6px;font-size:10px;font-family:'Almendra','Cinzel',serif;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:2px;color:#f87171;cursor:pointer" title="Kick">✕</button>`:''}
        </div>`:''}
      </div>`;
    }).join('')}
  `;
}

async function _guildPromote(tid){
  const d=await _guildFetch('promote',{},{guildId:GS.guildId,targetPlayerId:tid});
  if(d.error){showToast('❌ '+d.error);return;}
  showToast('✓ Promoted');_guildRefresh().then(()=>{_guildTab='members';_guildRenderTab();});
}
async function _guildDemote(tid){
  const d=await _guildFetch('demote',{},{guildId:GS.guildId,targetPlayerId:tid});
  if(d.error){showToast('❌ '+d.error);return;}
  showToast('✓ Demoted');_guildRefresh().then(()=>{_guildTab='members';_guildRenderTab();});
}
async function _guildKick(tid){
  if(!confirm('Remove this member from the guild?'))return;
  const d=await _guildFetch('kick',{},{guildId:GS.guildId,targetPlayerId:tid});
  if(d.error){showToast('❌ '+d.error);return;}
  showToast('✓ Removed');_guildRefresh().then(()=>{_guildTab='members';_guildRenderTab();});
}

// ── Perks Tab ──
function _guildRenderPerks(ct,g){
  const PERKS=[
    {level:1,id:'xp_i',label:'+3% XP bonus',ico:'📈'},
    {level:2,id:'gold_i',label:'+3% gold bonus',ico:'💰'},
    {level:3,id:'pool_i',label:'Shared resource pool',ico:'🏦'},
    {level:4,id:'raid_i',label:'Guild raids (4-player)',ico:'⚔️'},
    {level:5,id:'xp_ii',label:'+5% XP bonus (total)',ico:'📈'},
    {level:6,id:'gold_ii',label:'+5% gold bonus (total)',ico:'💰'},
    {level:7,id:'loot_i',label:'+5% loot rarity',ico:'🎁'},
    {level:8,id:'cap_i',label:'+5 member cap (25)',ico:'👥'},
    {level:9,id:'xp_iii',label:'+8% XP bonus (total)',ico:'📈'},
    {level:10,id:'gold_iii',label:'+8% gold bonus (total)',ico:'💰'}
  ];
  ct.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#a78bfa;margin-bottom:10px">⭐ Guild Perks</div>
    ${PERKS.map(p=>{
      const active=g.level>=p.level;
      return`<div style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;background:${active?'rgba(34,197,94,.06)':'rgba(0,0,0,.2)'};border:1px solid ${active?'rgba(34,197,94,.2)':'rgba(107,114,128,.1)'};border-radius:6px">
        <span style="font-size:14px;opacity:${active?1:.4}">${p.ico}</span>
        <div style="flex:1">
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${active?'#22c55e':'#6b7280'}">${p.label}</div>
          <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#4b5563">Unlocks at Guild Level ${p.level}</div>
        </div>
        <span style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${active?'#22c55e':'#4b5563'}">${active?'✓ Active':'🔒'}</span>
      </div>`;
    }).join('')}
  `;
}

// ── Raids Tab ──
function _guildRenderRaids(ct,g){
  const raidsUnlocked=g.level>=4;
  const recentRaids=(g.raidLog||[]).slice(-10).reverse();
  ct.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#a78bfa;margin-bottom:8px">⚔️ Guild Raids</div>
    ${!raidsUnlocked?`<div style="text-align:center;padding:30px 0">
      <div style="font-size:28px;margin-bottom:8px">🔒</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">Guild raids unlock at Level 4</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#4b5563;margin-top:4px">Current level: ${g.level}/4</div>
    </div>`:`
    <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:8px;padding:10px;margin-bottom:10px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#22c55e;margin-bottom:4px">Guild Raid Bonuses</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ +5% XP for all participants</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ +5% Gold for all participants</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#86efac">✦ Up to 4 guild members</div>
    </div>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-bottom:6px">Start a guild raid from the Aviary (🐦 Co-op Raid) with guild members online.</div>
    ${recentRaids.length>0?`<div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af;margin-top:10px;margin-bottom:6px">Recent Raids</div>
    ${recentRaids.map(r=>`<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;margin-bottom:3px;background:rgba(0,0,0,.2);border-radius:2px;font-family:'Almendra','Cinzel',serif;font-size:9px">
      <span style="color:${r.success?'#22c55e':'#f87171'}">${r.success?'✓':'✗'}</span>
      <span style="color:#9ca3af;flex:1">${r.region}</span>
      <span style="color:#6b7280">${new Date(r.startedAt).toLocaleDateString()}</span>
    </div>`).join('')}`:'<div style="font-family:\'Almendra\',monospace;font-size:9px;color:#4b5563;text-align:center;padding:12px">No raids yet</div>'}
    `}
  `;
}

// ── Settings Tab ──
function _guildRenderSettings(ct,g){
  ct.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#a78bfa;margin-bottom:10px">⚙ Guild Settings</div>
    <div style="margin-bottom:10px">
      <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">Motto</label>
      <input id="gsMottoInput" maxlength="60" value="${g.motto||''}"
        style="width:100%;box-sizing:border-box;background:#060412;border:1px solid rgba(139,92,246,.3);color:#e2e8f0;font-family:'Almendra','Cinzel',serif;font-size:10px;padding:8px;border-radius:2px;outline:none;margin-top:2px" />
    </div>
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <label style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af">Open to join:</label>
      <button onclick="_guildToggleOpen()" id="gsOpenBtn" style="padding:6px 14px;font-family:'Almendra','Cinzel',serif;font-size:9px;border-radius:2px;cursor:pointer;border:1px solid ${g.isOpen?'rgba(34,197,94,.4)':'rgba(239,68,68,.3)'};background:${g.isOpen?'rgba(34,197,94,.1)':'rgba(239,68,68,.06)'};color:${g.isOpen?'#22c55e':'#f87171'}">${g.isOpen?'Open':'Invite Only'}</button>
    </div>
    <button onclick="_guildSaveSettings()" style="width:100%;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.4);border-radius:2px;color:#a78bfa;cursor:pointer">Save Settings</button>
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:12px;text-align:center">Invite Code: <span style="color:#a78bfa;font-size:11px;letter-spacing:2px">${g.inviteCode||'???'}</span></div>
  `;
}

let _gsOpenState=null;
function _guildToggleOpen(){
  const g=GS.guildCache;if(!g)return;
  if(_gsOpenState===null)_gsOpenState=g.isOpen;
  _gsOpenState=!_gsOpenState;
  const btn=document.getElementById('gsOpenBtn');
  if(btn){
    btn.textContent=_gsOpenState?'Open':'Invite Only';
    btn.style.borderColor=_gsOpenState?'rgba(34,197,94,.4)':'rgba(239,68,68,.3)';
    btn.style.background=_gsOpenState?'rgba(34,197,94,.1)':'rgba(239,68,68,.06)';
    btn.style.color=_gsOpenState?'#22c55e':'#f87171';
  }
}

async function _guildSaveSettings(){
  const motto=(document.getElementById('gsMottoInput')?.value||'').trim();
  const isOpen=_gsOpenState!==null?_gsOpenState:(GS.guildCache?.isOpen??true);
  try{
    const d=await _guildFetch('update-settings',{},{guildId:GS.guildId,motto,isOpen});
    if(d.error){showToast('❌ '+d.error);return;}
    if(GS.guildCache){GS.guildCache.motto=motto;GS.guildCache.isOpen=isOpen;}
    showToast('✓ Settings saved');_gsOpenState=null;
  }catch(e){showToast('Failed: '+e.message);}
}

// ── Leave Guild ──
async function _guildLeave(){
  if(!confirm('Leave this guild? This cannot be undone.'))return;
  try{
    const d=await _guildFetch('leave',{},{});
    if(d.error){showToast('❌ '+d.error);return;}
    GS.guildId=null;GS.guildCache=null;saveGame(false);
    showToast('Left the guild');
    _guildRenderLobby();
  }catch(e){showToast('Failed: '+e.message);}
}

// ── Auto-refresh guild data on cloud load — deferred until CloudSave is ready ──
(function _patchCloudLoad(){
  if(typeof CloudSave==='undefined'||!CloudSave){setTimeout(_patchCloudLoad,500);return;}
  const _origCloudLoad=CloudSave.loadFromCloud?.bind(CloudSave);
  if(_origCloudLoad){
    CloudSave.loadFromCloud=async function(){
      const r=await _origCloudLoad();
      // After cloud load, refresh guild data if player has a guild
      if(GS.guildId){_guildRefresh().catch(()=>{});}
      return r;
    };
  }
})();

// ═══════════════════════════════════════════════════════════════
//  DEV GIFT SYSTEM
// ═══════════════════════════════════════════════════════════════
const DEV_GIFT_CODES = {
  'DEVGIFT': {
    label: "Architect's Blessing",
    items: ['staff_white','robe_white','hat_wizard'],
    message: "✦ The White Raven grants you the Architect's Blessing!"
  },
  'EMBERPAL': {
    label: "Ember Salamander Companion",
    familiars: ['fire_salamander'],
    message: "🔥 An Ember Salamander leaps to your side — it shall never truly die!"
  },
  'PAPRIKA': {
    label: "Paprika the Hedgehog",
    familiars: ['hedgehog'],
    message: "🦔 Paprika curls into your satchel — a spiky companion for life!"
  },
  'MERUEM': {
    label: "Meruem's Set",
    items: ['meruem_staff','meruem_coat','meruem_brain'],
    message: "🧠 The King of Ants stirs — Meruem's Set is yours!\n⚔ Hero Unlocked: Meruem joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('meruem');_ensureHeroLevels();if(!GS.heroes.levels.meruem)GS.heroes.levels.meruem={lv:GS.necroLv||1,xp:0}; }
  },
  'GODMODE': {
    label: "Architect's Omniscience",
    items: [],
    message: "☠ All secrets revealed — Lv.20 and every passive skill unlocked!",
    onClaim: function() {
      if(GS.necroLv < 20) {
        GS.necroLv = 20;
        GS.necroXP = XP_TABLE[19];
        GS.necroMaxHP = Math.round((100 + 20*12 + 50) * (GS.prestHPMult ? GS.prestHPMult() : 1));
        GS.necroHP = GS.necroMaxHP;
      }
      // Ensure all passives are enabled (un-disable any manually disabled ones)
      if(GS.passivesDisabled) GS.passivesDisabled.clear();
    }
  },
  'RIKKER': {
    label: "Rikker's Paladin Set",
    items: ['rikker_sword','rikker_armor','rikker_helm'],
    message: "⚔ The Sacred Flame answers — Rikker's Paladin Set is yours!\n⚔ Hero Unlocked: Rikker joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('rikker');_ensureHeroLevels();if(!GS.heroes.levels.rikker)GS.heroes.levels.rikker={lv:GS.necroLv||1,xp:0}; }
  },
  'MELTING': {
    label: "Melting's Barbarian Set",
    items: ['melting_hammer','melting_unarmored','melting_helm'],
    message: "🔨 The mountain trembles — Melting's Barbarian Set is yours!\n⚔ Hero Unlocked: Melting joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('melting');_ensureHeroLevels();if(!GS.heroes.levels.melting)GS.heroes.levels.melting={lv:GS.necroLv||1,xp:0}; }
  },
  'ESOJAWEL': {
    label: "Esoj Awel's Ranger Set",
    items: ['esoj_bow','esoj_armor','esoj_hat'],
    message: "🏹 The World Tree stirs — Esoj Awel's Ranger Set is yours!\n⚔ Hero Unlocked: Esoj Awel joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('esoj');_ensureHeroLevels();if(!GS.heroes.levels.esoj)GS.heroes.levels.esoj={lv:GS.necroLv||1,xp:0}; }
  },
  'ZEPHYR': {
    label: "Zephyr's Rogue Set",
    items: ['zephyr_dagger','zephyr_cloak','zephyr_hood'],
    message: "🗡 The shadows part — Zephyr's Rogue Set is yours!\n⚔ Hero Unlocked: Zephyr joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('zephyr');_ensureHeroLevels();if(!GS.heroes.levels.zephyr)GS.heroes.levels.zephyr={lv:GS.necroLv||1,xp:0}; }
  },
  'ALTHEA': {
    label: "Sister Althea's Cleric Set",
    items: ['althea_mace','althea_vestments','althea_circlet'],
    message: "☀ The dawn breaks — Sister Althea's Cleric Set is yours!\n⚔ Hero Unlocked: Sister Althea joins the Pub!",
    onClaim: function(){ GS.heroes.unlocked.add('cleric');_ensureHeroLevels();if(!GS.heroes.levels.cleric)GS.heroes.levels.cleric={lv:GS.necroLv||1,xp:0}; }
  }
};

function openDevGiftMenu() {
  const el = document.getElementById('devGiftModal');
  if (!el) return;
  el.style.display = 'flex';
  const inp = document.getElementById('devGiftInput');
  if (inp) { inp.value = ''; inp.focus(); }
  const msg = document.getElementById('devGiftMsg');
  if (msg) msg.textContent = '';
}

function closeDevGiftMenu() {
  const el = document.getElementById('devGiftModal');
  if (el) el.style.display = 'none';
}

function openDeskLog() {
  const el = document.getElementById('deskLogModal');
  if (!el) return;
  const list = document.getElementById('deskLogList');
  if (!list) return;
  
  const unlocks = GS.devUnlocks ? [...GS.devUnlocks] : [];
  const quests = GS.quests || {};
  const completedQuests = [];
  
  // Check for completed quests
  if(quests.pumpkin_quest && quests.pumpkin_quest.completed){
    completedQuests.push({id:'pumpkin_quest', name:'Pumpkin Quest', icon:'🎃', description:'Successfully traded Big Pumpkins for Pumpkin Juice'});
  }
  if(quests.gandalf_quest && quests.gandalf_quest.completed){
    completedQuests.push({id:'gandalf_quest', name:"Gandalf's Errand", icon:'🧙', description:'Recovered Dragon Fireworks from the Orc Colonel and traded them for Pipe-weed.'});
  }
  if(GS.quests.ranger_quest&&GS.quests.ranger_quest.completed){
    completedQuests.push({id:'ranger_quest', name:"Rangers Bounty", icon:'🗺️', description:'Retrieved the Stolen Map from the Innkeeper Revenant and earned a Rangers Cloak.'});
  }
  if(GS.quests.scholar_quest&&GS.quests.scholar_quest.completed){
    completedQuests.push({id:'scholar_quest', name:"Barrow Scholars Request", icon:'📖', description:'Recovered the Ancient Tome from the Barrow Specter and received a Lore Scroll.'});
  }
  if(GS.quests.dwarf_quest&&GS.quests.dwarf_quest.completed){
    completedQuests.push({id:'dwarf_quest', name:"Dwarven Heirloom", icon:'⚔️', description:'Reclaimed the Dwarven Axe from the Great Troll and earned Dwarven Ale.'});
  }
  
  let html = '';
  
  // Dev Codes Section
  html += '<div style="margin-bottom:16px">';
  html += '<div style="font-family:\'Almendra\',monospace;font-size:9px;color:#c4b5fd;font-weight:bold;padding:8px 4px;cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px" onclick="toggleDeskDropdown(\'codes\')" id="codesHeader">';
  html += '<span id="codesToggle" style="display:inline-block;transition:transform 0.2s">▼</span>';
  html += `Dev Codes (${unlocks.length})`;
  html += '</div>';
  html += '<div id="codesContent" style="overflow:hidden;transition:max-height 0.3s ease">';
  
  if (unlocks.length === 0) {
    html += '<div style="color:#6b7280;font-size:12px;text-align:center;padding:12px 0;font-style:italic">No codes exchanged yet.</div>';
  } else {
    html += unlocks.map(code => {
      const gift = DEV_GIFT_CODES[code];
      const label = gift ? gift.label : code;
      const items = gift ? [...(gift.items||[]),...(gift.familiars||[])] : [];
      const allDefs = [...SHOP_ITEMS.equipment,...(SHOP_ITEMS.devFamiliars||[]),...SHOP_ITEMS.familiars];
      const itemStr = items.map(id=>{ const d=allDefs.find(x=>x.id===id); return d?`${d.ico} ${d.name}`:id; }).join(' · ');
      return `<div style="border-bottom:1px solid rgba(167,139,250,.1);padding:10px 4px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#c4b5fd;margin-bottom:3px">✦ ${label}</div>
        ${itemStr?`<div style="font-size:12px;color:#9ca3af">${itemStr}</div>`:''}
      </div>`;
    }).join('');
  }
  html += '</div></div>';
  
  // Completed Quests Section
  html += '<div>';
  html += '<div style="font-family:\'Almendra\',monospace;font-size:9px;color:#a78bfa;font-weight:bold;padding:8px 4px;cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px" onclick="toggleDeskDropdown(\'quests\')" id="questsHeader">';
  html += '<span id="questsToggle" style="display:inline-block;transition:transform 0.2s">▼</span>';
  html += `Completed Quests (${completedQuests.length})`;
  html += '</div>';
  html += '<div id="questsContent" style="overflow:hidden;transition:max-height 0.3s ease">';
  
  if (completedQuests.length === 0) {
    html += '<div style="color:#6b7280;font-size:12px;text-align:center;padding:12px 0;font-style:italic">No quests completed yet.</div>';
  } else {
    html += completedQuests.map(q => {
      return `<div style="border-bottom:1px solid rgba(167,139,250,.1);padding:10px 4px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#a78bfa;margin-bottom:3px">${q.icon} ${q.name}</div>
        <div style="font-size:12px;color:#9ca3af">${q.description}</div>
      </div>`;
    }).join('');
  }
  html += '</div></div>';
  
  list.innerHTML = html;
  
  // Set up dropdown styling - expand both by default
  setTimeout(() => {
    const codesContent = document.getElementById('codesContent');
    const questsContent = document.getElementById('questsContent');
    if(codesContent) codesContent.style.maxHeight = codesContent.scrollHeight + 'px';
    if(questsContent) questsContent.style.maxHeight = questsContent.scrollHeight + 'px';
  }, 0);
  
  el.style.display = 'flex';
}

function toggleDeskDropdown(section) {
  const toggle = document.getElementById(section === 'codes' ? 'codesToggle' : 'questsToggle');
  const content = document.getElementById(section === 'codes' ? 'codesContent' : 'questsContent');
  
  if (!toggle || !content) return;
  
  const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';
  
  if (isExpanded) {
    content.style.maxHeight = '0px';
    toggle.style.transform = 'rotate(-90deg)';
  } else {
    content.style.maxHeight = content.scrollHeight + 'px';
    toggle.style.transform = 'rotate(0deg)';
  }
}

function closeDeskLog() {
  const el = document.getElementById('deskLogModal');
  if (el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
//  RIKKER'S SET — Paladin Transformation System
// ═══════════════════════════════════════════════════════════════
const RIKKER_SET_IDS = ['rikker_sword','rikker_armor','rikker_helm'];
const RIKKER_PALADIN_SPELLS = ['divineSmite','searingSmite','shieldOfFaith','thunderousSmite','sacredWeapon'];

let _rikkerOrigSpells = null;
let _rikkerActive = false;

function isRikkerSetEquipped() {
  if (!GS.cosmetics) return false;
  return GS.cosmetics.staff==='rikker_sword' && GS.cosmetics.robe==='rikker_armor' && GS.cosmetics.hat==='rikker_helm';
}

function equipRikkerSet() {
  if (_rikkerActive) return;
  if (_meruemActive) unequipMeruemSet();
  if (_meltingActive) unequipMeltingSet();
  if (_esojActive) unequipEsojSet();
  _dismissMinionsForDevSet();
  if (!GS.cosmetics) GS.cosmetics = {};
  // Ensure all dev sets are in purchased so the Hero Panel can switch between them freely
  if (!GS.inv.purchased) GS.inv.purchased = new Set();
  ['rikker_sword','rikker_armor','rikker_helm','meruem_staff','meruem_coat','meruem_brain','melting_hammer','melting_unarmored','melting_helm','esoj_bow','esoj_armor','esoj_hat','zephyr_dagger','zephyr_cloak','zephyr_hood'].forEach(id => GS.inv.purchased.add(id));

  GS.cosmetics._rikkerOrigSpells = [...(GS.equippedSpellsOrdered || [...GS.equippedSpells])].filter(k=>!SPELLS[k]?.paladinOnly&&!SPELLS[k]?.barbarianOnly&&!SPELLS[k]?.meruemOnly&&!SPELLS[k]?.rangerOnly);
  _rikkerOrigSpells = { spells: new Set(GS.equippedSpells), ordered: [...(GS.equippedSpellsOrdered || [])] };

  GS.cosmetics.staff = 'rikker_sword';
  GS.cosmetics.robe  = 'rikker_armor';
  GS.cosmetics.hat   = 'rikker_helm';

  const dismissed = [...GS.raidParty];
  GS.raidParty.clear();
  // Also remove all minions from an active raid (send them to catacombs)
  if (RS && RS.minions) {
    RS.minions.forEach(mk => { if (!mk.dead) mk.dead = true; });
    RS.minions = [];
  }
  if (dismissed.length > 0) showToast('⚔ All minions sent to catacombs — Rikker marches alone!');

  GS.equippedSpells = new Set(RIKKER_PALADIN_SPELLS);
  GS.equippedSpellsOrdered = [...RIKKER_PALADIN_SPELLS];

  const baseHP = Math.round((100 + GS.necroLv*12 + (GS.hasPassive(8)?50:0)) * GS.prestHPMult());
  GS.necroMaxHP = Math.round(baseHP * 1.66);
  GS.necroHP = GS.necroMaxHP;

  _rikkerActive = true;
  if (RS) { RS._eqSpells=null; buildSpellBar(); RS.necro.maxHP=GS.necroMaxHP; RS.necro.hp=GS.necroMaxHP; }
  saveGame(); renderHub();
  showToast("🔥 Rikker's Set equipped — the Paladin awakens!");
}

function unequipRikkerSet() {
  if (!_rikkerActive) return;
  cancelAllAscensions();
  if (GS.cosmetics) {
    if (GS.cosmetics.staff==='rikker_sword') GS.cosmetics.staff='staff_bone';
    if (GS.cosmetics.robe==='rikker_armor')  GS.cosmetics.robe=null;
    if (GS.cosmetics.hat==='rikker_helm')    GS.cosmetics.hat=null;
  }
  const origOrdered = (_rikkerOrigSpells?.ordered?.length ? _rikkerOrigSpells.ordered : null)
    || (GS.cosmetics?._rikkerOrigSpells?.length ? GS.cosmetics._rikkerOrigSpells : null)
    || ['tollTheDead','chillTouch','blight','animateDead'];
  GS.equippedSpells = new Set(origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly));
  GS.equippedSpellsOrdered = origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly);
  if (GS.cosmetics) delete GS.cosmetics._rikkerOrigSpells;
  _rikkerOrigSpells = null;

  const restoredBase = Math.round((100 + GS.necroLv*12 + (GS.hasPassive(8)?50:0)) * GS.prestHPMult());
  const _armorItem = SHOP_ITEMS.equipment.find(i=>i.id===GS.inv.equipped.armor);
  GS.necroMaxHP = restoredBase + (_armorItem?.stats?.maxHP||0);
  GS.necroHP = Math.min(GS.necroHP, GS.necroMaxHP);

  _rikkerActive = false;
  if (RS) { RS._eqSpells=null; buildSpellBar(); RS.necro.maxHP=GS.necroMaxHP; RS.necro.hp=Math.min(RS.necro.hp,GS.necroMaxHP); }
  saveGame(); renderHub();
  showToast("🌑 Rikker's Set removed — the Necromancer returns.");
}

// ═══════════════════════════════════════════════════════════════
//  MERUEM'S SET — Drunken Doctor Transformation System
// ═══════════════════════════════════════════════════════════════
let _meruemActive      = false;
let _meruemOrigSpells  = null;
let _meruemInvincibleUntil  = 0;   // game-time: necro is invincible while lastTs/1000 < this
let _meruemInvincibleCycle  = 0;   // game-time: next invincibility trigger
let _meruemGhostNextT       = 0;   // game-time: next Dimple ghost spawn
let _meruemHiccupNextT      = 0;   // game-time: next hiccup bubble

function isMeruemSetEquipped(){
  if(!GS.cosmetics)return false;
  return GS.cosmetics.staff==='meruem_staff'&&GS.cosmetics.robe==='meruem_coat'&&GS.cosmetics.hat==='meruem_brain';
}

function equipMeruemSet(){
  if(_meruemActive)return;
  _dismissMinionsForDevSet();
  if(!GS.cosmetics)GS.cosmetics={};
  // If Rikker or Melting is active, unequip first
  if(_rikkerActive)unequipRikkerSet();
  if(_meltingActive)unequipMeltingSet();
  if(_esojActive)unequipEsojSet();
  // Ensure all dev sets are in purchased so the Hero Panel can switch between them freely
  if(!GS.inv.purchased)GS.inv.purchased=new Set();
  ['rikker_sword','rikker_armor','rikker_helm','meruem_staff','meruem_coat','meruem_brain','melting_hammer','melting_unarmored','melting_helm','esoj_bow','esoj_armor','esoj_hat','zephyr_dagger','zephyr_cloak','zephyr_hood'].forEach(id=>GS.inv.purchased.add(id));

  // Persist original spells
  GS.cosmetics._meruemOrigSpells=[...(GS.equippedSpellsOrdered||[...GS.equippedSpells])].filter(k=>!SPELLS[k]?.paladinOnly&&!SPELLS[k]?.barbarianOnly&&!SPELLS[k]?.meruemOnly&&!SPELLS[k]?.rangerOnly);
  _meruemOrigSpells={spells:new Set(GS.equippedSpells),ordered:[...(GS.equippedSpellsOrdered||[])]};

  // Lock in cosmetics
  GS.cosmetics.staff='meruem_staff';
  GS.cosmetics.robe='meruem_coat';
  GS.cosmetics.hat='meruem_brain';

  // Meruem's Brain: wipe all spells — strike only
  GS.equippedSpells=new Set();
  GS.equippedSpellsOrdered=[];

  // Disable auto
  autoMode=false;_updateAutoBtn();

  _meruemActive=true;
  _meruemInvincibleCycle=0;
  _meruemGhostNextT=0;
  _meruemHiccupNextT=0;
  if(RS){RS._eqSpells=null;buildSpellBar();}
  saveGame();renderHub();
  showToast("🧠 Meruem's Set equipped — the King stumbles forth!");
}

function unequipMeruemSet(){
  if(!_meruemActive)return;
  cancelAllAscensions();
  if(GS.cosmetics){
    if(GS.cosmetics.staff==='meruem_staff')GS.cosmetics.staff='staff_bone';
    if(GS.cosmetics.robe==='meruem_coat')GS.cosmetics.robe=null;
    if(GS.cosmetics.hat==='meruem_brain')GS.cosmetics.hat=null;
  }
  // Restore spells
  const orig=(_meruemOrigSpells?.ordered?.length?_meruemOrigSpells.ordered:null)
    ||(GS.cosmetics?._meruemOrigSpells?.length?GS.cosmetics._meruemOrigSpells:null)
    ||['tollTheDead','chillTouch','blight','animateDead'];
  GS.equippedSpells=new Set(orig.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly));
  GS.equippedSpellsOrdered=orig.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly);
  if(GS.cosmetics)delete GS.cosmetics._meruemOrigSpells;
  _meruemOrigSpells=null;
  _meruemActive=false;
  _meruemInvincibleUntil=0;
  if(RS){RS._eqSpells=null;buildSpellBar();RS._dimpleGhost=null;}
  saveGame();renderHub();
  showToast('🥼 Meruem\'s Set removed — the Necromancer sobers up.');
}

// Called each frame from loop()
function tickMeruemEffects(t,dt){
  if(!_meruemActive||!RS||RS.done||RS.necro.dead)return;
  const n=RS.necro;

  // Seed timers on first frame of raid
  if(_meruemInvincibleCycle===0){_meruemInvincibleCycle=t+5;}
  if(_meruemGhostNextT===0){_meruemGhostNextT=t+10;}
  if(_meruemHiccupNextT===0){_meruemHiccupNextT=t+0.5;}

  // ── Lab Coat: 1s invincibility every 5s ──
  if(t>=_meruemInvincibleCycle){
    _meruemInvincibleUntil=t+1;
    _meruemInvincibleCycle=t+5;
    RS.parts.push({k:'flt',x:n.x,y:n.y-30,txt:'🛡 INVINCIBLE',col:'#86efac',life:1,ml:1,vy:-28});
  }

  // ── Drunken Staff: hiccup bubbles ──
  if(t>=_meruemHiccupNextT){
    _meruemHiccupNextT=t+0.55+Math.random()*0.7;
    const count=2+Math.floor(Math.random()*2);
    for(let i=0;i<count;i++){
      RS.parts.push({
        k:'hiccup',
        x:n.x+(Math.random()-0.5)*12,
        y:n.y-14-Math.random()*6,
        vx:(Math.random()-0.5)*10,
        vy:-20-Math.random()*12,
        r:3+Math.random()*3,
        life:1.0+Math.random()*0.4,
        ml:1.4
      });
    }
  }

  // ── Lab Coat Ghost: Dimple appears every 10s for 3.5s ──
  if(t>=_meruemGhostNextT&&!RS._dimpleGhost){
    _meruemGhostNextT=t+10;
    RS._dimpleGhost={x:n.x,y:n.y,spawnT:t,dur:3.5};
  }
}

// ═══════════════════════════════════════════════════════════════
//  MELTING'S SET — Barbarian Goliath Transformation System
// ═══════════════════════════════════════════════════════════════
const MELTING_SET_IDS = ['melting_hammer','melting_unarmored','melting_helm'];
const MELTING_BARBARIAN_SPELLS = ['rageStrike','stonesEndurance','unarmoredDef','recklessSwing','dangerSense'];

let _meltingActive      = false;
let _meltingOrigSpells  = null;
let _meltingRageUntil   = 0;   // game-time: rage buff active until
let _meltingRageCycle   = 0;   // game-time: next auto-rage trigger

function isMeltingSetEquipped(){
  if(!GS.cosmetics)return false;
  return GS.cosmetics.staff==='melting_hammer'&&GS.cosmetics.robe==='melting_unarmored'&&GS.cosmetics.hat==='melting_helm';
}

function equipMeltingSet(){
  if(_meltingActive)return;
  _dismissMinionsForDevSet();
  if(!GS.cosmetics)GS.cosmetics={};
  if(_rikkerActive)unequipRikkerSet();
  if(_meruemActive)unequipMeruemSet();
  if(_esojActive)unequipEsojSet();
  if(!GS.inv.purchased)GS.inv.purchased=new Set();
  ['melting_hammer','melting_unarmored','melting_helm','rikker_sword','rikker_armor','rikker_helm','meruem_staff','meruem_coat','meruem_brain','esoj_bow','esoj_armor','esoj_hat','zephyr_dagger','zephyr_cloak','zephyr_hood'].forEach(id=>GS.inv.purchased.add(id));

  GS.cosmetics._meltingOrigSpells=[...(GS.equippedSpellsOrdered||[...GS.equippedSpells])].filter(k=>!SPELLS[k]?.barbarianOnly&&!SPELLS[k]?.paladinOnly&&!SPELLS[k]?.meruemOnly&&!SPELLS[k]?.rangerOnly);
  _meltingOrigSpells={spells:new Set(GS.equippedSpells),ordered:[...(GS.equippedSpellsOrdered||[])]};

  GS.cosmetics.staff='melting_hammer';
  GS.cosmetics.robe='melting_unarmored';
  GS.cosmetics.hat='melting_helm';

  // Dismiss raid party — Goliath marches alone
  const dismissed=[...GS.raidParty];
  GS.raidParty.clear();
  if(RS&&RS.minions){RS.minions.forEach(mk=>{if(!mk.dead)mk.dead=true;});RS.minions=[];}
  if(dismissed.length>0)showToast('🔨 All minions sent to catacombs — the Goliath marches alone!');

  // Replace spells with barbarian abilities
  GS.equippedSpells=new Set(MELTING_BARBARIAN_SPELLS);
  GS.equippedSpellsOrdered=[...MELTING_BARBARIAN_SPELLS];

  // Apply 2× HP from helm
  const baseHP=Math.round((100+GS.necroLv*12+(GS.hasPassive(8)?50:0))*GS.prestHPMult());
  GS.necroMaxHP=Math.round(baseHP*2.0);
  GS.necroHP=GS.necroMaxHP;

  _meltingActive=true;
  _meltingRageUntil=0;_meltingRageCycle=0;
  if(RS){RS._eqSpells=null;buildSpellBar();RS.necro.maxHP=GS.necroMaxHP;RS.necro.hp=GS.necroMaxHP;}
  saveGame();renderHub();
  showToast("🔨 Melting's Set equipped — the Goliath charges forth!");
}

function unequipMeltingSet(){
  if(!_meltingActive)return;
  cancelAllAscensions();
  if(GS.cosmetics){
    if(GS.cosmetics.staff==='melting_hammer')GS.cosmetics.staff='staff_bone';
    if(GS.cosmetics.robe==='melting_unarmored')GS.cosmetics.robe=null;
    if(GS.cosmetics.hat==='melting_helm')GS.cosmetics.hat=null;
  }
  const origOrdered=(_meltingOrigSpells?.ordered?.length?_meltingOrigSpells.ordered:null)
    ||(GS.cosmetics?._meltingOrigSpells?.length?GS.cosmetics._meltingOrigSpells:null)
    ||['tollTheDead','chillTouch','blight','animateDead'];
  GS.equippedSpells=new Set(origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].paladinOnly&&!SPELLS[k].rangerOnly));
  GS.equippedSpellsOrdered=origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].paladinOnly&&!SPELLS[k].rangerOnly);
  if(GS.cosmetics)delete GS.cosmetics._meltingOrigSpells;
  _meltingOrigSpells=null;

  const restoredBase=Math.round((100+GS.necroLv*12+(GS.hasPassive(8)?50:0))*GS.prestHPMult());
  const _armorItem=SHOP_ITEMS.equipment.find(i=>i.id===GS.inv.equipped.armor);
  GS.necroMaxHP=restoredBase+(_armorItem?.stats?.maxHP||0);
  GS.necroHP=Math.min(GS.necroHP,GS.necroMaxHP);

  _meltingActive=false;
  _meltingRageUntil=0;
  if(RS){RS._eqSpells=null;buildSpellBar();RS.necro.maxHP=GS.necroMaxHP;RS.necro.hp=Math.min(RS.necro.hp,GS.necroMaxHP);}
  saveGame();renderHub();
  showToast("🪨 Melting's Set removed — the Necromancer returns.");
}

// Called each frame from loop()
function tickMeltingEffects(t,dt){
  if(!_meltingActive||!RS||RS.done||RS.necro.dead)return;
  const n=RS.necro;

  // Seed rage cycle on first frame
  if(_meltingRageCycle===0){_meltingRageCycle=t+8;}

  // Auto-rage every 20s for 8s
  if(t>=_meltingRageCycle&&t>_meltingRageUntil){
    _meltingRageUntil=t+8;
    _meltingRageCycle=t+20;
    RS.parts.push({k:'flt',x:n.x,y:n.y-30,txt:'🔴 RAGE!',col:'#ef4444',life:1.5,ml:1.5,vy:-28});
  }
}

function isMeltingRaging(t){
  return _meltingActive&&t<_meltingRageUntil;
}

// ═══════════════════════════════════════════════════════════════
//  ESOJ AWEL — Ranger Set System
// ═══════════════════════════════════════════════════════════════
let _esojActive=false;
let _esojOrigSpells=null;
let _esojHealAcc=0;
const ESOJ_SET_IDS=['esoj_bow','esoj_armor','esoj_hat'];
const ESOJ_RANGER_SPELLS=['huntersMark','curePetWounds','ensnare','fogCloud','multishot'];
const _ESOJ_HEAL_RANGE=180; // longbow range
const _ESOJ_HEAL_RATE=3;    // HP/s per ally

function isEsojSetEquipped(){
  if(!GS.cosmetics)return false;
  return GS.cosmetics.staff==='esoj_bow'&&GS.cosmetics.robe==='esoj_armor'&&GS.cosmetics.hat==='esoj_hat';
}

function equipEsojSet(){
  if(_rikkerActive)unequipRikkerSet();
  if(_meruemActive)unequipMeruemSet();
  if(_meltingActive)unequipMeltingSet();
  _dismissMinionsForDevSet();
  _esojActive=true;
  // Add all dev items to purchased
  ['rikker_sword','rikker_armor','rikker_helm','meruem_staff','meruem_coat','meruem_brain','melting_hammer','melting_unarmored','melting_helm','esoj_bow','esoj_armor','esoj_hat','zephyr_dagger','zephyr_cloak','zephyr_hood'].forEach(id=>GS.inv.purchased.add(id));
  GS.cosmetics.staff='esoj_bow';GS.cosmetics.robe='esoj_armor';GS.cosmetics.hat='esoj_hat';
  // Dismiss raid party
  if(RS&&RS._activeHeroes)RS._activeHeroes=[];
  // Save original spells, swap to ranger
  GS.cosmetics._esojOrigSpells=[...(GS.equippedSpellsOrdered||[...GS.equippedSpells])].filter(k=>!SPELLS[k]?.paladinOnly&&!SPELLS[k]?.barbarianOnly&&!SPELLS[k]?.meruemOnly&&!SPELLS[k]?.rangerOnly);
  GS.equippedSpells=new Set(ESOJ_RANGER_SPELLS);
  GS.equippedSpellsOrdered=[...ESOJ_RANGER_SPELLS];
  // Apply 1.66× HP
  GS.necroMaxHP=Math.round(GS.necroMaxHP*1.66);
  GS.necroHP=GS.necroMaxHP;
  showToast('🏹 Esoj Awel\'s Ranger Set equipped!');
  if(typeof buildSpellBar==='function')buildSpellBar();
  saveGame();
}

function unequipEsojSet(){
  if(!_esojActive)return;
  cancelAllAscensions();
  if(GS.cosmetics){
    if(GS.cosmetics.staff==='esoj_bow')GS.cosmetics.staff='staff_bone';
    if(GS.cosmetics.robe==='esoj_armor')GS.cosmetics.robe=null;
    if(GS.cosmetics.hat==='esoj_hat')GS.cosmetics.hat=null;
  }
  // Restore spells
  const origOrdered=GS.cosmetics._esojOrigSpells||['staffStrike','skeletonBolt','boneWall','darkPact','poisonNova'];
  GS.equippedSpells=new Set(origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly));
  GS.equippedSpellsOrdered=origOrdered.filter(k=>k&&SPELLS[k]&&!SPELLS[k].paladinOnly&&!SPELLS[k].barbarianOnly&&!SPELLS[k].meruemOnly&&!SPELLS[k].rangerOnly);
  delete GS.cosmetics._esojOrigSpells;
  // Restore HP
  GS.necroMaxHP=Math.round(GS.necroMaxHP/1.66);
  GS.necroHP=Math.min(GS.necroHP,GS.necroMaxHP);
  _esojActive=false;
  showToast('Ranger set removed.');
  if(typeof buildSpellBar==='function')buildSpellBar();
  saveGame();
}

function tickEsojHealingAura(dt,t){
  if(!_esojActive||!RS||RS.done||RS.necro.dead)return;
  _esojHealAcc+=dt;if(_esojHealAcc<0.5)return;
  const tickDt=_esojHealAcc;_esojHealAcc=0;
  const n=RS.necro;
  const healMult=_entActive?2:1; // Ent form doubles healing
  const healAmt=Math.round(_ESOJ_HEAL_RATE*tickDt*healMult);
  // Heal all allies within longbow range
  if(RS.minions)RS.minions.forEach(m=>{
    if(m.dead||hyp(n.x,n.y,m.x,m.y)>_ESOJ_HEAL_RANGE)return;
    m.hp=Math.min(m.maxHP,m.hp+healAmt);
    if(Math.random()<0.08)RS.parts.push({k:'flt',x:m.x,y:m.y-12,txt:'✨',col:'#93c5fd',life:0.5,ml:0.5,vy:-14});
  });
  if(RS._activeHeroes)RS._activeHeroes.forEach(h=>{
    if(h.dead||hyp(n.x,n.y,h.x,h.y)>_ESOJ_HEAL_RANGE)return;
    h.hp=Math.min(h.maxHP,h.hp+healAmt);
    if(Math.random()<0.12)RS.parts.push({k:'flt',x:h.x,y:h.y-18,txt:'✨',col:'#93c5fd',life:0.6,ml:0.6,vy:-16});
  });
  if(RS.activePet&&RS.activePet.hp>0&&hyp(n.x,n.y,RS.activePet.x,RS.activePet.y)<=_ESOJ_HEAL_RANGE){
    RS.activePet.hp=Math.min(RS.activePet.maxHP||RS.activePet.hp,RS.activePet.hp+healAmt);
    if(Math.random()<0.1)RS.parts.push({k:'flt',x:RS.activePet.x,y:RS.activePet.y-14,txt:'✨',col:'#93c5fd',life:0.5,ml:0.5,vy:-14});
  }
  // Self heal
  n.hp=Math.min(n.maxHP,n.hp+healAmt);
}

// ═══════════════════════════════════════════════════════════════
//  ASCENSION FORMS — Level 20 transformations (like Samma'el)
// ═══════════════════════════════════════════════════════════════
let _seraphActive=false;       // Rikker → Seraph
let _heroOfTimeActive=false;   // Meruem → Hero of Time
let _thundergodActive=false;   // Melting → Thundergod
let _entActive=false;          // Esoj → Ent
const _ASCEND_DRAIN_RATE=3;    // HP/s drain (same as Samma'el)
let _seraphDrainAcc=0;
let _hotCdMult=1;              // Hero of Time progressive CD multiplier
let _hotIdleTimer=0;           // time since last HoT attack
let _thunderKillPause=0;       // game-time: HP drain paused until

function isAnyAscension(){return _seraphActive||_heroOfTimeActive||_thundergodActive||_entActive;}

// Helper for party panel — returns ascension button config for a hero (cross-block safe)
const _HERO_ASCEND_SPRITE={rikker:'rikker_seraph',meruem:'meruem_hero_of_time',melting:'melting_thor',esoj:'esoj_ent'};
function getHeroAscensionConfig(heroId){
  const heroLv=typeof getHeroLevel==='function'?getHeroLevel(heroId):(GS.necroLv||1);
  if(heroLv<20)return null;
  const h=RS&&RS._activeHeroes&&RS._activeHeroes.find(hh=>hh.heroId===heroId&&!hh.dead);
  const map={rikker:['toggleSeraphForm','👼'],meruem:['toggleHeroOfTimeForm','🗡️'],melting:['toggleThundergodForm','⚡'],esoj:['toggleEntForm','🌳']};
  const a=map[heroId];if(!a)return null;
  return{active:!!(h&&h._ascended),ico:a[1],fn:a[0],setReady:true};
}
function getAscensionSprite(){
  if(_seraphActive)return 'rikker_seraph';
  if(_heroOfTimeActive)return 'meruem_hero_of_time';
  if(_thundergodActive)return 'melting_thor';
  if(_entActive)return 'esoj_ent';
  return null;
}

// ── Rikker: Rise of Seraph ──
function toggleSeraphForm(){
  const _rikkerInParty=RS&&RS._activeHeroes&&RS._activeHeroes.some(h=>h.heroId==='rikker'&&!h.dead);
  if((!_rikkerActive&&!_rikkerInParty)||GS.necroLv<20){showToast('⚔ Requires Rikker in your party at Level 20!');return;}
  const h=RS&&RS._activeHeroes&&RS._activeHeroes.find(hh=>hh.heroId==='rikker'&&!hh.dead);
  if(!h)return;
  h._ascended=!h._ascended;
  if(h._ascended){
    h.maxHP=Math.round(h.maxHP*2);h.hp=Math.min(Math.round(h.hp*2),h.maxHP);
    showToast('👼 THE SERAPH RISES — Holy Flame burns!');
    flash('👼 SERAPH FORM',18,PALETTE.holy);
  }else{
    h.maxHP=Math.round(h.maxHP/2);h.hp=Math.min(h.hp,h.maxHP);
    showToast('Seraph form released.');
  }
  if(typeof updatePartyPanel==='function')updatePartyPanel();
}

function tickSeraphDrain(dt,t){
  if(!_seraphActive||!RS||RS.done||RS.necro.dead)return;
  _seraphDrainAcc+=dt;if(_seraphDrainAcc<0.25)return;
  const tickDt=_seraphDrainAcc;_seraphDrainAcc=0;
  const n=RS.necro;
  // Check if anyone in party is attacking (minions, heroes, pets)
  let partyAttacking=false;
  if(RS.minions)RS.minions.forEach(m=>{if(!m.dead&&m.lat&&t-m.lat<2)partyAttacking=true;});
  if(RS._activeHeroes)RS._activeHeroes.forEach(h=>{if(!h.dead&&h.lat&&t-h.lat<2)partyAttacking=true;});
  if(RS.activePet&&RS.activePet.hp>0&&RS.activePet._lastAtk&&t-RS.activePet._lastAtk<2)partyAttacking=true;
  // Holy burn (self-drain like Sammael) — only while in combat
  const burnDmg=_ASCEND_DRAIN_RATE*tickDt*1.2;
  n.hp=Math.max(1,n.hp-burnDmg);
  if(Math.random()<0.15)RS.parts.push({k:'flt',x:n.x,y:n.y-40,txt:'🔥',col:PALETTE.holy,life:0.6,ml:0.6,vy:-20});
  // If nobody is attacking, regenerate HP
  if(!partyAttacking){
    const regen=_ASCEND_DRAIN_RATE*tickDt*2;
    n.hp=Math.min(n.maxHP,n.hp+regen);
    if(Math.random()<0.1)RS.parts.push({k:'flt',x:n.x,y:n.y-50,txt:'💛 Regen',col:PALETTE.holy,life:0.8,ml:0.8,vy:-24});
  }
}

// ── Meruem: Rise of Hero of Time ──
function toggleHeroOfTimeForm(){
  const _meruemInParty=RS&&RS._activeHeroes&&RS._activeHeroes.some(h=>h.heroId==='meruem'&&!h.dead);
  if((!_meruemActive&&!_meruemInParty)||GS.necroLv<20){showToast('🧠 Requires Meruem in your party at Level 20!');return;}
  const h=RS&&RS._activeHeroes&&RS._activeHeroes.find(hh=>hh.heroId==='meruem'&&!hh.dead);
  if(!h)return;
  h._ascended=!h._ascended;
  if(h._ascended){
    h.maxHP=Math.round(h.maxHP*2);h.hp=Math.min(Math.round(h.hp*2),h.maxHP);
    showToast('🗡️ THE HERO OF TIME AWAKENS — Master Sword ready!');
    flash('🗡️ HERO OF TIME',18,'#22c55e');
  }else{
    h.maxHP=Math.round(h.maxHP/2);h.hp=Math.min(h.hp,h.maxHP);
    showToast('Hero of Time form released.');
  }
  if(typeof updatePartyPanel==='function')updatePartyPanel();
}

function tickHeroOfTimeDrain(dt,t){
  if(!_heroOfTimeActive||!RS||RS.done||RS.necro.dead)return;
  const n=RS.necro;
  // Progressive CD increase when attacking
  const lastAtk=RS.spellCDs['staffStrike']||0;
  const timeSinceAtk=t-lastAtk;
  if(timeSinceAtk<2){
    // Attacking — CDs get progressively longer
    _hotCdMult=Math.min(3.0,_hotCdMult+dt*0.15);
    _hotIdleTimer=0;
  }else{
    // Idle — CDs revert progressively
    _hotIdleTimer+=dt;
    if(_hotIdleTimer>1)_hotCdMult=Math.max(1.0,_hotCdMult-dt*0.3);
  }
}

function getHeroOfTimeCdMult(){return _heroOfTimeActive?_hotCdMult:1;}

// ── Melting: Rise of Thundergod ──
function toggleThundergodForm(){
  const _meltingInParty=RS&&RS._activeHeroes&&RS._activeHeroes.some(h=>h.heroId==='melting'&&!h.dead);
  if((!_meltingActive&&!_meltingInParty)||GS.necroLv<20){showToast('🔨 Requires Melting in your party at Level 20!');return;}
  const h=RS&&RS._activeHeroes&&RS._activeHeroes.find(hh=>hh.heroId==='melting'&&!hh.dead);
  if(!h)return;
  h._ascended=!h._ascended;
  if(h._ascended){
    h.maxHP=Math.round(h.maxHP*2);h.hp=Math.min(Math.round(h.hp*2),h.maxHP);
    showToast('⚡ THE THUNDERGOD DESCENDS — Mjǫllnir crackles!');
    flash('⚡ THUNDERGOD',18,'#3b82f6');
  }else{
    h.maxHP=Math.round(h.maxHP/2);h.hp=Math.min(h.hp,h.maxHP);
    showToast('Thundergod form released.');
  }
  if(typeof updatePartyPanel==='function')updatePartyPanel();
}

function tickThundergodDrain(dt,t){
  if(!_thundergodActive||!RS||RS.done||RS.necro.dead)return;
  const n=RS.necro;
  // Enraged drain — paused for 2s after each kill
  if(t<_thunderKillPause){
    if(Math.random()<0.05)RS.parts.push({k:'flt',x:n.x,y:n.y-50,txt:'⚡ Kill Surge',col:'#3b82f6',life:0.7,ml:0.7,vy:-22});
    return; // drain paused
  }
  const burnDmg=_ASCEND_DRAIN_RATE*dt*1.5;
  n.hp=Math.max(1,n.hp-burnDmg);
  if(Math.random()<0.12)RS.parts.push({k:'flt',x:n.x,y:n.y-40,txt:'⚡',col:'#ef4444',life:0.5,ml:0.5,vy:-18});
}

// Called from onEnemyKilled when thundergod lands the kill
function thundergodOnKill(t){
  if(!_thundergodActive)return;
  _thunderKillPause=t+2;
  RS.parts.push({k:'flt',x:RS.necro.x,y:RS.necro.y-55,txt:'⚡ DRAIN PAUSED 2s',col:'#3b82f6',life:1.2,ml:1.2,vy:-28});
}

// ── Esoj: Rise of the Ent ──
let _entDrainAcc=0;
function toggleEntForm(){
  const _esojInParty=RS&&RS._activeHeroes&&RS._activeHeroes.some(h=>h.heroId==='esoj'&&!h.dead);
  if((!_esojActive&&!_esojInParty)||GS.necroLv<20){showToast('🏹 Requires Esoj in your party at Level 20!');return;}
  const h=RS&&RS._activeHeroes&&RS._activeHeroes.find(hh=>hh.heroId==='esoj'&&!hh.dead);
  if(!h)return;
  h._ascended=!h._ascended;
  if(h._ascended){
    h.maxHP=Math.round(h.maxHP*2);h.hp=Math.min(Math.round(h.hp*2),h.maxHP);
    showToast('🌳 THE ENT AWAKENS — The forest rises!');
    flash('🌳 ENT FORM',18,'#22c55e');
  }else{
    h.maxHP=Math.round(h.maxHP/2);h.hp=Math.min(h.hp,h.maxHP);
    showToast('Ent form released.');
  }
  if(typeof updatePartyPanel==='function')updatePartyPanel();
}

function tickEntDrain(dt,t){
  if(!_entActive||!RS||RS.done||RS.necro.dead)return;
  _entDrainAcc+=dt;if(_entDrainAcc<0.25)return;
  const tickDt=_entDrainAcc;_entDrainAcc=0;
  const n=RS.necro;
  // Ent passive: HP regen aura is DOUBLED (handled in tickEsojHealingAura)
  // But Ent also doubles drain rate of OTHER ascended forms nearby (party mechanic)
  // Attack changes to boulders (handled in render)
  // No self-drain — the Ent is nature incarnate
}

function cancelAllAscensions(){
  if(_seraphActive){
    _seraphActive=false;_seraphDrainAcc=0;
    if(RS&&RS.necro){RS.necro.maxHP=Math.round(RS.necro.maxHP/2);RS.necro.hp=Math.min(RS.necro.hp,RS.necro.maxHP);}
    const btn=document.getElementById('asp_seraph');if(btn)btn.className='asp-btn asp-elite-off';
  }
  if(_heroOfTimeActive){
    _heroOfTimeActive=false;_hotCdMult=1;_hotIdleTimer=0;
    if(RS&&RS.necro){RS.necro.maxHP=Math.round(RS.necro.maxHP/2);RS.necro.hp=Math.min(RS.necro.hp,RS.necro.maxHP);}
    const btn=document.getElementById('asp_herotime');if(btn)btn.className='asp-btn asp-elite-off';
  }
  if(_thundergodActive){
    _thundergodActive=false;_thunderKillPause=0;
    if(RS&&RS.necro){RS.necro.maxHP=Math.round(RS.necro.maxHP/2);RS.necro.hp=Math.min(RS.necro.hp,RS.necro.maxHP);}
    const btn=document.getElementById('asp_thunder');if(btn)btn.className='asp-btn asp-elite-off';
  }
  if(_entActive){
    _entActive=false;_entDrainAcc=0;
    if(RS&&RS.necro){RS.necro.maxHP=Math.round(RS.necro.maxHP/2);RS.necro.hp=Math.min(RS.necro.hp,RS.necro.maxHP);}
    const btn=document.getElementById('asp_ent');if(btn)btn.className='asp-btn asp-elite-off';
  }
  // Also cancel any hero ascensions
  if(RS&&RS._activeHeroes){
    RS._activeHeroes.forEach(h=>{
      if(h._ascended){
        h.maxHP=Math.round(h.maxHP/2);h.hp=Math.min(h.hp,h.maxHP);
        h._ascended=false;
      }
    });
  }
}

// ── Hero Panel: detect set equip/unequip ──
saveHeroPanel=function(){
  if(!GS.cosmetics)GS.cosmetics={};
  const draftToSave=Object.assign({},_heroPanelDraft);
  if(!draftToSave.staff)draftToSave.staff='staff_bone';
  const hasAllRikker=draftToSave.staff==='rikker_sword'&&draftToSave.robe==='rikker_armor'&&draftToSave.hat==='rikker_helm';
  const hasAnyRikker=draftToSave.staff==='rikker_sword'||draftToSave.robe==='rikker_armor'||draftToSave.hat==='rikker_helm';
  const hasAllMeruem=draftToSave.staff==='meruem_staff'&&draftToSave.robe==='meruem_coat'&&draftToSave.hat==='meruem_brain';
  const hasAnyMeruem=draftToSave.staff==='meruem_staff'||draftToSave.robe==='meruem_coat'||draftToSave.hat==='meruem_brain';
  const hasAllMelting=draftToSave.staff==='melting_hammer'&&draftToSave.robe==='melting_unarmored'&&draftToSave.hat==='melting_helm';
  const hasAnyMelting=draftToSave.staff==='melting_hammer'||draftToSave.robe==='melting_unarmored'||draftToSave.hat==='melting_helm';
  const hasAllEsoj=draftToSave.staff==='esoj_bow'&&draftToSave.robe==='esoj_armor'&&draftToSave.hat==='esoj_hat';
  const hasAnyEsoj=draftToSave.staff==='esoj_bow'||draftToSave.robe==='esoj_armor'||draftToSave.hat==='esoj_hat';

  // Switching TO Esoj
  if(hasAnyEsoj&&!_esojActive){
    _heroPanelDraft.staff='esoj_bow';_heroPanelDraft.robe='esoj_armor';_heroPanelDraft.hat='esoj_hat';
    Object.assign(GS.cosmetics,_heroPanelDraft);
    closeHeroPanel();equipEsojSet();return;
  }
  // Unequipping Esoj (back to normal)
  if(_esojActive&&!hasAllEsoj&&!hasAnyRikker&&!hasAnyMeruem&&!hasAnyMelting){
    closeHeroPanel();unequipEsojSet();return;
  }
  // Switching TO Melting
  if(hasAnyMelting&&!_meltingActive){
    _heroPanelDraft.staff='melting_hammer';_heroPanelDraft.robe='melting_unarmored';_heroPanelDraft.hat='melting_helm';
    Object.assign(GS.cosmetics,_heroPanelDraft);
    closeHeroPanel();equipMeltingSet();return;
  }
  // Unequipping Melting (back to normal)
  if(_meltingActive&&!hasAllMelting&&!hasAnyRikker&&!hasAnyMeruem&&!hasAnyEsoj){
    closeHeroPanel();unequipMeltingSet();return;
  }
  // Switching TO Meruem (handles Rikker→Meruem: equipMeruemSet unequips Rikker internally)
  if(hasAnyMeruem&&!_meruemActive){
    _heroPanelDraft.staff='meruem_staff';_heroPanelDraft.robe='meruem_coat';_heroPanelDraft.hat='meruem_brain';
    Object.assign(GS.cosmetics,_heroPanelDraft);
    closeHeroPanel();
    equipMeruemSet();
    return;
  }
  // Unequipping Meruem (back to normal)
  if(_meruemActive&&!hasAllMeruem&&!hasAnyRikker&&!hasAnyMelting&&!hasAnyEsoj){
    closeHeroPanel();unequipMeruemSet();return;
  }
  // Switching TO Rikker (handles Meruem→Rikker: equipRikkerSet unequips Meruem internally)
  if(hasAnyRikker&&!_rikkerActive){
    _heroPanelDraft.staff='rikker_sword';_heroPanelDraft.robe='rikker_armor';_heroPanelDraft.hat='rikker_helm';
    Object.assign(GS.cosmetics,_heroPanelDraft);
    closeHeroPanel();equipRikkerSet();return;
  }
  // Unequipping Rikker (back to normal)
  if(_rikkerActive&&!hasAllRikker&&!hasAnyMelting&&!hasAnyMeruem&&!hasAnyEsoj){
    closeHeroPanel();unequipRikkerSet();return;
  }
  // Normal cosmetic save (no set involved)
  Object.assign(GS.cosmetics,draftToSave);
  const nameEl=document.getElementById('heroPanelName');
  if(nameEl&&nameEl.value.trim())GS.necroName=nameEl.value.trim();
  saveGame();showToast('🪞 Appearance saved!');closeHeroPanel();
};

function claimDevGift() {
  const inp = document.getElementById('devGiftInput');
  const msg = document.getElementById('devGiftMsg');
  if (!inp || !msg) return;
  const code = inp.value.trim().toUpperCase();
  const gift = DEV_GIFT_CODES[code];
  if (!gift) {
    msg.style.color = '#f87171';
    msg.textContent = '✕ The raven does not recognize this code.';
    return;
  }
  if (!GS.devUnlocks) GS.devUnlocks = new Set();
  if (GS.devUnlocks.has(code)) {
    msg.style.color = '#fbbf24';
    msg.textContent = '⬦ Already claimed.';
    return;
  }
  GS.devUnlocks.add(code);
  // Add cosmetic items to purchased set
  (gift.items||[]).forEach(id => {
    if (!GS.inv.purchased) GS.inv.purchased = new Set();
    GS.inv.purchased.add(id);
  });
  // Add dev familiars to inventory (immortal, so no petCount needed)
  (gift.familiars||[]).forEach(id => {
    if (!GS.inv.familiars) GS.inv.familiars = new Set();
    GS.inv.familiars.add(id);
    // immortal pets don't use petCounts, but set 1 so hasPets sees them
    if (!GS.inv.petCounts) GS.inv.petCounts = {};
    // don't overwrite existing stock, just ensure they're known
  });
  // Auto-equip cosmetically if cosmetics not yet set
  if (!GS.cosmetics) GS.cosmetics = {};
  if (!GS.cosmetics.robe && (gift.items||[]).includes('robe_white')) GS.cosmetics.robe = 'robe_white';
  if (!GS.cosmetics.hat  && (gift.items||[]).includes('hat_wizard'))  GS.cosmetics.hat  = 'hat_wizard';
  if (!GS.cosmetics.staff&& (gift.items||[]).includes('staff_white')) GS.cosmetics.staff= 'staff_white';
  msg.style.color = '#86efac';
  msg.textContent = gift.message;
  if (typeof gift.onClaim === 'function') gift.onClaim();
  saveGame();
  renderHub();
  setTimeout(closeDevGiftMenu, 2200);
}

// ═══════════════════════════════════════════════════════════════
//  HERO PANEL — appearance editor
// ═══════════════════════════════════════════════════════════════
let _heroPanelDraft = {};

// ═══════════════════════════════════════════════════════
//  HUB PANEL OVERLAY (triggered from throne in castle)
// ═══════════════════════════════════════════════════════
function openHubPanel(){
  const overlay=document.getElementById('hubPanelOverlay');
  if(!overlay)return;
  // Populate stats
  document.getElementById('hpBones').textContent=GS.bones;
  document.getElementById('hpGold').textContent=fmtWallet(GS.wallet);
  document.getElementById('hpLvl').textContent='Lv.'+GS.necroLv;
  if(GS.necroLv>=20){
    document.getElementById('hpXP').textContent='MAX';
    document.getElementById('hpXPnext').textContent='MAX';
  }else{
    document.getElementById('hpXP').textContent=GS.necroXP;
    document.getElementById('hpXPnext').textContent=Math.round(XP_TABLE[Math.min(GS.necroLv,19)]*GS.prestXPMult());
  }
  const ppEl=document.getElementById('hpPrestige');
  if(ppEl){if(GS.prestige>0){ppEl.style.display='';const _isA=GS.prestige>=11;ppEl.textContent=`${_isA?'🌟':'★'}${GS.prestige} ${PRESTIGE_NAMES[Math.min(GS.prestige,19)]||'Ascended'}`;if(_isA)ppEl.style.color='#c084fc';}else ppEl.style.display='none';}
  // Prestige used to be reachable only from the Hub screen; it lives here now
  const prRow=document.getElementById('hpPrestigeRow');if(prRow)prRow.style.display=(GS.necroLv>=20&&GS.prestige<20)?'':'none';
  const titleEl=document.getElementById('hubPanelTitle');
  if(titleEl)titleEl.textContent=GS.prestige>0?`☠ ${PRESTIGE_NAMES[Math.min(GS.prestige,19)]||'Ascended'}'s Domain ☠`:'☠ Necromancer\'s Domain ☠';
  // Equipment section (full: Hat, Robes, Staff, Pets, Dev Pet)
  const gearEl=document.getElementById('hubPanelGear');
  if(gearEl){
    const cosm=GS.cosmetics||{};
    const staffId=cosm.staff||GS.inv.equipped.staff;
    const staff=SHOP_ITEMS.equipment.find(i=>i.id===staffId);
    const staffStr=staff?`${staff.ico} ${staff.name}`:'🦴 Bone Staff';
    const robeId=cosm.robe||GS.inv.equipped.armor;
    const robe=robeId?SHOP_ITEMS.equipment.find(i=>i.id===robeId):null;
    const robeStr=robe?`${robe.ico} ${robe.name}`:'🩹 Default Robes';
    const hatId=cosm.hat;
    const hat=hatId?SHOP_ITEMS.equipment.find(i=>i.id===hatId):null;
    const hatStr=hat?`${hat.ico} ${hat.name}`:'—';
    const acc=GS.inv.equipped.accessory?SHOP_ITEMS.equipment.find(i=>i.id===GS.inv.equipped.accessory):null;
    const famsArr=[...GS.inv.familiars].map(f=>SHOP_ITEMS.familiars.find(i=>i.id===f)).filter(Boolean);
    const petsStr=famsArr.length?famsArr.map(f=>`${f.ico} ${f.name}`).join(', '):'None';
    let devPetStr='None';
    if(GS.devPet){const dp=GS.devPet;const salLv=dp.lv||1;const salNm=typeof salName==='function'?salName(salLv):'Fire Salamander';devPetStr=`🔥 ${salNm} (Lv.${salLv})`;}
    gearEl.innerHTML=`
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(245,158,11,.2)">▸ Equipment</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:10px;font-family:'Almendra','Cinzel',serif">
      <span style="color:var(--dim)">Hat</span><span style="color:var(--bone)">${hatStr}</span>
      <span style="color:var(--dim)">Robes</span><span style="color:var(--bone)">${robeStr}</span>
      <span style="color:var(--dim)">Staff</span><span style="color:var(--bone)">${staffStr}</span>
      ${acc?`<span style="color:var(--dim)">Accessory</span><span style="color:var(--bone)">${acc.ico} ${acc.name}</span>`:''}
      <span style="color:var(--dim)">Pets</span><span style="color:var(--bone)">${petsStr}</span>
      <span style="color:var(--dim)">Dev Pet</span><span style="color:var(--glow)">${devPetStr}</span>
    </div>`;
  }
  // Passive skills — interactive checkboxes
  const pl=document.getElementById('hubPanelPassives');
  if(pl){
    pl.innerHTML='';
    let hpUnlocked=0;
    for(let n=1;n<=10;n++){
      const p=PASSIVES[n];if(!p)continue;
      const unlocked=GS.necroLv>=p.unlockLv;
      if(!unlocked){
        // Show first locked passive as a preview
        if(hpUnlocked===n-1){
          const lr=document.createElement('div');
          lr.style.cssText='display:flex;align-items:center;gap:8px;padding:3px 0;opacity:0.35';
          lr.innerHTML=`<span style="width:14px;height:14px;flex-shrink:0;text-align:center;font-size:12px;color:#4b5563">🔒</span>
            <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#4b5563"><b>${p.name}</b>${n===10?' <span style="font-size:10px;color:#7f1d1d;margin-left:3px">ELITE</span>':''} <span style="font-size:9px">— Unlocks Lv.${p.unlockLv}</span></div>`;
          pl.appendChild(lr);
        }
        continue;
      }
      hpUnlocked++;
      const disabled=GS.passivesDisabled&&GS.passivesDisabled.has(n);
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:flex-start;gap:8px;padding:4px 0;cursor:pointer';
      const chk=document.createElement('input');
      chk.type='checkbox';chk.checked=!disabled;
      chk.style.cssText='accent-color:#a855f7;width:14px;height:14px;flex-shrink:0;margin-top:2px;cursor:pointer';
      const idx=n;
      chk.onchange=()=>{
        if(chk.checked){if(GS.passivesDisabled)GS.passivesDisabled.delete(idx);}
        else{if(!GS.passivesDisabled)GS.passivesDisabled=new Set();GS.passivesDisabled.add(idx);}
        if(typeof SETTINGS!=='undefined'&&SETTINGS.autoSave)saveGame(false);
        // Re-render both hub panel passives and hub sidebar
        openHubPanel();
        if(typeof renderHub==='function')renderHub();
      };
      const lbl=document.createElement('div');
      lbl.style.cssText=`font-family:'Almendra','Cinzel',serif;font-size:10px;color:${disabled?'#4b5563':'var(--bone)'}`;
      lbl.innerHTML=`✦ <b style="${disabled?'text-decoration:line-through;color:#6b7280':''}">${p.name}</b>${n===10?' <span style="font-size:12px;color:#ef4444;margin-left:4px">ELITE</span>':''} <span style="color:var(--dim);font-style:italic;font-family:\'IM Fell English\',serif;font-size:13px">${p.desc}</span>`;
      lbl.onclick=()=>{chk.checked=!chk.checked;chk.onchange();};
      row.appendChild(chk);row.appendChild(lbl);
      pl.appendChild(row);
    }
    if(!hpUnlocked)pl.innerHTML='<span style="color:var(--dim);font-style:italic">No passives yet. Reach Level 2!</span>';
  }
  {
    const nextP=Object.values(PASSIVES).find(p=>GS.necroLv<p.unlockLv);
    const lbl=document.getElementById('hpPassiveLbl');
    if(lbl){lbl.textContent=nextP?`Lv.${nextP.unlockLv} next`:'All passives unlocked';}
  }
  // Raid party
  const cap=armyCap(GS.necroLv);
  const raidIdxs=[...GS.raidParty].filter(i=>GS.skeletons[i]?.hp>0);
  const alive=GS.skeletons.filter(s=>s.hp>0).length;
  document.getElementById('hpArmyLbl').textContent=`${alive} raised · ${Math.min(raidIdxs.length,cap)}/${cap} raiding`;
  const emEl=document.getElementById('hpRosterEmpty'),grEl=document.getElementById('hpRosterGrid');
  if(!raidIdxs.length){emEl.style.display='';grEl.style.display='none';}
  else{
    emEl.style.display='none';grEl.style.display='grid';
    const counts={};raidIdxs.forEach(i=>{const t2=GS.skeletons[i].type;counts[t2]=(counts[t2]||0)+1;});
    grEl.innerHTML='';
    for(const[t,cnt]of Object.entries(counts)){
      const m=MINIONS[t],div=document.createElement('div');div.className='rc';
      const cv=document.createElement('canvas');cv.width=36;cv.height=50;cv.style.flexShrink='0';
      const cx=cv.getContext('2d');const isSmall=t==='skel_rat'||t==='skel_bat';
      cx.translate(18,isSmall?24:38);drawSprite(cx,t,0,0,isSmall?.6:.75,1);
      div.appendChild(cv);div.innerHTML+=`<div><div class="rc-name">${m.name}</div><div class="rc-cnt">×${cnt}</div></div>`;
      grEl.appendChild(div);
    }
  }
  overlay.style.display='flex';
}
function closeHubPanel(){
  const overlay=document.getElementById('hubPanelOverlay');
  if(overlay)overlay.style.display='none';
}

function openHeroPanel() {
  const el = document.getElementById('heroPanelModal');
  const bd = document.getElementById('heroPanelBdrop');
  if (!el) return;
  if (!GS.cosmetics) GS.cosmetics = {};
  _heroPanelDraft = Object.assign({robe:null,hat:null,staff:null}, GS.cosmetics);
  if(_heroPanelDraft.staff === 'staff_bone') _heroPanelDraft.staff = null;
  el.style.display = 'block';
  if(bd) bd.style.display = 'block';
  const nameEl=document.getElementById('heroPanelName');
  if(nameEl) nameEl.value=GS.necroName||'';
  _renderHeroPanelSlots();
  _renderHeroPanelPreview();
}

function closeHeroPanel() {
  const el = document.getElementById('heroPanelModal');
  const bd = document.getElementById('heroPanelBdrop');
  if (el) el.style.display = 'none';
  if (bd) bd.style.display = 'none';
}

function _renderHeroPanelSlots() {
  const container = document.getElementById('heroPanelSlots');
  if (!container) return;
  container.innerHTML = '';

  // Lich form — block all changes
  if(_sammAelActive){
    const lockBanner = document.createElement('div');
    lockBanner.style.cssText='background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.35);border-radius:2px;padding:10px 12px;font-family:"Almendra","Cinzel",monospace;font-size:11px;color:#fca5a5;text-align:center;margin-bottom:4px';
    lockBanner.innerHTML='☠ <strong>LICH FORM ACTIVE</strong><br><span style="color:#9ca3af;font-size:11px">Appearance is locked while transformed.<br>Deactivate Lich Form to change equipment.</span>';
    container.appendChild(lockBanner);
    return;
  }

  const SLOTS = [
    { key:'robe',  label:'Robes',    defaultId:null,          defaultLabel:'Default Robes',   ico:'🥷' },
    { key:'hat',   label:'Hat',      defaultId:null,          defaultLabel:'No Hat',          ico:'🎭' },
    { key:'staff', label:'Staff',    defaultId:'staff_bone',  defaultLabel:'Bone Staff',       ico:'🦴' },
  ];

  // Items by slot type
  // devOnly items only appear if explicitly claimed via Dev Gift code (added to purchased set)
  const _ownedOrFree = i => !i.devOnly && (GS.inv.purchased?.has(i.id) || i.price.gp===0);
  const _devOwned    = i => i.devOnly && GS.inv.purchased?.has(i.id);
  // Filter out staff_bone from list (it's already the default option)
  const staffItems = SHOP_ITEMS.equipment.filter(i=>i.type==='staff'&&i.id!=='staff_bone'&&(_ownedOrFree(i)||_devOwned(i)));
  const robeItems  = SHOP_ITEMS.equipment.filter(i=>i.type==='armor'&&(_ownedOrFree(i)||_devOwned(i)));
  const hatItems   = SHOP_ITEMS.equipment.filter(i=>i.type==='hat'  &&_devOwned(i));

  const itemsMap = { staff: staffItems, robe: robeItems, hat: hatItems };

  SLOTS.forEach(slot => {
    const items = itemsMap[slot.key] || [];
    const section = document.createElement('div');
    section.style.cssText = 'border:1px solid rgba(167,139,250,.2);border-radius:10px;overflow:hidden;margin-bottom:4px';

    // Current selection label
    const curSelId = _heroPanelDraft[slot.key];
    const curSelItem = items.find(i=>i.id===curSelId);
    const curLabel = curSelId===null||curSelId===undefined ? slot.defaultLabel : (curSelItem?.name||curSelId);
    const curIco = curSelId===null||curSelId===undefined ? slot.ico : (curSelItem?.ico||slot.ico);

    // Dropdown header — toggles open/closed
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(167,139,250,.1);cursor:pointer;user-select:none;font-family:Almendra,monospace';
    hdr.innerHTML = `<span style="font-size:14px">${curIco}</span>
      <div style="flex:1">
        <div style="font-size:12px;color:#7c6fad">${slot.label}</div>
        <div style="font-size:12px;color:#c4b5fd;margin-top:1px">${curLabel}</div>
      </div>
      <span class="hp-caret" style="color:#7c6fad;font-size:12px;transition:transform .2s">▼</span>`;

    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'display:none;flex-direction:column;background:rgba(8,2,20,.97)';

    let open = false;
    hdr.onclick = () => {
      open = !open;
      dropdown.style.display = open ? 'flex' : 'none';
      hdr.querySelector('.hp-caret').style.transform = open ? 'rotate(180deg)' : '';
    };
    section.appendChild(hdr);

    // Default row
    const defSel = _heroPanelDraft[slot.key] === null || _heroPanelDraft[slot.key] === undefined;
    const defRow = document.createElement('div');
    defRow.style.cssText = `display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;
      background:${defSel?'rgba(167,139,250,.12)':'transparent'};
      border-bottom:1px solid rgba(167,139,250,.07)`;
    defRow.innerHTML = `<span style="font-size:13px">${slot.ico}</span>
      <span style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${defSel?PALETTE.frameGlow:'#9ca3af'};flex:1">${slot.defaultLabel}</span>
      ${defSel?'<span style="color:#a78bfa">✓</span>':''}`;
    defRow.onclick = () => {
      const prev = _heroPanelDraft[slot.key];
      _heroPanelDraft[slot.key] = null;
      // If deselecting a set piece, clear the whole set
      if(prev==='rikker_sword'||prev==='rikker_armor'||prev==='rikker_helm'){
        _heroPanelDraft.staff=null; _heroPanelDraft.robe=null; _heroPanelDraft.hat=null;
      } else if(prev==='meruem_staff'||prev==='meruem_coat'||prev==='meruem_brain'){
        _heroPanelDraft.staff=null; _heroPanelDraft.robe=null; _heroPanelDraft.hat=null;
      }
      _renderHeroPanelSlots();
      _renderHeroPanelPreview();
    };
    dropdown.appendChild(defRow);

    items.forEach(item => {
      const sel = _heroPanelDraft[slot.key] === item.id;
      const row = document.createElement('div');
      row.style.cssText = `display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;
        background:${sel?'rgba(167,139,250,.12)':'transparent'};
        border-bottom:1px solid rgba(167,139,250,.05)`;
      row.innerHTML = `<span style="font-size:13px">${item.ico}</span>
        <div style="flex:1">
          <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${sel?PALETTE.frameGlow:'#9ca3af'}">${item.name}</div>
          ${item.devOnly?'<div style="font-size:11px;color:#fbbf24">✦ Dev Gift</div>':''}
        </div>
        ${sel?'<span style="color:#a78bfa">✓</span>':''}`;
      row.onclick = () => {
        // Clear any opposing set pieces before setting the new selection
        const wasRikker = _heroPanelDraft.staff==='rikker_sword'||_heroPanelDraft.robe==='rikker_armor'||_heroPanelDraft.hat==='rikker_helm';
        const wasMeruem = _heroPanelDraft.staff==='meruem_staff'||_heroPanelDraft.robe==='meruem_coat'||_heroPanelDraft.hat==='meruem_brain';
        const newIsRikker = item.id==='rikker_sword'||item.id==='rikker_armor'||item.id==='rikker_helm';
        const newIsMeruem = item.id==='meruem_staff'||item.id==='meruem_coat'||item.id==='meruem_brain';
        // If switching away from a set, wipe all its slots first
        if(wasRikker && !newIsRikker){ _heroPanelDraft.staff=null; _heroPanelDraft.robe=null; _heroPanelDraft.hat=null; }
        if(wasMeruem && !newIsMeruem){ _heroPanelDraft.staff=null; _heroPanelDraft.robe=null; _heroPanelDraft.hat=null; }
        _heroPanelDraft[slot.key] = item.id;
        // Auto-complete sets: picking any piece of a set locks in the whole set
        const d = _heroPanelDraft;
        if(newIsRikker){ d.staff='rikker_sword'; d.robe='rikker_armor'; d.hat='rikker_helm'; }
        else if(newIsMeruem){ d.staff='meruem_staff'; d.robe='meruem_coat'; d.hat='meruem_brain'; }
        _renderHeroPanelSlots();
        _renderHeroPanelPreview();
      };
      dropdown.appendChild(row);
    });

    if (items.length === 0 && slot.key !== 'staff') {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:8px 12px;font-family:Almendra,monospace;font-size:10px;color:#4b5563;text-align:center';
      empty.textContent = 'Unlock via Dev Gift codes';
      dropdown.appendChild(empty);
    }

    section.appendChild(dropdown);
    container.appendChild(section);
  });
}

function _renderHeroPanelPreview() {
  const cv = document.getElementById('heroPanelCanvas');
  if (!cv) return;
  const c2 = cv.getContext('2d');
  c2.clearRect(0,0,100,110);
  // Dark background
  c2.fillStyle='#0d0b1a';c2.fillRect(0,0,100,110);
  // Mirror frame
  c2.strokeStyle='#7c3aed';c2.lineWidth=2;c2.beginPath();c2.ellipse(50,55,44,50,0,0,Math.PI*2);c2.stroke();
  c2.fillStyle='rgba(124,58,237,.06)';c2.beginPath();c2.ellipse(50,55,44,50,0,0,Math.PI*2);c2.fill();
  if(_sammAelActive){
    // Lich form — draw Sammael sprite with eerie red tint
    c2.save();c2.translate(50,60);
    const _lichGlow=c2.createRadialGradient(0,0,0,0,0,38);
    _lichGlow.addColorStop(0,'rgba(200,0,0,.18)');_lichGlow.addColorStop(1,'rgba(0,0,0,0)');
    c2.fillStyle=_lichGlow;c2.beginPath();c2.arc(0,0,38,0,Math.PI*2);c2.fill();
    c2.scale(1.5,1.5);
    try{if(SPR.sammaels)SPR.sammaels(c2,Date.now()*.001,0);}catch(e){}
    c2.restore();
    // "LICH FORM" label
    c2.save();c2.font='bold 6px "Almendra","Cinzel",monospace';c2.fillStyle='#ef4444';c2.textAlign='center';
    c2.shadowColor='#ef4444';c2.shadowBlur=8;
    c2.fillText('☠ LICH FORM',50,104);c2.restore();
  } else {
    // Temporarily override cosmetics with draft and draw
    const prev = Object.assign({},GS.cosmetics);
    const prevMpCosm = window._mpCosm;
    window._mpCosm = null; // ensure SPR.necromancer reads GS.cosmetics (our draft), not co-op override
    GS.cosmetics = Object.assign({},_heroPanelDraft);
    c2.save();c2.translate(50,65);c2.scale(1.6,1.6);
    SPR.necromancer(c2,Date.now()*.001,0);
    c2.restore();
    GS.cosmetics = prev;
    window._mpCosm = prevMpCosm;
  }
}

// ═══════════════════════════════════════════════════════════════
//  CO-OP COSMETICS HELPERS
// ═══════════════════════════════════════════════════════════════
// Returns a cosmetics object for the local player to send over the wire
function _getLocalCosmetics() {
  return GS.cosmetics ? Object.assign({}, GS.cosmetics, { _isLich: !!_sammAelActive }) : { _isLich: !!_sammAelActive };
}

console.log('🐦 Co-op v2 loaded — shared map, team robes, rejoin support');

