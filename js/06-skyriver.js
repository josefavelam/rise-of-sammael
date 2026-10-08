// ═══════════════════════════════════════════════════════════
//  STAR WARS MAP  —  Skyriver  (Episodes I–VI)
// ═══════════════════════════════════════════════════════════

// ── 20 regions spread across the galaxy ──
var SW_REGIONS=[
  // Prequel worlds (outer rim / republic)
  {id:'tatooine',      name:'Tatooine',             lv:1, x:.18,y:.72, terrain:'desert',   color:'#f59e0b', faction:'sw_outer'},
  {id:'naboo',         name:'Naboo',                lv:1, x:.30,y:.60, terrain:'plains',   color:'#22c55e', faction:'sw_outer'},
  {id:'coruscant',     name:'Coruscant',            lv:2, x:.50,y:.42, terrain:'mountain', color:'#60a5fa', faction:'sw_republic'},
  {id:'geonosis',      name:'Geonosis',             lv:2, x:.36,y:.76, terrain:'desert',   color:'#d97706', faction:'sw_outer'},
  {id:'kamino',        name:'Kamino',               lv:3, x:.14,y:.32, terrain:'tundra',   color:'#93c5fd', faction:'sw_republic'},
  {id:'kashyyyk',      name:'Kashyyyk',             lv:3, x:.42,y:.62, terrain:'forest',   color:'#16a34a', faction:'sw_republic'},
  {id:'utapau',        name:'Utapau',               lv:4, x:.27,y:.48, terrain:'wasteland',color:'#a78bfa', faction:'sw_republic'},
  {id:'mustafar',      name:'Mustafar',             lv:4, x:.62,y:.78, terrain:'wasteland',color:'#ef4444', faction:'sw_outer'},
  // Classic trilogy worlds (rebel / empire)
  {id:'alderaan',      name:'Alderaan',             lv:5, x:.46,y:.30, terrain:'plains',   color:'#7dd3fc', faction:'sw_rebel'},
  {id:'yavin_iv',      name:'Yavin IV',             lv:5, x:.66,y:.28, terrain:'forest',   color:'#86efac', faction:'sw_rebel'},
  {id:'hoth',          name:'Hoth',                 lv:6, x:.12,y:.18, terrain:'tundra',   color:'#e2e8f0', faction:'sw_rebel'},
  {id:'dagobah',       name:'Dagobah',              lv:6, x:.56,y:.64, terrain:'swamp',    color:'#4ade80', faction:'sw_rebel'},
  {id:'bespin',        name:'Bespin',               lv:7, x:.38,y:.26, terrain:'plains',   color:'#fcd34d', faction:'sw_empire'},
  {id:'endor',         name:'Endor',                lv:7, x:.72,y:.50, terrain:'forest',   color:'#15803d', faction:'sw_rebel'},
  {id:'death_star_i',  name:'Death Star I',         lv:7, x:.82,y:.22, terrain:'sanctum',  color:'#6b7280', faction:'sw_empire'},
  {id:'cloud_city',    name:'Cloud City',           lv:8, x:.24,y:.38, terrain:'plains',   color:'#fbbf24', faction:'sw_empire'},
  {id:'jabba_palace',  name:"Jabba's Palace",       lv:8, x:.18,y:.82, terrain:'desert',   color:PALETTE.brownLt, faction:'sw_outer'},
  // End-game empire strongholds
  {id:'executor',      name:'Executor',             lv:9, x:.74,y:.14, terrain:'sanctum',  color:'#4b5563', faction:'sw_empire'},
  {id:'death_star_ii', name:'Death Star II',        lv:9, x:.86,y:.58, terrain:'sanctum',  color:'#374151', faction:'sw_empire'},
  {id:'endor_bunker',  name:'Endor Shield Bunker',  lv:9, x:.78,y:.72, terrain:'forest',   color:'#166534', faction:'sw_empire'},
];

const SW_FACTIONS={
  sw_outer:   {name:'Outer Rim',      color:'#f59e0b', members:['tatooine','naboo','geonosis','mustafar','jabba_palace']},
  sw_republic:{name:'The Republic',   color:'#60a5fa', members:['coruscant','kamino','kashyyyk','utapau']},
  sw_rebel:   {name:'Rebel Alliance', color:'#22c55e', members:['alderaan','yavin_iv','hoth','dagobah','endor']},
  sw_empire:  {name:'Galactic Empire',color:'#94a3b8', members:['bespin','death_star_i','cloud_city','executor','death_star_ii','endor_bunker']},
};
const SW_FACTION_ORDER=['sw_outer','sw_republic','sw_rebel','sw_empire'];

function swFactionCleared(fId){
  const f=SW_FACTIONS[fId];if(!f)return true;
  return f.members.every(id=>{const c=GS.conquered['sw_'+id]||{};return c.easy&&c.medium&&c.hard;});
}
function swFactionOf(regionId){return Object.keys(SW_FACTIONS).find(f=>SW_FACTIONS[f].members.includes(regionId))||null;}
function swRegionAccessible(r){
  if(r.lv>GS.necroLv)return false;
  const fi=SW_FACTION_ORDER.indexOf(swFactionOf(r.id));
  for(let i=0;i<fi;i++)if(!swFactionCleared(SW_FACTION_ORDER[i]))return false;
  return true;
}

// ── 60 unique Star Wars bosses ──
var SW_BOSSES={
  sw_sand_daemon:      {name:'Sand Daemon of Tatooine',   hp:122,maxHP:122,dmg:16,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:6500, phase2HP:61, fortHP:30,color:'#f59e0b',size:1.2},
  sw_krayt_specter:    {name:'Krayt Dragon Specter',       hp:162,maxHP:162,dmg:19,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:10500,phase2HP:81, fortHP:40,color:'#d97706',size:1.45},
  sw_tusken_warlord:   {name:'Tusken Warlord Risen',       hp:221,maxHP:221,dmg:24,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:15500,phase2HP:110,fortHP:55,color:PALETTE.brownLt,size:1.55},
  sw_gungan_shade:     {name:'Gungan War Shade',           hp:122,maxHP:122,dmg:16,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:6500, phase2HP:61, fortHP:30,color:'#22c55e',size:1.2},
  sw_viceroy_wraith:   {name:'Viceroy Trade Wraith',       hp:162,maxHP:162,dmg:19,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:10500,phase2HP:81, fortHP:40,color:'#4ade80',size:1.35},
  sw_maul_shade:       {name:"Darth Maul's Shadow",        hp:221,maxHP:221,dmg:24,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:15500,phase2HP:110,fortHP:55,color:'#dc2626',size:1.55},
  sw_senate_ghost:     {name:'Senate District Revenant',   hp:144,maxHP:144,dmg:17,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:7000, phase2HP:72, fortHP:36,color:'#60a5fa',size:1.2},
  sw_chancellor_shade: {name:"Chancellor's Shade",         hp:194,maxHP:194,dmg:21,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:11000,phase2HP:97, fortHP:48,color:'#3b82f6',size:1.35},
  sw_sith_phantom:     {name:'Sith Phantom of Coruscant',  hp:267,maxHP:267,dmg:27,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:16000,phase2HP:134,fortHP:67,color:'#1d4ed8',size:1.55},
  sw_geonosis_queen:   {name:'Geonosian Queen Undead',     hp:144,maxHP:144,dmg:17,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:7000, phase2HP:72, fortHP:36,color:'#d97706',size:1.4},
  sw_droid_overlord:   {name:'Battle Droid Overlord',      hp:194,maxHP:194,dmg:21,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:11000,phase2HP:97, fortHP:48,color:PALETTE.brownLt,size:1.35},
  sw_dooku_shade:      {name:"Count Dooku's Shade",        hp:267,maxHP:267,dmg:27,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:16000,phase2HP:134,fortHP:67,color:PALETTE.brown,size:1.55},
  sw_kaminoan_specter: {name:'Kaminoan Specter',           hp:166,maxHP:166,dmg:18,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:7500, phase2HP:83, fortHP:42,color:'#93c5fd',size:1.2},
  sw_clone_revenant:   {name:'Clone Trooper Revenant',     hp:226,maxHP:226,dmg:23,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:11500,phase2HP:113,fortHP:56,color:'#7dd3fc',size:1.35},
  sw_jango_risen:      {name:'Jango Fett Risen',           hp:313,maxHP:313,dmg:30,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:16500,phase2HP:156,fortHP:78,color:'#0ea5e9',size:1.55},
  sw_wookiee_berserker:{name:'Wookiee Berserker Risen',    hp:188,maxHP:188,dmg:20,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:8000, phase2HP:94, fortHP:47,color:'#16a34a',size:1.5},
  sw_grievous_shade:   {name:"General Grievous Shade",     hp:258,maxHP:258,dmg:25,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:12000,phase2HP:129,fortHP:64,color:'#15803d',size:1.35},
  sw_kashyyyk_titan:   {name:'Kashyyyk Forest Titan',      hp:359,maxHP:359,dmg:32,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:17000,phase2HP:180,fortHP:90,color:'#166534',size:1.7},
  sw_sinkhole_daemon:  {name:'Sinkhole Daemon',            hp:188,maxHP:188,dmg:20,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:8000, phase2HP:94, fortHP:47,color:'#a78bfa',size:1.2},
  sw_pau_city_horror:  {name:'Pau City Horror',            hp:258,maxHP:258,dmg:25,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:12000,phase2HP:129,fortHP:64,color:PALETTE.frameInner,size:1.35},
  sw_grievous_risen:   {name:'Risen General Grievous',     hp:359,maxHP:359,dmg:32,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:17000,phase2HP:180,fortHP:90,color:'#6d28d9',size:1.55},
  sw_lava_wraith:      {name:'Lava Wraith',                hp:210,maxHP:210,dmg:22,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:8500, phase2HP:105,fortHP:52,color:'#ef4444',size:1.2},
  sw_fire_daemon:      {name:'Mustafar Fire Daemon',       hp:290,maxHP:290,dmg:27,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:12500,phase2HP:145,fortHP:72,color:'#dc2626',size:1.55},
  sw_vader_shadow:     {name:"Vader's Shadow Born",        hp:405,maxHP:405,dmg:34,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:17500,phase2HP:202,fortHP:101,color:'#b91c1c',size:1.7},
  sw_alderaan_ghost:   {name:'Ghost of Alderaan',          hp:210,maxHP:210,dmg:22,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:8500, phase2HP:105,fortHP:52,color:'#7dd3fc',size:1.2},
  sw_senator_shade:    {name:'Fallen Senator Shade',       hp:290,maxHP:290,dmg:27,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:12500,phase2HP:145,fortHP:72,color:'#60a5fa',size:1.35},
  sw_organa_revenant:  {name:"Organa's Revenant",          hp:405,maxHP:405,dmg:34,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:17500,phase2HP:202,fortHP:101,color:'#3b82f6',size:1.55},
  sw_rebel_shade:      {name:'Rebel Pilot Shade',          hp:232,maxHP:232,dmg:23,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:9000, phase2HP:116,fortHP:58,color:'#86efac',size:1.2},
  sw_xwing_wraith:     {name:'X-Wing Wraith',              hp:322,maxHP:322,dmg:29,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:13000,phase2HP:161,fortHP:80,color:'#4ade80',size:1.35},
  sw_gold_leader:      {name:'Gold Leader Risen',          hp:451,maxHP:451,dmg:37,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:18000,phase2HP:226,fortHP:113,color:'#22c55e',size:1.55},
  sw_ice_revenant:     {name:'Hoth Ice Revenant',          hp:232,maxHP:232,dmg:23,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:9000, phase2HP:116,fortHP:58,color:'#e2e8f0',size:1.2},
  sw_wampa_horror:     {name:'Wampa Horror',               hp:322,maxHP:322,dmg:29,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:13000,phase2HP:161,fortHP:80,color:'#cbd5e1',size:1.55},
  sw_atat_specter:     {name:'AT-AT Walker Specter',       hp:451,maxHP:451,dmg:37,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:18000,phase2HP:226,fortHP:113,color:'#94a3b8',size:1.7},
  sw_bog_daemon:       {name:'Bog Daemon of Dagobah',      hp:254,maxHP:254,dmg:24,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:9500, phase2HP:127,fortHP:64,color:'#4ade80',size:1.2},
  sw_darkside_echo:    {name:'Dark Side Echo',             hp:354,maxHP:354,dmg:31,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:13500,phase2HP:177,fortHP:88,color:'#22c55e',size:1.35},
  sw_cave_horror:      {name:'Dark Side Cave Horror',      hp:497,maxHP:497,dmg:40,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:18500,phase2HP:248,fortHP:124,color:'#166534',size:1.55},
  sw_cloud_shade:      {name:'Cloud City Shade',           hp:254,maxHP:254,dmg:24,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:9500, phase2HP:127,fortHP:64,color:'#fcd34d',size:1.2},
  sw_tibanna_wraith:   {name:'Tibanna Gas Wraith',         hp:354,maxHP:354,dmg:31,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:13500,phase2HP:177,fortHP:88,color:'#f59e0b',size:1.35},
  sw_boba_risen:       {name:'Boba Fett Risen',            hp:497,maxHP:497,dmg:40,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:18500,phase2HP:248,fortHP:124,color:'#d97706',size:1.55},
  sw_ewok_shade:       {name:'Ewok Spirit Gone Dark',      hp:276,maxHP:276,dmg:26,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10000,phase2HP:138,fortHP:69,color:'#15803d',size:1.2},
  sw_endor_daemon:     {name:'Endor Forest Daemon',        hp:386,maxHP:386,dmg:33,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14000,phase2HP:193,fortHP:96,color:'#166534',size:1.35},
  sw_endor_titan:      {name:'Endor Tree Titan',           hp:543,maxHP:543,dmg:42,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:19000,phase2HP:272,fortHP:136,color:'#14532d',size:1.7},
  sw_station_horror:   {name:'Station Horror',             hp:276,maxHP:276,dmg:26,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10000,phase2HP:138,fortHP:69,color:'#6b7280',size:1.2},
  sw_superlaser_wraith:{name:'Superlaser Wraith',          hp:386,maxHP:386,dmg:33,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14000,phase2HP:193,fortHP:96,color:'#4b5563',size:1.35},
  sw_tarkin_shade:     {name:"Grand Moff Tarkin's Shade",  hp:543,maxHP:543,dmg:42,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:19000,phase2HP:272,fortHP:136,color:'#374151',size:1.55},
  sw_storm_revenant:   {name:'Stormtrooper Revenant',      hp:298,maxHP:298,dmg:28,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10500,phase2HP:149,fortHP:74,color:'#fbbf24',size:1.2},
  sw_carbon_wraith:    {name:'Carbon Freeze Wraith',       hp:418,maxHP:418,dmg:35,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14500,phase2HP:209,fortHP:104,color:'#f59e0b',size:1.35},
  sw_ugnaught_risen:   {name:'Ugnaught Legion Risen',      hp:589,maxHP:589,dmg:44,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:19500,phase2HP:294,fortHP:147,color:'#d97706',size:1.55},
  sw_hutt_shade:       {name:"Jabba's Shadow Risen",       hp:298,maxHP:298,dmg:28,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10500,phase2HP:149,fortHP:74,color:PALETTE.brownLt,size:1.5},
  sw_rancor_specter:   {name:'Rancor Specter',             hp:418,maxHP:418,dmg:35,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14500,phase2HP:209,fortHP:104,color:PALETTE.brown,size:1.7},
  sw_sarlacc_horror:   {name:'Sarlacc Pit Horror',         hp:589,maxHP:589,dmg:44,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:19500,phase2HP:294,fortHP:147,color:PALETTE.brownDk,size:1.7},
  sw_destroyer_daemon: {name:'Super Destroyer Daemon',     hp:298,maxHP:298,dmg:28,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10500,phase2HP:149,fortHP:74,color:'#4b5563',size:1.2},
  sw_executor_shade:   {name:"Executor's Bridge Shade",    hp:418,maxHP:418,dmg:35,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14500,phase2HP:209,fortHP:104,color:'#374151',size:1.35},
  sw_vader_risen:      {name:'Darth Vader Risen',          hp:589,maxHP:589,dmg:44,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:19500,phase2HP:294,fortHP:147,color:'#dc2626',size:1.7},
  sw_ds2_guardian:     {name:'Death Star II Guardian',     hp:298,maxHP:298,dmg:28,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10500,phase2HP:149,fortHP:74,color:'#374151',size:1.2},
  sw_throne_specter:   {name:"Emperor's Throne Specter",   hp:418,maxHP:418,dmg:35,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14500,phase2HP:209,fortHP:104,color:'#1f2937',size:1.35},
  sw_palpatine_risen:  {name:'Emperor Palpatine Risen',    hp:686,maxHP:686,dmg:50,spd:0.55,rng:160,cd:1.6,bones:60,gp:[40,80],pp:[1,2],xp:28000, phase2HP:343,fortHP:172,color:'#6b21a8',size:1.8},
  sw_bunker_daemon:    {name:'Imperial Bunker Daemon',     hp:298,maxHP:298,dmg:28,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:10500,phase2HP:149,fortHP:74,color:'#166534',size:1.2},
  sw_shield_horror:    {name:'Shield Generator Horror',    hp:418,maxHP:418,dmg:35,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:14500,phase2HP:209,fortHP:104,color:'#15803d',size:1.35},
  sw_palpatine_shade:  {name:"Palpatine's Sith Shade",     hp:589,maxHP:589,dmg:44,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:24000, phase2HP:294,fortHP:147,color:'#4c1d95',size:1.65},
};

// Merge SW bosses into REGION_BOSSES and BOSSES so the raid engine resolves them
(function(){for(const k in SW_BOSSES){REGION_BOSSES[k]=SW_BOSSES[k];if(typeof BOSSES!=='undefined')BOSSES[k]=SW_BOSSES[k];}})();

