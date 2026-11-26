// Hand-finished civilian arms recovered on scene. Local -Z points down the sight line.
import {paint,clamp,smooth,between,plus,scaled,difference,quad,polygon,rim,limb,hull,box,linked,mapped,sidePlate,screw,boreFace} from './armory-shapes.js';

const p=paint,walnut=[.385,.244,.147],oiled=[.313,.192,.112],grain=[.451,.296,.172];
const steelBlue=[.189,.219,.234],chamber=[.348,.368,.365],hullRed=[.551,.132,.109];
const barrelX=.025,shotY=.051,shotBreech=.010,feed=[0,.064,-.07];
const lockFrame=[[-.74,1],[-1,.61],[-1,-.47],[-.74,-.92],[-.40,-1],[.41,-1],[.78,-.91],[1,-.48],[1,.61],[.73,1]];
function stockWood(m,rows){
 const sides=m.lowDetail?8:14,outline=rim(sides);
 const rings=rows.map(([z,y,w,h])=>outline.map(([a,b])=>[w*a,y+h*b,z]));
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<sides;k++){
  const n=(k+1)%sides,a=rings[j],b=rings[j+1];
  quad(m,a[k],a[n],b[n],b[k],walnut,5);
  if(m.lowDetail||k%2!==1)continue;
  const at=(v,u)=>{const c=between(between(a[k],a[n],v),between(b[k],b[n],v),u);c[0]*=1.004;c[1]+=.0003*outline[k][1];return c;};
  const u=.23+.14*Math.sin(k*2.1+j*1.7);
  quad(m,at(u,.012),at(u+.025,.015),at(u+.115,.76),at(u+.069,.85),k%4===1?grain:oiled,5);
 }
 polygon(m,rings[0].slice().reverse(),oiled,5);polygon(m,rings.at(-1),oiled,5);
}
function furniture(m,rifle){
 const tail=rifle?.275:.265;
 stockWood(m,[[.012,-.004,.040,.037],[.058,-.022,.042,.043],[.105,-.065,.033,.047],
  [.132,-.071,.030,.047],[.168,-.064,.038,.059],[.203,-.064,.043,.079],[tail,-.073,.047,.086]]);
 hull(m,[[tail-.005,-.073,.047,.086,p.umber],[tail+.003,-.073,.048,.087,p.ivory],
  [tail+.008,-.073,.048,.087,p.rubber],[tail+.021,-.075,.046,.084,p.rubber]],rim(m.lowDetail?8:14),7);
 if(!m.lowDetail)for(let i=0;i<9;i++){
  const y=-.143+.016*i,w=.036*Math.sqrt(Math.max(.13,1-((y+.075)/.086)**2));
  quad(m,[-w,y,tail+.0211],[w,y+.002,tail+.0211],[w*.95,y+.004,tail+.0212],[-w,y+.002,tail+.0212],p.gloveFold,7);
 }
 for(const s of [-1,1]){
  const path=[[-.044,.052],[-.075,.075],[-.103,.111],[-.100,.135],[-.082,.142],[-.067,.130],[-.039,.089]];
  sidePlate(m,s,.0308,path,oiled);
  if(!m.lowDetail)for(let i=0;i<6;i++){
   const z=.081+i*.006;
   sidePlate(m,s,.0321,[[-.071,z],[-.075,z+.002],[-.090,z+.019],[-.087,z+.019]],grain);
  }
 }
 const loop=[[0,-.014,-.096],[0,-.042,-.091],[0,-.064,-.065],[0,-.067,-.028],[0,-.054,.012],[0,-.027,.036]];
 linked(m,loop,.0055,p.blued,5,6);
 for(const z of rifle?[-.035]:[-.059,-.032])linked(m,[[0,-.015,z],[0,-.035,z+.006],[0,-.054,z-.006]],.0045,p.steel,5,5);
}
function cartridge(m,base,axis,shell,spent=false){
 const point=(f)=>plus(base,scaled(axis,f)),r=shell?.017:.0086;
 const rows=shell?[[0,1.06,p.brass],[.05,1.06,p.brass],[.09,.97,p.brass],[.22,.94,p.brass],[.235,.96,hullRed],[.94,.96,hullRed],[1,.87,spent?p.umber:hullRed]]:
   [[0,1.10,p.brass],[.06,1.10,p.brass],[.10,.88,p.brass],[.14,1.02,p.brass],[.66,.96,p.brass],[.76,.65,p.brass],
    [.82,.64,spent?p.blued:p.laminate],...(spent?[]:[[.91,.51,p.laminate],[1,.13,p.laminate]])];
 limb(m,rows.map(([f,k,col])=>[point(f),r*k,r*k,col]),m.lowDetail?6:10,5,true,true);
}
export const shotgunSide=loaded=>loaded===1?-1:1;
export function hingedPoint(v,pose){
 const t=pose.reload,angle=-.62*pose.weight*smooth(.055,.245,t)*(1-smooth(.749,.899,t));
 const c=Math.cos(angle),s=Math.sin(angle),y=v[1]-.007,z=v[2]+.172;
 return [v[0],.007+y*c-z*s,-.172+y*s+z*c];
}
function chamberRear(m,x){
 const sides=m.lowDetail?8:14,outer=.024,inner=.0172;
 for(let i=0;i<sides;i++){
  const a=rim(sides)[i],b=rim(sides)[(i+1)%sides],pos=(v,r,z)=>[x+r*v[0],shotY+r*v[1],z];
  quad(m,pos(a,outer,shotBreech),pos(b,outer,shotBreech),pos(b,inner,shotBreech+.0004),pos(a,inner,shotBreech+.0004),chamber,5);
  quad(m,pos(a,inner,shotBreech+.0004),pos(b,inner,shotBreech+.0004),pos(b,inner*.88,shotBreech-.032),pos(a,inner*.88,shotBreech-.032),p.dark,5);
 }
 polygon(m,rim(sides).map(([x0,y])=>[x+x0*inner*.88,shotY+y*inner*.88,shotBreech-.032]),p.oxide,5);
}
function shellPath(pose,side,delay=0){
 const t=pose.reload,draw=smooth(.33,.555,t),seat=smooth(.54+delay,.69+delay,t);
 const pocket=pose.localPoint([-.161,-.40,-.320]);
 const ready=hingedPoint([side*barrelX,shotY+.006*(1-seat),shotBreech+.095*(1-seat)],pose);
 const base=between(plus(pocket,[side*.018,0,0]),ready,draw);
 const f=hingedPoint([0,0,-.060],pose),o=hingedPoint([0,0,0],pose);
 const axis=between([.008,.044,-.040],difference(f,o),draw);
 return {base,axis};
}
function loadingSides(pose){
 const start=Math.max(0,Math.min(2,pose.reloadLoaded)),count=Math.min(2-start,pose.reloadCount);
 return count===2?[1,-1]:count?[start===1?-1:1]:[];
}
function shotgun(m,pose){
 furniture(m,false);
 const b=mapped(m,v=>hingedPoint(v,pose)),sides=m.lowDetail?8:14;
 for(const side of [-1,1]){
  const x=side*barrelX,tube=mapped(b,v=>[x+v[0],v[1]+shotY,v[2]]);
  hull(tube,[[-.728,0,.020,.020,steelBlue],[-.711,0,.0195,.0195,steelBlue],[-.426,0,.0202,.0202,steelBlue],
    [-.243,.0002,.022,.022,p.blued],[-.205,.0002,.0225,.0225,steelBlue],[-.093,0,.0243,.0243,steelBlue],[shotBreech,0,.024,.024,chamber]],rim(sides),5,false);
  boreFace(tube,0,0,-.7282,.020,.80,sides);chamberRear(b,x);
 }
 stockWood(b,[[-.402,.006,.025,.016],[-.391,.001,.042,.028],[-.351,-.002,.046,.032],[-.223,-.001,.048,.036],[-.173,.002,.045,.030],[-.161,.009,.026,.018]]);
 hull(b,[[-.728,.068,.0048,.0024,p.blued],[-.405,.070,.006,.0033,p.blued],[-.140,.071,.007,.005,p.blued],[.010,.072,.0085,.0053,p.blued]],lockFrame);
 // A low, open center rib leads to a brass bead above the joined barrels.
 linked(b,[[0,.070,-.708],[0,.086,-.708]],.0030,p.brass,5,7);
 if(!m.lowDetail)for(let i=0;i<18;i++){const z=-.164+i*.008;box(b,0,.0769,z,.011,.0006,.002,p.steel,5);}
 hull(m,[[-.183,.006,.043,.024,p.steel],[-.158,.004,.046,.030,chamber],[-.049,.005,.047,.036,chamber],[.023,.011,.044,.043,p.steel],[.049,.010,.036,.042,steelBlue]],lockFrame);
 hull(m,[[.009,.052,.045,.026,p.steel],[.027,.047,.047,.031,p.steel],[.061,.030,.035,.024,p.blued]],lockFrame);
 const lever=smooth(.015,.12,pose.reload)*(1-smooth(.79,.92,pose.reload))*pose.weight;
 linked(m,[[0,.077,.019],[.004+.023*lever,.076,.051],[.009+.036*lever,.073,.089]],.006,p.blued,5,7);
 for(const s of [-1,1]){
  screw(m,s,.0475,.009,-.160,.009);screw(m,s,.046,.011,-.025,.0048);
  if(!m.lowDetail)for(const z of [-.132,-.10,-.066]){
   const arc=[];for(let i=0;i<=7;i++){const a=i*.63;arc.push([s*.0468,.009+.010*Math.sin(a),z+.014*Math.cos(a)]);}
   linked(m,arc,.0011,p.steelEdge,5,4);
  }
 }
 if(!pose.exchanging||!pose.reload)return;
 const sidesToFill=loadingSides(pose),t=pose.reload;
 for(const side of [-1,1]){
  // A live shell already in the other chamber stays in place through a single-shell exchange.
  if(!sidesToFill.includes(side)&&((side===1&&pose.loaded>0)||(side===-1&&pose.loaded>1))){
   cartridge(b,[side*barrelX,shotY,shotBreech+.001],[0,0,-.058],true);continue;
  }
  if(t>.14&&t<.33&&((side===-1&&pose.loaded<2)||(side===1&&pose.loaded<1))){
   const u=clamp((t-.14)/.19),base=hingedPoint([side*(barrelX+.069*u),shotY+.052*u-.13*u*u,shotBreech+.181*u],pose);
   const a=[side*.022*u,.042*u,-.056*(1-u)];
   if(u<.94)cartridge(m,base,a,true,true);
  }
 }
 if(t>.32&&t<.884)for(const [i,side] of sidesToFill.entries()){
  const q=shellPath(pose,side,i*.041);cartridge(m,q.base,q.axis,true);
 }
}
function boltState(pose){
 const t=pose.reload,b=pose.boltCycle,w=pose.weight;
 const turn=Math.max(w*smooth(.025,.12,t)*(1-smooth(.86,.94,t)),smooth(.11,.245,b)*(1-smooth(.79,.90,b)));
 const slide=Math.max(w*smooth(.12,.23,t)*(1-smooth(.76,.86,t)),smooth(.245,.44,b)*(1-smooth(.59,.79,b)));
 const hand=Math.max(w*smooth(.00,.10,t)*(1-smooth(.90,.99,t)),smooth(.045,.15,b)*(1-smooth(.89,.995,b)));
 const a=-.69+1.18*turn,z=.006+.095*slide;
 return {turn,slide,hand,root:[.021,.047,z],knob:[.027+.058*Math.cos(a),.048+.060*Math.sin(a),z+.031]};
}
export function sportingBoltGrip(pose){
 const {hand,knob}=boltState(pose);
 return scaled(difference(knob,[.013,-.048,.044]),hand);
}
function rifleFeed(pose){
 // The operator takes the available cartridges in the palm once. Only the
 // thumb and wrist dip toward the loading port on subsequent rounds.
 const count=Math.min(4,Math.max(1,pose.reloadCount)),t=pose.reload;
 const step=clamp((t-.345)/.399)*count,index=Math.min(count-1,Math.floor(step)),phase=step-index;
 const pocket=pose.localPoint([-.141,-.398,-.286]),cup=[-.044,.119,-.040];
 const ready=between(pocket,cup,smooth(.227,.355,t));
 const thumb=smooth(.055,.64,phase)*(1-smooth(.68,.99,phase));
 const hand=between(ready,[-.018,.092,-.058],thumb);
 const base=between(ready,feed,smooth(.065,.66,phase));
 return {base,hand,visible:t>.225&&t<.744&&phase<.72,spares:t>.225&&t<.731?count-index-1:0};
}
function rifle(m,pose){
 furniture(m,true);
 stockWood(m,[[-.435,.010,.023,.016],[-.407,.002,.037,.029],[-.361,-.004,.041,.034],
  [-.192,-.009,.042,.039],[-.121,-.014,.046,.040],[-.021,-.008,.047,.034],[.052,-.012,.040,.028]]);
 hull(m,[[-.699,.052,.015,.015,steelBlue],[-.672,.052,.016,.016,steelBlue],[-.398,.052,.021,.022,steelBlue],
  [-.251,.052,.028,.027,p.blued],[-.184,.052,.029,.029,steelBlue]],rim(m.lowDetail?8:14),5,false);
 boreFace(m,0,.052,-.6992,.015,.54,m.lowDetail?8:14);
 // The receiver has an open loading port and two independently shaped bridges.
 for(const [a,b] of [[-.210,-.151],[-.029,.033]]){
  hull(m,[[a,.049,.035,.032,p.blued],[a+.005,.051,.037,.034,p.steel],[b-.005,.05,.037,.033,steelBlue],[b,.049,.034,.031,p.blued]],rim(m.lowDetail?8:14));
 }
 for(const side of [-1,1]){
  box(m,side*.027,.042,-.09,.012,.034,.143,steelBlue);
  screw(m,side,.043,-.010,-.093,.0045);
 }
 box(m,0,.030,-.091,.046,.014,.123,p.oxide);
 const {knob,root,slide}=boltState(pose),dz=.095*slide;
 hull(m,[[-.154+dz,.057,.014,.015,p.steel],[-.145+dz,.058,.022,.022,chamber],[.028+dz,.057,.023,.024,chamber],[.042+dz,.057,.024,.026,p.blued],[.065+dz,.056,.017,.019,p.dark]],rim(m.lowDetail?8:14));
 const mid=between(root,knob,.66);mid[2]+=.012;
 linked(m,[root,mid,knob],.0075,p.steel,5,7);
 limb(m,[[plus(knob,[-.009,.004,-.006]),.011,.011,p.blued],[knob,.015,.015,chamber],[plus(knob,[.009,-.003,.007]),.009,.009,p.blued]],8,5,true);
 // A cleft rear leaf, ramp, and unhooded front post remain open through the sight picture.
 hull(m,[[-.25,.080,.019,.005,p.steel],[-.185,.081,.021,.008,p.blued]],lockFrame);
 for(const s of [-1,1])linked(m,[[s*.020,.082,-.197],[s*.018,.099,-.198],[s*.011,.100,-.198],[s*.008,.095,-.198]],.003,p.steel,5,5);
 hull(m,[[-.675,.065,.009,.004,p.blued],[-.642,.075,.009,.012,p.steel],[-.615,.067,.009,.006,p.blued]],lockFrame);
 linked(m,[[0,.080,-.651],[0,.100,-.651]],.0031,p.blued,5,6);
 box(m,0,.098,-.649,.004,.004,.001,p.brass,5);
 if(!m.lowDetail){
  for(const z of [-.39,-.26])for(const s of [-1,1])screw(m,s,.038,.006,z,.004);
  for(let i=0;i<5;i++){const z=.028+dz+i*.003;box(m,0,.079,z,.028,.002,.001,p.steel,5);}
 }
 const round=rifleFeed(pose);
 if(!pose.stableMesh&&pose.exchanging&&round.visible)cartridge(m,round.base,[.003,-.003,-.066],false);
 if(!pose.stableMesh&&pose.exchanging)for(let i=0;i<round.spares;i++){
  const base=plus(round.hand,[-.014-.009*i,.003+.002*i,.005+.005*i]);
  cartridge(m,base,[-.006-.004*i,-.008,-.061],false);
 }
 if(!pose.stableMesh&&!pose.reload&&pose.boltCycle>.30&&pose.boltCycle<.57){
  const t=(pose.boltCycle-.30)/.27;
  cartridge(m,[.035+.17*t,.070+.15*t-.12*t*t,-.068+.048*t],[.048*t,-.034*t,-.045*(1-t)],false,true);
 }
}
export function sportingSupport(id,pose){
 if(id==='rifle')return difference(rifleFeed(pose).hand,[-.037,-.031,.042]);
 const sides=loadingSides(pose),shell=shellPath(pose,sides[0]??1);
 const carrying=plus(shell.base,scaled(shell.axis,.23)),carrier=difference(carrying,[-.037,-.031,.044]);
 const fore=[-.006,.048,-.302],t=pose.reload;
 const brace=difference(hingedPoint(plus(fore,[-.060,-.094,.070]),pose),[-.060,-.094,.070]);
 return between(brace,carrier,smooth(.16,.34,t)*(1-smooth(.73,.85,t)));
}
export function sportingArm(m,id,pose){
 if(id==='doublebarrel')shotgun(m,pose);else rifle(m,pose);
}
