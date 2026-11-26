import {cross,norm} from '../js/mesh.js';

const TAU = Math.PI*2;
const paint = {
  slide:[.291,.322,.332], steel:[.398,.430,.431], blued:[.182,.209,.222],
  dark:[.098,.119,.128], steelEdge:[.480,.499,.474], glove:[.202,.222,.202],
  gloveFold:[.137,.162,.154], stitch:[.353,.366,.318], fatigues:[.318,.343,.270],
  cuff:[.203,.233,.193], brown:[.321,.285,.205], sand:[.439,.417,.312],
  laminate:[.464,.298,.181], umber:[.257,.213,.173], pack:[.265,.305,.305],
  paper:[.667,.652,.511], tritium:[.653,.795,.638], uv:[.60,.44,.98],
  glass:[.232,.327,.352], active:[.575,.795,.769], blade:[.475,.526,.542],
  keen:[.739,.785,.768], rubber:[.158,.185,.172], signal:[.957,.304,.061],
  orangeEdge:[.994,.499,.114], orangeShade:[.569,.193,.070], brass:[.735,.557,.280],
  web:[.388,.364,.271], webDark:[.240,.261,.211], twill:[.353,.370,.294],
  leather:[.267,.283,.248], wax:[.366,.372,.307], enamel:[.586,.609,.528],
  oxide:[.124,.150,.153], seal:[.182,.179,.158], ivory:[.746,.730,.619]
};
const clamp = v => Math.min(1,Math.max(0,Number.isFinite(v)?v:0));
const smooth = (a,b,value) => {
  const t=clamp((value-a)/(b-a));
  return t*t*(3-2*t);
};
const mix = (a,b,t) => a+(b-a)*t;
const between = (a,b,t) => a.map((v,i)=>mix(v,b[i],t));
const plus = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scaled = (v,s) => [v[0]*s,v[1]*s,v[2]*s];
const difference = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const finish={metal:5,glass:6,polymer:7,cloth:8,leather:9,enamel:10};
const finishes=new Map([
  [paint.rubber,finish.polymer],[paint.seal,finish.polymer],[paint.sand,finish.polymer],[paint.brown,finish.polymer],
  [paint.signal,finish.polymer],[paint.orangeShade,finish.polymer],[paint.orangeEdge,finish.enamel],
  [paint.glass,finish.glass],[paint.active,finish.glass],[paint.uv,finish.glass],[paint.enamel,finish.enamel],
  [paint.glove,finish.leather],[paint.gloveFold,finish.leather],[paint.leather,finish.leather],[paint.wax,finish.leather],
  [paint.web,finish.cloth],[paint.webDark,finish.cloth],[paint.fatigues,finish.cloth],[paint.cuff,finish.cloth],
  [paint.stitch,finish.cloth],[paint.twill,finish.cloth],[paint.paper,finish.enamel],[paint.ivory,finish.enamel]
]);
const faceFinish=(color,mat)=>mat===0||mat===5||mat===8?finishes.get(color)??mat:mat;

// The bright seam is waxed thread, the lighter panels are suede, and the hard
// ridges use the same cool rubber as the wrist seal. Keep the archival swatches.
const fieldSwatches=new Map([
  [paint.glove,[.428,.311,.201]],[paint.gloveFold,[.232,.181,.135]],
  [paint.leather,[.516,.391,.253]],[paint.wax,[.489,.391,.276]],
  [paint.stitch,[.542,.477,.347]],[paint.rubber,[.119,.140,.146]],
  [paint.fatigues,[.305,.329,.240]],[paint.cuff,[.208,.229,.163]],
  [paint.twill,[.397,.393,.284]],[paint.webDark,[.194,.216,.159]],
  [paint.slide,[.247,.282,.302]],[paint.blued,[.164,.193,.218]],
  [paint.steelEdge,[.507,.534,.524]],[paint.sand,[.425,.378,.270]]
]);
export function fieldLayer(mesh,lowDetail=false){
  const layer=Object.create(mesh);layer.lowDetail=lowDetail;
  if(!lowDetail)layer.tri=(a,b,c,color,mat,uv)=>mesh.tri(a,b,c,fieldSwatches.get(color)??color,mat,uv);
  return layer;
}

