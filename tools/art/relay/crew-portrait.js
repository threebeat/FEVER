import {offset,quad,line,shell} from './actor-geometry.js';

const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const dark=[.116,.116,.100],leather=[.156,.151,.125],lens=[.208,.252,.249];

const headRows=[
 [-.116,.042,.049,.033],[-.106,.058,.066,.025],[-.096,.070,.077,.020],[-.085,.080,.087,.013],
 [-.073,.086,.090,.011],[-.063,.090,.093,.009],[-.052,.096,.095,.005],[-.041,.099,.097,.002],
 [-.030,.103,.101,.001],[-.018,.107,.102,0],[-.007,.109,.103,0],[.004,.110,.104,-.001],
 [.015,.111,.106,-.003],[.026,.112,.106,-.004],[.042,.111,.108,-.004],[.063,.107,.106,-.006],
 [.083,.100,.099,-.009],[.101,.081,.080,-.009],[.110,.064,.067,-.010]
];
const complexions=new Map();
// All of the uniformed portraits wear close-fitting headgear. The uncovered
// temples retain the fine profile; the rear of the scalp needs fewer meridians.
const exposedRows=headRows.filter(row=>row[0]<=.063);
const meridians=Array.from({length:32},(_,i)=>i).filter(i=>i<=9||i>=23||i%2===0).map(i=>[Math.sin(i*Math.PI/16),Math.cos(i*Math.PI/16)]);
function complexion(m,skin,shadow,role){
 const key=role+skin.join('/')+shadow.join('/')+Number(!!m.fineSkin),cached=complexions.get(key);
 if(cached){for(const t of cached.triangles)m.tri(...t);return cached.at;}
 const triangles=[],cast={fineSkin:m.fineSkin,tri:(a,b,c,color,mat)=>triangles.push([a,b,c,color,mat||11])};
 const occlusion=shadow.map((v,i)=>v*[.84,.82,.85][i]);
 const tones=Array.from({length:8},(_,warmth)=>Array.from({length:40},(_,i)=>{
  const c=mix(skin,occlusion,i/39),t=warmth/7;
  return [c[0]*(1+.074*t),c[1]*(1-.041*t),c[2]*(1-.048*t)];
 }));
 const jaw=role==='medic'?.88:role==='officer'?.97:1;
 const socketX=role==='medic'?.043:.047;
 const bell=(v,w)=>Math.exp(-v*v/(w*w));
 const side=(x,y)=>{
  const ax=Math.abs(x),orbit=bell(ax-socketX,.033)*bell(y+.001,.016);
  const brow=bell(ax-.047,.038)*bell(y-.022,.011),cheek=bell(ax-.068,.026)*bell(y+.031,.018);
  const smile=bell(ax-(.021-.42*(y+.04)),.008)*bell(y+.051,.018);
  const jaw=bell(ax-.071,.043)*bell(y+.079,.026),temple=bell(ax-.094,.026)*bell(y-.001,.048);
  const browShade=Math.max(0,Math.min(1,(y+.011)/.040)),noseShade=bell(ax-.018,.009)*bell(y+.019,.022);
  return {depth:-.012*orbit+.0065*brow+.010*cheek-.0042*smile+.006*bell(x,.038)*bell(y+.093,.014),
   shade:.43*orbit+.22*browShade+.20*noseShade+.09*brow+.19*smile+.22*bell(y+.100,.018)+.20*temple+(role==='officer'||role==='ranger'?.31:.13)*jaw,
   warmth:Math.min(1,.08+.87*cheek+.64*bell(x,.025)*bell(y+.036,.021)+.34*temple)};
 };
 const radii=(row)=>row[1]*(1+(jaw-1)*Math.min(1,Math.max(0,-row[0]/.070)));
 const n=meridians.length;let previous;
 for(const row of exposedRows){
  const [y,,depth,offsetZ]=row,w=radii(row),next=[];
  for(let i=0;i<n;i++){
   const [sn,cs]=meridians[i],x=w*sn,detail=cs>0?side(x,y):null;
   next.push({v:[x,y,offsetZ+cs*depth+(detail?detail.depth*cs:0)],shade:detail?detail.shade:.07,warm:detail?detail.warmth:.1});
  }
  if(previous)for(let i=0;i<n;i++){
   const j=(i+1)%n,a=previous[i],b=previous[j],c=next[j],d=next[i];
   const tone=tones[Math.round((a.warm+b.warm+c.warm+d.warm)*1.75)][Math.min(39,Math.round((a.shade+b.shade+c.shade+d.shade)*9.75))];
   quad(cast,a.v,b.v,c.v,d.v,tone,11);
  }
  else for(let i=1;i<n-1;i++)cast.tri(next[0].v,next[i+1].v,next[i].v,shadow);
  previous=next;
 }
 for(let i=1;i<n-1;i++)cast.tri(previous[0].v,previous[i].v,previous[i+1].v,skin);
 // Return the same curved surface for eyelids, lips and whisker shadow.
 const at=(x,y,push=0)=>{
  let j=1;while(j<headRows.length-1&&y>headRows[j][0])j++;
  const a=headRows[j-1],b=headRows[j],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
  const w=radii(a)+(radii(b)-radii(a))*t,cs=Math.sqrt(Math.max(.008,1-(x/w)**2));
  const base=a[3]+(b[3]-a[3])*t+(a[2]+(b[2]-a[2])*t)*cs;
  return [x,y,base+side(x,y).depth*cs+push];
 };
 fixedFeatures(cast,at,skin,shadow,role);
 complexions.set(key,{triangles,at});for(const t of triangles)m.tri(...t);return at;
}

