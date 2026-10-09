import {canWalkTerrain} from './park-terrain.js';

export const stations=[
  {id:0,name:'西门站',x:22,y:18,angle:0},
  {id:1,name:'河畔站',x:124,y:140,angle:Math.PI/2},
  {id:2,name:'东门站',x:178,y:182,angle:0}
];
// Cubic Hermite tangents keep track straight inside each platform.
const knots=[{x:10,y:18,tx:24,ty:0},{x:34,y:18,tx:30,ty:0},{x:57,y:62,tx:14,ty:48},{x:82,y:100,tx:36,ty:0},{x:114,y:100,tx:12,ty:0},{x:124,y:120,tx:0,ty:24},{x:124,y:152,tx:0,ty:32},{x:156,y:182,tx:28,ty:0},{x:190,y:182,tx:28,ty:0}];
export const track=[];
let total=0;
for(let k=0;k<knots.length-1;k++){
  const a=knots[k],b=knots[k+1];
  for(let i=k?1:0;i<=80;i++){
    const t=i/80,t2=t*t,t3=t2*t;
    const h=[2*t3-3*t2+1,t3-2*t2+t,-2*t3+3*t2,t3-t2];
    const v={x:h[0]*a.x+h[1]*a.tx+h[2]*b.x+h[3]*b.tx,y:h[0]*a.y+h[1]*a.ty+h[2]*b.y+h[3]*b.ty};
    const prev=track.at(-1);if(prev)total+=Math.hypot(v.x-prev.x,v.y-prev.y);
    track.push({...v,s:total});
  }
}
for(const station of stations)station.s=track.reduce((best,v)=>Math.hypot(v.x-station.x,v.y-station.y)<Math.hypot(best.x-station.x,best.y-station.y)?v:best).s;
export function trackPose(s){
  s=Math.max(0,Math.min(total,s));let hi=track.findIndex(v=>v.s>=s);hi=Math.max(1,hi);
  const a=track[hi-1],b=track[hi],t=(s-a.s)/(b.s-a.s||1);
  const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
  // Rail and pedestrian lanes share the level central bridge deck.
  const z=0;
  return {x,y,z,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}
export class ParkTrain{
  constructor(){this.station=0;this.s=stations[0].s;this.direction=1;this.moving=false;this.cooldown=0;this.seats=[null,null,null];this.cipher=0;this.skipMiddle=false;this.target=1;this.speed=0;this.cruiseSpeed=16;this.acceleration=6;this.braking=7;}
  carPose(seat){return trackPose(this.s-this.direction*seat*4.4);}
  board(id,player){
    if(this.moving||this.seats.includes(id))return false;
    const index=this.seats.findIndex((v,i)=>v===null&&Math.hypot(player.x-this.carPose(i).x,player.y-this.carPose(i).y)<6);
    if(index<0)return false;this.seats[index]=id;return true;
  }
  disembark(id){
    if(this.moving)return null;const seat=this.seats.indexOf(id);if(seat<0)return null;
    const pose=this.carPose(seat);
    for(const side of [-1,1]){const dest={x:pose.x-Math.sin(pose.angle)*4*side,y:pose.y+Math.cos(pose.angle)*4*side};if(canWalkTerrain(dest.x,dest.y)){this.seats[seat]=null;return dest;}}
    return null;
  }
  depart(id){
    if(this.seats[0]!==id||this.moving||this.cooldown>0)return false;
    if(this.station===0)this.direction=1;if(this.station===2)this.direction=-1;
    this.target=this.station+this.direction;this.skipMiddle=false;this.speed=0;this.moving=true;return true;
  }
  get approachingMiddle(){return this.moving&&this.target===1&&this.cipher>=100&&Math.abs(this.s-stations[1].s)<36;}
  chooseStop(id,stop){if(this.seats[0]!==id||!this.approachingMiddle)return false;this.skipMiddle=!stop;return true;}
  update(dt){
    this.cooldown=Math.max(0,this.cooldown-dt);if(!this.moving)return;
    if(this.target===1&&this.skipMiddle&&this.cipher>=100)this.target+=this.direction;
    const goal=stations[this.target].s,remaining=Math.abs(goal-this.s);
    // Predict stopping distance, then integrate the average velocity per step.
    const safeDistance=Math.max(0,remaining-this.speed*dt);
    const desired=Math.min(this.cruiseSpeed,Math.sqrt(2*this.braking*safeDistance)*.85,remaining*2);
    const oldSpeed=this.speed;
    this.speed=desired>oldSpeed?Math.min(desired,oldSpeed+this.acceleration*dt):Math.max(desired,oldSpeed-this.braking*dt);
    const next=this.s+this.direction*(oldSpeed+this.speed)*.5*dt;
    if(remaining<.02||(this.direction>0&&next>=goal)||(this.direction<0&&next<=goal)){
      this.s=goal;
      if(this.target===1&&this.skipMiddle&&this.cipher>=100){this.target+=this.direction;return;}
      this.station=this.target;this.moving=false;this.speed=0;this.cooldown=10;
    }else this.s=next;
  }
}

export const sleepers=[];
for(let s=0;s<=total;s+=1.8)sleepers.push(trackPose(s));
