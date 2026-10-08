// ══════════════════════════════════════════════════════
//  TILE-BASED WORLD MAP — Middle Earth
//  Replaces drawWorldMap() with a 16px-tile terrain map,
//  walking player sprite, fog, roads and landmarks.
//  Loaded after 03-main.js; depends on WORLD_REGIONS,
//  WM_FACTIONS, FACTION_ORDER, WM, GS, PALETTE, etc.
// ══════════════════════════════════════════════════════

const WorldMapTile=(()=>{
'use strict';

// ── Constants ──
const T=16;            // tile size in world pixels
const COLS=120;        // map width in tiles
const ROWS=80;         // map height in tiles
const W_PX=COLS*T;     // 1920 world pixels
const H_PX=ROWS*T;     // 1280 world pixels

// ── Terrain palette (GBC / Pokémon Gold-Silver dark gothic style) ──
const TPAL={
  deepSea:   [4,12,24],
  sea:       [8,20,38],
  shallows:  [12,30,48],
  sand:      [42,38,28],
  plains:    [22,38,16],
  plainsDk:  [18,30,12],
  forest:    [12,32,10],
  forestDk:  [8,24,6],
  mountain:  [48,44,40],
  mountainDk:[36,32,28],
  snow:      [70,72,76],
  swamp:     [18,28,14],
  swampDk:   [12,20,8],
  wasteland: [30,18,12],
  wasteDk:   [22,12,8],
  tundra:    [40,42,48],
  tundraDk:  [30,32,38],
  desert:    [48,40,24],
  desertDk:  [38,30,16],
  sanctum:   [28,12,18],
  sanctumDk: [20,8,12],
  road:      [52,46,36],
  roadEdge:  [40,34,26],
};

// ── Deterministic hash ──
function _h(r,c,seed){
  let h=(r*374761+c*668265+(seed||0)*982451)&0x7fffffff;
  h=((h>>16)^h)*0x45d9f3b;h=((h>>16)^h)*0x45d9f3b;
  return((h>>16)^h)&0x7fffffff;
}
function _rng(r,c,seed){return(_h(r,c,seed)%10000)/10000;}

// ── Tile grid: 0=sea, 1=shore, 2+=terrain types ──
// Terrain IDs
const TID={SEA:0,SHORE:1,PLAINS:2,FOREST:3,MOUNTAIN:4,SWAMP:5,WASTELAND:6,TUNDRA:7,DESERT:8,SANCTUM:9,ROAD:10};

// Region polygon definitions (tile-space coordinates)
// Each region gets a rough polygon; tiles inside are that region's terrain
const _regionPolys={};
const _tileGrid=new Uint8Array(ROWS*COLS);  // terrain type per tile
const _regionGrid=new Int8Array(ROWS*COLS); // region index per tile (-1=none)
const _fogGrid=new Uint8Array(ROWS*COLS);   // 0=clear, 1=fogged
const _roadGrid=new Uint8Array(ROWS*COLS);  // 0=no road, 1=road

// Map region fractional coords to tile coords
function _rToTile(rx,ry){
  return{c:Math.round(rx*COLS)|0, r:Math.round(ry*ROWS)|0};
}

// ── Coastline polygon (same shape as original, in tile coords) ──
const _coastFrac=[
  [.08,.50],[.10,.38],[.14,.28],[.20,.20],[.28,.16],[.36,.12],[.46,.10],
  [.56,.11],[.66,.14],[.74,.18],[.80,.24],[.84,.32],[.86,.42],[.85,.54],
  [.82,.64],[.76,.74],[.68,.82],[.58,.88],[.48,.90],[.38,.88],[.28,.84],
  [.20,.78],[.14,.68],[.10,.58]
];
const _coastPoly=_coastFrac.map(p=>_rToTile(p[0],p[1]));

// Point-in-polygon test
function _pip(px,py,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].c,yi=poly[i].r,xj=poly[j].c,yj=poly[j].r;
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

// ── Road connections (region pairs that have a road between them) ──
const ROAD_LINKS=[
  ['shire','bree'],['bree','weatherhills'],['weatherhills','trollshaws'],
  ['trollshaws','rivendell'],['rivendell','mistyN'],['rivendell','lothlórien'],
  ['mistyN','mirkwood'],['lothlórien','edoras'],['mirkwood','lothlórien'],
  ['bree','edoras'],['edoras','helmsdeep'],['edoras','fangorn'],
  ['fangorn','isengard'],['helmsdeep','rohan'],['rohan','isengard'],
  ['fangorn','osgiliath'],['osgiliath','minas_tirith'],
  ['minas_tirith','ithilien'],['ithilien','minas_morgul'],
  ['osgiliath','gorgoroth'],['minas_morgul','gorgoroth'],
  ['gorgoroth','mordor'],['mordor','mount_doom'],
];

// ── Settlement type by region ──
const SETTLE_TYPE={
  shire:'town', bree:'town', weatherhills:'ruin', trollshaws:'camp',
  rivendell:'capital', mistyN:'lair', mirkwood:'lair', 'lothlórien':'capital',
  edoras:'capital', helmsdeep:'town', isengard:'ruin', fangorn:'camp',
  rohan:'town', osgiliath:'ruin', minas_tirith:'capital', ithilien:'camp',
  gorgoroth:'lair', minas_morgul:'ruin', mordor:'lair', mount_doom:'lair',
};

// ── Landmark (Mount Doom is the anchor) ──
const LANDMARK={id:'mount_doom',label:'Mount Doom',icon:'volcano'};

// ══════════════════════════════════════════════════════
//  MAP GENERATION (runs once)
// ══════════════════════════════════════════════════════
let _generated=false;
let _terrainCanvas=null; // pre-rendered terrain bitmap

function _terrainForRegion(r){
  const t=r.terrain;
  if(t==='plains') return TID.PLAINS;
  if(t==='forest') return TID.FOREST;
  if(t==='mountain') return TID.MOUNTAIN;
  if(t==='swamp') return TID.SWAMP;
  if(t==='wasteland') return TID.WASTELAND;
  if(t==='tundra') return TID.TUNDRA;
  if(t==='desert') return TID.DESERT;
  if(t==='sanctum') return TID.SANCTUM;
  return TID.PLAINS;
}

// Build region Voronoi-like ownership: each land tile belongs to nearest region
function _assignRegions(){
  _regionGrid.fill(-1);
  const centers=WORLD_REGIONS.map(r=>{
    const t=_rToTile(r.x,r.y);
    return{c:t.c,r:t.r};
  });
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const idx=row*COLS+col;
      if(!_pip(col,row,_coastPoly)){
        _tileGrid[idx]=TID.SEA;
        continue;
      }
      // Find nearest region center
      let bestD=Infinity,bestI=-1;
      for(let i=0;i<centers.length;i++){
        // Add some noise for organic boundaries
        const noise=(_rng(row,col,i*17)-0.5)*12;
        const dx=col-centers[i].c+noise;
        const dy=row-centers[i].r+noise*0.7;
        const d=dx*dx+dy*dy;
        if(d<bestD){bestD=d;bestI=i;}
      }
      _regionGrid[idx]=bestI;
      _tileGrid[idx]=_terrainForRegion(WORLD_REGIONS[bestI]);
    }
  }
  // Shore tiles: sea tiles adjacent to land
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const idx=row*COLS+col;
      if(_tileGrid[idx]!==TID.SEA) continue;
      let adjLand=false;
      for(let dr=-1;dr<=1&&!adjLand;dr++){
        for(let dc=-1;dc<=1&&!adjLand;dc++){
          if(!dr&&!dc) continue;
          const nr=row+dr,nc=col+dc;
          if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&_tileGrid[nr*COLS+nc]>TID.SHORE) adjLand=true;
        }
      }
      if(adjLand) _tileGrid[idx]=TID.SHORE;
    }
  }
}

