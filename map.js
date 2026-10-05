export const SIZE=200;
export const factory={height:9,footprint:[[44,88],[84,88],[84,94],[96,94],[96,124],[88,124],[88,134],[44,134]],rooms:[{x:51,y:122},{x:81,y:121}]};
export const upperDeck={x:87,y:109,w:18,d:30,z:4};
export const ramps=[{x:103,y:112,w:6,d:24,top:100,bottom:124,kind:'ramp'},{x:84,y:111,w:6,d:14,top:104,bottom:118,kind:'stairs'}];
export const upperFloors=[{x:87,y:99,w:18,d:10},{x:92,y:114,w:8,d:20},{x:79.5,y:114,w:3,d:20},{x:99,y:97,w:14,d:6}];
export const railings=[{x:68,y:99,w:22,d:.4},{x:68,y:116,w:22,d:.4},{x:57,y:107.5,w:.4,d:17},{x:79,y:107.5,w:.4,d:17}];
export const walls=[
 {x:52,y:88,w:16,d:1},{x:75,y:88,w:18,d:1},{x:84,y:91,w:1,d:6},{x:90,y:94,w:12,d:1},
 {x:96,y:105,w:1,d:10},{x:96,y:121,w:1,d:6},{x:92,y:124,w:8,d:1},{x:88,y:129,w:1,d:10},
 {x:50,y:134,w:12,d:1},{x:75,y:134,w:26,d:1},{x:44,y:95,w:1,d:14},{x:44,y:118,w:1,d:32},
 {x:47,y:122,w:4,d:1},{x:56,y:122,w:6,d:1},{x:59,y:127.5,w:1,d:11},
 {x:75,y:121,w:8,d:1},{x:85,y:121,w:4,d:1},{x:71,y:127.5,w:1,d:13}
].map(w=>({...w,h:9,factory:true}));
walls.push(...railings.map(w=>({...w,h:1.3,rail:true})));
// One small cottage, with two windows and an open doorway.
walls.push(...[{x:18.5,y:69,w:6,d:1},{x:29.5,y:69,w:6,d:1},{x:15,y:75,w:1,d:13},{x:33,y:75,w:1,d:13},{x:18,y:81,w:7,d:1},{x:29,y:81,w:9,d:1}].map(w=>({...w,h:4,cottage:true})));
// Outside loops are broken wall segments, not extra enclosed buildings.
walls.push({x:97,y:43,w:10,d:1},{x:111,y:43,w:10,d:1},{x:116,y:47,w:1,d:8},{x:24,y:115,w:6,d:1},{x:35,y:115,w:8,d:1},{x:22,y:120,w:1,d:10},{x:112.5,y:72,w:3,d:1});
walls.push(...[{x:78,y:99,w:.4,d:10},{x:78,y:114,w:.4,d:20},{x:92,y:124,w:8,d:.4},{x:98,y:100,w:4,d:.4},{x:100,y:94,w:8,d:.4}].map(w=>({...w,h:1.3,base:4,rail:true})));
export const outdoorWindows=[{x:51,y:122},{x:81,y:121},{x:24,y:69}];
export const outdoorPallets=[{x:62,y:88},{x:59,y:134},{x:104,y:43},{x:29,y:115},{x:109,y:72}];
export const obstacles=[...[[12,12],[23,17],[43,12],[66,12],[84,14],[12,38],[36,34],[61,30],[86,35],[18,62],[42,59],[67,63],[87,70],[12,87],[106,10],[131,23],[131,59],[12,118],[35,128],[132,102]].map(([x,y])=>({x,y,r:2.8,type:'tree',h:8})),...[[103,19,4],[119,35,5],[125,78,5],[24,102,4],[121,119,6],[14,48,3],[103,72,4],[57,53,4],[80,42,3]].map(([x,y,r])=>({x,y,r,type:'rock',h:r*.8}))];
export const inside=(p,r)=>Math.abs(p.x-r.x)<=r.w/2&&Math.abs(p.y-r.y)<=r.d/2;
export function groundHeight(x,y,z=0){const p={x,y};for(const r of ramps)if(inside(p,r))return (r.bottom-y)/(r.bottom-r.top)*4;if(z>3.7&&upperFloors.some(r=>inside(p,r)))return 4;return 0;}
export function canStep(actor,x,y){const z=actor.z||0,nz=groundHeight(x,y,z);return nz<=z+.6;}

