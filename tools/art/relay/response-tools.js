import {paint as p,rim,clamp,smooth,between,plus,scaled,difference,quad,polygon,hull,limb,linked,mapped,box,screw,boreFace,dieStamp} from './armory-shapes.js';

const detectorGreen=[.27,.67,.41],phosphor=[.55,.91,.60],grid=[.104,.287,.169],glass=[.050,.104,.077];
const panel=(x,y,h=0)=>[-.171+.074*x,.068+.054*y+.004*x+.42*h,-.029-.032*y+.011*x+h];
const corners=[[-.89,-1],[.89,-1],[1,-.83],[1,.84],[.86,1],[-.87,1],[-1,.84],[-1,-.84]];

function ellipse(m,project,rx,ry,width,col,steps,mat=12){
 for(let i=0;i<steps;i++){
  const a=i*2*Math.PI/steps,b=(i+1)*2*Math.PI/steps,c=Math.cos(a),s=Math.sin(a),cc=Math.cos(b),ss=Math.sin(b);
  quad(m,project(rx*c,ry*s),project(rx*cc,ry*ss),project((rx-width)*cc,(ry-width)*ss),project((rx-width)*c,(ry-width)*s),col,mat);
 }
}
function ringStrokes(m,center,y,width,col,depth){
 const to=(u,v)=>panel(center+u,y+v,depth);
 quad(m,to(-width,0),to(0,width*1.32),to(width,0),to(0,-width*1.32),col,12);
}
export function breakerReceiver(m){
 const rings=[[1.15,1.23,-.037],[1.21,1.21,-.020],[1.20,1.22,-.005],[1.08,1.08,.002],[1,1,0]].map(([w,h,d])=>corners.map(([x,y])=>panel(w*x,h*y,d)));
 const colors=[p.dark,p.rubber,p.webDark,p.blued];
 polygon(m,rings[0].slice().reverse(),p.oxide,7);
 for(let r=0;r<4;r++)for(let i=0;i<8;i++){const j=(i+1)%8;quad(m,rings[r][i],rings[r][j],rings[r+1][j],rings[r+1][i],colors[r],r===1?7:5);}
 polygon(m,rings[4],glass,12);
 // The shock mount and captive hinge connect the display to the left side of the receiver.
 linked(m,[[-.055,.027,-.121],[-.094,.034,-.121],[-.133,.056,-.089],[-.154,.057,-.064]],.013,p.blued,5,7);
 const wire=[[-.078,.015,-.139],[-.117,-.003,-.135],[-.153,.005,-.099],panel(-.64,-.61,-.041)];
 linked(m,wire,.0045,p.webDark,7,6);
 const surface=(x,y)=>panel(x,y,.0009);
 for(const r of [.34,.67,.92])ellipse(m,surface,r*.72,r,.013,grid,m.lowDetail?16:24);
 for(const [x,y,xx,yy] of [[-.87,0,-.08,0],[.08,0,.87,0],[0,-.86,0,-.10],[0,.10,0,.86]]){
  const ox=y===yy?0:.007,oy=x===xx?0:.008;
  quad(m,surface(x-ox,y-oy),surface(xx-ox,yy-oy),surface(xx+ox,yy+oy),surface(x+ox,y+oy),grid,12);
 }
 ringStrokes(m,0,0,.035,phosphor,.0018);
 for(let i=0;i<6;i++){
  const x=-.97+i*.087;
  quad(m,panel(x,-1.098,.003),panel(x+.051,-1.098,.003),panel(x+.051,-1.053,.003),panel(x,-1.053,.003),i%2?p.enamel:detectorGreen,5);
 }
 if(m.lowDetail)return;
 for(const side of [-1,1]){
  for(const y of [-.87,.85]){
   const q=panel(side*1.075,y,.004);
   const local=mapped(m,([x,yy,z])=>[q[0]+x,q[1]+yy,q[2]+z]);hull(local,[[-.003,0,.0039,.0039,p.steel],[.001,0,.0036,.0036,p.steelEdge]],rim(7));
   quad(local,[-.0024,-.0006,.0011],[.0025,.0002,.0011],[.0024,.0010,.0011],[-.0025,.0001,.0011],p.dark,5);
  }
  for(let i=0;i<5;i++){const x=side*(.64+i*.058);quad(m,panel(x,1.08,.003),panel(x+.020,1.08,.003),panel(x+.024,1.13,.003),panel(x+.004,1.13,.003),p.rubber,7);}
 }
}
export function receiverTrace(m,contacts,sweep){
 const t=clamp(sweep),to=(x,y)=>panel(x,y,.0023),r=.025+.91*t;
 ellipse(m,to,r*.72,r,.014,detectorGreen,m.lowDetail?20:28);
 for(const c of contacts||[]){
  if(!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(c.strength)||c.strength<=0)continue;
  const x=c.x*.70,y=c.y*.90;
  if(Math.hypot(c.x,c.y)>1.025)continue;
  const distance=Math.hypot(c.x,c.y),age=(t-distance+1)%1;
  const level=clamp(c.strength)*(.50+.50*(1-age)**2),col=[.28+.50*level,.52+.45*level,.33+.27*level];
  ringStrokes(m,x,y,.033+.016*level,col,.0038);
  if(age<.28)ellipse(m,(a,b)=>panel(x+a,y+b,.0033),.048+.04*age,.064+.054*age,.013,detectorGreen,9);
 }
}
const launcherGreen=[.257,.294,.214],toolSteel=[.329,.357,.364],heatStain=[.345,.287,.230],ashWood=[.430,.349,.226],cutWood=[.571,.460,.301];
const forwardShell=(pose,v)=>{
 const a=.82*smooth(.08,.29,pose.reload)*(1-smooth(.76,.91,pose.reload))*pose.weight;
 const z=v[2]+.223,x=v[0]+.034,c=Math.cos(a),s=Math.sin(a);
 return [x*c+z*s-.034,v[1],z*c-x*s-.223];
};
function launcherRound(pose){
 const t=pose.reload,load=forwardShell(pose,[0,.049,-.048]);
 const bag=pose.localPoint([-.155,-.515,-.286]);
 const approach=between(bag,plus(load,[-.011,.012,.127]),smooth(.28,.55,t)),axis=forwardShell(pose,[0,.049,-.155]);
 const seat=smooth(.55,.71,t),base=between(approach,load,seat);
 return {base,axis:difference(axis,load),hand:difference(base,[-.013,-.019,-.040])};
}
export function launcherSupport(pose){
 const {hand}=launcherRound(pose);
 const grab=difference(hand,[-.047,-.069,.037]),rest=[-.012,.038,-.282];
 return between(rest,grab,smooth(.19,.37,pose.reload)*(1-smooth(.73,.90,pose.reload)));
}
function roundMesh(m,base,axis,spent=false){
 const end=plus(base,axis),at=t=>between(base,end,t),r=.035;
 const rows=[[0,.86,p.brass],[.058,1.07,p.brass],[.089,.99,p.umber],[.58,.97,spent?p.umber:launcherGreen],[.71,.94,spent?p.umber:p.orangeShade]];
 if(!spent)rows.push([.87,.68,launcherGreen],[.99,.17,p.steel]);
 limb(m,rows.map(([t,size,color])=>[at(t),r*size,r*size,color]),m.lowDetail?8:14,5,true,true);
}
export function launcherBody(m,pose){
 const n=m.lowDetail?10:20,F=mapped(m,v=>forwardShell(pose,v));
 // An offset yoke swings the entire tubular chamber clear of the receiver on reload.
 hull(F,[[-.535,.051,.053,.054,p.blued],[-.527,.051,.061,.061,p.steel],[-.509,.051,.061,.061,toolSteel],[-.503,.051,.055,.055,p.dark],
  [-.440,.051,.057,.057,launcherGreen],[-.399,.051,.064,.063,launcherGreen],[-.177,.051,.064,.063,launcherGreen],[-.139,.051,.058,.059,toolSteel],[-.066,.051,.058,.059,toolSteel],[-.044,.051,.064,.064,p.steel],[-.033,.051,.062,.062,p.blued]],rim(n),5,false);
 boreFace(F,0,.051,-.5353,.053,.80,n);
 const tube=(r,z)=>rim(n).map(([x,y])=>[x*r,.051+y*r,z]);
 const lip=tube(.061,-.0326),mouth=tube(.043,-.0321),inside=tube(.042,-.097);
 for(let i=0;i<n;i++){const j=(i+1)%n;quad(F,lip[i],lip[j],mouth[j],mouth[i],p.steel,5);quad(F,mouth[i],mouth[j],inside[j],inside[i],p.dark,5);}
 polygon(F,inside,p.oxide,5);
 for(let i=0;i<(m.lowDetail?3:6);i++){
  const z=-.388+i*(m.lowDetail?.065:.034);
  hull(F,[[z,.049,.064,.065,p.blued],[z+.004,.049,.068,.068,p.rubber],[z+.014,.049,.068,.068,p.rubber],[z+.018,.049,.064,.065,launcherGreen]],rim(n),7,false);
 }
 hull(m,[[-.053,.039,.058,.048,p.blued],[-.028,.043,.065,.055,launcherGreen],[.084,.044,.057,.055,launcherGreen],[.119,.040,.044,.042,p.blued]]);
 const brace=mapped(m,v=>[v[0]-.057,v[1]+.017,v[2]-.132]);
 hull(brace,[[-.114,0,.016,.021,p.blued],[-.093,0,.024,.024,toolSteel],[.115,0,.019,.025,p.blued]]);
 for(const s of [-1,1])screw(m,s,.066,.046,-.011,.009);
 linked(m,[[-.028,.004,-.015],[-.031,-.061,-.043],[.004,-.079,-.048],[.022,-.072,.038]],.007,p.blued,5,6);
 hull(m,[[.101,.029,.038,.031,launcherGreen],[.128,.025,.030,.022,p.steel],[.192,.018,.025,.019,p.blued],[.226,-.012,.041,.056,launcherGreen],[.258,-.013,.042,.062,p.rubber]]);
 // Offset ladder and front fork leave a clear central sight line.
 for(const x of [-.020,.020])linked(m,[[x,.090,.062],[x,.147,.070],[x*.55,.155,.071],[x*.36,.141,.071]],.0038,p.blued,5,6);
 linked(F,[[.012,.103,-.453],[0,.115,-.454],[0,.153,-.454]],.0033,p.blued,5,6);
 box(F,0,.150,-.451,.004,.005,.002,p.orangeEdge,10);
 if(!m.lowDetail){
  for(let i=0;i<4;i++)box(m,-.055,.047+i*.007,.033,.002,.003,.048,p.steel,5);
  linked(m,[[.042,.012,.144],[.066,-.017,.167],[.065,-.035,.197],[.041,-.045,.205]],.004,p.webDark,8,6);
  screw(m,-1,.070,.029,-.233,.0085);
 }
 if(!pose.stableMesh&&pose.exchanging&&pose.reload>.255&&pose.reload<.747){
  const round=launcherRound(pose);roundMesh(m,round.base,round.axis);
 }
 if(!pose.stableMesh&&pose.exchanging&&pose.reload>.17&&pose.reload<.35){
  const t=(pose.reload-.17)/.18;
  const pos=plus(forwardShell(pose,[0,.051,-.020]),[-.10*t,.065*t-.16*t*t,.13*t]);
  roundMesh(m,pos,[-.050*t,-.035*t,-.099],true);
 }
 return [0,0,0];
}
const shaft=t=>[.040-.146*t,-.222+.597*t,.193-.665*t];
export function hammerSupport(){return difference(shaft(.51),[-.035,-.076,.055]);}
export function masonHammer(m){
 const n=m.lowDetail?7:14;
 const rings=[[0,.021,p.dark],[.020,.026,p.rubber],[.058,.024,p.webDark],[.22,.026,p.rubber],[.28,.021,ashWood],[.50,.020,ashWood],
 [.72,.023,cutWood],[.82,.026,ashWood],[.87,.026,toolSteel],[.96,.024,p.umber],[1,.027,cutWood]];
 limb(m,rings.map(([t,r,color])=>[shaft(t),r,r*.79,color]),n,5,true,true);
 for(let i=0;i<(m.lowDetail?3:7);i++){
  const t=.036+i*(m.lowDetail?.068:.027);limb(m,[[shaft(t),.025,.020,p.webDark],[shaft(t+.006),.027,.021,p.gloveFold],[shaft(t+.013),.025,.02,p.webDark]],n,7);
 }
 const top=shaft(.94),head=mapped(m,([x,y,z])=>[top[0]+z,top[1]+y-.11*z,top[2]+x+.12*z]);
 const oct=[[-.62,1],[-1,.62],[-1,-.55],[-.61,-1],[.65,-1],[1,-.60],[1,.63],[.58,1]];
 hull(head,[[-.137,0,.038,.039,p.steel],[-.129,0,.047,.047,p.steelEdge],[-.107,0,.049,.050,toolSteel],
 [-.073,.002,.041,.041,heatStain],[-.052,.006,.051,.053,toolSteel],[-.041,.006,.053,.054,p.blued],
 [.046,.006,.051,.051,p.blued],[.066,.003,.043,.043,toolSteel],[.094,0,.045,.044,toolSteel],[.129,0,.047,.046,p.steel],[.139,0,.038,.036,p.steelEdge]],oct);
 for(let i=0;i<2;i++){const t=.91+i*.034,at=shaft(t);box(m,at[0],at[1]+.037,at[2]-.028,.021,.010,.012,p.steel,5);}
 if(m.lowDetail)return;
 // Shallow missing corners, bright hammer marks and a wedge proud of the head.
 for(let k=0;k<8;k++){
  const u=k/7,z=(k%2?-.128:.129),x=-.034+.061*u,y=.045-.010*Math.sin(u*8);
  head.tri([x,y,z],[x+.008,y+.002,z],[x+.002,y-.005,z+(k%2?-.004:.004)],p.steelEdge,5);
 }
 for(let j=0;j<6;j++){
  const t=.31+j*.069,u=shaft(t),v=shaft(t+.12),s=j%2?1:-1;
  const a=plus(u,[.018*s,.008,.001]),b=plus(v,[.019*s,.009,-.001]);
  quad(m,a,plus(a,[0,.002,.001]),plus(b,[0,.0015,.001]),b,j%2?cutWood:p.umber,8);
 }
}
