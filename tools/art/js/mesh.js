// Geometry can be batched by patch for visibility culling.
export class Mesh {
  constructor(chunkSize = 0, scenery = false) {
    this.chunkSize = chunkSize;
    if (scenery && !chunkSize) this.forms = new Map();
    this.chunks = new Map();
  }
  tri(a, b, c, color, material = 0, uv = null) {
    const size = this.chunkSize * 3;
    const key = size ? Math.floor((a[0]+b[0]+c[0])/size) + ',' + Math.floor((a[2]+b[2]+c[2])/size) : 'model';
    let patch = this.chunks.get(key);
    if (!patch) {
      patch = { data: [], lo:[Infinity,Infinity,Infinity], hi:[-Infinity,-Infinity,-Infinity] };
      this.chunks.set(key, patch);
    }
    if (uv) {
      if (!patch.uv) patch.uv=new Map();
      patch.uv.set(patch.data.length/30, uv);
    }
    const x=b[0]-a[0], y=b[1]-a[1], z=b[2]-a[2];
    const xx=c[0]-a[0], yy=c[1]-a[1], zz=c[2]-a[2];
    const nx=y*zz-z*yy, ny=z*xx-x*zz, nz=x*yy-y*xx;
    const inv=1/(Math.hypot(nx,ny,nz)||1);
    for (const v of [a,b,c]) {
      patch.data.push(v[0],v[1],v[2],nx*inv,ny*inv,nz*inv,color[0],color[1],color[2],material);
      for(let i=0;i<3;i++){
        patch.lo[i]=Math.min(v[i],patch.lo[i]);
        patch.hi[i]=Math.max(v[i],patch.hi[i]);
      }
    }
  }
  box(cx,cy,cz,w,h,d,color,material=0,yaw=0) {
    const capture=this.forms && Math.min(w,h,d)>=.048 && Math.max(w,h,d)<=8.5 && material!==12 && material!==13;
    const start=capture?(this.chunks.get('model')?.data.length||0)/30:-1;
    const cs=Math.cos(yaw), sn=Math.sin(yaw);
    const v=[];
    for (const z of [-d/2,d/2]) for (const y of [-h/2,h/2]) for(const x of [-w/2,w/2])
      v.push([cx+x*cs+z*sn,cy+y,cz-x*sn+z*cs]);
    for(const f of [[0,2,3,1],[4,5,7,6],[0,4,6,2],[1,3,7,5],[2,6,7,3],[0,1,5,4]]){
      this.tri(v[f[0]],v[f[1]],v[f[2]],color,material);
      this.tri(v[f[0]],v[f[2]],v[f[3]],color,material);
    }
    if(capture&&this.chunks.get('model')?.data.length/30===start+12)this.forms.set(start,{kind:'box',count:12});
  }
  beam(a,b,radiusA,radiusB,color,material=0,sides=5){
    const up=norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
    const right=norm(cross(up,Math.abs(up[1])>.9?[1,0,0]:[0,1,0]));
    const f=cross(up,right);
    const capture=this.forms && sides>=4 && sides<24 && Math.max(radiusA,radiusB)>=.038 && material!==13;
    const start=capture?(this.chunks.get('model')?.data.length||0)/30:-1;
    // Adjacent faces and the end caps share a ring. Build each position only once.
    const begin=[],end=[];
    for(let i=0;i<sides;i++){
      const t=i*Math.PI*2/sides,c=Math.cos(t),s=Math.sin(t);
      const x=right[0]*c+f[0]*s,y=right[1]*c+f[1]*s,z=right[2]*c+f[2]*s;
      begin.push([a[0]+x*radiusA,a[1]+y*radiusA,a[2]+z*radiusA]);
      end.push([b[0]+x*radiusB,b[1]+y*radiusB,b[2]+z*radiusB]);
    }
    for(let i=0;i<sides;i++){
      const next=(i+1)%sides;
      this.tri(begin[i],begin[next],end[next],color,material);
      this.tri(begin[i],end[next],end[i],color,material);
      if(i>0&&i<sides-1){
        this.tri(begin[0],begin[next],begin[i],color,material);
        this.tri(end[0],end[i],end[next],color,material);
      }
    }
    const count=4*sides-4;
    if(capture&&this.chunks.get('model')?.data.length/30===start+count)this.forms.set(start,{kind:'beam',count,sides});
  }
}
export function norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}
export function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export function product(a,b){
  const m=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)m[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return m;
}
export function perspective(fov,aspect,near,far){
  const s=1/Math.tan(fov/2),d=1/(near-far);
  return new Float32Array([s/aspect,0,0,0,0,s,0,0,0,0,(far+near)*d,-1,0,0,2*far*near*d,0]);
}
export function axes(yaw,pitch){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  return{forward:[sy*cp,sp,-cy*cp],right:[cy,0,sy],up:[-sy*sp,cp,cy*sp]};
}
export function viewMatrix(p,{forward:f,right:r,up:u}){
  return new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,p),-dot(u,p),dot(f,p),1]);
}
export function localMatrix(x,y,z,yaw=0,scale=1){
  const c=Math.cos(yaw)*scale,s=Math.sin(yaw)*scale;
  return new Float32Array([c,0,-s,0,0,scale,0,0,s,0,c,0,x,y,z,1]);
}
export function cameraObject(p,{forward:f,right:r,up:u},offset){
  const t=[0,1,2].map(i=>p[i]+r[i]*offset[0]+u[i]*offset[1]-f[i]*offset[2]);
  return new Float32Array([...r,0,...u,0,...f.map(x=>-x),0,...t,1]);
}
export function randomSeed(seed=12345){
  return()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
}
