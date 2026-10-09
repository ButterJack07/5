export const screamHouse={x:54,y:133,outerRadius:19,innerRadius:12,wallHeight:6,doorWidth:5,floorHeight:5.4,roofHeight:11.6};
const normals=Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}));
export const houseWalls=[];
for(const radius of [screamHouse.outerRadius,screamHouse.innerRadius]){
  const half=radius*Math.tan(Math.PI/8);
  for(let i=0;i<8;i++){
    const n=normals[i],t={x:-n.y,y:n.x},door=i===2||i===6;
    const spans=door?[[-half,-screamHouse.doorWidth/2],[screamHouse.doorWidth/2,half]]:[[-half,half]];
    for(const [a,b] of spans){
      houseWalls.push({x:screamHouse.x+n.x*radius+t.x*(a+b)/2,y:screamHouse.y+n.y*radius+t.y*(a+b)/2,angle:Math.atan2(t.y,t.x),length:b-a,thickness:.7,height:screamHouse.wallHeight,outer:radius===screamHouse.outerRadius});
    }
  }
}
export function houseContains(x,y,radius=screamHouse.outerRadius){
  const dx=x-screamHouse.x,dy=y-screamHouse.y;
  return normals.every(n=>dx*n.x+dy*n.y<=radius);
}
export function houseBlocks(x,y,r=.8){
  return houseWalls.some(w=>{
    const dx=x-w.x,dy=y-w.y,c=Math.cos(w.angle),s=Math.sin(w.angle);
    const u=dx*c+dy*s,v=-dx*s+dy*c;
    const a=Math.max(0,Math.abs(u)-w.length/2),b=Math.max(0,Math.abs(v)-w.thickness/2);
    return Math.hypot(a,b)<r;
  });
}
export function octagon(radius){
  const r=radius/Math.cos(Math.PI/8);
  return Array.from({length:8},(_,i)=>{const a=Math.PI/8+i*Math.PI/4;return [screamHouse.x+Math.cos(a)*r,screamHouse.y+Math.sin(a)*r,0];});
}
export const spiralSteps=Array.from({length:2},(_,side)=>{
  const boundary=octagon(10.2);
  const path=side?[[screamHouse.x+10.2,screamHouse.y],boundary[7],boundary[6],[screamHouse.x,screamHouse.y-10.2]]:[[screamHouse.x-10.2,screamHouse.y],boundary[3],boundary[4],[screamHouse.x,screamHouse.y-10.2]];
  // West flight follows the upper-left facets, east follows upper-right facets.
  if(!side){path[1]=boundary[4];path[2]=boundary[5];}
  return Array.from({length:37},(_,i)=>{
    const t=i/36*3,index=Math.min(2,Math.floor(t)),u=t-index,a=path[index],b=path[index+1];
    return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,angle:Math.atan2(b[1]-a[1],b[0]-a[0]),z:i/36*screamHouse.floorHeight,side};
  });
}).flat();

const flights=[0,1].map(side=>{
  let distance=0;
  return spiralSteps.filter(s=>s.side===side).map((s,i,all)=>{
    if(i)distance+=Math.hypot(s.x-all[i-1].x,s.y-all[i-1].y);
    return {...s,distance};
  });
});
function flightPose(flight,distance){
  const end=flight.at(-1).distance;
  distance=Math.max(0,Math.min(end,distance));
  const i=Math.max(1,flight.findIndex(s=>s.distance>=distance));
  const a=flight[i-1],b=flight[i],t=(distance-a.distance)/(b.distance-a.distance);
  const turn=Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,angle:a.angle+turn*t};
}

export function moveHouseStair(player,dx,dy){
  if(!dx&&!dy)return false;
  let active=player.houseStair;
  if(!active){
    for(let side=0;side<2;side++){
      const flight=flights[side],bottom=flight[0],top=flight.at(-1);
      const nearBottom=Math.hypot(player.x-bottom.x,player.y-bottom.y)<2&&(player.z||0)<.65;
      const nearTop=Math.hypot(player.x-top.x,player.y-top.y)<1.6&&(player.z||0)>4.7;
      const entry=nearBottom?bottom:nearTop?top:null;
      if(!entry)continue;
      const dot=dx*Math.cos(entry.angle)+dy*Math.sin(entry.angle);
      if((nearBottom&&dot>.01)||(nearTop&&dot<-.01)){
        active={side,distance:nearBottom?0:top.distance,direction:nearBottom?1:-1};player.houseStair=active;break;
      }
    }
  }
  if(!active)return false;
  const flight=flights[active.side],pose=flightPose(flight,active.distance);
  // Follow the stair bend while preserving forward/backward control.
  const dot=dx*Math.cos(pose.angle)+dy*Math.sin(pose.angle);
  // Keep travelling around a bend for transverse input; reverse only when
  // the player clearly pushes against the current flight direction.
  const strength=dot/Math.hypot(dx,dy);
  if(strength>.35)active.direction=1;
  else if(strength<-.35)active.direction=-1;
  active.distance+=active.direction*Math.hypot(dx,dy);
  const end=flight.at(-1).distance;
  Object.assign(player,flightPose(flight,active.distance));
  if(active.distance<=0||active.distance>=end){
    delete player.houseStair;
    if(active.distance>=end)player.z=screamHouse.floorHeight;
  }
  return true;
}

export function houseFloorHeight(x,y,previous=0){
  if(!houseContains(x,y))return 0;
  let stair={distance:Infinity,z:0};
  for(let i=1;i<spiralSteps.length;i++){
    const a=spiralSteps[i-1],b=spiralSteps[i];if(a.side!==b.side)continue;
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    const d=Math.hypot(x-a.x-dx*t,y-a.y-dy*t),z=a.z+(b.z-a.z)*t;
    if(d<stair.distance&&Math.abs(z-previous)<.7)stair={distance:d,z};
  }
  if(stair.distance<1.45)return stair.z;
  // Short upper landing connects the interior stairs through the north doorway.
  if(previous>4.7&&Math.abs(x-screamHouse.x)<1.5&&y<=screamHouse.y-9.5&&y>=screamHouse.y-15.5)return screamHouse.floorHeight;
  if(previous>4.7&&!houseContains(x,y,12.8))return screamHouse.floorHeight;
  // No floor at this height: block stepping off a flight instead of snapping down.
  return previous>.7?Infinity:0;
}
