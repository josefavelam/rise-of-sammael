function _fsLockOrientation(){
  if(screen.orientation&&screen.orientation.lock){
    screen.orientation.lock('landscape').catch(function(){});
  }
}
function _fsEnter(){
  var el=document.documentElement;
  var req=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
  if(req){ req.call(el).then(_fsLockOrientation).catch(_fsLockOrientation); }
  else { _fsLockOrientation(); }
}
document.addEventListener('fullscreenchange', _fsLockOrientation);
document.addEventListener('webkitfullscreenchange', _fsLockOrientation);

// ── PORTRAIT MODE DETECTION FOR MOBILE ────────────────────────────────────
function _isMobileDevice(){
  // Check for mobile user agents and touch support
  const isTouchDevice=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  const isMobileUA=/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
  return isTouchDevice&&(window.innerWidth<900||isMobileUA);
}

function _checkPortraitMode(){
  const overlay=document.getElementById('portraitOverlay');
  if(!overlay)return;
  
  // Only show portrait warning on mobile devices
  if(!_isMobileDevice()){
    overlay.classList.remove('active');
    return;
  }
  
  // Check if in portrait mode (height > width)
  const isPortrait=window.innerHeight>window.innerWidth;
  if(isPortrait){
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

// Check on load and listen for orientation changes
window.addEventListener('load', function(){
  _fsLockOrientation();
  _checkPortraitMode();
});

// Listen for orientation changes
window.addEventListener('orientationchange', function(){
  _checkPortraitMode();
}, false);

// Also listen for resize in case dimensions change
window.addEventListener('resize', function(){
  _checkPortraitMode();
}, false);