// ── 60 RAID_CONFIGS entries (sw_ prefix) ──
const _SW_RC={
  sw_tatooine_easy:    {regionId:'sw_tatooine',   name:'Mos Eisley Wretched Hive',         ico:'🏜️',floors:2, minLv:1,bossKey:'sw_sand_daemon',      enemyPool:['cultist','skeleton_e','zombie_e','zombie_e','ghoul_e'],           floorScale:[1.0,1.35],                                   bgDark:'#0d0700',bgMid:'#1a0e00',wallCol:'#8b4000',floorCol:'#120800',accentCol:'#f59e0b',deco:['🏜️','🦴','⚔️','💀']},
  sw_tatooine_medium:  {regionId:'sw_tatooine',   name:'Krayt Dragon Tomb',                ico:'🐉',floors:4, minLv:1,bossKey:'sw_krayt_specter',     enemyPool:['wight_e','skeleton_e','ghoul_e','gravedigger','zombie_e'],         floorScale:[1.0,1.45,1.9,2.35],                          bgDark:'#0d0700',bgMid:'#1a0e00',wallCol:'#8b4000',floorCol:'#120800',accentCol:'#f59e0b',deco:['🏜️','🦴','⚔️','💀']},
  sw_tatooine_hard:    {regionId:'sw_tatooine',   name:"Tusken Warlord's Fortress",        ico:'🏺',floors:6, minLv:1,bossKey:'sw_tusken_warlord',    enemyPool:['wight_e','wraith_e','gravedigger','banshee','death_knight'],       floorScale:[1.0,1.45,2.1,2.65,3.2,3.75],                bgDark:'#0d0700',bgMid:'#1a0e00',wallCol:'#8b4000',floorCol:'#120800',accentCol:'#f59e0b',deco:['🏜️','🦴','⚔️','💀']},
  sw_naboo_easy:       {regionId:'sw_naboo',      name:'Theed Palace Haunted',             ico:'🏛️',floors:2, minLv:1,bossKey:'sw_gungan_shade',      enemyPool:['cultist','cultist','skeleton_e','zombie_e','ghoul_e'],             floorScale:[1.0,1.35],                                   bgDark:'#020a02',bgMid:'#041408',wallCol:'#185818',floorCol:'#030804',accentCol:'#22c55e',deco:['🏛️','🌊','💀','🌿']},
  sw_naboo_medium:     {regionId:'sw_naboo',      name:'Trade Federation Wraiths',         ico:'⚙️',floors:4, minLv:1,bossKey:'sw_viceroy_wraith',    enemyPool:['wight_e','skeleton_e','shadow_demon','cultist','ghoul_e'],         floorScale:[1.0,1.45,1.9,2.35],                          bgDark:'#020a02',bgMid:'#041408',wallCol:'#185818',floorCol:'#030804',accentCol:'#22c55e',deco:['🏛️','🌊','💀','🌿']},
  sw_naboo_hard:       {regionId:'sw_naboo',      name:"Darth Maul's Shadow Returns",      ico:'☯️',floors:6, minLv:1,bossKey:'sw_maul_shade',        enemyPool:['death_knight','wraith_e','shadow_demon','banshee','lich_acolyte'], floorScale:[1.0,1.45,2.1,2.65,3.2,3.75],                bgDark:'#020a02',bgMid:'#041408',wallCol:'#185818',floorCol:'#030804',accentCol:'#22c55e',deco:['🏛️','🌊','💀','🌿']},
  sw_coruscant_easy:   {regionId:'sw_coruscant',  name:'Underworld Crypts',                ico:'🌆',floors:3, minLv:2,bossKey:'sw_senate_ghost',      enemyPool:['cultist','skeleton_e','zombie_e','ghoul_e','shadow_demon'],        floorScale:[1.0,1.35,1.7],                               bgDark:'#020208',bgMid:'#04040f',wallCol:'#1c1c40',floorCol:'#050510',accentCol:'#60a5fa',deco:['🌆','🔷','💀','⚡']},
  sw_coruscant_medium: {regionId:'sw_coruscant',  name:'Senate District Haunting',         ico:'🏛️',floors:5, minLv:2,bossKey:'sw_chancellor_shade',  enemyPool:['lich_acolyte','wight_e','shadow_demon','wraith_e','cultist'],      floorScale:[1.0,1.45,1.9,2.35,2.8],                     bgDark:'#020208',bgMid:'#04040f',wallCol:'#1c1c40',floorCol:'#050510',accentCol:'#60a5fa',deco:['🌆','🔷','💀','⚡']},
  sw_coruscant_hard:   {regionId:'sw_coruscant',  name:'Sith Temple Depths',               ico:'🔴',floors:7, minLv:2,bossKey:'sw_sith_phantom',      enemyPool:['death_knight','lich_acolyte','shadow_demon','wraith_e','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3],          bgDark:'#020208',bgMid:'#04040f',wallCol:'#1c1c40',floorCol:'#050510',accentCol:'#60a5fa',deco:['🌆','🔷','💀','⚡']},
  sw_geonosis_easy:    {regionId:'sw_geonosis',   name:'Droid Factory Revenants',          ico:'🏭',floors:3, minLv:2,bossKey:'sw_geonosis_queen',    enemyPool:['skeleton_e','zombie_e','cultist','ghoul_e','gravedigger'],          floorScale:[1.0,1.35,1.7],                               bgDark:'#0a0500',bgMid:'#140a00',wallCol:'#5a2800',floorCol:'#0c0400',accentCol:'#d97706',deco:['🏭','⚙️','💀','🔥']},
  sw_geonosis_medium:  {regionId:'sw_geonosis',   name:'Arena of the Dead',                ico:'⚔️',floors:5, minLv:2,bossKey:'sw_droid_overlord',    enemyPool:['death_knight','wight_e','skeleton_e','lich_acolyte','shadow_demon'],floorScale:[1.0,1.45,1.9,2.35,2.8],                     bgDark:'#0a0500',bgMid:'#140a00',wallCol:'#5a2800',floorCol:'#0c0400',accentCol:'#d97706',deco:['🏭','⚙️','💀','🔥']},
  sw_geonosis_hard:    {regionId:'sw_geonosis',   name:"Count Dooku's Shade Rises",        ico:'🗡️',floors:7, minLv:2,bossKey:'sw_dooku_shade',       enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','banshee'],  floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3],            bgDark:'#0a0500',bgMid:'#140a00',wallCol:'#5a2800',floorCol:'#0c0400',accentCol:'#d97706',deco:['🏭','⚙️','💀','🔥']},
  sw_kamino_easy:      {regionId:'sw_kamino',     name:'Cloning Vats Gone Wrong',          ico:'🌧️',floors:3, minLv:3,bossKey:'sw_kaminoan_specter',  enemyPool:['zombie_e','cultist','skeleton_e','ghoul_e','wight_e'],             floorScale:[1.0,1.35,1.7],                               bgDark:'#010508',bgMid:'#020a10',wallCol:'#082840',floorCol:'#020608',accentCol:'#93c5fd',deco:['🌧️','🔬','💀','🧬']},
  sw_kamino_medium:    {regionId:'sw_kamino',     name:'The Failed Clone Horde',           ico:'🧬',floors:5, minLv:3,bossKey:'sw_clone_revenant',    enemyPool:['wight_e','lich_acolyte','skeleton_e','shadow_demon','zombie_e'],   floorScale:[1.0,1.45,1.9,2.35,2.8],                     bgDark:'#010508',bgMid:'#020a10',wallCol:'#082840',floorCol:'#020608',accentCol:'#93c5fd',deco:['🌧️','🔬','💀','🧬']},
  sw_kamino_hard:      {regionId:'sw_kamino',     name:"Jango Fett Risen",                 ico:'🎯',floors:7, minLv:3,bossKey:'sw_jango_risen',       enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3],          bgDark:'#010508',bgMid:'#020a10',wallCol:'#082840',floorCol:'#020608',accentCol:'#93c5fd',deco:['🌧️','🔬','💀','🧬']},
  sw_kashyyyk_easy:    {regionId:'sw_kashyyyk',   name:'Wroshyr Tree Haunting',            ico:'🌳',floors:3, minLv:3,bossKey:'sw_wookiee_berserker', enemyPool:['treant','forest_wolf','zombie_e','ghoul_e','cultist'],              floorScale:[1.0,1.35,1.7],                               bgDark:'#020602',bgMid:'#040e04',wallCol:'#0e3c0e',floorCol:'#030804',accentCol:'#16a34a',deco:['🌳','🐾','💀','🌿']},
  sw_kashyyyk_medium:  {regionId:'sw_kashyyyk',   name:'CIS Occupation Horrors',           ico:'⚙️',floors:5, minLv:3,bossKey:'sw_grievous_shade',    enemyPool:['treant','forest_witch','death_knight','banshee','wight_e'],         floorScale:[1.0,1.45,1.9,2.35,2.8],                     bgDark:'#020602',bgMid:'#040e04',wallCol:'#0e3c0e',floorCol:'#030804',accentCol:'#16a34a',deco:['🌳','🐾','💀','🌿']},
  sw_kashyyyk_hard:    {regionId:'sw_kashyyyk',   name:'Forest of Fallen Wookiees',        ico:'🌲',floors:8, minLv:3,bossKey:'sw_kashyyyk_titan',    enemyPool:['treant','treant','death_knight','shadow_demon','forest_witch'],     floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85],       bgDark:'#020602',bgMid:'#040e04',wallCol:'#0e3c0e',floorCol:'#030804',accentCol:'#16a34a',deco:['🌳','🐾','💀','🌿']},
  sw_utapau_easy:      {regionId:'sw_utapau',     name:'Sinkhole Colony Dead',             ico:'🕳️',floors:4, minLv:4,bossKey:'sw_sinkhole_daemon',   enemyPool:['cultist','skeleton_e','zombie_e','ghoul_e','wight_e'],             floorScale:[1.0,1.35,1.7,2.05],                          bgDark:'#060408',bgMid:'#0c0810',wallCol:'#3a2850',floorCol:'#080410',accentCol:'#a78bfa',deco:['🕳️','🌀','💀','⚡']},
  sw_utapau_medium:    {regionId:'sw_utapau',     name:'Pau City Catacombs',               ico:'🏙️',floors:6, minLv:4,bossKey:'sw_pau_city_horror',   enemyPool:['lich_acolyte','shadow_demon','wight_e','wraith_e','ghoul_e'],      floorScale:[1.0,1.45,1.9,2.35,2.8,3.25],                bgDark:'#060408',bgMid:'#0c0810',wallCol:'#3a2850',floorCol:'#080410',accentCol:'#a78bfa',deco:['🕳️','🌀','💀','⚡']},
  sw_utapau_hard:      {regionId:'sw_utapau',     name:"Grievous' Final Stand Risen",      ico:'⚔️',floors:8, minLv:4,bossKey:'sw_grievous_risen',    enemyPool:['death_knight','lich_acolyte','wraith_e','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85],     bgDark:'#060408',bgMid:'#0c0810',wallCol:'#3a2850',floorCol:'#080410',accentCol:'#a78bfa',deco:['🕳️','🌀','💀','⚡']},
  sw_mustafar_easy:    {regionId:'sw_mustafar',   name:'Lava River Wraiths',               ico:'🌋',floors:4, minLv:4,bossKey:'sw_lava_wraith',       enemyPool:['wight_e','skeleton_e','zombie_e','ghoul_e','death_knight'],         floorScale:[1.0,1.35,1.7,2.05],                          bgDark:'#0d0100',bgMid:'#1a0300',wallCol:'#580800',floorCol:'#100200',accentCol:'#ef4444',deco:['🌋','🔥','💀','☠️']},
  sw_mustafar_medium:  {regionId:'sw_mustafar',   name:'Mining Complex Horrors',           ico:'🏭',floors:6, minLv:4,bossKey:'sw_fire_daemon',       enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','wight_e'],  floorScale:[1.0,1.45,1.9,2.35,2.8,3.25],                bgDark:'#0d0100',bgMid:'#1a0300',wallCol:'#580800',floorCol:'#100200',accentCol:'#ef4444',deco:['🌋','🔥','💀','☠️']},
  sw_mustafar_hard:    {regionId:'sw_mustafar',   name:"Vader's Shadow Born",              ico:'😤',floors:8, minLv:4,bossKey:'sw_vader_shadow',      enemyPool:['death_knight','wraith_e','shadow_demon','lich_acolyte','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85],     bgDark:'#0d0100',bgMid:'#1a0300',wallCol:'#580800',floorCol:'#100200',accentCol:'#ef4444',deco:['🌋','🔥','💀','☠️']},
  sw_alderaan_easy:    {regionId:'sw_alderaan',   name:'Ghost Planet Haunting',            ico:'🌍',floors:4, minLv:5,bossKey:'sw_alderaan_ghost',    enemyPool:['banshee','wraith_e','cultist','skeleton_e','zombie_e'],             floorScale:[1.0,1.35,1.7,2.05],                          bgDark:'#020508',bgMid:'#040a10',wallCol:'#1a3050',floorCol:'#030610',accentCol:'#7dd3fc',deco:['🌍','👻','💀','💙']},
  sw_alderaan_medium:  {regionId:'sw_alderaan',   name:'Fallen Senate Shades',             ico:'🏛️',floors:6, minLv:5,bossKey:'sw_senator_shade',    enemyPool:['wraith_e','lich_acolyte','shadow_demon','banshee','wight_e'],       floorScale:[1.0,1.45,1.9,2.35,2.8,3.25],                bgDark:'#020508',bgMid:'#040a10',wallCol:'#1a3050',floorCol:'#030610',accentCol:'#7dd3fc',deco:['🌍','👻','💀','💙']},
  sw_alderaan_hard:    {regionId:'sw_alderaan',   name:"Organa's Revenant Court",          ico:'👑',floors:8, minLv:5,bossKey:'sw_organa_revenant',   enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','banshee'],  floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85],       bgDark:'#020508',bgMid:'#040a10',wallCol:'#1a3050',floorCol:'#030610',accentCol:'#7dd3fc',deco:['🌍','👻','💀','💙']},
  sw_yavin_iv_easy:    {regionId:'sw_yavin_iv',   name:'Rebel Base Overrun',               ico:'🌿',floors:4, minLv:5,bossKey:'sw_rebel_shade',       enemyPool:['cultist','skeleton_e','zombie_e','treant','forest_wolf'],           floorScale:[1.0,1.35,1.7,2.05],                          bgDark:'#020602',bgMid:'#041004',wallCol:'#0e3a0e',floorCol:'#030604',accentCol:'#86efac',deco:['🌿','🌳','💀','⭐']},
  sw_yavin_iv_medium:  {regionId:'sw_yavin_iv',   name:'Temple of the Fallen',             ico:'🏛️',floors:6, minLv:5,bossKey:'sw_xwing_wraith',     enemyPool:['forest_witch','banshee','wight_e','treant','shadow_demon'],          floorScale:[1.0,1.45,1.9,2.35,2.8,3.25],                bgDark:'#020602',bgMid:'#041004',wallCol:'#0e3a0e',floorCol:'#030604',accentCol:'#86efac',deco:['🌿','🌳','💀','⭐']},
  sw_yavin_iv_hard:    {regionId:'sw_yavin_iv',   name:"Gold Leader's Last Flight",        ico:'✈️',floors:9, minLv:5,bossKey:'sw_gold_leader',       enemyPool:['death_knight','wraith_e','lich_acolyte','forest_witch','shadow_demon'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4], bgDark:'#020602',bgMid:'#041004',wallCol:'#0e3a0e',floorCol:'#030604',accentCol:'#86efac',deco:['🌿','🌳','💀','⭐']},
  sw_hoth_easy:        {regionId:'sw_hoth',       name:'Echo Base Horrors',                ico:'❄️',floors:5, minLv:6,bossKey:'sw_ice_revenant',      enemyPool:['zombie_e','skeleton_e','wight_e','cultist','ghoul_e'],              floorScale:[1.0,1.35,1.7,2.05,2.4],                     bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#303048',floorCol:'#060608',accentCol:'#e2e8f0',deco:['❄️','🌨️','💀','🏔️']},
  sw_hoth_medium:      {regionId:'sw_hoth',       name:'Wampa Pack Uprising',              ico:'🐻',floors:7, minLv:6,bossKey:'sw_wampa_horror',      enemyPool:['wight_e','skeleton_e','gravedigger','death_knight','banshee'],      floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7],            bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#303048',floorCol:'#060608',accentCol:'#e2e8f0',deco:['❄️','🌨️','💀','🏔️']},
  sw_hoth_hard:        {regionId:'sw_hoth',       name:'AT-AT Walker Specter March',       ico:'🤖',floors:9, minLv:6,bossKey:'sw_atat_specter',      enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','wight_e'],  floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4],   bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#303048',floorCol:'#060608',accentCol:'#e2e8f0',deco:['❄️','🌨️','💀','🏔️']},
  sw_dagobah_easy:     {regionId:'sw_dagobah',    name:'Bog Creatures Awakened',           ico:'🌿',floors:5, minLv:6,bossKey:'sw_bog_daemon',        enemyPool:['treant','forest_wolf','zombie_e','ghoul_e','banshee'],              floorScale:[1.0,1.35,1.7,2.05,2.4],                     bgDark:'#020602',bgMid:'#030a04',wallCol:'#0c3010',floorCol:'#030604',accentCol:'#4ade80',deco:['🌿','🐸','💀','☠️']},
  sw_dagobah_medium:   {regionId:'sw_dagobah',    name:'Dark Side Vision Horrors',         ico:'😨',floors:7, minLv:6,bossKey:'sw_darkside_echo',     enemyPool:['shadow_demon','wraith_e','banshee','lich_acolyte','forest_witch'],  floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7],            bgDark:'#020602',bgMid:'#030a04',wallCol:'#0c3010',floorCol:'#030604',accentCol:'#4ade80',deco:['🌿','🐸','💀','☠️']},
  sw_dagobah_hard:     {regionId:'sw_dagobah',    name:'The Dark Side Cave',               ico:'🕳️',floors:9, minLv:6,bossKey:'sw_cave_horror',       enemyPool:['death_knight','shadow_demon','wraith_e','lich_acolyte','banshee'],  floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4],   bgDark:'#020602',bgMid:'#030a04',wallCol:'#0c3010',floorCol:'#030604',accentCol:'#4ade80',deco:['🌿','🐸','💀','☠️']},
  sw_bespin_easy:      {regionId:'sw_bespin',     name:'Carbon Freeze Chamber Wraiths',    ico:'🏙️',floors:5, minLv:7,bossKey:'sw_cloud_shade',       enemyPool:['wight_e','cultist','skeleton_e','shadow_demon','ghoul_e'],          floorScale:[1.0,1.35,1.7,2.05,2.4],                     bgDark:'#080600',bgMid:'#100c00',wallCol:'#483800',floorCol:'#0a0800',accentCol:'#fcd34d',deco:['🏙️','☁️','💀','⚡']},
  sw_bespin_medium:    {regionId:'sw_bespin',     name:'Tibanna Gas Horrors',              ico:'⛅',floors:7, minLv:7,bossKey:'sw_tibanna_wraith',    enemyPool:['death_knight','lich_acolyte','wight_e','wraith_e','shadow_demon'],  floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7],            bgDark:'#080600',bgMid:'#100c00',wallCol:'#483800',floorCol:'#0a0800',accentCol:'#fcd34d',deco:['🏙️','☁️','💀','⚡']},
  sw_bespin_hard:      {regionId:'sw_bespin',     name:'Boba Fett Risen',                  ico:'🎯',floors:9, minLv:7,bossKey:'sw_boba_risen',        enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4], bgDark:'#080600',bgMid:'#100c00',wallCol:'#483800',floorCol:'#0a0800',accentCol:'#fcd34d',deco:['🏙️','☁️','💀','⚡']},
  sw_endor_easy:       {regionId:'sw_endor',      name:'Ewok Village Cursed',              ico:'🌲',floors:6, minLv:7,bossKey:'sw_ewok_shade',        enemyPool:['treant','forest_wolf','zombie_e','ghoul_e','cultist'],              floorScale:[1.0,1.35,1.7,2.05,2.4,2.75],                bgDark:'#020602',bgMid:'#040e04',wallCol:'#144010',floorCol:'#040604',accentCol:'#15803d',deco:['🌲','🐻','💀','🌿']},
  sw_endor_medium:     {regionId:'sw_endor',      name:'Imperial Patrol Dead',             ico:'🌲',floors:8, minLv:7,bossKey:'sw_endor_daemon',      enemyPool:['forest_witch','banshee','death_knight','treant','wraith_e'],         floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15],       bgDark:'#020602',bgMid:'#040e04',wallCol:'#144010',floorCol:'#040604',accentCol:'#15803d',deco:['🌲','🐻','💀','🌿']},
  sw_endor_hard:       {regionId:'sw_endor',      name:'Endor Tree Titan Awakens',         ico:'🌳',floors:10,minLv:7,bossKey:'sw_endor_titan',       enemyPool:['treant','treant','death_knight','shadow_demon','forest_witch'],      floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95],bgDark:'#020602',bgMid:'#040e04',wallCol:'#144010',floorCol:'#040604',accentCol:'#15803d',deco:['🌲','🐻','💀','🌿']},
  sw_death_star_i_easy:{regionId:'sw_death_star_i',name:'Trench Run of the Dead',         ico:'💫',floors:6, minLv:7,bossKey:'sw_station_horror',    enemyPool:['skeleton_e','wight_e','shadow_demon','lich_acolyte','cultist'],     floorScale:[1.0,1.35,1.7,2.05,2.4,2.75],                bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#252535',floorCol:'#060608',accentCol:'#6b7280',deco:['💫','⭕','💀','🔩']},
  sw_death_star_i_medium:{regionId:'sw_death_star_i',name:'Imperial Station Horrors',     ico:'⭕',floors:8, minLv:7,bossKey:'sw_superlaser_wraith',enemyPool:['death_knight','lich_acolyte','wight_e','shadow_demon','wraith_e'],   floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15],       bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#252535',floorCol:'#060608',accentCol:'#6b7280',deco:['💫','⭕','💀','🔩']},
  sw_death_star_i_hard:{regionId:'sw_death_star_i',name:"Grand Moff Tarkin's Shade",      ico:'👨‍✈️',floors:10,minLv:7,bossKey:'sw_tarkin_shade',     enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95],bgDark:'#050508',bgMid:'#0a0a10',wallCol:'#252535',floorCol:'#060608',accentCol:'#6b7280',deco:['💫','⭕','💀','🔩']},
  sw_cloud_city_easy:  {regionId:'sw_cloud_city',  name:'Betrayed in the Clouds',          ico:'☁️',floors:7, minLv:8,bossKey:'sw_storm_revenant',   enemyPool:['wight_e','skeleton_e','cultist','shadow_demon','ghoul_e'],          floorScale:[1.0,1.35,1.7,2.05,2.4,2.75,3.1],            bgDark:'#070600',bgMid:'#0e0c00',wallCol:'#403600',floorCol:'#0a0800',accentCol:'#fbbf24',deco:['☁️','🌆','💀','⚡']},
  sw_cloud_city_medium:{regionId:'sw_cloud_city',  name:'Carbon Freeze Curse',             ico:'🥶',floors:9, minLv:8,bossKey:'sw_carbon_wraith',    enemyPool:['death_knight','lich_acolyte','shadow_demon','wraith_e','wight_e'],  floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15,4.6],   bgDark:'#070600',bgMid:'#0e0c00',wallCol:'#403600',floorCol:'#0a0800',accentCol:'#fbbf24',deco:['☁️','🌆','💀','⚡']},
  sw_cloud_city_hard:  {regionId:'sw_cloud_city',  name:'Ugnaught Legion Risen',           ico:'👷',floors:11,minLv:8,bossKey:'sw_ugnaught_risen',   enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95,6.5],bgDark:'#070600',bgMid:'#0e0c00',wallCol:'#403600',floorCol:'#0a0800',accentCol:'#fbbf24',deco:['☁️','🌆','💀','⚡']},
  sw_jabba_palace_easy:{regionId:'sw_jabba_palace',name:"Dungeon of the Hutt",            ico:'🏰',floors:7, minLv:8,bossKey:'sw_hutt_shade',        enemyPool:['cultist','wight_e','skeleton_e','ghoul_e','gravedigger'],           floorScale:[1.0,1.35,1.7,2.05,2.4,2.75,3.1],            bgDark:'#0a0500',bgMid:'#150a00',wallCol:'#5a2a00',floorCol:'#0c0600',accentCol:PALETTE.brownLt,deco:['🏰','🐍','💀','🦴']},
  sw_jabba_palace_medium:{regionId:'sw_jabba_palace',name:'Rancor Pit Unleashed',         ico:'🦎',floors:9, minLv:8,bossKey:'sw_rancor_specter',    enemyPool:['treant','death_knight','forest_wolf','wight_e','shadow_demon'],     floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15,4.6],   bgDark:'#0a0500',bgMid:'#150a00',wallCol:'#5a2a00',floorCol:'#0c0600',accentCol:PALETTE.brownLt,deco:['🏰','🐍','💀','🦴']},
  sw_jabba_palace_hard:{regionId:'sw_jabba_palace',name:'Sarlacc Pit Horror',             ico:'😱',floors:11,minLv:8,bossKey:'sw_sarlacc_horror',    enemyPool:['forest_witch','treant','death_knight','wraith_e','shadow_demon'],   floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95,6.5],bgDark:'#0a0500',bgMid:'#150a00',wallCol:'#5a2a00',floorCol:'#0c0600',accentCol:PALETTE.brownLt,deco:['🏰','🐍','💀','🦴']},
  sw_executor_easy:    {regionId:'sw_executor',    name:'Super Destroyer Haunted',         ico:'🛸',floors:8, minLv:9,bossKey:'sw_destroyer_daemon', enemyPool:['death_knight','lich_acolyte','wight_e','shadow_demon','cultist'],    floorScale:[1.0,1.35,1.7,2.05,2.4,2.75,3.1,3.45],       bgDark:'#040408',bgMid:'#080810',wallCol:'#1c1c30',floorCol:'#060608',accentCol:'#4b5563',deco:['🛸','🌌','💀','⭐']},
  sw_executor_medium:  {regionId:'sw_executor',    name:'Bridge Crew Revenant March',      ico:'🌌',floors:10,minLv:9,bossKey:'sw_executor_shade',   enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15,4.6,5.05],bgDark:'#040408',bgMid:'#080810',wallCol:'#1c1c30',floorCol:'#060608',accentCol:'#4b5563',deco:['🛸','🌌','💀','⭐']},
  sw_executor_hard:    {regionId:'sw_executor',    name:'Darth Vader Risen',               ico:'😤',floors:12,minLv:9,bossKey:'sw_vader_risen',      enemyPool:['death_knight','wraith_e','shadow_demon','lich_acolyte','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95,6.5,7.05],bgDark:'#040408',bgMid:'#080810',wallCol:'#1c1c30',floorCol:'#060608',accentCol:'#4b5563',deco:['🛸','🌌','💀','⭐']},
  sw_death_star_ii_easy:{regionId:'sw_death_star_ii',name:'Throne Room Approach',         ico:'💫',floors:8, minLv:9,bossKey:'sw_ds2_guardian',      enemyPool:['death_knight','lich_acolyte','wight_e','shadow_demon','wraith_e'],  floorScale:[1.0,1.35,1.7,2.05,2.4,2.75,3.1,3.45],       bgDark:'#050408',bgMid:'#0a0810',wallCol:'#20182a',floorCol:'#060408',accentCol:'#374151',deco:['💫','⭕','💀','🔮']},
  sw_death_star_ii_medium:{regionId:'sw_death_star_ii',name:"Emperor's Throne Room Horrors",ico:'👹',floors:10,minLv:9,bossKey:'sw_throne_specter', enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','banshee'],   floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15,4.6,5.05],bgDark:'#050408',bgMid:'#0a0810',wallCol:'#20182a',floorCol:'#060408',accentCol:'#374151',deco:['💫','⭕','💀','🔮']},
  sw_death_star_ii_hard:{regionId:'sw_death_star_ii',name:'Emperor Palpatine Risen',      ico:'⚡',floors:14,minLv:9,bossKey:'sw_palpatine_risen',   enemyPool:['death_knight','wraith_e','shadow_demon','lich_acolyte','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95,6.5,7.05,7.6,8.15],bgDark:'#050408',bgMid:'#0a0810',wallCol:'#20182a',floorCol:'#060408',accentCol:'#374151',deco:['💫','⭕','💀','🔮']},
  sw_endor_bunker_easy:{regionId:'sw_endor_bunker',name:'Bunker Patrol Revenants',        ico:'🌲',floors:8, minLv:9,bossKey:'sw_bunker_daemon',     enemyPool:['treant','death_knight','forest_wolf','wight_e','skeleton_e'],       floorScale:[1.0,1.35,1.7,2.05,2.4,2.75,3.1,3.45],       bgDark:'#020602',bgMid:'#040e04',wallCol:'#124010',floorCol:'#030604',accentCol:'#166534',deco:['🌲','🏚️','💀','🌿']},
  sw_endor_bunker_medium:{regionId:'sw_endor_bunker',name:'Shield Generator Horrors',     ico:'🛡️',floors:10,minLv:9,bossKey:'sw_shield_horror',    enemyPool:['treant','forest_witch','death_knight','shadow_demon','wraith_e'],   floorScale:[1.0,1.45,1.9,2.35,2.8,3.25,3.7,4.15,4.6,5.05],bgDark:'#020602',bgMid:'#040e04',wallCol:'#124010',floorCol:'#030604',accentCol:'#166534',deco:['🌲','🏚️','💀','🌿']},
  sw_endor_bunker_hard:{regionId:'sw_endor_bunker',name:"Palpatine's Sith Shade",         ico:'⚡',floors:12,minLv:9,bossKey:'sw_palpatine_shade',   enemyPool:['death_knight','wraith_e','lich_acolyte','shadow_demon','death_knight'],floorScale:[1.0,1.45,2.1,2.65,3.2,3.75,4.3,4.85,5.4,5.95,6.5,7.05],bgDark:'#020602',bgMid:'#040e04',wallCol:'#124010',floorCol:'#030604',accentCol:'#166534',deco:['🌲','🏚️','💀','🌿']},
};
Object.assign(RAID_CONFIGS,_SW_RC);

// Region → [easy, medium, hard] raid keys
var SW_REGION_RAID_MAP={
  tatooine:      ['sw_tatooine_easy','sw_tatooine_medium','sw_tatooine_hard'],
  naboo:         ['sw_naboo_easy','sw_naboo_medium','sw_naboo_hard'],
  coruscant:     ['sw_coruscant_easy','sw_coruscant_medium','sw_coruscant_hard'],
  geonosis:      ['sw_geonosis_easy','sw_geonosis_medium','sw_geonosis_hard'],
  kamino:        ['sw_kamino_easy','sw_kamino_medium','sw_kamino_hard'],
  kashyyyk:      ['sw_kashyyyk_easy','sw_kashyyyk_medium','sw_kashyyyk_hard'],
  utapau:        ['sw_utapau_easy','sw_utapau_medium','sw_utapau_hard'],
  mustafar:      ['sw_mustafar_easy','sw_mustafar_medium','sw_mustafar_hard'],
  alderaan:      ['sw_alderaan_easy','sw_alderaan_medium','sw_alderaan_hard'],
  yavin_iv:      ['sw_yavin_iv_easy','sw_yavin_iv_medium','sw_yavin_iv_hard'],
  hoth:          ['sw_hoth_easy','sw_hoth_medium','sw_hoth_hard'],
  dagobah:       ['sw_dagobah_easy','sw_dagobah_medium','sw_dagobah_hard'],
  bespin:        ['sw_bespin_easy','sw_bespin_medium','sw_bespin_hard'],
  endor:         ['sw_endor_easy','sw_endor_medium','sw_endor_hard'],
  death_star_i:  ['sw_death_star_i_easy','sw_death_star_i_medium','sw_death_star_i_hard'],
  cloud_city:    ['sw_cloud_city_easy','sw_cloud_city_medium','sw_cloud_city_hard'],
  jabba_palace:  ['sw_jabba_palace_easy','sw_jabba_palace_medium','sw_jabba_palace_hard'],
  executor:      ['sw_executor_easy','sw_executor_medium','sw_executor_hard'],
  death_star_ii: ['sw_death_star_ii_easy','sw_death_star_ii_medium','sw_death_star_ii_hard'],
  endor_bunker:  ['sw_endor_bunker_easy','sw_endor_bunker_medium','sw_endor_bunker_hard'],
};

// Country lore descriptions
const SW_COUNTRY_DESCS={
  tatooine:`A twin-sunned desert world at the galaxy's edge, scoured by sandstorms and Tusken Raiders. Beneath Mos Eisley's cantinas, the dead stir in ancient Krayt Dragon tombs — and the Force-soaked sands carry echoes of a dark destiny yet to be fulfilled.`,
  naboo:`A lush world of rolling meadows and vast underwater cities. Beneath its idyllic surface, the Trade Federation's brutal occupation left scars that fester in the Force — and Darth Maul's shadow lingers still in the palace corridors like a cold blade.`,
  coruscant:`An entire planet consumed by city — a trillion souls stacked a kilometre deep. In the underworld far below the Senate district, ancient Sith ruins pulse with malevolent energy the Republic refuses to acknowledge. The dead have no shortage of company here.`,
  geonosis:`A rocky desert world of vast arena floors and subterranean hive tunnels. The Geonosian Queen's brood never truly died when the clone armies swept through — they merely changed, rising as something older and far more hungry than before.`,
  kamino:`A storm-lashed water-world of sterile cloning facilities perched above the endless ocean. The failed experiments — thousands of rejected clones dumped into the depths — do not stay there. They drift upward at night, changed by the cold dark below.`,
  kashyyyk:`The Wookiee home world — colossal wroshyr trees whose roots plunge into darkness where nothing civilised survives. The CIS occupation left behind broken droids and broken warriors whose spirits rage through the deep canopy without rest.`,
  utapau:`A world pockmarked with enormous sinkholes, each one a city descending further into darkness. Grievous fell here — and in the pit below Pau City, something wearing his memory has risen to guard the abyss, drawing the dead into its orbit.`,
  mustafar:`A volcanic hellworld of lava rivers and mining platforms over ruin. This is where Anakin Skywalker died and Darth Vader was born. The dark side nexus scorched into its crust draws the restless dead like moths to a forge that never cools.`,
  alderaan:`A world of culture and grace, beloved across the galaxy — and utterly destroyed. Where a planet once orbited, only the Force-echo of two billion souls remains. Grief given form has become something monstrous, drawn to all who approach the debris field.`,
  yavin_iv:`A jungle moon where the Rebellion made its greatest gamble. The ancient Massassi temples the Rebels repurposed hold Sith rituals older than the Empire — and the fallen pilots of the trench run circle the moon in restless X-Wing Wraiths.`,
  hoth:`A frozen wasteland where the Rebellion made its last open stand. Echo Base is now a labyrinth of ice tunnels haunted by the fallen — and the wampas, maddened by something in the Force, have become far worse than mere predators.`,
  dagobah:`A swamp world chosen by Master Yoda because its dark side presence masks it from Sith senses. But that same darkness has taken root in a cave that shows only what you bring to it — and the dead drawn to that cave never leave the same.`,
  bespin:`The elegant Cloud City is built on betrayal, and every corridor holds residue of that sin. The Ugnaught workers who died maintaining the carbon freeze chambers rise nightly, and something darker lurks in the Tibanna gas vents far below the city.`,
  endor:`The forest moon that witnessed the Empire's defeat — but not without cost. The fallen Imperials, the crushed AT-ATs, the stormtroopers lost in the trees: they remain, and something ancient in the Ewok forest spirits has turned them to shadow.`,
  death_star_i:`A moon-sized battle station and graveyard drifting in the void. The millions killed in its explosion left a Force-echo that coalesces into nightmarish forms within its re-manifested wreckage. The station screams with what it remembers.`,
  cloud_city:`Cloud City was built on betrayal and it shows — every corridor remembers its sin. Ugnaught dead rise in the carbon freeze chambers nightly, and something wearing Lando's guilt prowls the gas vents, drawn upward toward the innocent.`,
  jabba_palace:`The palace of the galaxy's most notorious crime lord is a warren of dungeons, secret passages, and ancient Hutt sorcery. The rancor pit was never properly cleaned. The Sarlacc beneath the Dune Sea still digests what it consumed — for a thousand years.`,
  executor:`The Super Star Destroyer flagship of Darth Vader — and the grave of its entire crew. The Emperor's obsession soaked its hull with the dark side, and the bridge officers who fell with it are eternally re-fighting their final losing battle overhead.`,
  death_star_ii:`The Emperor waited here, and his patience warped the Force around his throne room into something that does not decay. The Sith lightning he unleashed in his final moments left scorch marks in reality itself — and he has not truly gone.`,
  endor_bunker:`The Imperial bunker housing the Death Star's shield generator became a tomb when the Rebellion stormed it. Deep inside, something wearing the Emperor's will still commands the dead soldiers to hold the line — and they obey without question.`,
};

// ── Map state ──
let SW={panX:500,panY:500,zoom:1,dragging:false,dragStart:{x:0,y:0},panStart:{x:0,y:0},pinchDist:0,_raidBtns:[],_nameBtns:[],_planetBtns:[],_t0:Date.now()};
let _swRaf=null;

function swToScreen(rx,ry,W,H){return{x:(rx*1000-SW.panX)*SW.zoom+W/2,y:(ry*1000-SW.panY)*SW.zoom+H/2};}
function swZoom(d){SW.zoom=Math.max(0.4,Math.min(4,SW.zoom+d));drawSwMap();}
function swCloseAllPanels(){
  ['swRaidPanel','swCountryPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  if(window._swPanelRaf){cancelAnimationFrame(window._swPanelRaf);window._swPanelRaf=null;}
}

function openStarWarsMap(){
  swRenderHeader();
  SW._raidBtns=[];SW._nameBtns=[];SW._planetBtns=[];SW._t0=Date.now();
  showScreen('swMapScreen');
  setTimeout(()=>{
    const cv=document.getElementById('swMapCanvas');
    if(cv)cv._swInit=false;
    const W=gameW(),H=gameH()-42;
    SW.zoom=Math.min((W-32)/820,(H-32)/820);
    SW.panX=500;SW.panY=500;
    swInitInput();
    if(_swRaf)cancelAnimationFrame(_swRaf);
    const _loop=()=>{
      if(document.getElementById('swMapScreen')?.classList.contains('active')){drawSwMap();_swRaf=requestAnimationFrame(_loop);}
      else{_swRaf=null;}
    };
    _loop();
  },50);
}

function closeStarWarsMap(){
  if(_swRaf){cancelAnimationFrame(_swRaf);_swRaf=null;}
  swCloseAllPanels();
  showScreen('castle');
  CR=null;_castleSpawnAtExit=true;
  startCastleRoom();
}

function swRenderHeader(){
  const cnt=SW_REGIONS.filter(r=>{const c=GS.conquered['sw_'+r.id]||{};return c.easy&&c.medium&&c.hard;}).length;
  const el=document.getElementById('swConqCount');
  if(el)el.textContent=cnt+'/'+SW_REGIONS.length+' Conquered';
}

function drawSwMap(){
  const cv=document.getElementById('swMapCanvas');if(!cv)return;
  const DPR=window.devicePixelRatio||1;
  const W=gameW(),H=gameH()-42;
  if(cv.width!==Math.floor(W*DPR)){cv.width=Math.floor(W*DPR);cv.height=Math.floor(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';}
  const c=cv.getContext('2d');
  c.save();c.setTransform(DPR,0,0,DPR,0,0);
  c.clearRect(0,0,W,H);
  const t=(Date.now()-SW._t0)/1000;

  // ── Deep space background ──
  c.fillStyle='#010008';c.fillRect(0,0,W,H);

  // ── Spiral galaxy (Skyriver) ──
  {
    const gcx=W*.5+SW.panX,gcy=H*.5+SW.panY;
    const gR=Math.max(W,H)*.42*SW.zoom;

    // Core glow — bright center
    const core=c.createRadialGradient(gcx,gcy,0,gcx,gcy,gR*.22);
    core.addColorStop(0,'rgba(255,240,200,.18)');core.addColorStop(.3,'rgba(200,180,140,.1)');
    core.addColorStop(.6,'rgba(120,100,180,.05)');core.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=core;c.beginPath();c.arc(gcx,gcy,gR*.22,0,Math.PI*2);c.fill();

    // Central bar
    c.save();c.translate(gcx,gcy);c.rotate(.35);
    const barG=c.createLinearGradient(-gR*.18,0,gR*.18,0);
    barG.addColorStop(0,'rgba(180,150,80,0)');barG.addColorStop(.3,'rgba(200,170,100,.06)');
    barG.addColorStop(.5,'rgba(220,190,120,.08)');barG.addColorStop(.7,'rgba(200,170,100,.06)');
    barG.addColorStop(1,'rgba(180,150,80,0)');
    c.fillStyle=barG;c.fillRect(-gR*.2,-gR*.04,gR*.4,gR*.08);
    c.restore();

    // Spiral arms — draw as series of fading dots along logarithmic spirals
    c.save();c.globalCompositeOperation='screen';
    const armColors=['rgba(100,140,255,','rgba(140,120,240,','rgba(80,160,220,','rgba(160,100,200,'];
    for(let arm=0;arm<4;arm++){
      const baseAngle=arm*Math.PI/2+.35;
      const col=armColors[arm%4];
      for(let si=0;si<120;si++){
        const frac=si/120;
        const theta=baseAngle+frac*Math.PI*2.8;
        const r=gR*(.08+frac*.85);
        const spread=gR*(.01+frac*.06);
        const jx=(Math.sin(si*7.3+arm*99)*.5)*spread;
        const jy=(Math.cos(si*5.1+arm*77)*.5)*spread;
        const ax=gcx+Math.cos(theta)*r+jx;
        const ay=gcy+Math.sin(theta)*r*.55+jy;
        const alpha=(.04+Math.sin(t*.3+si*.1+arm)*.015)*(1-frac*.5);
        const sz=Math.max(1.5,(3+frac*4)*SW.zoom);
        const sg=c.createRadialGradient(ax,ay,0,ax,ay,sz*2.5);
        sg.addColorStop(0,col+alpha+')');sg.addColorStop(1,col+'0)');
        c.fillStyle=sg;c.beginPath();c.arc(ax,ay,sz*2.5,0,Math.PI*2);c.fill();
      }
    }
    c.restore();

    // Diffuse galactic haze
    const haze=c.createRadialGradient(gcx,gcy,0,gcx,gcy,gR);
    haze.addColorStop(0,'rgba(80,60,140,.06)');haze.addColorStop(.4,'rgba(50,70,160,.03)');
    haze.addColorStop(.7,'rgba(30,40,120,.015)');haze.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=haze;c.beginPath();c.arc(gcx,gcy,gR,0,Math.PI*2);c.fill();
  }

  // Animated starfield
  for(let i=0;i<280;i++){
    const sx=((i*137.508+i*i*.003)%1)*W;
    const sy=((i*79.221+i*i*.005)%1)*H;
    const sz=i%7===0?1.4:i%3===0?0.9:0.5;
    const twk=0.45+Math.sin(t*0.6+i*1.9)*0.3;
    c.fillStyle=`rgba(255,255,255,${twk*(0.3+sz*0.4)})`;
    c.beginPath();c.arc(sx,sy,sz,0,Math.PI*2);c.fill();
  }

  // (faction connection lanes removed)

  SW._raidBtns=[];SW._nameBtns=[];SW._planetBtns=[];

  // ── Draw each planet (hidden when locked) ──
  SW_REGIONS.forEach(region=>{
    if(!swRegionAccessible(region))return; // hide locked planets entirely
    const sp=swToScreen(region.x,region.y,W,H);
    const conq=GS.conquered['sw_'+region.id]||{};
    const isFullCleared=conq.easy&&conq.medium&&conq.hard;
    const s=Math.max(10,16*SW.zoom);
    const col=region.color;

    // Outer glow
    const glow=c.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,s*2.4);
    glow.addColorStop(0,col+'22');glow.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=glow;c.beginPath();c.arc(sp.x,sp.y,s*2.4,0,Math.PI*2);c.fill();

    // Planet sphere
    const pg=c.createRadialGradient(sp.x-s*.28,sp.y-s*.28,s*.08,sp.x,sp.y,s);
    pg.addColorStop(0,col+'ee');pg.addColorStop(.65,col+'aa');pg.addColorStop(1,col+'33');
    c.fillStyle=pg;c.beginPath();c.arc(sp.x,sp.y,s,0,Math.PI*2);c.fill();

    // Ring for Death Stars / Executor
    if(region.id.includes('death_star')||region.id==='executor'){
      c.strokeStyle=isFullCleared?'rgba(168,85,247,.6)':col+'66';
      c.lineWidth=Math.max(1,2*SW.zoom);
      c.beginPath();c.ellipse(sp.x,sp.y,s*1.5,s*.38,-.28,0,Math.PI*2);c.stroke();
    }

    // Conquest star above planet
    if(isFullCleared){
      c.fillStyle='#fcd34d';c.font=`${Math.max(8,11*SW.zoom)}px sans-serif`;
      c.textAlign='center';icoD(c,'★',sp.x,sp.y-s-3*SW.zoom,12);
    }

    // E/M/H dots — only show unlocked difficulties
    if(SW.zoom>0.5){
      ['easy','medium','hard'].forEach((diff,di)=>{
        const ox=(di-1)*s*.75,bx=sp.x+ox,by=sp.y+s*1.65;
        const br=Math.max(3.5,5.5*SW.zoom);
        const isClr=conq[diff];
        const locked=(diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium));
        if(locked)return; // hide locked difficulty dots
        const dcol=['#22c55e',PALETTE.holyDk,'#ef4444'][di];
        c.fillStyle=isClr?dcol:dcol+'77';
        c.beginPath();c.arc(bx,by,br,0,Math.PI*2);c.fill();
        if(isClr){c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1;c.stroke();}
        SW._raidBtns.push({x:bx,y:by,r:br+9,region,diff});
      });
    }

    // Register planet body as tappable
    SW._planetBtns.push({x:sp.x,y:sp.y,r:s+6,region});

    // Name label
    if(SW.zoom>0.48){
      const fs=Math.max(8,10*SW.zoom);
      c.font=`${fs}px "Almendra","Cinzel",monospace`;
      const tw=c.measureText(region.name).width;
      const lx=sp.x-tw/2,ly=sp.y-s-14*SW.zoom;
      c.fillStyle='rgba(0,0,0,.6)';c.fillRect(lx-3,ly-fs,tw+6,fs+5);
      c.fillStyle=col;c.textAlign='left';c.fillText(region.name,lx,ly);
      SW._nameBtns.push({x:lx-4,y:ly-fs-2,w:tw+8,h:fs+8,region});
    }
  });

  // Subtle hyperspace scroll lines
  if(SW.zoom>0.65){
    const la=0.04+Math.sin(t*.3)*.015;
    c.strokeStyle=`rgba(140,160,255,${la})`;c.lineWidth=1;
    for(let i=0;i<5;i++){
      const y=((t*6+i*60)%H)-20;
      c.beginPath();c.moveTo(0,y);c.lineTo(W,y+25);c.stroke();
    }
  }
  c.restore();
}

function swInitInput(){
  const cv=document.getElementById('swMapCanvas');if(!cv||cv._swInit)return;
  cv._swInit=true;
  let _lp=0;
  cv.addEventListener('pointerdown',e=>{e.preventDefault();SW.dragging=true;SW.dragStart={x:e.clientX,y:e.clientY};SW.panStart={x:SW.panX,y:SW.panY};cv.setPointerCapture(e.pointerId);},{passive:false});
  cv.addEventListener('pointermove',e=>{if(!SW.dragging)return;SW.panX=SW.panStart.x-(e.clientX-SW.dragStart.x)/SW.zoom;SW.panY=SW.panStart.y-(e.clientY-SW.dragStart.y)/SW.zoom;},{passive:false});
  cv.addEventListener('pointerup',e=>{const mv=Math.hypot(e.clientX-SW.dragStart.x,e.clientY-SW.dragStart.y);SW.dragging=false;if(mv<8)swTap(e);},{passive:false});
  cv.addEventListener('wheel',e=>{e.preventDefault();swZoom(e.deltaY<0?.15:-.15);},{passive:false});
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(_lp)SW.zoom=Math.max(0.4,Math.min(4,SW.zoom*(d/_lp)));_lp=d;drawSwMap();}},{passive:true});
  cv.addEventListener('touchend',()=>{_lp=0;},{passive:true});
}

function swTap(e){
  const cv=document.getElementById('swMapCanvas');if(!cv)return;
  const rect=cv.getBoundingClientRect();
  const sx=(e.clientX||0)-rect.left,sy=(e.clientY||0)-rect.top;
  // Raid diff dots take priority
  for(const btn of SW._raidBtns){if(Math.hypot(sx-btn.x,sy-btn.y)<btn.r){swCloseAllPanels();swShowRaidPanel(btn.region,btn.diff);return;}}
  // Name label hit
  for(const nb of SW._nameBtns){if(sx>=nb.x&&sx<=nb.x+nb.w&&sy>=nb.y&&sy<=nb.y+nb.h){swCloseAllPanels();swShowCountryPanel(nb.region);return;}}
  // Planet body hit — opens country description
  for(const pb of SW._planetBtns){if(Math.hypot(sx-pb.x,sy-pb.y)<pb.r){swCloseAllPanels();swShowCountryPanel(pb.region);return;}}
  swCloseAllPanels();
}

function swShowCountryPanel(region){
  const panel=document.getElementById('swCountryPanel');if(!panel)return;
  const fac=SW_FACTIONS[swFactionOf(region.id)];
  const tIco={plains:'🌿',forest:'🌲',mountain:'🏙️',desert:'🏜️',tundra:'❄️',wasteland:'🌋',swamp:'🌿',sanctum:'⭕'}[region.terrain]||'⭐';
  const desc=SW_COUNTRY_DESCS[region.id]||'A world of mystery in the Skyriver galaxy.';
  panel.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${region.color};text-shadow:0 0 12px ${region.color}55">${tIco} ${region.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:3px">${(()=>{const fi=SW_FACTION_ORDER.indexOf(region.faction);const ok=fi<=0||(()=>{for(let i=0;i<fi;i++){if(!swFactionCleared(SW_FACTION_ORDER[i]))return false;}return true;})();return(ok&&GS.necroLv>=region.lv)?(fac?.name||''):'???';})()} · ${region.terrain} · Lv.${region.lv}</div>
      </div>
      <button onclick="swCloseAllPanels()" style="-webkit-appearance:none;background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.3);color:#6b7280;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px">✕</button>
    </div>
    <div style="font-family:'IM Fell English',serif;font-size:12px;color:#c8b89a;line-height:1.65;font-style:italic;border-top:1px solid rgba(255,255,255,.08);padding-top:10px">${desc}</div>`;
  panel.style.display='block';
}

function swShowRaidPanel(region,diff){
  const panel=document.getElementById('swRaidPanel');if(!panel)return;
  const ck='sw_'+region.id;
  const conq=GS.conquered[ck]||{};
  const isLocked=(diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium));
  const isCleared=!!conq[diff];
  const accessible=swRegionAccessible(region);
  const raidKeys=SW_REGION_RAID_MAP[region.id]||[];
  const rdKey=raidKeys[['easy','medium','hard'].indexOf(diff)];
  const cfg=RAID_CONFIGS[rdKey]||{};
  const boss=SW_BOSSES[cfg.bossKey]||(typeof REGION_BOSSES!=='undefined'?REGION_BOSSES[cfg.bossKey]:null)||(typeof BOSSES!=='undefined'?BOSSES[cfg.bossKey]:null)||{};
  const diffColors={easy:'#22c55e',medium:PALETTE.holyDk,hard:'#ef4444',ascended:'#c084fc'};
  const dc=diffColors[diff]||'#a78bfa';
  const tIco={plains:'🌿',forest:'🌲',mountain:'🏙️',desert:'🏜️',tundra:'❄️',wasteland:'🌋',swamp:'🌿',sanctum:'⭕'}[region.terrain]||'⭐';
  const uniqE=[...new Set(cfg.enemyPool||[])];
  const _risen=(GS.raisedBosses||[]).some(rb=>rb.bossKey===cfg.bossKey);

  let html=`
  <div style="background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(0,0,0,0));border-bottom:1px solid rgba(99,102,241,.25);padding:14px 16px 10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${region.color};text-shadow:0 0 10px ${region.color}44">${cfg.ico||tIco} ${cfg.name||region.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:2px">${region.name} · <span style="color:${dc}">${diff.toUpperCase()}</span> · ${cfg.floors||3} Floors</div>
      </div>
      <button onclick="swCloseAllPanels()" style="-webkit-appearance:none;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);color:#818cf8;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px;flex-shrink:0;margin-left:8px">✕</button>
    </div>
  </div>
  <div style="padding:14px 16px;overflow-y:auto;max-height:55vh">`;

  if(!accessible){
    html+=`<div style="text-align:center;padding:20px;font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">🔒 Requires Level ${region.lv}</div>`;
  }else if(isLocked){
    html+=`<div style="text-align:center;padding:20px"><div style="font-size:32px;margin-bottom:10px">🔒</div><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280">Clear ${diff==='medium'?'Easy':'Easy & Medium'} first</div></div>`;
  }else{
    html+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">DIFFICULTY</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${dc}">${diff.charAt(0).toUpperCase()+diff.slice(1)}</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">MIN LEVEL</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#e5e7eb">Lv. ${region.lv}</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">LOCATION</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#e5e7eb">${tIco} ${region.terrain.charAt(0).toUpperCase()+region.terrain.slice(1)}</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;letter-spacing:1px;margin-bottom:3px">FLOORS</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#e5e7eb">${cfg.floors||3}</div>
      </div>
    </div>`;
    html+=`<div style="margin-bottom:12px"><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;letter-spacing:1px;margin-bottom:7px">ENEMIES</div><div id="swEnemyRow" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>`;
    const _bbg=_risen?'rgba(168,85,247,.10)':'rgba(239,68,68,.08)';
    const _bbd=_risen?'rgba(168,85,247,.40)':'rgba(239,68,68,.25)';
    const _blc=_risen?'#a855f7':'#ef4444';
    const _blb=_risen?'☠ FINAL BOSS — RISEN':'⚔ FINAL BOSS';
    const _bnc=_risen?'#d8b4fe':'#fca5a5';
    if(isCleared){
      html+=`<div style="background:${_bbg};border:1px solid ${_bbd};border-radius:10px;padding:10px 12px;margin-bottom:10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${_blc};letter-spacing:1px;margin-bottom:6px">${_blb}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <canvas id="swBossCanvas" width="52" height="52" style="border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(99,102,241,.3);flex-shrink:0"></canvas>
          <div>
            <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${_bnc};font-weight:bold">${boss.name||cfg.bossKey||'Unknown'}</div>
            <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;margin-top:3px">HP: ${boss.hp||'?'} · DMG: ${boss.dmg||'?'} · XP: ${boss.xp?.toLocaleString()||'?'}</div>
          </div>
        </div>
      </div>`;
    }else{
      html+=`<div style="background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:10px 12px;margin-bottom:10px;text-align:center">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;letter-spacing:1px;margin-bottom:4px">⚔ FINAL BOSS</div>
        <div style="font-size:20px;margin-bottom:4px">❓</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#4b5563;font-style:italic">Clear raid to reveal</div>
      </div>`;
    }
    html+=`<button onclick="swCloseAllPanels();swFireRaid(SW_REGIONS.find(r=>r.id==='${region.id}'),'${diff}')"
      style="-webkit-appearance:none;width:100%;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;letter-spacing:.06em;
      background:linear-gradient(135deg,${dc}22,${dc}11);border:1px solid ${dc}88;color:${dc};border-radius:10px;cursor:pointer;font-weight:bold">
      ${isCleared?'★ ':''} ENTER RAID →</button>`;
  }
  html+='</div>';
  panel.innerHTML=html;panel.style.display='block';

  // Animate enemy sprites in panel
  if(!isLocked&&accessible){
    const row=document.getElementById('swEnemyRow');
    if(row){
      uniqE.forEach(eKey=>{
        if(!EDEF[eKey])return;
        const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px';
        const cv2=document.createElement('canvas');cv2.width=44;cv2.height=44;
        cv2.style.cssText='border-radius:7px;background:rgba(0,0,0,.5);border:1px solid rgba(99,102,241,.2)';
        const lbl=document.createElement('div');lbl.style.cssText="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#9ca3af;text-align:center;max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
        const nm={cultist:'Cultist',skeleton_e:'Skeleton',zombie_e:'Zombie',ghoul_e:'Ghoul',wight_e:'Wight',gravedigger:'Digger',forest_wolf:'Wolf',forest_witch:'Witch',treant:'Treant',banshee:'Banshee',death_knight:'D.Knight',lich_acolyte:'Acolyte',shadow_demon:'Shadow',wraith_e:'Wraith',
          sw_stormtrooper:'Stormtrooper',sw_tusken:'Tusken Raider',sw_battle_droid:'Battle Droid',sw_sandtrooper:'Sandtrooper',sw_gungan:'Gungan',sw_naboo_guard:'Royal Guard',sw_geonosian:'Geonosian',sw_clone_trooper:'Clone',sw_kaminoan:'Kaminoan',sw_rebel_soldier:'Rebel',sw_wookiee:'Wookiee',sw_ewok:'Ewok',sw_probe_droid:'Probe Droid',sw_imperial_officer:'Officer',sw_snowtrooper:'Snowtrooper',sw_imperial_guard:'Royal Guard',sw_shadow_trooper:'Shadow Trooper',sw_ugnaught:'Ugnaught',sw_sith_acolyte:'Sith',sw_jango_fett:'Jango Fett',sw_grievous:'Grievous',sw_darth_maul:'Darth Maul',sw_vader:'Vader',sw_boba_fett:'Boba Fett',sw_emperor:'Emperor'};
        lbl.textContent=nm[eKey]||(eKey.replace('sw_','').replace(/_/g,' '));cv2._eKey=eKey;
        wrap.appendChild(cv2);wrap.appendChild(lbl);row.appendChild(wrap);
      });
      if(window._swPanelRaf)cancelAnimationFrame(window._swPanelRaf);
      const _anim=()=>{
        const t2=Date.now()/1000;
        row.querySelectorAll('canvas').forEach(cv3=>{
          const k=cv3._eKey;if(!k||!SPR[k])return;
          const c2=cv3.getContext('2d');c2.clearRect(0,0,44,44);c2.save();c2.translate(22,28);
          try{SPR[k](c2,t2,0);}catch(ex){}c2.restore();
        });
        const bCv=document.getElementById('swBossCanvas');
        if(bCv&&cfg.bossKey){
          const _bDef=BOSSES[cfg.bossKey]||REGION_BOSSES[cfg.bossKey]||{};
          const _bSprKey=cfg.bossKey;
          const _bSpr=SPR[_bSprKey]||SPR.sw_stormtrooper;
          const bc=bCv.getContext('2d');bc.clearRect(0,0,52,52);bc.save();bc.translate(26,36);bc.scale(.5,.5);
          try{_bSpr(bc,t2,0);}catch(ex){}bc.restore();
        }
        if(document.getElementById('swRaidPanel')?.style.display!=='none'){window._swPanelRaf=requestAnimationFrame(_anim);}
        else{window._swPanelRaf=null;}
      };
      window._swPanelRaf=requestAnimationFrame(_anim);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  STAR WARS SPRITES & ENEMY DEFINITIONS
// ═══════════════════════════════════════════════════════════

// ── Regular enemy sprites ──

// Stormtrooper — white armour, black visor slit, blaster
SPR.sw_stormtrooper=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  // Body armour
  const ag=c.createLinearGradient(-8,-8,8,18);ag.addColorStop(0,'#f0f0f0');ag.addColorStop(1,'#c8c8c8');
  c.fillStyle=ag;c.fillRect(-8,-8,16,24);
  c.strokeStyle='#aaa';c.lineWidth=.8;c.strokeRect(-8,-8,16,24);
  // Chest detail lines
  c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=1;
  c.beginPath();c.moveTo(-8,2);c.lineTo(8,2);c.stroke();
  c.beginPath();c.moveTo(0,-8);c.lineTo(0,16);c.stroke();
  // Helmet
  const hg=c.createRadialGradient(-2,-22,1,0,-20,9);hg.addColorStop(0,'#fff');hg.addColorStop(1,'#d8d8d8');
  fc(c,0,-20,9,hg);
  // Black visor band
  c.fillStyle='#111';c.fillRect(-7,-24,14,4);
  // Visor shine
  c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-6,-24,5,2);
  // Shoulder pads
  c.fillStyle='#e8e8e8';c.fillRect(-14,-10,7,8);c.fillRect(7,-10,7,8);
  // Blaster rifle
  c.strokeStyle='#444';c.lineWidth=2.5;c.beginPath();c.moveTo(12,0);c.lineTo(12,-18);c.stroke();
  c.fillStyle='#555';c.fillRect(10,-16,5,3);
  c.restore();
  // Legs stride
  const ll=-5+w*5,rl=1-w*5;
  c.fillStyle='#d8d8d8';c.fillRect(ll,16-bob,5,12);c.fillRect(rl,16-bob,5,12);
  c.fillStyle='#bbb';c.fillRect(ll,24-bob,6,4);c.fillRect(rl,24-bob,6,4);
};

// Tusken Raider — wrapped robes, gaffi stick
SPR.sw_tusken=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.0;
  c.save();c.translate(w*.8,-bob);
  // Robes — sandy tan
  const rg=c.createLinearGradient(-8,-6,8,18);rg.addColorStop(0,'#b8986a');rg.addColorStop(1,'#8a6a40');
  c.fillStyle=rg;c.beginPath();c.moveTo(-8,-6);c.lineTo(8,-6);c.lineTo(11,18);c.lineTo(-11,18);c.closePath();c.fill();
  // Robe wrap strips
  c.strokeStyle='rgba(80,50,20,.4)';c.lineWidth=1;
  for(let y=-2;y<18;y+=5){c.beginPath();c.moveTo(-8,y);c.lineTo(8,y);c.stroke();}
  // Head — wrapped mask
  fc(c,0,-18,8,'#c8a870');
  // Eye goggles (two circular lenses)
  c.fillStyle='#222';fc(c,-3,-19,3,'');fc(c,3,-19,3,'');
  c.fillStyle='rgba(255,150,0,.5)';fc(c,-3,-19,2,'');fc(c,3,-19,2,'');
  // Snout wrap
  c.fillStyle='#a07848';c.fillRect(-5,-15,10,4);
  // Gaffi stick
  c.strokeStyle='#6a4a20';c.lineWidth=2.5;c.beginPath();c.moveTo(-10,4);c.lineTo(-14,-16);c.stroke();
  c.fillStyle='#888';c.fillRect(-16,-20,5,5);
  c.restore();
  c.fillStyle='#9a7848';c.fillRect(-6+w*5,16,4,6);c.fillRect(2-w*5,16,4,6);
};

// Battle Droid — thin tan skeleton droid
SPR.sw_battle_droid=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.8;
  c.save();c.translate(0,-bob);
  const tan='#c8a860',dark='#8a6a30';
  // Thin torso
  c.fillStyle=tan;c.fillRect(-4,-8,8,18);
  c.strokeStyle=dark;c.lineWidth=.8;c.strokeRect(-4,-8,8,18);
  // Hip joint
  c.fillStyle=dark;c.fillRect(-6,8,12,4);
  // Head — elongated oval
  fc(c,0,-16,5,tan);
  c.fillStyle='#111';c.fillRect(-4,-18,8,3); // visor
  // Antenna
  c.strokeStyle=tan;c.lineWidth=1.5;c.beginPath();c.moveTo(0,-21);c.lineTo(2,-28);c.stroke();fc(c,2,-28,1.5,tan);
  // Arms thin
  c.strokeStyle=tan;c.lineWidth=2;
  c.beginPath();c.moveTo(-4,-4);c.lineTo(-12+w*3,4-w*2);c.stroke();
  c.beginPath();c.moveTo(4,-4);c.lineTo(12-w*3,4+w*2);c.stroke();
  // Blaster in right hand
  c.strokeStyle='#555';c.lineWidth=2;c.beginPath();c.moveTo(12-w*3,4+w*2);c.lineTo(16-w*3,0+w*2);c.stroke();
  c.restore();
  // Thin legs
  c.strokeStyle=tan;c.lineWidth=2.5;
  c.beginPath();c.moveTo(-2,10-bob);c.lineTo(-4+w*5,26);c.stroke();
  c.beginPath();c.moveTo(2,10-bob);c.lineTo(4-w*5,26);c.stroke();
  c.fillStyle=dark;c.fillRect(-6+w*5,24,5,3);c.fillRect(2-w*5,24,5,3);
};

// Sandtrooper — stormtrooper with desert pauldron (orange shoulder mark)
SPR.sw_sandtrooper=(c,t=0,w=0)=>{
  SPR.sw_stormtrooper(c,t,w);
  // Orange sergeant pauldron
  c.fillStyle='#ea580c';c.fillRect(-14,-10,7,8);
  c.strokeStyle='#c2410c';c.lineWidth=.8;c.strokeRect(-14,-10,7,8);
};

// Gungan warrior — floppy ears, energy shield
SPR.sw_gungan=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.0;
  c.save();c.translate(0,-bob);
  // Body — bluish-green skin
  c.fillStyle='#4a7a60';c.fillRect(-7,-6,14,20);
  // Chest armour plate
  c.fillStyle='rgba(255,200,100,.4)';c.fillRect(-5,-4,10,10);
  c.strokeStyle='rgba(200,150,50,.6)';c.lineWidth=1;c.strokeRect(-5,-4,10,10);
  // Head — long skull
  fc(c,0,-20,8,'#4a7a60');
  // Floppy ear-fins (long lobes hanging down)
  c.fillStyle='#3a6050';
  c.beginPath();c.ellipse(-10,-18,4,10,-.3,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(10,-18,4,10,.3,0,Math.PI*2);c.fill();
  // Big yellow eyes
  c.fillStyle='#fbbf24';c.shadowColor='#fbbf24';c.shadowBlur=4;
  fc(c,-3,-22,3,'');fc(c,3,-22,3,'');c.shadowBlur=0;
  fc(c,-3,-22,2.5,'#fde68a');fc(c,3,-22,2.5,'#fde68a');
  // Energy shield
  c.strokeStyle='rgba(100,200,255,.55)';c.lineWidth=2;
  c.beginPath();c.arc(0,-8,16,Math.PI*.8,Math.PI*2.2);c.stroke();
  c.restore();
  c.fillStyle='#3a6050';c.fillRect(-5+w*5,14,4,8);c.fillRect(1-w*5,14,4,8);
};

// Naboo Royal Guard — red uniform, long gun
SPR.sw_naboo_guard=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  // Crimson uniform
  const rg=c.createLinearGradient(-7,-8,7,20);rg.addColorStop(0,'#dc2626');rg.addColorStop(1,PALETTE.dmgRedDeep);
  c.fillStyle=rg;c.fillRect(-7,-8,14,26);
  c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=1;c.strokeRect(-7,-8,14,26);
  // Gold belt
  c.fillStyle='#f59e0b';c.fillRect(-7,6,14,3);
  // Helmet — smooth chrome
  const hg=c.createRadialGradient(-2,-22,1,0,-20,9);hg.addColorStop(0,'#e8e8e8');hg.addColorStop(1,'#9ca3af');
  fc(c,0,-20,9,hg);
  c.fillStyle='rgba(0,0,0,.5)';c.fillRect(-6,-24,12,5);// visor
  // Long blaster
  c.strokeStyle='#555';c.lineWidth=2;c.beginPath();c.moveTo(12,4);c.lineTo(14,-22);c.stroke();
  c.fillStyle='#666';c.fillRect(11,-14,5,3);
  c.restore();
  c.fillStyle='#b91c1c';c.fillRect(-5+w*5,18,5,8);c.fillRect(1-w*5,18,5,8);
};

