import {houseBlocks,houseFloorHeight,moveHouseStair} from './scream-house.js';
import {woodBlocks,moveBasement} from './wood-house.js';
export const terrain={size:200,wallThickness:1.2,river:{left:90,right:110},bridges:[{y:38,width:12},{y:100,width:16},{y:162,width:12}],gates:[{x:.6,y:18,side:-1},{x:199.4,y:182,side:1}]};

export function updateTerrainGate(gates,player,held,dt){
  const near=gates.find(e=>Math.hypot(e.x-player.x,e.y-player.y)<7);
  if(near&&held)near.progress=Math.min(100,near.progress+dt*25);
  return near||null;
}

export function canWalkTerrain(x,y,radius=.8){
  const edge=terrain.wallThickness+radius;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<edge||y<edge||x>terrain.size-edge||y>terrain.size-edge)return false;
  if(houseBlocks(x,y,radius))return false;
  if(woodBlocks(x,y,radius))return false;
  if(x+radius<=terrain.river.left||x-radius>=terrain.river.right)return true;
  return terrain.bridges.some(b=>y-radius>=b.y-b.width/2&&y+radius<=b.y+b.width/2);
}

export function moveOnTerrain(player,dx,dy){
  if(moveBasement(player,dx,dy))return;
  if(moveHouseStair(player,dx,dy))return;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.25));
  for(let i=0;i<steps;i++){
    const step=(x,y)=>{const z=houseFloorHeight(x,y,player.z||0);if(canWalkTerrain(x,y)&&Math.abs(z-(player.z||0))<.7){player.x=x;player.y=y;player.z=z;}};
    step(player.x+dx/steps,player.y);step(player.x,player.y+dy/steps);
  }
}

export function blinkDestination(player,screenX,screenY,range=16){
  if(!Number.isFinite(screenX)||!Number.isFinite(screenY)||Math.hypot(screenX,screenY)<.01)return {...player};
  // Invert the isometric projection so the drag and ground arrow agree.
  let dx=screenX/(2*.866)+screenY,dy=screenY-screenX/(2*.866);
  const length=Math.hypot(dx,dy);dx/=length;dy/=length;
  const target={x:player.x,y:player.y,z:player.z||0};
  moveOnTerrain(target,dx*range,dy*range);
  return target;
}
