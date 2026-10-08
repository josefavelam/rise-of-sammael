// js/14-sprites.js — Animated sprite atlases for 10 pilot creatures
// Each atlas: 128×544 (4 frames × 32px wide, 17 rows × 32px tall)
// Row layout: idle(4dirs×4frames) → walk(4dirs×4frames) → attack(4dirs×4frames) → cast(4dirs×4frames) → death(1row×4frames)
// Directions: down=0, left=1, right=2, up=3
(function(){
'use strict';

const W=32, H=32, COLS=4, ROWS=17;
const SHEET_W=W*COLS, SHEET_H=H*ROWS;

// Standard states/directions config shared by all atlases
const STD_STATES={
  idle:  {row:0, frames:4, fps:6, loop:true},
  walk:  {row:4, frames:4, fps:8, loop:true},
  attack:{row:8, frames:4, fps:10, loop:false},
  cast:  {row:12,frames:4, fps:10, loop:false},
  death: {row:16,frames:4, fps:6, loop:false}
};
const STD_DIRS={down:0, left:1, right:2, up:3};

// ── Helpers ──
function makeCanvas(){
  const cv=document.createElement('canvas');
  cv.width=SHEET_W; cv.height=SHEET_H;
  return cv;
}

// Plot a single pixel
function px(ctx,x,y,col){
  ctx.fillStyle=col; ctx.fillRect(x,y,1,1);
}

// Filled rectangle
function rect(ctx,x,y,w,h,col){
  ctx.fillStyle=col; ctx.fillRect(x,y,w,h);
}

// Outlined rectangle (1px border)
function orect(ctx,x,y,w,h,fill,stroke){
  ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=stroke; ctx.lineWidth=1;
  ctx.strokeRect(x+.5,y+.5,w-1,h-1);
}

// Small circle (filled)
function circ(ctx,cx,cy,r,col){
  ctx.fillStyle=col;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
}

// Vertical line
function vline(ctx,x,y1,y2,col){
  ctx.fillStyle=col;
  for(let y=y1;y<=y2;y++) ctx.fillRect(x,y,1,1);
}

// Horizontal line
function hline(ctx,x1,x2,y,col){
  ctx.fillStyle=col;
  ctx.fillRect(x1,y,x2-x1+1,1);
}

// Get tile context positioned at (frame, row)
function tileCtx(ctx,frame,row){
  ctx.save();
  ctx.translate(frame*W, row*H);
  ctx.beginPath();
  ctx.rect(0,0,W,H);
  ctx.clip();
  return ctx;
}
function endTile(ctx){ ctx.restore(); }

// Mirror drawing: draw facing right, flip for left
// dir: 0=down,1=left,2=right,3=up
function drawMirrored(ctx,frame,row,drawFn,dir,frameIdx){
  const tc=tileCtx(ctx,frame,row);
  if(dir===1){
    // Left = mirror of right
    tc.translate(W,0);
    tc.scale(-1,1);
  }
  drawFn(tc,dir,frameIdx);
  endTile(tc);
}

// Register an atlas from a canvas
function registerAtlas(key,canvas){
  SpriteAtlasManager.register(key,{
    sheet:{src:canvas.toDataURL('image/png'), tileW:W, tileH:H},
    states:STD_STATES,
    directions:STD_DIRS
  });
}

// Animation helpers — walk bob, attack swing, death fade
function walkBob(f){ return [0,-1,-1,0][f]; }
function atkSwing(f){ return [0,2,4,2][f]; }
function deathSlump(f){ return [0,2,5,8][f]; }

// ════════════════════════════════════════════════════════
//  GRAVEDIGGER — brawny peasant, wide hat, dirty overalls, shovel
// ════════════════════════════════════════════════════════
function buildGravedigger(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const skin='#b8a078', hat='#5a4a3a', hatDk='#3a2a1a',
        overalls='#4a5a6a', overallsDk='#3a4a5a',
        apron='#6a5a4a', boots='#2a1a0a',
        shovelH='#6b4200', shovelB='#5a6a7a';

  function drawBody(ctx,dir,f,ofsY,shovelAngle){
    const cy=6+ofsY; // vertical center offset
    // Boots
    const legSep=dir===0||dir===3?3:2;
    const step=(f%2===1)?2:0;
    rect(ctx,12-legSep,22+cy,4,4,boots);
    rect(ctx,16+legSep-4,22+cy,4,4,boots);
    if(step){rect(ctx,12-legSep,22+cy-1,4,3,boots);rect(ctx,16+legSep-4,23+cy,4,4,boots);}
    // Overalls (body)
    rect(ctx,11,12+cy,10,11,overalls);
    rect(ctx,12,11+cy,8,1,overallsDk);
    // Apron
    rect(ctx,13,13+cy,6,8,apron);
    // Suspender straps
    vline(ctx,13,12+cy,17+cy,'#3a2a1a');
    vline(ctx,18,12+cy,17+cy,'#3a2a1a');
    // Head
    const headY=5+cy;
    rect(ctx,13,headY,6,6,skin);
    // Hat (wide brim)
    rect(ctx,9,headY-3,14,3,hat);
    rect(ctx,11,headY-5,10,3,hatDk);
    // Eyes
    if(dir!==3){
      px(ctx,14,headY+2,'#1a0a00');
      px(ctx,17,headY+2,'#1a0a00');
    }
    if(dir===3){
      // Back of head — hair
      rect(ctx,13,headY,6,3,hatDk);
    }
    // Shovel
    const sx=dir===1?8:21;
    const swy=Math.round(Math.sin(shovelAngle)*2);
    vline(ctx,sx,6+cy+swy,20+cy,shovelH);
    rect(ctx,sx-1,5+cy+swy,3,3,shovelB);
    // Lantern (on opposite side, small)
    if(dir===0||dir===2){
      const lx=dir===2?9:22;
      rect(ctx,lx,15+cy,2,3,'#c4960a');
      px(ctx,lx,14+cy,'#ff8800');
    }
  }

  // Fill all rows
  for(let dir=0;dir<4;dir++){
    // Idle (rows 0-3)
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      const bob=Math.sin(f*1.57)*.5;
      drawBody(tc,dir,0,Math.round(bob),f*0.3);
      endTile(tc);
    }
    // Walk (rows 4-7)
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),f*0.8);
      endTile(tc);
    }
    // Attack (rows 8-11)
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,0,0,atkSwing(f)*0.5);
      // Attack flash on frame 2
      if(f===2){rect(tc,18,8,8,3,'rgba(255,200,100,.6)');}
      endTile(tc);
    }
    // Cast (rows 12-15)
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,0,-1,0);
      // Lantern glow
      if(f>=1){circ(tc,dir===1?9:22,12,f,'rgba(255,136,0,.4)');}
      endTile(tc);
    }
  }
  // Death (row 16)
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    const slump=deathSlump(f);
    tc.globalAlpha=1-f*0.15;
    drawBody(tc,0,0,slump,0);
    // Shovel falls
    if(f>=2){
      rect(tc,12+f*2,20+slump,8,2,shovelB);
      hline(tc,14+f*2,20+f*2,22+slump,shovelH);
    }
    endTile(tc);
  }
  registerAtlas('gravedigger',cv);
}

