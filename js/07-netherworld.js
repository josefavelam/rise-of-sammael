// ═══════════════════════════════════════════════════════════
//  NETHERWORLD MAP  —  Samma'el's Home Dimension (Original IP)
// ═══════════════════════════════════════════════════════════

// ── 20 regions across 5 biomes ──
var NW_REGIONS=[
  // Ashen Wastes — starting zone (lv 1-3)
  {id:'nw_charfields',     name:'The Charfields',        lv:1, x:.22,y:.82, terrain:'wasteland', color:'#f97316', faction:'nw_ashen'},
  {id:'nw_emberpits',      name:'Ember Pits',            lv:1, x:.14,y:.68, terrain:'wasteland', color:'#fb923c', faction:'nw_ashen'},
  {id:'nw_dusthaven',      name:'Dusthaven',             lv:2, x:.28,y:.70, terrain:'desert',    color:'#ea580c', faction:'nw_ashen'},
  {id:'nw_smoldervale',    name:'Smoldervale',           lv:2, x:.10,y:.55, terrain:'wasteland', color:'#f59e0b', faction:'nw_ashen'},
  // Bone Gardens (lv 3-5)
  {id:'nw_ossuary',        name:'The Ossuary',           lv:3, x:.35,y:.58, terrain:'tundra',    color:'#a3a3a3', faction:'nw_bone'},
  {id:'nw_marrowfen',      name:'Marrowfen',             lv:3, x:.20,y:.45, terrain:'swamp',     color:'#22c55e', faction:'nw_bone'},
  {id:'nw_skullspire',     name:'Skull Spire',           lv:4, x:.42,y:.48, terrain:'mountain',  color:'#c084fc', faction:'nw_bone'},
  {id:'nw_gravebloom',     name:'Gravebloom',            lv:4, x:.30,y:.40, terrain:'forest',    color:'#e879f9', faction:'nw_bone'},
  // Void Rifts (lv 5-7)
  {id:'nw_nullchasm',      name:'Null Chasm',            lv:5, x:.55,y:.60, terrain:'sanctum',   color:'#7c3aed', faction:'nw_void'},
  {id:'nw_echovoid',       name:'Echo Void',             lv:5, x:.48,y:.72, terrain:'sanctum',   color:'#8b5cf6', faction:'nw_void'},
  {id:'nw_shatterdrift',   name:'Shatterdrift',          lv:6, x:.62,y:.50, terrain:'sanctum',   color:'#a78bfa', faction:'nw_void'},
  {id:'nw_abyssgate',      name:'Abyss Gate',            lv:6, x:.58,y:.38, terrain:'sanctum',   color:'#6d28d9', faction:'nw_void'},
  // Cursed Seas (lv 6-8)
  {id:'nw_drownreach',     name:'Drownreach',            lv:6, x:.72,y:.75, terrain:'swamp',     color:'#06b6d4', faction:'nw_cursed'},
  {id:'nw_ghosttide',      name:'Ghosttide Shoals',      lv:7, x:.80,y:.62, terrain:'swamp',     color:'#22d3ee', faction:'nw_cursed'},
  {id:'nw_leviathandeep',  name:'Leviathan Deep',        lv:7, x:.68,y:.55, terrain:'swamp',     color:'#0891b2', faction:'nw_cursed'},
  {id:'nw_sirenshore',     name:'Siren Shore',           lv:7, x:.85,y:.48, terrain:'swamp',     color:'#67e8f9', faction:'nw_cursed'},
  // The Spire — endgame (lv 8-9)
  {id:'nw_veilgate',       name:'Veil Gate',             lv:8, x:.50,y:.28, terrain:'sanctum',   color:'#a855f7', faction:'nw_spire'},
  {id:'nw_demonhold',      name:'Demon Hold',            lv:8, x:.60,y:.18, terrain:'sanctum',   color:'#dc2626', faction:'nw_spire'},
  {id:'nw_throneascent',   name:'Throne Ascent',         lv:9, x:.45,y:.15, terrain:'sanctum',   color:'#f43f5e', faction:'nw_spire'},
  {id:'nw_sammael_sanctum',name:"Samma'el's Sanctum",    lv:9, x:.52,y:.06, terrain:'sanctum',   color:'#9333ea', faction:'nw_spire'},
];

const NW_FACTIONS={
  nw_ashen: {name:'Ashen Wastes',  color:'#f97316', members:['nw_charfields','nw_emberpits','nw_dusthaven','nw_smoldervale']},
  nw_bone:  {name:'Bone Gardens',  color:'#a3a3a3', members:['nw_ossuary','nw_marrowfen','nw_skullspire','nw_gravebloom']},
  nw_void:  {name:'Void Rifts',    color:'#7c3aed', members:['nw_nullchasm','nw_echovoid','nw_shatterdrift','nw_abyssgate']},
  nw_cursed:{name:'Cursed Seas',   color:'#06b6d4', members:['nw_drownreach','nw_ghosttide','nw_leviathandeep','nw_sirenshore']},
  nw_spire: {name:'The Spire',     color:'#a855f7', members:['nw_veilgate','nw_demonhold','nw_throneascent','nw_sammael_sanctum']},
};
const NW_FACTION_ORDER=['nw_ashen','nw_bone','nw_void','nw_cursed','nw_spire'];

function nwFactionCleared(fId){
  const f=NW_FACTIONS[fId];if(!f)return true;
  return f.members.every(id=>{const c=GS.conquered['nw_'+id]||{};return c.easy&&c.medium&&c.hard;});
}
function nwFactionOf(regionId){return Object.keys(NW_FACTIONS).find(f=>NW_FACTIONS[f].members.includes(regionId))||null;}
function nwRegionAccessible(r){
  if(r.lv>GS.necroLv)return false;
  const fi=NW_FACTION_ORDER.indexOf(nwFactionOf(r.id));
  for(let i=0;i<fi;i++)if(!nwFactionCleared(NW_FACTION_ORDER[i]))return false;
  return true;
}

// ── Netherworld unlock: requires 50% of any existing map on Hard ──
function nwMapUnlocked(){
  // ME
  const meHard=WORLD_REGIONS.filter(r=>(GS.conquered[r.id]||{}).hard).length;
  if(meHard>=Math.ceil(WORLD_REGIONS.length*.5))return true;
  // Tau'ri
  const tauHard=TAU_REGIONS.filter(r=>(GS.conquered[r.id]||{}).hard).length;
  if(tauHard>=Math.ceil(TAU_REGIONS.length*.5))return true;
  // Skyriver
  const swHard=SW_REGIONS.filter(r=>(GS.conquered['sw_'+r.id]||{}).hard).length;
  if(swHard>=Math.ceil(SW_REGIONS.length*.5))return true;
  return false;
}

