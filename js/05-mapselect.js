// ═══════════════════════════════════════════════════════════
//  MAP SELECTOR POPUP
// ═══════════════════════════════════════════════════════════
function openMapSelector(){
  document.getElementById('mapSelectorPopup').style.display='flex';
}
function closeMapSelector(){
  document.getElementById('mapSelectorPopup').style.display='none';
}

// ═══════════════════════════════════════════════════════════
//  TAU'RI MAP  —  Pangaea Supercontinent
// ═══════════════════════════════════════════════════════════

// ── 20 regions arranged on a Pangaea landmass ──
var TAU_REGIONS=[
  // Eridu Alliance — Africa heartland (starting zone)
  {id:'tau_shire',       name:'Eridu',              lv:1, x:.48,y:.50, biome:'cemetery', terrain:'plains',   color:'#86efac', faction:'tau_shire'},
  {id:'tau_bree',        name:'Uruk',               lv:1, x:.42,y:.44, biome:'cemetery', terrain:'plains',   color:'#86efac', faction:'tau_shire'},
  // Shinar Kingdoms — N.America, S.America, Africa west
  {id:'tau_weatherhills',name:'Kur-Heights',        lv:2, x:.30,y:.16, biome:'cemetery', terrain:'mountain', color:'#9ca3af', faction:'tau_rohan'},
  {id:'tau_trollshaws',  name:'Cedar Wilds',        lv:2, x:.36,y:.24, biome:'forest',   terrain:'forest',   color:'#4ade80', faction:'tau_rohan'},
  {id:'tau_edoras',      name:'Lagash',             lv:5, x:.28,y:.58, biome:'cemetery', terrain:'plains',   color:PALETTE.holyDk, faction:'tau_rohan'},
  {id:'tau_helmsdeep',   name:'Walls of Ur',        lv:5, x:.24,y:.50, biome:'cemetery', terrain:'mountain', color:'#ca8a04', faction:'tau_rohan'},
  {id:'tau_fangorn',     name:'Grove of Enlil',     lv:6, x:.32,y:.70, biome:'forest',   terrain:'forest',   color:'#854d0e', faction:'tau_rohan'},
  {id:'tau_rohan',       name:'Plains of Shinar',   lv:7, x:.20,y:.40, biome:'cemetery', terrain:'desert',   color:'#f97316', faction:'tau_rohan'},
  // Realm of Enki — Eurasia
  {id:'tau_rivendell',   name:'Abzu-Haven',         lv:3, x:.62,y:.16, biome:'forest',   terrain:'forest',   color:'#22c55e', faction:'tau_elves'},
  {id:'tau_mistyN',      name:'Mount Mashu',        lv:3, x:.50,y:.12, biome:'forest',   terrain:'mountain', color:'#9ca3af', faction:'tau_elves'},
  {id:'tau_mirkwood',    name:'Irkalla-Wood',       lv:4, x:.72,y:.22, biome:'forest',   terrain:'swamp',    color:'#166534', faction:'tau_elves'},
  {id:'tau_lothlórien',  name:'Dilmun',             lv:4, x:.66,y:.32, biome:'forest',   terrain:'forest',   color:'#15803d', faction:'tau_elves'},
  // Etemenanki — India peninsula
  {id:'tau_minas_tirith',name:'Etemenanki',         lv:8, x:.66,y:.56, biome:'sanctum',  terrain:'mountain', color:'#c2410c', faction:'tau_gondor'},
  {id:'tau_ithilien',    name:'Gardens of Adapa',   lv:8, x:.58,y:.52, biome:'forest',   terrain:'forest',   color:'#9a3412', faction:'tau_gondor'},
  // Domain of Nergal — southern wastes / Antarctica
  {id:'tau_isengard',    name:'Babel-Forge',        lv:6, x:.44,y:.58, biome:'sanctum',  terrain:'wasteland',color:'#a16207', faction:'tau_mordor'},
  {id:'tau_osgiliath',   name:'Nineveh',            lv:7, x:.50,y:.64, biome:'sanctum',  terrain:'wasteland',color:'#ea580c', faction:'tau_mordor'},
  {id:'tau_gorgoroth',   name:'Wastes of Kur',      lv:9, x:.56,y:.74, biome:'sanctum',  terrain:'wasteland',color:'#ef4444', faction:'tau_mordor'},
  {id:'tau_minas_morgul',name:'The Ganzer',         lv:9, x:.50,y:.80, biome:'sanctum',  terrain:'tundra',   color:'#dc2626', faction:'tau_mordor'},
  {id:'tau_mordor',      name:'Domain of Nergal',   lv:9, x:.60,y:.68, biome:'sanctum',  terrain:'wasteland',color:'#b91c1c', faction:'tau_mordor'},
  {id:'tau_mount_doom',  name:'Forge of Destinies', lv:9, x:.58,y:.80, biome:'sanctum',  terrain:'mountain', color:PALETTE.dmgRedDeep, faction:'tau_mordor'},
];