// ════════════════════════════════════════════════════════
//  WIGHT LORD — skeletal king, purple/gray robes, gold crown, sword
// ════════════════════════════════════════════════════════
function buildWightLord(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const robe='#5a3a6a', robeDk='#3a2a4a', crown='#c4960a',
        skin='#a0a0a0', eyes='#ff2200', sword='#c0c8d0',
        swordH='#c4960a', tabard='#8a2030';

  function drawBody(ctx,dir,f,ofsY,swordOfs){
    const cy=4+ofsY;
    // Robe (tall flowing)
    rect(ctx,10,14+cy,12,12,robe);
    rect(ctx,9,18+cy,14,6,robeDk);
    // Ragged hem
    for(let i=0;i<7;i++){if(i%2)rect(ctx,9+i*2,24+cy,2,2,robeDk);}
    // Tabard
    rect(ctx,13,14+cy,6,10,tabard);
    hline(ctx,13,18,14+cy,crown); // gold trim
    // Shoulders
    rect(ctx,8,12+cy,5,3,robe);
    rect(ctx,19,12+cy,5,3,robe);
    // Skull head
    rect(ctx,12,4+cy,8,8,skin);
    rect(ctx,13,3+cy,6,2,'#808080');
    // Crown (three points)
    rect(ctx,11,1+cy,10,3,crown);
    px(ctx,12,0+cy,crown); px(ctx,16,0+cy,crown); px(ctx,20,0+cy,crown);
    // Eyes
    if(dir!==3){
      px(ctx,14,7+cy,eyes); px(ctx,17,7+cy,eyes);
      px(ctx,14,8+cy,'#000'); px(ctx,17,8+cy,'#000'); // sockets
    }
    // Sword
    const sx=dir===1?7:23+swordOfs;
    vline(ctx,sx,6+cy,22+cy,sword);
    rect(ctx,sx-1,8+cy,3,2,swordH); // crossguard
    px(ctx,sx,5+cy,'#e0e8f0'); // tip gleam
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2){rect(tc,22,6,6,2,'rgba(255,255,255,.5)');}
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      if(f>=1){circ(tc,16,8,f+1,'rgba(255,34,0,.3)');}
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),0);
    endTile(tc);
  }
  registerAtlas('wight_lord',cv);
}