// Geonosian drone — insectoid wings, clawed
SPR.sw_geonosian=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.0;const wingFlap=Math.sin(t*8)*.15;
  c.save();c.translate(0,-bob);
  // Carapace body
  c.fillStyle='#8B6914';c.beginPath();c.ellipse(0,2,7,12,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#5a4010';c.lineWidth=1;c.stroke();
  // Neck + head
  c.fillStyle='#9B7924';c.fillRect(-3,-10,6,8);
  fc(c,0,-16,7,'#9B7924');
  // Compound eyes
  c.fillStyle='#dc2626';c.shadowColor='#dc2626';c.shadowBlur=4;
  fc(c,-4,-18,3,'');fc(c,4,-18,3,'');c.shadowBlur=0;
  fc(c,-4,-18,2.5,'#ef4444');fc(c,4,-18,2.5,'#ef4444');
  // Antenna
  c.strokeStyle='#7a5a10';c.lineWidth=1;
  c.beginPath();c.moveTo(-2,-22);c.lineTo(-5,-30);c.stroke();
  c.beginPath();c.moveTo(2,-22);c.lineTo(5,-30);c.stroke();
  // Wings
  c.save();c.rotate(wingFlap);
  c.fillStyle='rgba(180,140,60,.3)';
  c.beginPath();c.ellipse(-14,-6,12,5,-.4,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(14,-6,12,5,.4,0,Math.PI*2);c.fill();
  c.restore();
  // Clawed arms
  c.strokeStyle='#7a5a10';c.lineWidth=2;
  c.beginPath();c.moveTo(-6,0);c.lineTo(-14+w*3,-6);c.stroke();
  c.beginPath();c.moveTo(6,0);c.lineTo(14-w*3,-6);c.stroke();
  c.restore();
  c.fillStyle='#8B6914';c.fillRect(-4+w*4,14,3,8);c.fillRect(1-w*4,14,3,8);
};

// Clone trooper Phase I — rounder helmet
SPR.sw_clone_trooper=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  const ag=c.createLinearGradient(-8,-8,8,18);ag.addColorStop(0,'#f8f8f8');ag.addColorStop(1,'#d0d0d0');
  c.fillStyle=ag;c.fillRect(-8,-8,16,24);
  c.strokeStyle='#bbb';c.lineWidth=.8;c.strokeRect(-8,-8,16,24);
  // Phase I helmet — rounder
  fc(c,0,-21,10,ag);
  // T-visor
  c.fillStyle='#111';c.fillRect(-7,-25,14,5);
  c.fillStyle='#111';c.fillRect(-2,-22,4,6);
  // Visor shine
  c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-6,-25,5,2);
  // Shoulder pads
  c.fillStyle='#e8e8e8';c.fillRect(-14,-10,7,8);c.fillRect(7,-10,7,8);
  // DC-15 blaster
  c.strokeStyle='#555';c.lineWidth=2.5;c.beginPath();c.moveTo(12,2);c.lineTo(12,-18);c.stroke();
  c.fillStyle='#444';c.fillRect(10,-12,6,3);
  c.restore();
  c.fillStyle='#d8d8d8';c.fillRect(-5+w*5,16,5,12);c.fillRect(1-w*5,16,5,12);
};

