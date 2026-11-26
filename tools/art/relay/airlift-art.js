import {portrait} from './crew-portrait.js';
import {flightCabinDetail} from './flight-cabin-detail.js';
// Relay Six insertion. Origin at the cabin deck; the side opening looks along -Z.
import {box,line,quad,shell,offset,insetMesh} from './actor-geometry.js';
import {Fixture,TAU,tint} from './extension-art-kit.js';
import {buildFieldSleeve,buildWristMeter} from './guns.js';

const ink=[.064,.076,.073],rubber=[.099,.108,.103],floor=[.255,.272,.247];
const hull=[.224,.253,.206],ridge=[.34,.37,.306],liner=[.31,.336,.284],alloy=[.43,.459,.411];
const web=[.355,.303,.196],seat=[.238,.239,.184],ochre=[.64,.511,.273],glass=[.123,.192,.204];
const red=[.78,.185,.084],ivory=[.67,.683,.593],rope=[.414,.383,.279];
const clamp=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const lerp3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const band=(m,a,b,r,c=alloy,n=6)=>line(m,a,b,r,r,c,n);
const emissive=12;
function flightSurfaces(mesh,defaultFinish=5){
 const out=Object.create(mesh);
 out.tri=(a,b,c,color,mat=0)=>{
  const finish=mat||aircraftFinishes.get(color)||defaultFinish;
  mesh.tri(a,b,c,color,finish);
 };
 return out;
}

export const liftAnchors=[[-.69,1.81,-1.40],[.28,1.81,-1.40],[1.08,1.81,-1.40]];
export const liftLamps=[
 {x:-.60,y:1.66,z:-.46,color:[.83,.051,.023],power:.36,radius:2.4},
 {x:-1.23,y:1.59,z:-.79,color:[1,.095,.033],power:.46,radius:2.2},
 {x:1.05,y:1.71,z:.72,color:[.77,.049,.023],power:.29,radius:2.2},
 {x:-1.57,y:1.04,z:.40,color:[.23,.47,.36],power:.18,radius:1.2}
];

