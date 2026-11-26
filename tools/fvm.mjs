import fs from 'node:fs';
import {Mesh} from './art/js/mesh.js';
function make(fn){const m=new Mesh();fn(m);return m.chunks.get('model').data;}
export function save(name,base,alternate=null,flip=false,action=null,extra=null,bolt=null,idle=null) {
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
