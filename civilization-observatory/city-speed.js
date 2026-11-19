/* Adjustable, persisted simulation speed.  The core city still owns its
   ten-minute simulation step; this layer only adds the requested elapsed time
   between core sync ticks, keeping the original save format compatible. */
(function(root){
  const BASE=1000, SPEEDS=[1000,10000,100000];
  const SPEED_KEY='unseen-one-city-speed-v1', SAVE_KEY='unseen-one-city-v1';
  let state=null, lastTick=Date.now(), hidden=false, pending=readSavedSpeed();

  function normalize(value){
    const n=Number(value);
    return SPEEDS.includes(n)?n:BASE;
  }
  function readSavedSpeed(){
    try{return normalize(root.localStorage?.getItem(SPEED_KEY))}catch{return BASE}
  }
  function extraElapsed(milliseconds,speed){
    return Math.max(0,Number(milliseconds)||0)*(normalize(speed)-BASE);
  }
  function ensure(s){
    if(!s)return pending;
    s.speed=normalize(s.speed??pending);pending=s.speed;return s.speed;
  }
  function persistSpeed(speed){
    try{root.localStorage?.setItem(SPEED_KEY,String(normalize(speed)))}catch{/* storage may be full */}
  }
  function persistState(){
    if(!state)return;
    try{root.localStorage?.setItem(SAVE_KEY,JSON.stringify(state))}catch{/* core UI reports storage exhaustion */}
  }
  function applyExtra(s,milliseconds){
    if(!s)return 0;
    const extra=extraElapsed(milliseconds,ensure(s));
    s.elapsed=Math.max(0,(Number(s.elapsed)||0)+extra);
    return extra;
  }
  function applyCheckpoint(s,now){
    const checkpoint=Number(s.speedCheckpoint);
    if(!checkpoint||checkpoint>now){return 0}
    s.speedCheckpoint=0;
    return applyExtra(s,now-checkpoint);
  }
  function boost(now=Date.now(),save=false){
    if(!state){lastTick=now;return 0}
    const gained=applyExtra(state,now-lastTick);lastTick=now;
    if(save)persistState();
    return gained;
  }
  function label(speed){return '세계 시간 ×'+normalize(speed).toLocaleString('en-US')}
  function setSpeed(value){
    const now=Date.now();boost(now);pending=normalize(value);
    if(state)state.speed=pending;persistSpeed(pending);lastTick=now;updateUI();
    return pending;
  }
  function updateUI(){
    if(!root.document||!document.querySelector)return;
    const speed=state?ensure(state):pending;
    const picker=document.getElementById('speedPicker'),pill=document.querySelector('.controls .pill');
    if(picker)picker.value=String(speed);
    if(pill)pill.textContent=label(speed);
  }
  function inject(){
    if(!root.document||!document.querySelector||document.getElementById('speedPicker'))return;
    const controls=document.querySelector('.controls');if(!controls)return;
    const labelEl=document.createElement('label');labelEl.className='speedControl';labelEl.htmlFor='speedPicker';labelEl.textContent='시간';
    const picker=document.createElement('select');picker.id='speedPicker';picker.setAttribute('aria-label','시간 흐름 배율');picker.title='선택한 배율은 화면을 닫았다가 다시 열 때의 시간 계산에도 적용됩니다.';
    for(const speed of SPEEDS){const option=document.createElement('option');option.value=String(speed);option.textContent='×'+speed.toLocaleString('en-US');picker.append(option)}
    picker.value=String(pending);picker.addEventListener('change',()=>setSpeed(picker.value));labelEl.append(picker);controls.prepend(labelEl);
    for(const hint of document.querySelectorAll('.hint'))if(hint.textContent.startsWith('세계 시간은 현실의 1,000배입니다.'))hint.textContent='시간 선택에서 ×1,000·×10,000·×100,000을 고를 수 있습니다. 걸음을 알아볼 수 있도록 이동 장면은 부드럽게 보간하며, 화면을 닫았던 기간도 선택한 배율로 계산합니다.';
    const style=document.createElement('style');style.textContent='.speedControl{display:inline-flex;align-items:center;gap:5px;color:#b9cdca;font-size:12px;white-space:nowrap}.speedControl select{padding:7px 8px;font-size:13px;background:#20343a;border-radius:7px}@media(max-width:550px){.speedControl{margin-top:8px}}';document.head.append(style);updateUI();
  }
  function attach(){
    if(root.__citySpeedAttached||!root.CityWorld)return;root.__citySpeedAttached=true;
    const originalBefore=root.CityWorld.beforeStep;
    root.CityWorld.beforeStep=function(s){
      state=s;ensure(s);applyCheckpoint(s,Date.now());lastTick=Date.now();
      return originalBefore.call(this,s);
    };
    inject();
    if(typeof root.setInterval==='function')root.setInterval(()=>{if(!hidden)boost(Date.now())},100);
    if(typeof root.addEventListener==='function'){
      root.addEventListener('visibilitychange',()=>{
        if(root.document?.visibilityState==='hidden'){
          hidden=true;boost(Date.now());if(state){state.speedCheckpoint=Date.now();persistState()}
        }else{hidden=false;lastTick=Date.now()}
      });
      root.addEventListener('pagehide',()=>{boost(Date.now());if(state){state.speedCheckpoint=Date.now();persistState()}});
    }
  }
  const api={BASE,SPEEDS,normalize,extraElapsed,applyExtra,setSpeed,attach};
  root.CitySpeed=api;if(typeof module!=='undefined')module.exports=api;
  if(root.document)attach();
})(globalThis);