// ════════════════════════════════════════════════════════
//  FOREST HAG — tree-witch, branch crown, green eyes, moss robes, staff
// ════════════════════════════════════════════════════════
function buildForestHag(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const robe='#4a5a2a', robeDk='#3a4a1a', inner='#5a3a6a',
        skin='#7a8a5a', eyes='#88ff44', crown='#6a5a30',
        staff='#5a4a20', orb='#66cc22';

  function drawBody(ctx,dir,f,ofsY,staffTilt){
    const cy=4+ofsY;
    // Robe (wide, mossy)
    rect(ctx,8,14+cy,16,12,robe);
    rect(ctx,7,20+cy,18,6,robeDk);
    // Inner robe peek
    rect(ctx,13,15+cy,6,8,inner);
    // Moss patches
    px(ctx,9,16+cy,'#6a8a3a'); px(ctx,20,19+cy,'#6a8a3a');
    px(ctx,11,22+cy,'#6a8a3a'); px(ctx,18,17+cy,'#6a8a3a');
    // Head (gnarled)
    rect(ctx,12,5+cy,8,8,skin);
    rect(ctx,11,4+cy,10,2,'#5a6a3a');
    // Branch crown
    px(ctx,12,2+cy,crown); px(ctx,14,1+cy,crown); px(ctx,17,1+cy,crown); px(ctx,19,2+cy,crown);
    px(ctx,13,0+cy,crown); px(ctx,18,0+cy,crown);
    // Eyes (green glow)
    if(dir!==3){
      px(ctx,14,8+cy,eyes); px(ctx,17,8+cy,eyes);
      px(ctx,14,9+cy,'#446622'); px(ctx,17,9+cy,'#446622');
    }
    // Hooked nose
    if(dir===0||dir===2) px(ctx,16,10+cy,'#5a6a3a');
    // Gnarled staff
    const sx=dir===1?7:24;
    const tilt=Math.round(staffTilt);
    vline(ctx,sx+tilt,3+cy,24+cy,staff);
    circ(ctx,sx+tilt,3+cy,2,orb);
    // Dripping green
    if(f%2===0){px(ctx,sx+tilt,26+cy,'#44aa11');px(ctx,sx+tilt+1,27+cy,'#44aa11');}
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),Math.sin(f*1.57));
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f)*0.5);
      if(f===2){circ(tc,dir===1?7:24,4,3,'rgba(102,204,34,.5)');}
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      // Green energy spiral
      if(f>=1){
        for(let i=0;i<f;i++){
          const a=i*2.1+f*0.8;
          circ(tc,16+Math.cos(a)*6,12+Math.sin(a)*4,1,'rgba(136,255,68,.5)');
        }
      }
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),f*2);
    endTile(tc);
  }
  registerAtlas('forest_hag',cv);
}