const TAU_FACTIONS={
  tau_shire:  {name:'Eridu Alliance',  color:'#86efac', members:['tau_shire','tau_bree']},
  tau_rohan:  {name:'Shinar Kingdoms',      color:PALETTE.holyDk, members:['tau_weatherhills','tau_trollshaws','tau_edoras','tau_helmsdeep','tau_fangorn','tau_rohan']},
  tau_elves:  {name:'Realm of Enki',color:'#22c55e', members:['tau_rivendell','tau_mistyN','tau_mirkwood','tau_lothlórien']},
  tau_gondor: {name:'Etemenanki',     color:'#93c5fd', members:['tau_minas_tirith','tau_ithilien']},
  tau_mordor: {name:'Domain of Nergal',     color:'#ef4444', members:['tau_isengard','tau_osgiliath','tau_gorgoroth','tau_minas_morgul','tau_mordor','tau_mount_doom']},
};
const TAU_FACTION_ORDER=['tau_shire','tau_rohan','tau_elves','tau_gondor','tau_mordor'];

var TAU_REGION_RAID_MAP={
  'tau_shire':['tau_shire_easy','tau_shire_medium','tau_shire_hard'],
  'tau_bree':['tau_bree_easy','tau_bree_medium','tau_bree_hard'],
  'tau_weatherhills':['tau_weatherhills_easy','tau_weatherhills_medium','tau_weatherhills_hard'],
  'tau_trollshaws':['tau_trollshaws_easy','tau_trollshaws_medium','tau_trollshaws_hard'],
  'tau_rivendell':['tau_rivendell_easy','tau_rivendell_medium','tau_rivendell_hard'],
  'tau_mistyN':['tau_mistyN_easy','tau_mistyN_medium','tau_mistyN_hard'],
  'tau_mirkwood':['tau_mirkwood_easy','tau_mirkwood_medium','tau_mirkwood_hard'],
  'tau_lothlórien':['tau_lothlórien_easy','tau_lothlórien_medium','tau_lothlórien_hard'],
  'tau_edoras':['tau_edoras_easy','tau_edoras_medium','tau_edoras_hard'],
  'tau_helmsdeep':['tau_helmsdeep_easy','tau_helmsdeep_medium','tau_helmsdeep_hard'],
  'tau_isengard':['tau_isengard_easy','tau_isengard_medium','tau_isengard_hard'],
  'tau_fangorn':['tau_fangorn_easy','tau_fangorn_medium','tau_fangorn_hard'],
  'tau_rohan':['tau_rohan_easy','tau_rohan_medium','tau_rohan_hard'],
  'tau_osgiliath':['tau_osgiliath_easy','tau_osgiliath_medium','tau_osgiliath_hard'],
  'tau_minas_tirith':['tau_minas_tirith_easy','tau_minas_tirith_medium','tau_minas_tirith_hard'],
  'tau_ithilien':['tau_ithilien_easy','tau_ithilien_medium','tau_ithilien_hard'],
  'tau_gorgoroth':['tau_gorgoroth_easy','tau_gorgoroth_medium','tau_gorgoroth_hard'],
  'tau_minas_morgul':['tau_minas_morgul_easy','tau_minas_morgul_medium','tau_minas_morgul_hard'],
  'tau_mordor':['tau_mordor_easy','tau_mordor_medium','tau_mordor_hard'],
  'tau_mount_doom':['tau_mount_doom_easy','tau_mount_doom_medium','tau_mount_doom_hard'],
};

function tauFactionCleared(fId){
  const f=TAU_FACTIONS[fId];if(!f)return true;
  return f.members.every(id=>{const c=GS.conquered[id]||{};return c.easy&&c.medium&&c.hard;});
}
function tauFactionOf(regionId){return Object.keys(TAU_FACTIONS).find(f=>TAU_FACTIONS[f].members.includes(regionId))||null;}
function tauRegionVisible(r){return r.lv<=GS.necroLv;}
function tauRegionAccessible(r){
  if(r.lv>GS.necroLv)return false;
  const fi=TAU_FACTION_ORDER.indexOf(tauFactionOf(r.id));
  for(let i=0;i<fi;i++)if(!tauFactionCleared(TAU_FACTION_ORDER[i]))return false;
  return true;
}
function tauGetRegionRaids(region){
  const keys=TAU_REGION_RAID_MAP[region.id];
  if(keys){
    return keys.map((k,i)=>{
      const cfg=RAID_CONFIGS[k]||{};
      const diffLabel=['Easy','Medium','Hard'][i];
      const diffStyle=['easy','medium','hard'][i];
      return {key:k,diff:diffLabel,diffStyle,floors:cfg.floors||3,scale:1.0,minLv:region.lv,name:cfg.name,ico:cfg.ico,bossKey:cfg.bossKey};
    });
  }
  return [];
}

// ── TAU'RI map state ──
const TAU={zoom:1,panX:0,panY:0,_raidBtns:[],_nameBtns:[],_t0:Date.now()};
const TAU_MAP_SZ=600;
let _tauRaf=null;

function tauToScreen(rx,ry,W,H){
  const cx=W/2+TAU.panX,cy=H/2+TAU.panY;
  return {x:cx+(rx-.5)*TAU_MAP_SZ*TAU.zoom, y:cy+(ry-.5)*TAU_MAP_SZ*TAU.zoom};
}
function tauFromScreen(sx,sy,W,H){
  const cx=W/2+TAU.panX,cy=H/2+TAU.panY;
  return {x:(sx-cx)/(TAU_MAP_SZ*TAU.zoom)+.5, y:(sy-cy)/(TAU_MAP_SZ*TAU.zoom)+.5};
}
function tauZoom(d){TAU.zoom=Math.max(.3,Math.min(3,TAU.zoom+d));drawTauriMap();}