// Kaminoan — tall, long neck, white coat
SPR.sw_kaminoan=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.7;const sway=w*.8;
  c.save();c.translate(sway,-bob);
  // Tall thin body — white lab coat
  c.fillStyle='#f1f5f9';c.fillRect(-5,-4,10,24);
  c.strokeStyle='#cbd5e1';c.lineWidth=.8;c.strokeRect(-5,-4,10,24);
  // Long neck
  c.fillStyle='#e0e8f0';c.fillRect(-2,-16,4,14);
  // Elongated head
  fc(c,0,-26,7,'#e0e8f0');
  // Black almond eyes
  c.fillStyle='#111';
  c.beginPath();c.ellipse(-2,-28,2.5,1.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(2,-28,2.5,1.5,0,0,Math.PI*2);c.fill();
  // Spine bump
  c.fillStyle='rgba(150,160,180,.5)';c.beginPath();c.ellipse(5,2,2,8,0,0,Math.PI*2);c.fill();
  // Long thin arms
  c.strokeStyle='#c8d5e0';c.lineWidth=2;
  c.beginPath();c.moveTo(-5,2);c.lineTo(-12+w*3,12-w*2);c.stroke();
  c.beginPath();c.moveTo(5,2);c.lineTo(12-w*3,12+w*2);c.stroke();
  c.restore();
  c.fillStyle='#d8e4f0';c.fillRect(-3+w*4,20,4,8);c.fillRect(1-w*4,20,4,8);
};

