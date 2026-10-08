// ═══════════════════════════════════════════════════════════════════════
//  GUILD WARS-STYLE HUD + KEYBOARD
//  Keys follow GW1/GW2 defaults where the game has an equivalent:
//   1-4 skills · Space "do it" · Tab / Shift+Tab next / previous target · C nearest target
//   I inventory · P party · L quest log · M map · H hero · K skills · F11 options (GW2)
//   F1-F3 summon stance (auto / attack / defend) · F4 stance panel · R toggle auto-play
//   The same four commands have buttons left of the health bar. Party frames sit under the minimap.
//  Also: skill queuing, target frame with portrait, combat log, movable/toggleable HUD.
// ═══════════════════════════════════════════════════════════════════════
var GWHud=(function(){
  var $=function(id){return document.getElementById(id);};
  var LS='necro_hud_layout',ST={preset:null,hidden:{},pos:{},edit:false,shift:false,hideAll:false,logClosed:false};
  var EL=[['spellArea','Skill bar & health'],['minimapCluster','Compass / minimap'],['autoToggle','Menu buttons'],['bottomRight','Inventory / party buttons'],['kbTargetHUD','Target frame'],['gwLog','Combat log'],['gwParty','Party frames']];
  function load(){try{var d=JSON.parse(localStorage.getItem(LS)||'{}');ST.preset=d.preset||null;ST.hidden=d.hidden||{};ST.pos=d.pos||{};ST.logClosed=!!d.logClosed;}catch(e){}
    if(!ST.preset){var touch=('ontouchstart' in window)||window.innerWidth<900;ST.preset=touch?'classic':'gw';if(touch){ST.hidden.gwLog=1;ST.hidden.gwParty=1;}} // phones keep the classic layout and no log by default
  }
  function save(){try{localStorage.setItem(LS,JSON.stringify({preset:ST.preset,hidden:ST.hidden,pos:ST.pos,logClosed:ST.logClosed}));}catch(e){}}
  function inCombat(){var r=$('raid');return !!(r&&r.classList.contains('active'));}

  // ── New key actions ────────────────────────────────────────────────
  var NEW={targetNearest:['c','Nearest Target'],inventory:['i','Inventory'],party:['p','Party'],quests:['l','Quest Log'],map:['m','Map'],heroPanel:['h','Hero Panel'],skills:['k','Skills / Grimoire'],autoPlay:['r','Toggle Auto-Play'],aiAuto:['f1','Summons: Auto'],aiAttack:['f2','Summons: Attack'],aiDefend:['f3','Summons: Defend'],aiPanel:['f4','Summon Stance Panel'],options:['f11','Options']};
  function installKeys(){
    try{
      var saved={};try{saved=JSON.parse(localStorage.getItem('necro_keybinds')||'{}');}catch(e){}
      Object.keys(NEW).forEach(function(a){KB_DEFAULT[a]=NEW[a][0];_KB_LABELS[a]=NEW[a][1];});
      _loadKeyMap();
      // A new default must never steal a key the player already uses for something else
      Object.keys(NEW).forEach(function(a){if(saved[a]!==undefined)return;var k=KB_MAP[a];
        var clash=Object.keys(KB_MAP).some(function(o){return o!==a&&!NEW[o]&&KB_MAP[o]===k;});if(clash)KB_MAP[a]='';});
      _KB_GROUPS[1][1].splice(2,0,'targetNearest');
      _KB_GROUPS.push(['Panels',['inventory','party','quests','map','heroPanel','skills','options']]);
      _KB_GROUPS.push(['Summon commands',['aiAuto','aiAttack','aiDefend','aiPanel','autoPlay']]);
    }catch(e){console.warn('GWHud keys',e);}
  }
  function nearestTarget(){
    var eng=_kbGetActiveEngine();
    if(eng==='raid'&&RS){var L=RS._liveE||[],n=null,nd=1e9;L.forEach(function(e){var d=Math.hypot(RS.necro.x-e.x,RS.necro.y-e.y);if(d<nd){nd=d;n=e;}});if(n)RS.focusTarget=n;}
    else if(eng==='survival'&&SV){var A=SV.waveEnemies.filter(function(e){return !e.dead&&!e.banished;}),m=null,md=1e9;A.forEach(function(e){var d=Math.hypot(SV.necro.x-e.x,SV.necro.y-e.y);if(d<md){md=d;m=e;}});if(m)SV._kbTarget=m;}
    _kbUpdateTargetHUD();
  }
  function prevTarget(){
    var eng=_kbGetActiveEngine();
    if(eng==='raid'&&RS){var L=(RS._liveE||[]).slice().sort(function(a,b){return Math.hypot(RS.necro.x-a.x,RS.necro.y-a.y)-Math.hypot(RS.necro.x-b.x,RS.necro.y-b.y);});if(!L.length){RS.focusTarget=null;}else{var i=L.indexOf(RS.focusTarget);RS.focusTarget=L[(i<=0?L.length:i)-1];}}
    else if(eng==='survival'&&SV){var A=SV.waveEnemies.filter(function(e){return !e.dead&&!e.banished;}).sort(function(a,b){return Math.hypot(SV.necro.x-a.x,SV.necro.y-a.y)-Math.hypot(SV.necro.x-b.x,SV.necro.y-b.y);});if(!A.length){SV._kbTarget=null;}else{var j=A.indexOf(SV._kbTarget);SV._kbTarget=A[(j<=0?A.length:j)-1];}}
    _kbUpdateTargetHUD();
  }
  function act(a){
    var combat=inCombat();
    switch(a){
      case 'targetNearest':if(combat)nearestTarget();return true;
      case 'inventory':if(combat){toggleRaidInventory();return true;}return false;
      case 'party':if(combat){togglePartyPopup();return true;}return false;
      case 'quests':if(combat){toggleQuestsPanel();return true;}return false;
      case 'map':if(combat){toggleMinimapPopup();return true;}return false;
      case 'heroPanel':try{openHeroPanel();}catch(e){}return true;
      case 'skills':if(combat){try{_kbOpenAltSpellbook();}catch(e){}}else{try{openGrimoire('spells');}catch(e){}}return true;
      case 'autoPlay':if(combat&&typeof RS!=='undefined'&&RS){toggleAuto();return true;}return false;
      case 'aiAuto':if(combat&&RS){setAiMode('auto');log('Summons: auto','sys');return true;}return false;
      case 'aiAttack':if(combat&&RS){setAiMode('offense');log('Summons: attack','sys');return true;}return false;
      case 'aiDefend':if(combat&&RS){setAiMode('defense');log('Summons: defend','sys');return true;}return false;
      case 'aiPanel':if(combat&&RS){toggleAiPanel();return true;}return false;
      case 'options':var s=$('settings');if(s&&s.style.display==='block')closeSettings();else openSettings();return true;
    }
    return false;
  }
  function onKey(e){
    ST.shift=!!e.shiftKey;
    if(typeof _kbRebinding!=='undefined'&&_kbRebinding)return;
    var tag=(document.activeElement||{}).tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    var key=(e.key||'').toLowerCase();
    if(e.ctrlKey&&e.shiftKey&&key==='h'){e.preventDefault();ST.hideAll=!ST.hideAll;applyVisibility();return;}
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var a=_keyAction(key);if(!a||!NEW[a])return;
    if(act(a)){e.preventDefault();}
  }

  // ── Skill queue ────────────────────────────────────────────────────
  var Q=null;
  function eqSpells(){return (GS.equippedSpellsOrdered||[]).filter(function(k){return k!=='staffStrike'&&GS.equippedSpells.has(k)&&SPELLS[k]&&GS.necroLv>=SPELLS[k].lv;});}
  function remaining(key){
    var sp=SPELLS[key];if(!sp)return 0;
    var raid=(typeof RS!=='undefined'&&RS),sv=(typeof SV!=='undefined'&&SV);if(!raid&&!sv)return 0;
    var t=(raid?RS.lastTs:SV.lastTs)/1000,cds=(raid?RS.spellCDs:SV.spellCDs)||{};
    var eff=sp.cd*getStaffMult().cd*((raid&&typeof getHeroOfTimeCdMult==='function')?getHeroOfTimeCdMult():1);
    return Math.max(0,eff-(t-(cds[key]||0)));
  }
  function clearQ(){if(Q){var b=$('asp_'+Q.key);if(b)b.removeAttribute('data-q');}Q=null;}
  function installQueue(){
    var orig=_kbCastSlot;
    _kbCastSlot=function(slot){
      try{var key=eqSpells()[slot-1];if(key){var rem=remaining(key);
        if(rem>0.05&&rem<=1.5){clearQ();Q={key:key,slot:slot,until:performance.now()+2200};var b=$('asp_'+key);if(b)b.setAttribute('data-q','1');return;}}}catch(e){}
      clearQ();return orig(slot);
    };
    setInterval(function(){
      if(!Q)return;
      if(performance.now()>Q.until||!inCombat()){clearQ();return;}
      try{if(remaining(Q.key)<=0.02){var s=Q.slot;clearQ();orig(s);}}catch(e){clearQ();}
    },40);
    var oc=_kbCycleTarget;_kbCycleTarget=function(){if(ST.shift)prevTarget();else oc();};
  }

  // ── Target frame ───────────────────────────────────────────────────
  var _lastT=null;
  function installTarget(){
    var orig=_kbUpdateTargetHUD;
    _kbUpdateTargetHUD=function(){
      orig();
      var hud=$('kbTargetHUD');if(!hud)return;
      if(!hud._gw){hud._gw=1;hud.classList.add('gw-hud-el');
        var pc=document.createElement('canvas');pc.className='gw-port';pc.width=pc.height=44;pc.id='gwTPort';
        var col=document.createElement('div');col.className='gw-tcol';
        ['kbTargetName','kbTargetBarWrap','kbTargetHP'].forEach(function(id){var n=$(id);if(n)col.appendChild(n);});
        hud.appendChild(pc);hud.appendChild(col);restorePos('kbTargetHUD');applyVisibility();}
      if(hud.style.display==='none'){_lastT=null;return;}
      var raid=(typeof RS!=='undefined'&&RS),tgt=raid?RS.focusTarget:(typeof SV!=='undefined'&&SV?SV._kbTarget:null);if(!tgt)return;
      var nm=$('kbTargetName');
      if(nm){var isB=raid&&tgt===RS.boss;var name=isB?((tgt.def&&tgt.def.name)||'Boss'):((EDEF[tgt.type]&&EDEF[tgt.type].name)||String(tgt.type||'Enemy').replace(/_e$/,'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}));
        if(nm.textContent!==name)nm.textContent=name;}
      if(tgt!==_lastT){_lastT=tgt;var pc2=$('gwTPort');
        if(pc2){var c=pc2.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,44,44);c.imageSmoothingEnabled=false;c.save();c.translate(22,40);
          try{drawSprite(c,(raid&&tgt===RS.boss&&RS.cfg)?RS.cfg.bossKey:tgt.type,0,0,(raid&&tgt===RS.boss)?0.5:0.75,1,1.3);}catch(e){}c.restore();}}
      var hp=$('kbTargetHP');
      if(hp){var t=(raid?RS.lastTs:SV.lastTs)/1000,cs=[];
        if(tgt.slowUntil&&tgt.slowUntil>t)cs.push('Slowed');if(tgt.stunUntil&&tgt.stunUntil>t)cs.push('Stunned');if(tgt.markUntil&&tgt.markUntil>t)cs.push('Marked');if(tgt.fearUntil&&tgt.fearUntil>t)cs.push('Feared');if(tgt.dotUntil&&tgt.dotUntil>t)cs.push('Rotting');if(tgt.noHealUntil&&tgt.noHealUntil>t)cs.push('Chilled');
        var txt=Math.max(0,Math.ceil(tgt.hp))+' / '+(tgt.maxHP||1)+'|'+cs.join(',');
        if(hp._t!==txt){hp._t=txt;hp.innerHTML='<span>'+Math.max(0,Math.ceil(tgt.hp))+' / '+(tgt.maxHP||1)+'</span><span class="gw-cond">'+cs.map(function(x){return '<span>'+x+'</span>';}).join('')+'</span>';}}
    };
    // keep the frame live for click-selected targets too
    setInterval(function(){if(inCombat())try{_kbUpdateTargetHUD();}catch(e){}},150);
  }

  // ── Combat log ─────────────────────────────────────────────────────
  var _lines=0;
  function log(txt,cls){
    var L=$('gwLogBody');if(!L||!txt)return;
    var d=document.createElement('div');d.className='ln'+(cls?' '+cls:'');d.textContent=String(txt).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    if(!d.textContent)return;
    var last=L.lastElementChild;if(last&&last.textContent===d.textContent&&Date.now()-(last._at||0)<1500)return;
    d._at=Date.now();L.appendChild(d);
    while(L.children.length>60)L.removeChild(L.firstChild);
    for(var i=0;i<L.children.length;i++)L.children[i].classList.toggle('old',i<L.children.length-4);
    L.scrollTop=L.scrollHeight;
  }
  function installLog(){
    var of=flash;flash=function(txt,size,col){try{if(inCombat())log(txt);}catch(e){}return of.apply(this,arguments);};
    var ot=showToast;showToast=function(m){try{if(inCombat())log(m,'sys');}catch(e){}return ot.apply(this,arguments);};
    var ok=onEnemyKilled;onEnemyKilled=function(en,t){try{var k=en&&en.type;if(k)log(((EDEF[k]&&EDEF[k].name)||String(k).replace(/_e$/,'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}))+' slain','kill');}catch(e){}return ok.apply(this,arguments);};
  }

  // ── Layout: presets, visibility, positions ─────────────────────────
  function applyPreset(){
    document.body.classList.toggle('hud-gw',ST.preset==='gw');
    try{_applyHudScale();}catch(e){}
    var a=$('gwPreGw'),b=$('gwPreClassic');if(a)a.classList.toggle('on',ST.preset==='gw');if(b)b.classList.toggle('on',ST.preset==='classic');
  }
  function applyVisibility(){
    EL.forEach(function(p){var el=$(p[0]);if(!el)return;var hide=ST.hideAll||!!ST.hidden[p[0]];el.style.visibility=hide?'hidden':'';if(p[0]==='gwLog'||p[0]==='gwParty')el.style.display=(inCombat()&&!hide)?'flex':'none';});
    var L=$('gwLog');if(L){L.classList.toggle('collapsed',!!ST.logClosed);var h=$('gwLogHd');if(h)h.textContent=ST.logClosed?'Log \u25B8':'Log \u25BE';}
  }
  function restorePos(id){var p=ST.pos[id],el=$(id);if(!el||!p||typeof _dragApply!=='function')return;_dragApply(el,p[0],p[1]);}
  function installScale(){
    var os=_applyHudScale;
    _applyHudScale=function(){os();
      var gw=false,m=$('minimapCluster'),a=$('autoToggle'),b=$('bottomRight');
      if(m)m.style.transformOrigin=gw?'top right':'top left';if(a)a.style.transformOrigin=gw?'top left':'top right';if(b)b.style.transformOrigin=gw?'top left':'top right';
      var s=(SETTINGS.hudScale||100)/100,L=$('gwLog'),T=$('kbTargetHUD');
      if(L){L.style.transform=s===1?'':'scale('+s+')';L.style.transformOrigin='bottom left';}
      var P=$('gwParty');if(P){P.style.transform=s===1?'':'scale('+s+')';P.style.transformOrigin='top left';}
      if(T){T.style.transform=s===1?'translateX(-50%)':'translateX(-50%) scale('+s+')';T.style.transformOrigin='top center';}
    };
  }
  function setEdit(on){
    ST.edit=on;document.body.classList.toggle('hud-edit',on);
    EL.forEach(function(p){var el=$(p[0]);if(!el)return;el.classList.add('gw-hud-el');
      if(on){el._dragCfg={handle:null,force:true,onEnd:function(){var q=_DRAG.pos.get(el);if(q){ST.pos[p[0]]=[Math.round(q.dx||0),Math.round(q.dy||0)];save();}}};}
      else delete el._dragCfg;});
    var b=$('gwEdit');if(b){b.classList.toggle('on',on);b.textContent=on?'Done moving':'Move HUD pieces';}
  }
  function openLayout(){
    var p=$('gwLayout'),sh=$('gwShow');if(!p)return;sh.innerHTML='';
    EL.forEach(function(e){var l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=!ST.hidden[e[0]];
      c.onchange=function(){if(c.checked)delete ST.hidden[e[0]];else ST.hidden[e[0]]=1;save();applyVisibility();};l.appendChild(c);l.appendChild(document.createTextNode(e[1]));sh.appendChild(l);});
    applyPreset();p.style.display='block';
  }
  // ── Summon command buttons (F1-F4) ─────────────────────────────────
  var CMD=[['aiAuto','Auto','auto'],['aiAttack','Attack','offense'],['aiDefend','Defend','defense'],['aiPanel','Stance',null]];
  function buildCmd(){
    var row=$('hudHPBar')&&$('hudHPBar').parentNode;if(!row||$('gwCmd'))return;
    var d=document.createElement('div');d.id='gwCmd';
    CMD.forEach(function(c){var b=document.createElement('button');b.type='button';b.textContent=c[1];b.setAttribute('data-a',c[0]);
      b.addEventListener('click',function(ev){ev.stopPropagation();act(c[0]);syncCmd();});d.appendChild(b);});
    row.insertBefore(d,row.firstChild);
  }
  function syncCmd(){
    var d=$('gwCmd');if(!d)return;var mode=(typeof RS!=='undefined'&&RS&&RS.aiMode)||'auto';
    for(var i=0;i<d.children.length;i++){var b=d.children[i],c=CMD[i];b.classList.toggle('on',!!c[2]&&c[2]===mode);
      var k=KB_MAP[c[0]],kb=b.querySelector('.gw-key');
      if(!k){if(kb)kb.remove();b.title='Summons: '+c[1];continue;}
      if(!kb){kb=document.createElement('span');kb.className='gw-key';b.appendChild(kb);}
      var t=_kbKeyLabel(k);if(kb.textContent!==t)kb.textContent=t;b.title='Summons: '+c[1]+' ('+t+')';}
  }
  // ── Party frames ───────────────────────────────────────────────────
  function nice(k){return String(k||'').replace(/_e$/,'').replace(/_\d+$/,'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function partyRows(){
    var rows=[];if(typeof RS==='undefined'||!RS)return rows;
    try{if(typeof MP!=='undefined'&&MP&&MP.started&&MP._remoteNecros)Object.values(MP._remoteNecros).forEach(function(rn){if(!rn||rn.playerIdx===(MP.playerIdx||0))return;rows.push([rn.necroName||('Player '+((rn.playerIdx||0)+1)),rn.hp||0,rn.maxHP||1,!!rn.dead]);});}catch(e){}
    (RS._activeHeroes||[]).forEach(function(h){var d=(typeof HERO_DEFS!=='undefined'&&HERO_DEFS[h.heroId])||{};rows.push([d.name||nice(h.heroId),h.hp||0,h.maxHP||1,!!h.dead]);});
    if(RS.activePet&&RS.activePet.maxHP)rows.push([nice(RS.activePet.type),RS.activePet.hp||0,RS.activePet.maxHP,(RS.activePet.hp||0)<=0]);
    var M=(RS.minions||[]).filter(function(m){return m&&!m.dead&&(m.hp||0)>0;});
    if(M.length){var hp=0,mx=0;M.forEach(function(m){hp+=Math.max(0,m.hp||0);mx+=(m.maxHP||m.hp||1);});rows.push(['Minions \u00D7'+M.length,hp,mx,false,true]);}
    return rows;
  }
  function renderParty(){
    var P=$('gwParty');if(!P||P.style.display==='none')return;
    var mc=$('minimapCluster');if(mc&&!ST.pos.gwParty){var r=mc.getBoundingClientRect();if(r.height)P.style.top=Math.round(r.bottom+8)+'px';}
    var rows=partyRows(),key=rows.map(function(r){return r[0]+'|'+Math.round(100*r[1]/r[2])+'|'+r[3];}).join(';');
    if(P._k===key)return;P._k=key;
    while(P.children.length>rows.length)P.removeChild(P.lastChild);
    rows.forEach(function(r,i){var f=P.children[i];
      if(!f){f=document.createElement('div');f.className='pf';f.innerHTML='<i></i><b><span></span><span></span></b>';P.appendChild(f);}
      var pct=Math.max(0,Math.min(100,100*r[1]/r[2]));f.className='pf'+(r[3]?' dead':(pct<35?' low':''));
      f.firstChild.style.width=pct+'%';var sp=f.lastChild.children;if(sp[0].textContent!==r[0])sp[0].textContent=r[0];
      var t=r[3]?'down':Math.round(pct)+'%';if(sp[1].textContent!==t)sp[1].textContent=t;});
  }
  function decorate(){
    // Shortcut badges + tooltips on HUD buttons, read from the live key map
    var set=function(el,actn,label){if(!el)return;var k=KB_MAP[actn];var b=el.querySelector('.gw-key');
      if(!k){if(b)b.remove();el.title=label;return;}
      if(!b){b=document.createElement('span');b.className='gw-key';el.appendChild(b);}
      var t=_kbKeyLabel(k);if(b.textContent!==t)b.textContent=t;el.title=label+' ('+t+')';};
    set($('mapBtn'),'map','Map');set($('autoBtn'),'autoPlay','Auto-play');
    var at=$('autoToggle');if(at){var bs=at.querySelectorAll('button');if(bs[2])set(bs[2],'options','Settings');}
    var br=$('bottomRight');if(br){var q=br.querySelectorAll('button');if(q[0])set(q[0],'inventory','Inventory');if(q[1])set(q[1],'party','Party');if(q[2])set(q[2],'quests','Quest log');}
    set($('hudSkelBtn'),'aiPanel','Summons');
    buildCmd();syncCmd();
  }
  function init(){
    load();installKeys();installQueue();installTarget();installLog();installScale();
    document.addEventListener('keydown',onKey,true);
    setInterval(function(){if(inCombat()){try{syncCmd();renderParty();}catch(e){}}},250);
    document.addEventListener('keyup',function(e){ST.shift=!!e.shiftKey;},true);
    EL.forEach(function(p){var el=$(p[0]);if(el)el.classList.add('gw-hud-el');restorePos(p[0]);});
    applyPreset();applyVisibility();decorate();
    try{makeDraggable($('gwLayout'),$('gwLayout').querySelector('.hd'));}catch(e){}
    // refresh badges after the skill bar is rebuilt or keys are rebound; toggle the log with combat
    var ob=buildSpellBar;buildSpellBar=function(){var r=ob.apply(this,arguments);try{decorate();}catch(e){}return r;};
    var oc=closeKeyBindings;closeKeyBindings=function(){var r=oc.apply(this,arguments);try{decorate();}catch(e){}return r;};
    var was=false;setInterval(function(){var c=inCombat();if(c!==was){was=c;applyVisibility();if(c){var L=$('gwLogBody');if(L)L.innerHTML='';EL.forEach(function(p){restorePos(p[0]);});decorate();}else clearQ();}},300);
    // Settings row
    try{var kbBtn=$('openKeyBindingsBtn'),row=kbBtn&&kbBtn.closest('.set-row');
      if(row){var r2=row.cloneNode(true);r2.querySelector('.set-label').textContent='HUD Layout';r2.querySelector('.set-desc').textContent='Presets, show or hide pieces, move them';
        var ico=r2.querySelector('.set-ico');if(ico)ico.innerHTML=PxIcon.html('fullscreen',18);
        var nb=r2.querySelector('button');nb.id='openHudLayoutBtn';nb.textContent='HUD Layout';nb.setAttribute('onclick','GWHud.openLayout()');row.parentNode.insertBefore(r2,row.nextSibling);}}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  return {openLayout:openLayout,closeLayout:function(){$('gwLayout').style.display='none';if(ST.edit)setEdit(false);},preset:function(p){ST.preset=p;save();applyPreset();},edit:function(){setEdit(!ST.edit);},
    toggleLog:function(){ST.logClosed=!ST.logClosed;save();applyVisibility();},reset:function(){ST.pos={};save();EL.forEach(function(p){var el=$(p[0]);if(el&&typeof _dragApply==='function')_dragApply(el,0,0);});},log:log,_st:ST,remaining:remaining};
})();
// ── Raid zoom: mouse wheel on the raid view, or a two-finger pinch on it ──
var RaidZoom=(function(){
  var MIN=0.55,MAX=1.8,tm=null;
  function active(){var r=document.getElementById('raid');return !!(r&&r.classList.contains('active')&&typeof RS!=='undefined'&&RS&&!RS.done);}
  function set(f,quiet){
    f=Math.min(MAX,Math.max(MIN,f));if(Math.abs(f-_raidZoomF)<0.004)return;
    _raidZoomF=f;try{localStorage.setItem('necro_raid_zoom',f.toFixed(3));}catch(e){}
    if(!active())return;
    var cv=document.getElementById('gameCanvas');if(!cv)return;
    var W=parseFloat(cv.style.width)||cv.clientWidth,H=parseFloat(cv.style.height)||cv.clientHeight;
    GAME_ZOOM=raidZoomFor(W,H);RS.VW=W/GAME_ZOOM;RS.VH=H/GAME_ZOOM;
    RS.camX=Math.min(Math.max(RS.necro.x-RS.VW/2,0),Math.max(0,MAP-RS.VW));RS.camY=Math.min(Math.max(RS.necro.y-RS.VH/2,0),Math.max(0,MAP-RS.VH));
    if(!quiet){clearTimeout(tm);tm=setTimeout(function(){try{GWHud.log('Zoom '+Math.round(_raidZoomF*100)+'%','sys');}catch(e){}},350);}
  }
  document.addEventListener('wheel',function(e){
    if(!active()||!e.target||e.target.id!=='gameCanvas'||e.ctrlKey)return;
    e.preventDefault();set(_raidZoomF*(e.deltaY<0?1.1:1/1.1));
  },{passive:false});
  var pinch=null;
  function two(e){return e.touches.length===2&&e.touches[0].target&&e.touches[0].target.id==='gameCanvas'&&e.touches[1].target&&e.touches[1].target.id==='gameCanvas';}
  function dist(e){return Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
  document.addEventListener('touchstart',function(e){if(active()&&two(e))pinch={d:dist(e),f:_raidZoomF};},{passive:true});
  document.addEventListener('touchmove',function(e){if(!pinch||!active()||!two(e))return;var d=dist(e);if(pinch.d>10)set(pinch.f*d/pinch.d);},{passive:true});
  document.addEventListener('touchend',function(e){if(e.touches.length<2)pinch=null;},{passive:true});
  document.addEventListener('touchcancel',function(){pinch=null;},{passive:true});
  return {set:set,get:function(){return _raidZoomF;},reset:function(){set(1);}};
})();