// Carve roads using Bresenham between region centers
function _carveRoads(){
  _roadGrid.fill(0);
  ROAD_LINKS.forEach(([idA,idB])=>{
    const rA=WORLD_REGIONS.find(r=>r.id===idA);
    const rB=WORLD_REGIONS.find(r=>r.id===idB);
    if(!rA||!rB) return;
    const a=_rToTile(rA.x,rA.y), b=_rToTile(rB.x,rB.y);
    // Bresenham with 2-wide road
    let x0=a.c,y0=a.r,x1=b.c,y1=b.r;
    let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
    let sx=x0<x1?1:-1,sy=y0<y1?1:-1;
    let err=dx-dy;
    while(true){
      // 2-wide road
      for(let dd=0;dd<=1;dd++){
        const rc=y0, cc=x0+dd;
        if(rc>=0&&rc<ROWS&&cc>=0&&cc<COLS&&_tileGrid[rc*COLS+cc]>TID.SHORE){
          _roadGrid[rc*COLS+cc]=1;
        }
      }
      if(x0===x1&&y0===y1) break;
      let e2=2*err;
      if(e2>-dy){err-=dy;x0+=sx;}
      if(e2<dx){err+=dx;y0+=sy;}
    }
  });
}

// Update fog based on game state
function _updateFog(){
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const idx=row*COLS+col;
      const ri=_regionGrid[idx];
      if(ri<0){_fogGrid[idx]=0;continue;}
      const region=WORLD_REGIONS[ri];
      // Fog if region is not visible (locked)
      _fogGrid[idx]=isRegionVisible(region)?0:1;
    }
  }
}

