import {SIZE,groundHeight} from './map.js';

export function walkSegment(game,from,to){
  const length=Math.hypot(to.x-from.x,to.y-from.y),n=Math.max(1,Math.ceil(length/.4));let z=from.z||0;const old=game.collisionHeight;
  try{for(let i=1;i<=n;i++){const x=from.x+(to.x-from.x)*i/n,y=from.y+(to.y-from.y)*i/n,next=groundHeight(x,y,z);if(Math.abs(next-z)>.35)return false;game.collisionHeight=next;if(game.blocked(x,y,1))return false;z=next;}return Math.abs(z-(to.z??z))<.5;}finally{game.collisionHeight=old;}
}
class Heap{
  constructor(){this.items=[];}
  push(v){const a=this.items;a.push(v);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v;}
  pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&a[child+1].f<a[child].f)child++;if(a[child].f>=last.f)break;a[i]=a[child];i=child;}a[i]=last;}return first;}
}
export function findRoute(game,start,target,budget=350){
  const goal={...target,z:target.z||0};if(walkSegment(game,start,goal))return [goal];
  const key=p=>`${Math.round(p.x/2)},${Math.round(p.y/2)},${Math.round((p.z||0)*4)}`,heuristic=p=>Math.hypot(p.x-goal.x,p.y-goal.y)+Math.abs((p.z||0)-goal.z)*3;
  const first={x:start.x,y:start.y,z:start.z||0,g:0,parent:null};first.f=heuristic(first);const heap=new Heap();heap.push(first);const cost=new Map([[key(first),0]]);let best=first,found=null;
  while(heap.items.length&&budget-->0){const p=heap.pop();if(p.g>cost.get(key(p)))continue;if(heuristic(p)<heuristic(best))best=p;if(Math.hypot(p.x-goal.x,p.y-goal.y)<2.8&&walkSegment(game,p,goal)){found=p;break;}
    for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[2,-2],[-2,2],[-2,-2]]){const x=p.x+dx,y=p.y+dy;if(x<2||y<2||x>SIZE-2||y>SIZE-2)continue;const next={x,y,z:groundHeight(x,y,p.z)},g=p.g+Math.hypot(dx,dy)+Math.abs(next.z-p.z)*.4,id=key(next);if(g>=(cost.get(id)??Infinity)||!walkSegment(game,p,next))continue;cost.set(id,g);next.g=g;next.f=g+heuristic(next);next.parent=p;heap.push(next);}}
  const path=[];let node=found||best;while(node?.parent){path.unshift({x:node.x,y:node.y,z:node.z});node=node.parent;}if(found)path.push(goal);
  // Skip redundant nodes only when the entire collision-sized corridor is walkable.
  const smooth=[];let anchor=start;for(let i=0;i<path.length;){let j=Math.min(path.length-1,i+8);while(j>i&&!walkSegment(game,anchor,path[j]))j--;smooth.push(path[j]);anchor=path[j];i=j+1;}return smooth;
}
