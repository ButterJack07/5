import {walls,roofs,factory,cottages,churchFurniture,barrels,outdoorStoneWalls,redChurchDecorations} from './map.js';

// Procedural masonry uses a shared texture and instanced trim to keep draw calls bounded.
export function buildArchitecture(T,scene){
  function texture(){const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.fillStyle='#57504a';p.fillRect(0,0,256,256);for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const n=(row*31+col*17+500)%24;p.fillStyle=`rgb(${100+n},${82+n},${66+n})`;p.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);p.fillStyle='#ffffff09';p.fillRect(col*32+(row%2)*16+2,row*16+2,28,2);}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=T.SRGBColorSpace;return t;}
  const brick=new T.MeshStandardMaterial({map:texture(),roughness:.94}),stone=new T.MeshStandardMaterial({color:0xa49c85,roughness:.92}),iron=new T.MeshStandardMaterial({color:0x34433f,metalness:.65,roughness:.57}),wood=new T.MeshStandardMaterial({color:0x64513e,roughness:.88}),glass=new T.MeshStandardMaterial({color:0x273d40,metalness:.3,roughness:.25}),slate=new T.MeshStandardMaterial({color:0x384b4b,roughness:.8}),barrelWood=new T.MeshStandardMaterial({color:0x7a5a3a,roughness:.9}),tombMat=new T.MeshStandardMaterial({color:0x7a837c,roughness:.95}),carpetMat=new T.MeshStandardMaterial({color:0x801e2b,roughness:.85});
  const batches=new Map();
  function block(x,y,z,w,h,d,mat,rot=0){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({x,y,z,w,h,d,rot});}
  function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}

  // Red Church central wedding aisle red carpet
  mesh(new T.PlaneGeometry(5.4,38),carpetMat,100,.04,95).rotation.x=-Math.PI/2;

  // Red Church cemetery props (Tombstones, crypts, stone crosses)
  for(const d of redChurchDecorations){
    if(d.type==='tombstone'){
      block(d.x,d.h/2,d.y,d.w,d.h,d.d,tombMat);
      block(d.x,d.h+.1,d.y,d.w-.2,.2,d.d+.05,tombMat);
    }else if(d.type==='crossTomb'){
      block(d.x,.4,d.y,d.w,.8,d.d+.2,tombMat);
      block(d.x,d.h*.55,d.y,.35,d.h-.4,.3,stone);
      block(d.x,d.h*.65,d.y,1.1,.3,.3,stone);
    }else if(d.type==='crypt'){
      block(d.x,d.h/2,d.y,d.w,d.h,d.d,stone);
      block(d.x,d.h+.25,d.y,d.w+.4,.5,d.d+.4,tombMat);
      // Crypt dark wrought-iron door
      block(d.x,1.4,d.y+d.d/2+.05,1.8,2.6,.1,iron);
    }else if(d.type==='bench'){
      block(d.x,.4,d.y,d.w,.15,d.d,wood);
      block(d.x,.85,d.y-d.d/2+.08,d.w,.75,.12,wood);
      for(const bx of [-d.w/2+.3,d.w/2-.3])block(d.x+bx,.2,d.y,.15,.4,d.d-.1,iron);
    }
  }

  // Dedicated European stone walls and low perimeter barriers
  for(const sw of outdoorStoneWalls){
    block(sw.x,sw.h/2,sw.y,sw.w,sw.h,sw.d,stone);
    block(sw.x,sw.h+.15,sw.y,sw.w+.3,.3,sw.d+.3,stone);
    // Add stone piers every 5-6 meters on outdoor fences
    const count=Math.max(2,Math.round(sw.w/5));
    for(let i=0;i<count;i++){
      const ox=sw.x-sw.w/2+i*(sw.w/(count-1));
      block(ox,sw.h/2+.2,sw.y,1.2,sw.h+.4,1.2,stone);
      block(ox,sw.h+.5,sw.y,1.4,.2,1.4,stone);
    }
  }

  // Realistic stacked wooden barrels (with iron hoops)
  for(const bc of barrels){
    const offsets=[[0,0,0],[.9,0,.5],[-.8,0,.6],[.2,1.1,.2],[-.7,0,-.5],[.8,0,-.6]];
    for(let i=0;i<Math.min(bc.count,offsets.length);i++){
      const [ox,oy,oz]=offsets[i];
      const barrel=new T.Group();
      barrel.position.set(bc.x+ox*.9,oy+1.05,bc.y+oz*.8);
      scene.add(barrel);
      const bMesh=new T.Mesh(new T.CylinderGeometry(.62,.62,1.9,10),barrelWood);
      bMesh.scale.set(1.15,1,1.15);
      bMesh.castShadow=true;bMesh.receiveShadow=true;
      barrel.add(bMesh);
      // Two metal bands on each barrel
      for(const by of [-.45,.45]){
        const ring=new T.Mesh(new T.CylinderGeometry(.72,.72,.09,10),iron);
        ring.position.y=by;
        barrel.add(ring);
      }
    }
  }
  for(const w of walls){if(w.rail){const base=w.base||0,len=Math.max(w.w,w.d),n=Math.ceil(len/1.8);for(let i=0;i<=n;i++){const x=w.x+(w.w>w.d?(i/n-.5)*w.w:0),z=w.y+(w.d>w.w?(i/n-.5)*w.d:0);block(x,base+.65,z,.09,1.3,.09,iron);}for(const y of [.5,1.3])block(w.x,base+y,w.y,w.w,.08,w.d,iron);continue;}if(!w.factory&&!w.cottage)continue;const h=w.h||4;block(w.x,h/2,w.y,w.w,h,w.d,brick);block(w.x,.3,w.y,w.w+.12,.6,w.d+.12,stone);block(w.x,h-.3,w.y,w.w+.32,.3,w.d+.32,stone);if(w.factory)block(w.x,4.3,w.y,w.w+.15,.25,w.d+.15,stone);
    const alongX=w.w>w.d,len=Math.max(w.w,w.d),n=Math.floor(len/6);for(let i=0;i<=n;i++){const u=n?(i/n-.5)*(len-.5):0,x=w.x+(alongX?u:0),z=w.y+(!alongX?u:0);block(x,h/2,z,alongX?.45:w.w+.3,h,alongX?w.d+.3:.45,stone);}
    if(len>5){const count=Math.floor(len/5);for(let i=0;i<count;i++){const u=((i+.5)/count-.5)*(len-1),x=w.x+(alongX?u:0),z=w.y+(alongX?0:u),y=w.factory?6.5:2.6;const g=new T.Group();g.position.set(x,y,z);g.rotation.y=alongX?0:Math.PI/2;scene.add(g);for(const side of [-1,1]){const pane=new T.Mesh(new T.PlaneGeometry(1.6,1.9),glass);pane.position.z=side*.52;pane.rotation.y=side<0?Math.PI:0;g.add(pane);const arch=new T.Mesh(new T.TorusGeometry(.86,.11,5,16,Math.PI),stone);arch.position.set(0,.95,side*.58);g.add(arch);for(const xx of [-.88,0,.88]){const bar=new T.Mesh(new T.BoxGeometry(xx===0?.06:.15,2,.15),xx===0?iron:stone);bar.position.set(xx,0,side*.58);g.add(bar);}const sill=new T.Mesh(new T.BoxGeometry(2,.18,.3),stone);sill.position.set(0,-1,side*.6);g.add(sill);}}}
  }
  for(const r of roofs){const rise=r.building==='factory'?3:2,half=r.w/2,geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-half,0,-r.d/2,0,rise,-r.d/2,-half,0,r.d/2,0,rise,-r.d/2,0,rise,r.d/2,-half,0,r.d/2,0,rise,-r.d/2,half,0,-r.d/2,0,rise,r.d/2,half,0,-r.d/2,half,0,r.d/2,0,rise,r.d/2],3));geo.computeVertexNormals();const roof=mesh(geo,new T.MeshStandardMaterial({color:0x384b4b,roughness:.85,side:T.DoubleSide}),r.x,r.z,r.y);roof.name='buildingRoof';roof.userData.roof=r;block(r.x,r.z+rise+.05,r.y,.18,.2,r.d+.3,iron);for(let z=-r.d/2;z<=r.d/2;z+=2)for(const sign of [-1,1])block(r.x+sign*half/2,r.z+rise/2+.04,r.y+z,Math.hypot(half,rise),.06,.08,iron,-sign*Math.atan2(rise,half));}
  for(const r of roofs){const rise=r.building==='factory'?3:2;for(const side of [-1,1]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-r.w/2,0,0,r.w/2,0,0,0,rise,0],3));g.computeVertexNormals();mesh(g,new T.MeshStandardMaterial({color:0x8d8270,roughness:.9,side:T.DoubleSide}),r.x,r.z,r.y+side*r.d/2);}}
  for(const p of churchFurniture){if(p.y===71){block(p.x,.7,p.y,p.w,1.4,p.d,stone);block(p.x,1.45,p.y,p.w+.3,.12,p.d+.3,stone);}else{block(p.x,.6,p.y,p.w,.22,p.d,wood);block(p.x,1,p.y+.5,p.w,.65,.16,wood);for(const x of [-2.5,2.5])block(p.x+x,.3,p.y,.18,.6,1,wood);}}
  // Stone columns and high transverse arches define the nave, not random barriers.
  for(const z of [77,89,101]){for(const x of [87,113]){mesh(new T.CylinderGeometry(.38,.5,10.5,10),stone,x,5.25,z);block(x,.2,z,1.2,.4,1.2,stone);}const arch=mesh(new T.TorusGeometry(13,.18,6,32,Math.PI),stone,100,9,z);arch.scale.y=.3;}
  // Rose window and bell tower above the south entrance.
  mesh(new T.TorusGeometry(2.1,.2,6,32),stone,100,8.5,130.58);
  const rose=mesh(new T.CircleGeometry(1.95,24),new T.MeshStandardMaterial({color:0x647b99,emissive:0x26344b,roughness:.3,side:T.DoubleSide}),100,8.5,130.56);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;block(100+Math.cos(a),8.5+Math.sin(a),130.65,2,.09,.1,stone,a);}
  block(100,14,126,6,4,6,stone);const spire=mesh(new T.ConeGeometry(4.4,7,4),slate,100,19.5,126);spire.rotation.y=Math.PI/4;
  block(100,24,126,.18,2.2,.18,iron);block(100,24.4,126,1.2,.16,.18,iron);
  for(const [x,z] of [[77,96],[123,96]]){block(x,.6,z,1.6,1.2,1.6,stone);mesh(new T.SphereGeometry(.65,10,6),stone,x,1.35,z);}
  // Cottage details: Stone chimney, wood eaves and timber trim.
  for(const c of cottages){
    block(c.x-c.w/2+.4,5.2,c.y,1.4,4,1.4,stone);
    block(c.x-c.w/2+.4,7.4,c.y,1.6,.4,1.6,stone);
    block(c.x-6,.7,c.y,1.5,1.4,3,wood);
    block(c.x+5,.7,c.y+3,2,1.4,1.5,wood);
  }
  // Warm lamps, but no per-lamp shadow maps on mobile.
  for(const [x,z] of [[78,76],[120,102]]){block(x,6,z,.35,1,.35,iron);const bulb=mesh(new T.SphereGeometry(.2,6,4),new T.MeshStandardMaterial({color:0xffd6a0,emissive:0xffb85c,emissiveIntensity:2}),x,5.7,z);const light=new T.PointLight(0xffcf91,8,14,2);light.position.copy(bulb.position);scene.add(light);}
  for(const [material,parts] of batches){const inst=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,parts.length),dummy=new T.Object3D();parts.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,p.rot);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
}