// ════════════════════════════════════════════════════════
//  BARROW ELDER — ornate skeletal king, gold-trimmed dark robes, tall crown, greatsword
// ════════════════════════════════════════════════════════
function buildBarrowElder(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const robe='#3a3a40', robeGold='#c4960a', skin='#8a8a80',
        crown='#c4960a', eyes='#4488ff', sword='#a0a8b0',
        wisp='rgba(128,68,204,.4)';

  function drawBody(ctx,dir,f,ofsY,swordOfs){
    const cy=3+ofsY;
    // Dark robe (grand)
    rect(ctx,9,14+cy,14,13,robe);
    // Gold trim edges
    vline(ctx,9,14+cy,26+cy,robeGold);
    vline(ctx,22,14+cy,26+cy,robeGold);
    hline(ctx,9,22,26+cy,robeGold);
    // Skeletal torso peek
    rect(ctx,13,14+cy,6,4,skin);
    // Shoulders (pauldrons)
    rect(ctx,7,12+cy,5,3,robe);rect(ctx,8,11+cy,3,2,robeGold);
    rect(ctx,20,12+cy,5,3,robe);rect(ctx,21,11+cy,3,2,robeGold);
    // Skull head
    rect(ctx,12,4+cy,8,8,skin);
    rect(ctx,13,3+cy,6,2,'#6a6a60');
    // Tall spiky crown
    rect(ctx,11,1+cy,10,3,crown);
    px(ctx,11,0+cy,crown); px(ctx,14,-1+cy,crown); px(ctx,17,-1+cy,crown); px(ctx,20,0+cy,crown);
    px(ctx,16,-2+cy,crown); // center spike tallest
    // Eyes (blue glow)
    if(dir!==3){
      px(ctx,14,7+cy,eyes); px(ctx,17,7+cy,eyes);
    }
    // Greatsword (wider)
    const sx=dir===1?6:24+swordOfs;
    vline(ctx,sx,4+cy,24+cy,sword);
    vline(ctx,sx+1,4+cy,24+cy,'#808890');
    rect(ctx,sx-1,8+cy,4,2,crown); // crossguard
    // Purple spirit wisps
    if(f%2===0){
      circ(ctx,10,18+cy,1,wisp); circ(ctx,22,15+cy,1,wisp);
    }
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2){rect(tc,22,5,8,2,'rgba(68,136,255,.5)');}
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      if(f>=1){circ(tc,16,10,f+1,'rgba(68,136,255,.3)');}
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),0);
    if(f>=2) circ(tc,16,16,f,'rgba(128,68,204,.3)');
    endTile(tc);
  }
  registerAtlas('barrow_elder',cv);
}