// ── Tile rendering (procedural pixel-art textures) ──
const _tileCanvasCache={};

function _rgb(r,g,b){return`rgb(${r|0},${g|0},${b|0})`;}
function _shade(rgb,amt){return[Math.min(255,Math.max(0,rgb[0]+amt)),Math.min(255,Math.max(0,rgb[1]+amt)),Math.min(255,Math.max(0,rgb[2]+amt))];}

function _genTileTexture(tid,row,col){
  const key=tid+'_'+(_h(row,col,99)%4);
  if(_tileCanvasCache[key]) return _tileCanvasCache[key];

  const cv=document.createElement('canvas');cv.width=T;cv.height=T;
  const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  const v=_h(row,col,99)%4; // variant

  switch(tid){
    case TID.SEA:{
      const base=TPAL.sea;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Subtle wave pixels
      for(let i=0;i<3;i++){
        const px=(_h(row,col,i*7)%14)+1, py=(_h(row,col,i*13)%(T-2))+1;
        c.fillStyle=_rgb(..._shade(base,8));c.fillRect(px,py,2,1);
      }
      break;
    }
    case TID.SHORE:{
      const base=TPAL.shallows;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      c.fillStyle=_rgb(...TPAL.sand);
      // Sand specks
      for(let i=0;i<4;i++){
        const px=(_h(row,col,i*3)%T), py=(_h(row,col,i*11)%T);
        c.fillRect(px,py,1,1);
      }
      break;
    }
    case TID.PLAINS:{
      const base=v<2?TPAL.plains:TPAL.plainsDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Grass tufts
      for(let i=0;i<6;i++){
        const px=(_h(row,col,i*5)%14)+1, py=(_h(row,col,i*9)%(T-3))+1;
        const shade=_shade(base,(_h(row,col,i*2)%16)-8);
        c.fillStyle=_rgb(...shade);c.fillRect(px,py,1,2);
      }
      break;
    }
    case TID.FOREST:{
      const base=v<2?TPAL.forest:TPAL.forestDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Tree canopy blobs
      for(let i=0;i<3;i++){
        const px=(_h(row,col,i*7)%12)+2, py=(_h(row,col,i*13)%10)+1;
        const shade=_shade(base,(_h(row,col,i)%20)-10);
        c.fillStyle=_rgb(...shade);
        c.fillRect(px,py,3,2);c.fillRect(px+1,py-1,1,1);c.fillRect(px+1,py+2,1,1);
        // Trunk
        c.fillStyle=_rgb(30,20,10);c.fillRect(px+1,py+3,1,2);
      }
      break;
    }
    case TID.MOUNTAIN:{
      const base=v<2?TPAL.mountain:TPAL.mountainDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Peak shape
      const cx=(_h(row,col,1)%8)+4, cy=3;
      c.fillStyle=_rgb(..._shade(base,15));
      c.fillRect(cx,cy,1,1);c.fillRect(cx-1,cy+1,3,1);
      c.fillRect(cx-2,cy+2,5,1);c.fillRect(cx-3,cy+3,7,1);
      // Snow cap on some
      if(v===0){c.fillStyle=_rgb(...TPAL.snow);c.fillRect(cx,cy,1,1);c.fillRect(cx-1,cy+1,3,1);}
      // Rock texture
      for(let i=0;i<3;i++){
        const px=(_h(row,col,i*4)%T),py=(_h(row,col,i*8)%(T-6))+6;
        c.fillStyle=_rgb(..._shade(base,-12));c.fillRect(px,py,1,1);
      }
      break;
    }
    case TID.SWAMP:{
      const base=v<2?TPAL.swamp:TPAL.swampDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Murky water patches
      for(let i=0;i<4;i++){
        const px=(_h(row,col,i*6)%12)+2,py=(_h(row,col,i*10)%12)+2;
        c.fillStyle=_rgb(..._shade(base,-10));c.fillRect(px,py,3,2);
      }
      // Dead tree stick
      if(v===0){c.fillStyle=_rgb(20,16,8);c.fillRect(7,4,1,4);c.fillRect(6,4,3,1);}
      break;
    }
    case TID.WASTELAND:{
      const base=v<2?TPAL.wasteland:TPAL.wasteDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Cracked earth
      c.fillStyle=_rgb(..._shade(base,-15));
      c.fillRect(3,2,1,5);c.fillRect(4,5,4,1);c.fillRect(9,1,1,4);
      c.fillRect(10,4,3,1);
      // Ember glow for Mordor feel
      if(v===3){c.fillStyle='rgba(200,60,20,.15)';c.fillRect(0,0,T,T);}
      break;
    }
    case TID.TUNDRA:{
      const base=v<2?TPAL.tundra:TPAL.tundraDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Frost pixels
      for(let i=0;i<5;i++){
        const px=(_h(row,col,i*3)%T),py=(_h(row,col,i*7)%T);
        c.fillStyle=_rgb(..._shade(base,18));c.fillRect(px,py,1,1);
      }
      break;
    }
    case TID.DESERT:{
      const base=v<2?TPAL.desert:TPAL.desertDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Sand ripple lines
      c.fillStyle=_rgb(..._shade(base,8));
      c.fillRect(1,4,T-2,1);c.fillRect(2,10,T-4,1);
      break;
    }
    case TID.SANCTUM:{
      const base=v<2?TPAL.sanctum:TPAL.sanctumDk;
      c.fillStyle=_rgb(...base);c.fillRect(0,0,T,T);
      // Dark pulsing ember feel
      c.fillStyle='rgba(180,40,20,.1)';c.fillRect(0,0,T,T);
      // Bone/ruin specks
      for(let i=0;i<3;i++){
        const px=(_h(row,col,i*5)%T),py=(_h(row,col,i*9)%T);
        c.fillStyle=_rgb(..._shade(base,20));c.fillRect(px,py,1,1);
      }
      break;
    }
  }

  _tileCanvasCache[key]=cv;
  return cv;
}

