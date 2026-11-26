import {offset,line,shell,insetMesh} from './actor-geometry.js';
import {buildGib,tissue,woundSocket} from './actor-anatomy.js';

// Bits are shared with saved body damage. The torso bit marks the open chest.
export const golemBits={head:1,leftArm:2,rightArm:4,torso:8,leftLeg:16,rightLeg:32};
export const members=Object.keys(golemBits);
export const fragmentNames=[...members,'eye','hand'];
export const patternOf=e=>Math.abs((e.id||1)-1)%6;
const thread=[.117,.085,.071];
const baseMeasures=[
 {chest:.46,deep:.27,reach:.60,lean:.11}, {hip:.92,chest:.37,reach:.85,lean:.29},
 {spine:.66,chest:.34,deep:.26,lean:.17}, {hip:.90,chest:.49,deep:.32,leg:.17},
 {hip:1.07,spine:.60,leg:.125,deep:.20,reach:.75}, {spine:.45,chest:.46,reach:.78,lean:.33}
];
export const golemBuilds=base=>baseMeasures.map(row=>({...base,...row}));

const graftRows=[[-.3925,.58,.78,-.037],[-.204,.87,.90,0],[-.022,1,1.15,0],[.126,.97,.92,0],[.214,.56,.70,0]];
function skinJoin(m,q,r){
 const {chest,b}=r,sign=q.variant%2?-1:1,donor=q.variant%3;
 const point=(side,y,rise=0)=>{
  let i=1;while(i<graftRows.length-1&&graftRows[i][0]<y)i++;
  const a=graftRows[i-1],d=graftRows[i],mix=Math.min(1,Math.max(0,(y-a[0])/(d[0]-a[0]))),blend=k=>a[k]+mix*(d[k]-a[k]);
  // The join is cut to the heptagonal rib shell, including its upper and lower taper.
  const z=.901-Math.max(0,Math.abs(side)-.434)*1.255;
  return offset(chest,side*blend(1)*b.chest,y,blend(3)+z*blend(2)*b.deep+rise);
 };
 const hide=[[.41,.30,.28],[.53,.365,.34],[.48,.26,.26]][donor],fresh=[[.30,.098,.12],[.41,.145,.137],[.33,.12,.16]][donor];
 for(let i=0;i<3;i++){
  const y=.125-i*.109,edge=sign*(.11+.107*Math.sin(q.variant*.79+i*1.41)),side=sign*(.74+.050*Math.sin(i));
  const A=point(edge,y,.015),B=point(side,y-.044,.009),C=point(side-sign*.053,y-.139,.011),D=point(edge+sign*.052,y-.109,.022);
  const center=point((edge+side)*.5,y-.070,.036+.007*Math.sin(q.t*Math.PI*2+i));
  m.tri(A,B,center,hide);m.tri(B,C,center,hide);m.tri(C,D,center,hide);m.tri(D,A,center,fresh);
  line(m,A,D,.015,.009,tissue.clot,5);line(m,D,C,.012,.007,fresh,4);
  for(let j=0;j<2;j++){
   const h=y-.035-j*.046,u=edge+sign*(.01+.014*j);
   const root=point(u-sign*.075,h+.012,.018),pin=point(u,h+.007,.037),end=point(u+sign*.079,h-.006,.016);
   line(m,root,pin,.009,.009,thread,4);line(m,pin,end,.009,.006,thread,4);
  }
 }
 // Exposed filaments join one armpit to its borrowed pectoral.
 for(let j=0;j<3;j++){
  const side=-sign*(.60+j*.064),a=point(side,.11-j*.017,.016),b=point(side+sign*.17,.025-j*.017,.027);
  const c=point(-sign*(.12+j*.074),-.16+.041*j,.016);
  line(m,a,b,.020-.002*j,.023-.002*j,tissue.muscle,5);line(m,b,c,.022-.002*j,.008,fresh,5);
 }
}
export function graftMarks(m,q,r){
 const {chest,pelvis,b}=r,pattern=q.variant,sign=pattern%2?-1:1;
 if(!(q.mask&8))skinJoin(m,q,r);
 const p=offset(chest,sign*b.chest*.56,.06,.022);
 // Each assembly has a different, permanent silhouette above the arms.
 if(pattern===0||pattern===3){
  const size=pattern===3?1.32:1;
  shell(m,p,[[-.13,.13,.15],[0,.205*size,.18],[.17,.17,.15],[.21*size,.085,.08]],tissue.hide,8);
  for(let j=0;j<3;j++){const o=offset(p,sign*(.09-.02*j),.08-.07*j,.15);
   line(m,o,offset(o,sign*.041,.055,.012),.013,.010,thread,5);}
 }else if(pattern===1||pattern===5){
  for(let k=0;k<3;k++){
   const root=offset(p,sign*.033*k,.055,-.08+.067*k),knuckle=offset(root,sign*(.07+k*.025),.10+.015*k,-.012);
   const tip=offset(knuckle,sign*.11,-.13-.035*k,.09);
   line(m,root,knuckle,.057-.005*k,.042,tissue.torn,6);
   line(m,knuckle,tip,.04,.013,tissue.fat,5);
  }
 }else{
  for(let k=0;k<4;k++){
   const root=offset(chest,sign*(.1+.034*k),.03-k*.07,-b.deep*.71);
   const arch=offset(root,sign*.19,.23-.035*k,-.14),end=offset(chest,sign*.05,-.19-k*.05,.18);
   line(m,root,arch,.05,.031,tissue.ivory,6);line(m,arch,end,.033,.020,tissue.ivory,6);
  }
 }
 // Dried circumferential bindings remain recognizable in the low light.
 const y=pattern%3;
 for(let k=0;k<=y;k++){
  const a=offset(pelvis,-b.waist*.66,.035+.038*k,b.deep*.61);
  const b2=offset(pelvis,.007,.018+.04*k,b.deep*.90);
  const c=offset(pelvis,b.waist*.70,.083+.031*k,b.deep*.60);
  line(m,a,b2,.016,.013,k%2?tissue.fat:thread,4);line(m,b2,c,.013,.012,thread,4);
 }
}