// ════════════════════════════════════════════════════════
//  INN REVENANT — burning innkeeper ghost, apron, fire-iron, flames, floating
// ════════════════════════════════════════════════════════
function buildInnRevenant(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const coat='#5a5040', apron='#d0c8a0', skin='#a0a8b0',
        beard='#6a5a40', flame='#ff8800', flameDk='#cc4400',
        iron='#4a4a4a';

  function drawBody(ctx,dir,f,ofsY,float){
    const cy=4+ofsY+float;
    // Ghost body (no legs — wispy bottom)
    rect(ctx,10,14+cy,12,10,coat);
    // Apron
    rect(ctx,12,14+cy,8,9,apron);
    hline(ctx,12,19,14+cy,'#b0a880'); // apron string
    // Wispy bottom (no feet)
    for(let i=0;i<6;i++){
      const wy=24+cy+((i+f)%3);
      px(ctx,10+i*2,wy,'rgba(90,80,64,.5)');
    }
    // Head
    rect(ctx,12,5+cy,8,8,skin);
    // Beard
    rect(ctx,13,10+cy,6,4,beard);
    // Eyes (ghostly white)
    if(dir!==3){
      px(ctx,14,8+cy,'#ffffff'); px(ctx,17,8+cy,'#ffffff');
    }
    // Fire-iron tool
    const fx=dir===1?7:24;
    vline(ctx,fx,8+cy,22+cy,iron);
    rect(ctx,fx-1,6+cy,3,3,iron);
    // Surrounding flames
    const flicker=f*1.5;
    circ(ctx,9,12+cy+Math.sin(flicker),2,flameDk);
    circ(ctx,23,14+cy+Math.cos(flicker),2,flame);
    circ(ctx,11,20+cy+Math.sin(flicker+1),1,flame);
    circ(ctx,21,10+cy+Math.cos(flicker+2),1,flameDk);
    // Floating tankard
    if(f%2===0){
      rect(ctx,dir===1?4:26,16+cy,3,4,'#c4960a');
    }
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,0,Math.round(Math.sin(f*1.57)*2));
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,0,Math.round(Math.sin(f*1.57)*2)+walkBob(f));
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,Math.round(Math.sin(f*0.8)*1));
      // Fire blast on attack
      if(f===2){
        circ(tc,16,10,4,'rgba(255,136,0,.5)');
        circ(tc,16,10,2,'rgba(255,200,50,.6)');
      }
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,Math.round(Math.sin(f*1.2)*2));
      // Fire aura
      for(let i=0;i<f+1;i++){
        circ(tc,10+i*4,8+Math.sin(i+f)*3,2,'rgba(255,136,0,.3)');
      }
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.25;
    drawBody(tc,0,f,deathSlump(f),0);
    // Flames die
    if(f>=2) circ(tc,16,16,6-f,'rgba(255,136,0,.2)');
    endTile(tc);
  }
  registerAtlas('inn_revenant',cv);
}

// ════════════════════════════════════════════════════════
//  ROAD WRAITH — dark hooded rider on spectral horse, ghostly sword, teal mist
// ════════════════════════════════════════════════════════
function buildRoadWraith(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const cloak='#2a2a30', cloakEdge='#3a3a44', horse='#6a8a8a',
        horseLt='#88aaaa', eyes='#ff8800', sword='#aaddee',
        mist='rgba(100,180,180,.3)';

  function drawBody(ctx,dir,f,ofsY,swordOfs){
    const cy=2+ofsY;
    // Horse body
    rect(ctx,6,18+cy,20,6,horse);
    rect(ctx,8,17+cy,16,2,horseLt);
    // Horse legs (4, animated)
    const legPhase=f*0.8;
    rect(ctx,8,24+cy,3,4+(Math.sin(legPhase)>0?1:0),horse);
    rect(ctx,14,24+cy,3,4+(Math.cos(legPhase)>0?1:0),horse);
    rect(ctx,20,24+cy,3,4+(Math.sin(legPhase+1)>0?1:0),horse);
    // Horse head
    if(dir!==3){
      rect(ctx,3,16+cy,5,4,horse);
      px(ctx,4,17+cy,'#000'); // horse eye
    } else {
      rect(ctx,24,16+cy,5,4,horse);
    }
    // Rider cloak (dark mass)
    rect(ctx,10,6+cy,12,12,cloak);
    rect(ctx,9,8+cy,14,8,cloakEdge);
    // Hood
    rect(ctx,12,3+cy,8,5,cloak);
    rect(ctx,11,2+cy,10,2,'#1a1a20');
    // Orange eyes (glow from hood)
    if(dir!==3){
      px(ctx,14,5+cy,eyes); px(ctx,17,5+cy,eyes);
    }
    // Ghostly ice sword
    const sx=dir===1?5:25+swordOfs;
    vline(ctx,sx,2+cy,16+cy,sword);
    px(ctx,sx,1+cy,'#cceeFF'); // gleam
    // Teal mist around hooves
    circ(ctx,10,28+cy,2,mist);
    circ(ctx,22,28+cy,2,mist);
    if(f%2===0) circ(ctx,16,29+cy,3,mist);
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2) rect(tc,20,3,8,2,'rgba(170,221,238,.6)');
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,0,0);
      if(f>=1) circ(tc,16,8,f+2,'rgba(100,180,180,.25)');
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),0);
    circ(tc,16,20,4+f,mist);
    endTile(tc);
  }
  registerAtlas('road_wraith',cv);
}