// Rebel soldier — orange pilot suit or brown/tan fatigues
SPR.sw_rebel_soldier=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.0;
  c.save();c.translate(0,-bob);
  // Olive fatigues
  const rg=c.createLinearGradient(-7,-8,7,20);rg.addColorStop(0,'#6b7c3a');rg.addColorStop(1,'#4a5828');
  c.fillStyle=rg;c.fillRect(-7,-8,14,26);
  c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=.8;c.strokeRect(-7,-8,14,26);
  // Chest webbing
  c.strokeStyle='rgba(40,50,20,.5)';c.lineWidth=1;
  c.beginPath();c.moveTo(-7,-2);c.lineTo(7,-2);c.stroke();
  c.beginPath();c.moveTo(-7,6);c.lineTo(7,6);c.stroke();
  c.beginPath();c.moveTo(-2,-8);c.lineTo(-2,18);c.stroke();
  // Rebel Alliance helmet — orange stripe
  const hg=c.createLinearGradient(-8,-22,8,-10);hg.addColorStop(0,'#666');hg.addColorStop(1,'#444');
  fc(c,0,-20,9,hg);
  c.fillStyle='#ea580c';
  c.beginPath();c.arc(0,-20,9,Math.PI*1.1,Math.PI*1.9);c.lineTo(0,-20);c.closePath();c.fill(); // orange top stripe
  c.fillStyle='rgba(0,0,0,.6)';c.fillRect(-6,-24,12,5);// visor
  // Blaster pistol
  c.strokeStyle='#555';c.lineWidth=2;c.beginPath();c.moveTo(10,4);c.lineTo(14,-6);c.stroke();
  c.fillStyle='#666';c.fillRect(10,-6,5,3);
  c.restore();
  c.fillStyle='#556030';c.fillRect(-5+w*5,18,5,10);c.fillRect(1-w*5,18,5,10);
};