// Sections perpendicular to the longitudinal X axis, with deliberately faceted skin.
function joinCrossSections(f,rings,palette){
 for(let j=1;j<rings.length;j++){
  const a=rings[j-1],b=rings[j];
  for(let i=0;i<a.length;i++)f.poly([a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]],palette[i%palette.length]);
 }
 f.poly(rings[0].slice().reverse(),palette[0]);f.poly(rings.at(-1),palette[0]);
}
const belly=(x,w,y)=>[[x,y,-w],[x,y,w],[x,y-.26,w*.97],[x,y-.50,w*.67],[x,y-.50,-w*.67],[x,y-.26,-w*.97]];
const cap=(x,w,y)=>[[x,y,-w],[x,y+.12,-w*.93],[x,y+.23,-w*.62],[x,y+.23,w*.62],[x,y+.12,w*.93],[x,y,w]];
function framedPane(f,a,b,c,d,tone){
 f.poly([a,b,c,d],tone,6);
 for(const [s,e] of [[a,b],[b,c],[c,d],[d,a]])f.beam(s,e,.023,.023,ink,0,5);
 const side=lerp3(a,d,.14),tip=lerp3(b,c,.14);
 f.poly([side,tip,lerp3(b,c,.19),lerp3(a,d,.185)],tint(tone,1.45),6);
}
function cockpit(f){
 const nose=[[-3.60,.26,-.57],[-3.48,.52,-.68],[-3.02,.86,-.94],[-2.12,.94,-1.12],[-1.43,.92,-1.12]];
 for(const s of [-1,1]){
  const mirrored=p=>[p[0],p[1],p[2]*s];
  const bottom=nose.map(mirrored),upper=[[-3.49,.57,-.50],[-3.31,.83,-.66],[-2.76,1.55,-.77],[-2.04,1.76,-1.03],[-1.41,1.77,-1.03]].map(mirrored);
  for(let j=1;j<bottom.length;j++){
   f.poly([bottom[j-1],bottom[j],[bottom[j][0],-.03,bottom[j][2]*.94],[bottom[j-1][0],-.03,bottom[j-1][2]*.94]],j%2?ridge:hull);
   if(j===1)f.poly([bottom[0],bottom[1],upper[1],upper[0]],hull);
   else framedPane(f,bottom[j-1],bottom[j],upper[j],upper[j-1],j===2?glass:tint(glass,1.12));
  }
  const near=upper[1],far=upper[2],ax=mirrored([-3.40,.84,-.08]),bx=mirrored([-2.65,1.56,-.10]);
  framedPane(f,near,ax,bx,far,tint(glass,1.24));
  f.beam(upper[2],upper[4],.042,.046,ridge,0,5);
  f.beam(mirrored([-3.23,.78,-.43]),mirrored([-2.82,1.28,-.48]),.013,.009,ink,0,4);
 }
 f.box(-2.79,.67,0,1.04,.20,1.59,hull);
 f.box(-1.45,.86,.21,.10,1.72,1.80,liner);
 for(const x of [-2.42,-1.91]){
  f.box(x,.40,.17,.30,.40,.64,ink);
  f.box(x+.08,.63,.17,.40,.15,.62,seat);
 }
}
function outsideStar(f,x,y,z,scale){
 const points=[];for(let i=0;i<10;i++){const a=TAU*i/10-Math.PI/2,r=i%2?.45:1;points.push([x+scale*Math.cos(a)*r,y-scale*Math.sin(a)*r,z]);}
 for(let i=0;i<10;i++)f.poly([[x,y,z],points[i],points[(i+1)%10]],ivory);
 f.panel(x-scale*1.25,y,z,scale*.76,scale*.45,ivory);f.panel(x+scale*1.25,y,z,scale*.76,scale*.45,ivory);
}
function numberPanel(f,x,y,z){
 f.panel(x,y,z,.326,.184,ink);const seg=[[-.025,.050,.025,.050],[.028,.045,.028,.005],[.028,-.005,.028,-.045],[-.025,-.050,.025,-.050],[-.028,-.005,-.028,-.045],[-.028,.045,-.028,.005],[-.025,0,.025,0]];
 for(const [digit,mask] of [[-.067,[0,1,2,3,4,5]],[.067,[0,2,3,4,5,6]]])for(const i of mask){
  const [ax,ay,bx,by]=seg[i];f.beam([x+digit+ax,y+ay,z-.001],[x+digit+bx,y+by,z-.001],.006,.006,ivory,0,4);
 }
}
function sideWall(f,z){
 const s=Math.sign(z),near=z-s*.026;
 f.box(.44,.44,z,3.85,.86,.058,hull);
 f.box(.35,1.73,z,3.90,.15,.064,ridge);
 for(const x of [-1.38,-.09,1.14,2.11])f.box(x,1.20,z,.135,.72,.097,ridge);
 for(const [x,w] of [[-.74,1.10],[.53,1.10],[1.625,.78]]){
  const a=[x-w/2,.911,near],b=[x+w/2,.911,near],c=[x+w/2-.047,1.60,near],d=[x-w/2+.047,1.60,near];
  framedPane(f,a,b,c,d,tint(glass,1.04));
  f.beam([x-w/2+.04,.886,near-s*.025],[x+w/2-.04,.886,near-s*.025],.018,.018,alloy,0,4);
 }
}
function webBench(f,x,z){
 const inward=-Math.sign(z);
 f.box(x,.52,z,1.02,.095,.45,seat);
 f.box(x,.40,z+inward*.20,.95,.06,.04,ridge);
 for(const dx of [-.38,.38]){f.beam([x+dx,.47,z+inward*.17],[x+dx,.09,z-inward*.18],.027,.032,alloy,0,5);}
 for(const dx of [-.404,-.20,0,.20,.404]){
  f.beam([x+dx,.53,z-inward*.203],[x+dx,1.36,z-inward*.31],.028,.028,web,0,4);
 }
 for(const y of [.69,.89,1.13]){const q=(y-.53)/.83;f.box(x,y,z-inward*(.23+q*.08),.865,.055,.026,web);}
 f.beam([x-.46,1.38,z-inward*.306],[x+.46,1.38,z-inward*.306],.026,.026,alloy,0,5);
 f.beam([x-.18,.53,z+inward*.21],[x-.11,.36,z+inward*.24],.023,.021,ink,0,4);
 f.box(x-.105,.354,z+inward*.24,.061,.04,.032,alloy);
}
function deck(f){
 f.box(.02,-.094,.00,3.18,.166,2.20,floor);
 for(let i=0;i<10;i++){
  const x=-1.43+i*.322;
  f.box(x,-.002,-.015,.008,.006,2.10,rubber);
  for(const z of [-.72,.01,.77]){
   f.box(x+.155,.002,z,.112,.006,.058,ink);
   f.box(x+.155,.008,z,.060,.006,.018,alloy);
  }
 }
 f.box(.10,.007,-1.099,2.73,.027,.064,alloy);
 for(let i=0;i<15;i++){
  const x=-1.19+i*.178;
  f.poly([[x,.029,-1.119],[x+.060,.029,-1.119],[x+.088,.029,-1.078],[x+.028,.029,-1.078]],ochre);
 }
 f.box(-1.23,.34,-.81,.079,.27,.063,ink);f.box(-1.23,.34,-.845,.047,.139,.011,red);
}
function cabin(f,open){
 const q=clamp(open),ease=q*q*(3-2*q);
 deck(f);sideWall(f,1.10);flightCabinDetail(f);
 // Overlapping tracks let the two leaves nest over the rear quarter of the cabin.
 const leaf=1.32;
 for(let i=0;i<2;i++){
  const x=-1.19+leaf*(i+.5)+ease*(leaf*(2-i)+.055),z=i?-1.193:-1.244;
  f.box(x,.80,z,leaf*.995,1.57,.045,hull);
  f.panel(x,1.08,z-.024,.85,.49,ink);
  f.panel(x,1.08,z-.026,.79,.43,glass);
  f.panel(x,1.08,z+.024,.82,.46,glass);
  f.box(x-.51,.67,z+.038,.17,.034,.030,alloy);
  f.box(x+.55,.80,z-.026,.023,1.40,.010,ridge);
  if(i===0){outsideStar(f,x-.24,.56,z-.025,.154);numberPanel(f,x+.30,.55,z-.029);}
 }
 for(const x of [-1.30,1.46]){
  f.box(x,.87,-1.115,.097,1.76,.13,ridge);
  f.box(x,.87,-1.041,.033,1.69,.016,ink);
  for(const y of [.21,.53,.89,1.25,1.63])f.box(x+.024,y,-1.035,.021,.021,.018,alloy);
 }
 f.box(.15,1.79,-1.12,3.05,.094,.16,ridge);
 f.box(.15,1.82,-1.209,3.18,.026,.026,alloy);
 f.box(1.84,.77,-1.095,.70,1.53,.096,hull);
 f.beam([-1.19,1.46,-.965],[-1.19,.92,-.965],.024,.024,alloy,0,5);
 for(const y of [.92,1.46])f.beam([-1.19,y,-.965],[-1.28,y,-1.073],.021,.021,ridge,0,4);
 // Bulkhead intercom with slotted grille, handset and coiled line.
 f.box(-1.29,1.29,-.994,.26,.30,.055,ink);
 for(let i=0;i<4;i++)f.box(-1.29,1.34+i*.019,-.961,.119,.006,.008,alloy);
 f.box(-1.29,1.241,-.954,.056,.035,.018,[.57,.36,.18],emissive);
 for(const [x,y,z] of [[-1.20,1.59,-1.032],[1.05,1.73,.85]]){
  f.box(x,y,z,.25,.089,.085,ink);f.box(x,y-.005,z+.026,.189,.064,.091,red,emissive);
  for(const dx of [-.056,.055])f.box(x+dx,y-.004,z+.075,.009,.067,.009,alloy);
 }
 for(const x of [-.68,.29,1.22])webBench(f,x,.72);
 f.box(-1.235,.56,.22,.35,.065,.42,seat);f.box(-1.386,.80,.22,.056,.42,.40,web);
 for(const z of [.07,.38])f.beam([-1.37,.34,z],[-1.10,.53,z],.016,.016,alloy,0,4);
 for(let i=0;i<5;i++){
  const x=-1.2+i*.59;
  f.box(x,1.814,.003,.067,.047,2.12,liner);
  f.beam([x,1.79,.98],[x-.02,1.58,1.074],.031,.033,alloy,0,5);
 }
 for(const x of [-.96,.23,1.20]){
  f.beam([x,1.782,-.46],[x+.13,1.674,-.47],.016,.016,web,0,5);
  f.beam([x+.13,1.674,-.47],[x+.25,1.785,-.45],.016,.016,web,0,5);
 }
 for(const anchor of liftAnchors){
  const [x,y,z]=anchor;f.beam([x,1.87,-.76],anchor,.052,.038,ridge,0,6);
  f.beam([x+.21,1.80,-1.095],[x,y-.012,z+.10],.019,.022,alloy,0,5);
  f.box(x,y-.015,z,.10,.082,.09,alloy);
 }
}
function tail(f){
 const rings=[[1.97,.80,.66],[2.44,.67,.72],[3.12,.39,.79],[4.84,.21,1.04],[5.99,.13,1.25]];
 const shape=rings.map(([x,r,y])=>[[x,y-r*.67,-r],[x,y+r*.49,-r*.84],[x,y+r,r*.36],[x,y+r*.49,r],[x,y-r*.53,r*.88],[x,y-r*.80,-r*.26]]);
 joinCrossSections(f,shape,[hull,ridge,ridge,hull,tint(hull,.81),tint(hull,.86)]);
 const finZ=.076,outline=[[5.73,1.28],[5.88,1.34],[6.24,2.34],[6.53,2.42],[6.23,1.10],[5.72,1.02]];
 f.poly(outline.map(([x,y])=>[x,y,finZ]),hull);f.poly(outline.map(([x,y])=>[x,y,-finZ]).reverse(),ridge);
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];f.poly([[a[0],a[1],-finZ],[b[0],b[1],-finZ],[b[0],b[1],finZ],[a[0],a[1],finZ]],hull);}
 for(const s of [-1,1])f.poly([[4.40,1.0,s*.11],[4.76,1.06,s*1.24],[5.22,1.03,s*1.17],[5.04,.99,s*.1]],ridge);
 f.box(5.81,1.20,-.17,.15,.14,.24,rubber);
 f.box(6.33,2.39,.033,.074,.056,.05,[.71,.065,.04],emissive);
}
export function buildLiftHull(mesh,open=1){
 const f=new Fixture(flightSurfaces(mesh));
 joinCrossSections(f,[belly(-3.55,.37,.13),belly(-3.05,.77,.11),belly(-1.43,1.09,-.019),
  belly(1.62,1.09,-.019),belly(2.34,.84,.06),belly(2.59,.59,.20)],[floor,hull,hull,tint(hull,.81),tint(hull,.77),ridge]);
 joinCrossSections(f,[cap(-2.64,.58,1.52),cap(-1.52,1.08,1.78),cap(1.54,1.08,1.78),cap(2.31,.82,1.42)],[hull,ridge,ridge,ridge,hull,liner]);
 cockpit(f);cabin(f,open);tail(f);
 for(const s of [-1,1]){
  const z=s*.61;
  f.beam([-.76,2.035,z],[.47,2.05,z],.236,.193,hull,0,8);
  f.beam([.47,2.05,z],[.63,2.09,z],.177,.19,alloy,0,8);
  f.beam([.624,2.09,z],[.638,2.092,z],.137,.137,ink,0,8);
  for(let i=0;i<4;i++)f.box(-.49+i*.135,2.209,z+s*.08,.032,.040,.235,rubber);
  f.beam([-1.61,-.36,s*.70],[-1.32,-.78,s*1.16],.061,.054,hull,0,6);
  f.beam([1.45,-.32,s*.76],[1.25,-.78,s*1.16],.064,.05,hull,0,6);
  f.beam([-2.18,-.64,s*1.16],[-1.94,-.78,s*1.16],.055,.062,ridge,0,6);
  f.beam([-1.94,-.78,s*1.16],[1.93,-.78,s*1.16],.062,.055,ridge,0,6);
  f.box(-1.82,1.13,s*1.115,.11,.07,.06,s<0?[.57,.075,.05]:[.09,.46,.26],emissive);
 }
 f.box(-.16,2.145,0,.81,.20,.85,hull);
 f.beam([-.17,2.19,0],[-.17,2.50,0],.092,.078,alloy,0,8);
 for(const x of [-1.16,.95])f.beam([x,-.38,-.34],[x+.12,-.87,-.34],.014,.008,ink,0,4);
 return mesh;
}
export function buildLiftRotor(mesh,phase=0){
 const angles=(phase%1)*TAU,hub=[-.17,2.52,0];
 for(let k=0;k<4;k++){
  const a=angles+k*TAU/4,at=(r,t,h)=>[hub[0]+Math.cos(a)*r-Math.sin(a)*t,hub[1]+h,Math.sin(a)*r+Math.cos(a)*t];
  line(mesh,at(.035,0,0),at(.54,0,.018),.068,.047,alloy,5,5);
  const a0=at(.36,-.070,.04),a1=at(.41,.12,.04),b0=at(4.92,-.316,-.005),b1=at(4.83,.015,.016);
  quad(mesh,a0,b0,b1,a1,hull,7);
  quad(mesh,b0,at(5.10,-.37,-.022),at(5.04,-.002,-.007),b1,ochre);
  const t=angles*1.83+k*TAU/4,x=5.87,y=1.61,z=-.203;
  const p=(r,w)=>[x+Math.cos(t)*r-Math.sin(t)*w,y+Math.sin(t)*r+Math.cos(t)*w,z];
  quad(mesh,p(.045,-.03),p(.514,-.075),p(.53,-.004),p(.04,.033),ink);
  quad(mesh,p(.514,-.075),p(.632,-.095),p(.64,-.019),p(.53,-.004),ochre);
 }
 shell(mesh,hub,[[-.04,.175,.175],[.03,.18,.18],[.094,.107,.107]],hull,8);
 return mesh;
}
export function buildLiftAircraft(mesh,rotorPhase=0,open=1){
 buildLiftHull(mesh,open);buildLiftRotor(mesh,rotorPhase);return mesh;
}
export function buildDropLine(mesh,length,phase=0){
 if(!Number.isFinite(length)||length<=.015)return mesh;
 const sections=Math.max(3,Math.min(19,Math.ceil(length/.48))),q=TAU*phase;
 const sway=Math.min(.18,length*.042);
 const path=u=>[sway*(.28+.72*u)*Math.sin(q+u*3.9)*Math.sin(Math.PI*.55*u),
  -u*length,sway*.58*(.24+.76*u)*Math.sin(q+.51+u*6.1)*Math.sin(Math.PI*.65*u)];
 let last=path(0);
 for(let i=1;i<=sections;i++){
  const u=i/sections,pt=path(u);
  line(mesh,last,pt,.024,.024,i%2?rope:tint(rope,.90),6,8);
  const a=lerp3(last,pt,.07),b=lerp3(last,pt,.77);
  line(mesh,offset(a,.014,0,.012),offset(b,-.014,0,.020),.006,.006,i%3?web:ridge,4,8);
  last=pt;
 }
 if(length>.15)line(mesh,offset(last,0,.080,0),last,.030,.027,rubber,6);
 return mesh;
}

