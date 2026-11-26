const tau=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
export function offset(p,x=0,y=0,z=0) { return [p[0]+x,p[1]+y,p[2]+z]; }
const circles=new Map();
function circle(n,half=true){
  const key=n*2+Number(half);
  let ring=circles.get(key);if(ring)return ring;
  ring=Array.from({length:n},(_,i)=>{const a=(i+(half?.5:0))*tau/n;return [Math.sin(a),Math.cos(a)];});
  circles.set(key,ring);return ring;
}
export function line(m,a,b,r,s,c,n=5,mat=0){
  const large=Math.max(r,s);
  if(m.fineSkin&&large>.013)n+=large>.045?5:2;
  const dy=b[1]-a[1],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz)||1;
  const ux=dx/length,uy=dy/length,uz=dz/length,vertical=Math.abs(uy)>.9;
  const len=(vertical?Math.hypot(uy,uz):Math.hypot(ux,uz))||1;
  const rx=vertical?0:-uz/len,ry=vertical?uz/len:0,rz=vertical?-uy/len:ux/len;
  const fx=uy*rz-uz*ry,fy=uz*rx-ux*rz,fz=ux*ry-uy*rx;
  const bottom=[],top=[];
  for(const [sn,cs] of circle(n,false)){
    const x=rx*cs+fx*sn,y=ry*cs+fy*sn,z=rz*cs+fz*sn;
    bottom.push([a[0]+x*r,a[1]+y*r,a[2]+z*r]);top.push([b[0]+x*s,b[1]+y*s,b[2]+z*s]);
  }
  for(let i=0;i<n;i++){
    const j=(i+1)%n;quad(m,bottom[i],bottom[j],top[j],top[i],c,mat);
    if(i>0&&i<n-1){m.tri(bottom[0],bottom[j],bottom[i],c,mat);m.tri(top[0],top[i],top[j],c,mat);}
  }
}
export function box(m,p,w,h,d,c,mat=0,yaw=0) { m.box(p[0],p[1],p[2],w,h,d,c,mat,yaw); }
export function quad(m,a,b,c,d,tone,mat=0) { m.tri(a,b,c,tone,mat); m.tri(a,c,d,tone,mat); }

// Stacked, offset rings give a limb or a piece of ceramic a formed cross-section.
// Each row is [height, half-width, half-depth, lateral offset, fore-aft offset].
// Interpolate only widely spaced anatomical cross-sections. Closely packed rows
// describe lips, seams or hems and keep their original spacing and crease.
function sculpt(rows){
 const refined=[];
 for(let i=0;i<rows.length;i++){
  const a=rows[i],b=rows[i+1];refined.push(a);
  if(!b||b[0]-a[0]<.048||Math.max(a[1],a[2],b[1],b[2])<.042)continue;
  const prev=rows[Math.max(0,i-1)],next=rows[Math.min(rows.length-1,i+2)];
  const mid=[(a[0]+b[0])*.5];
  for(let k=1;k<5;k++){
   const start=a[k]||0,end=b[k]||0,value=(-((prev[k]||0)+(next[k]||0))+9*(start+end))/16;
   const edge=Math.abs(end-start)*.19+.001;
   mid.push(Math.max(Math.min(start,end)-edge,Math.min(Math.max(start,end)+edge,value)));
  }
  refined.push(mid);
 }
 return refined;
}
export function shell(m,p,rows,tone,n=6,mat=0) {
  if(m.fineSkin){const broad=rows.some(row=>row[1]>.05||row[2]>.05);n+=broad?Math.min(8,Math.ceil(n*.60)):2;if(broad)rows=sculpt(rows);}
  const ring=circle(n);let prev;
  for(let j=0;j<rows.length;j++){
    const [y,w,d,x=0,z=0]=rows[j], current=[];
    for(let i=0;i<n;i++){
      const [sn,cs]=ring[i];
      current.push(offset(p,x+sn*w,y,z+cs*d));
    }
    if(prev){
      for(let i=0;i<n;i++){
        const k=(i+1)%n;
        quad(m,prev[i],prev[k],current[k],current[i],tone,mat);
      }
    }else{
      for(let i=1;i<n-1;i++)m.tri(current[0],current[i+1],current[i],tone,mat);
    }
    if(j===rows.length-1)for(let i=1;i<n-1;i++)m.tri(current[0],current[i],current[i+1],tone,mat);
    prev=current;
  }
}

// The public side of an open guard ring faces the lens. Its center remains empty.
export function guard(m,p,rx,ry,width,depth,tone,n=8,mat=0,start=0,end=tau) {
  if(m.fineSkin)n+=Math.min(8,n);
  const point=(a,w,z)=>offset(p,Math.sin(a)*(rx-w),Math.cos(a)*(ry-w),z);
  for(let i=0;i<n;i++){
    const a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n;
    const oa=point(a,0,0),ob=point(b,0,0),ia=point(a,width,0),ib=point(b,width,0);
    quad(m,oa,ia,ib,ob,tone,mat);
    quad(m,oa,ob,point(b,0,-depth),point(a,0,-depth),tone,mat);
  }
}

// A cross-section running nose to tail, with the neck and muzzle on the same skin.
export function haunch(m,p,rows,color,sides=7){
  if(m.fineSkin){sides+=5;rows=sculpt(rows);}
  const profile=circle(sides);let prior;
  for(let j=0;j<rows.length;j++){
    const [z,w,h,y=0,x=0]=rows[j];
    const ring=Array.from({length:sides},(_,i)=>{
      const [sn,cs]=profile[i];return offset(p,x+w*sn,y+h*cs,z);
    });
    if(prior)for(let i=0;i<sides;i++)quad(m,prior[i],ring[i],ring[(i+1)%sides],prior[(i+1)%sides],color);
    if(j===0)for(let i=1;i<sides-1;i++)m.tri(ring[0],ring[i],ring[i+1],color);
    if(j===rows.length-1)for(let i=1;i<sides-1;i++)m.tri(ring[0],ring[i+1],ring[i],color);
    prior=ring;
  }
}
export function footfall(t,offsetPhase,stance=.56){
  const u=(t+offsetPhase)%1;
  if(u<stance)return {z:1-2*u/stance,lift:0};
  const swing=(u-stance)/(1-stance);
  return {z:-1+2*smooth(swing),lift:Math.sin(Math.PI*swing)};
}
export function insetMesh(m,p,yaw,pitch,roll=0,scale=1) {
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
  // Nearby skin and equipment rings share most of their corner objects.
  const vertices=m.fineSkin?new WeakMap():null;
  const map=point=>{
    const prior=vertices?.get(point);if(prior)return prior;
    const [x,y,z]=point;
    const u=x*cr-y*sr,v=x*sr+y*cr,h=v*cp-z*sp,d=v*sp+z*cp;
    const vertex=offset(p,(cy*u+sy*d)*scale,h*scale,(cy*d-sy*u)*scale);
    if(vertices)vertices.set(point,vertex);return vertex;
  };
  const part=Object.create(m);
  part.tri=(a,b,c,shade,mat=0)=>m.tri(map(a),map(b),map(c),shade,mat);
  return part;
}