// ── 20 unique bosses ──
const NW_BOSSES={
  // Ashen Wastes bosses (12)
  nw_cinder_wretch:       {name:'Cinder Wretch',                hp:110,maxHP:110,dmg:14,spd:0.78,rng:160,cd:2.3,bones:18,gp:[8,18],pp:[0,0],xp:5500, phase2HP:55, fortHP:28,color:'#f97316',size:1.15},
  nw_ash_herald:          {name:'Ash Herald',                   hp:145,maxHP:145,dmg:17,spd:0.70,rng:160,cd:2.1,bones:24,gp:[14,30],pp:[0,0],xp:8500, phase2HP:72, fortHP:36,color:'#f97316',size:1.3},
  nw_pyre_lord:           {name:'Pyre Lord',                    hp:200,maxHP:200,dmg:22,spd:0.62,rng:160,cd:1.9,bones:34,gp:[24,48],pp:[0,1],xp:13000,phase2HP:100,fortHP:50,color:'#f97316',size:1.5},
  nw_sulfur_crawler:      {name:'Sulfur Crawler',               hp:115,maxHP:115,dmg:14,spd:0.78,rng:160,cd:2.3,bones:18,gp:[8,18],pp:[0,0],xp:5800, phase2HP:58, fortHP:29,color:'#fb923c',size:1.2},
  nw_magma_shade:         {name:'Magma Shade',                  hp:150,maxHP:150,dmg:18,spd:0.68,rng:160,cd:2.0,bones:26,gp:[16,34],pp:[0,0],xp:9000, phase2HP:75, fortHP:38,color:'#fb923c',size:1.35},
  nw_furnace_king:        {name:'Furnace King',                 hp:210,maxHP:210,dmg:23,spd:0.60,rng:160,cd:1.85,bones:36,gp:[26,52],pp:[0,1],xp:14000,phase2HP:105,fortHP:52,color:'#fb923c',size:1.55},
  nw_dust_warden:         {name:'Dust Warden',                  hp:130,maxHP:130,dmg:16,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:6500, phase2HP:65, fortHP:33,color:'#ea580c',size:1.2},
  nw_scorched_sentinel:   {name:'Scorched Sentinel',            hp:170,maxHP:170,dmg:19,spd:0.66,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:10500,phase2HP:85, fortHP:42,color:'#ea580c',size:1.4},
  nw_ember_tyrant:        {name:'Ember Tyrant',                 hp:235,maxHP:235,dmg:25,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,2],xp:15500,phase2HP:118,fortHP:59,color:'#ea580c',size:1.6},
  nw_flicker_ghast:       {name:'Flicker Ghast',                hp:130,maxHP:130,dmg:16,spd:0.75,rng:160,cd:2.2,bones:20,gp:[10,22],pp:[0,0],xp:6500, phase2HP:65, fortHP:33,color:'#f59e0b',size:1.2},
  nw_cinderbark_ancient:  {name:'Cinderbark Ancient',           hp:175,maxHP:175,dmg:20,spd:0.65,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,1],xp:10500,phase2HP:88, fortHP:44,color:'#f59e0b',size:1.5},
  nw_infernal_judge:      {name:'Infernal Judge',               hp:240,maxHP:240,dmg:26,spd:0.56,rng:160,cd:1.8,bones:40,gp:[30,60],pp:[0,2],xp:16000,phase2HP:120,fortHP:60,color:'#f59e0b',size:1.55},
  // Bone Gardens bosses (12)
  nw_bonedust_crawler:    {name:'Bonedust Crawler',             hp:140,maxHP:140,dmg:17,spd:0.74,rng:160,cd:2.2,bones:22,gp:[12,26],pp:[0,0],xp:7500, phase2HP:70, fortHP:35,color:'#a3a3a3',size:1.2},
  nw_bone_bishop:         {name:'Bone Bishop',                  hp:185,maxHP:185,dmg:21,spd:0.64,rng:160,cd:2.0,bones:30,gp:[20,42],pp:[0,1],xp:11500,phase2HP:92, fortHP:46,color:'#a3a3a3',size:1.4},
  nw_reliquary_guardian:  {name:'Reliquary Guardian',           hp:260,maxHP:260,dmg:28,spd:0.55,rng:160,cd:1.75,bones:42,gp:[32,64],pp:[0,2],xp:17000,phase2HP:130,fortHP:65,color:'#a3a3a3',size:1.6},
  nw_fen_whisperer:       {name:'Fen Whisperer',                hp:140,maxHP:140,dmg:17,spd:0.74,rng:160,cd:2.2,bones:22,gp:[12,26],pp:[0,0],xp:7500, phase2HP:70, fortHP:35,color:'#22c55e',size:1.25},
  nw_rotbloom_queen:      {name:'Rotbloom Queen',               hp:190,maxHP:190,dmg:21,spd:0.64,rng:160,cd:2.0,bones:30,gp:[20,42],pp:[0,1],xp:11500,phase2HP:95, fortHP:48,color:'#22c55e',size:1.45},
  nw_rot_sovereign:       {name:'Rot Sovereign',                hp:265,maxHP:265,dmg:28,spd:0.55,rng:160,cd:1.75,bones:42,gp:[32,64],pp:[0,2],xp:17000,phase2HP:132,fortHP:66,color:'#22c55e',size:1.6},
  nw_jawbone_sentinel:    {name:'Jawbone Sentinel',             hp:155,maxHP:155,dmg:18,spd:0.72,rng:160,cd:2.1,bones:24,gp:[14,30],pp:[0,0],xp:8500, phase2HP:78, fortHP:39,color:'#c084fc',size:1.3},
  nw_cranial_warden:      {name:'Cranial Warden',               hp:210,maxHP:210,dmg:23,spd:0.62,rng:160,cd:1.9,bones:32,gp:[22,46],pp:[0,1],xp:12500,phase2HP:105,fortHP:52,color:'#c084fc',size:1.45},
  nw_skull_emperor:       {name:'Skull Emperor',                hp:290,maxHP:290,dmg:30,spd:0.52,rng:160,cd:1.7,bones:46,gp:[36,72],pp:[0,2],xp:18500,phase2HP:145,fortHP:72,color:'#c084fc',size:1.65},
  nw_petal_revenant:      {name:'Petal Revenant',               hp:155,maxHP:155,dmg:18,spd:0.72,rng:160,cd:2.1,bones:24,gp:[14,30],pp:[0,0],xp:8500, phase2HP:78, fortHP:39,color:'#e879f9',size:1.25},
  nw_nectar_lich:         {name:'Nectar Lich',                  hp:210,maxHP:210,dmg:23,spd:0.62,rng:160,cd:1.9,bones:32,gp:[22,46],pp:[0,1],xp:12500,phase2HP:105,fortHP:52,color:'#e879f9',size:1.45},
  nw_garden_keeper:       {name:'Garden Keeper',                hp:290,maxHP:290,dmg:30,spd:0.52,rng:160,cd:1.7,bones:46,gp:[36,72],pp:[0,2],xp:18500,phase2HP:145,fortHP:72,color:'#e879f9',size:1.65},
  // Void Rifts bosses (12)
  nw_fissure_dweller:     {name:'Fissure Dweller',              hp:170,maxHP:170,dmg:20,spd:0.70,rng:160,cd:2.1,bones:26,gp:[16,34],pp:[0,0],xp:9500, phase2HP:85, fortHP:42,color:'#7c3aed',size:1.3},
  nw_entropy_weaver:      {name:'Entropy Weaver',               hp:230,maxHP:230,dmg:25,spd:0.60,rng:160,cd:1.85,bones:34,gp:[24,50],pp:[0,1],xp:13500,phase2HP:115,fortHP:58,color:'#7c3aed',size:1.45},
  nw_void_nihilist:       {name:'Void Nihilist',                hp:320,maxHP:320,dmg:33,spd:0.50,rng:160,cd:1.65,bones:50,gp:[40,80],pp:[0,2],xp:20000,phase2HP:160,fortHP:80,color:'#7c3aed',size:1.7},
  nw_echo_phantom:        {name:'Echo Phantom',                 hp:170,maxHP:170,dmg:20,spd:0.70,rng:160,cd:2.1,bones:26,gp:[16,34],pp:[0,0],xp:9500, phase2HP:85, fortHP:42,color:'#8b5cf6',size:1.3},
  nw_lost_voice:          {name:'Lost Voice',                   hp:230,maxHP:230,dmg:25,spd:0.60,rng:160,cd:1.85,bones:34,gp:[24,50],pp:[0,1],xp:13500,phase2HP:115,fortHP:58,color:'#8b5cf6',size:1.45},
  nw_silence_lord:        {name:'Silence Lord',                 hp:320,maxHP:320,dmg:33,spd:0.50,rng:160,cd:1.65,bones:50,gp:[40,80],pp:[0,2],xp:20000,phase2HP:160,fortHP:80,color:'#8b5cf6',size:1.7},
  nw_fracture_walker:     {name:'Fracture Walker',              hp:185,maxHP:185,dmg:21,spd:0.68,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,0],xp:10500,phase2HP:92, fortHP:46,color:'#a78bfa',size:1.35},
  nw_seam_ripper:         {name:'Seam Ripper',                  hp:250,maxHP:250,dmg:27,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,1],xp:14500,phase2HP:125,fortHP:62,color:'#a78bfa',size:1.5},
  nw_unraveler:           {name:'The Unraveler',                hp:350,maxHP:350,dmg:35,spd:0.48,rng:160,cd:1.6,bones:54,gp:[44,88],pp:[0,3],xp:22000,phase2HP:175,fortHP:88,color:'#a78bfa',size:1.75},
  nw_threshold_keeper:    {name:'Threshold Keeper',             hp:185,maxHP:185,dmg:21,spd:0.68,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,0],xp:10500,phase2HP:92, fortHP:46,color:'#6d28d9',size:1.35},
  nw_causeway_horror:     {name:'Causeway Horror',              hp:250,maxHP:250,dmg:27,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,1],xp:14500,phase2HP:125,fortHP:62,color:'#6d28d9',size:1.5},
  nw_abyss_maw:           {name:'Abyss Maw',                   hp:350,maxHP:350,dmg:35,spd:0.48,rng:160,cd:1.6,bones:54,gp:[44,88],pp:[0,3],xp:22000,phase2HP:175,fortHP:88,color:'#6d28d9',size:1.75},
  // Cursed Seas bosses (12)
  nw_dock_wraith:         {name:'Dock Wraith',                  hp:185,maxHP:185,dmg:21,spd:0.68,rng:160,cd:2.0,bones:28,gp:[18,38],pp:[0,0],xp:10500,phase2HP:92, fortHP:46,color:'#06b6d4',size:1.3},
  nw_gallows_captain:     {name:'Gallows Captain',              hp:250,maxHP:250,dmg:27,spd:0.58,rng:160,cd:1.8,bones:38,gp:[28,58],pp:[0,1],xp:14500,phase2HP:125,fortHP:62,color:'#06b6d4',size:1.5},
  nw_anchor_titan:        {name:'Anchor Titan',                 hp:350,maxHP:350,dmg:35,spd:0.48,rng:160,cd:1.6,bones:54,gp:[44,88],pp:[0,3],xp:22000,phase2HP:175,fortHP:88,color:'#06b6d4',size:1.7},
  nw_phantom_fisher:      {name:'Phantom Fisher',               hp:200,maxHP:200,dmg:22,spd:0.67,rng:160,cd:2.0,bones:30,gp:[20,42],pp:[0,0],xp:11000,phase2HP:100,fortHP:50,color:'#22d3ee',size:1.3},
  nw_wailing_leviathan:   {name:'Wailing Leviathan',            hp:270,maxHP:270,dmg:29,spd:0.56,rng:160,cd:1.75,bones:40,gp:[30,62],pp:[0,2],xp:15500,phase2HP:135,fortHP:68,color:'#22d3ee',size:1.6},
  nw_maelstrom_king:      {name:'Maelstrom King',               hp:380,maxHP:380,dmg:37,spd:0.46,rng:160,cd:1.55,bones:58,gp:[48,96],pp:[0,3],xp:24000,phase2HP:190,fortHP:95,color:'#22d3ee',size:1.8},
  nw_coral_horror:        {name:'Coral Horror',                 hp:210,maxHP:210,dmg:23,spd:0.66,rng:160,cd:1.95,bones:30,gp:[20,42],pp:[0,0],xp:11500,phase2HP:105,fortHP:52,color:'#0891b2',size:1.4},
  nw_kraken_shade:        {name:'Kraken Shade',                 hp:285,maxHP:285,dmg:30,spd:0.54,rng:160,cd:1.7,bones:44,gp:[34,68],pp:[0,2],xp:16500,phase2HP:142,fortHP:71,color:'#0891b2',size:1.65},
  nw_tide_sovereign:      {name:'Tide Sovereign',               hp:400,maxHP:400,dmg:39,spd:0.44,rng:160,cd:1.5,bones:62,gp:[52,104],pp:[0,3],xp:26000,phase2HP:200,fortHP:100,color:'#0891b2',size:1.85},
  nw_siren_matriarch:     {name:'Siren Matriarch',              hp:210,maxHP:210,dmg:23,spd:0.66,rng:160,cd:1.95,bones:30,gp:[20,42],pp:[0,0],xp:11500,phase2HP:105,fortHP:52,color:'#67e8f9',size:1.35},
  nw_lament_choir:        {name:'Lament Choir',                 hp:285,maxHP:285,dmg:30,spd:0.54,rng:160,cd:1.7,bones:44,gp:[34,68],pp:[0,2],xp:16500,phase2HP:142,fortHP:71,color:'#67e8f9',size:1.55},
  nw_tempest_queen:       {name:'Tempest Queen',                hp:400,maxHP:400,dmg:39,spd:0.44,rng:160,cd:1.5,bones:62,gp:[52,104],pp:[0,3],xp:26000,phase2HP:200,fortHP:100,color:'#67e8f9',size:1.85},
  // The Spire bosses (8)
  nw_veil_sentinel:       {name:'Veil Sentinel',                hp:240,maxHP:240,dmg:26,spd:0.62,rng:160,cd:1.85,bones:36,gp:[26,54],pp:[0,1],xp:14000,phase2HP:120,fortHP:60,color:'#a855f7',size:1.45},
  nw_veil_warden:         {name:'Veil Warden',                  hp:330,maxHP:330,dmg:34,spd:0.50,rng:160,cd:1.65,bones:52,gp:[42,84],pp:[0,2],xp:20000,phase2HP:165,fortHP:82,color:'#a855f7',size:1.6},
  nw_beyond_keeper:       {name:'Beyond Keeper',                hp:440,maxHP:440,dmg:42,spd:0.42,rng:160,cd:1.45,bones:66,gp:[56,112],pp:[0,4],xp:28000,phase2HP:220,fortHP:110,color:'#a855f7',size:1.85},
  nw_bastion_demon:       {name:'Bastion Demon',                hp:260,maxHP:260,dmg:28,spd:0.60,rng:160,cd:1.8,bones:40,gp:[30,62],pp:[0,1],xp:15500,phase2HP:130,fortHP:65,color:'#dc2626',size:1.5},
  nw_war_general:         {name:'War General',                  hp:360,maxHP:360,dmg:36,spd:0.48,rng:160,cd:1.6,bones:56,gp:[46,92],pp:[0,3],xp:22000,phase2HP:180,fortHP:90,color:'#dc2626',size:1.65},
  nw_iron_overlord:       {name:'Iron Overlord',                hp:480,maxHP:480,dmg:45,spd:0.40,rng:160,cd:1.4,bones:72,gp:[60,120],pp:[0,4],xp:30000,phase2HP:240,fortHP:120,color:'#dc2626',size:1.9},
  nw_agony_warden:        {name:'Agony Warden',                 hp:280,maxHP:280,dmg:30,spd:0.58,rng:160,cd:1.75,bones:44,gp:[34,68],pp:[0,2],xp:17000,phase2HP:140,fortHP:70,color:'#f43f5e',size:1.55},
  nw_torment_artist:      {name:'Torment Artist',               hp:390,maxHP:390,dmg:38,spd:0.46,rng:160,cd:1.55,bones:60,gp:[50,100],pp:[0,3],xp:24000,phase2HP:195,fortHP:98,color:'#f43f5e',size:1.7},
  nw_despair_incarnate:   {name:'Despair Incarnate',            hp:520,maxHP:520,dmg:48,spd:0.38,rng:160,cd:1.35,bones:78,gp:[66,132],pp:[1,4],xp:32000,phase2HP:260,fortHP:130,color:'#f43f5e',size:1.95},
  nw_shadow_herald:       {name:'Shadow Herald',                hp:310,maxHP:310,dmg:32,spd:0.55,rng:160,cd:1.7,bones:48,gp:[38,76],pp:[0,2],xp:19000,phase2HP:155,fortHP:78,color:'#9333ea',size:1.55},
  nw_dark_trial:          {name:'Dark Trial',                   hp:430,maxHP:430,dmg:41,spd:0.44,rng:160,cd:1.5,bones:64,gp:[54,108],pp:[1,3],xp:26000,phase2HP:215,fortHP:108,color:'#9333ea',size:1.75},
  nw_sammael_avatar:      {name:"Avatar of Samma'el",           hp:600,maxHP:600,dmg:55,spd:0.35,rng:180,cd:1.25,bones:100,gp:[80,160],pp:[2,6],xp:40000,phase2HP:300,fortHP:150,color:'#9333ea',size:2.2},
};