const fatigues=[.337,.361,.275],fabric=[.412,.423,.323],glove=[.224,.237,.195];
function flightBoot(m,p,side,bend,shade=rubber){
 const f=insetMesh(m,p,side*.07,bend,side*.045);
 shell(f,[0,0,0],[[-.075,.070,.154,0,.051],[-.055,.080,.163,0,.052],[-.039,.078,.160,0,.053]],ink,8,7);
 shell(f,[0,0,0],[[-.041,.078,.159,0,.052],[-.006,.077,.151,0,.052],[.025,.067,.118,0,.018],[.096,.064,.071,0,-.024]],shade,8,9);
 const tongue=[[-.035,.017,.096],[.035,.017,.096],[.029,.094,.051],[-.030,.094,.050]];
 quad(f,...tongue,glovePad,9);
 for(let i=0;i<3;i++){
  const y=.029+i*.020,z=.092-i*.013;
  quad(f,[-.038,y,z],[.033,y+.014,z-.006],[.038,y+.018,z-.007],[-.033,y+.004,z],web,8);
  quad(f,[.038,y,z+.001],[-.032,y+.014,z-.007],[-.038,y+.018,z-.008],[.032,y+.004,z],web,8);
 }
 for(const s of [-1,1])for(let i=0;i<3;i++){
  const x=s*.047,z=-.028+i*.066;
  quad(f,[x-.019,-.074,z-.009],[x+.015,-.074,z-.013],[x+.019,-.077,z+.010],[x-.014,-.077,z+.014],rubber,7);
 }
}
function flightGlove(m,point,side,raised=false){
 const f=insetMesh(m,point,-side*.23,raised?.15:.3,side*.07);
 shell(f,[0,0,0],[[-.058,.039,.034],[-.024,.048,.041],[.012,.052,.046,0,.001],[.046,.042,.035,0,.009],[.055,.034,.028,0,.010]],glove,7,9);
 for(let i=0;i<4;i++){
  const y=-.033+i*.019,z=.030+Math.sin(i*.84)*.006;
  line(f,[side*.036,y,.003],[side*.033,y+.002,z],.012,.013,i%2?glove:fatigues,5);
  line(f,[side*.033,y+.002,z],[-side*.006,y+.007,z+.012],.013,.009,glove,5);
  const x=side*.042,h=y+.003;
  quad(f,[x,h-.006,.005],[side*.045,h+.006,.001],[side*.050,h+.007,.017],[side*.048,h-.006,.020],glovePad);
 }
 const cuff=[[-.026,-.049,-.017],[-.034,-.009,-.028],[-.018,.025,-.035],[.020,.033,-.033],[.038,-.015,-.023],[.023,-.045,-.019]];
 for(let i=1;i<cuff.length-1;i++)f.tri(cuff[0],cuff[i],cuff[i+1],glovePad);
 quad(f,[-.024,-.036,-.023],[-.022,-.029,-.025],[.014,-.019,-.030],[.025,-.025,-.026],web);
 line(f,[-side*.032,-.019,.008],[-side*.045,.006,.038],.020,.015,fatigues,5);
 line(f,[-side*.045,.006,.038],[-side*.014,.028,.045],.015,.009,glove,5);
}
export function buildRappelCrew(mesh,kind='ally',phase=0,pose='rappel'){
 mesh.rounded=true;
 const m=flightSurfaces(mesh,8);
 const t=clamp(phase),cyc=Math.sin(t*TAU),swing=pose==='rappel'?cyc:0;
 const bench=pose==='bench',land=pose==='land'?t:0,stand=pose==='land'?Math.max(0,(t-.38)/.62):0;
 const compressed=bench?.21:pose==='land'?.24*(1-stand)+.1*Math.sin(t*Math.PI):.19;
 const hips=[0,.88-compressed,.018-(bench?.10:0)],chest=offset(hips,.017*swing,.358,bench?.06:.057);
 const second=!/^(moth|ally)$/i.test(kind),chief=kind==='control';
 const vest=chief?[.315,.285,.206]:second?[.267,.302,.286]:[.33,.348,.255],sleeve=second?[.343,.362,.335]:fabric;
 shell(m,hips,[[-.106,.15,.12],[-.014,.18,.13],[.12,.152,.108]],fatigues,7);
 shell(m,chest,[[-.24,.15,.125],[.028,.214,.16],[.12,.235,.134],[.175,.135,.093]],sleeve,7);
 shell(m,offset(chest,0,-.032,.012),[[-.175,.17,.135],[.075,.225,.155],[.123,.151,.12]],vest,7);
 for(const s of [-1,1]){
  const shoulder=offset(chest,s*.197,.093,.004),breathe=.029*Math.sin(t*TAU+(s>0?1.32:0));
  const hand=chief&&s<0?offset(chest,-.135,.254+.005*cyc,.066):bench?offset(hips,s*.12,.13,.32):pose==='land'?offset(chest,s*(.057+.092*stand),-.035+.25*(1-t)*(s<0?1:.30),.25-.05*stand):
   offset(chest,s*.041,s<0?.53+breathe:.14-breathe,.30+.015*Math.cos(t*TAU));
  const elbow=chief&&s<0?offset(shoulder,-.141,-.095,.078):bench?offset(shoulder,s*.055,-.192,.15):pose==='land'?offset(shoulder,s*.091,-.12+.08*(1-t),.16):
   offset(shoulder,s*.157,s<0?.156:-.1,.101+.029*swing);
  line(m,shoulder,elbow,.085,.067,sleeve,6);
  line(m,elbow,hand,.070,.043,sleeve,6);
  const cuff=lerp3(elbow,hand,.84);line(m,cuff,hand,.054,.044,vest,6);
  flightGlove(m,hand,s,s<0);
  box(m,offset(shoulder,s*.081,-.055,.015),.012,.075,.085,vest);
  box(m,offset(shoulder,s*.088,-.046,.015),.012,.019,.068,second?alloy:ochre);
  line(m,offset(hips,s*.139,.042,.092),offset(chest,s*.107,.125,.099),.030,.027,web,4);
  const knee=bench?[s*.136,.397,.399]:[s*(.161-.031*stand)+swing*.024,.40+.044*s*swing+.056*stand,.334-.27*stand+swing*.033*s];
  const foot=bench?[s*.151,.084,.411]:[s*(.159+.044*(1-stand)),.111+.11*Math.max(0,s*swing)*(1-stand),.115+s*.061*(1-stand)-.124*stand];
  line(m,offset(hips,s*.104,-.042,0),knee,.104,.077,fatigues,7);
  line(m,knee,offset(foot,0,.075,-.012),.074,.053,sleeve,6);
  box(m,offset(knee,0,.002,.058),.110,.114,.062,vest);
  const thigh=lerp3(hips,knee,.60);
  line(m,offset(thigh,s*.003,.016,0),offset(thigh,s*.009,-.020,.012),.091,.092,web,7);
  flightBoot(m,foot,s,bench?.20:.23*(1-stand)-.02);
 }
 box(m,offset(hips,0,.048,.001),.319,.064,.228,web);
 box(m,offset(hips,.014,.051,.131),.063,.043,.019,alloy);
 for(const x of [-.095,.082]){
  shell(m,offset(chest,x,-.077,.151),[[-.057,.051,.029],[-.039,.064,.035],[.038,.063,.037],[.062,.049,.031]],vest,6,8);
  quad(m,offset(chest,x-.052,-.029,.174),offset(chest,x+.051,-.029,.174),offset(chest,x+.045,-.088,.190),offset(chest,x-.042,-.084,.190),sleeve,8);
  box(m,offset(chest,x+.008,-.084,.190),.019,.034,.006,web,8);
 }
 box(m,offset(chest,.115,.073,.152),.050,.079,.032,rubber);
 box(m,offset(chest,.116,.088,.174),.026,.016,.013,[.34,.32,.16],emissive);
 box(m,offset(chest,0,.031,-.151),.268,.31,.12,vest);
 line(m,offset(chest,-.097,.145,-.202),offset(chest,-.116,.33,-.232),.011,.006,rubber,4);
 const h=offset(chest,.015*swing,.316,.033);
 line(m,offset(chest,0,.113,0),offset(h,0,-.073,0),.059,.062,vest,7);
 const head=insetMesh(m,h,chief?-.15+.066*cyc:-.38+swing*.30,chief?.065+.033*cyc:bench?.11:.09*swing,-.046+.051*swing);
 if(chief){
  // A folded map rests on one knee; the other hand holds the headset to the ear.
  box(m,[.12,.49,.31],.202,.014,.245,[.443,.438,.325]);
  for(const z of [.24,.29,.34,.39])box(m,[.115,.498,z],.155,.002,.002,web);
  box(m,offset(chest,.03,.115,.14),.061,.022,.019,ochre);
 }
 const skin=chief?[.54,.395,.308]:kind==='medic'?[.589,.451,.348]:second?[.419,.30,.236]:[.512,.398,.304];
 shell(head,[0,0,0],[[-.092,.07,.07,0,.03],[-.043,.096,.094],[.050,.11,.107],[.112,.069,.073]],skin,8,9);
 portrait(insetMesh(head,[0,-.001,.007],0,0,0),skin,tint(skin,.74),kind==='medic'?'medic':'scout',cyc);
 shell(head,[0,.04,-.009],[[-.025,.129,.127],[.051,.143,.14],[.099,.119,.109],[.133,.063,.069]],vest,8);
 const visor=chief||kind==='medic'?insetMesh(head,[0,.086,0],0,.10,0):head;
 for(const s of [-1,1]){
  const frame=[[.006,.019,.117],[.028,.030,.124],[.077,.021,.110],[.101,.009,.087],[.090,-.013,.093],[.045,-.020,.116],[.015,-.009,.120]].map(([x,y,z])=>[s*x,y,z]);
  const inner=frame.map(v=>lerp3([s*.053,.007,.129],v,.76));
  for(let i=0;i<frame.length;i++){const j=(i+1)%frame.length;quad(visor,frame[i],frame[j],inner[j],inner[i],rubber,7);}
  for(let i=1;i<inner.length-1;i++)visor.tri(inner[0],inner[i],inner[i+1],glass,6);
  line(visor,[s*.095,.010,.087],[s*.114,.026,-.054],.013,.011,web,4,8);
  line(head,[s*.107,-.013,-.013],[s*.063,-.084,.023],.013,.011,web,4,8);
 }
 head.tri([-.013,-.019,.111],[.013,-.019,.111],[.004,-.033,.126],skin,9);
 line(visor,[-.012,.014,.119],[.012,.014,.119],.007,.007,rubber,4,7);
 for(const s of [-1,1])box(head,[s*.114,-.018,-.004],.037,.071,.064,rubber);
 line(head,[-.119,-.031,.023],[-.068,-.056,.100],.009,.008,rubber,4);
 if(kind==='medic'){
  const satchel=offset(hips,.197,.058,.021);box(m,satchel,.105,.224,.201,web,8);
  box(m,offset(satchel,.055,.036,.012),.005,.094,.023,red,8);box(m,offset(satchel,.057,.036,.012),.006,.026,.079,red,8);
  box(m,offset(chest,-.277,.041,.015),.009,.091,.097,ivory,8);
  box(m,offset(chest,-.283,.040,.017),.005,.067,.020,red,8);box(m,offset(chest,-.284,.040,.017),.005,.023,.065,red,8);
 }
 if(land>.56)box(m,offset(chest,0,-.004,.17),.030,.046,.017,alloy);
 return mesh;
}
export function buildRappelHands(mesh,phase=0){
 mesh.rounded=true;
 const m=flightSurfaces(mesh,8);
 const q=TAU*phase,rock=Math.sin(q)*.011;
 const upper=[-.104+.010*Math.sin(q+.68),.024+.057*Math.sin(q),-.38];
 const lower=[.113+rock,-.194+.025*Math.sin(q+1.37),-.342];
 const ropeA=offset(upper,-.11,.174,-.007),ropeC=offset(lower,.138,-.229,.013);
 const middle=lerp3(upper,lower,.48);
 line(m,ropeA,upper,.015,.015,rope,6);line(m,upper,middle,.015,.015,rope,6);
 line(m,middle,lower,.015,.015,rope,6);line(m,lower,ropeC,.015,.015,rope,6);
 for(const [p,s] of [[upper,-1],[lower,1]]){
  const shoulder=[s*.414,-.411,.025],elbow=[s*.288,-.281+rock,.005],wrist=offset(p,s*.052,-.060,.027);
  const mid=lerp3(elbow,wrist,.61),cuff=lerp3(elbow,wrist,.82);
  buildFieldSleeve(m,[[shoulder,.103,.091,fatigues],[elbow,.083,.076,fabric],[mid,.066,.061,fabric],
   [cuff,.060,.053,vestCuff],[wrist,.052,.049,glove]],7);
  if(s<0)buildWristMeter(m,mid,wrist);
  line(m,wrist,offset(p,s*.023,-.031,.011),.047,.040,glove,6);flightGlove(m,offset(p,s*.023,0,-.009),s,s<0);
 }
 for(const side of [-1,1]){
  const x=side*(.147+rock),y=-.419+.010*side*rock;
  const boot=insetMesh(m,[x,y,-.498+.034*side*Math.cos(q)],side*.20,-.53,side*.08);
  flightBoot(boot,[0,0,0],side,0);
 }
 return mesh;
}
const vestCuff=[.286,.304,.237];
const glovePad=[.261,.277,.233];
const aircraftFinishes=new Map([[hull,7],[ridge,7],[liner,7],[floor,5],[alloy,5],[ink,7],[rubber,7],[glass,6],
 [web,8],[seat,8],[ochre,10],[red,10],[ivory,10],[rope,8],[fatigues,8],[fabric,8],[glove,9],[glovePad,9],[vestCuff,8]]);