const noseRows=[[.014,.010,.008],[.004,.012,.015],[-.014,.014,.021],[-.027,.019,.029],[-.033,.021,.030],[-.039,.017,.021],[-.044,.007,.010]];
const noseSection=[[-1,.06],[-.76,.41],[-.42,.84],[0,1],[.42,.84],[.76,.41],[1,.06]];
function nose(m,at,skin,shadow,role){
 const breadth=role==='medic'?.90:role==='scout'?1.09:1;
 const bridge=skin.map((v,i)=>v*[1.025,.995,.985][i]);
 let last;
 for(const [y,w,d] of noseRows){
  const row=noseSection.map(([x,relief])=>at(x*w*breadth,y,relief*d));
  if(last)for(let i=1;i<row.length;i++){
   const side=Math.abs(i-3.5)/2.5,shade=y<=-.039?.42+.15*side:.04+.27*side*side;
   quad(m,last[i-1],last[i],row[i],row[i-1],mix(bridge,shadow,shade));
  }
  last=row;
 }
 for(const s of [-1,1]){
  const a=(x,y,z)=>at(s*x*breadth,y,z),rim=[a(.009,-.035,.018),a(.015,-.030,.017),a(.022,-.033,.012),a(.023,-.038,.008),a(.018,-.042,.006),a(.010,-.041,.012)];
  const bulb=a(.017,-.036,.0185);
  for(let i=0;i<rim.length;i++)m.tri(rim[i],rim[(i+1)%rim.length],bulb,i>2?mix(bridge,shadow,.46):bridge);
  quad(m,a(.010,-.039,.017),a(.014,-.037,.019),a(.018,-.038,.017),a(.014,-.041,.015),mix(shadow,dark,.62));
 }
}