// Wookiee warrior — brown fur, bowcaster
SPR.sw_wookiee=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.1;
  c.save();c.translate(0,-bob);
  // Fur body — big and broad
  const fg=c.createLinearGradient(-12,-10,12,22);fg.addColorStop(0,'#7c5230');fg.addColorStop(1,'#4a3018');
  c.fillStyle=fg;c.fillRect(-12,-10,24,30);
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.8;c.strokeRect(-12,-10,24,30);
  // Fur texture strokes
  c.strokeStyle='rgba(60,35,15,.4)';c.lineWidth=1;
  for(let fy=-6;fy<20;fy+=4){
    c.beginPath();c.moveTo(-12,fy);c.bezierCurveTo(-6,fy-2,6,fy+2,12,fy);c.stroke();
  }
  // Bandolier
  c.strokeStyle='rgba(180,130,50,.7)';c.lineWidth=2;
  c.beginPath();c.moveTo(-12,-2);c.lineTo(12,10);c.stroke();
  // Head — big
  fc(c,0,-22,12,'#7c5230');
  // Snout
  c.fillStyle='#5a3818';c.beginPath();c.ellipse(0,-18,5,4,0,0,Math.PI*2);c.fill();
  // Eyes
  fc(c,-5,-26,2.5,'#1a0a00');fc(c,5,-26,2.5,'#1a0a00');
  // Bowcaster
  c.strokeStyle='#8B6914';c.lineWidth=3;c.beginPath();c.moveTo(-14,0);c.lineTo(-18,-14);c.stroke();
  c.fillStyle='#666';c.fillRect(-20,-18,6,4);
  c.restore();
  c.fillStyle='#6a4428';c.fillRect(-7+w*5,20,6,10);c.fillRect(3-w*5,20,6,10);
};

// Imperial Officer — grey uniform, cap
SPR.sw_imperial_officer=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.8;
  c.save();c.translate(w*.6,-bob);
  // Grey uniform
  const ug=c.createLinearGradient(-7,-8,7,20);ug.addColorStop(0,'#6b7280');ug.addColorStop(1,'#374151');
  c.fillStyle=ug;c.fillRect(-7,-8,14,26);
  c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=1;c.strokeRect(-7,-8,14,26);
  // Code cylinders & rank badge
  c.fillStyle='#b91c1c';c.fillRect(-4,-2,3,2);
  c.fillStyle='#fbbf24';c.fillRect(1,-2,3,2);
  // Face — human, pale
  fc(c,0,-18,7,'#e8d0b0');
  // Officer cap — dark grey flat top
  c.fillStyle='#1f2937';
  c.beginPath();c.ellipse(0,-24,10,3,0,0,Math.PI*2);c.fill();
  c.fillRect(-8,-28,16,6);
  // Cap badge
  c.fillStyle='#fbbf24';fc(c,0,-26,2,'');
  c.restore();
  c.fillStyle='#4b5563';c.fillRect(-5+w*4,18,5,10);c.fillRect(1-w*4,18,5,10);
};

// Probe droid — floating sphere with tentacles
SPR.sw_probe_droid=(c,t=0,w=0)=>{
  const hover=Math.sin(t*2.4)*.5;
  c.save();c.translate(0,-2+hover);
  // Main sphere
  const sg=c.createRadialGradient(-3,-26,2,0,-24,14);sg.addColorStop(0,'#555');sg.addColorStop(1,'#1a1a1a');
  c.fillStyle=sg;c.beginPath();c.arc(0,-24,14,0,Math.PI*2);c.fill();
  c.strokeStyle='#333';c.lineWidth=1;c.stroke();
  // Central red eye
  c.fillStyle='#dc2626';c.shadowColor='#dc2626';c.shadowBlur=8;
  fc(c,0,-24,4,'');c.shadowBlur=0;fc(c,0,-24,3,'#ef4444');fc(c,0,-22,1.5,'#fca5a5');
  // Sensor dish
  c.fillStyle='#666';c.beginPath();c.ellipse(0,-10,8,3,0,0,Math.PI*2);c.fill();
  // Tentacle arms
  c.strokeStyle='#444';c.lineWidth=2;
  [[-16,-24],[-14,-14],[14,-24],[16,-14],[-10,-34],[10,-34]].forEach(([tx,ty],i)=>{
    c.beginPath();c.moveTo(i%2===0?-8:8,-24);c.quadraticCurveTo(tx*.5,ty*.5,tx,ty);c.stroke();
  });
  c.restore();
};

// Snowtrooper — white armour with respirator & cape
SPR.sw_snowtrooper=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  // White armour body
  c.fillStyle='#e8e8e8';c.fillRect(-8,-8,16,24);
  c.strokeStyle='#bbb';c.lineWidth=.8;c.strokeRect(-8,-8,16,24);
  // Thermal body glove (dark undersuit showing at joints)
  c.fillStyle='#555';c.fillRect(-9,-2,2,10);c.fillRect(7,-2,2,10);
  // Helmet — rounded with centre face mask
  fc(c,0,-20,9,'#e8e8e8');
  // Central respirator
  c.fillStyle='#555';c.fillRect(-4,-16,8,5);
  c.fillStyle='#777';fc(c,-2,-14,1.5,'');fc(c,2,-14,1.5,'');
  // Snow cape
  c.fillStyle='rgba(220,220,220,.7)';
  c.beginPath();c.moveTo(-8,-6);c.lineTo(-14,20);c.lineTo(-8,20);c.lineTo(-8,-6);c.closePath();c.fill();
  // Blaster
  c.strokeStyle='#555';c.lineWidth=2.5;c.beginPath();c.moveTo(12,0);c.lineTo(12,-16);c.stroke();
  c.fillStyle='#444';c.fillRect(10,-14,5,3);
  c.restore();
  c.fillStyle='#d8d8d8';c.fillRect(-5+w*5,16,5,12);c.fillRect(1-w*5,16,5,12);
};

// Ewok — small furry creature with spear
SPR.sw_ewok=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.1;
  c.save();c.translate(0,-bob);
  // Short furry body
  const fg=c.createLinearGradient(-7,-4,7,14);fg.addColorStop(0,'#a07040');fg.addColorStop(1,'#6a4820');
  c.fillStyle=fg;c.fillRect(-7,-4,14,18);
  // Fur detail
  c.strokeStyle='rgba(80,50,20,.3)';c.lineWidth=1;
  for(let fy=0;fy<14;fy+=3){c.beginPath();c.moveTo(-7,fy);c.bezierCurveTo(-3,fy-1,3,fy+1,7,fy);c.stroke();}
  // Hood
  c.fillStyle='#5a3820';c.beginPath();c.arc(0,-10,9,Math.PI,0);c.lineTo(9,-10);c.lineTo(-9,-10);c.closePath();c.fill();
  // Cute face — big dark eyes, snout
  fc(c,0,-8,7,'#b08050');
  fc(c,-2.5,-10,2.5,'#1a0a00');fc(c,2.5,-10,2.5,'#1a0a00');
  fc(c,0,-6,2,'#5a3020');// snout
  // Spear
  c.strokeStyle='#7a5020';c.lineWidth=2;c.beginPath();c.moveTo(-10,2);c.lineTo(-12,-16);c.stroke();
  c.strokeStyle='#888';c.lineWidth=1.5;c.beginPath();c.moveTo(-11,-16);c.lineTo(-14,-22);c.stroke();
  c.restore();
  c.fillStyle='#8a5830';c.fillRect(-5+w*5,14,4,8);c.fillRect(1-w*5,14,4,8);
};

// Imperial Guard — red armour, force pike
SPR.sw_imperial_guard=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  // Deep red armour
  const rg=c.createLinearGradient(-8,-8,8,20);rg.addColorStop(0,PALETTE.dmgRedDeep);rg.addColorStop(1,'#7f1d1d');
  c.fillStyle=rg;c.fillRect(-8,-8,16,26);
  c.strokeStyle='#6f1111';c.lineWidth=1;c.strokeRect(-8,-8,16,26);
  // Chest plate
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-6,-4,12,8);
  // Helmet — smooth red round
  const hg=c.createRadialGradient(-3,-22,1,0,-20,10);hg.addColorStop(0,'#dc2626');hg.addColorStop(1,'#7f1d1d');
  fc(c,0,-20,10,hg);
  // Red visor slit
  c.fillStyle='rgba(0,0,0,.7)';c.fillRect(-7,-24,14,4);
  // Force pike — tall staff with electro tip
  c.strokeStyle='#555';c.lineWidth=2.5;c.beginPath();c.moveTo(14,22);c.lineTo(12,-24);c.stroke();
  c.fillStyle='#fbbf24';c.shadowColor='#fbbf24';c.shadowBlur=6;
  fc(c,12,-26,3,'');c.shadowBlur=0;fc(c,12,-26,2.5,'#fde68a');
  c.restore();
  c.fillStyle='#881111';c.fillRect(-5+w*5,18,5,10);c.fillRect(1-w*5,18,5,10);
};

// Shadow Stormtrooper — jet black armour
SPR.sw_shadow_trooper=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;
  c.save();c.translate(0,-bob);
  // Black armour
  c.fillStyle='#111';c.fillRect(-8,-8,16,24);
  c.strokeStyle='#333';c.lineWidth=.8;c.strokeRect(-8,-8,16,24);
  c.beginPath();c.moveTo(-8,2);c.lineTo(8,2);c.stroke();
  c.beginPath();c.moveTo(0,-8);c.lineTo(0,16);c.stroke();
  // Helmet
  const hg=c.createRadialGradient(-2,-22,1,0,-20,9);hg.addColorStop(0,'#222');hg.addColorStop(1,'#000');
  fc(c,0,-20,9,hg);
  c.fillStyle='#222';c.fillRect(-7,-24,14,4);
  c.fillStyle='#dc2626';c.shadowColor='#dc2626';c.shadowBlur=4;// red visor glow
  c.fillRect(-6,-24,12,3);c.shadowBlur=0;
  c.fillStyle='#1a1a1a';c.fillRect(-14,-10,7,8);c.fillRect(7,-10,7,8);// shoulders
  c.strokeStyle='#444';c.lineWidth=2.5;c.beginPath();c.moveTo(12,0);c.lineTo(12,-18);c.stroke();
  c.restore();
  c.fillStyle='#111';c.fillRect(-5+w*5,16,5,12);c.fillRect(1-w*5,16,5,12);
};

// Sith Acolyte — dark robe, crackling red saber
SPR.sw_sith_acolyte=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.9;const p=Math.sin(t*3)*.07+.93;
  c.save();c.translate(w*.8,-bob);
  // Black robe
  const rg=c.createLinearGradient(-9,-6,9,20);rg.addColorStop(0,'#0a0010');rg.addColorStop(1,'#050008');
  c.fillStyle=rg;c.beginPath();c.moveTo(-9,-6);c.lineTo(9,-6);c.lineTo(13,20);c.lineTo(-13,20);c.closePath();c.fill();
  c.strokeStyle='rgba(220,38,38,.4)';c.lineWidth=1;c.stroke();
  // Head in cowl
  fc(c,0,-18,7,'#2a0808');
  c.fillStyle='#1a0010';c.beginPath();c.arc(0,-18,8,Math.PI,0);c.lineTo(8,-18);c.lineTo(-8,-18);c.closePath();c.fill();
  // Sith eyes — glowing red/gold
  c.fillStyle='#fbbf24';c.shadowColor='#fbbf24';c.shadowBlur=6+p*3;
  fc(c,-3,-20,2.5,'');fc(c,3,-20,2.5,'');c.shadowBlur=0;
  fc(c,-3,-20,2.5,'#fde68a');fc(c,3,-20,2.5,'#fde68a');
  // Red lightsaber
  const sa=p*.9+.1;
  c.strokeStyle='#111';c.lineWidth=3;c.beginPath();c.moveTo(12,16);c.lineTo(10,-4);c.stroke();// hilt
  c.strokeStyle=`rgba(239,68,68,${sa})`;c.lineWidth=2.5;c.shadowColor='#dc2626';c.shadowBlur=8;
  c.beginPath();c.moveTo(11,-4);c.lineTo(11,-28);c.stroke();c.shadowBlur=0;
  fc(c,11,-5,3,'rgba(220,38,38,.4)');
  c.restore();
  c.fillStyle='#0a0010';c.fillRect(-5+w*4,17,4,5);c.fillRect(1-w*4,17,4,5);
};

// Ugnaught — short, pig-like face, orange suit
SPR.sw_ugnaught=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*1.1;
  c.save();c.translate(0,-bob);
  // Orange work suit
  c.fillStyle='#c2410c';c.fillRect(-7,-4,14,18);
  c.strokeStyle='#9a3010';c.lineWidth=.8;c.strokeRect(-7,-4,14,18);
  c.fillStyle='#7c2d12';c.fillRect(-7,6,14,3);// belt
  // Pig-like head
  fc(c,0,-14,8,'#f0c0a0');
  // Snout
  c.fillStyle='#e0a888';c.beginPath();c.ellipse(0,-10,4,3,0,0,Math.PI*2);c.fill();
  c.fillStyle='#888';fc(c,-1.5,-10,1.5,'');fc(c,1.5,-10,1.5,'');// nostrils
  // Beady eyes
  fc(c,-3,-16,2.5,'#1a0a00');fc(c,3,-16,2.5,'#1a0a00');
  // Tool in hand
  c.strokeStyle='#888';c.lineWidth=2;c.beginPath();c.moveTo(-10,2);c.lineTo(-14,-8);c.stroke();
  c.fillStyle='#555';c.fillRect(-16,-10,4,4);
  c.restore();
  c.fillStyle='#b53810';c.fillRect(-5+w*5,14,4,8);c.fillRect(1-w*5,14,4,8);
};

// ── MINI-BOSS sprites (tougher named characters) ──

// Jango Fett — Mandalorian armour (silver/blue), dual pistols
SPR.sw_jango_fett=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.8;
  c.save();c.translate(0,-bob);
  // Mandalorian armour — silver plate
  const ag=c.createLinearGradient(-9,-10,9,22);ag.addColorStop(0,'#d1d5db');ag.addColorStop(1,'#6b7280');
  c.fillStyle=ag;c.fillRect(-9,-10,18,30);
  c.strokeStyle='#9ca3af';c.lineWidth=1;c.strokeRect(-9,-10,18,30);
  // Blue shoulder markings
  c.fillStyle='#1d4ed8';c.fillRect(-14,-12,8,8);c.fillRect(6,-12,8,8);
  c.strokeStyle='#1e40af';c.lineWidth=.8;c.strokeRect(-14,-12,8,8);c.strokeRect(6,-12,8,8);
  // Chest diamond
  c.fillStyle='#1d4ed8';
  c.beginPath();c.moveTo(0,-8);c.lineTo(5,-2);c.lineTo(0,4);c.lineTo(-5,-2);c.closePath();c.fill();
  // T-visor helmet
  const hg=c.createRadialGradient(-3,-24,1,0,-22,11);hg.addColorStop(0,'#e5e7eb');hg.addColorStop(1,'#9ca3af');
  fc(c,0,-22,11,hg);
  c.fillStyle='#1f2937';c.fillRect(-8,-27,16,6);
  c.fillStyle='rgba(100,150,255,.3)';c.fillRect(-7,-27,14,4);// blue visor shine
  // Dual blasters
  c.strokeStyle='#374151';c.lineWidth=2.5;
  c.beginPath();c.moveTo(-11,6);c.lineTo(-15,-8);c.stroke();
  c.beginPath();c.moveTo(11,6);c.lineTo(15,-8);c.stroke();
  c.fillStyle='#555';c.fillRect(-17,-10,4,4);c.fillRect(13,-10,4,4);
  // Jetpack on back (just a suggestion on torso)
  c.fillStyle='#4b5563';c.fillRect(-9,-8,3,16);
  c.restore();
  c.fillStyle='#6b7280';c.fillRect(-6+w*4,20,6,12);c.fillRect(3-w*4,20,6,12);
};

// General Grievous — cyborg with 4 sabers
SPR.sw_grievous=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.6;const cough=Math.sin(t*0.8)*.5;
  c.save();c.translate(cough,-bob);
  // White carapace body
  c.fillStyle='#d1d5db';c.fillRect(-9,-6,18,22);
  c.strokeStyle='#9ca3af';c.lineWidth=1;c.strokeRect(-9,-6,18,22);
  // Dark mechanical underparts
  c.fillStyle='#374151';c.fillRect(-7,2,14,6);
  c.fillStyle='#4b5563';c.fillRect(-5,8,10,8);
  // Skull head
  fc(c,0,-18,9,'#c8c8c8');
  c.strokeStyle='#888';c.lineWidth=.8;c.stroke();
  // Glowing eyes
  c.fillStyle='#22d3ee';c.shadowColor='#22d3ee';c.shadowBlur=8;
  fc(c,-3,-20,3,'');fc(c,3,-20,3,'');c.shadowBlur=0;
  fc(c,-3,-20,2.5,'#67e8f9');fc(c,3,-20,2.5,'#67e8f9');
  // 4 saber hands (2 drawn each side)
  const sa=Math.sin(t*3)*.08+.92;
  ['#22c55e','#dc2626','#3b82f6',PALETTE.frameInner].forEach((col,i)=>{
    const side=i<2?-1:1;const off=(i%2)*10-5;
    const hx=side*12+off*.3,hy=-4+off*.2;
    c.strokeStyle='#555';c.lineWidth=2;c.beginPath();c.moveTo(hx,hy+16);c.lineTo(hx,hy+6);c.stroke();
    c.strokeStyle=`rgba(${col.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},${sa})`;
    c.lineWidth=2;c.shadowColor=col;c.shadowBlur=7;
    c.beginPath();c.moveTo(hx,hy+5);c.lineTo(hx+side*off*.5,hy-20+off*1.2);c.stroke();
    c.shadowBlur=0;
  });
  c.restore();
  c.fillStyle='#9ca3af';c.fillRect(-5+w*4,16,4,8);c.fillRect(1-w*4,16,4,8);
};

