// Local +Z faces the person standing in front of a fixture. Floor height is zero.
export const TAU=Math.PI*2;
export const tint=(color,k)=>color.map(v=>Math.min(1,v*k));
export function randomFor(seed){
 let n=2166136261;
 for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);
 return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
}
export class Fixture{
 constructor(mesh,kit={lights:[],obstacles:[],signs:[]},x=0,y=0,z=0,yaw=0){
  this.mesh=mesh;this.kit=kit;this.x=x;this.y=y;this.z=z;this.yaw=yaw;
  this.c=Math.cos(yaw);this.s=Math.sin(yaw);
 }
 at(x,y,z){return [this.x+this.c*x+this.s*z,this.y+y,this.z-this.s*x+this.c*z];}
 child(x,y,z,yaw=0){return new Fixture(this.mesh,this.kit,...this.at(x,y,z),this.yaw+yaw);}
 box(x,y,z,w,h,d,color,material=0,rotation=0){this.mesh.box(...this.at(x,y,z),w,h,d,color,material,this.yaw+rotation);}
 beam(a,b,ra,rb,color,material=0,sides=5){
  this.mesh.beam(this.at(...a),this.at(...b),ra,rb,color,material,sides);
 }
 poly(points,color,material=0){
  const p=points.map(v=>this.at(...v));
  for(let i=1;i<p.length-1;i++)this.mesh.tri(p[0],p[i],p[i+1],color,material);
 }
 panel(x,y,z,w,h,color,material=0){this.poly([[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]],color,material);}
 flat(x,y,z,w,d,color,material=0){this.poly([[x-w/2,y,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y,z-d/2]],color,material);}
 light(x,y,z,color,power){
  const p=this.at(x,y,z);this.kit.lights.push({x:p[0],y:p[1],z:p[2],color,power});
 }
 block(x,z,w,d,h){
  const p=this.at(x,0,z);
  this.kit.obstacles.push({x:p[0],z:p[2],w:Math.abs(w*this.c)+Math.abs(d*this.s),d:Math.abs(w*this.s)+Math.abs(d*this.c),h:h+this.y});
 }
 sign(x,y,z,w,h,text){
  const p=this.at(x,y,z);this.kit.signs.push({x:p[0],y:p[1],z:p[2],angle:this.yaw,w,h,text});
 }
}
// Rotated faces let the software renderer light each segment independently.
export function vessel(f,x,y,z,rings,color,sides=8,material=0,ellipse=1){
 const at=(a,ring)=>[x+Math.sin(a)*ring[1],y+ring[0],z+Math.cos(a)*ring[1]*ellipse];
 for(let i=0;i<sides;i++){
  const a=TAU*i/sides,b=TAU*(i+1)/sides;
  for(let j=1;j<rings.length;j++){
   const lower=rings[j-1],upper=rings[j],palette=Array.isArray(color[0])?color[(j-1)%color.length]:color;
   const col=tint(palette,.96+(i%3)*.025);
   if(!lower[1])f.poly([at(a,lower),at(a,upper),at(b,upper)],col,material);
   else if(!upper[1])f.poly([at(a,lower),at(a,upper),at(b,lower)],col,material);
   else f.poly([at(a,lower),at(a,upper),at(b,upper),at(b,lower)],col,material);
  }
 }
 const top=rings.at(-1);
 if(top[1])f.poly(Array.from({length:sides},(_,i)=>at(TAU*i/sides,top)),Array.isArray(color[0])?color.at(-1):color,material);
}
export function cable(f,a,b,sag,r,color,sections=6){
 let previous=a;
 for(let i=1;i<=sections;i++){
  const t=i/sections,p=a.map((v,j)=>v+(b[j]-v)*t);
  p[1]-=4*t*(1-t)*sag;f.beam(previous,p,r,r,color,0,4);previous=p;
 }
}
export function groundStroke(f,a,b,w,col,y=.017){
 const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);
 if(d<.00001)return;
 const u=dz*w/(d*2),v=-dx*w/(d*2);
 f.poly([[a[0]-u,y,a[1]-v],[b[0]-u,y,b[1]-v],[b[0]+u,y,b[1]+v],[a[0]+u,y,a[1]+v]],col);
}
export function groundRing(f,x,z,rx,rz,w,color,y=.015,n=19){
 for(let i=0;i<n;i++){
  const a=i*TAU/n,b=(i+1)*TAU/n;
  const p=(t,d)=>[x+Math.cos(t)*(rx-d),y,z+Math.sin(t)*(rz-d)];
  f.poly([p(a,0),p(a,w),p(b,w),p(b,0)],color);
 }
}
export function irregular(f,x,z,rx,rz,y,color,rng,n=10,material=0){
 const points=[];
 for(let i=0;i<n;i++){
  const a=TAU*i/n,scale=.69+rng()*.31;points.push([x+Math.cos(a)*rx*scale,y,z+Math.sin(a)*rz*scale]);
 }
 for(let i=0;i<n;i++)f.poly([[x,y,z],points[i],points[(i+1)%n]],color,material);
}
export function roomsides(f,w,d){
 return [f.child(0,0,-d/2),f.child(w/2,0,0,-Math.PI/2),f.child(0,0,d/2,Math.PI),f.child(-w/2,0,0,Math.PI/2)];
}
