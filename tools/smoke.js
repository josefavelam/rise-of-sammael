// Smoke test: serve the repo (python3 -m http.server 8765) and run: node tools/smoke.js [port]
// Loads the game, checks the core globals, does a save/load round trip, opens the main panels and starts a raid. Exit code 1 on any page error.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const run=async(port,page)=>{const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[],cons=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,120));});
 await p.goto('http://localhost:'+port+'/'+page);await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{['featureHighlight','tutorialOverlay','portraitOverlay','dailyRewardsPanel'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.display='none';});
  const names=Object.getOwnPropertyNames(window).filter(k=>typeof window[k]==='function'&&!/^(webkit|on)/.test(k)).length;
  const lex=['GS','RAID_CONFIGS','SPELLS','MINIONS','EDEF','BOSSES','HERO_DEFS','TilesetEngine','SpriteAtlasManager','Grimoire','GWHud','RaidZoom','CloudSave','PxIcon','KB_MAP','MP'].map(k=>{try{return k+':'+typeof eval(k);}catch(e){return k+':ERR';}});
  // save / load round trip
  let save='';try{GS.bones=(GS.bones||0)+7;saveGame();save=localStorage.getItem('necro_v2_save')||'';loadGame();}catch(e){save='ERR '+e.message;}
  const out={names,lex:lex.join(' '),saveLen:save.length,bones:GS.bones,css:getComputedStyle(document.body).fontFamily.slice(0,30),bg:getComputedStyle(document.body).backgroundColor};
  for(const fn of ['openShop','closeShop','openArmy','closeArmy','openSettings','closeSettings','openVillage','openWorldMap','closeWorldMap','openCatacombs']){try{window[fn]&&window[fn]();await new Promise(r=>setTimeout(r,150));}catch(e){out['e_'+fn]=e.message;}}
  showScreen('castle');openGrimoire('bestiary');await new Promise(r=>setTimeout(r,300));closeGrimoire();
  selectRaid('cemetery');await new Promise(r=>setTimeout(r,3500));
  out.raid=!!(RS&&RS.grid&&RS.rooms.length);out.atlases=(()=>{try{return Object.keys(SpriteAtlasManager._atlases||SpriteAtlasManager.atlases||{}).length;}catch(e){return -1;}})();
  return out;});
 await p.screenshot({path:'sm_'+port+'.png'});await p.close();return {r,errs:errs.slice(0,5),cons:cons.filter(c=>!/pets\/|404/.test(c)).slice(0,5)};};
const A=await run(process.argv[2]||8765,'index.html');
console.log(JSON.stringify(A,null,1));process.exitCode=(A.errs.length||!A.r.raid)?1:0;
await b.close();})();
