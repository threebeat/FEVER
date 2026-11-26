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
import {save} from './fvm.mjs';
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