// ── Region Raid Map ──
var NW_REGION_RAID_MAP={
  'nw_charfields':      ['nw_charfields_easy','nw_charfields_medium','nw_charfields_hard'],
  'nw_emberpits':       ['nw_emberpits_easy','nw_emberpits_medium','nw_emberpits_hard'],
  'nw_dusthaven':       ['nw_dusthaven_easy','nw_dusthaven_medium','nw_dusthaven_hard'],
  'nw_smoldervale':     ['nw_smoldervale_easy','nw_smoldervale_medium','nw_smoldervale_hard'],
  'nw_ossuary':         ['nw_ossuary_easy','nw_ossuary_medium','nw_ossuary_hard'],
  'nw_marrowfen':       ['nw_marrowfen_easy','nw_marrowfen_medium','nw_marrowfen_hard'],
  'nw_skullspire':      ['nw_skullspire_easy','nw_skullspire_medium','nw_skullspire_hard'],
  'nw_gravebloom':      ['nw_gravebloom_easy','nw_gravebloom_medium','nw_gravebloom_hard'],
  'nw_nullchasm':       ['nw_nullchasm_easy','nw_nullchasm_medium','nw_nullchasm_hard'],
  'nw_echovoid':        ['nw_echovoid_easy','nw_echovoid_medium','nw_echovoid_hard'],
  'nw_shatterdrift':    ['nw_shatterdrift_easy','nw_shatterdrift_medium','nw_shatterdrift_hard'],
  'nw_abyssgate':       ['nw_abyssgate_easy','nw_abyssgate_medium','nw_abyssgate_hard'],
  'nw_drownreach':      ['nw_drownreach_easy','nw_drownreach_medium','nw_drownreach_hard'],
  'nw_ghosttide':       ['nw_ghosttide_easy','nw_ghosttide_medium','nw_ghosttide_hard'],
  'nw_leviathandeep':   ['nw_leviathandeep_easy','nw_leviathandeep_medium','nw_leviathandeep_hard'],
  'nw_sirenshore':      ['nw_sirenshore_easy','nw_sirenshore_medium','nw_sirenshore_hard'],
  'nw_veilgate':        ['nw_veilgate_easy','nw_veilgate_medium','nw_veilgate_hard'],
  'nw_demonhold':       ['nw_demonhold_easy','nw_demonhold_medium','nw_demonhold_hard'],
  'nw_throneascent':    ['nw_throneascent_easy','nw_throneascent_medium','nw_throneascent_hard'],
  'nw_sammael_sanctum': ['nw_sammael_sanctum_easy','nw_sammael_sanctum_medium','nw_sammael_sanctum_hard'],
};