// ════════════════════════════════════════════════════════
//  CROWNED SHADE — shadow sorcerer, black body, gold crown, purple scepter
// ════════════════════════════════════════════════════════
function buildCrownedShade(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const body='#1a1a22', robePurp='#2a1a3a', crown='#c4960a',
        eyes='#aa44ff', scepter='#5a4a30', orb='#8844cc',
        goldTrim='#c4960a';

  function drawBody(ctx,dir,f,ofsY,scepterOfs){
    const cy=4+ofsY;
    // Dark body (shadow mass)
    rect(ctx,10,12+cy,12,14,body);
    rect(ctx,9,16+cy,14,8,robePurp);
    // Gold trim
    hline(ctx,10,21,12+cy,goldTrim);
    hline(ctx,9,22,25+cy,goldTrim);
    // Wispy shadow edges
    for(let i=0;i<5;i++){
      px(ctx,8+i*3,26+cy+(f+i)%2,'rgba(26,26,34,.6)');
    }
    // Head (dark, featureless except eyes)
    rect(ctx,12,4+cy,8,8,body);
    // Crown
    rect(ctx,11,2+cy,10,3,crown);
    px(ctx,13,1+cy,crown); px(ctx,16,0+cy,crown); px(ctx,19,1+cy,crown);
    // Eyes (purple glow)
    if(dir!==3){
      px(ctx,14,7+cy,eyes); px(ctx,17,7+cy,eyes);
      px(ctx,13,8+cy,'rgba(170,68,255,.3)'); px(ctx,18,8+cy,'rgba(170,68,255,.3)');
    }
    // Scepter with purple orb
    const sx=dir===1?6:24+scepterOfs;
    vline(ctx,sx,3+cy,22+cy,scepter);
    circ(ctx,sx,2+cy,2,orb);
    // Inner orb glow
    if(f%2===0) px(ctx,sx,2+cy,'#cc88ff');
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2) circ(tc,24,4,3,'rgba(136,68,204,.5)');
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      // Purple energy rings
      if(f>=1){
        const a=f*1.2;
        for(let i=0;i<f;i++){
          circ(tc,16+Math.cos(a+i*2)*5,10+Math.sin(a+i*2)*4,1,'rgba(170,68,255,.4)');
        }
      }
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.25;
    drawBody(tc,0,f,deathSlump(f),0);
    circ(tc,16,14,3+f,'rgba(170,68,255,.2)');
    endTile(tc);
  }
  registerAtlas('crowned_shade',cv);
}

// ════════════════════════════════════════════════════════
//  BARROW SPECTER — ghostly screaming apparition, tattered hood, wispy body
// ════════════════════════════════════════════════════════
function buildBarrowSpecter(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const body='#a0b8cc', bodyDk='#7090a8', hood='#5a6a7a',
        mouth='#1a2a3a', hands='#8aa0b8', glow='rgba(100,160,200,.3)';

  function drawBody(ctx,dir,f,ofsY,float){
    const cy=4+ofsY+float;
    // Wispy ghostly body (no legs)
    rect(ctx,10,12+cy,12,10,body);
    rect(ctx,11,14+cy,10,6,bodyDk);
    // Tattered bottom (wisps)
    for(let i=0;i<6;i++){
      const wy=22+cy+((i+f)%3);
      rect(ctx,9+i*2,wy,2,2+(i+f)%2,'rgba(160,184,204,.4)');
    }
    // Hood
    rect(ctx,11,3+cy,10,9,hood);
    rect(ctx,12,2+cy,8,3,'#4a5a6a');
    // Dark gaping mouth
    if(dir!==3){
      rect(ctx,14,8+cy,4,4,mouth);
      // Hollow eyes
      px(ctx,13,6+cy,'#ddeeff'); px(ctx,18,6+cy,'#ddeeff');
    }
    // Grasping clawed hands
    const hx1=dir===1?7:23;
    const hx2=dir===1?5:25;
    rect(ctx,hx1,14+cy,2,3,hands);
    px(ctx,hx2,14+cy,hands); px(ctx,hx2,16+cy,hands); // claws
    // Blue glow around
    circ(ctx,16,16+cy,8,glow);
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,0,Math.round(Math.sin(f*1.57)*2));
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),Math.round(Math.sin(f*1.3)*2));
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,Math.round(Math.sin(f*0.8)));
      // Spectral scream attack
      if(f===2){
        circ(tc,16,8,5,'rgba(160,200,230,.4)');
        circ(tc,16,8,3,'rgba(200,230,255,.5)');
      }
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,Math.round(Math.sin(f*1.0)*2));
      if(f>=1) circ(tc,16,12,f*2,'rgba(100,160,200,.2)');
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.3;
    drawBody(tc,0,f,deathSlump(f),0);
    endTile(tc);
  }
  registerAtlas('barrow_specter',cv);
}