// Road tile
let _roadTile=null;
function _getRoadTile(){
  if(_roadTile) return _roadTile;
  const cv=document.createElement('canvas');cv.width=T;cv.height=T;
  const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle=_rgb(...TPAL.road);c.fillRect(0,0,T,T);
  // Worn centre strip
  c.fillStyle=_rgb(..._shade(TPAL.road,8));c.fillRect(2,0,T-4,T);
  // Edge stones
  c.fillStyle=_rgb(...TPAL.roadEdge);
  c.fillRect(0,0,2,T);c.fillRect(T-2,0,2,T);
  _roadTile=cv;return cv;
}

// ── Pre-render entire terrain to a big offscreen canvas ──
function _renderTerrainBitmap(){
  const cv=document.createElement('canvas');
  cv.width=W_PX;cv.height=H_PX;
  const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const idx=row*COLS+col;
      const tid=_tileGrid[idx];
      const isRoad=_roadGrid[idx]===1;
      const tile=isRoad?_getRoadTile():_genTileTexture(tid,row,col);
      c.drawImage(tile,col*T,row*T);
    }
  }
  _terrainCanvas=cv;
}

function generate(){
  if(_generated) return;
  _assignRegions();
  _carveRoads();
  _updateFog();
  _renderTerrainBitmap();
  _generated=true;
}

// ══════════════════════════════════════════════════════
//  PLAYER / WALKING SYSTEM
// ══════════════════════════════════════════════════════

// Player position in world pixels
let _px=0, _py=0;   // current
let _tx=0, _ty=0;   // target
let _walking=false;
let _walkPath=[];
let _walkIdx=0;
const WALK_SPEED=48; // pixels per second
let _walkDir=0;      // 0=down,1=left,2=right,3=up
let _walkFrame=0;
let _walkFrameT=0;

function _initPlayerPos(){
  // Start at The Shire
  const shire=WORLD_REGIONS.find(r=>r.id==='shire');
  if(shire){
    const t=_rToTile(shire.x,shire.y);
    _px=t.c*T+T/2; _py=t.r*T+T/2;
    _tx=_px; _ty=_py;
  }
}

// Simple A* pathfinding on the tile grid (walkable = land tiles)
function _isWalkable(r,c){
  if(r<0||r>=ROWS||c<0||c>=COLS) return false;
  const tid=_tileGrid[r*COLS+c];
  return tid>TID.SHORE; // anything that's land
}