// ── Country descriptions ──
const NW_COUNTRY_DESCS={
  nw_charfields:      "Scorched plains where the Netherworld's edge burns away reality itself. The charred ground shifts like a living thing, and the air tastes of ash and regret.",
  nw_emberpits:       "Bottomless pits of molten sulfur belch flame into a perpetual twilight. Only the desperate and the damned make their homes in the heat-cracked caverns along the rim.",
  nw_dusthaven:       "A desolate expanse of grey ash dunes where the wind carries whispers of the dead. Once a great city, now nothing but dust and memory.",
  nw_smoldervale:     "Petrified trees still glow with inner fire, their branches dripping liquid flame. The forest remembers being alive, and that memory burns.",
  nw_ossuary:         "A vast underground complex built entirely from the bones of fallen civilizations. Each chamber tells the story of a world that was consumed.",
  nw_marrowfen:       "Swamplands where the water runs white with dissolved bone. Strange flowers bloom from skulls, and the reeds whisper forgotten names.",
  nw_skullspire:      "A tower of fused skulls that stretches into the void-sky. Each skull still holds a fragment of consciousness, creating an eternal chorus of the dead.",
  nw_gravebloom:      "Gardens where death nourishes impossible beauty. Flowers of otherworldly color grow from mass graves, their petals soft as mourning.",
  nw_nullchasm:       "A rift in reality where even the concept of ground becomes uncertain. The void yawns below, above, and within — and something in it watches.",
  nw_echovoid:        "Vast caverns where sound becomes visible and silence has weight. Every word spoken here persists forever, layering into an incomprehensible cacophony.",
  nw_shatterdrift:    "Fragments of broken dimensions drift through empty space. Islands of impossible geography float and collide, each one a piece of a destroyed world.",
  nw_abyssgate:       "The threshold between the Netherworld and the deeper void. Here, reality is a suggestion and the laws of nature are merely polite recommendations.",
  nw_drownreach:      "Submerged ruins of a civilization that tried to flee by sea. The water is thick with spectral currents, and drowned sailors still man their ghostly ships.",
  nw_ghosttide:       "Shallow waters where the tide carries not water but the translucent forms of the dead. Each wave deposits another layer of lost souls on the grey sand.",
  nw_leviathandeep:   "The deepest waters of the Netherworld, where ancient sea-beasts circle in eternal hunger. Bone coral builds cathedrals around their sleeping forms.",
  nw_sirenshore:      "A hauntingly beautiful coastline where the boundary between song and scream dissolves. Those who listen too long become part of the eternal chorus.",
  nw_veilgate:        "The first gate of the Spire, where the membrane between dimensions is thinnest. Ghosts of possible futures flicker at the edges of perception.",
  nw_demonhold:       "The fortress where Samma'el's generals plot their campaigns against the living world. Every stone is infused with malice, every shadow hides a blade.",
  nw_throneascent:    "The spiraling stairway that leads to Samma'el's throne. Each step tests a different virtue — and twists it into something darker.",
  nw_sammael_sanctum: "The heart of the Netherworld. Here, Samma'el's power is absolute. Reality bends to his will, and the very concept of hope becomes fuel for his dominion.",
};