// ════════════════════════════════════════════════════════
//  GREAT TROLL — massive green troll, warty, tusks, wooden club
// ════════════════════════════════════════════════════════
function buildGreatTroll(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const skin='#6a8a3a', skinDk='#4a6a2a', tusk='#d0c8a0',
        eyes='#ff4400', loin='#6a4a20', club='#7a5a30',
        clubStud='#4a4a4a', wart='#5a7a2a';

  function drawBody(ctx,dir,f,ofsY,clubSwing){
    const cy=2+ofsY;
    // Big bulky body
    rect(ctx,7,10+cy,18,14,skin);
    rect(ctx,8,12+cy,16,10,skinDk);
    // Loincloth
    rect(ctx,10,22+cy,12,4,loin);
    hline(ctx,10,21,22+cy,'#5a3a10');
    // Thick legs
    rect(ctx,9,26+cy,5,4,skin);
    rect(ctx,18,26+cy,5,4,skin);
    // Warty bumps
    px(ctx,10,12+cy,wart); px(ctx,20,14+cy,wart); px(ctx,14,18+cy,wart);
    px(ctx,8,16+cy,wart); px(ctx,22,11+cy,wart);
    // Big head
    rect(ctx,10,3+cy,12,8,skin);
    rect(ctx,11,2+cy,10,2,skinDk);
    // Eyes (red-orange, small & angry)
    if(dir!==3){
      px(ctx,13,5+cy,eyes); px(ctx,18,5+cy,eyes);
      // Brow ridge
      hline(ctx,12,14,4+cy,skinDk);
      hline(ctx,17,19,4+cy,skinDk);
    }
    // Tusks
    if(dir!==3){
      px(ctx,12,9+cy,tusk); px(ctx,19,9+cy,tusk);
      px(ctx,12,10+cy,tusk); px(ctx,19,10+cy,tusk);
    }
    // Ears
    px(ctx,9,5+cy,skin); px(ctx,22,5+cy,skin);
    // Club (studded, thick)
    const cx=dir===1?4:25+clubSwing;
    rect(ctx,cx,4+cy,3,18,club);
    // Studs
    px(ctx,cx+1,6+cy,clubStud); px(ctx,cx+1,10+cy,clubStud);
    px(ctx,cx+1,14+cy,clubStud);
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2){
        // Club smash impact
        rect(tc,20,24,8,3,'rgba(139,69,19,.4)');
        circ(tc,24,26,3,'rgba(100,80,40,.3)');
      }
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      // Enrage aura
      if(f>=1) circ(tc,16,14,f*2,'rgba(255,68,0,.15)');
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),f);
    endTile(tc);
  }
  registerAtlas('great_troll',cv);
}