// Darth Maul — red/black tattooed face, double-bladed saber
SPR.sw_darth_maul=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.8;const sa=Math.sin(t*4)*.08+.92;
  c.save();c.translate(w*.7,-bob);
  // Black Sith robes
  const rg=c.createLinearGradient(-9,-8,9,22);rg.addColorStop(0,'#0a0010');rg.addColorStop(1,'#050008');
  c.fillStyle=rg;c.beginPath();c.moveTo(-9,-8);c.lineTo(9,-8);c.lineTo(13,22);c.lineTo(-13,22);c.closePath();c.fill();
  c.strokeStyle='rgba(220,38,38,.5)';c.lineWidth=1.5;c.stroke();
  // Face — red and black tattoo pattern
  fc(c,0,-20,9,'#c8403a');
  // Tattooed half-black
  c.fillStyle='#1a0000';c.beginPath();c.arc(0,-20,9,0,Math.PI);c.closePath();c.fill();
  // Horns (Zabrak)
  c.fillStyle='#1a0000';
  for(let hi=-6;hi<=6;hi+=3){
    c.beginPath();c.moveTo(hi,-29);c.lineTo(hi+1,-29-4-Math.abs(hi)*.5);c.lineTo(hi-1,-29-4-Math.abs(hi)*.5);c.closePath();c.fill();
  }
  // Yellow Sith eyes
  c.fillStyle='#f59e0b';c.shadowColor='#f59e0b';c.shadowBlur=8+sa*4;
  fc(c,-3,-22,2.5,'');fc(c,3,-22,2.5,'');c.shadowBlur=0;
  fc(c,-3,-22,2.5,'#fde68a');fc(c,3,-22,2.5,'#fde68a');
  // Double-bladed saber (horizontal spin)
  c.strokeStyle='#222';c.lineWidth=3;c.beginPath();c.moveTo(-14,2);c.lineTo(14,2);c.stroke();// hilt
  c.strokeStyle=`rgba(220,38,38,${sa})`;c.lineWidth=2;c.shadowColor='#dc2626';c.shadowBlur=10;
  c.beginPath();c.moveTo(-14,2);c.lineTo(-30,2);c.stroke();
  c.beginPath();c.moveTo(14,2);c.lineTo(30,2);c.stroke();
  c.shadowBlur=0;
  c.restore();
  c.fillStyle='#0a0010';c.fillRect(-5+w*4,19,4,5);c.fillRect(1-w*4,19,4,5);
};

// Darth Vader — imposing black armour, red saber, breathing mask
SPR.sw_vader=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.6;const breath=Math.sin(t*0.7)*.03;
  c.save();c.translate(0,-bob);
  // Black armour — wide and imposing
  const ag=c.createLinearGradient(-14,-12,14,28);ag.addColorStop(0,'#0a0a0a');ag.addColorStop(1,'#000000');
  c.fillStyle=ag;c.fillRect(-14,-12,28,38);
  c.strokeStyle='#222';c.lineWidth=1.5;c.strokeRect(-14,-12,28,38);
  // Cape
  c.fillStyle='rgba(5,5,5,.9)';
  c.beginPath();c.moveTo(-14,-12);c.lineTo(-20,36);c.lineTo(-14,36);c.lineTo(-14,-12);c.closePath();c.fill();
  c.beginPath();c.moveTo(14,-12);c.lineTo(20,36);c.lineTo(14,36);c.lineTo(14,-12);c.closePath();c.fill();
  // Chest control panel
  c.fillStyle='#1a1a1a';c.fillRect(-8,-4,16,12);
  c.fillStyle='#dc2626';fc(c,-4,-0,2,'');c.fillStyle='#fbbf24';fc(c,0,-0,2,'');c.fillStyle='#22c55e';fc(c,4,-0,2,'');
  // Iconic helmet — dome with face mask
  const hg=c.createRadialGradient(-4,-26,2,0,-24,16);hg.addColorStop(0,'#1a1a1a');hg.addColorStop(1,'#000');
  fc(c,0,-24,16,hg);
  c.strokeStyle='#333';c.lineWidth=1;c.stroke();
  // Faceplate angles
  c.fillStyle='#111';c.fillRect(-10,-30,20,7);// upper panel
  // Mouth grilles
  for(let mx=-5;mx<=5;mx+=3){c.fillStyle='#0a0a0a';c.fillRect(mx,-20,2,4);}
  // Helmet crest ridge
  c.strokeStyle='#333';c.lineWidth=2;c.beginPath();c.moveTo(0,-40);c.lineTo(0,-8);c.stroke();
  // Eye lenses
  c.fillStyle='rgba(30,30,30,.9)';c.fillRect(-9,-28,6,4);c.fillRect(3,-28,6,4);
  // Red lightsaber
  const sa=Math.sin(t*2)*.06+.94;
  c.strokeStyle='#222';c.lineWidth=4;c.beginPath();c.moveTo(17,28);c.lineTo(15,-8);c.stroke();
  c.strokeStyle=`rgba(220,38,38,${sa})`;c.lineWidth=3;c.shadowColor='#dc2626';c.shadowBlur=12;
  c.beginPath();c.moveTo(15,-8);c.lineTo(14,-42);c.stroke();c.shadowBlur=0;
  // Breathing aura
  c.fillStyle=`rgba(0,0,0,${breath*.5})`;c.beginPath();c.ellipse(0,4,36,50,0,0,Math.PI*2);c.fill();
  c.restore();
  c.fillStyle='#050505';c.fillRect(-8+w*4,26,7,14);c.fillRect(3-w*4,26,7,14);
};

// Boba Fett — worn Mandalorian armour (green/grey)
SPR.sw_boba_fett=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.8;
  c.save();c.translate(0,-bob);
  // Worn green Mandalorian armour
  const ag=c.createLinearGradient(-9,-10,9,22);ag.addColorStop(0,'#4a6a30');ag.addColorStop(1,'#2a4018');
  c.fillStyle=ag;c.fillRect(-9,-10,18,30);
  c.strokeStyle='#3a5020';c.lineWidth=1;c.strokeRect(-9,-10,18,30);
  // Grey chest plate
  c.fillStyle='#6b7280';c.fillRect(-7,-6,14,10);c.strokeStyle='#555';c.lineWidth=.8;c.strokeRect(-7,-6,14,10);
  // Battle damage marks
  c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1;
  c.beginPath();c.moveTo(-4,-4);c.lineTo(-1,-1);c.stroke();
  c.beginPath();c.moveTo(3,-2);c.lineTo(6,-4);c.stroke();
  // T-visor helmet (green)
  const hg=c.createRadialGradient(-3,-24,1,0,-22,11);hg.addColorStop(0,'#4a7a40');hg.addColorStop(1,'#2a5020');
  fc(c,0,-22,11,hg);
  c.fillStyle='#1a1a1a';c.fillRect(-8,-27,16,6);
  c.fillStyle='rgba(255,200,50,.2)';c.fillRect(-7,-27,14,4);// yellow visor tint
  // Rangefinder
  c.strokeStyle='#888';c.lineWidth=1.5;c.beginPath();c.moveTo(8,-30);c.lineTo(10,-36);c.stroke();fc(c,10,-37,2,'#888');
  // EE-3 blaster
  c.strokeStyle='#555';c.lineWidth=2.5;c.beginPath();c.moveTo(12,4);c.lineTo(14,-14);c.stroke();
  c.fillStyle='#666';c.fillRect(10,-14,6,3);
  // Jetpack suggestion
  c.fillStyle='#374151';c.fillRect(-9,-8,3,18);
  c.restore();
  c.fillStyle='#3a5020';c.fillRect(-6+w*4,20,6,12);c.fillRect(3-w*4,20,6,12);
};

// Emperor Palpatine — robed, lightning, hood
SPR.sw_emperor=(c,t=0,w=0)=>{
  const bob=Math.abs(w)*.5;const pulse=Math.sin(t*2.4)*.1;
  c.save();c.translate(w*.5,-bob);
  // Dark Emperor robes — very wide
  const rg=c.createLinearGradient(-16,-10,16,32);rg.addColorStop(0,'#0a0018');rg.addColorStop(1,'#030010');
  c.fillStyle=rg;c.beginPath();c.moveTo(-16,-10);c.lineTo(16,-10);c.lineTo(22,32);c.lineTo(-22,32);c.closePath();c.fill();
  // Robe sheen
  c.strokeStyle='rgba(80,0,120,.3)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-16,-10);c.lineTo(-22,32);c.stroke();
  c.beginPath();c.moveTo(16,-10);c.lineTo(22,32);c.stroke();
  // Twisted ancient face
  fc(c,0,-22,8,'#c0b0a0');
  // Deep hood
  c.fillStyle='#050015';c.beginPath();c.arc(0,-22,9,Math.PI,0);c.lineTo(9,-22);c.lineTo(-9,-22);c.closePath();c.fill();
  // Yellow Sith eyes — deeply sunken
  c.fillStyle='#fbbf24';c.shadowColor='#fbbf24';c.shadowBlur=10+pulse*20;
  fc(c,-3,-24,2.5,'');fc(c,3,-24,2.5,'');c.shadowBlur=0;
  fc(c,-3,-24,2.5,'#fde68a');fc(c,3,-24,2.5,'#fde68a');
  // Force lightning from hands
  const la=pulse*.5+.5;
  c.strokeStyle=`rgba(180,120,255,${la*.8})`;c.lineWidth=1.5;c.shadowColor='#a855f7';c.shadowBlur=6;
  [[-12,8],[-18,0],[-16,16],[-20,10]].forEach(([lx,ly],i)=>{
    c.beginPath();c.moveTo(-8,4+i*2);c.lineTo(lx,ly);c.stroke();
  });
  [[12,8],[18,0],[16,16],[20,10]].forEach(([lx,ly],i)=>{
    c.beginPath();c.moveTo(8,4+i*2);c.lineTo(lx,ly);c.stroke();
  });
  c.shadowBlur=0;
  // Walking stick / scepter
  c.strokeStyle='#4a3810';c.lineWidth=2;c.beginPath();c.moveTo(-14,30);c.lineTo(-12,-10);c.stroke();
  c.restore();
  // Aura
  c.fillStyle=`rgba(100,0,180,${.04+pulse*.06})`;c.beginPath();c.ellipse(0,6,36,50,0,0,Math.PI*2);c.fill();
  c.fillStyle='#0a0018';c.fillRect(-6+w*3,28,5,6);c.fillRect(1-w*3,28,5,6);
};

// ── SW EDEF entries — add to EDEF after it's defined ──
const _SW_EDEF={
  // Outer Rim / Prequel tier (lv1-2)
  sw_stormtrooper:  {hp:18, dmg:8,  spd:1.6, rng:120,cd:1.8,aggro:180,bones:[2,5],cp:[4,9],   xp:60},
  sw_tusken:        {hp:22, dmg:11, spd:1.4, rng:40, cd:1.6,aggro:160,bones:[3,6],cp:[3,8],   xp:70},
  sw_battle_droid:  {hp:14, dmg:7,  spd:1.8, rng:120,cd:1.5,aggro:180,bones:[2,4],cp:[3,7],   xp:45},
  sw_sandtrooper:   {hp:24, dmg:10, spd:1.4, rng:120,cd:1.9,aggro:180,bones:[3,6],cp:[4,9],   xp:75},
  sw_gungan:        {hp:26, dmg:9,  spd:1.5, rng:40, cd:1.6,aggro:160,bones:[3,5],cp:[4,8],   xp:80},
  // Republic / Prequel tier (lv2-4)
  sw_naboo_guard:   {hp:28, dmg:12, spd:1.5, rng:120,cd:1.8,aggro:180,bones:[4,7],cp:[5,10],  xp:90},
  sw_geonosian:     {hp:20, dmg:13, spd:2.0, rng:40, cd:1.3,aggro:160,bones:[3,6],cp:[4,8],   xp:85, special:'pounce'},
  sw_clone_trooper: {hp:32, dmg:11, spd:1.5, rng:120,cd:1.7,aggro:180,bones:[4,7],cp:[5,10],  xp:95},
  sw_kaminoan:      {hp:25, dmg:16, spd:1.3, rng:160,cd:2.0,aggro:160,bones:[4,8],cp:[5,10],  xp:200,special:'hex'},
  // Rebel / Classic tier (lv5-6)
  sw_rebel_soldier: {hp:35, dmg:14, spd:1.6, rng:120,cd:1.6,aggro:180,bones:[5,9],gp:[1,2],   xp:250},
  sw_wookiee:       {hp:55, dmg:20, spd:1.3, rng:40, cd:2.0,aggro:160,bones:[7,12],gp:[1,2],  xp:500, special:'root'},
  sw_ewok:          {hp:22, dmg:10, spd:2.0, rng:40, cd:1.2,aggro:160,bones:[3,6],cp:[4,8],   xp:120},
  sw_probe_droid:   {hp:30, dmg:18, spd:1.8, rng:160,cd:1.5,aggro:200,bones:[4,8],gp:[1,2],   xp:300, special:'blink'},
  // Empire tier (lv7-9)
  sw_imperial_officer:{hp:38,dmg:15,spd:1.4, rng:120,cd:1.8,aggro:180,bones:[5,9],gp:[1,3],   xp:350},
  sw_snowtrooper:   {hp:42, dmg:16, spd:1.4, rng:120,cd:1.7,aggro:180,bones:[5,9],gp:[1,2],   xp:400},
  sw_imperial_guard:{hp:60, dmg:22, spd:1.2, rng:40, cd:1.3,aggro:160,bones:[8,14],gp:[2,4],  xp:750, special:'deathmark'},
  sw_shadow_trooper:{hp:50, dmg:20, spd:1.8, rng:120,cd:1.4,aggro:180,bones:[6,11],gp:[1,3],  xp:600, special:'blink'},
  sw_ugnaught:      {hp:28, dmg:13, spd:1.5, rng:40, cd:1.4,aggro:160,bones:[4,7],cp:[5,10],  xp:150},
  sw_sith_acolyte:  {hp:45, dmg:22, spd:1.5, rng:40, cd:1.5,aggro:160,bones:[6,10],gp:[1,3],  xp:550, special:'drain'},
  // Mini-boss quality (appear as heavy enemies in pools)
  sw_jango_fett:    {hp:120,dmg:28, spd:1.4, rng:120,cd:1.3,aggro:200,bones:[12,20],gp:[3,6], xp:3000},
  sw_grievous:      {hp:150,dmg:32, spd:1.1, rng:40, cd:1.2,aggro:200,bones:[15,25],gp:[4,8], xp:4000},
  sw_darth_maul:    {hp:160,dmg:35, spd:1.6, rng:40, cd:1.1,aggro:200,bones:[16,28],gp:[5,10],xp:5000},
};
Object.assign(EDEF,_SW_EDEF);

// ── SW Boss sprites (sprite keys mapped from boss keys) ──
SPR.sw_jango_fett=SPR.sw_jango_fett; // already defined above
SPR.sw_grievous_boss=(c,t=0,w=0)=>{ c.save();c.scale(1.1,1.1);SPR.sw_grievous(c,t,w);c.restore(); };
SPR.sw_maul_boss=(c,t=0,w=0)=>{ c.save();c.scale(1.15,1.15);SPR.sw_darth_maul(c,t,w);c.restore(); };
SPR.sw_vader_boss=(c,t=0,w=0)=>{ c.save();c.scale(1.2,1.2);SPR.sw_vader(c,t,w);c.restore(); };
SPR.sw_boba_fett=(c,t=0,w=0)=>{ SPR.sw_boba_fett||(SPR.sw_boba_fett=null);};
(()=>{
  // Boba Fett boss sprite (overwrite placeholder)
  SPR.sw_boba_fett=(c,t=0,w=0)=>{
    const bob=Math.abs(w)*.8;
    c.save();c.translate(0,-bob);
    const ag=c.createLinearGradient(-9,-10,9,22);ag.addColorStop(0,'#4a6a30');ag.addColorStop(1,'#2a4018');
    c.fillStyle=ag;c.fillRect(-9,-10,18,30);c.strokeStyle='#3a5020';c.lineWidth=1;c.strokeRect(-9,-10,18,30);
    c.fillStyle='#6b7280';c.fillRect(-7,-6,14,10);c.strokeStyle='#555';c.lineWidth=.8;c.strokeRect(-7,-6,14,10);
    c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1;
    c.beginPath();c.moveTo(-4,-4);c.lineTo(-1,-1);c.stroke();
    c.beginPath();c.moveTo(3,-2);c.lineTo(6,-4);c.stroke();
    const hg=c.createRadialGradient(-3,-24,1,0,-22,11);hg.addColorStop(0,'#4a7a40');hg.addColorStop(1,'#2a5020');
    fc(c,0,-22,11,hg);
    c.fillStyle='#1a1a1a';c.fillRect(-8,-27,16,6);
    c.fillStyle='rgba(255,200,50,.2)';c.fillRect(-7,-27,14,4);
    c.strokeStyle='#888';c.lineWidth=1.5;c.beginPath();c.moveTo(8,-30);c.lineTo(10,-36);c.stroke();fc(c,10,-37,2,'#888');
    c.strokeStyle='#555';c.lineWidth=2.5;c.beginPath();c.moveTo(12,4);c.lineTo(14,-14);c.stroke();
    c.fillStyle='#666';c.fillRect(10,-14,6,3);
    c.fillStyle='#374151';c.fillRect(-9,-8,3,18);
    c.restore();
    c.fillStyle='#3a5020';c.fillRect(-6+w*4,20,6,12);c.fillRect(3-w*4,20,6,12);
  };
  // Emperor boss sprite (larger)
  SPR.sw_emperor_boss=(c,t=0,w=0)=>{ c.save();c.scale(1.25,1.25);SPR.sw_emperor(c,t,w);c.restore(); };
})();