function openTauriMap(){
  closeMapSelector();
  showScreen('tauriMapScreen');
  requestAnimationFrame(()=>{
    const cv=document.getElementById('tauriMapCanvas');
    if(cv&&!cv._tauInit){cv._tauInit=true;_tauInitInput(cv);}
    tauUpdateConqCount();
    drawTauriMap();
    const _loop=()=>{
      if(document.getElementById('tauriMapScreen')?.classList.contains('active')){drawTauriMap();_tauRaf=requestAnimationFrame(_loop);}
    };_tauRaf=requestAnimationFrame(_loop);
  });
}
function closeTauriMap(){
  if(_tauRaf){cancelAnimationFrame(_tauRaf);_tauRaf=null;}
  tauCloseAllPanels();
  showScreen('castle');
  CR=null; _castleSpawnAtExit=true;
  startCastleRoom();
  if(CR){const rb=crRoomBounds('exit');if(rb){CR.px=rb.x+rb.w*.50;CR.py=rb.y+rb.h*.45;CR.tx=CR.px;CR.ty=CR.py;}}
}
function tauUpdateConqCount(){
  const cnt=TAU_REGIONS.filter(r=>{const c=GS.conquered[r.id];return c&&c.easy&&c.medium&&c.hard;}).length;
  const el=document.getElementById('tauConqCount');
  if(el)el.textContent=cnt+'/'+TAU_REGIONS.length+' Conquered';
}
function tauCloseAllPanels(){
  ['tauRaidPanel','tauCountryPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  if(window._tauPanelRaf){cancelAnimationFrame(window._tauPanelRaf);window._tauPanelRaf=null;}
}

// ── Country descriptions (reuse ME descriptions) ──
const TAU_COUNTRY_DESCS={
  tau_shire: `The oldest city of the Tau'ri supercontinent. Beneath its crumbling ziggurats, the first dead were buried — and they were the first to stir when the darkness returned.`,
  tau_bree: `A mighty walled city at the crossroads of ancient trade routes. Uruk's great markets have fallen silent, its streets haunted by the restless spirits of a civilization that forgot how to die.`,
  tau_weatherhills: `Desolate ridges marking the boundary between the living world and the underworld. The winds that howl through these passes carry whispers of Sumerian kings long dead.`,
  tau_trollshaws: `The sacred cedar forests where the guardian Humbaba once kept watch. His ancient sentinels still roam the twisted paths, corrupted beyond recognition.`,
  tau_rivendell: `A hidden sanctuary built over the Abzu — the primordial freshwater ocean beneath the earth. Here, Enki's wisdom once flowed freely. Now darker waters rise.`,
  tau_mistyN: `The great twin-peaked mountain where the sun rises and sets. Its tunnels bore through the spine of Pangaea, guarded by scorpion-men turned to shadow.`,
  tau_mirkwood: `A forest consumed by the breath of the underworld. Irkalla's domain has crept above ground here, filling the canopy with perpetual twilight and the buzz of demonic wings.`,
  'tau_lothlórien': `The Golden Wood floats outside of time, its ancient trees veiled in magic — but that veil has frayed. Corrupted things press against the borders.`,
  tau_edoras: `A proud city-state atop a windswept plateau. The great hall of Lagash still stands, but its Ensi-kings speak only through the mouths of the dead.`,
  tau_helmsdeep: `The last great fortress of Pangaea, modeled after the legendary walls of Ur. Its zigzag bastions have turned back a thousand sieges — but the dead need no siege engines.`,
  tau_isengard: `Where mortals once built a tower to challenge the gods. The tower fell, but its forges still burn, fed by something older than ambition. Twisted things are hammered into being here.`,
  tau_fangorn: `The most ancient forest on Pangaea, sacred to the storm-god Enlil. Its cedars have stood since the first age — and some of them remember what they were before they were trees.`,
  tau_rohan: `A vast grassland where nomad-kings once drove their chariots beneath an endless sky. Now spectral riders race across the steppe at dusk, and the grass grows gray.`,
  tau_osgiliath: `The drowned jewel of Pangaea. Nineveh straddled the great river as the mightiest city of its age. Now only ruins and the restless dead fill its flooded streets.`,
  tau_minas_tirith: `The great ziggurat — seven concentric tiers rising to heaven. Each tier once honored a different god. Now each tier holds a different breed of horror.`,
  tau_ithilien: `A land of streams and ancient orchards, tended by the sage Adapa's descendants. Shadow from the east has withered the blossoms, and the gardeners have risen from their graves.`,
  tau_gorgoroth: `The surface of the underworld laid bare. Kur's ashen plateau stretches under a sky choked with sulphurous fume. Nothing living endures here — only things that were never alive.`,
  tau_minas_morgul: `The seven-gated entrance to the underworld. Each gate strips away something — armor, will, hope. At the seventh gate, even the gods must bow to Ereshkigal.`,
  tau_mordor: `The Black Land of the plague-god. Ringed by volcanic ridges and choked with ash, Nergal's domain is death made geography. Armies of the risen dead mass beneath a sunless sky.`,
  tau_mount_doom: `The mountain where the Tablet of Destiny was forged — the artifact that commands the fate of gods and mortals alike. Its fires burn with the heat of creation itself.`,
};

function tauShowCountryPanel(region){
  const panel=document.getElementById('tauCountryPanel');if(!panel)return;
  const fac=TAU_FACTIONS[region.faction];
  const terrainIco={plains:'🌿',forest:'🌲',mountain:'⛰️',desert:'🏔️',tundra:'❄️',wasteland:'💀',swamp:'🌿',sanctum:'☠️',cemetery:'⚰️'}[region.terrain]||'🗺️';
  const desc=TAU_COUNTRY_DESCS[region.id]||'An ancient land shrouded in mystery on the Pangaean supercontinent.';
  // Only show faction name if unlocked
  const fi=TAU_FACTION_ORDER.indexOf(tauFactionOf(region.id));
  const facUnlocked=fi<=0||(()=>{for(let i=0;i<fi;i++){if(!tauFactionCleared(TAU_FACTION_ORDER[i]))return false;}return true;})();
  const facLabel=(facUnlocked&&GS.necroLv>=region.lv)?(fac?.name||''):'???';
  panel.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${region.color};text-shadow:0 0 12px ${region.color}66">${terrainIco} ${region.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:3px">${facLabel} · ${region.terrain} · Lv.${region.lv}</div>
      </div>
      <button onclick="tauCloseAllPanels()" style="-webkit-appearance:none;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#6b7280;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px">✕</button>
    </div>
    <div style="font-family:'IM Fell English',serif;font-size:12px;color:#c8b89a;line-height:1.65;font-style:italic;border-top:1px solid rgba(255,255,255,.08);padding-top:10px">${desc}</div>`;
  panel.style.display='block';
}

function tauShowRaidPanel(region,diff){
  const panel=document.getElementById('tauRaidPanel');if(!panel)return;
  const conq=GS.conquered[region.id]||{};
  const isLocked=(diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium));
  const isCleared=conq[diff];
  const raids=tauGetRegionRaids(region);
  const rd=raids.find(r=>(r.diffStyle||r.diff).toLowerCase()===diff);
  if(!rd)return;
  const cfg=RAID_CONFIGS[rd.key]||{};
  const boss=BOSSES[cfg.bossKey]||REGION_BOSSES[cfg.bossKey]||{};
  const terrainIco={plains:'🌿',forest:'🌲',mountain:'⛰️',desert:'🏔️',tundra:'❄️',wasteland:'💀',swamp:'🌿',sanctum:'☠️',cemetery:'⚰️'}[region.terrain]||'🗺️';
  const diffCol={easy:'#22c55e',medium:PALETTE.holyDk,hard:'#ef4444'}[diff];
  const diffLabel=diff.charAt(0).toUpperCase()+diff.slice(1);

  let html=`<div style="padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${region.color};text-shadow:0 0 14px ${region.color}55">${cfg.ico||'⚔️'} ${cfg.name||'Unknown Raid'}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
          <span style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${diffCol};border:1px solid ${diffCol}44;border-radius:2px;padding:1px 7px">${diffLabel}</span>
          <span style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280">${region.name}</span>
        </div>
      </div>
      <button onclick="tauCloseAllPanels()" style="-webkit-appearance:none;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#6b7280;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px">✕</button>
    </div>
  </div><div style="padding:14px 20px 18px;overflow-y:auto;max-height:60vh">`;

  html+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">MIN LEVEL</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#e5e7eb">Lv. ${region.lv}</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">RAID TYPE</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#e5e7eb">${terrainIco} ${region.terrain.charAt(0).toUpperCase()+region.terrain.slice(1)}</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
      <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">FLOORS</div>
      <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#e5e7eb">${cfg.floors||3}</div>
    </div>
  </div>`;

  html+=`<div style="margin-bottom:12px">
    <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;letter-spacing:1px;margin-bottom:7px">ENEMIES</div>
    <div id="tauEnemyRow" style="display:flex;gap:8px;flex-wrap:wrap"></div>
  </div>`;

  // No quests in Tau'ri map

  // Boss section
  html+=`<div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.18);border-radius:10px;padding:10px 12px;margin-bottom:14px">
    <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#ef4444;letter-spacing:1px;margin-bottom:5px">FINAL BOSS</div>
    <div style="display:flex;align-items:center;gap:10px">
      <canvas id="tauBossCanvas" width="52" height="52" style="border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(239,68,68,.25);flex-shrink:0"></canvas>
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#fca5a5;font-weight:bold">${boss.name||'Unknown'}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#9ca3af;margin-top:3px">HP: ${boss.hp||'??'} · DMG: ${boss.dmg||'??'} · XP: ${boss.xp||'??'}</div>
      </div>
    </div>
  </div>`;

  if(isLocked){
    const lockMsg=diff==='medium'?'Clear Easy first':'Clear Easy & Medium first';
    html+=`<div style="text-align:center;padding:12px;color:#6b7280;font-size:13px">🔒 ${lockMsg}</div>`;
  } else {
    const btnCol=isCleared?'rgba(168,85,247,.18)':'rgba(34,197,94,.18)';
    const btnBorder=isCleared?'rgba(168,85,247,.55)':'rgba(34,197,94,.55)';
    const btnText=isCleared?PALETTE.frameGlow:'#86efac';
    const btnLabel=isCleared?'⚔️ Raid Again':'⚔️ Begin Raid';
    html+=`<button onclick="tauCloseAllPanels();tauFireRaid(TAU_REGIONS.find(r=>r.id==='${region.id}'),'${diff}')"
      style="-webkit-appearance:none;width:100%;padding:13px;font-family:'Almendra','Cinzel',serif;font-size:11px;font-weight:bold;
      background:${btnCol};border:1.5px solid ${btnBorder};border-radius:12px;color:${btnText};
      cursor:pointer;letter-spacing:.05em">${btnLabel}</button>`;
  }
  html+=`</div>`;
  panel.innerHTML=html;
  panel.style.display='block';

  // Animate enemy + boss sprites (single loop)
  _tauAnimateEnemies(cfg);
}

function _tauAnimateEnemies(cfg){
  const row=document.getElementById('tauEnemyRow');if(!row)return;
  const pool=[...new Set(cfg.enemyPool||[])];
  const eNameMap={cultist:'Cultist',skeleton_e:'Skeleton',zombie_e:'Zombie',ghoul_e:'Ghoul',wight_e:'Wight',gravedigger:'Gravedigger',forest_wolf:'Wolf',forest_witch:'Witch',treant:'Treant',banshee:'Banshee',death_knight:'D.Knight',lich_acolyte:'Acolyte',shadow_demon:'Shadow',wraith_e:'Wraith',orc_scout:'Orc Scout',orc_warrior:'Orc Warrior',orc_archer:'Orc Archer'};
  row.innerHTML='';
  pool.forEach(eKey=>{
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px';
    const cv=document.createElement('canvas');cv.width=44;cv.height=44;
    cv.style.cssText='border-radius:7px;background:rgba(0,0,0,.5);border:1px solid rgba(34,197,94,.25)';
    const nameLbl=document.createElement('div');
    nameLbl.style.cssText="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#9ca3af;text-align:center;max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    nameLbl.textContent=eNameMap[eKey]||eKey;
    wrap.appendChild(cv);wrap.appendChild(nameLbl);row.appendChild(wrap);
    cv._eKey=eKey;
  });
  // Single animation loop for all enemies + boss
  if(window._tauPanelRaf)cancelAnimationFrame(window._tauPanelRaf);
  const _animAll=()=>{
    const t2=Date.now()/1000;
    row.querySelectorAll('canvas').forEach(cv3=>{
      const k=cv3._eKey;if(!k||!SPR[k])return;
      const c2=cv3.getContext('2d');
      c2.clearRect(0,0,44,44);
      c2.save();c2.translate(22,28);
      try{SPR[k](c2,t2,0);}catch(ex){}
      c2.restore();
    });
    // Boss canvas
    const bCv=document.getElementById('tauBossCanvas');
    if(bCv&&cfg.bossKey&&SPR[cfg.bossKey]){
      const bc=bCv.getContext('2d');bc.clearRect(0,0,52,52);
      bc.save();bc.translate(26,36);bc.scale(.5,.5);
      try{SPR[cfg.bossKey](bc,t2,0);}catch(ex){}
      bc.restore();
    }
    if(document.getElementById('tauRaidPanel')?.style.display!=='none'){
      window._tauPanelRaf=requestAnimationFrame(_animAll);
    }else{window._tauPanelRaf=null;}
  };
  window._tauPanelRaf=requestAnimationFrame(_animAll);
}

function tauFireRaid(region,diff){
  if(!tauRegionAccessible(region)){showToast('🔒 Reach Lv.'+region.lv+' to raid here.');return;}
  const conq=GS.conquered[region.id]||{};
  if(diff==='medium'&&!conq.easy){showToast('🔒 Clear Easy first!');return;}
  if(diff==='hard'&&(!conq.easy||!conq.medium)){showToast('🔒 Clear Easy & Medium first!');return;}
  const rdKey=(TAU_REGION_RAID_MAP[region.id]||[])[['easy','medium','hard'].indexOf(diff)];
  const cfg=RAID_CONFIGS[rdKey];if(!rdKey||!cfg){showToast('Raid not found!');return;}
  tauCloseAllPanels();closeTauriMap();
  activeRaid=rdKey;
  _pendingRegionRaid={region:{...region},raidDef:{key:rdKey,diff,diffStyle:diff,floors:cfg.floors||3,scale:1.0,minLv:region.lv,name:cfg.name,ico:cfg.ico,bossKey:cfg.bossKey}};
  TransitionManager.play('raidFade',700,{hold:true,
    onMid:()=>{
      showScreen('raid');
      setTimeout(()=>{initRaid(rdKey,1,{regionId:region.id,diff});},50);
    }
  });
}

// ── Draw Tau'ri Map (Pangaea) ──
function drawTauriMap(){
  const cv=document.getElementById('tauriMapCanvas');if(!cv)return;
  const DPR=window.devicePixelRatio||1;
  const W=gameW(),H=gameH()-42;
  if(cv.width!==Math.floor(W*DPR)){cv.width=Math.floor(W*DPR);cv.height=Math.floor(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';}
  const c=cv.getContext('2d');
  c.save();c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);
  const toS=(rx,ry)=>tauToScreen(rx,ry,W,H);
  const t_now=(Date.now()-TAU._t0)/1000;
  TAU._raidBtns=[];TAU._nameBtns=[];

  // ── Ocean ──
  const seaGrad=c.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.9);
  seaGrad.addColorStop(0,'#0a1e28');seaGrad.addColorStop(.5,'#071420');seaGrad.addColorStop(1,'#030c14');
  c.fillStyle=seaGrad;c.fillRect(0,0,W,H);
  // Waves
  c.save();c.globalAlpha=.06;c.strokeStyle='#3080b0';c.lineWidth=.8;
  const wOff=((t_now*10)%40);
  for(let wy=wOff-40;wy<H+40;wy+=20){c.beginPath();for(let wx=0;wx<W;wx+=4){c.lineTo(wx,wy+Math.sin((wx+t_now*18)*0.035)*5);}c.stroke();}
  c.restore();

  // ── PANGAEA LANDMASS — C-shaped supercontinent (matching geological Pangaea) ──
  // Traced clockwise: N.America top-left → Eurasia top-right → Tethys Sea indent →
  // India/Australia right → Antarctica bottom → S.America left → back to N.America
  const pangaea=[
    // ── North America (upper-left bulge) ──
    [.20,.18],[.24,.12],[.30,.08],[.36,.06],
    // ── Eurasia (sweeps across top, large mass) ──
    [.44,.05],[.54,.04],[.64,.06],[.72,.10],[.76,.16],[.80,.24],[.78,.32],
    // ── Tethys Sea indentation (coast curves back west) ──
    [.72,.36],[.64,.40],[.56,.44],
    // ── Africa NE coast → India peninsula (coast comes back east) ──
    [.58,.48],[.62,.52],[.68,.56],[.72,.60],[.70,.66],
    // ── Antarctica / Australia (bottom of C) ──
    [.66,.72],[.68,.78],[.64,.84],[.56,.88],[.48,.88],[.40,.86],
    // ── South America (left side going up) ──
    [.34,.82],[.28,.76],[.24,.68],[.20,.60],[.18,.52],
    // ── North America west coast (going back up) ──
    [.16,.44],[.14,.36],[.15,.28],[.18,.22],
  ];
  const landPath=()=>{
    c.beginPath();
    const pts=pangaea.map(([rx,ry])=>toS(rx,ry));
    c.moveTo(pts[0].x,pts[0].y);
    // Smooth curve through all points
    for(let i=0;i<pts.length;i++){
      const p0=pts[(i-1+pts.length)%pts.length];
      const p1=pts[i];
      const p2=pts[(i+1)%pts.length];
      const midX=(p1.x+p2.x)/2, midY=(p1.y+p2.y)/2;
      c.quadraticCurveTo(p1.x,p1.y,midX,midY);
    }
    c.closePath();
  };

  // Shore glow
  c.save();landPath();
  c.shadowColor='rgba(40,120,50,.5)';c.shadowBlur=20*TAU.zoom;
  c.strokeStyle='rgba(60,160,70,.3)';c.lineWidth=3*TAU.zoom;c.stroke();c.restore();

  // Land fill — varied gradient matching continental zones
  c.save();landPath();
  const landGrad=c.createLinearGradient(toS(.15,.1).x,toS(.15,.1).y,toS(.7,.85).x,toS(.7,.85).y);
  landGrad.addColorStop(0,'#1e2e14');  // N.America — green
  landGrad.addColorStop(.25,'#1a2810'); // Eurasia — dark green
  landGrad.addColorStop(.45,'#1c2410'); // Africa — olive
  landGrad.addColorStop(.7,'#181208');  // S lands — brown
  landGrad.addColorStop(1,'#120c06');   // Antarctica — dark
  c.fillStyle=landGrad;c.fill();c.restore();

  // ── Terrain detail (clipped inside land) ──
  c.save();landPath();c.clip();

  // Dense forest zones (Cedar Wilds, Irkalla-Wood, Dilmun, Grove of Enlil, Gardens of Adapa)
  [{x:.36,y:.24,r:.06,d:10},{x:.72,y:.22,r:.07,d:14},{x:.66,y:.32,r:.06,d:11},
   {x:.32,y:.70,r:.06,d:10},{x:.58,y:.52,r:.05,d:8},{x:.22,y:.36,r:.05,d:7}].forEach(({x,y,r,d})=>{
    const fc=toS(x,y),fr=r*TAU_MAP_SZ*TAU.zoom;
    const fg=c.createRadialGradient(fc.x,fc.y,0,fc.x,fc.y,fr);
    fg.addColorStop(0,'rgba(6,22,6,.7)');fg.addColorStop(1,'rgba(6,22,6,0)');
    c.fillStyle=fg;c.beginPath();c.arc(fc.x,fc.y,fr,0,Math.PI*2);c.fill();
    const sz=Math.max(4,5*TAU.zoom);
    for(let ti=0;ti<d;ti++){
      const ta=ti/d*Math.PI*2+ti*.3,tr=fr*(.2+Math.random()*.6);
      const tx=fc.x+Math.cos(ta)*tr,ty=fc.y+Math.sin(ta)*tr,ts=sz*(.7+Math.sin(ti*1.7)*.3);
      c.strokeStyle='rgba(40,25,10,.8)';c.lineWidth=ts*.22;
      c.beginPath();c.moveTo(tx,ty+ts*.5);c.lineTo(tx,ty-ts*.3);c.stroke();
      c.fillStyle=`rgba(${10+ti%5*3},${40+ti%8*4},${10+ti%4*3},.85)`;
      c.beginPath();c.arc(tx,ty-ts*.3,ts*.55,0,Math.PI*2);c.fill();
    }
  });

  // Mountain ranges
  [
    // Kur-Heights / Mount Mashu spine (N.America → Eurasia)
    [[.28,.14],[.32,.10],[.38,.08],[.44,.07],[.50,.10],[.54,.08]],
    // Eurasia eastern mountains
    [[.72,.14],[.76,.20],[.78,.28]],
    // Walls of Ur / Lagash range (S.America)
    [[.24,.52],[.26,.58],[.28,.64]],
    // India / Etemenanki peaks
    [[.66,.54],[.70,.58],[.72,.62]],
    // Antarctica rim
    [[.48,.84],[.54,.86],[.60,.84]],
  ].forEach(range=>{
    range.forEach(([mx,my])=>{
      const mp=toS(mx,my),ms=Math.max(5,8*TAU.zoom);
      c.fillStyle='rgba(80,70,55,.65)';
      c.beginPath();c.moveTo(mp.x-ms,mp.y+ms*.5);c.lineTo(mp.x,mp.y-ms);c.lineTo(mp.x+ms,mp.y+ms*.5);c.closePath();c.fill();
      c.fillStyle='rgba(200,190,170,.3)';
      c.beginPath();c.moveTo(mp.x,mp.y-ms);c.lineTo(mp.x+ms*.3,mp.y-ms*.2);c.lineTo(mp.x,mp.y-ms*.4);c.closePath();c.fill();
    });
  });

  // Desert / wasteland zones (Domain of Nergal — southern wastes)
  [{x:.56,y:.74,r:.07},{x:.60,y:.68,r:.06},{x:.50,y:.64,r:.05}].forEach(({x,y,r})=>{
    const wp2=toS(x,y),wr2=r*TAU_MAP_SZ*TAU.zoom;
    const wg2=c.createRadialGradient(wp2.x,wp2.y,0,wp2.x,wp2.y,wr2);
    wg2.addColorStop(0,'rgba(30,5,0,.6)');wg2.addColorStop(1,'rgba(30,5,0,0)');
    c.fillStyle=wg2;c.beginPath();c.arc(wp2.x,wp2.y,wr2,0,Math.PI*2);c.fill();
  });

  // Sahara-like arid zone (Africa center/north)
  {
    const dp=toS(.46,.46),dr=.05*TAU_MAP_SZ*TAU.zoom;
    const dg=c.createRadialGradient(dp.x,dp.y,0,dp.x,dp.y,dr);
    dg.addColorStop(0,'rgba(40,30,10,.4)');dg.addColorStop(1,'rgba(40,30,10,0)');
    c.fillStyle=dg;c.beginPath();c.arc(dp.x,dp.y,dr,0,Math.PI*2);c.fill();
  }

  // Antarctic ice tint
  {
    const ip=toS(.54,.86),ir=.08*TAU_MAP_SZ*TAU.zoom;
    const ig=c.createRadialGradient(ip.x,ip.y,0,ip.x,ip.y,ir);
    ig.addColorStop(0,'rgba(180,200,220,.15)');ig.addColorStop(1,'rgba(180,200,220,0)');
    c.fillStyle=ig;c.beginPath();c.arc(ip.x,ip.y,ir,0,Math.PI*2);c.fill();
  }

  c.restore();

  // (faction territory blobs removed)

  // ── Faction name labels (hidden until unlocked) ──
  Object.entries(TAU_FACTIONS).forEach(([facId,fac])=>{
    const fi=TAU_FACTION_ORDER.indexOf(facId);
    const facUnlocked=fi<=0||(()=>{for(let i=0;i<fi;i++){if(!tauFactionCleared(TAU_FACTION_ORDER[i]))return false;}return true;})();
    const minLv=Math.min(...fac.members.map(id=>{const r=TAU_REGIONS.find(rr=>rr.id===id);return r?r.lv:99;}));
    if(!facUnlocked||GS.necroLv<minLv)return;
    const members=fac.members.map(id=>TAU_REGIONS.find(r=>r.id===id)).filter(r=>r&&tauRegionVisible(r)&&tauRegionAccessible(r));
    if(!members.length)return;
    const pts=members.map(r=>toS(r.x,r.y));
    const cx2=pts.reduce((s,p)=>s+p.x,0)/pts.length;
    const cy2=pts.reduce((s,p)=>s+p.y,0)/pts.length;
    if(TAU.zoom>0.3){
      c.save();c.globalAlpha=.5;
      c.font=`bold ${Math.max(10,14*TAU.zoom)}px "Almendra","Cinzel",monospace`;
      c.fillStyle=fac.color;c.textAlign='center';
      c.shadowColor='rgba(0,0,0,.9)';c.shadowBlur=6;
      c.fillText(fac.name,cx2,cy2+4);c.restore();
    }
  });

  // ── Region dots + labels + raid buttons (hidden when locked) ──
  TAU_REGIONS.forEach(r=>{
    if(!tauRegionVisible(r))return;
    if(!tauRegionAccessible(r))return; // hide locked regions entirely
    const sp=toS(r.x,r.y);
    const conq=GS.conquered[r.id]||{};

    // Region name
    if(TAU.zoom>0.45){
      const fs=Math.max(7,9*TAU.zoom);
      c.font=`bold ${fs}px "Almendra","Cinzel",monospace`;
      const lw=c.measureText(r.name).width+8;
      const lx=sp.x-lw/2,ly=sp.y-16*TAU.zoom;
      c.fillStyle='rgba(0,0,0,.55)';
      c.beginPath();if(c.roundRect)c.roundRect(lx,ly-fs,lw,fs+4,3);else c.rect(lx,ly-fs,lw,fs+4);c.fill();
      c.fillStyle=(conq.easy&&conq.medium&&conq.hard?'#fcd34d':r.color);
      c.textAlign='center';c.fillText(r.name,sp.x,ly);
      TAU._nameBtns.push({x:lx,y:ly-fs,w:lw,h:fs+4,region:r});
    }

    // Raid buttons
    const btnR=Math.max(9,12*TAU.zoom);
    const dist=Math.max(18,24*TAU.zoom);
    const raidAngles=[-Math.PI/2,Math.PI/6,-Math.PI*5/6];
    [{diff:'easy',label:'E',color:'#22c55e',idx:0},{diff:'medium',label:'M',color:PALETTE.holyDk,idx:1},{diff:'hard',label:'H',color:'#ef4444',idx:2}].forEach(rb=>{
      const bx=sp.x+Math.cos(raidAngles[rb.idx])*dist*1.6;
      const by=sp.y+Math.sin(raidAngles[rb.idx])*dist*1.6;
      const isCleared=conq[rb.diff];
      const isLocked=(rb.diff==='medium'&&!conq.easy)||(rb.diff==='hard'&&(!conq.easy||!conq.medium));
      if(isLocked)return; // hide locked difficulties
      const col=rb.color;

      // Button circle
      c.fillStyle=isCleared?col+'33':col+'11';
      c.beginPath();c.arc(bx,by,btnR,0,Math.PI*2);c.fill();
      c.strokeStyle=isCleared?col:col+'66';c.lineWidth=isCleared?2:1.2;c.stroke();
      if(isCleared){c.fillStyle=col;c.font=`bold ${Math.max(7,9*TAU.zoom)}px sans-serif`;c.textAlign='center';icoD(c,'★',bx,by+3,12);}
      else{c.fillStyle=col;c.font=`bold ${Math.max(7,9*TAU.zoom)}px "Almendra","Cinzel",monospace`;c.textAlign='center';c.fillText(rb.label,bx,by+3);}
      TAU._raidBtns.push({x:bx,y:by,r:btnR+6,region:r,diff:rb.diff});
    });
  });

  // Compass
  const cRx=W-50,cRy=H-50;
  c.save();c.globalAlpha=.6;
  [['N',0,-1],['S',0,1],['E',1,0],['W',-1,0]].forEach(([lbl,dx,dy])=>{
    c.fillStyle=lbl==='N'?'#ef4444':'#aaa';c.font=`bold ${Math.max(8,9*TAU.zoom)}px "Almendra","Cinzel",monospace`;c.textAlign='center';
    c.fillText(lbl,cRx+dx*24,cRy+dy*24+3);
  });c.restore();

  c.restore();
}

// ── Input handling ──
function _tauInitInput(cv){
  let _drag=false,_sx=0,_sy=0,_lastPinch=0;
  const gW=()=>cv.clientWidth,gH=()=>cv.clientHeight;
  const onDown=(x,y)=>{_drag=true;_sx=x;_sy=y;};
  const onMove=(x,y)=>{if(!_drag)return;TAU.panX+=x-_sx;TAU.panY+=y-_sy;_sx=x;_sy=y;drawTauriMap();};
  const onUp=(x,y)=>{
    if(_drag&&Math.abs(x-_sx)<6&&Math.abs(y-_sy)<6){_tauHandleTap(x,y,gW(),gH());}
    _drag=false;
  };
  cv.addEventListener('mousedown',e=>{const r=cv.getBoundingClientRect();onDown(e.clientX-r.left,e.clientY-r.top);});
  window.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();onMove(e.clientX-r.left,e.clientY-r.top);});
  window.addEventListener('mouseup',e=>{const r=cv.getBoundingClientRect();onUp(e.clientX-r.left,e.clientY-r.top);});
  cv.addEventListener('touchstart',e=>{
    if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;_lastPinch=Math.hypot(dx,dy);return;}
    const t=e.touches[0],r=cv.getBoundingClientRect();onDown(t.clientX-r.left,t.clientY-r.top);
  },{passive:true});
  cv.addEventListener('touchmove',e=>{
    if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const dist=Math.hypot(dx,dy);const delta=(dist-_lastPinch)*0.005;TAU.zoom=Math.max(.3,Math.min(3,TAU.zoom+delta));_lastPinch=dist;drawTauriMap();return;}
    const t=e.touches[0],r=cv.getBoundingClientRect();onMove(t.clientX-r.left,t.clientY-r.top);
  },{passive:true});
  cv.addEventListener('touchend',e=>{
    if(e.changedTouches.length){const t=e.changedTouches[0],r=cv.getBoundingClientRect();onUp(t.clientX-r.left,t.clientY-r.top);}
    _drag=false;
  });
  cv.addEventListener('wheel',e=>{e.preventDefault();tauZoom(e.deltaY<0?0.15:-0.15);},{passive:false});
}

function _tauHandleTap(sx,sy,W,H){
  // Check raid buttons first
  for(const b of TAU._raidBtns){
    if(Math.hypot(sx-b.x,sy-b.y)<b.r){tauCloseAllPanels();tauShowRaidPanel(b.region,b.diff);return;}
  }
  // Check name labels
  for(const b of TAU._nameBtns){
    if(sx>=b.x&&sx<=b.x+b.w&&sy>=b.y&&sy<=b.y+b.h){tauCloseAllPanels();tauShowCountryPanel(b.region);return;}
  }
  tauCloseAllPanels();
}
