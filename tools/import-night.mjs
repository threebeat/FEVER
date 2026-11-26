import fs from 'node:fs';
import {save} from './fvm.mjs';
import {buildGun} from './art/relay/guns.js';
import {buildEntity} from './art/relay/entity-art.js';
fs.mkdirSync('assets/meshes',{recursive:true});
for(const photo of [true,false]){
  const suffix=photo?'':'-low';
  const cole=(pose,t,options={})=>m=>buildEntity(m,'officer',pose,t,{photo,stableMesh:true,patrolPartner:true,...options});
  const seated={seated:true,holstered:true};
  save('cole-passenger'+suffix,cole('idle',.24,seated),cole('idle',.54,{...seated,passengerLook:1}),false,
    cole('idle',.24,{holstered:true}),cole('idle',.24,seated));
  save('cole-patrol'+suffix,cole('move',.25),cole('move',.75),false,
    cole('attack',.55),cole('aid',.66),cole('stun',.22),cole('idle',.24,{holstered:true}));
  const attendant=(pose,t)=>m=>buildEntity(m,'infected',pose,t,{photo,stableMesh:true,attendant:true});
  save('kennel-attendant'+suffix,attendant('move',.25),attendant('move',.75),false,attendant('tell',.4),attendant('stun',.22));
  for(const [name,id] of [['hunting','rifle'],['semi','carbine'],['sniper','rifle'],['launcher','launcher']]){
    const frame=(ops={})=>m=>buildGun(m,id,{loaded:2,stableMesh:true,helmet:true,lowDetail:!photo,variantModel:name,...ops});
    save(name+suffix,frame(),frame({aim:1}),true,frame({reload:.46}),frame({reload:.70}),
      frame(id==='rifle'?{boltCycle:.60}:{empty:true}),frame({action:'settle',grip:.16}));
  }
  for(const name of ['witch','golem','grey','grey-watch']){
    const kind=name.startsWith('grey')?'grey':name;
    const frame=(t,alternate=false)=>m=>{
      buildEntity(m,kind,'move',kind==='grey'?.21:t,{photo,stableMesh:true,standing:name==='grey-watch'?1:0,writhe:kind==='grey'?.21:t});
      if(kind==='grey'&&alternate){
        const data=m.chunks.get('model').data;
        for(let i=0;i<data.length;i+=10){const [x,y,z]=data.slice(i,i+3);const side=x<0?-1:1;
          const amount=Math.min(1,Math.abs(x)*1.45)*(name==='grey-watch'?.36:1);
          data[i]+=.053*Math.sin(y*5+z*3)*amount;data[i+1]+=.062*(.55+side*.45)*Math.cos(z*5)*amount;
          data[i+2]+=.15*side*Math.cos(y*3)*amount;}}
    };
    save(name+suffix,frame(.21),frame(.71,true));
  }
}