// ── Map state ──
let NW={panX:500,panY:500,zoom:1,dragging:false,dragStart:{x:0,y:0},panStart:{x:0,y:0},pinchDist:0,_raidBtns:[],_nameBtns:[],_planetBtns:[],_t0:Date.now()};
let _nwRaf=null;

function nwZoom(d){NW.zoom=Math.max(0.4,Math.min(4,NW.zoom+d));drawNwMap();}
function nwCloseAllPanels(){
  ['nwRaidPanel','nwCountryPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  if(window._nwPanelRaf){cancelAnimationFrame(window._nwPanelRaf);window._nwPanelRaf=null;}
}

function openNetherworldMap(){
  if(!nwMapUnlocked()){showToast('Requires 50% Hard completion on any map');return;}
  nwRenderHeader();
  NW._raidBtns=[];NW._nameBtns=[];NW._planetBtns=[];NW._t0=Date.now();
  showScreen('nwMapScreen');
  setTimeout(()=>{
    const cv=document.getElementById('nwMapCanvas');
    if(cv)cv._nwInit=false;
    const W=gameW(),H=gameH()-42;
    NW.zoom=Math.min((W-32)/820,(H-32)/820);
    NW.panX=500;NW.panY=500;
    nwInitInput();
    if(_nwRaf)cancelAnimationFrame(_nwRaf);
    const _loop=()=>{
      if(document.getElementById('nwMapScreen')?.classList.contains('active')){drawNwMap();_nwRaf=requestAnimationFrame(_loop);}
      else{_nwRaf=null;}
    };
    _loop();
  },50);
}

function closeNetherworldMap(){
  if(_nwRaf){cancelAnimationFrame(_nwRaf);_nwRaf=null;}
  nwCloseAllPanels();
  showScreen('castle');
  CR=null;_castleSpawnAtExit=true;
  startCastleRoom();
}

function nwRenderHeader(){
  const cnt=NW_REGIONS.filter(r=>{const c=GS.conquered['nw_'+r.id]||{};return c.easy&&c.medium&&c.hard;}).length;
  const el=document.getElementById('nwConqCount');
  if(el)el.textContent=cnt+'/'+NW_REGIONS.length+' Conquered';
}

function nwToScreen(rx,ry,W,H){
  return{x:W/2+(rx-.5)*820*NW.zoom-NW.panX*NW.zoom+W/2,y:H/2+(ry-.5)*820*NW.zoom-NW.panY*NW.zoom+H/2};
}

function drawNwMap(){
  const cv=document.getElementById('nwMapCanvas');if(!cv)return;
  const DPR=window.devicePixelRatio||1;
  const W=gameW(),H=gameH()-42;
  if(cv.width!==Math.floor(W*DPR)){cv.width=Math.floor(W*DPR);cv.height=Math.floor(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';}
  const c=cv.getContext('2d');
  c.save();c.setTransform(DPR,0,0,DPR,0,0);
  c.clearRect(0,0,W,H);
  const t=(Date.now()-NW._t0)/1000;

  // ── Void background ──
  const bgGrad=c.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.7);
  bgGrad.addColorStop(0,'#0c0014');bgGrad.addColorStop(.4,'#060008');bgGrad.addColorStop(1,'#010002');
  c.fillStyle=bgGrad;c.fillRect(0,0,W,H);

  // ── Swirling void vortex ──
  {
    const vcx=W*.5+NW.panX*.3,vcy=H*.4+NW.panY*.3;
    const vR=Math.max(W,H)*.4*NW.zoom;

    // Core glow
    const core=c.createRadialGradient(vcx,vcy,0,vcx,vcy,vR*.2);
    core.addColorStop(0,'rgba(168,85,247,.15)');core.addColorStop(.5,'rgba(120,50,200,.06)');core.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=core;c.beginPath();c.arc(vcx,vcy,vR*.2,0,Math.PI*2);c.fill();

    // Spiral tendrils
    c.save();c.globalCompositeOperation='screen';
    const armCols=['rgba(168,85,247,','rgba(139,92,246,','rgba(124,58,237,','rgba(109,40,217,','rgba(147,51,234,'];
    for(let arm=0;arm<5;arm++){
      const baseAngle=arm*Math.PI*2/5+t*.05;
      const col=armCols[arm%5];
      for(let si=0;si<80;si++){
        const frac=si/80;
        const theta=baseAngle+frac*Math.PI*3;
        const r=vR*(.05+frac*.9);
        const spread=vR*(.008+frac*.04);
        const jx=(Math.sin(si*5.3+arm*77)*.5)*spread;
        const jy=(Math.cos(si*3.7+arm*51)*.5)*spread;
        const ax=vcx+Math.cos(theta)*r+jx;
        const ay=vcy+Math.sin(theta)*r*.6+jy;
        const alpha=(.03+Math.sin(t*.4+si*.12+arm)*.012)*(1-frac*.6);
        const sz=Math.max(1.2,(2.5+frac*3.5)*NW.zoom);
        const sg=c.createRadialGradient(ax,ay,0,ax,ay,sz*2);
        sg.addColorStop(0,col+alpha+')');sg.addColorStop(1,col+'0)');
        c.fillStyle=sg;c.beginPath();c.arc(ax,ay,sz*2,0,Math.PI*2);c.fill();
      }
    }
    c.restore();

    // Ambient haze
    const haze=c.createRadialGradient(vcx,vcy,0,vcx,vcy,vR);
    haze.addColorStop(0,'rgba(100,40,180,.04)');haze.addColorStop(.5,'rgba(60,20,120,.02)');haze.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=haze;c.beginPath();c.arc(vcx,vcy,vR,0,Math.PI*2);c.fill();
  }

  // Floating void particles
  for(let i=0;i<200;i++){
    const sx=((i*137.508+i*i*.003)%1)*W;
    const sy=((i*79.221+i*i*.005)%1)*H;
    const sz=i%7===0?1.3:i%3===0?0.8:0.4;
    const twk=0.35+Math.sin(t*0.5+i*1.7)*0.25;
    const pc=i%5===0?`rgba(168,85,247,${twk*0.5})`:i%3===0?`rgba(139,92,246,${twk*0.35})`:`rgba(200,200,255,${twk*0.3})`;
    c.fillStyle=pc;
    c.beginPath();c.arc(sx,sy,sz,0,Math.PI*2);c.fill();
  }

  NW._raidBtns=[];NW._nameBtns=[];NW._planetBtns=[];

  // ── Draw each region node ──
  NW_REGIONS.forEach(region=>{
    if(!nwRegionAccessible(region))return;
    const sp=nwToScreen(region.x,region.y,W,H);
    const conq=GS.conquered['nw_'+region.id]||{};
    const isFullCleared=conq.easy&&conq.medium&&conq.hard;
    const s=Math.max(10,16*NW.zoom);
    const col=region.color;

    // Outer glow
    const glow=c.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,s*2.4);
    glow.addColorStop(0,col+'22');glow.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=glow;c.beginPath();c.arc(sp.x,sp.y,s*2.4,0,Math.PI*2);c.fill();

    // Region orb (dark, void-like)
    const pg=c.createRadialGradient(sp.x-s*.28,sp.y-s*.28,s*.08,sp.x,sp.y,s);
    pg.addColorStop(0,col+'cc');pg.addColorStop(.65,col+'88');pg.addColorStop(1,col+'22');
    c.fillStyle=pg;c.beginPath();c.arc(sp.x,sp.y,s,0,Math.PI*2);c.fill();

    // Void crack effect on Spire regions
    if(region.faction==='nw_spire'){
      c.strokeStyle=isFullCleared?'rgba(168,85,247,.6)':col+'55';
      c.lineWidth=Math.max(1,2*NW.zoom);
      c.beginPath();c.ellipse(sp.x,sp.y,s*1.5,s*.35,-.3+Math.sin(t*.3)*.1,0,Math.PI*2);c.stroke();
    }

    // Conquest star
    if(isFullCleared){
      c.fillStyle='#d8b4fe';c.font=`${Math.max(8,11*NW.zoom)}px sans-serif`;
      c.textAlign='center';icoD(c,'★',sp.x,sp.y-s-3*NW.zoom,12);
    }

    // E/M/H dots
    if(NW.zoom>0.5){
      ['easy','medium','hard'].forEach((diff,di)=>{
        const ox=(di-1)*s*.75,bx=sp.x+ox,by=sp.y+s*1.65;
        const br=Math.max(3.5,5.5*NW.zoom);
        const isClr=conq[diff];
        const locked=(diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium));
        if(locked)return;
        const dcol=['#22c55e',PALETTE.holyDk,'#ef4444'][di];
        c.fillStyle=isClr?dcol:dcol+'77';
        c.beginPath();c.arc(bx,by,br,0,Math.PI*2);c.fill();
        if(isClr){c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1;c.stroke();}
        NW._raidBtns.push({x:bx,y:by,r:br+9,region,diff});
      });
    }

    NW._planetBtns.push({x:sp.x,y:sp.y,r:s+6,region});

    // Name label
    if(NW.zoom>0.48){
      const fs=Math.max(8,10*NW.zoom);
      c.font=`${fs}px "Almendra","Cinzel",monospace`;
      const tw=c.measureText(region.name).width;
      const lx=sp.x-tw/2,ly=sp.y-s-14*NW.zoom;
      c.fillStyle='rgba(0,0,0,.6)';c.fillRect(lx-3,ly-fs,tw+6,fs+5);
      c.fillStyle=col;c.textAlign='left';c.fillText(region.name,lx,ly);
      NW._nameBtns.push({x:lx-4,y:ly-fs-2,w:tw+8,h:fs+8,region});
    }
  });

  // Void lightning flashes
  if(NW.zoom>0.65){
    const la=0.03+Math.sin(t*.5)*.02;
    c.strokeStyle=`rgba(168,85,247,${la})`;c.lineWidth=1;
    for(let i=0;i<4;i++){
      const y=((t*4+i*70)%H)-20;
      c.beginPath();c.moveTo(0,y);c.lineTo(W,y+30);c.stroke();
    }
  }
  c.restore();
}

