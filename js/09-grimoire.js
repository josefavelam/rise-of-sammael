// ═══════════════════════════════════════════════════════════════════════
//  GRIMOIRE — Pokedex-style encyclopedia that replaces the old spellbook list.
//  Tabs: Summons (raise from the detail page) · Spells (equip from the detail page) ·
//  Heroes · Bestiary · Lore. Entries the player has not discovered show as silhouettes.
//  Discovery lives in GS.codex {seen:{key:1}, kills:{key:n}} and is saved with the game.
// ═══════════════════════════════════════════════════════════════════════
var Grimoire=(function(){
  var S={tab:'summons',sel:{},filter:{},q:'',list:[],raf:0,open:false,castleWasStopped:false};
  var $=function(id){return document.getElementById(id);};
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function codex(){if(!GS.codex||typeof GS.codex!=='object')GS.codex={seen:{},kills:{}};if(!GS.codex.seen)GS.codex.seen={};if(!GS.codex.kills)GS.codex.kills={};return GS.codex;}
  function pretty(k){return String(k).replace(/^(sw|tau|nw|me)_/,'').replace(/_e$/,'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function no(i){return ('00'+(i+1)).slice(-3);}

  // ── Data ───────────────────────────────────────────────────────────
  var _habitat=null;
  function habitat(){
    if(_habitat)return _habitat;
    var h={enemy:{},boss:{}};
    Object.keys(RAID_CONFIGS).forEach(function(rk){var c=RAID_CONFIGS[rk];
      (c.enemyPool||[]).forEach(function(e){(h.enemy[e]||(h.enemy[e]=[])).indexOf(c.name)<0&&h.enemy[e].push(c.name);});
      if(c.bossKey)(h.boss[c.bossKey]||(h.boss[c.bossKey]=[])).indexOf(c.name)<0&&h.boss[c.bossKey].push(c.name);});
    return _habitat=h;
  }
  // Which world map a region belongs to (for the region chips)
  var _MAPS=[['me','Middle Earth',function(){return typeof WORLD_REGIONS!=='undefined'?WORLD_REGIONS:null;}],['tau',"Tau'ri",function(){return typeof TAU_REGIONS!=='undefined'?TAU_REGIONS:null;}],['sw','Skyriver',function(){return typeof SW_REGIONS!=='undefined'?SW_REGIONS:null;}],['nw','Netherworld',function(){return typeof NW_REGIONS!=='undefined'?NW_REGIONS:null;}]];
  var _regIdx=null;
  function regionInfo(id){
    if(!_regIdx){_regIdx={};_MAPS.forEach(function(m){var t=m[2]();if(!t)return;(Array.isArray(t)?t:Object.keys(t).map(function(k){var r=t[k];if(r&&r.id===undefined)r=Object.assign({id:k},r);return r;})).forEach(function(r){if(!r||r.id===undefined)return;var v={map:m[0],mapName:m[1],name:r.name||String(r.id)};_regIdx[m[0]+':'+r.id]=v;if(!_regIdx[r.id])_regIdx[r.id]=v;});});}
    if(id===undefined||id===null)return null;
    // raid configs prefix the region id with the map on some maps (sw_tatooine)
    var pm=/^(sw|tau|nw|me)_(.+)$/.exec(String(id));
    return (pm&&_regIdx[pm[1]+':'+pm[2]])||_regIdx[id]||null;
  }
  var _raidMaps=null;
  function raidMaps(){
    // enemy/boss key -> world maps it appears on; raid key -> its map ('classic' = the three castle dungeons)
    if(_raidMaps)return _raidMaps;var o={ent:{},raid:{}};
    Object.keys(RAID_CONFIGS).forEach(function(rk){var c=RAID_CONFIGS[rk],ri=regionInfo(c.regionId),mp=ri?ri.map:'classic';o.raid[rk]={map:mp,region:ri?ri.name:''};
      (c.enemyPool||[]).concat(c.bossKey?[c.bossKey]:[]).forEach(function(k){(o.ent[k]||(o.ent[k]={}))[mp]=1;});});
    return _raidMaps=o;
  }
  function allBosses(){var o={};[BOSSES,REGION_BOSSES,(typeof SW_BOSSES!=='undefined'?SW_BOSSES:null)].forEach(function(t){if(t)Object.keys(t).forEach(function(k){if(!o[k])o[k]=t[k];});});return o;}
  function spellClass(sp){return sp.paladinOnly?'Paladin':sp.barbarianOnly?'Barbarian':sp.meruemOnly?'Wizard':sp.rangerOnly?'Ranger':'Necromancy';}
  function spellKind(sp){var t=sp.tgt;if(t==='raise')return 'Raise';if(t==='buff'||t==='selfBuff')return 'Buff';if(t==='selfHeal'||sp.heals&&!sp.dmg)return 'Heal';if(t==='debuff'||t==='dot')return 'Curse';if(t==='aoe')return 'Area';return 'Strike';}
  function role(d){var r=[];if(d.rng>60)r.push('ranged');else r.push('melee');if(d.spd>=2.2)r.push('fast');else if(d.spd<=1)r.push('slow');if(d.hp>=60)r.push('heavy');else if(d.hp<=12)r.push('frail');if(d.dmg>=18)r.push('hard-hitting');return r.join(', ');}
  function entries(tab){
    var cx=codex(),out=[];
    if(tab==='summons'){
      MIN_KEYS.slice().sort(function(a,b){return (MINIONS[a].unlockLv-MINIONS[b].unlockLv)||(crNum(MINIONS[a].cr)-crNum(MINIONS[b].cr));}).forEach(function(k){var m=MINIONS[k];
        out.push({k:k,name:m.name,spr:k,cat:m.cat,tag:'CR '+m.cr,known:GS.necroLv>=m.unlockLv||GS.skeletons.some(function(s){return s.type===k;}),hint:'Unlocks at level '+m.unlockLv});});
    } else if(tab==='spells'){
      SPELL_ORDER.slice().sort(function(a,b){return SPELLS[a].lv-SPELLS[b].lv;}).forEach(function(k){var sp=SPELLS[k];
        out.push({k:k,name:sp.name,ico:sp.ico,cat:spellClass(sp),kind:spellKind(sp),tag:'Lv '+sp.lv,known:GS.necroLv>=sp.lv,hint:'Learned at level '+sp.lv});});
    } else if(tab==='heroes'){
      Object.keys(HERO_DEFS).forEach(function(k){var h=HERO_DEFS[k];
        out.push({k:k,name:h.name,spr:h.spriteKey||('hero_'+k),cat:'hero',tag:h.title||'',known:!!(GS.heroes&&GS.heroes.unlocked&&GS.heroes.unlocked.has(k)),hint:'Recruit this hero to reveal the page'});});
    } else if(tab==='bestiary'){
      var hab=habitat();
      Object.keys(EDEF).forEach(function(k){var d=EDEF[k];if(d.merged)return;
        out.push({k:k,name:d.name||pretty(k),spr:k,cat:'enemy',tag:'',maps:raidMaps().ent[k]||{},known:!!cx.seen[k],hint:'Encounter this creature in a raid'});});
      var bs=allBosses();Object.keys(bs).forEach(function(k){
        out.push({k:k,name:bs[k].name||pretty(k),spr:k,cat:'boss',tag:'Boss',maps:raidMaps().ent[k]||{},known:!!cx.seen[k],hint:'Reach the final floor of its dungeon'});});
    } else if(tab==='lore'){
      Object.keys(RAID_CONFIGS).forEach(function(rk){var c=RAID_CONFIGS[rk];
        var known=!!(cx.seen['raid:'+rk])||(c.regionId&&GS.conquered&&GS.conquered[c.regionId])||(!c.regionId&&GS.necroLv>=(c.minLv||1));
        out.push({k:rk,name:c.name,ico:c.ico||'🏰',cat:c.biome||'dungeon',tag:(raidMaps().raid[rk]||{}).region||((c.floors||3)+' floors'),maps:(function(){var q={};q[(raidMaps().raid[rk]||{map:'classic'}).map]=1;return q;})(),region:(raidMaps().raid[rk]||{}).region||'',known:!!known,hint:'Enter this dungeon to record it'});});
      // read like an atlas: grouped by world map, then region
      var _ord={classic:0,me:1,tau:2,sw:3,nw:4};
      out.sort(function(a,b){var ma=_ord[Object.keys(a.maps)[0]]||0,mb=_ord[Object.keys(b.maps)[0]]||0;return (ma-mb)||String(a.region).localeCompare(String(b.region));});
    }
    out.forEach(function(e,i){e.i=i;});
    return out;
  }
  function chipsFor(tab){
    if(tab==='summons')return [['all','All'],['skeletal','Skeletal'],['flesh','Flesh'],['spiritual','Spiritual']];
    if(tab==='spells')return [['all','All'],['Necromancy','Necromancy'],['Paladin','Paladin'],['Barbarian','Barbarian'],['Wizard','Wizard'],['Ranger','Ranger']];
    var mapChips=[['map:me','Middle Earth'],['map:tau',"Tau'ri"],['map:sw','Skyriver'],['map:nw','Netherworld']];
    if(tab==='bestiary')return [['all','All'],['enemy','Creatures'],['boss','Bosses'],['known','Discovered']].concat(mapChips);
    if(tab==='lore')return [['all','All'],['known','Discovered'],['map:classic','Castle dungeons']].concat(mapChips);
    return [];
  }
  function visible(){
    var f=S.filter[S.tab]||'all',q=S.q.trim().toLowerCase();
    return S.list.filter(function(e){
      if(f==='known'){if(!e.known)return false;}
      else if(f.indexOf('map:')===0){if(!(e.maps&&e.maps[f.slice(4)]))return false;}
      else if(f!=='all'&&e.cat!==f)return false;
      if(q&&!(e.known&&e.name.toLowerCase().indexOf(q)>=0))return false;
      return true;});
  }

  // ── Sprites ────────────────────────────────────────────────────────
  // Sprites come in very different native sizes (16px atlas frames, 60px+ vector drawings).
  // Measure each once at scale 1, then draw at the largest whole-number scale that fits the frame.
  var _bbox={};
  function bboxOf(key){
    if(_bbox[key])return _bbox[key];
    var N=160,cv=document.createElement('canvas');cv.width=cv.height=N;var c=cv.getContext('2d',{willReadFrequently:true});
    c.translate(N/2,N*0.7);try{drawSprite(c,key,0,0,1,1,1.3);}catch(e){}
    var d;try{d=c.getImageData(0,0,N,N).data;}catch(e){return _bbox[key]={x0:-16,y0:-40,x1:16,y1:4};}
    var x0=N,y0=N,x1=-1,y1=-1;
    for(var y=0;y<N;y++)for(var x=0;x<N;x++){if(d[(y*N+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
    if(x1<0)return _bbox[key]={x0:-16,y0:-40,x1:16,y1:4};
    return _bbox[key]={x0:x0-N/2,y0:y0-N*0.7,x1:x1+1-N/2,y1:y1+1-N*0.7};
  }
  function drawSpr(cv,key,fit,known,t,pad){
    var c=cv.getContext('2d'),W=cv.width,H=cv.height,b=bboxOf(key),bw=Math.max(4,b.x1-b.x0),bh=Math.max(4,b.y1-b.y0);
    var room=Math.min((W-2*pad)/bw,(H-2*pad)/bh)*fit,sc=room>=1?Math.max(1,Math.floor(room*2)/2):room;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;
    c.save();c.translate(Math.round(W/2-((b.x0+b.x1)/2)*sc),Math.round(H-pad-b.y1*sc));
    try{drawSprite(c,key,0,0,sc,1,t);}catch(e){}
    c.restore();
    if(!known){c.save();c.globalCompositeOperation='source-in';c.fillStyle='#0d0816';c.fillRect(0,0,W,H);c.restore();}
  }
  function thumb(e){
    if(e.spr){var cv=document.createElement('canvas');cv.width=cv.height=44;drawSpr(cv,e.spr,1,e.known,1.3,4);return cv;}
    var d=document.createElement('div');d.className='grm-thumb';
    d.innerHTML=e.known?PxIcon.html(e.ico||'✨'):PxIcon.html('question');return d;
  }
  function spellFx(cv,sp,t){
    // Animated pixel preview of what the spell does: bolt, burst, aura or rising motes
    var c=cv.getContext('2d'),W=cv.width,H=cv.height,col=sp.color||'#a855f7',k=spellKind(sp);
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;
    var px=function(x,y,s,a){c.globalAlpha=a;c.fillStyle=col;c.fillRect(Math.round(x/4)*4,Math.round(y/4)*4,s,s);};
    var ph=(t*0.9)%1;
    // rune circle
    c.globalAlpha=.35;c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(W/2,H/2,W*0.40,0,6.283);c.stroke();
    c.globalAlpha=.2;c.beginPath();c.arc(W/2,H/2,W*0.31,t*0.6,t*0.6+4.6);c.stroke();
    if(k==='Strike'||k==='Curse'){
      for(var i=0;i<9;i++){var p=(ph+i*0.045)%1;px(W*0.16+p*W*0.68,H*0.72-Math.sin(p*3.14)*H*0.30+Math.sin(t*9+i)*3,i<3?8:4,1-i*0.09);}
      if(ph>0.82)for(var j=0;j<10;j++){var a=j*0.628;px(W*0.84+Math.cos(a)*(ph-0.82)*90,H*0.72+Math.sin(a)*(ph-0.82)*90,4,1-(ph-0.82)*5);}
    } else if(k==='Area'){
      for(var r=0;r<3;r++){var q=(ph+r/3)%1;for(var n=0;n<22;n++){var an=n*0.2856;px(W/2+Math.cos(an)*q*W*0.42,H/2+Math.sin(an)*q*W*0.42,4,1-q);}}
    } else if(k==='Raise'){
      for(var m=0;m<14;m++){var up=(ph+m*0.071)%1;px(W*0.28+((m*37)%60)/60*W*0.44,H*0.86-up*H*0.6,m%3?4:8,1-up);}
    } else {
      for(var b=0;b<16;b++){var ang=b*0.3927+t*1.4,rad=W*0.2+Math.sin(t*2+b)*8;px(W/2+Math.cos(ang)*rad,H/2+Math.sin(ang)*rad*0.9-((ph*30+b*7)%30),4,.9);}
    }
    c.globalAlpha=1;
    try{PxIcon.draw(c,sp.ico,W/2-36,H/2-36,72);}catch(e){}
  }

  // ── Detail pages ───────────────────────────────────────────────────
  function stat(label,val,frac){return '<div class="grm-stat"><span>'+label+'</span><b>'+val+'</b>'+(frac!=null?'<div class="grm-bar"><i style="width:'+Math.max(4,Math.min(100,Math.round(frac*100)))+'%"></i></div>':'')+'</div>';}
  function box(cls,h,inner){return '<div class="grm-box '+cls+'"><div class="grm-h">'+h+'</div>'+inner+'</div>';}
  function head(e,sub,badges,plateIsFx){
    return '<div class="grm-head"><div class="grm-plate"><canvas id="grmBig" width="'+(plateIsFx?188:200)+'" height="'+(plateIsFx?188:200)+'"></canvas></div><div class="grm-meta">'+
      '<div class="grm-entryno">No. '+no(e.i)+'</div><div class="grm-name">'+esc(e.known?e.name:'? ? ?')+'</div>'+
      '<div class="grm-sub">'+esc(sub||'')+'</div><div class="grm-badges">'+(badges||'')+'</div><div class="grm-act" id="grmAct"></div></div></div>';
  }
  function unknownPage(e){return head(e,'Undiscovered','<span class="grm-badge">Unknown</span>',!e.spr)+box('lore','How to discover','<div class="grm-txt"><i>'+esc(e.hint)+'.</i></div>');}
  // Written lore, in the voice of the necromancer's own book (José approved the voice and the staged reveal, 2026-10-08).
  // Creatures: the name is known on sight; the entry is written after ten kills (one for a dungeon lord).
  var LORE={"cultist": "They came to the cemetery to worship what lies in it. None of them asked what it wanted in return. Thin robes, borrowed knives, and a hymn that stops when the first one falls.", "skeleton_e": "Somebody else's work, and careless work: the binding is loose at the hips and it favours its left side. It will still kill a tired minion.", "zombie_e": "Slow because the flesh remembers being heavy. It does not turn aside, does not flank and does not stop. Let it come and take it apart on the way.", "ghoul_e": "A ghoul is hunger with a spine. It goes for whatever is already wounded, which makes it easy to bait and expensive to ignore.", "wight_e": "A soldier who kept his oath past the point where it meant anything. The cold around it is not weather. Strong enough to be worth raising, if it can be put down first.", "gravedigger": "He buried half the town and resents every hole reopened. The shovel has an edge on it now. He knows the ground better than anyone living or dead.", "forest_wolf": "Grey, lean and never alone. The pack tests the edge of the army first and commits only when something limps.", "forest_witch": "She keeps to the trees and lets the hex do the walking. Close the distance and she is an old woman with a stick; fail to and half the army forgets how to hit.", "treant": "Older than the cemetery wall. It moves like a decision being made. Fire annoys it, axes insult it, and patience is the only thing it truly respects.", "banshee": "The scream arrives before she does. Minions bound loosely come apart at the sound; the well-made ones only flinch. She is grieving someone and it is not the necromancer.", "death_knight": "Plate armour with a grudge inside. It fights by the drill book of an army that no longer exists and has had centuries to practise.", "lich_acolyte": "A student of the same art, further along in obedience and further behind in talent. They raise poorly, but they raise often.", "shadow_demon": "It is not in the room so much as the room is slightly inside it. Lanterns help. So does not standing still.", "wraith_e": "What is left when the body is taken away and the anger is not. Blades pass through on the first swing and connect on the second, once it has decided to be there.", "orc_scout": "Travels light, sees first and runs to tell the others. Kill it quickly or fight everyone it knows.", "orc_warrior": "The main line. No finesse, no fear, and a shield it uses as a second weapon.", "orc_archer": "Stays behind the warriors and aims at whatever is casting. It considers this a fair fight.", "wight_lord": "Lord of the Cemetery of the Damned. Every wight in the yard was once in his company and still answers the horn. He gets worse when he is losing.", "forest_hag": "The forest's oldest tenant. The wolves are hers, the witches are her daughters or say they are, and the trees lean away from her hut.", "lich": "The one who did it first and did it properly. The crown is real, the eyes are not, and the phylactery is the only thing in the Sanctum he looks at twice.", "skel_rat": "The first thing most necromancers raise and the last thing they are proud of. Cheap, fast, and gone in one hit.", "skel_bat": "It has no wings left to speak of and flies anyway. Nobody has explained this to it.", "bone_crawler": "Assembled from whatever was nearest. Eight legs is an estimate.", "skeleton": "Obedient, tireless and entirely without initiative. The backbone of every army, in the literal sense.", "zombie": "Holds a doorway better than a door does. Do not ask it to hurry.", "skel_warrior": "Someone who knew how to use a sword, raised by someone who knew to leave that part alone.", "skel_archer": "Perfect patience and no breath to steady. The aim has only improved.", "skel_wolf": "Still hunts in a pack if given one. Still goes for the weakest.", "shadow": "A servant made from what a body casts. It saps the strength of whatever it touches and cannot be made to carry anything.", "will_o_wisp": "A light that leads the living off the path. Small, fragile and oddly cheerful about its work."};
  var LORE_KILLS=10;
  function pageSummon(e){
    var m=MINIONS[e.k],cost=GS.effectiveCost(e.k),own=GS.skeletons.filter(function(s){return s.type===e.k&&s.hp>0;}).length;
    var h=head(e,(CAT_LABELS[m.cat]||m.cat).replace(/^\S+\s/,'')+' undead','<span class="grm-badge p">CR '+m.cr+'</span><span class="grm-badge">Unlock Lv '+m.unlockLv+'</span>'+(own?'<span class="grm-badge g">'+own+' raised</span>':''));
    h+=box('stats','Vital statistics','<div class="grm-stats">'+stat('Health',m.hp,m.hp/260)+stat('Damage',m.dmg,m.dmg/60)+stat('Speed',m.spd.toFixed(1),m.spd/3.2)+stat('Reach',m.rng>60?'Ranged':'Melee')+stat('Attack every',m.cd+'s')+stat('Bone cost',cost+(cost!==m.cost?' (was '+m.cost+')':''))+'</div>');
    h+=box('lore','Field notes','<div class="grm-txt">'+esc(LORE[e.k]||m.flavor||'')+(m.raidSlots==='all'?' <i>Takes every raid slot.</i>':'')+'</div>');
    return h;
  }
  function pageSpell(e){
    var sp=SPELLS[e.k],b='<span class="grm-badge b">'+spellClass(sp)+'</span><span class="grm-badge">'+spellKind(sp)+'</span><span class="grm-badge p">Level '+sp.lv+'</span>';
    var h=head(e,sp.isStrike?'Always prepared':'Prepared spell',b,true),st='';
    st+=stat('Cooldown',sp.cd+'s',1-Math.min(1,sp.cd/40));
    if(sp.dmg)st+=stat('Damage',sp.dmg,sp.dmg/160);
    if(sp.heals||sp.healAmt)st+=stat('Healing',sp.heals||sp.healAmt);
    st+=stat('Range',sp.rng?sp.rng:'Self',sp.rng?sp.rng/400:null);
    if(sp.buffDmg)st+=stat('Bonus damage','+'+sp.buffDmg);
    if(sp.buffDur||sp.debuffDur||sp.dotDur)st+=stat('Duration',(sp.buffDur||sp.debuffDur||sp.dotDur)+'s');
    if(sp.shieldAmt)st+=stat('Shield',sp.shieldAmt);
    if(sp.stunDur)st+=stat('Stun',sp.stunDur+'s');
    if(sp.raiseMax)st+=stat('Raises up to',sp.raiseMax);
    h+=box('stats','Properties','<div class="grm-stats">'+st+'</div>');
    h+=box('abil','Effect','<div class="grm-txt">'+esc(sp.desc||'')+'</div>');
    return h;
  }
  function pageHero(e){
    var hd=HERO_DEFS[e.k],lv=(GS.heroes&&GS.heroes.levels&&GS.heroes.levels[e.k]&&GS.heroes.levels[e.k].lv)||1;
    var h=head(e,hd.title||'Hero','<span class="grm-badge">Hero</span><span class="grm-badge g">Level '+lv+'</span>');
    h+=box('stats','Vital statistics','<div class="grm-stats">'+stat('Health',hd.baseHP,hd.baseHP/400)+stat('Damage',hd.baseDMG,hd.baseDMG/60)+stat('Speed',(+hd.baseSpd).toFixed(1),hd.baseSpd/3.2)+stat('Reach',hd.atkRange>60?'Ranged':'Melee')+stat('Attack every',hd.atkCD+'s')+'</div>');
    if(hd.skills&&hd.skills.length)h+=box('abil','Abilities',hd.skills.map(function(s,i){return '<div class="grm-txt"><b>'+esc(s)+'</b> &mdash; '+esc((hd.skillDescs||[])[i]||'')+'</div>';}).join(''));
    var q=(hd.dialogues&&hd.dialogues.length)?hd.dialogues[(e.i*7+lv)%hd.dialogues.length]:'';
    h+=box('lore','Chronicle','<div class="grm-txt">'+esc(hd.desc||'')+(q?'<br><i>&ldquo;'+esc(q)+'&rdquo;</i>':'')+'</div>');
    return h;
  }
  function pageBeast(e){
    var isB=e.cat==='boss',d=isB?allBosses()[e.k]:EDEF[e.k],hab=(isB?habitat().boss[e.k]:habitat().enemy[e.k])||[],kills=codex().kills[e.k]||0;
    var h=head(e,isB?'Dungeon lord':'Hostile creature',(isB?'<span class="grm-badge r">Boss</span>':'<span class="grm-badge">Creature</span>')+'<span class="grm-badge g">'+kills+' slain</span>');
    var rew=[];if(d.bones)rew.push((Array.isArray(d.bones)?d.bones.join('-'):d.bones)+' bones');if(d.gp)rew.push(d.gp.join('-')+' gold');else if(d.sp)rew.push(d.sp.join('-')+' silver');else if(d.cp)rew.push(d.cp.join('-')+' copper');
    h+=box('stats','Vital statistics','<div class="grm-stats">'+stat('Health',d.hp,d.hp/(isB?900:120))+stat('Damage',d.dmg,d.dmg/(isB?60:30))+stat('Speed',(+d.spd).toFixed(2),d.spd/2.6)+stat('Reach',d.rng>60?'Ranged':'Melee')+stat('Attack every',d.cd+'s')+stat('Experience',d.xp||0)+(isB&&d.phase2HP?stat('Enrages below',d.phase2HP+' HP'):'')+'</div>');
    h+=box('lore','Field notes','<div class="grm-txt">'+(isB?'A dungeon lord':'A '+role(d)+' foe')+(hab.length?' found in <b>'+esc(hab.slice(0,3).join(', '))+'</b>'+(hab.length>3?' and '+(hab.length-3)+' other places':''):'')+'.'+(rew.length?' Leaves '+esc(rew.join(', '))+'.':'')+(d.special?' <i>Special: '+esc(d.special)+'.</i>':'')+'</div>');
    if(LORE[e.k]){var need=isB?1:LORE_KILLS;
      h+=box('lore',"From the necromancer's book",kills>=need?'<div class="grm-txt">'+esc(LORE[e.k])+'</div>':'<div class="grm-txt"><i>The page is still blank. '+(isB?'Defeat this lord once':'Slay '+(need-kills)+' more')+' and the entry writes itself.</i></div>');}
    return h;
  }
  function pageLore(e){
    var c=RAID_CONFIGS[e.k],boss=c.bossKey&&getBossDef(c.bossKey),cx=codex();
    var pool=[];(c.enemyPool||[]).forEach(function(k){if(pool.indexOf(k)<0)pool.push(k);});
    var ri=regionInfo(c.regionId);
    var h=head(e,(ri?ri.name+' \u00b7 '+ri.mapName:pretty(c.biome||'dungeon')+' dungeon'),'<span class="grm-badge">'+(c.floors||3)+' floors</span><span class="grm-badge p">Requires Lv '+(c.minLv||1)+'</span>',true);
    h+=box('lore','Denizens','<div class="grm-txt">'+pool.map(function(k){return cx.seen[k]?esc((EDEF[k]&&EDEF[k].name)||pretty(k)):'<i>???</i>';}).join(', ')+'</div>');
    if(boss)h+=box('abil','Lord of the dungeon','<div class="grm-txt">'+(cx.seen[c.bossKey]?'<b>'+esc(boss.name)+'</b> &mdash; '+boss.hp+' health, '+boss.dmg+' damage.':'<i>Unknown. Reach the final floor.</i>')+'</div>');
    return h;
  }
  function fb(msg,col){var f=$('grmFb');if(f){f.textContent=msg||'';f.style.color=col||'#2f6b3a';}}
  function actions(e){
    var a=$('grmAct');if(!a||!e.known)return;
    if(S.tab==='summons'){
      var m=MINIONS[e.k],cost=GS.effectiveCost(e.k),locked=GS.necroLv<m.unlockLv;
      var full=totalRosterUnits()>=armyCap(GS.necroLv),crFull=(barracksCR()+crNum(m.cr))>crCap(GS.necroLv)+0.001,poor=GS.bones<cost;
      var btn=document.createElement('button');btn.className='grm-btn';btn.innerHTML='Raise &middot; '+cost+' bones';btn.disabled=locked||full||crFull||poor;
      btn.onclick=function(){tryCraft(e.k);var o=$('sbFeedback');var good=GS.skeletons.length;render(false);fb(o?o.textContent:'',o&&o.style.color.indexOf('red')>=0?'#8a2323':'#2f6b3a');};
      a.appendChild(btn);
      var s=document.createElement('span');s.className='grm-fb';s.id='grmFb';s.textContent=locked?'Requires level '+m.unlockLv:full?'Army is full':crFull?'CR cap reached':poor?'Need '+(cost-GS.bones)+' more bones':'You have '+GS.bones+' bones';if(locked||full||crFull||poor)s.style.color='#8a2323';a.appendChild(s);
    } else if(S.tab==='spells'){
      var sp=SPELLS[e.k];if(sp.isStrike){a.innerHTML='<span class="grm-fb" id="grmFb">Always equipped</span>';return;}
      var usable=(typeof _grmSpellUsable==='function')?_grmSpellUsable(e.k):true;
      var eq=GS.equippedSpells.has(e.k),n=(GS.equippedSpellsOrdered||[]).filter(function(k){return GS.equippedSpells.has(k)&&SPELLS[k]&&GS.necroLv>=SPELLS[k].lv;}).length,cap=n>=4;
      var b2=document.createElement('button');b2.className='grm-btn'+(eq?' off':'');b2.textContent=eq?'Unequip':'Equip';b2.disabled=!usable||(!eq&&cap);
      b2.onclick=function(){
        if(eq){GS.equippedSpells.delete(e.k);GS.equippedSpellsOrdered=(GS.equippedSpellsOrdered||[]).filter(function(k){return k!==e.k;});}
        else if(!cap){GS.equippedSpells.add(e.k);(GS.equippedSpellsOrdered||(GS.equippedSpellsOrdered=[])).push(e.k);}
        if(typeof RS!=='undefined'&&RS)RS._eqSpells=null;
        try{if(typeof renderSBContent==='function'&&$('sbContent'))renderSBContent();}catch(er){}
        render(false);};
      a.appendChild(b2);
      var s2=document.createElement('span');s2.className='grm-fb';s2.id='grmFb';s2.textContent=!usable?'Not usable by your current class':eq?'Equipped ('+n+'/4)':cap?'All 4 slots are full':n+'/4 slots used';if(!usable||(!eq&&cap))s2.style.color='#8a2323';a.appendChild(s2);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  function current(){var v=visible(),k=S.sel[S.tab];for(var i=0;i<v.length;i++)if(v[i].k===k)return v[i];return v[0]||null;}
  function renderList(){
    var L=$('grmList'),v=visible(),cur=current();L.innerHTML='';
    if(!v.length){L.innerHTML='<div class="grm-empty">No pages match.</div>';return;}
    var frag=document.createDocumentFragment();
    v.forEach(function(e){
      var r=document.createElement('div');r.className='grm-row'+(e.known?'':' unk')+(cur&&cur.k===e.k?' on':'');r.dataset.k=e.k;
      var n=document.createElement('span');n.className='grm-no';n.textContent=no(e.i);r.appendChild(n);
      r.appendChild(thumb(e));
      var nm=document.createElement('span');nm.className='grm-nm';nm.textContent=e.known?e.name:'? ? ?';r.appendChild(nm);
      if(e.tag&&e.known){var tg=document.createElement('span');tg.className='grm-tag';tg.textContent=e.tag;r.appendChild(tg);}
      r.onclick=function(){select(e.k,true);};
      frag.appendChild(r);});
    L.appendChild(frag);
    var on=L.querySelector('.grm-row.on');if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest'});}catch(er){}
  }
  function renderDetail(turn){
    var D=$('grmDetail'),e=current(),v=visible();
    if(!e){D.innerHTML='<div class="grm-empty">The page is blank.</div>';$('grmPageNo').textContent='';return;}
    S.sel[S.tab]=e.k;
    var html=!e.known?unknownPage(e):S.tab==='summons'?pageSummon(e):S.tab==='spells'?pageSpell(e):S.tab==='heroes'?pageHero(e):S.tab==='bestiary'?pageBeast(e):pageLore(e);
    D.innerHTML=html;D.scrollTop=0;actions(e);
    var idx=v.indexOf(e);$('grmPageNo').textContent='Page '+(idx+1)+' of '+v.length;
    $('grmPrev').disabled=idx<=0;$('grmNext').disabled=idx>=v.length-1;
    if(turn){var R=$('grmRight');R.classList.remove('turn');void R.offsetWidth;R.classList.add('turn');}
    paint(performance.now()/1000);
  }
  function paint(t){
    var cv=$('grmBig'),e=current();if(!cv||!e)return;
    if(e.spr){drawSpr(cv,e.spr,e.cat==='boss'?1:0.86,e.known,t,18);}
    else if(S.tab==='spells'&&e.known){spellFx(cv,SPELLS[e.k],t);}
    else{var c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
      try{PxIcon.draw(c,e.known?(e.ico||'castle'):'question',cv.width/2-56,cv.height/2-56+Math.sin(t*2)*3,112);}catch(er){}}
  }
  function loop(){if(!S.open)return;paint(performance.now()/1000);S.raf=requestAnimationFrame(loop);}
  function renderChips(){
    var C=$('grmChips'),ch=chipsFor(S.tab),f=S.filter[S.tab]||'all';C.innerHTML='';
    ch.forEach(function(p){var b=document.createElement('button');b.className='grm-chip'+(f===p[0]?' on':'');b.textContent=p[1];b.onclick=function(){S.filter[S.tab]=p[0];render(true);};C.appendChild(b);});
  }
  function render(turn){
    S.list=entries(S.tab);
    document.querySelectorAll('#grimoire .grm-tab').forEach(function(b){b.classList.toggle('on',b.dataset.t===S.tab);});
    var known=S.list.filter(function(e){return e.known;}).length;$('grmCount').textContent='Discovered '+known+' / '+S.list.length;
    renderChips();renderList();renderDetail(turn);
  }
  function select(k,turn){S.sel[S.tab]=k;document.querySelectorAll('#grmList .grm-row').forEach(function(r){r.classList.toggle('on',r.dataset.k===k);});renderDetail(turn);$('grmPages').classList.add('detail');}
  function step(d){var v=visible(),e=current(),i=v.indexOf(e)+d;if(i<0||i>=v.length)return;select(v[i].k,true);var on=$('grmList').querySelector('.grm-row.on');if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest'});}catch(er){}}
  function tab(t){S.tab=t;S.q='';var s=$('grmSearch');if(s)s.value='';$('grmPages').classList.remove('detail');render(true);}
  function open(t){
    var g=$('grimoire');if(!g)return;
    backfill();
    S.open=true;if(t)S.tab=t;S.q='';var s=$('grmSearch');if(s)s.value='';
    g.style.display='flex';$('grmPages').classList.remove('detail');render(true);
    cancelAnimationFrame(S.raf);S.raf=requestAnimationFrame(loop);
    try{if(typeof SND!=='undefined'&&SND.menuOpen)SND.menuOpen();}catch(e){}
    try{if(typeof Analytics!=='undefined')Analytics.panelOpen('spellbook');}catch(e){}
  }
  function close(){
    var g=$('grimoire');if(!g||!S.open)return;S.open=false;cancelAnimationFrame(S.raf);g.style.display='none';
    try{if(typeof SND!=='undefined'&&SND.menuClose)SND.menuClose();}catch(e){}
    try{if(typeof renderHub==='function')renderHub();if(typeof renderArmy==='function')renderArmy();}catch(e){}
    // If the castle room loop was stopped to open the book, start it again
    try{var cs=$('castle');if(cs&&cs.classList.contains('active')&&typeof _crAnimId!=='undefined'&&!_crAnimId&&typeof startCastleRoom==='function')startCastleRoom();}catch(e){}
  }
  // ── Discovery tracking ─────────────────────────────────────────────
  function sweep(){
    try{
      if(typeof GS==='undefined')return;var cx=codex();
      var mark=function(e){if(!e||!e.type)return;var k=e.baseKey||e.type;cx.seen[k]=1;if(e.dead&&!e._cdx){e._cdx=1;cx.kills[k]=(cx.kills[k]||0)+1;}};
      if(typeof RS!=='undefined'&&RS&&!RS.done){
        if(RS.raidKey)cx.seen['raid:'+RS.raidKey]=1;
        (RS.enemies||[]).forEach(mark);
        if(RS.boss&&RS.cfg&&RS.cfg.bossKey){var bk=RS.cfg.bossKey;cx.seen[bk]=1;if(RS.boss.dead&&!RS.boss._cdx){RS.boss._cdx=1;cx.kills[bk]=(cx.kills[bk]||0)+1;}}
      }
      if(typeof SV!=='undefined'&&SV&&SV.waveEnemies)SV.waveEnemies.forEach(mark);
    }catch(e){}
  }
  var _bf=false;
  function backfill(){
    // Existing saves predate the codex: credit what the player has demonstrably already met.
    if(_bf)return;_bf=true;
    try{var cx=codex();if(cx.bf)return;cx.bf=1;
      Object.keys(GS.fastestBossClears||{}).forEach(function(k){if(getBossDef(k)){cx.seen[k]=1;cx.kills[k]=cx.kills[k]||1;}});
      (GS.raisedBosses||[]).forEach(function(b){var k=b&&(b.key||b.type||b);if(typeof k==='string'&&getBossDef(k))cx.seen[k]=1;});
      Object.keys(RAID_CONFIGS).forEach(function(rk){var c=RAID_CONFIGS[rk];
        if(c.regionId&&GS.conquered&&GS.conquered[c.regionId]){cx.seen['raid:'+rk]=1;(c.enemyPool||[]).forEach(function(e){cx.seen[e]=1;});}});
      if((GS.totalEnemiesKilled||0)>0)(RAID_CONFIGS.cemetery.enemyPool||[]).forEach(function(e){cx.seen[e]=1;});
    }catch(e){}
  }
  setInterval(sweep,1000);
  document.addEventListener('keydown',function(e){
    if(!S.open)return;
    var typing=document.activeElement&&document.activeElement.id==='grmSearch';
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(typing&&S.q){S.q='';$('grmSearch').value='';render(false);}else close();return;}
    if(typing){e.stopImmediatePropagation();return;}
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();step(1);}
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();step(-1);}
    e.stopImmediatePropagation();
  },true);
  return {open:open,close:close,tab:tab,step:step,search:function(q){S.q=q||'';renderList();renderDetail(false);},back:function(){$('grmPages').classList.remove('detail');},sweep:sweep,_state:S};
})();
// Same class restrictions the old spellbook list applied
function _grmSpellUsable(k){try{return !!(k!=='staffStrike'&&((_rikkerActive&&SPELLS[k]?.paladinOnly)||(_meltingActive&&SPELLS[k]?.barbarianOnly)||(_meruemActive&&SPELLS[k]?.meruemOnly)||(_esojActive&&SPELLS[k]?.rangerOnly)||((!_rikkerActive&&!_meltingActive&&!_meruemActive&&!_esojActive)&&!SPELLS[k]?.paladinOnly&&!SPELLS[k]?.barbarianOnly&&!SPELLS[k]?.meruemOnly&&!SPELLS[k]?.rangerOnly)));}catch(e){return true;}}
function openGrimoire(tab){Grimoire.open(tab);}
function closeGrimoire(){Grimoire.close();}
// The book replaces both old spellbook entry points (full-screen list and castle overlay)
var _grmOldOpenSB=(typeof openSB==='function')?openSB:null;
openSB=function(){openGrimoire('summons');};
var _grmOldOpenCastleSB=(typeof openCastleSBOverlay==='function')?openCastleSBOverlay:null;
openCastleSBOverlay=function(){openGrimoire('summons');};
