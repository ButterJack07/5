export const woodHouse={x:157,y:64,half:8,height:5.5,palletDown:false,palletProgress:0,cipher:0};
export const woodWalls=[
  {x:157,y:56,w:16,d:.65},
  ...[149,165].flatMap(x=>[{x,y:59.2,w:.65,d:6.4},{x,y:68.8,w:.65,d:6.4}]),
  {x:151.75,y:72,w:5.5,d:.65},{x:162.25,y:72,w:5.5,d:.65}
];
export function woodInside(x,y){return Math.abs(x-157)<8&&Math.abs(y-64)<8;}
export function woodBlocks(x,y,r=.8){
  const walls=[...woodWalls,{x:157,y:72,w:5,d:.65}];
  if(woodHouse.palletDown)walls.push({x:149,y:64,w:2,d:3.2});
  return walls.some(w=>Math.hypot(Math.max(0,Math.abs(x-w.x)-w.w/2),Math.max(0,Math.abs(y-w.y)-w.d/2))<r);
}
export function woodAction(player){
  if((player.z||0)<-.5)return null;
  if((player.z||0)>.5)return null;
  if(Math.hypot(player.x-149,player.y-64)<3.5){
    if(!woodHouse.palletDown){woodHouse.palletDown=true;return {message:'木板已放下'};}
    const x=player.x<149?151:147;
    if(woodBlocks(x,64))return null;
    return {message:'翻越木板',to:{x,y:64,z:0}};
  }
  if(Math.hypot(player.x-157,player.y-72)<3.5){
    const y=player.y<72?74:70;
    if(woodBlocks(157,y))return null;
    return {message:'翻越窗口',to:{x:157,y,z:0}};
  }
  return null;
}

export function moveBasement(player,dx,dy){
  const underground=(player.z||0)<-.001;
  const entry=x=>x>=150&&x<=152&&player.y>=57.5&&player.y<=60.5;
  if(!underground&&!entry(player.x)&&!entry(player.x+dx))return false;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.2));
  for(let i=0;i<steps;i++){
    const advance=(x,y)=>{
      if(x<150||x>164||y<57||y>71)return;
      const onStair=y>=57.5&&y<=60.5&&x>=151&&x<=162;
      const topLanding=y>=57.5&&y<=60.5&&x>=150&&x<151;
      const z=topLanding?0:onStair?-5*(x-151)/11:-5;
      if(Math.abs(z-(player.z||0))>.35)return;
      player.x=x;player.y=y;player.z=z;
    };
    advance(player.x+dx/steps,player.y);advance(player.x,player.y+dy/steps);
  }
  return underground||entry(player.x)||(player.z||0)<-.001;
}