// Features follow the curvature of the head. The lacrimal corner is farther
// forward than the temple; using that depth keeps three-quarter flashlight views intact.
function fixedFeatures(m,at,skin,shadow,role){
 const profile=role==='medic'?.92:role==='ranger'?1.04:1;
 const jaw=mix(skin,shadow,.34),brow=mix(shadow,dark,.42),eyeWhite=mix(skin,[.70,.70,.63],.37);
 for(const s of [-1,1]){
  const x0=.021*profile,x1=.071*profile,xm=(x0+x1)*.5;
  const inner=at(s*x0,-.003,.0032),outer=at(s*x1,.0005,.0022);
  const upper=at(s*xm,.004,.0125),lower=at(s*xm,-.006,.0115);
  const center=at(s*xm,-.001,.0172),iris=role==='medic'?[.186,.209,.183]:[.125,.104,.081];
  m.tri(inner,upper,center,eyeWhite);m.tri(inner,center,lower,eyeWhite);
  m.tri(outer,lower,center,mix(eyeWhite,skin,.23));m.tri(outer,center,upper,eyeWhite);
  const eye=(dx,dy,d)=>at(s*(xm+dx*1.25),-.001+dy*1.15,.0172+d);
  const disk=[eye(-.004,0,0),eye(-.002,.004,.0004),eye(.002,.004,.0004),eye(.004,0,0),eye(.002,-.004,.0001),eye(-.002,-.003,.0001)];
  for(let i=0;i<6;i++)m.tri(disk[i],disk[(i+1)%6],eye(0,0,.0008),iris);
  m.tri(eye(-.0025,0,.001),eye(0,.003,.0011),eye(.0025,-.0004,.001),[.048,.048,.043]);
  m.tri(eye(-.001,.002,.0014),eye(0,.003,.0009),eye(.001,.002,.0009),eyeWhite);
  quad(m,inner,at(s*x0,.006,.0045),at(s*xm,.013,.009),upper,jaw);
  quad(m,upper,at(s*xm,.013,.009),at(s*(x1+.006),.006,.001),outer,shadow);
  const lash=mix(shadow,dark,.48),crest=offset(upper,0,.0025,.001);
  quad(m,inner,upper,crest,offset(inner,0,.0008,.0005),lash);
  quad(m,upper,outer,offset(outer,0,.0017,.001),crest,lash);
  m.tri(inner,lower,at(s*(xm-.002),-.012,.006),shadow);
  m.tri(lower,outer,at(s*(xm+.012),-.013,.003),jaw);
  quad(m,at(s*(x0-.005),.013,.008),at(s*(x0-.004),.020,.009),
    at(s*(xm+.004),.025,.008),at(s*xm,.017,.010),brow);
  m.tri(at(s*(xm+.004),.025,.008),at(s*(x1+.009),.018,.0005),at(s*xm,.017,.010),brow);
  const noseToLip=[at(s*.022,-.039,.007),at(s*.032,-.047,.006),at(s*.039,-.057,.0035),at(s*.038,-.066,.002)];
  for(let j=0;j<noseToLip.length-1;j++){
   const a=noseToLip[j],b=noseToLip[j+1];
   quad(m,a,b,offset(b,s*.0025,.001,-.0007),offset(a,s*.004,0,-.0008),mix(skin,jaw,.48));
  }
  // The cup under the lower lid and the two planes below the mouth catch a raking beam.
  m.tri(at(s*.031,-.009,.009),at(s*.058,-.0095,.009),at(s*.053,-.017,.005),mix(skin,shadow,.13));
  m.tri(at(s*.012,-.074,.009),at(s*.031,-.080,.003),at(s*.015,-.09,.005),mix(skin,shadow,.21));
  const hair=mix(shadow,[.090,.079,.063],role==='medic'?.79:.68);
  const edge=[at(s*.093,.037,-.004),at(s*.104,-.001,.0004),at(s*.100,-.025,.001),at(s*.095,-.041,.0004)];
  const rear=[[s*.100,.033,.025],[s*.108,-.001,.002],[s*.105,-.026,.005],[s*.097,-.043,.024]];
  for(let j=1;j<edge.length;j++)quad(m,edge[j-1],edge[j],rear[j],rear[j-1],hair);
  if(role==='officer'||role==='ranger'){
   const stubble=mix(skin,shadow,.29),sidejaw=[at(s*.093,-.043,.001),at(s*.085,-.057,.002),at(s*.063,-.083,.007),at(s*.033,-.095,.011),at(s*.011,-.099,.006)];
   for(let j=1;j<sidejaw.length;j++){
    const a=sidejaw[j-1],b=sidejaw[j];
    const hi=offset(a,0,.007,.0003),lo=offset(b,0,.005,.001);
    quad(m,a,b,lo,hi,stubble);
   }
  }
  const ear=[s*.104,-.022,-.004];
  shell(m,ear,[[-.026,.006,.013],[-.016,.012,.021],[.010,.015,.023],[.025,.009,.017],[.028,.004,.010]],skin,8);
  const e=[s*.115,-.022,.000];
  quad(m,offset(e,0,.014,-.010),offset(e,s*.002,.009,.010),offset(e,0,-.011,.010),offset(e,-s*.002,-.013,-.008),shadow);
  line(m,offset(e,s*.002,.011,.010),offset(e,s*.004,-.005,.016),.0026,.002,jaw,5);
 }
 nose(m,at,skin,shadow,role);
}