function _findPath(sr,sc,er,ec){
  // BFS for simplicity (map is small enough)
  if(!_isWalkable(er,ec)) return null;
  const visited=new Uint8Array(ROWS*COLS);
  const prev=new Int32Array(ROWS*COLS).fill(-1);
  const queue=[[sr,sc]];
  visited[sr*COLS+sc]=1;

  const dirs=[[0,1],[0,-1],[1,0],[-1,0]];
  while(queue.length>0){
    const [cr,cc]=queue.shift();
    if(cr===er&&cc===ec){
      // Reconstruct path
      const path=[];
      let idx=er*COLS+ec;
      while(idx!==-1){
        const r=Math.floor(idx/COLS), c=idx%COLS;
        path.unshift({x:c*T+T/2,y:r*T+T/2});
        idx=prev[idx];
      }
      return path;
    }
    for(const [dr,dc] of dirs){
      const nr=cr+dr, nc=cc+dc;
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!visited[nr*COLS+nc]&&_isWalkable(nr,nc)){
        visited[nr*COLS+nc]=1;
        prev[nr*COLS+nc]=cr*COLS+cc;
        queue.push([nr,nc]);
      }
    }
  }
  return null; // no path
}

function walkTo(worldX,worldY){
  const sr=Math.floor(_py/T), sc=Math.floor(_px/T);
  const er=Math.floor(worldY/T), ec=Math.floor(worldX/T);
  if(sr===er&&sc===ec) return;
  const path=_findPath(sr,sc,er,ec);
  if(!path||path.length<2) return;
  _walkPath=path;
  _walkIdx=1;
  _walking=true;
  _tx=path[1].x; _ty=path[1].y;
}

function _updateWalk(dt){
  if(!_walking) return;
  const dx=_tx-_px, dy=_ty-_py;
  const dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<1){
    _px=_tx; _py=_ty;
    _walkIdx++;
    if(_walkIdx>=_walkPath.length){
      _walking=false;
      _walkPath=[];
      // Check if we landed on a region node
      _checkRegionArrival();
      return;
    }
    _tx=_walkPath[_walkIdx].x;
    _ty=_walkPath[_walkIdx].y;
    return;
  }
  const step=WALK_SPEED*dt;
  const ratio=Math.min(step/dist,1);
  _px+=dx*ratio; _py+=dy*ratio;
  // Direction for animation
  if(Math.abs(dx)>Math.abs(dy)) _walkDir=dx<0?1:2;
  else _walkDir=dy<0?3:0;
  // Frame animation
  _walkFrameT+=dt;
  if(_walkFrameT>0.18){_walkFrameT=0;_walkFrame=(_walkFrame+1)%4;}
}

function _checkRegionArrival(){
  const tr=Math.floor(_py/T), tc=Math.floor(_px/T);
  const ri=_regionGrid[tr*COLS+tc];
  if(ri<0) return;
  const region=WORLD_REGIONS[ri];
  // Check if we're near the region center (within 3 tiles)
  const ct=_rToTile(region.x,region.y);
  const dx=tc-ct.c, dy=tr-ct.r;
  if(Math.abs(dx)<=3&&Math.abs(dy)<=3){
    // Show the region panel
    if(typeof wmShowCountryPanel==='function'&&isRegionVisible(region)&&isRegionAccessible(region)){
      wmShowCountryPanel(region);
    }
  }
}

// ══════════════════════════════════════════════════════
//  DRAWING
// ══════════════════════════════════════════════════════

// Camera
let _camX=0, _camY=0;
let _wmZoom=1.5; // starting zoom