// ════════════════════════════════════════════════════════
//  GOBLIN KING — fat goblin, gray-green skin, gold crown, bone scepter, crimson cape
// ════════════════════════════════════════════════════════
function buildGoblinKing(){
  const cv=makeCanvas(), c=cv.getContext('2d');
  const skin='#7a8a6a', skinDk='#5a6a4a', crown='#c4960a',
        cape='#8a2030', bone='#d0c8a0', skull='#c8c0a8',
        eyes='#cc2200', belt='#4a3a20';

  function drawBody(ctx,dir,f,ofsY,scepterSwing){
    const cy=4+ofsY;
    // Fat wide body
    rect(ctx,8,12+cy,16,12,skin);
    rect(ctx,9,14+cy,14,8,skinDk);
    // Cape (behind on sides)
    if(dir===0||dir===1){
      rect(ctx,7,12+cy,3,12,cape);
    }
    if(dir===0||dir===2){
      rect(ctx,22,12+cy,3,12,cape);
    }
    if(dir===3){
      rect(ctx,8,12+cy,16,12,cape); // full cape from behind
    }
    // Belt with skull buckle
    hline(ctx,8,23,22+cy,belt);
    if(dir!==3) rect(ctx,14,21+cy,4,3,skull);
    // Skull details
    if(dir!==3){
      px(ctx,15,22+cy,'#000'); px(ctx,17,22+cy,'#000');
    }
    // Short stumpy legs
    rect(ctx,10,24+cy,4,4,skin);
    rect(ctx,18,24+cy,4,4,skin);
    // Big round head
    rect(ctx,10,4+cy,12,9,skin);
    rect(ctx,11,3+cy,10,2,skinDk);
    // Pointy ears
    px(ctx,8,6+cy,skin); px(ctx,7,5+cy,skin);
    px(ctx,23,6+cy,skin); px(ctx,24,5+cy,skin);
    // Crown (gold, sitting on big head)
    rect(ctx,10,1+cy,12,3,crown);
    px(ctx,11,0+cy,crown); px(ctx,15,0+cy,crown); px(ctx,20,0+cy,crown);
    // Eyes (beady, mean)
    if(dir!==3){
      px(ctx,13,7+cy,eyes); px(ctx,18,7+cy,eyes);
      // Wide grinning mouth
      hline(ctx,13,19,10+cy,'#2a1a0a');
    }
    // Bone scepter with skull top
    const sx=dir===1?4:26+scepterSwing;
    vline(ctx,sx,4+cy,20+cy,bone);
    rect(ctx,sx-1,2+cy,3,3,skull);
    // Skull face on scepter
    px(ctx,sx-1,3+cy,'#000'); px(ctx,sx+1,3+cy,'#000');
  }

  for(let dir=0;dir<4;dir++){
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir);
      drawBody(tc,dir,f,Math.round(Math.sin(f*1.57)*.5),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+4);
      drawBody(tc,dir,f,walkBob(f),0);
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+8);
      drawBody(tc,dir,f,0,atkSwing(f));
      if(f===2) rect(tc,24,8,4,3,'rgba(200,192,168,.5)');
      endTile(tc);
    }
    for(let f=0;f<4;f++){
      const tc=tileCtx(c,f,dir+12);
      drawBody(tc,dir,f,-1,0);
      // Summon goblins aura
      if(f>=1){
        for(let i=0;i<f;i++){
          circ(tc,10+i*6,20,2,'rgba(122,138,106,.3)');
        }
      }
      endTile(tc);
    }
  }
  for(let f=0;f<4;f++){
    const tc=tileCtx(c,f,16);
    tc.globalAlpha=1-f*0.2;
    drawBody(tc,0,f,deathSlump(f),0);
    // Crown falls off
    if(f>=2) rect(tc,18+f*2,4+deathSlump(f),4,2,crown);
    endTile(tc);
  }
  registerAtlas('goblin_king',cv);
}

// ── Build all atlases ──
buildGravedigger();
buildWightLord();
buildForestHag();
buildBarrowElder();
buildInnRevenant();
buildRoadWraith();
buildCrownedShade();
buildBarrowSpecter();
buildGreatTroll();
buildGoblinKing();

console.log('[14-sprites] 10 pilot creature atlases registered.');

// loadAll() was already called in 03-main.js before this file ran,
// so re-call it to load the newly registered spritesheets.
SpriteAtlasManager.loadAll();

})();