export function portrait(face,skin,shadow,role,breath){
 const m=Object.create(face);
 m.tri=(a,b,c,color,mat)=>face.tri(a,b,c,color,mat||11);
 const at=complexion(m,skin,shadow,role);
 const width=role==='ranger'?.037:role==='medic'?.033:.035;
 const upperTint=mix(shadow,[.482,.252,.249],.44),lowerTint=mix(skin,[.517,.295,.281],.44);
 const seam=mix(upperTint,[.111,.073,.069],.58);
 const mouth=(x,y,z)=>at(x,y-.064+.0013*breath,z);
 let last;
 for(let i=0;i<=12;i++){
  const u=(i-6)/6,v=Math.max(0,1-u*u),x=u*width;
  const part=.0016*u*u-.0008*u+.0007*breath*v;
  const cupid=.0060*v+.0018*Math.exp(-(((Math.abs(u)-.29)/.19)**2));
  const line=[
   mouth(x,part+cupid,.003+.004*v),
   mouth(x,part+.0009*v,.005+.009*v),
   mouth(x,part-.0027*v,.005+.009*v),
   mouth(x,part-.0075*v,.004+.008*v),
   mouth(x,part-.0095*v,.002+.004*v)
  ];
  if(last){
   quad(m,last[0],line[0],line[1],last[1],upperTint);
   quad(m,last[1],line[1],line[2],last[2],seam);
   quad(m,last[2],line[2],line[3],last[3],lowerTint);
   quad(m,last[3],line[3],line[4],last[4],mix(skin,lowerTint,.63));
  }
  last=line;
 }
 for(const s of [-1,1]){
  const a=at(s*.004,-.043,.009),b=at(s*.010,-.056,.008);
  quad(m,a,b,offset(b,-s*.003,0,.001),offset(a,s*.002,0,-.001),mix(skin,shadow,.22));
 }
}

export function helmetHardware(m,trim,role){
 const glass=role==='scout'?[.342,.296,.196]:lens;
 for(const s of [-1,1]){
  const f=(x,y,z)=>[s*x,y,z];
  const edge=[f(.010,.016,.125),f(.025,.031,.128),f(.080,.027,.110),f(.103,.014,.088),f(.089,-.013,.096),f(.033,-.020,.123),f(.014,-.006,.126)];
  const center=f(.051,.004,.122),rim=edge.map(a=>mix(a,center,.13));
  for(let i=0;i<edge.length;i++){
   const j=(i+1)%edge.length;quad(m,edge[i],edge[j],rim[j],rim[i],leather,7);
   m.tri(rim[i],rim[j],center,glass,6);
  }
  const clip=f(.130,.053,-.072),ear=f(.134,-.022,-.017),chin=f(.070,-.085,.073);
  line(m,clip,ear,.008,.009,trim,6,8);line(m,ear,chin,.008,.007,trim,5,8);
  const cup=f(.126,-.016,-.007);
  shell(m,cup,[[-.042,.012,.031],[-.033,.029,.045],[.020,.030,.046],[.041,.015,.035]],leather,9,7);
  const l=offset(ear,s*.013,-.013,0);
  quad(m,offset(l,0,-.010,-.010),offset(l,0,.012,-.010),offset(l,0,.012,.009),offset(l,0,-.010,.009),[.306,.328,.304],5);
 }
 line(m,[.135,-.024,.004],[.106,-.065,.079],.003,.003,dark,5);
 line(m,[.106,-.065,.079],[.054,-.054,.120],.003,.004,dark,5);
 shell(m,[.051,-.054,.120],[[-.008,.011,.009],[0,.015,.011],[.009,.010,.008]],dark,8,7);
}
