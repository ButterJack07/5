// Archived object and match prototype; disabled while the terrain is redesigned.
import {ParkMatch, parkLandmarks} from './amusement-park.js';
import {walls, obstacles, distance} from './game.js';
import {renderTeam} from './team-status.js';

const $=s=>document.querySelector(s),canvas=$('#park'),ctx=canvas.getContext('2d');
let match,me,keys={},overview=false,carousel=true,clock=0,last=0,acc=0,held=false;
let origin={x:0,y:0},scale=3,width=0,height=0;
let zoom=1,carouselPhase=0;
let joystick={x:0,y:0},joystickPointer=null;
const labelPool=[];let labelCount=0;
function start(){
  match=new ParkMatch();me=match.actors.find(a=>a.id==='player');
  // A guided starting area: cipher and searchable chest within walking distance.
  Object.assign(me.sim.player,{x:38,y:38,z:0});
  const friend=match.actors.find(a=>a.bot&&a.role==='survivor');
  Object.assign(friend.sim.player,{x:43,y:41,z:0});friend.sim.health=1;
  acc=0;keys={};held=false;$('#notice').hidden=true;
}
function p(x,y,z=0){return {x:origin.x+(x-y)*.866*scale,y:origin.y+(x+y)*.5*scale-z*scale};}
function polygon(points,color){ctx.beginPath();points.forEach((v,i)=>{const q=p(...v);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function line(a,b,color,width=1){const u=p(...a),v=p(...b);ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function box(x,y,w,d,h,color,base=0){
  const a=x-w/2,b=y-d/2;
  polygon([[a,b+d,base],[a+w,b+d,base],[a+w,b+d,base+h],[a,b+d,base+h]],color);
  polygon([[a+w,b,base],[a+w,b+d,base],[a+w,b+d,base+h],[a+w,b,base+h]],shade(color,-24));
  polygon([[a,b,base+h],[a+w,b,base+h],[a+w,b+d,base+h],[a,b+d,base+h]],shade(color,22));
}
function shade(color,amount){
  const n=parseInt(color.slice(1),16);
  const channel=s=>Math.max(0,Math.min(255,((n>>s)&255)+amount)).toString(16).padStart(2,'0');
  return '#'+channel(16)+channel(8)+channel(0);
}
function wallModel(w){
  const h=w.manor?5:w.h||4,x=w.x,y=w.y,a=x-w.w/2,b=y-w.d/2;
  const near=distance(me.sim.player,w)<11&&x+y>me.sim.player.x+me.sim.player.y;
  ctx.save();if(near)ctx.globalAlpha=.32;
  box(x,y,w.w,w.d,h,w.manor?'#736554':'#8b8978');
  // Mortar follows both visible wall faces rather than floating screen stripes.
  for(let z=.65;z<h;z+=.7){
    line([a,b+w.d,z],[a+w.w,b+w.d,z],'#635e53',.6);
    line([a+w.w,b,z],[a+w.w,b+w.d,z],'#514e46',.6);
    for(let u=.6+(Math.round(z/.7)%2)*.65;u<w.w;u+=1.4)line([a+u,b+w.d,z],[a+u,b+w.d,Math.min(h,z+.7)],'#655e51',.5);
    for(let v=.6;v<w.d;v+=1.4)line([a+w.w,b+v,z],[a+w.w,b+v,Math.min(h,z+.7)],'#514e46',.5);
  }
  box(x,y,w.w+.12,w.d+.12,.18,'#ada691',h);
  box(x,y,w.w+.08,w.d+.08,.3,'#596457');
  ctx.restore();
}
function disc(x,y,z,r,color){const q=p(x,y,z);ctx.beginPath();ctx.ellipse(q.x,q.y,r*scale,r*scale*.5,0,0,7);ctx.fillStyle=color;ctx.fill();}
function text(x,y,z,t,color='#eadbb1'){
  const q=p(x,y,z);if(q.x<0||q.x>width||q.y<0||q.y>height)return;
  let node=labelPool[labelCount];
  if(!node){node=document.createElement('span');$('#labels').appendChild(node);labelPool.push(node);}
  labelCount++;node.hidden=false;node.textContent=t;node.style.color=color;
  node.style.left=q.x/width*canvas.clientWidth+'px';node.style.top=q.y/height*canvas.clientHeight+'px';
}
function actor(a){
  if(a.escaped||a.eliminated)return;
  const h=a.role==='hunter',g=a.sim,v=h?g.hunter:g.player,z=v.z||0;
  disc(v.x,v.y,z,.9,'#13212788');
  const color=h?'#ba6550':a===me?'#e8d38c':g.health===1?'#c29071':'#80ad98';
  const down=!h&&g.health<=0;
  const previous=a._visualPrevious||{x:v.x,y:v.y};
  if(Math.hypot(v.x-previous.x,v.y-previous.y)>.015)a._visualMovingUntil=clock+.15;
  a._visualPrevious={x:v.x,y:v.y};
  const stride=(a._visualMovingUntil||0)>clock?Math.sin(clock*11)*.15:0;
  if(!down){
    box(v.x-.28,v.y,.35,.45,.65,'#3c4241',z+Math.max(0,stride));
    box(v.x+.28,v.y,.35,.45,.65,'#3c4241',z+Math.max(0,-stride));
  }
  box(v.x,v.y,1.05,.8,down?.5:1.15,color,z+(down?0:.65));
  box(v.x,v.y,.86,.78,.85,'#d3b698',z+(down?.5:1.8));
  box(v.x,v.y,.9,.82,.23,h?'#5c3d33':'#4c4035',z+(down?1.1:2.5));
  box(v.x-.68,v.y,.24,.35,.75,color,z+(down?.1:1));
  box(v.x+.68,v.y,.24,.35,.75,color,z+(down?.1:1));
  const q=p(v.x,v.y+.4,z+(down?.8:2.2));
  ctx.fillStyle='#44372f';ctx.fillRect(Math.round(q.x-2),Math.round(q.y),1,1);ctx.fillRect(Math.round(q.x+2),Math.round(q.y),1,1);
  if(h){line([v.x,v.y,z+2],[v.x+Math.sin(v.angle)*2,v.y+Math.cos(v.angle)*2,z+2],'#c19166',2);}
  text(v.x,v.y,z+4,h?'监管':a===me?'你':g.health<=0?'倒地':g.health===1?'受伤队友':'队友',color);
}
function landmark(l){
  const {x,y,kind}=l;
  if(kind==='wheel'){
    line([x-8,y,0],[x,y,24],'#af9b71',3);line([x+8,y,0],[x,y,24],'#af9b71',3);
    for(let i=0;i<20;i++){const a=i*Math.PI/10,b=(i+1)*Math.PI/10;
      const u=[x+Math.cos(a)*17,y,26+Math.sin(a)*17],v=[x+Math.cos(b)*17,y,26+Math.sin(b)*17];
      line(u,v,'#b78969',2);if(i%2===0){line([x,y,26],u,'#798e83');box(u[0],y,3,3,3,'#a56150',u[2]-3);}
    }
  }else if(kind==='carousel'){
    disc(x,y,0,12,'#684a3b');disc(x,y,1,11,'#baa474');
    const rotation=carouselPhase;
    for(let i=0;i<8;i++){
      const a=rotation+i*Math.PI/4,hx=x+Math.cos(a)*8,hy=y+Math.sin(a)*8;
      line([hx,hy,1],[hx,hy,13],'#d4b46d');box(hx,hy,2.4,1.2,1.3,'#d4b46d',5+Math.sin(a+carouselPhase*2)*.8);
      box(hx,hy,.9,1.3,.25,'#a85344',6.3+Math.sin(a+carouselPhase*2)*.8);
      box(hx+1,hy,.6,.6,2,'#d4b46d',6);line([hx-.7,hy,4],[hx-.7,hy,5],'#d4b46d');
    }
    for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;polygon([[x,y,21],[x+Math.cos(a)*14,y+Math.sin(a)*14,13],[x+Math.cos(b)*14,y+Math.sin(b)*14,13]],i%2?'#ad6350':'#d4b46d');}
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16,b=(i+1)*Math.PI/16;
      line([x+Math.cos(a)*14,y+Math.sin(a)*14,13],[x+Math.cos(b)*14,y+Math.sin(b)*14,13],'#865d46',2);
      const lamp=p(x+Math.cos(a)*14,y+Math.sin(a)*14,12.7);ctx.fillStyle=i%2?'#e9ce8b':'#bb8357';ctx.fillRect(Math.round(lamp.x),Math.round(lamp.y),2,2);
    }
  }else if(kind==='coaster'){
    for(let i=0;i<14;i++){const xx=x-18+i*3,z=7+Math.sin(i*.6)*4;line([xx,y,0],[xx,y,z],'#6e7b70');line([xx,y,z],[xx+3,y,7+Math.sin((i+1)*.6)*4],'#be8760',2);line([xx,y+4,z],[xx+3,y+4,7+Math.sin((i+1)*.6)*4],'#be8760');}
  }else{box(x,y,8,6,6,'#936b53');box(x,y,10,8,1,'#ad6350',6);}
  text(x,y,kind==='wheel'?46:kind==='carousel'?24:14,l.name);
}
function render(){
  labelCount=0;
  const w=canvas.clientWidth,h=canvas.clientHeight;const rw=Math.max(1,Math.floor(w/1.25)),rh=Math.max(1,Math.floor(h/1.25));
  if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh;}width=rw;height=rh;
  ctx.fillStyle='#283e46';ctx.fillRect(0,0,width,height);
  scale=overview?Math.min(width/360,height/230):Math.max(5,Math.min(10,width/85))*zoom;
  const focus=overview?{x:100,y:100}:me.sim.player;
  origin={x:width/2-(focus.x-focus.y)*.866*scale,y:height*.54-(focus.x+focus.y)*.5*scale};
  polygon([[0,0,0],[200,0,0],[200,200,0],[0,200,0]],'#576b50');
  for(const [a,b,c,d] of [[4,46,196,56],[4,142,196,152],[94,4,104,196]])polygon([[a,b,.05],[c,b,.05],[c,d,.05],[a,d,.05]],'#8b9275');
  // Dry canal with two intact bridges; visual dressing does not block routes.
  polygon([[68,4,.1],[78,4,.1],[78,196,.1],[68,196,.1]],'#3d5558');
  for(const y of [51,147])polygon([[65,y-6,.2],[81,y-6,.2],[81,y+6,.2],[65,y+6,.2]],'#aa9067');
  for(let i=0;i<100;i++){const x=5+(i*37)%190,y=5+(i*53)%190;disc(x,y,.1,.3,i%2?'#657659':'#718064');}
  const items=[];const add=(x,y,draw)=>{const q=p(x,y);if(q.x< -250||q.x>width+250||q.y< -100||q.y>height+500)return;items.push({depth:x+y,draw});};
  for(const wall of walls)add(wall.x,wall.y,()=>wallModel(wall));
  for(const o of obstacles)add(o.x,o.y,()=>{
    if(o.type==='tree'){
      disc(o.x,o.y,0,2,'#293e3444');box(o.x,o.y,.7,.7,5,'#77533e');
      for(let i=0;i<3;i++)polygon([[o.x-3+i*.6,o.y,3+i*2],[o.x,o.y+3-i*.6,3+i*2],[o.x+3-i*.6,o.y,3+i*2],[o.x,o.y,8+i*2]],['#344f3b','#405d43','#51694a'][i]);
      line([o.x+.2,o.y,1],[o.x+.2,o.y,4],'#a07852',.8);
    }else{box(o.x,o.y,o.w||3,o.d||2,o.h||2,'#879082');box(o.x-.25,o.y+.25,(o.w||3)*.6,(o.d||2)*.6,.15,'#687b54',o.h||2);}
  });
  for(const l of parkLandmarks)add(l.x,l.y,()=>landmark(l));
  for(const g of match.world.generators)add(g.x,g.y,()=>{box(g.x,g.y,2,2,2,g.p>=100?'#89c38c':'#b39c58');line([g.x-1,g.y,0],[g.x-1,g.y,7],'#a68553',2);text(g.x,g.y,8,Math.floor(g.p)+'%',g.p>=100?'#89c38c':'#ebce78');});
  for(const c of match.chairSystem.chairs)add(c.x,c.y,()=>{box(c.x,c.y,1.7,1.5,.8,'#9d514d');box(c.x,c.y-.7,1.7,.3,3,'#9d514d');if(c.occupant)text(c.x,c.y,5,'救援 '+Math.floor(c.progress/60*100)+'%','#f29d79');});
  for(const c of match.chests)add(c.x,c.y,()=>{
    box(c.x,c.y,2.2,1.6,.8,'#98734d');
    box(c.x,c.y-(c.opened?.65:0),2.3,c.opened?.25:1.7,c.opened?1.1:.45,'#ae8554',.85);
    box(c.x,c.y+.82,.3,.08,.25,'#d0b56f',.65);
    for(const offset of [-.75,.75])line([c.x+offset,c.y+.85,0],[c.x+offset,c.y+.85,1.2],'#514d43',1);
    text(c.x,c.y,3,c.opened?'已搜':'箱子');
  });
  for(const e of match.world.exits)add(e.x,e.y,()=>{box(e.x,e.y-4,1,1,7,'#9b9b7c');box(e.x,e.y+4,1,1,7,'#9b9b7c');if(e.p<100)box(e.x,e.y,1,7,5,'#5f705b');text(e.x,e.y,9,'大门 '+Math.floor(e.p)+'%',match.rules.powered?'#afd693':'#acb0a1');});
  for(const v of me.sim.windows)add(v.x,v.y,()=>{line([v.x-2,v.y,1],[v.x+2,v.y,1],'#77b0c1',3);});
  for(const v of match.world.pallets)if(!v.broken)add(v.x,v.y,()=>box(v.x,v.y,4,v.down?2:.6,v.down?.25:3,'#c39155'));
  if(match.rules.hatch){const v=match.rules.hatch;add(v.x,v.y,()=>{disc(v.x,v.y,.1,1.5,v.open?'#63baa9':'#756851');text(v.x,v.y,2,v.open?'地窖开启':'地窖');});}
  for(const a of match.actors)add(a.role==='hunter'?a.sim.hunter.x:a.sim.player.x,a.role==='hunter'?a.sim.hunter.y:a.sim.player.y,()=>actor(a));
  items.sort((a,b)=>a.depth-b.depth);for(const i of items)i.draw();
  // Compact top-down overview inset stays visible during follow mode.
  for(let i=labelCount;i<labelPool.length;i++)labelPool[i].hidden=true;
  drawRadar();
}
function drawRadar(){
  const radar=$('#radar'),r=radar.getContext('2d'),sz=radar.clientWidth,dpr=Math.min(devicePixelRatio||1,2);
  if(radar.width!==Math.round(sz*dpr)){radar.width=Math.round(sz*dpr);radar.height=Math.round(sz*dpr);}
  r.setTransform(dpr,0,0,dpr,0,0);r.clearRect(0,0,sz,sz);r.save();r.beginPath();r.arc(sz/2,sz/2,sz/2-3,0,7);r.clip();
  const factor=(sz-16)/200,offset=8;
  r.strokeStyle='#9aad9950';r.strokeRect(offset,offset,200*factor,200*factor);
  for(const w of walls){r.fillStyle='#80908166';r.fillRect(offset+(w.x-w.w/2)*factor,offset+(w.y-w.d/2)*factor,Math.max(1,w.w*factor),Math.max(1,w.d*factor));}
  for(const g of match.world.generators){r.fillStyle=g.p>=100?'#9ddc99':'#e5bd64';r.fillRect(offset+g.x*factor-1,offset+g.y*factor-1,3,3);}
  for(const e of match.world.exits){r.fillStyle='#b8d79b';r.fillRect(offset+e.x*factor-2,offset+e.y*factor-2,4,4);}
  const v=me.sim.player;r.fillStyle='#edf4d6';r.beginPath();r.arc(offset+v.x*factor,offset+v.y*factor,2.5,0,7);r.fill();r.restore();
}
function ui(){
  const g=me.sim,decoded=match.world.generators.filter(c=>c.p>=100).length;
  $('#hud').textContent=`${match.prepTime>0?'准备保护 '+Math.ceil(match.prepTime)+'s · ':''}密码机 ${decoded}/5 · ${g.health===2?'健康':g.health===1?'受伤':'倒地'} · ${me.parkItem?'药箱 ×1':'无道具'}`;
  renderTeam($('#teamStatus'),match.actors.filter(a=>a.role==='survivor').map(a=>({id:a.id,nickname:a.nickname,health:a.sim.health,escaped:a.escaped})),match.chairSnapshot());
  let prompt='探索游乐场 · 寻找密码机';
  const chest=match.chests.find(c=>!c.opened&&distance(c,g.player)<3);
  const healing=match.chairSystem.heals.get(me.id),rescue=match.chairSystem.rescues.get(me.id),search=match.searches.get(me.id);
  if(g.nearby&&distance(g.nearby,g.player)<6)prompt='E · '+({generator:'开始破译',pallet:'放下木板',palletVault:'翻板',window:'翻窗',exit:'按住开启大门'}[g.nearby.type]||'交互');
  if(match.actors.some(a=>a!==me&&a.role==='survivor'&&a.sim.health<2&&!a.eliminated&&!a.escaped&&distance(a.sim.player,g.player)<3))prompt='按住 E · 治疗队友';
  if(chest)prompt='按住 E · 搜索箱子（5秒，获得一次性药箱）';
  if(search)prompt='搜箱 '+Math.floor(search.time/5*100)+'%';
  if(healing)prompt='治疗队友 '+Math.floor(healing.time/4*100)+'%';
  if(rescue)prompt='救援 '+Math.floor(rescue.time*100)+'%';
  if(g.decoding)prompt='破译 '+Math.floor(g.decoding.p)+'% · 移动中断';
  if(g.calibration)prompt='空格校准 · '+Math.round(g.calibration.elapsed/g.calibration.duration*100)+'%（62%—80%附近）';
  if(g.calibration)prompt='点击右下交互键校准 · '+Math.round(g.calibration.elapsed/g.calibration.duration*100)+'%';
  if(g.health<=0)prompt=me.seated!=null?'等待队友救援':'按住 E · 倒地自愈 / 气球挣扎';
  if(me.escaped)prompt='你已逃脱，等待其他求生者结算';
  $('#prompt').textContent=prompt;
  $('#kit').disabled=!me.parkItem||g.health!==1;
  if(match.result){$('#notice').hidden=false;$('#notice').textContent=`对局结束：${{survivors:'求生者胜利',hunter:'监管者胜利',draw:'平局'}[match.result.winner]}，逃脱 ${match.result.escaped} 人。点击下方重开或返回。`;$('#notice').style.pointerEvents='none';}
}
function frame(t){
  requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000||0);last=t;clock+=dt;
  if(carousel&&!document.hidden)carouselPhase+=dt*.5;
  if(!match||document.hidden)return;
  acc+=dt;
  while(acc>=.05){
    const sx=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft))+joystick.x;
    const sy=Number(!!(keys.s||keys.arrowdown))-Number(!!(keys.w||keys.arrowup))+joystick.y;
    // Convert screen directions to the isometric ground axes.
    match.input('player',{x:(sx+sy)/Math.SQRT2,y:(sy-sx)/Math.SQRT2,interact:!!keys.e||held});
    match.update(.05);acc-=.05;
  }
  render();ui();
}
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','q','m',' '].includes(k))e.preventDefault();keys[k]=true;
  if(e.repeat)return;
  if(k==='m')overview=!overview;if(k==='q')match.useMedicalKit('player');if(k===' ')match.action('player','calibrate');
});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
window.addEventListener('blur',()=>{keys={};held=false;});
function bindHold(el,down,up){el.onpointerdown=e=>{e.preventDefault();el.setPointerCapture(e.pointerId);down();};el.onpointerup=el.onpointercancel=up;}
bindHold($('#interact'),()=>{if(me.sim.calibration)match.action('player','calibrate');else held=true;},()=>held=false);
$('#overview').onclick=()=>overview=!overview;$('#kit').onclick=()=>match.useMedicalKit('player');
$('#carousel').onclick=()=>{carousel=!carousel;$('#carousel').textContent='木马：'+(carousel?'运行':'停止');};$('#restart').onclick=start;
$('#zoomIn').onclick=()=>zoom=Math.min(1.8,zoom+.15);
$('#zoomOut').onclick=()=>zoom=Math.max(.7,zoom-.15);
$('#menuButton').onclick=()=>{const menu=$('#parkMenu');menu.hidden=!menu.hidden;$('#menuButton').setAttribute('aria-expanded',String(!menu.hidden));};
const stick=$('#joystick');
function moveStick(e){
  const rect=stick.getBoundingClientRect(),radius=rect.width/2-22;
  let x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2,l=Math.hypot(x,y);
  if(l>radius){x=x/l*radius;y=y/l*radius;}
  joystick={x:x/radius,y:y/radius};$('#nub').style.transform=`translate(${x}px,${y}px)`;
}
function releaseStick(){joystickPointer=null;joystick={x:0,y:0};$('#nub').style.transform='';}
stick.onpointerdown=e=>{if(joystickPointer!==null)return;e.preventDefault();joystickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};
stick.onpointermove=e=>{if(e.pointerId===joystickPointer)moveStick(e);};
stick.onpointerup=stick.onpointercancel=releaseStick;stick.onlostpointercapture=releaseStick;
window.addEventListener('blur',releaseStick);document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseStick();held=false;keys={};}});
try{if(!ctx)throw new Error('浏览器不支持 Canvas');start();requestAnimationFrame(frame);}catch(e){$('#notice').textContent='加载失败：'+e.message;console.error(e);}