function quad(m,a,b,c,d,color,material=0) {
  const mat=faceFinish(color,material);m.tri(a,b,c,color,mat);m.tri(a,c,d,color,mat);
}
function polygon(m,points,color,material=0) {
  const mat=faceFinish(color,material);
  for(let i=1;i<points.length-1;i++)m.tri(points[0],points[i],points[i+1],color,mat);
}
function strips(m,sections,colors,material=0,caps=true) {
  const count=sections[0].length;
  for(let k=1;k<sections.length;k++){
    const a=sections[k-1], b=sections[k];
    for(let j=0;j<count;j++){
      const next=(j+1)%count;
      quad(m,a[j],a[next],b[next],b[j],colors[k-1],material);
    }
  }
  if(caps){
    polygon(m,sections[0].slice().reverse(),colors[0],material);
    polygon(m,sections.at(-1),colors.at(-1),material);
  }
}
const rims=new Map(),radialShapes=new WeakSet(),roundedSections=new WeakMap();
function rim(n) {
  if(!rims.has(n))rims.set(n,Array.from({length:n},(_,i)=>{
    const a=(i+.5)*TAU/n;
    return [Math.sin(a),Math.cos(a)];
  }));
  const shape=rims.get(n);radialShapes.add(shape);return shape;
}
function limb(m,rows,sides=6,mat=8,caps=false,transport=false) {
  let lastRight=null;
  const sections=rows.map(([p,w,d],i)=>{
    const next=rows[Math.min(i+1,rows.length-1)][0];
    const previous=rows[Math.max(0,i-1)][0];
    const axis=norm(difference(next,previous));
    let guide=transport&&lastRight?lastRight:(Math.abs(axis[0])<.88?[1,0,0]:[0,0,1]);
    if(Math.abs(guide.reduce((n,v,k)=>n+v*axis[k],0))>.98)guide=Math.abs(axis[0])<.8?[1,0,0]:[0,0,1];
    const forward=norm(cross(guide,axis)),right=cross(axis,forward);
    lastRight=right;
    return rim(sides).map(([a,b])=>plus(p,plus(scaled(right,w*a),scaled(forward,d*b))));
  });
  strips(m,sections,rows.map(v=>v[3]),mat,caps);
  return sections;
}
const bevel=[[-.71,1],[-1,.66],[-1,-.62],[-.68,-1],[.68,-1],[1,-.62],[1,.66],[.71,1]];
const slimBevel=[[-.65,1],[-1,.57],[-1,-.70],[-.70,-1],[.70,-1],[1,-.70],[1,.57],[.65,1]];
// Cast shoulders have a measurable fillet. Each corner carries its own normal
// transition while the machined flats retain their original width.
function finishedProfile(shape){
  if(radialShapes.has(shape))return rim(Math.min(32,Math.max(12,Math.round(shape.length*1.5))));
  let profile=roundedSections.get(shape);if(profile)return profile;
  profile=[];
  for(let i=0;i<shape.length;i++){
    const corner=shape[i],prev=shape[(i+shape.length-1)%shape.length],next=shape[(i+1)%shape.length];
    const a=corner.map((v,j)=>v+.18*(prev[j]-v)),b=corner.map((v,j)=>v+.18*(next[j]-v));
    profile.push(a,corner.map((v,j)=>.25*a[j]+.50*v+.25*b[j]),b);
  }
  roundedSections.set(shape,profile);return profile;
}
// Rows specify the longitudinal position, height of the spine, half-width, half-height and finish.
function hull(m,rows,shape=bevel,mat=5,caps=true) {
  if(!m.lowDetail&&rows.some(row=>Math.min(row[2],row[3])>.0105))shape=finishedProfile(shape);
  const sections=rows.map(([z,y,w,h])=>shape.map(([x,b])=>[x*w,y+b*h,z]));
  strips(m,sections,rows.map(v=>v[4]),mat,caps);
}
function box(m,x,y,z,w,h,d,color,material=5) {
  const edge=Math.min(w,h,d);
  if(!m.lowDetail&&edge>.011&&Math.max(w,h,d)>.034){
    // Straight flats between three-way corner breaks. The narrow bevel catches
    // a turning flashlight where a six-face box would show one large flat.
    const r=Math.min(.0044,edge*.16),hx=w/2,hy=h/2,hz=d/2;
    const section=(rx,ry,k,zz)=>[[-rx+k,-ry],[rx-k,-ry],[rx,-ry+k],[rx,ry-k],[rx-k,ry],[-rx+k,ry],[-rx,ry-k],[-rx,-ry+k]].map(([u,v])=>[x+u,y+v,z+zz]);
    const rear=section(hx-r*.62,hy-r*.62,r*.55,-hz),a=section(hx,hy,r,-hz+r),b=section(hx,hy,r,hz-r),front=section(hx-r*.62,hy-r*.62,r*.55,hz);
    strips(m,[rear,a,b,front],[color,color,color],material,true);return;
  }
  const p=[];
  for(const oz of [-d/2,d/2])for(const oy of [-h/2,h/2])for(const ox of [-w/2,w/2])
    p.push([x+ox,y+oy,z+oz]);
  for(const [a,b,c,e] of [[0,2,3,1],[4,5,7,6],[0,4,6,2],[1,3,7,5],[2,6,7,3],[0,1,5,4]])
    quad(m,p[a],p[b],p[c],p[e],color,material);
}
function sidePlate(m,side,x,points,color,mat=5) {
  const p=points.map(([y,z])=>[side*x,y,z]);
  polygon(m,side>0?p:p.reverse(),color,mat);
}
function linked(m,points,r,color,mat=5,sides=4) {
  limb(m,points.map(p=>[p,r,r,color]),sides,mat,false);
}
function mapped(mesh,transform) {
  const points=new WeakMap();
  const get=p=>{
    let v=points.get(p);
    if(!v){v=transform(p);points.set(p,v);}
    return v;
  };
  return {lowDetail:!!mesh.lowDetail,tri(a,b,c,color,material=0){mesh.tri(get(a),get(b),get(c),color,material);}};
}
const dies={
  P:[[0,0,0,1,.60,1,.60,.54,0,.54]],K:[[0,0,0,1],[.64,1,.03,.46,.66,0]],
  B:[[0,0,0,1,.47,1,.62,.82,.46,.54,0,.54],[.46,.54,.64,.32,.58,.04,0,0]],
  S:[[.61,1,.04,.98,0,.58,.61,.42,.59,0,0,.02]],'9':[[.59,.54,0,.54,0,1,.59,1,.59,0,0,0]],
  '2':[[0,.98,.61,.98,.61,.63,0,.18,0,0,.61,0]],'4':[[.49,0,.49,1,0,.30,.68,.30]],
  '7':[[0,1,.63,1,.14,0]],'-':[[.07,.46,.48,.46]]
};
function dieStamp(m,start,right,up,height,text,ink){
  const at=(x,y)=>plus(start,plus(scaled(right,x*height),scaled(up,y*height)));
  for(let i=0;i<text.length;i++){
    for(const path of dies[text[i]]||[]){
      for(let j=2;j<path.length;j+=2){
        const x0=path[j-2]+i*.89,y0=path[j-1],x1=path[j]+i*.89,y1=path[j+1];
        const dx=x1-x0,dy=y1-y0,r=.065/Math.hypot(dx,dy),ox=-dy*r,oy=dx*r;
        quad(m,at(x0-ox,y0-oy),at(x1-ox,y1-oy),at(x1+ox,y1+oy),at(x0+ox,y0+oy),ink,5);
      }
    }
  }
}
function screw(m,side,x,y,z,r){
  const p=paint,at=(dy,dz,raise=0)=>[side*(x+raise),y+dy,z+dz];
  polygon(m,rim(6).map(([a,b])=>at(a*r,b*r)),p.steel,5);
  quad(m,at(-r*.55,-r*.40,.0004),at(-r*.27,-r*.58,.0004),at(r*.55,r*.40,.0004),at(r*.27,r*.58,.0004),p.dark,5);
}
function boreFace(m,cx,cy,z,rad,inside,sides){
  if(!m.lowDetail)sides=Math.min(32,Math.max(12,Math.round(sides*1.5)));
  const p=paint,face=rim(sides).map(([x,y])=>[cx+rad*x,cy+rad*y,z]),
    throat=rim(sides).map(([x,y])=>[cx+rad*inside*x,cy+rad*inside*y,z-.0003]);
  for(let i=0;i<sides;i++){const j=(i+1)%sides;quad(m,face[i],face[j],throat[j],throat[i],i<2?p.steelEdge:p.blued,5);}
  polygon(m,throat,p.oxide,5);
}
function backCap(m,cy,z,w,h){
  const p=paint,at=(x,y,d)=>[x*w,cy+y*h,z+d];
  const outside=slimBevel.map(([x,y])=>at(x,y,0));
  const inner=slimBevel.map(([x,y])=>at(x*.84,y*.81,.0028));
  for(let i=0;i<8;i++){const j=(i+1)%8;quad(m,outside[i],outside[j],inner[j],inner[i],i%4<2?p.steel:p.blued,5);}
  polygon(m,inner,p.dark,5);
  for(let i=0;i<3;i++){
    const y=-.47+i*.30,k=i===1?.62:.51;
    quad(m,at(-k,y,.003),at(k,y,.003),at(k-.08,y+.072,.003),at(-k+.03,y+.072,.003),i%2?p.slide:p.gloveFold,5);
  }
}

export {TAU,paint,clamp,smooth,mix,between,plus,scaled,difference,finish,quad,polygon,strips,rim,limb,bevel,slimBevel,hull,box,sidePlate,linked,mapped,dieStamp,screw,boreFace,backCap};