// Map boss keys to their sprite functions for SW bosses
const _SW_BOSS_VISUAL_MAP={
  sw_sand_daemon:'sw_tusken',        sw_krayt_specter:'sw_tusken',      sw_tusken_warlord:'sw_tusken',
  sw_gungan_shade:'sw_gungan',       sw_viceroy_wraith:'sw_battle_droid',sw_maul_shade:'sw_darth_maul',
  sw_senate_ghost:'sw_imperial_officer',sw_chancellor_shade:'sw_imperial_officer',sw_sith_phantom:'sw_sith_acolyte',
  sw_geonosis_queen:'sw_geonosian',  sw_droid_overlord:'sw_battle_droid',sw_dooku_shade:'sw_sith_acolyte',
  sw_kaminoan_specter:'sw_kaminoan', sw_clone_revenant:'sw_clone_trooper',sw_jango_risen:'sw_jango_fett',
  sw_wookiee_berserker:'sw_wookiee', sw_grievous_shade:'sw_grievous',   sw_kashyyyk_titan:'sw_wookiee',
  sw_sinkhole_daemon:'sw_geonosian', sw_pau_city_horror:'sw_imperial_officer',sw_grievous_risen:'sw_grievous',
  sw_lava_wraith:'sw_sith_acolyte',  sw_fire_daemon:'sw_sith_acolyte',  sw_vader_shadow:'sw_vader',
  sw_alderaan_ghost:'sw_rebel_soldier',sw_senator_shade:'sw_naboo_guard',sw_organa_revenant:'sw_naboo_guard',
  sw_rebel_shade:'sw_rebel_soldier', sw_xwing_wraith:'sw_rebel_soldier',sw_gold_leader:'sw_rebel_soldier',
  sw_ice_revenant:'sw_snowtrooper',  sw_wampa_horror:'sw_snowtrooper',  sw_atat_specter:'sw_imperial_officer',
  sw_bog_daemon:'sw_ewok',           sw_darkside_echo:'sw_sith_acolyte',sw_cave_horror:'sw_sith_acolyte',
  sw_cloud_shade:'sw_imperial_officer',sw_tibanna_wraith:'sw_ugnaught',  sw_boba_risen:'sw_boba_fett',
  sw_ewok_shade:'sw_ewok',           sw_endor_daemon:'sw_ewok',          sw_endor_titan:'sw_wookiee',
  sw_station_horror:'sw_stormtrooper',sw_superlaser_wraith:'sw_imperial_officer',sw_tarkin_shade:'sw_imperial_officer',
  sw_storm_revenant:'sw_stormtrooper',sw_carbon_wraith:'sw_ugnaught',    sw_ugnaught_risen:'sw_ugnaught',
  sw_hutt_shade:'sw_ugnaught',        sw_rancor_specter:'sw_wookiee',    sw_sarlacc_horror:'sw_wookiee',
  sw_destroyer_daemon:'sw_imperial_officer',sw_executor_shade:'sw_imperial_officer',sw_vader_risen:'sw_vader',
  sw_ds2_guardian:'sw_imperial_guard',sw_throne_specter:'sw_imperial_guard',sw_palpatine_risen:'sw_emperor',
  sw_bunker_daemon:'sw_imperial_guard',sw_shield_horror:'sw_imperial_guard',sw_palpatine_shade:'sw_emperor',
};
// Patch SW bosses to map their sprite keys
(()=>{
  for(const [bKey,sprKey] of Object.entries(_SW_BOSS_VISUAL_MAP)){
    if(REGION_BOSSES[bKey]){REGION_BOSSES[bKey]._swBossVisual=sprKey;REGION_BOSSES[bKey]._swBoss=true;}
    if(typeof BOSSES!=='undefined'&&BOSSES[bKey]){BOSSES[bKey]._swBossVisual=sprKey;BOSSES[bKey]._swBoss=true;}
  }
})();

// ── Update SW RAID_CONFIGS to use SW enemy pools ──
(()=>{
  const sw_pools={
    sw_outer_lv1:  ['sw_tusken','sw_battle_droid','sw_sandtrooper','sw_tusken','sw_battle_droid'],
    sw_outer_lv1m: ['sw_tusken','sw_sandtrooper','sw_gungan','sw_battle_droid','sw_sith_acolyte'],
    sw_outer_lv1h: ['sw_sith_acolyte','sw_sandtrooper','sw_gungan','sw_battle_droid','sw_darth_maul'],
    sw_naboo_e:    ['sw_battle_droid','sw_battle_droid','sw_gungan','sw_naboo_guard','sw_tusken'],
    sw_naboo_m:    ['sw_naboo_guard','sw_battle_droid','sw_sith_acolyte','sw_gungan','sw_battle_droid'],
    sw_naboo_h:    ['sw_darth_maul','sw_sith_acolyte','sw_battle_droid','sw_sith_acolyte','sw_battle_droid'],
    sw_core_e:     ['sw_imperial_officer','sw_stormtrooper','sw_battle_droid','sw_imperial_officer','sw_sith_acolyte'],
    sw_core_m:     ['sw_imperial_officer','sw_sith_acolyte','sw_stormtrooper','sw_shadow_trooper','sw_imperial_officer'],
    sw_core_h:     ['sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard','sw_sith_acolyte','sw_shadow_trooper'],
    sw_geo_e:      ['sw_geonosian','sw_battle_droid','sw_geonosian','sw_battle_droid','sw_tusken'],
    sw_geo_m:      ['sw_geonosian','sw_grievous','sw_battle_droid','sw_geonosian','sw_sith_acolyte'],
    sw_geo_h:      ['sw_grievous','sw_sith_acolyte','sw_geonosian','sw_battle_droid','sw_grievous'],
    sw_kamino_e:   ['sw_kaminoan','sw_clone_trooper','sw_battle_droid','sw_kaminoan','sw_clone_trooper'],
    sw_kamino_m:   ['sw_clone_trooper','sw_kaminoan','sw_stormtrooper','sw_battle_droid','sw_clone_trooper'],
    sw_kamino_h:   ['sw_jango_fett','sw_clone_trooper','sw_stormtrooper','sw_kaminoan','sw_clone_trooper'],
    sw_kashyyyk_e: ['sw_wookiee','sw_clone_trooper','sw_battle_droid','sw_wookiee','sw_geonosian'],
    sw_kashyyyk_m: ['sw_wookiee','sw_grievous','sw_clone_trooper','sw_sith_acolyte','sw_wookiee'],
    sw_kashyyyk_h: ['sw_wookiee','sw_grievous','sw_sith_acolyte','sw_clone_trooper','sw_wookiee'],
    sw_utapau_e:   ['sw_clone_trooper','sw_grievous','sw_battle_droid','sw_stormtrooper','sw_clone_trooper'],
    sw_utapau_m:   ['sw_grievous','sw_sith_acolyte','sw_clone_trooper','sw_imperial_officer','sw_grievous'],
    sw_utapau_h:   ['sw_grievous','sw_darth_maul','sw_sith_acolyte','sw_clone_trooper','sw_imperial_guard'],
    sw_mustafar_e: ['sw_sith_acolyte','sw_imperial_officer','sw_battle_droid','sw_shadow_trooper','sw_sith_acolyte'],
    sw_mustafar_m: ['sw_sith_acolyte','sw_shadow_trooper','sw_darth_maul','sw_imperial_guard','sw_sith_acolyte'],
    sw_mustafar_h: ['sw_vader','sw_sith_acolyte','sw_darth_maul','sw_imperial_guard','sw_shadow_trooper'],
    sw_alderaan_e: ['sw_rebel_soldier','sw_naboo_guard','sw_stormtrooper','sw_imperial_officer','sw_rebel_soldier'],
    sw_alderaan_m: ['sw_imperial_guard','sw_stormtrooper','sw_rebel_soldier','sw_shadow_trooper','sw_imperial_officer'],
    sw_alderaan_h: ['sw_imperial_guard','sw_shadow_trooper','sw_imperial_officer','sw_vader','sw_imperial_guard'],
    sw_yavin_e:    ['sw_rebel_soldier','sw_stormtrooper','sw_battle_droid','sw_rebel_soldier','sw_ewok'],
    sw_yavin_m:    ['sw_rebel_soldier','sw_probe_droid','sw_stormtrooper','sw_shadow_trooper','sw_rebel_soldier'],
    sw_yavin_h:    ['sw_rebel_soldier','sw_shadow_trooper','sw_imperial_guard','sw_probe_droid','sw_stormtrooper'],
    sw_hoth_e:     ['sw_snowtrooper','sw_imperial_officer','sw_probe_droid','sw_stormtrooper','sw_snowtrooper'],
    sw_hoth_m:     ['sw_snowtrooper','sw_shadow_trooper','sw_imperial_officer','sw_probe_droid','sw_snowtrooper'],
    sw_hoth_h:     ['sw_snowtrooper','sw_vader','sw_imperial_guard','sw_shadow_trooper','sw_snowtrooper'],
    sw_dagobah_e:  ['sw_ewok','sw_rebel_soldier','sw_sith_acolyte','sw_probe_droid','sw_ewok'],
    sw_dagobah_m:  ['sw_sith_acolyte','sw_darth_maul','sw_probe_droid','sw_imperial_guard','sw_sith_acolyte'],
    sw_dagobah_h:  ['sw_sith_acolyte','sw_vader','sw_darth_maul','sw_imperial_guard','sw_shadow_trooper'],
    sw_bespin_e:   ['sw_imperial_officer','sw_stormtrooper','sw_ugnaught','sw_shadow_trooper','sw_imperial_officer'],
    sw_bespin_m:   ['sw_ugnaught','sw_imperial_guard','sw_shadow_trooper','sw_imperial_officer','sw_boba_fett'],
    sw_bespin_h:   ['sw_boba_fett','sw_imperial_guard','sw_vader','sw_shadow_trooper','sw_imperial_guard'],
    sw_endor_e:    ['sw_ewok','sw_stormtrooper','sw_imperial_officer','sw_ewok','sw_rebel_soldier'],
    sw_endor_m:    ['sw_ewok','sw_imperial_guard','sw_stormtrooper','sw_shadow_trooper','sw_wookiee'],
    sw_endor_h:    ['sw_imperial_guard','sw_vader','sw_shadow_trooper','sw_wookiee','sw_imperial_guard'],
    sw_ds1_e:      ['sw_stormtrooper','sw_imperial_officer','sw_shadow_trooper','sw_imperial_guard','sw_stormtrooper'],
    sw_ds1_m:      ['sw_imperial_guard','sw_shadow_trooper','sw_imperial_officer','sw_sith_acolyte','sw_imperial_guard'],
    sw_ds1_h:      ['sw_imperial_guard','sw_vader','sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard'],
    sw_cc_e:       ['sw_ugnaught','sw_imperial_officer','sw_stormtrooper','sw_shadow_trooper','sw_ugnaught'],
    sw_cc_m:       ['sw_ugnaught','sw_boba_fett','sw_imperial_guard','sw_shadow_trooper','sw_imperial_officer'],
    sw_cc_h:       ['sw_boba_fett','sw_imperial_guard','sw_vader','sw_shadow_trooper','sw_imperial_guard'],
    sw_jabba_e:    ['sw_ugnaught','sw_tusken','sw_battle_droid','sw_imperial_officer','sw_ugnaught'],
    sw_jabba_m:    ['sw_ugnaught','sw_wookiee','sw_boba_fett','sw_imperial_guard','sw_sith_acolyte'],
    sw_jabba_h:    ['sw_boba_fett','sw_wookiee','sw_imperial_guard','sw_shadow_trooper','sw_vader'],
    sw_exec_e:     ['sw_imperial_officer','sw_imperial_guard','sw_shadow_trooper','sw_vader','sw_stormtrooper'],
    sw_exec_m:     ['sw_imperial_guard','sw_vader','sw_shadow_trooper','sw_sith_acolyte','sw_imperial_guard'],
    sw_exec_h:     ['sw_vader','sw_imperial_guard','sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard'],
    sw_ds2_e:      ['sw_imperial_guard','sw_shadow_trooper','sw_vader','sw_sith_acolyte','sw_imperial_guard'],
    sw_ds2_m:      ['sw_imperial_guard','sw_vader','sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard'],
    sw_ds2_h:      ['sw_vader','sw_imperial_guard','sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard'],
    sw_bunker_e:   ['sw_stormtrooper','sw_imperial_officer','sw_snowtrooper','sw_imperial_guard','sw_stormtrooper'],
    sw_bunker_m:   ['sw_imperial_guard','sw_shadow_trooper','sw_snowtrooper','sw_sith_acolyte','sw_imperial_guard'],
    sw_bunker_h:   ['sw_imperial_guard','sw_vader','sw_sith_acolyte','sw_shadow_trooper','sw_imperial_guard'],
  };
  const poolMap={
    sw_tatooine_easy:sw_pools.sw_outer_lv1,   sw_tatooine_medium:sw_pools.sw_outer_lv1m, sw_tatooine_hard:sw_pools.sw_outer_lv1h,
    sw_naboo_easy:sw_pools.sw_naboo_e,        sw_naboo_medium:sw_pools.sw_naboo_m,       sw_naboo_hard:sw_pools.sw_naboo_h,
    sw_coruscant_easy:sw_pools.sw_core_e,     sw_coruscant_medium:sw_pools.sw_core_m,    sw_coruscant_hard:sw_pools.sw_core_h,
    sw_geonosis_easy:sw_pools.sw_geo_e,       sw_geonosis_medium:sw_pools.sw_geo_m,      sw_geonosis_hard:sw_pools.sw_geo_h,
    sw_kamino_easy:sw_pools.sw_kamino_e,      sw_kamino_medium:sw_pools.sw_kamino_m,     sw_kamino_hard:sw_pools.sw_kamino_h,
    sw_kashyyyk_easy:sw_pools.sw_kashyyyk_e,  sw_kashyyyk_medium:sw_pools.sw_kashyyyk_m, sw_kashyyyk_hard:sw_pools.sw_kashyyyk_h,
    sw_utapau_easy:sw_pools.sw_utapau_e,      sw_utapau_medium:sw_pools.sw_utapau_m,     sw_utapau_hard:sw_pools.sw_utapau_h,
    sw_mustafar_easy:sw_pools.sw_mustafar_e,  sw_mustafar_medium:sw_pools.sw_mustafar_m, sw_mustafar_hard:sw_pools.sw_mustafar_h,
    sw_alderaan_easy:sw_pools.sw_alderaan_e,  sw_alderaan_medium:sw_pools.sw_alderaan_m, sw_alderaan_hard:sw_pools.sw_alderaan_h,
    sw_yavin_iv_easy:sw_pools.sw_yavin_e,     sw_yavin_iv_medium:sw_pools.sw_yavin_m,    sw_yavin_iv_hard:sw_pools.sw_yavin_h,
    sw_hoth_easy:sw_pools.sw_hoth_e,          sw_hoth_medium:sw_pools.sw_hoth_m,         sw_hoth_hard:sw_pools.sw_hoth_h,
    sw_dagobah_easy:sw_pools.sw_dagobah_e,    sw_dagobah_medium:sw_pools.sw_dagobah_m,   sw_dagobah_hard:sw_pools.sw_dagobah_h,
    sw_bespin_easy:sw_pools.sw_bespin_e,      sw_bespin_medium:sw_pools.sw_bespin_m,     sw_bespin_hard:sw_pools.sw_bespin_h,
    sw_endor_easy:sw_pools.sw_endor_e,        sw_endor_medium:sw_pools.sw_endor_m,       sw_endor_hard:sw_pools.sw_endor_h,
    sw_death_star_i_easy:sw_pools.sw_ds1_e,   sw_death_star_i_medium:sw_pools.sw_ds1_m,  sw_death_star_i_hard:sw_pools.sw_ds1_h,
    sw_cloud_city_easy:sw_pools.sw_cc_e,      sw_cloud_city_medium:sw_pools.sw_cc_m,     sw_cloud_city_hard:sw_pools.sw_cc_h,
    sw_jabba_palace_easy:sw_pools.sw_jabba_e, sw_jabba_palace_medium:sw_pools.sw_jabba_m,sw_jabba_palace_hard:sw_pools.sw_jabba_h,
    sw_executor_easy:sw_pools.sw_exec_e,      sw_executor_medium:sw_pools.sw_exec_m,     sw_executor_hard:sw_pools.sw_exec_h,
    sw_death_star_ii_easy:sw_pools.sw_ds2_e,  sw_death_star_ii_medium:sw_pools.sw_ds2_m, sw_death_star_ii_hard:sw_pools.sw_ds2_h,
    sw_endor_bunker_easy:sw_pools.sw_bunker_e,sw_endor_bunker_medium:sw_pools.sw_bunker_m,sw_endor_bunker_hard:sw_pools.sw_bunker_h,
  };
  for(const[k,pool]of Object.entries(poolMap)){if(RAID_CONFIGS[k])RAID_CONFIGS[k].enemyPool=pool;}
})();

function swFireRaid(region,diff){
  if(!swRegionAccessible(region)){showToast('🔒 Reach Lv.'+region.lv+' to raid here.');return;}
  const ck='sw_'+region.id;
  const conq=GS.conquered[ck]||{};
  if(diff==='medium'&&!conq.easy){showToast('🔒 Clear Easy first!');return;}
  if(diff==='hard'&&(!conq.easy||!conq.medium)){showToast('🔒 Clear Easy & Medium first!');return;}
  const rdKey=(SW_REGION_RAID_MAP[region.id]||[])[['easy','medium','hard'].indexOf(diff)];
  const cfg=RAID_CONFIGS[rdKey];if(!rdKey||!cfg){showToast('Raid not found!');return;}
  swCloseAllPanels();closeStarWarsMap();
  activeRaid=rdKey;
  _pendingRegionRaid={region:{...region,id:ck},raidDef:{key:rdKey,diff,diffStyle:diff,floors:cfg.floors||3,scale:1.0,minLv:region.lv,name:cfg.name,ico:cfg.ico,bossKey:cfg.bossKey}};
  TransitionManager.play('raidFade',700,{hold:true,
    onMid:()=>{
      showScreen('raid');
      setTimeout(()=>{initRaid(rdKey,1,{regionId:ck,diff});},50);
    }
  });
}