// Golems have a single mesh patch. These ranges tag the *animated* faces for gun impacts.
export const triCount=m=>(m.chunks.get('model')?.data.length||0)/30;
export function tagMember(m,name,start){
 if(m.golemRegions)m.golemRegions.push({name,start,end:triCount(m)});
}

function finger(m,p,side,reach,cycle,tone){
 const flex=Math.cos(cycle),lift=Math.max(0,Math.sin(cycle));
 const joint=offset(p,side*.026,.041+lift*.044,reach*.50+.047*flex);
 const tip=offset(p,side*.043,-.023+lift*.066,reach+.065*flex);
 line(m,p,joint,.022,.016,tone,5);line(m,joint,tip,.016,.006,tissue.ivory,5);
}
// Forward-facing geometry is low and elongated. Positive Z is the direction of travel.
export function buildOffcut(m,q){
 const part=fragmentNames[q.variant]||'torso',cycle=q.t*Math.PI*2,up=.017*Math.max(0,Math.sin(cycle)),side=part.startsWith('left')?-1:1;
 if(part==='eye'){
  const wet=insetMesh(m,[0,.108,.017],0,cycle,.19);
  shell(wet,[0,0,0],[[-.103,.022,.025],[-.082,.069,.072],[-.026,.103,.105],[.024,.106,.106],[.079,.072,.074],[.104,.017,.019]],[.63,.59,.48],11);
  line(wet,[0,.013,.083],[0,.013,.111],.058,.050,[.252,.35,.29],11);
  line(wet,[0,.012,.111],[0,.012,.115],.024,.023,[.066,.040,.031],9);
  line(wet,[.013,.032,.114],[.014,.033,.119],.009,.007,[.85,.81,.65],6);
  for(let j=0;j<4;j++){const a=j*1.57+.29,r=[.067*Math.cos(a),.067*Math.sin(a),.074],b=[.100*Math.cos(a+.20),.095*Math.sin(a+.20),.019];
   line(wet,r,b,.005,.004,tissue.blood,4);}
  const knot=[.035*Math.sin(cycle),.08,-.069],bend=[.063*Math.sin(cycle-.71),.036,-.19],end=[-.071*Math.cos(cycle),.013,-.298];
  line(m,knot,bend,.028,.018,tissue.muscle,6);line(m,bend,end,.018,.005,tissue.torn,4);
  return;
 }
 if(part==='hand'){
  const wrist=[0,.060+up,-.085],palm=[0,.074+up,.027];
  line(m,wrist,palm,.041,.069,tissue.muscle,8);
  shell(m,palm,[[-.036,.057,.070],[-.011,.075,.076],[.025,.075,.067],[.038,.054,.052]],tissue.hide,9);
  woundSocket(m,wrist,.035,[0,.07,-1]);
  for(let j=0;j<5;j++)finger(m,offset(palm,(j-2)*.026,-.012,.039),j-2,.081+.049*(1-Math.abs(j-2)/2),cycle+j*.72,tissue.torn);
  return;
 }
 if(part.endsWith('Arm')){
  const shoulder=[-side*.09,.16+up,-.29],elbow=[side*.09,.20+.07*Math.sin(cycle),-.09],wrist=[side*.014,.10+up,.17+.067*Math.cos(cycle)];
  line(m,shoulder,elbow,.083,.069,tissue.muscle,7);line(m,elbow,wrist,.073,.046,tissue.torn,6);
  shell(m,wrist,[[-.034,.055,.066],[.014,.077,.088],[.046,.053,.052]],tissue.hide,6);
  for(let j=0;j<5;j++)finger(m,offset(wrist,(j-2)*.03,-.017,.046),j-2,.109+.045*(1-Math.abs(j-2)/2),cycle+j*.61,tissue.torn);
  woundSocket(m,shoulder,.066,[0,-.12,-1]);
 }else if(part.endsWith('Leg')){
  const spring=.5+.5*Math.cos(cycle),ankle=[0,.095,-.011],knee=[side*.089,.208+.135*spring,.098+.055*(1-spring)],hip=[-side*.046,.32+.27*spring,-.068];
  line(m,hip,knee,.118,.083,tissue.muscle,8);line(m,knee,ankle,.085,.053,tissue.torn,7);
  shell(m,ankle,[[-.079,.074,.134,0,.059],[-.042,.093,.152,0,.071],[.025,.069,.089,0,.020],[.052,.048,.052]],tissue.hide,7);
  for(let j=-1;j<=1;j++)finger(m,offset(ankle,j*.030,-.046,.151),j,.08,cycle*.75+j*.8,tissue.torn);
  line(m,offset(hip,side*.028,0,.039),offset(knee,side*.023,0,.08),.022,.013,tissue.fat,5);
  woundSocket(m,hip,.092,[0,-.16,-1]);
 }else{
  const isHead=part==='head';
  const bulk=insetMesh(m,[0,isHead?.185+up:.145+up,isHead?.045:-.014],0,(isHead?.23:.70)+.21*Math.sin(cycle),.17*Math.cos(cycle),isHead?1.14:.73);
  buildGib(bulk,'golem',isHead?'head':'gut');
  for(let i=0;i<6;i++){
   const x=i%2?1:-1,row=Math.floor(i/2),a=cycle+row*1.65+(x<0?Math.PI:0);
   const root=[x*.067,.115+.025*row,.085-.082*row],knuckle=offset(root,x*.089,.019+.06*Math.max(0,Math.sin(a)),.04+.066*Math.cos(a));
   line(m,root,knuckle,.032,.021,tissue.muscle,5);
   line(m,knuckle,offset(knuckle,x*.035,-.066,.056),.022,.007,tissue.fat,5);
  }
 }
}

