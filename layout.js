export function clampPosition(x,y,w,h,viewportWidth,viewportHeight){return {x:Math.max(8,Math.min(viewportWidth-w-8,x)),y:Math.max(8,Math.min(viewportHeight-h-8,y))};}
export function enableLayoutEditor(){
  const stage=document.querySelector('#stage'),menu=document.querySelector('#settings'),bar=document.querySelector('#layoutToolbar');
  const ids=['stick','interact','dash','survivorHud','objectiveHud','settingsButton'];
  let editing=false,drag=null,saved={},selected=null;
  const slider=document.querySelector('#layoutSize'),value=document.querySelector('#layoutSizeValue');
  const key=()=> 'fogbound-layout-v1-'+(innerWidth>innerHeight?'landscape':'portrait');
  const load=()=>{try{saved=JSON.parse(localStorage.getItem(key())||'{}')||{};}catch{saved={};}for(const id of ids){const el=document.getElementById(id),p=saved[id];el.classList.remove('customPosition');el.style.left='';el.style.top='';el.style.scale=String(Math.max(.6,Math.min(1.6,p?.scale||1)));el.style.transformOrigin='top left';if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){const r=el.getBoundingClientRect(),pos=clampPosition(p.x*innerWidth,p.y*innerHeight,r.width,r.height,innerWidth,innerHeight);el.classList.add('customPosition');el.style.left=pos.x+'px';el.style.top=pos.y+'px';}}};
  slider.oninput=()=>{if(!selected)return;const scale=Number(slider.value)/100;selected.style.scale=String(scale);value.textContent=slider.value+'%';const r=selected.getBoundingClientRect(),p=clampPosition(r.left,r.top,r.width,r.height,innerWidth,innerHeight);selected.classList.add('customPosition');selected.style.left=p.x+'px';selected.style.top=p.y+'px';saved[selected.id]={x:p.x/innerWidth,y:p.y/innerHeight,scale};};
  document.querySelector('#editLayout').onclick=()=>{editing=true;stage.classList.add('layoutEditing');menu.hidden=false;bar.hidden=false;ids.forEach(id=>{const e=document.getElementById(id);e.dataset.layoutItem='true';});};
  stage.addEventListener('pointerdown',e=>{if(!editing)return;const el=e.target.closest('[data-layout-item]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();selected=el;slider.value=String(Math.round((Number(el.style.scale)||1)*100));value.textContent=slider.value+'%';document.querySelector('#layoutSelected').textContent=({stick:'摇杆',interact:'交互',dash:'技能',survivorHud:'角色状态',objectiveHud:'目标',settingsButton:'设置'})[el.id];const r=el.getBoundingClientRect();drag={el,id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};el.setPointerCapture(e.pointerId);},true);
  stage.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const r=drag.el.getBoundingClientRect(),p=clampPosition(e.clientX-drag.dx,e.clientY-drag.dy,r.width,r.height,innerWidth,innerHeight);drag.el.classList.add('customPosition');drag.el.style.left=p.x+'px';drag.el.style.top=p.y+'px';saved[drag.el.id]={x:p.x/innerWidth,y:p.y/innerHeight,scale:Number(drag.el.style.scale)||1};},true);
  for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{if(drag?.id===e.pointerId){e.stopImmediatePropagation();drag=null;}},true);
  document.querySelector('#saveLayout').onclick=()=>{try{localStorage.setItem(key(),JSON.stringify(saved));}catch{}editing=false;stage.classList.remove('layoutEditing');bar.hidden=true;menu.hidden=false;};
  document.querySelector('#resetLayout').onclick=()=>{try{localStorage.removeItem(key());}catch{}saved={};load();};
  window.addEventListener('resize',()=>{drag=null;load();});load();
  return ()=>editing;
}
