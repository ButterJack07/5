export function survivorStatus(actor,chairState){
  const chairActor=chairState?.actors?.find(a=>a.id===actor.id);
  if(chairActor?.eliminated||actor.eliminated)return {kind:'eliminated',label:'淘汰',progress:1};
  if(actor.escaped)return {kind:'escaped',label:'逃脱',progress:0};
  if(chairActor?.seated!=null){const chair=chairState.chairs.find(c=>c.id===chairActor.seated);return {kind:'seated',label:'上椅',progress:Math.max(0,Math.min(1,(chair?.progress||0)/60))};}
  if(chairState?.carried===actor.id)return {kind:'carried',label:'气球上',progress:0};
  if(actor.health<=0)return {kind:'downed',label:'倒地',progress:0};
  if(actor.health===1)return {kind:'injured',label:'受伤',progress:0};
  return {kind:'healthy',label:'健康',progress:0};
}
const poses={healthy:'M22 19v17m0-10-8 9m8-9 8 9m-8 1-7 13m7-13 7 13',injured:'M22 19l-3 17m1-10-8 5m8-5 10 5m-11 5-8 11m8-11 10 10',downed:'M16 30l14 6m-11-5-7 8m9-6 8-6m1 9 9 5',carried:'M22 19v16m0-10-9-8m9 8 9-8m-9 18-7 8m7-8 7 8',seated:'M21 19v15h11v12m-11-19h9m-13 8v11m-5-24v18h22'};
export function renderTeam(root,actors,chairState){
  const ids=actors.map(a=>a.id).join('|');
  if(root.dataset.ids!==ids){
    root.replaceChildren();
    root.dataset.ids=ids;
    for(const a of actors){
      const card=document.createElement('div');
      card.className='teamMember';
      card.dataset.id=a.id;
      card.innerHTML='<div class="teamPortrait"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="chairRingBase" cx="26" cy="26" r="24"/><circle class="chairRing" cx="26" cy="26" r="24"/><path class="halfMarker" d="M1 26h7m36 0h7"/><circle class="poseHead" cx="22" cy="13" r="4"/><path class="poseBody"/><path class="eliminatedCross" d="M10 10l32 32M42 10L10 42"/><rect class="escapeFrame" x="6" y="4" width="40" height="44" rx="3"/></svg></div><span class="teamName"></span><small class="teamLabel"></small>';
      card._teamName=card.querySelector('.teamName');
      card._teamLabel=card.querySelector('.teamLabel');
      card._poseBody=card.querySelector('.poseBody');
      card._chairRing=card.querySelector('.chairRing');
      root.appendChild(card);
    }
  }
  for(let i=0;i<actors.length;i++){
    const a=actors[i],s=survivorStatus(a,chairState),card=root.children[i];
    const progInt=Math.floor(s.progress*100);
    const key=`${s.kind}_${a.nickname}_${progInt}`;
    if(card._cachedKey===key)continue;
    card._cachedKey=key;
    card.dataset.state=s.kind;
    (card._teamName||card.querySelector('.teamName')).textContent=a.nickname||'求生者';
    (card._teamLabel||card.querySelector('.teamLabel')).textContent=s.label+(s.kind==='seated'?' '+progInt+'%':'');
    (card._poseBody||card.querySelector('.poseBody')).setAttribute('d',poses[s.kind]||poses.healthy);
    (card._chairRing||card.querySelector('.chairRing')).style.strokeDasharray=`${s.progress*150.8} 150.8`;
    card.title=s.kind==='seated'?(s.progress<.5?'未过半：救下后再次上椅从0%开始':'已过半：救下后再次上椅立即淘汰'):s.label;
  }
}
