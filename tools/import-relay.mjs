// Optional authoring step. The game ships with these native baked meshes.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2] || 'tools/art');
const get=p=>import(pathToFileURL(path.join(root,p)).href);
const {Mesh}=await get('js/mesh.js');
const {buildEntity}=await get('relay/entity-art.js');
const {buildGun}=await get('relay/guns.js');
const {uniformLeg}=await get('relay/crew-tailoring.js');
const {shell,box}=await get('relay/actor-geometry.js');
const {buildLiftHull,buildLiftRotor,buildRappelCrew}=await get('relay/airlift-art.js');
const {Fixture}=await get('relay/extension-art-kit.js');
const {dressKennelInstruments}=await get('relay/kennel-instruments.js');
fs.mkdirSync('assets/meshes',{recursive:true});
function make(fn){const m=new Mesh();fn(m);return m.chunks.get('model').data;}
function save(name,base,alternate=null,flip=false,action=null,extra=null,bolt=null,idle=null) {
  const data=make(base), pose=alternate?make(alternate):data;
  const tracks=[pose,...(action?[make(action),make(extra)]:[]),...(bolt?[make(bolt),make(idle)]:[])];
  if(tracks.some(track=>track.length!==data.length))throw Error(name+' pose topology differs');
  const verts=[],ids=[],lookup=new Map();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  for(let i=0;i<data.length;i+=10){
    const b=Buffer.alloc(bolt?44:action?32:20);
    for(let k=0;k<3;k++){
      const sign=flip&&k===2?-1:1;
      b.writeInt16LE(clamp(Math.round(sign*data[i+k]*2400),-32768,32767),2*k);
      b.writeInt8(clamp(Math.round(sign*data[i+3+k]*127),-127,127),6+k);
      b[9+k]=clamp(Math.round(data[i+6+k]*255),0,255);
      tracks.forEach((t,j)=>b.writeInt16LE(clamp(Math.round(sign*(t[i+k]-data[i+k])*3200),-32768,32767),14+k*2+j*6));
    }
    b[12]=data[i+9]; const key=b.toString('base64');
    let index=lookup.get(key);
    if(index===undefined){index=verts.length;lookup.set(key,index);verts.push(b);}
    ids.push(index);
  }
  const head=Buffer.alloc(12);head.write(bolt?'FVM3':action?'FVM2':'FVM1');head.writeUInt32LE(verts.length,4);head.writeUInt32LE(ids.length,8);
  if(verts.length>65535)throw Error('mesh exceeds 16-bit index limit');
  const ind=Buffer.alloc(ids.length*2);ids.forEach((v,i)=>ind.writeUInt16LE(v,2*i));
  fs.writeFileSync('assets/meshes/'+name+'.fvm',Buffer.concat([head,...verts,ind]));
  console.log(name,verts.length,ids.length/3);
}
const entity=(name,kind,pose,t,opts={})=>save(name,m=>buildEntity(m,kind,pose,t,{photo:true,...opts}));
for(const photo of [true,false]){
  const suffix=photo?'':'-low';
  for(const kind of ['officer','medic','operator','infected','hound']){
    const frame=(pose,t)=>m=>buildEntity(m,kind,pose,t,{photo,stableMesh:true,hideWeapon:kind==='medic'});
    save(kind+suffix,frame('move',.25),frame('move',.75),false,
      frame(kind==='medic'?'aid':'attack',.55),frame('stun',.22));
  }
  entity('patient'+suffix,'witness','fall',1,{hideWeapon:true,photo});
  entity('sleeping-dog'+suffix,'kennelDog','fall',1,{photo});
  entity('medic-down'+suffix,'medic','fall',1,{hideWeapon:true,photo});
  for(const part of ['thigh','shin','boot']){
    save('reed-'+part+suffix,m=>{
      m.fineSkin=photo;m.lowDetail=!photo;
      const h=part==='thigh'?0:part==='shin'?.42:.83;
      uniformLeg(m,[0,h,0],[0,h-.42,0],[0,h-.83,0],1,[.155,.181,.218],[.179,.203,.224],part);
    });
  }
  save('reed-coat'+suffix,m=>{
    m.fineSkin=photo;m.lowDetail=!photo;
    shell(m,[0,0,0],[[-.18,.16,.103],[-.13,.19,.12],[.035,.173,.124],[.20,.205,.145],[.30,.20,.142]],
      [.178,.196,.221],photo?12:7,8);
    shell(m,[0,0,0],[[-.026,.177,.14],[-.019,.183,.146],[.036,.183,.146],[.042,.176,.138]],[.12,.135,.13],photo?12:7,9);
    box(m,[0,.006,.145],.069,.042,.013,[.37,.39,.37],5);
    for(const side of [-1,1]){box(m,[side*.17,.005,.041],.066,.10,.078,[.13,.148,.15],9);
       box(m,[side*.17,.039,.081],.051,.023,.006,[.21,.225,.215],9);}
  });
  save('reed-shoulders'+suffix,m=>{
    const src=new Mesh();buildEntity(src,'officer','idle',0,{photo,hideWeapon:true});
    const vertices=src.chunks.get('model').data;
    for(let k=0;k<vertices.length;k+=30){
      const point=i=>[vertices[k+i],vertices[k+i+1]-.91,vertices[k+i+2]];
      if(Math.min(vertices[k+1],vertices[k+11],vertices[k+21])>1.185)
        m.tri(point(0),point(10),point(20),vertices.slice(k+6,k+9),vertices[k+9]);
    }
  });
  for(const id of ['carbine','pistol','knife']){
    const frame=(opts={})=>m=>buildGun(m,id,{helmet:true,stableMesh:true,lowDetail:!photo,loaded:8,...opts});
    save(id+suffix,frame(),frame({aim:1}),true,frame(id==='knife'?{swing:.16}:{reload:.46}),
         frame(id==='knife'?{swing:.48}:{reload:.71}),frame(id==='knife'?{swing:.31}:{empty:true}),
         frame({action:'settle',grip:.18}));
  }
}
save('aircraft',m=>buildLiftHull(m,1));
save('rotor',m=>buildLiftRotor(m,0));
save('rope-officer',m=>buildRappelCrew(m,'ally',.45,'rappel'));
save('bench-officer',m=>buildRappelCrew(m,'ally',0,'bench'));
save('hardware',m=>dressKennelInstruments(new Fixture(m),6,6));