// Draw the necromancer sprite (simple 16×16 pixel figure)
let _necroSprite=null;
function _getNecroSprite(dir,frame){
  // 4 directions × 4 frames, cached
  const key='necro_'+dir+'_'+frame;
  if(_necroSprite&&_necroSprite._key===key) return _necroSprite;
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;
  const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  // Simple dark-robed figure
  const dark='#1a0e2e';
  const robe='#2d1650';
  const skin='#c4a882';
  const staff='#4a3020';
  const glow='#8040c0';
  const bob=(frame%2===1)?-1:0;
  const stepL=(frame===1||frame===3);
  // Hood/head
  c.fillStyle=robe;c.fillRect(6,1+bob,4,3);
  c.fillStyle=dark;c.fillRect(7,2+bob,2,2); // face shadow
  if(dir===0){c.fillStyle=skin;c.fillRect(7,3+bob,2,1);} // face down
  if(dir===3){c.fillStyle=robe;c.fillRect(6,1+bob,4,3);} // face up, hood covers
  // Body
  c.fillStyle=robe;c.fillRect(5,4+bob,6,6);
  c.fillStyle=dark;c.fillRect(6,4+bob,4,5); // central robe
  // Arms
  if(dir===1){c.fillStyle=robe;c.fillRect(4,5+bob,2,3);c.fillStyle=skin;c.fillRect(4,8+bob,1,1);}
  else if(dir===2){c.fillStyle=robe;c.fillRect(10,5+bob,2,3);c.fillStyle=skin;c.fillRect(11,8+bob,1,1);}
  else{c.fillStyle=robe;c.fillRect(4,5+bob,2,3);c.fillRect(10,5+bob,2,3);}
  // Legs
  c.fillStyle=dark;
  if(stepL){c.fillRect(6,10+bob,2,3);c.fillRect(8,11+bob,2,2);}
  else{c.fillRect(6,11+bob,2,2);c.fillRect(8,10+bob,2,3);}
  // Staff (left hand)
  c.fillStyle=staff;c.fillRect(4,2+bob,1,10);
  c.fillStyle=glow;c.fillRect(4,1+bob,1,1); // staff glow tip
  cv._key=key;
  _necroSprite=cv;
  return cv;
}

// Settlement icons (small pixel-art landmarks)
const _settleCache={};
function _getSettleIcon(type){
  if(_settleCache[type]) return _settleCache[type];
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;
  const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  switch(type){
    case 'capital':
      // Castle tower
      c.fillStyle='#48405a';c.fillRect(4,4,8,8);
      c.fillStyle='#5a5070';c.fillRect(5,2,2,3);c.fillRect(9,2,2,3);
      c.fillStyle='#3a3048';c.fillRect(6,8,4,4); // gate
      c.fillStyle='#c8a040';c.fillRect(7,1,2,2); // banner
      break;
    case 'town':
      // Houses cluster
      c.fillStyle='#4a3828';c.fillRect(3,7,4,5);c.fillRect(9,8,4,4);
      c.fillStyle='#6a4830';c.fillRect(3,5,4,2); // roof
      c.fillStyle='#5a3820';c.fillRect(9,6,4,2);
      c.fillStyle='#c8a040';c.fillRect(6,9,1,1); // window glow
      break;
    case 'ruin':
      // Broken columns
      c.fillStyle='#585858';c.fillRect(4,6,2,6);c.fillRect(10,8,2,4);
      c.fillStyle='#484848';c.fillRect(3,5,4,1);
      c.fillStyle='#686868';c.fillRect(7,10,1,2); // rubble
      c.fillRect(8,11,2,1);
      break;
    case 'camp':
      // Tent
      c.fillStyle='#5a4028';c.fillRect(5,7,6,5);
      c.fillStyle='#4a3018';c.fillRect(7,5,2,2); // peak
      c.fillStyle='#c86020';c.fillRect(7,10,1,1); // campfire
      c.fillStyle='#e08030';c.fillRect(7,9,1,1);
      break;
    case 'lair':
      // Cave mouth
      c.fillStyle='#383838';c.fillRect(4,6,8,6);
      c.fillStyle='#181818';c.fillRect(5,7,6,5); // dark interior
      c.fillStyle='#484848';c.fillRect(3,6,2,1);c.fillRect(11,6,2,1); // rock edges
      c.fillStyle='#e04040';c.fillRect(7,9,1,1);c.fillRect(8,9,1,1); // eyes
      break;
  }
  _settleCache[type]=cv;
  return cv;
}

