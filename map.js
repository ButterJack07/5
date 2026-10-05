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