function nwInitInput(){
  const cv=document.getElementById('nwMapCanvas');if(!cv||cv._nwInit)return;
  cv._nwInit=true;
  let _lp=0;
  cv.addEventListener('pointerdown',e=>{e.preventDefault();NW.dragging=true;NW.dragStart={x:e.clientX,y:e.clientY};NW.panStart={x:NW.panX,y:NW.panY};cv.setPointerCapture(e.pointerId);},{passive:false});
  cv.addEventListener('pointermove',e=>{if(!NW.dragging)return;NW.panX=NW.panStart.x-(e.clientX-NW.dragStart.x)/NW.zoom;NW.panY=NW.panStart.y-(e.clientY-NW.dragStart.y)/NW.zoom;},{passive:false});
  cv.addEventListener('pointerup',e=>{const mv=Math.hypot(e.clientX-NW.dragStart.x,e.clientY-NW.dragStart.y);NW.dragging=false;if(mv<8)nwTap(e);},{passive:false});
  cv.addEventListener('wheel',e=>{e.preventDefault();nwZoom(e.deltaY<0?.15:-.15);},{passive:false});
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(_lp)NW.zoom=Math.max(0.4,Math.min(4,NW.zoom*(d/_lp)));_lp=d;drawNwMap();}},{passive:true});
  cv.addEventListener('touchend',()=>{_lp=0;},{passive:true});
}