// Main draw function — called from the animation loop
function draw(cvEl){
  if(!cvEl) return;
  if(!_generated) generate();

  const DPR=window.devicePixelRatio||1;
  const screenW=gameW(), screenH=gameH()-42;
  if(cvEl.width!==Math.floor(screenW*DPR)){
    cvEl.width=Math.floor(screenW*DPR);cvEl.height=Math.floor(screenH*DPR);
    cvEl.style.width=screenW+'px';cvEl.style.height=screenH+'px';
  }
  const ctx=cvEl.getContext('2d');
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,screenW,screenH);
  ctx.imageSmoothingEnabled=false;

  // Camera follows player
  _camX=_px-screenW/(2*_wmZoom);
  _camY=_py-screenH/(2*_wmZoom);
  // Clamp camera
  _camX=Math.max(0,Math.min(_camX,W_PX-screenW/_wmZoom));
  _camY=Math.max(0,Math.min(_camY,H_PX-screenH/_wmZoom));

  ctx.save();
  ctx.scale(_wmZoom,_wmZoom);
  ctx.translate(-_camX,-_camY);

  // ── Draw terrain from pre-rendered bitmap ──
  if(_terrainCanvas){
    // Only draw the visible portion
    const sx=Math.max(0,Math.floor(_camX));
    const sy=Math.max(0,Math.floor(_camY));
    const sw=Math.min(W_PX-sx,Math.ceil(screenW/_wmZoom)+2);
    const sh=Math.min(H_PX-sy,Math.ceil(screenH/_wmZoom)+2);
    ctx.drawImage(_terrainCanvas,sx,sy,sw,sh,sx,sy,sw,sh);
  }

  // ── Faction territory tint (conquered regions) ──
  for(const facId of FACTION_ORDER){
    const fac=WM_FACTIONS[facId];
    if(!fac) continue;
    const conqueredMembers=fac.members.filter(mid=>{
      const c=GS.conquered[mid];return c&&c.easy&&c.medium&&c.hard;
    });
    if(conqueredMembers.length===0) continue;
    ctx.save();ctx.globalAlpha=0.08;ctx.fillStyle=fac.color;
    // Tint each conquered region's tiles
    for(const mid of conqueredMembers){
      const ri=WORLD_REGIONS.findIndex(r=>r.id===mid);
      if(ri<0) continue;
      const startCol=Math.max(0,Math.floor(_camX/T));
      const endCol=Math.min(COLS,Math.ceil((_camX+screenW/_wmZoom)/T));
      const startRow=Math.max(0,Math.floor(_camY/T));
      const endRow=Math.min(ROWS,Math.ceil((_camY+screenH/_wmZoom)/T));
      for(let row=startRow;row<endRow;row++){
        for(let col=startCol;col<endCol;col++){
          if(_regionGrid[row*COLS+col]===ri){
            ctx.fillRect(col*T,row*T,T,T);
          }
        }
      }
    }
    ctx.restore();
  }

  // ── Fog over locked regions ──
  _updateFog();
  const startCol=Math.max(0,Math.floor(_camX/T));
  const endCol=Math.min(COLS,Math.ceil((_camX+screenW/_wmZoom)/T));
  const startRow=Math.max(0,Math.floor(_camY/T));
  const endRow=Math.min(ROWS,Math.ceil((_camY+screenH/_wmZoom)/T));
  ctx.save();
  for(let row=startRow;row<endRow;row++){
    for(let col=startCol;col<endCol;col++){
      if(_fogGrid[row*COLS+col]===1){
        // Show terrain under transparent fog
        ctx.fillStyle='rgba(4,8,16,0.55)';
        ctx.fillRect(col*T,row*T,T,T);
      }
    }
  }
  ctx.restore();

  // ── Roads visible one step ahead ──
  // Roads are already baked into the terrain bitmap; fog dims them but they show through

  // ── Region nodes (settlement icons + labels) ──
  WM._raidBtns=[];
  WM._nameBtns=[];
  WORLD_REGIONS.forEach((region,i)=>{
    const visible=isRegionVisible(region);
    if(!visible) return; // node hidden in fog
    const ct=_rToTile(region.x,region.y);
    const wx=ct.c*T, wy=ct.r*T;
    const sType=SETTLE_TYPE[region.id]||'camp';
    const icon=_getSettleIcon(sType);
    // Draw icon (2× for visibility)
    ctx.drawImage(icon,wx-8,wy-16,16,16);
    // Conquered check
    const conquered=GS.conquered[region.id];
    const allCleared=conquered&&conquered.easy&&conquered.medium&&conquered.hard;
    // Region name label
    ctx.save();
    ctx.font='bold 5px "IM Fell English",Georgia,serif';
    ctx.textAlign='center';
    ctx.fillStyle=allCleared?'#86efac':isRegionAccessible(region)?'#e2e8f0':'#64748b';
    ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=2;
    ctx.fillText(region.name,wx,wy+4);
    ctx.restore();

    // Store button rect for click detection (in world coords)
    WM._nameBtns.push({
      region:region,
      x:wx-30,y:wy-20,w:60,h:30
    });
  });

  // ── Player sprite ──
  const necro=_getNecroSprite(_walkDir,_walkFrame);
  ctx.drawImage(necro,_px-8,_py-14,16,16);
  // Soft glow under player
  ctx.save();ctx.globalAlpha=0.2;
  ctx.fillStyle='#8040c0';
  ctx.beginPath();ctx.ellipse(_px,_py+2,5,2,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  ctx.restore(); // end zoom+translate
  ctx.restore(); // end DPR
}

