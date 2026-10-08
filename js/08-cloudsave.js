// ── CLOUD SAVE SYSTEM ────────────────────────────────────────────────────
var CloudSave={
  user:null,
  token:null,
  enabled:false,
  
  async init(){
    if(window.netlifyIdentity){
      window.netlifyIdentity.on('init', user=>{
        this.user=user;
        this.enabled=!!user;
        if(user){
          this.token=user.token.access_token;
          this._updateUI();
        }
      });
      
      window.netlifyIdentity.on('login', user=>{
        this.user=user;
        this.token=user.token.access_token;
        this.enabled=true;
        this._updateUI();
        if(window.showToast) showToast('☁️ Cloud save enabled!');
      });
      
      window.netlifyIdentity.on('logout', ()=>{
        this.user=null;
        this.token=null;
        this.enabled=false;
        this._updateUI();
        if(window.showToast) showToast('Logged out');
      });
      
      window.netlifyIdentity.init();
    }
  },
  
  openLoginModal(){
    if(window.netlifyIdentity) window.netlifyIdentity.open();
  },
  
  async saveToCloud(gameStateJson){
    if(!this.enabled||!this.user) return false;
    try{
      const response=await fetch('/.netlify/functions/save-game', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+this.token
        },
        body:JSON.stringify({
          userId:this.user.id,
          saveData:gameStateJson,
          timestamp:new Date().toISOString()
        })
      });
      return response.ok;
    }catch(err){
      console.error('Cloud save error:', err);
      return false;
    }
  },
  
  async loadFromCloud(){
    if(!this.enabled||!this.user) return null;
    try{
      const response=await fetch('/.netlify/functions/load-game', {
        method:'GET',
        headers:{'Authorization':'Bearer '+this.token}
      });
      if(!response.ok) return null;
      const data=await response.json();
      return data.saveData;
    }catch(err){
      console.error('Cloud load error:', err);
      return null;
    }
  },
  
  _updateUI(){
    const btn=document.getElementById('cloudLoginBtn');
    const stat=document.getElementById('cloudStatus');
    if(btn){
      if(this.enabled){
        btn.textContent='☁️ '+(this.user.user_metadata.name||this.user.email);
        btn.classList.add('logged-in');
      }else{
        btn.textContent='☁️ Login';
        btn.classList.remove('logged-in');
      }
    }
    if(stat){
      stat.textContent=this.enabled?'☁️ Cloud':'Local';
      stat.classList.toggle('cloud-active', this.enabled);
    }
  }
};

const _originalSaveGame=window.savegame;
window.savegame=async function(){
  if(_originalSaveGame) _originalSaveGame.call(window);
  if(CloudSave.enabled&&window.GS){
    const saveJson=JSON.stringify(window.GS);
    await CloudSave.saveToCloud(saveJson);
  }
};

const _originalLoadGame=window.loadgame;
window.loadgame=async function(){
  let loadedData=null;
  if(CloudSave.enabled){
    loadedData=await CloudSave.loadFromCloud();
  }
  if(!loadedData&&_originalLoadGame){
    _originalLoadGame.call(window);
    return;
  }
  if(loadedData){
    try{
      window.GS=JSON.parse(loadedData);
    }catch(err){
      console.error('Cloud load parse error:', err);
      if(_originalLoadGame) _originalLoadGame.call(window);
    }
  }
};

document.addEventListener('DOMContentLoaded', function(){
  CloudSave.init();
  const btn=document.getElementById('cloudLoginBtn');
  if(btn) btn.addEventListener('click', ()=>CloudSave.openLoginModal());
});

