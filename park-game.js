import {terrain,moveOnTerrain,updateTerrainGate,blinkDestination} from './park-terrain.js';
import {renderTeam} from './team-status.js';
import {ParkTrain,stations,track,trackPose,sleepers} from './park-train.js';
import {screamHouse,houseWalls,houseContains,octagon,spiralSteps} from './scream-house.js';
import {woodHouse,woodWalls,woodInside,woodAction} from './wood-house.js';

// Facilities and combat are deliberately disabled; see park-game-legacy.js.
const $=s=>document.querySelector(s),canvas=$('#park'),ctx=canvas.getContext('2d');
const player={x:78,y:100},keys={},joy={x:0,y:0};
let walkPhase=0,walkBlend=0,facing=Math.PI/2;
let woodVault=null;
const gates=terrain.gates.map(e=>({...e,progress:0}));
let interacting=false;
let blinkPointer=null,blinkStart=null,blinkVector={x:0,y:0},blinkActive=false,blinkPulse=0;
function blinkTarget(){return blinkDestination(player,blinkVector.x,blinkVector.y);}
const train=new ParkTrain();let lastInteraction=false;
const departure=document.createElement('button'),stopChoice=document.createElement('div');
departure.textContent='发车';departure.style.cssText='position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#233f3988;border:1px solid #d9e5bc88;border-radius:24px;padding:12px 30px;z-index:5';
stopChoice.style.cssText='position:fixed;bottom:160px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:5';
for(const [name,stop] of [['停靠河畔站',true],['跳过河畔站',false]]){const b=document.createElement('button');b.textContent=name;b.style.cssText='background:#233f39bb;border:1px solid #bacaac;border-radius:18px;padding:10px';b.onclick=()=>train.chooseStop('player',stop);stopChoice.appendChild(b);}
departure.onclick=()=>train.depart('player');document.body.append(departure,stopChoice);
const gateHint=document.createElement('div');gateHint.style.cssText='position:fixed;bottom:22px;left:50%;transform:translateX(-50%);font-size:12px;color:#edf1e5;text-shadow:0 1px 3px #162820;pointer-events:none';document.body.appendChild(gateHint);
let width=0,height=0,scale=6,origin={x:0,y:0},last=0,time=0,pointer=null;
let cameraHeight=0;
const marks=Array.from({length:2600},(_,i)=>({x:((i*73.37)%199)+.5,y:((i*41.83)%199)+.5,t:i%5}));
function p(x,y,z=0){return {x:origin.x+(x-y)*.866*scale,y:origin.y+(x+y)*.5*scale-z*scale};}
function polygon(points,color){ctx.beginPath();points.forEach((v,i)=>{const q=p(...v);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function line(a,b,color,w=1){const u=p(...a),v=p(...b);ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();}
function box(x,y,w,d,h,color,base=0){
  const a=x-w/2,b=y-d/2;
  polygon([[a,b+d,base],[a+w,b+d,base],[a+w,b+d,base+h],[a,b+d,base+h]],color);
  polygon([[a+w,b,base],[a+w,b+d,base],[a+w,b+d,base+h],[a+w,b,base+h]],'#536455');
  polygon([[a,b,base+h],[a+w,b,base+h],[a+w,b+d,base+h],[a,b+d,base+h]],'#afad90');
}
function orientedBox(x,y,w,d,h,color,angle,base=0){
  const c=Math.cos(angle),s=Math.sin(angle),v=(a,b,z)=>[x+a*c-b*s,y+a*s+b*c,z];
  const a=-w/2,b=-d/2;
  const corners=[[a,b],[a+w,b],[a+w,b+d],[a,b+d]];
  const faces=corners.map((u,i)=>{const next=corners[(i+1)%4],q=v(...u,base),r=v(...next,base);return {depth:q[0]+q[1]+r[0]+r[1],points:[q,r,v(...next,base+h),v(...u,base+h)],color:shade(color,i%2?-22:-8)};});
  faces.sort((a,b)=>a.depth-b.depth);for(const f of faces)polygon(f.points,f.color);
  polygon([v(a,b,base+h),v(a+w,b,base+h),v(a+w,b+d,base+h),v(a,b+d,base+h)],shade(color,24));
}
function shade(color,amount){const n=parseInt(color.slice(1),16);return '#'+[16,8,0].map(s=>Math.max(0,Math.min(255,((n>>s)&255)+amount)).toString(16).padStart(2,'0')).join('');}
function screamHouseScene(includePlayer=false){
  polygon(octagon(19),'#b19b72');polygon(octagon(12),'#7b7771');
  for(const radius of [13,17]){const points=octagon(radius);for(let i=0;i<8;i++)line(points[i],points[(i+1)%8],'#c5ad73',.8);}
  const inside=houseContains(player.x,player.y);
  const upper=(player.z||0)>4.7;
  const showUpperStorey=!inside||upper;
  const items=[];
  // Ground-floor door gaps must not continue through the second-storey wall.
  for(const sign of [-1,1]){
    const y=screamHouse.y+sign*screamHouse.outerRadius;
    const front=screamHouse.x+y>screamHouse.x+screamHouse.y;
    const base=inside&&upper?screamHouse.floorHeight:6.8;
    const height=inside&&upper?(front?1.1:3.5):screamHouse.roofHeight-base;
    if(showUpperStorey)items.push({depth:screamHouse.x+y,draw:()=>{
      orientedBox(screamHouse.x,y,screamHouse.doorWidth,.7,height,'#a8443d',0,base);
      orientedBox(screamHouse.x,y,screamHouse.doorWidth,.85,.18,'#d3b653',0,base+height);
      orientedBox(screamHouse.x,y,screamHouse.doorWidth,.77,.18,'#d8ae4b',0,base+.45);
    }});
  }
  // Keep the exposed first-floor exterior below the upper corridor. Draw it
  // before the upper floor slab so it cannot paint over the walking surface.
  if(inside&&upper){
    const exterior=houseWalls.filter(w=>w.outer&&w.x+w.y>screamHouse.x+screamHouse.y).sort((a,b)=>a.x+a.y-b.x-b.y);
    for(const w of exterior){
      orientedBox(w.x,w.y,w.length,w.thickness,screamHouse.floorHeight-.35,'#a8443d',w.angle);
      orientedBox(w.x,w.y,w.length,.85,.22,'#d8ae4b',w.angle,.45);
      orientedBox(w.x,w.y,w.length,.85,.18,'#d3b653',w.angle,4.8);
      for(let u=-w.length/2+.7;u<w.length/2;u+=1.8){
        const x=w.x+Math.cos(w.angle)*u,y=w.y+Math.sin(w.angle)*u;
        orientedBox(x,y,.14,.82,3.9,'#ca9a43',w.angle,.7);
        const q=p(x+Math.sin(w.angle)*.43,y-Math.cos(w.angle)*.43,2.6);
        ctx.fillStyle=['#83acb8','#d7be76','#ad96bd'][Math.floor((u+w.length)*3)%3];
        ctx.beginPath();ctx.arc(q.x,q.y,scale*.14,0,Math.PI*2);ctx.fill();
      }
    }
  }
  // Subdivide long wall faces to avoid sorting an entire octagon side as one item.
  const segments=houseWalls.flatMap(w=>{
    const count=Math.ceil(w.length/1.2),length=w.length/count;
    return Array.from({length:count},(_,i)=>{const u=-w.length/2+(i+.5)*length;return {...w,x:w.x+Math.cos(w.angle)*u,y:w.y+Math.sin(w.angle)*u,length};});
  });
  for(const w of segments){
    items.push({depth:w.x+w.y,draw:()=>{
      // Opaque cutaway, not transparency: expose the interior in first-floor preview.
      const front=w.x+w.y>screamHouse.x+screamHouse.y;
      const base=inside&&upper?screamHouse.floorHeight:0;
      const h=inside?(upper?(w.outer?(front?1.1:3.5):.85):(front?1.3:screamHouse.floorHeight-.35)):screamHouse.roofHeight;
      orientedBox(w.x,w.y,w.length,w.thickness,h,w.outer?'#a8443d':'#944c45',w.angle,base);
      orientedBox(w.x,w.y,w.length+.1,.85,.18,'#d3b653',w.angle,base+h);
      orientedBox(w.x,w.y,w.length,.77,.18,'#d8ae4b',w.angle,base+.45);
      if(!inside||(!front&&!upper)){
        if(w.outer){
          if(showUpperStorey){
            orientedBox(w.x,w.y,w.length,.9,.22,'#e3bd5f',w.angle,5.4);
            orientedBox(w.x,w.y,w.length,.9,.22,'#e3bd5f',w.angle,9.8);
          }
          const nx=Math.sin(w.angle),ny=-Math.cos(w.angle);
          for(const z of [2.5,7.5]){
            if(!showUpperStorey&&z>=screamHouse.floorHeight)continue;
            const wx=w.x+nx*.48,wy=w.y+ny*.48;
            orientedBox(wx,wy,.36,.25,.65,'#59445a',w.angle,z);
            const q=p(wx,wy,z+.4);ctx.fillStyle='#efd994';ctx.beginPath();ctx.arc(q.x,q.y,scale*.1,0,7);ctx.fill();
          }
        }
        orientedBox(w.x,w.y,w.length,.78,.14,'#e0be64',w.angle,4.8);
        for(let u=-w.length/2+1;u<w.length/2;u+=2){
          const x=w.x+Math.cos(w.angle)*u,y=w.y+Math.sin(w.angle)*u;
          orientedBox(x,y,.18,.8,4.2,'#ca9a43',w.angle,.6);
          const q=p(x+Math.sin(w.angle)*.42,y-Math.cos(w.angle)*.42,3.1);
          ctx.fillStyle=['#74a6b1','#d6bd69','#a892bb'][Math.floor(u+w.length)%3];ctx.beginPath();ctx.arc(q.x,q.y,scale*.18,0,7);ctx.fill();
        }
      }
    }});
  }
  const outer=octagon(18.6),inner=octagon(12.5);
  for(let i=0;i<8;i++){
    const j=(i+1)%8,mid=(outer[i][0]+outer[i][1]+outer[j][0]+outer[j][1])/2;
    if(showUpperStorey){
      const points=[outer[i],outer[j],inner[j],inner[i]].map(v=>[v[0],v[1],screamHouse.floorHeight]);
      // Floor is an underlying surface, not a foreground object that can
      // repaint the player's legs after height-based movement.
      const floor=screamHouse.floorHeight;
      // Inner and outer fascia expose the underside at the foreground edge.
      for(const [a,b] of [[inner[i],inner[j]],[outer[i],outer[j]]]){
        polygon([[a[0],a[1],floor-.35],[b[0],b[1],floor-.35],[b[0],b[1],floor],[a[0],a[1],floor]],'#80765f');
      }
      polygon(points,i%2?'#bbaa83':'#c1b18b');
      line(points[2],points[3],'#8d7958',1);
      for(let t=.25;t<1;t+=.25){
        const a=outer[i],b=outer[j],c=inner[i],d=inner[j];
        line([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,floor+.01],[c[0]+(d[0]-c[0])*t,c[1]+(d[1]-c[1])*t,floor+.01],'#a89976',.6);
      }
    }
    if(showUpperStorey){
      const a=inner[i],b=inner[j];
      const divisions=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.3);
      for(let k=0;k<divisions;k++){
        const t=k/divisions,u=(k+1)/divisions,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
        items.push({depth:x+y+.1,draw:()=>{line([x,y,5.5],[x,y,6.6],'#a28648',1);line([x,y,6.6],[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,6.6],'#d4b45c',1.5);}});
      }
    }
  }
  for(let i=0;i<spiralSteps.length;i++){
    const step=spiralSteps[i],next=spiralSteps[i+1];
    const length=next&&next.side===step.side?Math.hypot(next.x-step.x,next.y-step.y)+.12:.6;
    items.push({depth:step.x+step.y,draw:()=>{
      orientedBox(step.x,step.y,length,2.8,.18,'#b0a17a',step.angle,Math.max(0,step.z-.18));
      line([step.x-Math.sin(step.angle)*1.15,step.y+Math.cos(step.angle)*1.15,step.z+.02],[step.x+Math.sin(step.angle)*1.15,step.y-Math.cos(step.angle)*1.15,step.z+.02],'#d4c49c',.7);
      if(i%3===0){const x=step.x-Math.sin(step.angle)*1.15,y=step.y+Math.cos(step.angle)*1.15;line([x,y,step.z],[x,y,step.z+.9],'#8e7146',1);}
      if(next&&next.side===step.side)line([step.x-Math.sin(step.angle)*1.15,step.y+Math.cos(step.angle)*1.15,step.z+.9],[next.x-Math.sin(next.angle)*1.15,next.y+Math.cos(next.angle)*1.15,next.z+.9],'#d2af59',1);
    }});
  }
  for(const sign of [-1,1]){
    if(inside&&upper&&sign===-1)continue;
    const y=screamHouse.y+sign*19;
    items.push({depth:screamHouse.x+y,draw:()=>{
      for(const dx of [-2.7,2.7]){box(screamHouse.x+dx,y,.6,1,6.6,'#c79c43');box(screamHouse.x+dx,y,.8,1.2,.2,'#e2bd65',6.6);}
      box(screamHouse.x,y,6.2,1.2,.4,'#bd8c3e',6.7);
      polygon([[screamHouse.x-3.6,y-sign*1.5,5.8],[screamHouse.x+3.6,y-sign*1.5,5.8],[screamHouse.x+3.6,y+sign*2.3,5.3],[screamHouse.x-3.6,y+sign*2.3,5.3]],'#e0b45b');
      for(let i=-3;i<=3;i++){const q=p(screamHouse.x+i,y,6.5);ctx.fillStyle=i%2?'#a2c3b0':'#e9d093';ctx.beginPath();ctx.arc(q.x,q.y,scale*.12,0,7);ctx.fill();}
    }});
  }
  const landingY=screamHouse.y-12;
  items.push({depth:screamHouse.x+landingY,draw:()=>box(screamHouse.x,landingY,2.8,5.5,.2,'#bcaa7f',screamHouse.floorHeight-.2)});
  if(includePlayer)items.push({depth:player.x+player.y,draw:walkingPlayer});
  items.sort((a,b)=>a.depth-b.depth);for(const item of items)item.draw();
}
function screamHouseRoof(){
  if(houseContains(player.x,player.y))return;
  const points=octagon(19.8);
  for(let i=0;i<8;i++){
    const a=points[i],b=points[(i+1)%8];polygon([[a[0],a[1],11.6],[b[0],b[1],11.6],[54,133,15.8]],i%2?'#a6433b':'#bc5441');
    line([a[0],a[1],11.6],[54,133,15.8],'#d9b250',1.2);
  }
}
function woodHouseScene(){
  const inside=woodInside(player.x,player.y),items=[];
  const head=p(player.x,player.y,(player.z||0)+2);
  const covers=(x,y,w,d,h)=>{
    if(x+y<player.x+player.y)return false;
    const vertices=[];for(const xx of [x-w/2,x+w/2])for(const yy of [y-d/2,y+d/2])for(const z of [0,h])vertices.push(p(xx,yy,z));
    return head.x>=Math.min(...vertices.map(v=>v.x))-scale*.4&&head.x<=Math.max(...vertices.map(v=>v.x))+scale*.4&&head.y>=Math.min(...vertices.map(v=>v.y))&&head.y<=Math.max(...vertices.map(v=>v.y));
  };
  polygon([[149,56,0],[165,56,0],[165,72,0],[149,72,0]],'#a68c64');
  for(let y=57;y<72;y+=1)line([149,y,.02],[165,y,.02],'#8c7453',.6);
  polygon([[151,57.5,.03],[162,57.5,.03],[162,60.5,.03],[151,60.5,.03]],'#333d3a');
  for(let i=0;i<28;i++)box(151+(i+.5)*11/28,59,11/28,3,.18,'#82847a',-i/28*5);
  box(157,67,2,1.5,1.7,'#aa8c56');box(157,67,1.6,1.2,.35,'#46564e',1.7);
  for(const wall of woodWalls){
    const count=Math.ceil(Math.max(wall.w,wall.d)/1.2);
    for(let i=0;i<count;i++){
      const horizontal=wall.w>wall.d;
      const x=horizontal?wall.x-wall.w/2+(i+.5)*wall.w/count:wall.x;
      const y=horizontal?wall.y:wall.y-wall.d/2+(i+.5)*wall.d/count;
      const w=horizontal?wall.w/count:wall.w,d=horizontal?wall.d:wall.d/count;
      items.push({depth:x+y,draw:()=>{
        ctx.save();
        if((inside&&x+y>221)||covers(x,y,w,d,5.5))ctx.globalAlpha=.38;
        const height=5.5;
        box(x,y,w,d,height,'#8b6445');
        for(let z=.5;z<height;z+=.55){line([x-w/2,y+d/2,z],[x+w/2,y+d/2,z],'#604b37',.7);line([x+w/2,y-d/2,z],[x+w/2,y+d/2,z],'#604b37',.7);}
        ctx.restore();
      }});
    }
  }
  items.push({depth:229,draw:()=>{
    box(157,72,5,.8,1.1,'#8b6445');
    for(const x of [154.5,159.5])box(x,72,.25,.85,4.1,'#cfb381');
    box(157,72,5.4,.85,.22,'#cfb381',4.1);box(157,72,5.4,.95,.2,'#d5bd8e',1.1);
  }});
  items.push({depth:210+woodHouse.palletProgress*3,draw:()=>{
    // Hinge lies along X: upright panel is perpendicular to the left wall;
    // its top sweeps along Y, within that wall's plane, across the doorway.
    const angle=woodHouse.palletProgress*Math.PI/4;
    const length=3.2/Math.sin(Math.PI/4);
    const point=(x,u)=>[x,62.4+Math.sin(angle)*u,.18+Math.cos(angle)*u];
    polygon([point(148,0),point(150,0),point(150,length),point(148,length)],'#ba955d');
    for(let u=0;u<=length;u+=.55)line(point(148,u),point(150,u),'#795735',.9);
    for(const x of [148.3,149.7])line(point(x,.15),point(x,length-.15),'#dcc28a',1.3);
    line(point(148.25,.35),point(149.75,length-.35),'#82613e',1.4);
  }});
  const nearby=Math.abs(player.x-157)<12&&Math.abs(player.y-64)<12&&!player.riding;
  if(nearby)items.push({depth:player.x+player.y,draw:walkingPlayer});
  items.sort((a,b)=>a.depth-b.depth);for(const item of items)item.draw();
  const roofObscures=player.x+player.y<221&&Math.abs(player.x-157)<15&&Math.abs(player.y-64)<16;
  ctx.save();
  if(inside||roofObscures)ctx.globalAlpha=.25;
  {
    polygon([[148,55,5.5],[166,55,5.5],[166,64,8],[148,64,8]],'#695d50');
    polygon([[148,64,8],[166,64,8],[166,73,5.5],[148,73,5.5]],'#85735b');
    for(let x=149;x<166;x+=1.2)line([x,64,8],[x,73,5.5],'#594f44',.7);
  }
  ctx.restore();
  return nearby;
}
function basementScene(showPlayer=true){
  polygon([[149,56,-5],[165,56,-5],[165,72,-5],[149,72,-5]],'#62675f');
  for(let x=150;x<165;x+=2)for(let y=57;y<72;y+=2){
    polygon([[x,y,-4.99],[x+1.8,y,-4.99],[x+1.8,y+1.8,-4.99],[x,y+1.8,-4.99]],(x+y)%4?'#696c61':'#595e57');
    line([x,y,-4.97],[x+.5,y+.8,-4.97],'#3c4641',.8);
  }
  box(157,56,16,.6,4.5,'#565d58',-5);box(149,64,.6,16,4.5,'#515d56',-5);
  for(let i=0;i<28;i++)box(151+(i+.5)*11/28,59,11/28,3,.18,'#82847a',-i/28*5);
  const items=[];
  for(let i=0;i<16;i++){
    const x=150+(i*3.7)%13,y=65+(i*1.3)%6;
    items.push({depth:x+y,draw:()=>box(x,y,.35+i%3*.15,.4,.15,'#847d68',-5)});
  }
  for(const [x,y] of [[152,63],[162,67]])for(let i=0;i<5;i++){
    const yy=y+i*.7,h=i%3===1?.65:1.6;
    items.push({depth:x+yy,draw:()=>{
      line([x,yy,-5],[x+(i%2?.15:0),yy,-5+h],'#897963',1.5);
      if(i!==2)line([x,yy,-4.5],[x,yy+.7,-4.5],'#615e52',1.2);
    }});
  }
  if(showPlayer)items.push({depth:player.x+player.y,draw:walkingPlayer});items.sort((a,b)=>a.depth-b.depth);for(const item of items)item.draw();
}
function walkingPlayer(){
  const angle=facing,step=Math.sin(walkPhase),bob=Math.abs(Math.sin(walkPhase))*walkBlend*.09;
  const breathe=Math.sin(time*2.3)*.025*(1-walkBlend);
  const local=(forward,side,z)=>[player.x+Math.cos(angle)*forward-Math.sin(angle)*side,player.y+Math.sin(angle)*forward+Math.cos(angle)*side,z+(player.z||0)];
  const parts=[];
  const part=(forward,side,w,d,h,color,z)=>{const q=local(forward,side,z);parts.push({depth:q[0]+q[1],draw:()=>orientedBox(q[0],q[1],w,d,h,color,angle,q[2])});};
  const foot=p(player.x,player.y,player.z||0);ctx.fillStyle='#223e3444';ctx.beginPath();ctx.ellipse(foot.x,foot.y,scale*.85,scale*.4,0,0,7);ctx.fill();
  for(const side of [-1,1]){
    const swing=step*side*walkBlend;
    part(swing*.3,side*.28,.38,.3,.55,'#465950',.15+Math.max(0,swing)*.13);
    part(swing*.36+.1,side*.28,.5,.33,.16,'#343f3c',.02+Math.max(0,swing)*.12);
    part(-swing*.23,side*.66,.27,.25,.57,'#cab477',1.15+bob+breathe);
    part(-swing*.29,side*.66,.23,.22,.22,'#dfc29e',.94+bob+breathe);
  }
  part(.04,0,.78,1,1,'#dac389',.7+bob+breathe);
  part(.05,0,.82,1.01,.13,'#a78c59',.76+bob+breathe);
  part(.06,0,.67,.8,.74,'#e0c19e',1.77+bob+breathe);
  part(-.1,0,.42,.86,.7,'#594936',1.86+bob+breathe);
  part(.02,0,.76,.86,.23,'#65513b',2.47+bob+breathe);
  parts.sort((a,b)=>a.depth-b.depth);for(const v of parts)v.draw();
  // Eyes belong to the front plane, never to the back of the head.
  if(Math.cos(angle)+Math.sin(angle)>-.2){
    for(const side of [-.19,.19]){const q=p(...local(.405,side,2.15+bob+breathe));ctx.fillStyle='#493b30';ctx.fillRect(Math.round(q.x),Math.round(q.y),Math.max(1,scale*.09),Math.max(1,scale*.1));}
    const nose=p(...local(.46,0,2.02+bob+breathe));ctx.fillStyle='#b18d70';ctx.fillRect(Math.round(nose.x),Math.round(nose.y),Math.max(1,scale*.08),Math.max(1,scale*.08));
  }
}
function railway(){
  for(const v of sleepers){
    const q=p(v.x,v.y);if(q.x< -80||q.x>width+80||q.y< -80||q.y>height+80)continue;
    const nx=-Math.sin(v.angle),ny=Math.cos(v.angle);
    line([v.x-nx*1.2,v.y-ny*1.2,.25],[v.x+nx*1.2,v.y+ny*1.2,.25],'#76604a',2);
  }
  for(let i=1;i<track.length;i++){
    const a=track[i-1],b=track[i],q=p(b.x,b.y);if(q.x< -80||q.x>width+80||q.y< -80||q.y>height+80)continue;
    const angle=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(angle),ny=Math.cos(angle);
    const za=trackPose(a.s).z,zb=trackPose(b.s).z,railZ=.7;
    for(const side of [-1,1])line([a.x+nx*side*.65,a.y+ny*side*.65,za+railZ],[b.x+nx*side*.65,b.y+ny*side*.65,zb+railZ],'#8c9b94',1.3);
  }
}
function stationModel(st,roofOnly=false){
  const side=st.id===1?1:-1;
  const cx=st.x-Math.sin(st.angle)*5*side,cy=st.y+Math.cos(st.angle)*5*side;
  const local=(u,v,z)=>[cx+Math.cos(st.angle)*u-Math.sin(st.angle)*v,cy+Math.sin(st.angle)*u+Math.cos(st.angle)*v,z];
  const block=(u,v,w,d,h,col,z=0)=>{const q=local(u,v,z);orientedBox(q[0],q[1],w,d,h,col,st.angle,z);};
  if(roofOnly){
    block(0,0,19,6.6,.35,'#7b8488',7.55);block(0,0,19.2,6.8,.14,'#a6adb0',7.9);
    for(let u=-9;u<=9;u+=1.4)line(local(u,-3.3,8.04),local(u,3.3,8.04),'#697579',.7);
    return;
  }
  block(0,0,18,5.6,.85,'#777c7b');block(0,0,18.2,5.8,.18,'#a5aaa7',.85);
  const deck=1.03;
  for(let u=-8;u<=8;u+=2){line(local(u,-2.8,deck),local(u,2.8,deck),'#818887',.65);}
  // Yellow safety strip and two low access steps on the track side.
  block(0,-side*2.55,17,.22,.04,'#c4b889',deck);
  block(-7,-side*3.3,3,1.2,.32,'#858c89');block(-7,-side*2.95,3,.7,.62,'#969c97');
  block(2,side*1.6,4,.8,.35,'#858d89',1.6);block(2,side*2,4,.2,1,'#747f7c',1.4);
  block(-3,side*1.7,.35,.35,3.8,'#667374',1);block(-3,side*1.7,3,.22,.8,'#b1b8b1',4.5);
  const pillars=[[-7,-1.8],[-7,1.8],[7,-1.8],[7,1.8]].sort((a,b)=>{const u=local(...a,0),v=local(...b,0);return u[0]+u[1]-v[0]-v[1];});
  for(const [u,v] of pillars){block(u,v,.34,.34,6.55,'#626d70',1);block(u,v,.6,.6,.18,'#a1a6a2',1);}
}
function trainModel(){
  const cars=[0,1,2].map(seat=>({seat,v:train.carPose(seat)})).sort((a,b)=>a.v.x+a.v.y-b.v.x-b.v.y);
  for(const {seat,v} of cars){
    const z=v.z||0;
    const local=(u,b,z)=>[v.x+Math.cos(v.angle)*u-Math.sin(v.angle)*b,v.y+Math.sin(v.angle)*u+Math.cos(v.angle)*b,z];
    const block=(u,b,w,d,h,col,z)=>{const q=local(u,b,z);orientedBox(q[0],q[1],w,d,h,col,v.angle,z);};
    block(0,0,3.9,2.5,.35,'#38494b',z+.7);block(0,0,3.7,2.35,.2,'#b8aa7d',z+1.05);
    for(const side of [-1,1])for(const u of [-1.25,1.25]){
      const center=local(u,side*1.3,z+1.35),wheel=[];
      for(let i=0;i<12;i++){const a=i*Math.PI/6;wheel.push(local(u+Math.cos(a)*.6,side*1.3,z+1.35+Math.sin(a)*.6));}
      polygon(wheel,'#283b40');const hub=p(...center);ctx.fillStyle='#a1aaa4';ctx.beginPath();ctx.arc(hub.x,hub.y,scale*.14,0,7);ctx.fill();
      line(local(-1.25,side*1.32,z+1.35),local(1.25,side*1.32,z+1.35),'#a49c82',1);
    }
    block(-2.1,0,.55,.4,.2,'#5d6660',.85);
    if(!seat){
      block(.65,0,2.1,1.65,1.1,'#427769',z+1.3);
      block(1.8,0,.18,1.8,1.1,'#879990',z+1.3);
      block(1.9,0,.18,.45,.45,'#e0c781',z+1.75);
      block(.8,0,.5,.5,1.2,'#384b4d',z+2.3);block(.8,0,.75,.7,.2,'#687c7a',z+3.4);
      block(-1,0,1.4,2.15,.9,'#487d70',z+1.3);
      for(const side of [-1,1]){block(-1,side*1.03,1,.08,.85,'#a1c4c0',z+2.2);for(const u of [-1.6,-.4])block(u,side*1.05,.12,.12,1.7,'#d0c6a3',z+1.8);}
      block(-1,0,1.8,2.55,.3,'#40595a',z+3.6);
      for(let i=0;i<3;i++)line(local(.1+i*.4,1,z+1.45),local(.1+i*.4,1,z+2.15),'#b6ab83',.7);
    }else{
      block(0,0,3.4,2.1,.9,'#8e574b',z+1.25);
      for(const side of [-1,1]){block(0,side*1.05,3.45,.1,.16,'#d4ba85',z+2.1);for(const u of [-1.5,1.5])block(u,side*1.02,.12,.12,1.5,'#c4b28b',z+2.05);}
      block(0,0,1.2,1.7,.3,'#617c70',z+1.5);block(-.4,0,.2,1.7,.7,'#617c70',z+1.65);
      block(0,0,3.85,2.65,.3,'#526668',z+3.65);block(0,0,3.7,2.5,.12,'#82918b',z+3.95);
      for(const side of [-1,1])for(const u of [-.9,0,.9])block(u,side*1.06,.65,.05,.48,'#b3846c',z+1.35);
    }
    if(train.seats[seat]){block(0,0,.7,.6,.7,'#d0b785',z+2);block(0,0,.6,.6,.6,'#dfc29e',z+2.7);}
  }
}
function middlePlatformCipher(){
  const st=stations[1],cx=st.x-Math.sin(st.angle)*5,cy=st.y+Math.cos(st.angle)*5;
  const x=cx+Math.cos(st.angle)*1.3,y=cy+Math.sin(st.angle)*1.3,deck=1.03;
  const local=(u,b,h)=>[x+Math.cos(st.angle)*u-Math.sin(st.angle)*b,y+Math.sin(st.angle)*u+Math.cos(st.angle)*b,h];
  orientedBox(x,y,2.4,1.7,.6,'#7c6547',st.angle,deck);orientedBox(x,y,2.2,1.55,.55,'#3d4843',st.angle,deck+.6);
  orientedBox(x,y,1.8,.45,.13,'#c5a464',st.angle,deck+1.15);
  for(let i=-2;i<=2;i++){const q=local(i*.28,-.52,deck+1.19);box(q[0],q[1],.13,.12,.09,'#d7c18b',q[2]);}
  line(local(-.75,.72,deck+.25),local(-.75,.72,deck+4.15),'#765840',1.8);
  line(local(.75,.72,deck+.25),local(.75,.72,deck+4.15),'#765840',1.8);
  line(local(-.75,.72,deck+3.95),local(.75,.72,deck+3.95),'#927346',1.4);
  const q1=local(-.75,.72,deck+4.15),q2=local(.75,.72,deck+4.15);box(q1[0],q1[1],.35,.35,.35,'#b99853',q1[2]);box(q2[0],q2[1],.35,.35,.35,train.cipher>=100?'#81b789':'#d4ae55',q2[2]);
  line(local(-.75,.72,deck+4.15),local(-.75,.72,deck+5.55),'#735339',1.4);
}
function gate(e){
  for(const y of [e.y-5,e.y+5]){
    box(e.x,y,2,2,6.8,'#858875');box(e.x,y,2.4,2.4,.3,'#beb498',6.8);
    box(e.x,y,2.2,2.2,.5,'#606b58');
    for(let z=1;z<6.8;z+=.9)line([e.x-1,y+1,z],[e.x+1,y+1,z],'#666c60',.7);
    box(e.x,y,.8,.8,.4,'#cfb577',7.1);
  }
  box(e.x,e.y,1.5,12,.5,'#b4ad8b',6.7);
  const lift=e.progress/100*6.2;
  ctx.save();ctx.beginPath();
  const clip=[[e.x-1.2,e.y-4.2,0],[e.x+1.2,e.y-4.2,0],[e.x+1.2,e.y+4.2,0],[e.x+1.2,e.y+4.2,6.6],[e.x-1.2,e.y-4.2,6.6]];
  clip.forEach((v,i)=>{const q=p(...v);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.clip();
  for(let i=-4;i<=4;i+=.65)line([e.x,e.y+i,.2+lift],[e.x,e.y+i,6.4+lift],'#374b49',1.5);
  for(const z of [1.2,3.7,6])line([e.x,e.y-4,z+lift],[e.x,e.y+4,z+lift],'#647466',2);
  ctx.restore();
  box(e.x-e.side*2,e.y+6,.65,.65,1.2,'#697a69');
}
function perimeterWall(x,y,w,d){
  const q=p(x,y);if(q.x< -150||q.x>width+150||q.y< -50||q.y>height+200)return;
  box(x,y,w,d,4.2,'#81856f');box(x,y,w+.12,d+.12,.22,'#b0ac8e',4.2);
  for(let z=.7;z<4.2;z+=.7){line([x-w/2,y+d/2,z],[x+w/2,y+d/2,z],'#626d59',.65);line([x+w/2,y-d/2,z],[x+w/2,y+d/2,z],'#596452',.65);}
}
function graniteRail(x,y,length){
  const q=p(x,y);if(q.x< -120||q.x>width+120||q.y< -100||q.y>height+150)return;
  box(x,y,.95,length,.25,'#858b84');
  const pieces=[];
  for(const py of [y-length/2,y+length/2])pieces.push({y:py,w:.82,d:.82,h:1.85,post:true});
  const count=Math.max(2,Math.floor(length/1.1));
  for(let i=1;i<count;i++)pieces.push({y:y-length/2+length*i/count,w:.32,d:.32,h:1.32,post:false});
  pieces.sort((a,b)=>a.y-b.y);
  for(const part of pieces){
    box(x,part.y,part.w,part.d,part.h,'#a4aaa3',.25);
    if(part.post)box(x,part.y,.98,.98,.16,'#c4c7be',2.1);
  }
  box(x,y,.68,length,.28,'#b5bbb2',1.57);
  line([x+.34,y-length/2,1.85],[x+.34,y+length/2,1.85],'#cdd0c5',.65);
  for(let i=0;i<Math.floor(length*2);i++){
    const py=y-length/2+.3+i*.48;
    line([x+.35,py,1.65],[x+.35,py+.05,1.69],i%2?'#8b948c':'#c9cdc3',.6);
  }
}
function draw(){
  const w=Math.max(1,Math.floor(canvas.clientWidth/1.25)),h=Math.max(1,Math.floor(canvas.clientHeight/1.25));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}width=w;height=h;
  scale=Math.max(5,Math.min(10,width/85));origin={x:width/2-(player.x-player.y)*.866*scale,y:height*.53-(player.x+player.y)*.5*scale+cameraHeight*scale};
  ctx.fillStyle='#293e3b';ctx.fillRect(0,0,width,height);
  const below=Math.max(0,Math.min(1,-(player.z||0)/3));
  const reveal=below*below*(3-2*below);
  if(reveal>0){ctx.save();ctx.globalAlpha=reveal;basementScene(false);ctx.restore();}
  ctx.save();ctx.globalAlpha=1-reveal;
  polygon([[0,0,0],[200,0,0],[200,200,0],[0,200,0]],'#7b9060');
  for(const m of marks){
    if(m.x>88&&m.x<112)continue;
    const q=p(m.x,m.y);if(q.x<0||q.x>width||q.y<0||q.y>height)continue;
    if(m.t<2)polygon([[m.x,m.y,.02],[m.x+1.2,m.y,.02],[m.x+1.2,m.y+.7,.02],[m.x,m.y+.7,.02]],m.t?'#819766':'#748b59');
    else line([m.x,m.y,.02],[m.x+.25,m.y,.3],m.t===2?'#9ca66d':'#667e50',.6);
  }
  const {left,right}=terrain.river;
  // Clip the excavated channel at the lawn silhouette: lowered water must
  // never paint over the foreground bank in this orthographic projection.
  const depth=2.8;
  polygon([[left-.8,0,0],[right+.8,0,0],[right+.8,200,0],[left-.8,200,0]],'#718357');
  ctx.save();ctx.beginPath();
  [[left,0,0],[right,0,0],[right,200,0],[left,200,0]].forEach((v,i)=>{const q=p(...v);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});
  ctx.closePath();ctx.clip();
  polygon([[left,0,0],[right,0,0],[right,200,0],[left,200,0]],'#374e47');
  polygon([[left,0,-depth],[right,0,-depth],[right,200,-depth],[left,200,-depth]],'#507976');
  // The far bank exposes a vertical soil face rather than a bevel highlight.
  polygon([[left,0,0],[left,200,0],[left,200,-depth],[left,0,-depth]],'#78674e');
  polygon([[left,0,-.45],[left,200,-.45],[left,200,-1.1],[left,0,-1.1]],'#655b44');
  polygon([[left,0,-2.05],[left,200,-2.05],[left,200,-depth],[left,0,-depth]],'#4c5140');
  for(let y=0;y<200;y+=2.7){
    const z=.7+(Math.floor(y*3)%7)*.19;
    line([left,y,-z],[left,y+.8,-z-.15],'#938164',.65);
  }
  polygon([[left,0,-depth+.02],[left+1.8,0,-depth+.02],[left+1.8,200,-depth+.02],[left,200,-depth+.02]],'#3c605d');
  for(let i=0;i<220;i++){
    const x=left+2+(i*3.17)%16,y=(i*7.79+time*(.3+i%3*.15))%200;
    line([x,y,-depth+.04],[x+1.2,y,-depth+.04],i%3?'#618984':'#76998f',.5);
  }
  for(const b of terrain.bridges){
    polygon([[left,b.y-b.width/2,-depth+.08],[right,b.y-b.width/2,-depth+.08],[right,b.y+b.width/2+1.8,-depth+.08],[left,b.y+b.width/2+1.8,-depth+.08]],'#203c3c66');
  }
  ctx.restore();
  // Thin turf edge only, no bright raised rim around the river.
  line([left,0,0],[left,200,0],'#576b44',1);
  line([right,0,0],[right,200,0],'#526440',1);
  for(const b of terrain.bridges){
    const y0=b.y-b.width/2,y1=b.y+b.width/2;
    if(b.y===100){
      box(100,100,24,16,.65,'#777d72',-.55);
      for(const x of [94,106])box(x,100,1.5,14,2.1,'#667267',-2.7);
    }
    polygon([[left-2,y0,.1],[right+2,y0,.1],[right+2,y1,.1],[left-2,y1,.1]],'#998964');
    for(let x=left-2;x<=right+2;x+=1.4)line([x,y0,.15],[x,y1,.15],'#7c7158',.7);
    for(const y of [y0,y1]){
      for(let x=left-2;x<=right+2;x+=4)box(x,y,.25,.25,1.4,'#887e61');
      line([left-2,y,1.3],[right+2,y,1.3],'#c0ad7d',1.2);
    }
  }
  // Continuous granite rails, interrupted only at the three bridge mouths.
  const railSections=[];let railStart=0;
  for(const b of terrain.bridges){
    const end=b.y-b.width/2-1;
    if(end>railStart)railSections.push([railStart,end]);
    railStart=b.y+b.width/2+1;
  }
  if(railStart<200)railSections.push([railStart,200]);
  for(const x of [left-.7,right+.7])for(const [start,end] of railSections){
    const count=Math.ceil((end-start)/5),length=(end-start)/count;
    for(let i=0;i<count;i++)graniteRail(x,start+(i+.5)*length,length);
  }
  const nearHouse=houseContains(player.x,player.y,25)&&!player.riding;
  screamHouseScene(nearHouse);const nearWood=woodHouseScene();railway();for(const st of stations)stationModel(st);
  middlePlatformCipher();trainModel();
  const boundary=[];
  for(let i=0;i<50;i++){
    const c=2+i*4;
    for(const x of [.6,199.4])if(!gates.some(e=>e.x===x&&Math.abs(c-e.y)<6))boundary.push({x,y:c,w:1.2,d:4});
    for(const y of [.6,199.4])boundary.push({x:c,y,w:4,d:1.2});
  }
  boundary.sort((a,b)=>a.x+a.y-b.x-b.y);for(const b of boundary)perimeterWall(b.x,b.y,b.w,b.d);
  for(const e of gates)gate(e);
  if(!player.riding&&!nearHouse&&!nearWood){
    walkingPlayer();
  }
  if(blinkActive){
    const dest=blinkTarget(),a=p(player.x,player.y,.15),b=p(dest.x,dest.y,.15);
    ctx.save();ctx.strokeStyle='#d6ed91';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.ellipse(b.x,b.y,scale*1.2,scale*.6,0,0,Math.PI*2);ctx.stroke();
    const angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-9*Math.cos(angle-.5),b.y-9*Math.sin(angle-.5));ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-9*Math.cos(angle+.5),b.y-9*Math.sin(angle+.5));ctx.stroke();ctx.restore();
  }
  if(blinkPulse>0){const q=p(player.x,player.y);ctx.save();ctx.globalAlpha=blinkPulse/.3;ctx.strokeStyle='#d6ed91';ctx.beginPath();ctx.ellipse(q.x,q.y,scale*(1-blinkPulse+.5),scale*(1-blinkPulse+.5)*.5,0,0,7);ctx.stroke();ctx.restore();}
  // Roofs are opaque overhead surfaces: render after occupants and furniture.
  for(const st of stations)stationModel(st,true);
  screamHouseRoof();
  ctx.restore();
  if(reveal>0)walkingPlayer();
  radar();
}
function radar(){
  const c=$('#radar'),r=c.getContext('2d'),s=c.clientWidth,dpr=Math.min(devicePixelRatio||1,2);
  if(c.width!==Math.round(s*dpr)){c.width=Math.round(s*dpr);c.height=Math.round(s*dpr);}
  r.setTransform(dpr,0,0,dpr,0,0);r.clearRect(0,0,s,s);r.save();r.beginPath();r.arc(s/2,s/2,s/2-3,0,7);r.clip();
  const f=(s-16)/200;r.fillStyle='#637a50';r.fillRect(8,8,200*f,200*f);
  r.fillStyle='#62988e';r.fillRect(8+90*f,8,20*f,200*f);
  for(const b of terrain.bridges){r.fillStyle='#b7a479';r.fillRect(8+88*f,8+(b.y-b.width/2)*f,24*f,b.width*f);}
  for(const e of terrain.gates){r.fillStyle='#e8d1a0';r.fillRect(8+e.x*f-2,8+e.y*f-2,4,4);}
  r.strokeStyle='#b7a27a';r.beginPath();track.forEach((v,i)=>i?r.lineTo(8+v.x*f,8+v.y*f):r.moveTo(8+v.x*f,8+v.y*f));r.stroke();
  for(const b of terrain.bridges){r.strokeStyle='#756f58';r.lineWidth=3;r.beginPath();r.moveTo(8+90*f,8+b.y*f);r.lineTo(8+110*f,8+b.y*f);r.stroke();}
  for(const st of stations){r.fillStyle='#e6c581';r.fillRect(8+st.x*f-2,8+st.y*f-2,4,4);}
  r.fillStyle='#f3f1d4';r.beginPath();r.arc(8+player.x*f,8+player.y*f,2.5,0,7);r.fill();r.restore();
}
function frame(t){
  requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(document.hidden)return;time+=dt;
  cameraHeight+=((player.z||0)-cameraHeight)*(1-Math.exp(-dt*8));
  blinkPulse=Math.max(0,blinkPulse-dt);$('#kit').disabled=train.seats.includes('player');
  woodHouse.palletProgress=Math.min(1,Math.max(0,woodHouse.palletProgress+(woodHouse.palletDown?dt/.45:-dt/.45)));
  let x=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft))+joy.x;
  let y=Number(!!(keys.s||keys.arrowdown))-Number(!!(keys.w||keys.arrowup))+joy.y;
  const l=Math.max(1,Math.hypot(x,y));x/=l;y/=l;
   const pressed=interacting||keys.e;
   if(pressed&&!lastInteraction){
     const action=!player.riding&&!woodVault?woodAction(player):null;
     if(action){if(action.to)woodVault={from:{...player},to:action.to,elapsed:0};}
     else{
     if(player.riding){const dest=train.disembark('player');if(dest){Object.assign(player,dest);player.riding=false;player.seat=-1;}}
     else if(train.board('player',player)){player.riding=true;player.seat=train.seats.indexOf('player');}
     }
   }
   lastInteraction=!!pressed;train.update(dt);
   const seat=train.seats.indexOf('player');
   if(seat>=0){Object.assign(player,train.carPose(seat));player.riding=true;player.seat=seat;}
    else if(woodVault){
      woodVault.elapsed=Math.min(1,woodVault.elapsed+dt);const t=woodVault.elapsed,s=t*t*(3-2*t);
      player.x=woodVault.from.x+(woodVault.to.x-woodVault.from.x)*s;player.y=woodVault.from.y+(woodVault.to.y-woodVault.from.y)*s;player.z=Math.sin(t*Math.PI)*.65;
      if(t>=1){Object.assign(player,woodVault.to);woodVault=null;}
    }else{
     player.riding=false;player.seat=-1;
     const previous={x:player.x,y:player.y};
     moveOnTerrain(player,(x+y)/Math.SQRT2*8*dt,(y-x)/Math.SQRT2*8*dt);
     const dx=player.x-previous.x,dy=player.y-previous.y,distance=Math.hypot(dx,dy);
     const moving=distance>.001;
     if(moving){facing=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);walkPhase+=distance*1.5;}
     walkBlend+=((moving?1:0)-walkBlend)*(1-Math.exp(-dt*14));
   }
   if(seat>=0)walkBlend=0;
   const cipherX=stations[1].x-Math.sin(stations[1].angle)*5+Math.cos(stations[1].angle)*1.3;
   const cipherY=stations[1].y+Math.cos(stations[1].angle)*5+Math.sin(stations[1].angle)*1.3;
   const atCipher=Math.hypot(player.x-cipherX,player.y-cipherY)<4&&seat<0;
   const atWoodCipher=Math.hypot(player.x-157,player.y-67)<3&&(player.z||0)>=0&&seat<0;
   if(atWoodCipher&&pressed&&Math.hypot(x,y)<.1)woodHouse.cipher=Math.min(100,woodHouse.cipher+dt*10);
  if(atCipher&&pressed&&Math.hypot(x,y)<.1)train.cipher=Math.min(100,train.cipher+dt*10);
  const near=updateTerrainGate(gates,player,(interacting||keys.e)&&Math.hypot(x,y)<.1,dt);
  gateHint.textContent=near?(near.progress>=100?'大门已开启 · 地形预览不结算':near.progress>0?`开门 ${Math.floor(near.progress)}%`:'按住交互键 / E 开门'):'';
   if(atCipher)gateHint.textContent=`按住交互破译站旁密码机 ${Math.floor(train.cipher)}%`;
   if(atWoodCipher)gateHint.textContent=`木屋密码机 ${Math.floor(woodHouse.cipher)}% · 按住交互破译`;
   if(Math.hypot(player.x-149,player.y-64)<3.5)gateHint.textContent=woodHouse.palletDown?'交互 · 翻板':'交互 · 放下木板';
   if(Math.hypot(player.x-157,player.y-72)<3.5)gateHint.textContent='交互 · 翻窗';
  if(seat>=0)gateHint.textContent=train.moving?'列车行驶中 · 到站后可下车':`已坐入${seat===0?'车头':'车厢'} · 交互下车`;
  else if(!train.moving&&Math.hypot(player.x-train.carPose(0).x,player.y-train.carPose(0).y)<12)gateHint.textContent='靠近车头或车厢 · 交互上车';
  departure.hidden=seat!==0||train.moving;departure.disabled=train.cooldown>0;
  departure.textContent=train.cooldown>0?`发车冷却 ${Math.ceil(train.cooldown)}s`:'发车';
  stopChoice.style.display=seat===0&&train.approachingMiddle?'flex':'none';
  draw();
}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k)){e.preventDefault();keys[k]=true;}});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
const stick=$('#joystick');
function updateStick(e){const b=stick.getBoundingClientRect(),radius=b.width/2-22;let x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2;const l=Math.max(radius,Math.hypot(x,y));x=x/l*radius;y=y/l*radius;joy.x=x/radius;joy.y=y/radius;$('#nub').style.transform=`translate(${x}px,${y}px)`;}
function release(){pointer=null;joy.x=joy.y=0;interacting=false;$('#nub').style.transform='';for(const k of Object.keys(keys))keys[k]=false;}
stick.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;stick.setPointerCapture(pointer);updateStick(e);};stick.onpointermove=e=>{if(pointer===e.pointerId)updateStick(e);};stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=release;
window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
const interact=$('#interact');interact.onpointerdown=e=>{e.preventDefault();interact.setPointerCapture(e.pointerId);interacting=true;};interact.onpointerup=interact.onpointercancel=interact.onlostpointercapture=()=>interacting=false;
const blinkButton=$('#kit');
function resetBlink(){blinkPointer=null;blinkActive=false;blinkStart=null;blinkVector={x:0,y:0};blinkButton.classList.remove('aiming');blinkButton.querySelector('svg').style.transform='';}
function aimBlink(e){
  if(e.pointerId!==blinkPointer)return;
  blinkVector={x:e.clientX-blinkStart.x,y:e.clientY-blinkStart.y};
  const l=Math.max(1,Math.hypot(blinkVector.x,blinkVector.y)/24);
  blinkButton.querySelector('svg').style.transform=`translate(${blinkVector.x/l}px,${blinkVector.y/l}px)`;
}
blinkButton.onpointerdown=e=>{if(blinkPointer!==null||train.seats.includes('player'))return;e.preventDefault();blinkPointer=e.pointerId;blinkStart={x:e.clientX,y:e.clientY};blinkVector={x:0,y:0};blinkActive=true;blinkButton.classList.add('aiming');blinkButton.setPointerCapture(e.pointerId);};
blinkButton.onpointermove=aimBlink;
blinkButton.onpointerup=e=>{if(e.pointerId!==blinkPointer)return;aimBlink(e);if(!train.seats.includes('player')&&Math.hypot(blinkVector.x,blinkVector.y)>8){Object.assign(player,blinkTarget());blinkPulse=.3;}resetBlink();};
blinkButton.onpointercancel=blinkButton.onlostpointercapture=resetBlink;
window.addEventListener('blur',resetBlink);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetBlink();});
try{
  if(!ctx)throw new Error('Canvas 不可用');
  renderTeam($('#teamStatus'),Array.from({length:4},(_,i)=>({id:'terrain-'+i,nickname:i?'队友 '+i:'你',health:2})),null);
  $('#kit').disabled=false;$('#notice').hidden=true;requestAnimationFrame(frame);
}catch(e){$('#notice').textContent='加载失败：'+e.message;console.error(e);}