// ══════════════════════════════════════════════════════
//  INPUT HANDLING
// ══════════════════════════════════════════════════════

function _screenToWorld(sx,sy){
  return{
    x:sx/_wmZoom+_camX,
    y:sy/_wmZoom+_camY
  };
}

function handleTap(screenX,screenY){
  const w=_screenToWorld(screenX,screenY);
  // Check if tapping a region node
  for(const btn of (WM._nameBtns||[])){
    if(w.x>=btn.x&&w.x<=btn.x+btn.w&&w.y>=btn.y&&w.y<=btn.y+btn.h){
      if(isRegionVisible(btn.region)&&isRegionAccessible(btn.region)){
        // Walk to the region center, then open panel on arrival
        const ct=_rToTile(btn.region.x,btn.region.y);
        walkTo(ct.c*T+T/2, ct.r*T+T/2);
        return true;
      }
    }
  }
  // Otherwise walk to tapped location
  walkTo(w.x,w.y);
  return true;
}

function zoom(delta){
  _wmZoom=Math.max(0.75,Math.min(3.0,_wmZoom+delta));
}

// ══════════════════════════════════════════════════════
//  INTEGRATION — replaces drawWorldMap for Middle Earth
// ══════════════════════════════════════════════════════

let _lastT=0;
let _active=false;

function activate(){
  if(!_generated){generate();_initPlayerPos();}
  _active=true;
  _lastT=performance.now();
}

function deactivate(){
  _active=false;
}

function tick(now){
  if(!_active) return;
  const dt=Math.min((now-_lastT)/1000,0.1);
  _lastT=now;
  _updateWalk(dt);
  const cv=document.getElementById('worldMapCanvas');
  draw(cv);
}

// Expose to global
return{
  generate,draw,tick,activate,deactivate,
  handleTap,zoom,walkTo,
  get active(){return _active;},
  get playerTile(){return{r:Math.floor(_py/T),c:Math.floor(_px/T)};},
  COLS,ROWS,T
};
})();

// ══════════════════════════════════════════════════════
//  HOOK into existing world map system
// ══════════════════════════════════════════════════════

// Override openWorldMap to use tile map
(function(){
  const _origOpen=openWorldMap;
  const _origClose=closeWorldMap;

  window.openWorldMap=function(){
    Analytics.panelOpen('world_map');
    renderWorldMap();
    WM.popupRegion=null;WM._raidBtns=[];WM._nameBtns=[];WM._portBtn=null;
    WM._t0=Date.now();
    showScreen('worldMapScreen');
    WorldMapTile.activate();
    // Animation loop
    if(window._wmRaf)cancelAnimationFrame(window._wmRaf);
    const loop=()=>{
      if(document.getElementById('worldMapScreen')?.classList.contains('active')){
        WorldMapTile.tick(performance.now());
        window._wmRaf=requestAnimationFrame(loop);
      }else{
        window._wmRaf=null;
        WorldMapTile.deactivate();
      }
    };
    setTimeout(loop,50);
  };

  window.closeWorldMap=function(){
    WorldMapTile.deactivate();
    if(window._wmRaf){cancelAnimationFrame(window._wmRaf);window._wmRaf=null;}
    wmCloseAllPanels();
    showScreen('castle');
    CR=null;_castleSpawnAtExit=true;
    startCastleRoom();
    if(CR){const rb=crRoomBounds('exit');if(rb){CR.px=rb.x+rb.w*.50;CR.py=rb.y+rb.h*.45;CR.tx=CR.px;CR.ty=CR.py;}}
  };

  // Override zoom buttons
  window.wmZoom=function(delta){
    WorldMapTile.zoom(delta);
  };
})();

// Tap/click handler for tile world map
(function(){
  // Intercept wmTap when tile map is active
  const _origWmTap=typeof wmTap==='function'?wmTap:null;
  window.wmTap=function(e){
    if(!WorldMapTile.active){
      if(_origWmTap) return _origWmTap(e);
      return;
    }
    const cv=document.getElementById('worldMapCanvas');
    if(!cv) return;
    const rect=cv.getBoundingClientRect();
    const sx=(e.clientX||e.touches?.[0]?.clientX||0)-rect.left;
    const sy=(e.clientY||e.touches?.[0]?.clientY||0)-rect.top;
    WorldMapTile.handleTap(sx,sy);
  };
})();