function nwTap(e){
  const cv=document.getElementById('nwMapCanvas');if(!cv)return;
  const rect=cv.getBoundingClientRect();
  const sx=(e.clientX||0)-rect.left,sy=(e.clientY||0)-rect.top;
  for(const btn of NW._raidBtns){if(Math.hypot(sx-btn.x,sy-btn.y)<btn.r){nwCloseAllPanels();nwShowRaidPanel(btn.region,btn.diff);return;}}
  for(const nb of NW._nameBtns){if(sx>=nb.x&&sx<=nb.x+nb.w&&sy>=nb.y&&sy<=nb.y+nb.h){nwCloseAllPanels();nwShowCountryPanel(nb.region);return;}}
  for(const pb of NW._planetBtns){if(Math.hypot(sx-pb.x,sy-pb.y)<pb.r){nwCloseAllPanels();nwShowCountryPanel(pb.region);return;}}
  nwCloseAllPanels();
}

function nwShowCountryPanel(region){
  const panel=document.getElementById('nwCountryPanel');if(!panel)return;
  const fac=NW_FACTIONS[nwFactionOf(region.id)];
  const tIco={plains:'🌿',forest:'🌲',mountain:'🏔️',desert:'🏜️',tundra:'❄️',wasteland:'🌋',swamp:'🌿',sanctum:'🌀'}[region.terrain]||'🌀';
  const desc=NW_COUNTRY_DESCS[region.id]||'A realm of shadow and dread in the Netherworld.';
  panel.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:11px;color:${region.color};text-shadow:0 0 12px ${region.color}55">${tIco} ${region.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:3px">${(()=>{const fi=NW_FACTION_ORDER.indexOf(region.faction);const ok=fi<=0||(()=>{for(let i=0;i<fi;i++){if(!nwFactionCleared(NW_FACTION_ORDER[i]))return false;}return true;})();return(ok&&GS.necroLv>=region.lv)?(fac?.name||''):'???';})()} · ${region.terrain} · Lv.${region.lv}</div>
      </div>
      <button onclick="nwCloseAllPanels()" style="-webkit-appearance:none;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);color:#6b7280;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px">✕</button>
    </div>
    <div style="font-family:'IM Fell English',serif;font-size:12px;color:#c8b89a;line-height:1.65;font-style:italic;border-top:1px solid rgba(255,255,255,.08);padding-top:10px">${desc}</div>`;
  panel.style.display='block';
}

function nwShowRaidPanel(region,diff){
  const panel=document.getElementById('nwRaidPanel');if(!panel)return;
  const ck='nw_'+region.id;
  const conq=GS.conquered[ck]||{};
  const isLocked=(diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium));
  const isCleared=!!conq[diff];
  const accessible=nwRegionAccessible(region);
  const raidKeys=NW_REGION_RAID_MAP[region.id]||[];
  const rdKey=raidKeys[['easy','medium','hard'].indexOf(diff)];
  const cfg=RAID_CONFIGS[rdKey]||{};
  const boss=NW_BOSSES[cfg.bossKey]||(typeof REGION_BOSSES!=='undefined'?REGION_BOSSES[cfg.bossKey]:null)||(typeof BOSSES!=='undefined'?BOSSES[cfg.bossKey]:null)||{};
  const diffColors={easy:'#22c55e',medium:PALETTE.holyDk,hard:'#ef4444',ascended:'#c084fc'};
  const dc=diffColors[diff]||'#a78bfa';
  const tIco={plains:'🌿',forest:'🌲',mountain:'🏔️',desert:'🏜️',tundra:'❄️',wasteland:'🌋',swamp:'🌿',sanctum:'🌀'}[region.terrain]||'🌀';
  const uniqE=[...new Set(cfg.enemyPool||[])];
  const _risen=(GS.raisedBosses||[]).some(rb=>rb.bossKey===cfg.bossKey);

  let html=`
  <div style="background:linear-gradient(135deg,rgba(168,85,247,.15),rgba(0,0,0,0));border-bottom:1px solid rgba(168,85,247,.25);padding:14px 16px 10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:${region.color};text-shadow:0 0 10px ${region.color}44">${cfg.ico||tIco} ${cfg.name||region.name}</div>
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:#6b7280;margin-top:2px">${region.name} · <span style="color:${dc}">${diff.toUpperCase()}</span> · ${cfg.floors||3} Floors</div>
      </div>
      <button onclick="nwCloseAllPanels()" style="-webkit-appearance:none;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.4);color:#c084fc;border-radius:2px;padding:2px 9px;cursor:pointer;font-family:'Almendra','Cinzel',serif;font-size:9px;flex-shrink:0;margin-left:8px">✕</button>
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
    html+=`<div style="margin-bottom:12px"><div style="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#6b7280;letter-spacing:1px;margin-bottom:7px">ENEMIES</div><div id="nwEnemyRow" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>`;
    const _bbg=_risen?'rgba(168,85,247,.10)':'rgba(239,68,68,.08)';
    const _bbd=_risen?'rgba(168,85,247,.40)':'rgba(239,68,68,.25)';
    const _blc=_risen?'#a855f7':'#ef4444';
    const _blb=_risen?'☠ FINAL BOSS — RISEN':'⚔ FINAL BOSS';
    const _bnc=_risen?'#d8b4fe':'#fca5a5';
    if(isCleared){
      html+=`<div style="background:${_bbg};border:1px solid ${_bbd};border-radius:10px;padding:10px 12px;margin-bottom:10px">
        <div style="font-family:'Almendra','Cinzel',serif;font-size:9px;color:${_blc};letter-spacing:1px;margin-bottom:6px">${_blb}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <canvas id="nwBossCanvas" width="52" height="52" style="border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(168,85,247,.3);flex-shrink:0"></canvas>
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
    html+=`<button onclick="nwCloseAllPanels();nwFireRaid(NW_REGIONS.find(r=>r.id==='${region.id}'),'${diff}')"
      style="-webkit-appearance:none;width:100%;padding:10px;font-family:'Almendra','Cinzel',serif;font-size:10px;letter-spacing:.06em;
      background:linear-gradient(135deg,${dc}22,${dc}11);border:1px solid ${dc}88;color:${dc};border-radius:10px;cursor:pointer;font-weight:bold">
      ${isCleared?'★ ':''} ENTER RAID →</button>`;
  }
  html+='</div>';
  panel.innerHTML=html;panel.style.display='block';

  // Animate enemy sprites in panel
  if(!isLocked&&accessible){
    const row=document.getElementById('nwEnemyRow');
    if(row){
      uniqE.forEach(eKey=>{
        if(!EDEF[eKey])return;
        const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px';
        const cv2=document.createElement('canvas');cv2.width=44;cv2.height=44;
        cv2.style.cssText='border-radius:7px;background:rgba(0,0,0,.5);border:1px solid rgba(168,85,247,.2)';
        const lbl=document.createElement('div');lbl.style.cssText="font-family:'Almendra','Cinzel',serif;font-size:10px;color:#9ca3af;text-align:center;max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
        const nm={cultist:'Cultist',skeleton_e:'Skeleton',zombie_e:'Zombie',ghoul_e:'Ghoul',wight_e:'Wight',gravedigger:'Digger',forest_wolf:'Wolf',forest_witch:'Witch',treant:'Treant',banshee:'Banshee',death_knight:'D.Knight',lich_acolyte:'Acolyte',shadow_demon:'Shadow',wraith_e:'Wraith'};
        lbl.textContent=nm[eKey]||(eKey.replace(/_/g,' '));cv2._eKey=eKey;
        wrap.appendChild(cv2);wrap.appendChild(lbl);row.appendChild(wrap);
      });
      if(window._nwPanelRaf)cancelAnimationFrame(window._nwPanelRaf);
      const _anim=()=>{
        const t2=Date.now()/1000;
        row.querySelectorAll('canvas').forEach(cv3=>{
          const k=cv3._eKey;if(!k||!SPR[k])return;
          const c2=cv3.getContext('2d');c2.clearRect(0,0,44,44);c2.save();c2.translate(22,28);
          try{SPR[k](c2,t2,0);}catch(ex){}c2.restore();
        });
        const bCv=document.getElementById('nwBossCanvas');
        if(bCv&&cfg.bossKey){
          const _bSpr=SPR[cfg.bossKey]||SPR.shadow_demon;
          const bc=bCv.getContext('2d');bc.clearRect(0,0,52,52);bc.save();bc.translate(26,36);bc.scale(.5,.5);
          try{_bSpr(bc,t2,0);}catch(ex){}bc.restore();
        }
        if(document.getElementById('nwRaidPanel')?.style.display!=='none'){window._nwPanelRaf=requestAnimationFrame(_anim);}
        else{window._nwPanelRaf=null;}
      };
      window._nwPanelRaf=requestAnimationFrame(_anim);
    }
  }
}

function nwFireRaid(region,diff){
  if(!region)return;
  const ck='nw_'+region.id;
  const conq=GS.conquered[ck]||{};
  if(!nwRegionAccessible(region)){showToast('Region locked');return;}
  if((diff==='medium'&&!conq.easy)||(diff==='hard'&&(!conq.easy||!conq.medium))){showToast('Clear previous difficulty first');return;}
  const rdKey=(NW_REGION_RAID_MAP[region.id]||[])[['easy','medium','hard'].indexOf(diff)];
  const cfg=RAID_CONFIGS[rdKey];if(!rdKey||!cfg){showToast('Raid not found!');return;}
  nwCloseAllPanels();closeNetherworldMap();
  activeRaid=rdKey;
  _pendingRegionRaid={region:{...region,id:ck},raidDef:{key:rdKey,diff,diffStyle:diff,floors:cfg.floors||3,scale:1.0,minLv:region.lv,name:cfg.name,ico:cfg.ico,bossKey:cfg.bossKey}};
  TransitionManager.play('raidFade',700,{hold:true,
    onMid:()=>{
      showScreen('raid');
      setTimeout(()=>{initRaid(rdKey,1,{regionId:ck,diff});},50);
    }
  });
}