// Center the factory as one coherent group, including both ascent routes.
const shift=(p)=>{p.x+=30;p.y-=20;return p;};
factory.footprint=factory.footprint.map(([x,y])=>[x+30,y-20]);factory.rooms.forEach(shift);
walls.filter(w=>w.factory||w.rail).forEach(shift);ramps.forEach(r=>{shift(r);r.top-=20;r.bottom-=20;});upperFloors.forEach(shift);railings.forEach(shift);shift(upperDeck);
outdoorWindows.filter(w=>w.x!==24).forEach(shift);outdoorPallets.filter(p=>p.y===88||p.y===134).forEach(shift);
export const cottages=[{id:'west',x:24,y:75,w:18,d:12},{id:'east',x:164,y:135,w:18,d:12}];
walls.filter(w=>w.cottage).forEach(w=>w.building='west');
walls.push(...walls.filter(w=>w.cottage).map(w=>({...w,x:w.x+140,y:w.y+60,building:'east'})));
outdoorWindows.push({x:164,y:129});outdoorPallets.push({x:164,y:141});
export const exits=[{x:8,y:75,side:-1},{x:192,y:145,side:1}];
export const roofs=[{x:94,y:91,w:40,d:46,z:12,building:'factory'},{x:120,y:89,w:12,d:30,z:12,building:'factory'},...cottages.map(c=>({...c,z:6,building:c.id}))];
obstacles.push(...[[155,35,5],[162,73,4],[153,102,5],[52,154,5],[117,165,6],[174,171,4]].map(([x,y,r])=>({x,y,r,type:'rock',h:r*.8})),...[[160,20],[180,45],[171,96],[144,158],[27,160],[65,178],[185,186],[132,181]].map(([x,y])=>({x,y,r:2.8,type:'tree',h:8})));
for(let i=obstacles.length-1;i>=0;i--)if(ramps.some(r=>Math.abs(obstacles[i].x-r.x)<r.w/2+obstacles[i].r+4&&obstacles[i].y>r.top-6&&obstacles[i].y<r.bottom+6))obstacles.splice(i,1);
for(const rock of obstacles.filter(o=>o.type==='rock')){rock.w=rock.r*1.5;rock.d=rock.r;rock.radius=rock.r;rock.r=0;}
export function inBuilding(x,y,margin=0){return roofs.some(r=>Math.abs(x-r.x)<=r.w/2+margin&&Math.abs(y-r.y)<=r.d/2+margin);}
for(let i=obstacles.length-1;i>=0;i--)if(inBuilding(obstacles[i].x,obstacles[i].y,3))obstacles.splice(i,1);
for(let i=walls.length-1;i>=0;i--)if(!walls[i].factory&&!walls[i].cottage&&!walls[i].rail&&inBuilding(walls[i].x,walls[i].y,1))walls.splice(i,1);

// The central landmark is a Gothic church. Two interior staircases lead
// up to the U-shaped choir gallery overlooking the nave. No outdoor ramps.
export const church={name:'圣雾礼拜堂',height:12,footprint:[[86,66],[114,66],[114,84],[128,84],[128,106],[114,106],[114,130],[86,130],[86,106],[72,106],[72,84],[86,84]],rooms:[{x:79,y:84},{x:121,y:84}]};
Object.assign(factory,church);
for(let i=walls.length-1;i>=0;i--)if(walls[i].factory||walls[i].rail)walls.splice(i,1);
walls.push(...[
 {x:92,y:66,w:12,d:1},{x:108,y:66,w:12,d:1},{x:86,y:75,w:1,d:18},{x:114,y:75,w:1,d:18},
 {x:74.5,y:84,w:5,d:1},{x:83.5,y:84,w:5,d:1},{x:116.5,y:84,w:5,d:1},{x:125.5,y:84,w:5,d:1},
 {x:72,y:88,w:1,d:8},{x:72,y:102,w:1,d:8},{x:128,y:88,w:1,d:8},{x:128,y:102,w:1,d:8},
 {x:79,y:106,w:14,d:1},{x:121,y:106,w:14,d:1},{x:86,y:118,w:1,d:24},{x:114,y:118,w:1,d:24},
 {x:92,y:130,w:12,d:1},{x:108,y:130,w:12,d:1}
].map(w=>({...w,h:12,factory:true,church:true})));

// Both ascents are completely indoor staircases: West stairs (x=89) and East stairs (x=111).
ramps.splice(0,ramps.length,
  {x:89,y:119,w:4.5,d:18,top:110,bottom:128,kind:'stairs'},
  {x:111,y:119,w:4.5,d:18,top:110,bottom:128,kind:'stairs'}
);
// U-shaped choir gallery: south gallery connecting east and west aisles overlooking the nave.
upperFloors.splice(0,upperFloors.length,
  {x:100,y:107,w:26,d:6},
  {x:89,y:119,w:5.5,d:18},
  {x:111,y:119,w:5.5,d:18},
  {x:100,y:128,w:26,d:4}
);
// Safety railings along the inner edge overlooking the lower nave floor. Leave gap (x:96..104) for leaping/vaulting down into the nave.
railings.splice(0,railings.length,
  {x:92,y:104,w:10,d:.3},
  {x:108,y:104,w:10,d:.3},
  {x:92,y:119,w:.3,d:18},
  {x:108,y:119,w:.3,d:18}
);
walls.push(...railings.map(w=>({...w,rail:true,base:4,h:1.3})));
outdoorWindows.splice(0,outdoorWindows.length,...church.rooms,{x:24,y:69},{x:164,y:129});
outdoorPallets.splice(0,outdoorPallets.length,{x:98,y:130},{x:100,y:66},{x:104,y:43},{x:29,y:115},{x:109,y:72},{x:164,y:141});
for(let i=roofs.length-1;i>=0;i--)if(roofs[i].building==='factory')roofs.splice(i,1);
roofs.push({x:100,y:98,w:28,d:64,z:12,building:'church'},{x:79,y:95,w:14,d:22,z:12,building:'church'},{x:121,y:95,w:14,d:22,z:12,building:'church'});
export const churchFurniture=[...Array.from({length:4},(_,i)=>[{x:93,y:78+i*6,w:5,d:1.2,h:1.25},{x:107,y:78+i*6,w:5,d:1.2,h:1.25}]).flat(),{x:100,y:71,w:7,d:2,h:1.4}];
walls.push(...churchFurniture.map(w=>({...w,churchProp:true})));
for(let i=obstacles.length-1;i>=0;i--)if(inBuilding(obstacles[i].x,obstacles[i].y,4)||ramps.some(r=>Math.abs(obstacles[i].x-r.x)<r.w/2+5&&obstacles[i].y>r.top-4&&obstacles[i].y<r.bottom+4))obstacles.splice(i,1);
for(let i=walls.length-1;i>=0;i--)if(!walls[i].factory&&!walls[i].cottage&&!walls[i].rail&&!walls[i].churchProp&&inBuilding(walls[i].x,walls[i].y,1))walls.splice(i,1);
