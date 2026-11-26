import {TAU,tint} from './extension-art-kit.js';

// Photo geometry uses the same metre scale and room-local winding as the regular facility.
export const steel=[.365,.397,.387],edge=[.52,.545,.512],iron=[.233,.269,.266],dark=[.119,.146,.145],
  rubber=[.133,.141,.133],sand=[.537,.470,.342],pale=[.728,.699,.572],rust=[.479,.301,.201],
  timber=[.431,.311,.201],teal=[.261,.38,.353],cream=[.688,.637,.513],olive=[.376,.394,.284];
const unit=p=>{const n=Math.hypot(...p)||1;return p.map(v=>v/n);};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function smoothTri(f,p,n,c,mat){
 const m=f.mesh;
 m.tri(f.at(...p[0]),f.at(...p[1]),f.at(...p[2]),c,mat);
 if(m.chunkSize)return;
 const data=m.chunks.get('model').data,start=data.length-30;
 for(let i=0;i<3;i++){
  const k=start+i*10+3,q=n[i];data[k]=f.c*q[0]+f.s*q[2];data[k+1]=q[1];data[k+2]=-f.s*q[0]+f.c*q[2];
 }
}
// A continuous round section, including at elbows. No overlapping cylinder caps inside bends.
export function hose(f,path,r,col,sides=9,mat=8){
 if(path.length<2)return;
 let before=null,basis=null;
 for(let j=0;j<path.length;j++){
  const tangent=unit(sub(path[Math.min(path.length-1,j+1)],path[Math.max(0,j-1)]));
  if(!basis)basis=unit(cross(tangent,Math.abs(tangent[1])>.78?[1,0,0]:[0,1,0]));
  else basis=unit(basis.map((v,i)=>v-tangent[i]*dot(basis,tangent)));
  const bi=cross(tangent,basis),ring=[];
  for(let i=0;i<sides;i++){
   const a=i*TAU/sides,n=basis.map((v,k)=>v*Math.cos(a)+bi[k]*Math.sin(a));
   const radius=Array.isArray(r)?r[j]:r;ring.push({p:path[j].map((v,k)=>v+n[k]*radius),n});
  }
  if(before)for(let i=0;i<sides;i++){
   const k=(i+1)%sides,a=before[i],b=before[k],c=ring[k],d=ring[i];
   smoothTri(f,[a.p,b.p,c.p],[a.n,b.n,c.n],col,mat);
   smoothTri(f,[a.p,c.p,d.p],[a.n,c.n,d.n],col,mat);
  }
  before=ring;
 }
}
export function elbow(f,path,r,c,sides=9,mat=8){
 const rounded=[path[0]];
 for(let i=1;i<path.length-1;i++){
  const a=path[i-1],b=path[i],d=path[i+1],from=mix(b,a,Math.min(.35,2.4*r/Math.hypot(...sub(a,b)))),to=mix(b,d,Math.min(.35,2.4*r/Math.hypot(...sub(d,b))));
  rounded.push(from);
  for(let j=1;j<=4;j++){const t=j/4;rounded.push(mix(mix(from,b,t),mix(b,to,t),t));}
 }
 rounded.push(path.at(-1));hose(f,rounded,r,c,sides,mat);
}
// The broad flats and narrow rolled edges have different normals, even in silhouette.
export function casework(f,x,y,z,w,h,d,bevel,col,mat=8){
 const r=Math.min(bevel,w*.20,h*.19,d*.22),top=h*.5,bottom=-top;
 const layer=(yw,inset)=>{
  const a=w*.5-inset,b=d*.5-inset,k=r*.69;
  return [[-a+k,-b],[a-k,-b],[a,-b+k],[a,b-k],[a-k,b],[-a+k,b],[-a,b-k],[-a,-b+k]].map(([u,v])=>[x+u,y+yw,z+v]);
 };
 const bands=[layer(bottom,r*.57),layer(bottom+r,0),layer(top-r,0),layer(top,r*.57)];
 for(let j=1;j<bands.length;j++)for(let i=0;i<8;i++){
  const k=(i+1)%8;f.poly([bands[j-1][k],bands[j-1][i],bands[j][i],bands[j][k]],j===1?tint(col,.84):j===3?tint(col,1.07):col,mat);
 }
 f.poly(bands[3].slice().reverse(),col,mat);f.poly(bands[0],tint(col,.86),mat);
}
export function zone(f,x,y,z,w,h,d,material){
 const p=f.at(x,y,z);
 f.kit.surfaces.push({x:p[0],y:p[1],z:p[2],w:Math.abs(w*f.c)+Math.abs(d*f.s),d:Math.abs(w*f.s)+Math.abs(d*f.c),h,material});
}
export function ring(f,x,y,z,r,gauge,col,segments=32,sides=6){
 const pts=[];for(let i=0;i<=segments;i++){const t=i*TAU/segments;pts.push([x+r*Math.cos(t),y+r*Math.sin(t),z]);}
 hose(f,pts,gauge,col,sides);
}
export function disc(f,x,y,z,r,depth,col,n=16){
 f.beam([x,y,z-depth*.5],[x,y,z+depth*.5],r,r,col,8,n);
}
export function bolt(f,x,y,z,r=.029){
 disc(f,x,y,z,r*1.28,.010,tint(iron,.82),8);disc(f,x,y,z+.013,r,.025,edge,6);
}
export function flange(f,x,y,z,r){
 disc(f,x,y,z,r,.078,iron,16);
 for(let i=0;i<8;i++){const a=i*TAU/8+.18;bolt(f,x+Math.cos(a)*r*.79,y+Math.sin(a)*r*.79,z+.048,r*.087);}
}
export function clockDial(f,x,y,z,r,t){
 disc(f,x,y,z,r,.097,dark,22);disc(f,x,y,z+.056,r*.90,.019,cream,24);
 ring(f,x,y,z+.076,r*.90,.008,edge,24,5);
 for(let i=0;i<=15;i++){
  const a=-Math.PI*.24+i/15*Math.PI*1.5,u=Math.cos(a),v=Math.sin(a);
  f.poly([[x+r*.84*u-.009*v,y+r*.84*v+.009*u,z+.069],[x+r*.84*u+.009*v,y+r*.84*v-.009*u,z+.069],[x+r*(i%3?.73:.60)*u,y+r*(i%3?.73:.60)*v,z+.069]],dark);
 }
 const u=Math.cos(t),v=Math.sin(t);
 f.poly([[x-.016*v,y+.016*u,z+.073],[x+r*.70*u,y+r*.70*v,z+.073],[x+.016*v,y-.016*u,z+.073]],rust);
 disc(f,x,y,z+.078,.023,.013,steel,8);
}
export function condensingUnit(f,w=1.3,h=.80){
 const d=.36;
 casework(f,0,0,0,w,h,d,.059,tint(pale,.84));
 const x=-w*.155,r=Math.min(w*.29,h*.405),z=d*.5+.024;
 disc(f,x,0,z,r+.026,.034,dark,24);
 for(let i=0;i<6;i++){
  const a=i*TAU/6,pt=(rr,t,depth)=>[x+rr*Math.cos(a+t),rr*Math.sin(a+t),depth];
  f.poly([pt(r*.19,-.05,z+.028),pt(r*.29,.37,z+.029),pt(r*.94,.61,z+.033),pt(r*.96,.21,z+.057),pt(r*.57,-.035,z+.068)],tint(steel,.67+i%3*.07),8);
 }
 disc(f,x,0,z+.072,r*.19,.046,iron,12);
 for(const k of [.35,.63,.88,1])ring(f,x,0,z+.104,r*k,.009,edge,24,5);
 for(let i=0;i<8;i++){const a=i*TAU/8;hose(f,[[x,0,z+.111],[x+r*Math.cos(a),r*Math.sin(a),z+.106]],.006,steel,4);}
 for(let j=0;j<9;j++)f.panel(w*.30,(j-4)*h*.079,z+.004,w*.229,.028,tint(steel,.79),8);
 for(const s of [-1,1])for(const v of [-1,1])bolt(f,s*(w*.5-.059),v*(h*.5-.063),z-.007,.014);
 casework(f,w*.285,-h*.322,z+.006,w*.19,.07,.013,.003,tint(teal,.93));
 for(const s of [-1,1]){
  f.box(s*w*.36,-h*.5-.040,-.04,.094,.063,.48,iron,8);
  f.beam([s*w*.36,-h*.5-.037,.16],[s*w*.36,-h*.5-.27,-.21],.019,.021,steel,8,5);
 }
 elbow(f,[[w*.5-.04,-h*.38,-.03],[w*.5+.15,-h*.38,-.08],[w*.5+.15,-h*.62,-.11],[w*.5+.23,-h*.67,-.12]],.018,rust,7);
 zone(f,0,-h*.5,0,w,h,d+.20,'metal');
}
