// The Grey stands on its hind feet to watch. Its forearms bear weight during the rush.
// Coordinates are actor-local metres. +Z faces the lens, -X is the massive left scapula.
import {offset,line,quad,footfall,insetMesh} from './actor-geometry.js';
import {woundSocket,tornChest,hitWounds} from './actor-anatomy.js';
import {lowRig,lowHind,lowFore} from './grey-gait.js';
import {greyAction,poseGreyArm} from './grey-motion.js';

const tau=Math.PI*2, clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const between=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
const ink=[.065,.077,.082],glass=[.106,.134,.143],oyster=[.692,.696,.637];
const horn=[.429,.448,.418],edge=[.547,.563,.523],skin=[.399,.430,.420];
const shadow=[.232,.264,.267],marrow=[.313,.287,.304],throat=[.177,.185,.201];
const dorsal=[[.354,.390,.382],[.381,.414,.401],[.416,.439,.419],[.335,.369,.365]];
const hide=[skin,[.423,.453,.430],[.384,.410,.399],[.446,.464,.439]];
const pale=[[.555,.578,.548],[.612,.621,.579],[.569,.588,.548],[.529,.555,.529]];
const cords=[[.304,.332,.332],[.365,.382,.369],shadow,[.318,.337,.329]];
const ligament=[[.433,.460,.438],[.513,.527,.490],[.462,.482,.460],[.404,.431,.420]];
const inner=[marrow,[.348,.327,.335],[.278,.272,.289],[.365,.342,.337]];
const nail=[[.152,.172,.173],[.266,.287,.277],[.215,.230,.222],[.306,.323,.302]];

// One joined skin over an articulated muscle. Width and depth differ independently along its length.
function flesh(m,knots,n,palette,seed=0){
 if(m.greyClose&&knots.some(k=>k[1]>.085))n+=3;
 let prior;
 for(let i=0;i<knots.length;i++){
  const [p,w,d,twist=0]=knots[i],lo=knots[Math.max(0,i-1)][0],hi=knots[Math.min(i+1,knots.length-1)][0];
  const dx=hi[0]-lo[0],dy=hi[1]-lo[1],dz=hi[2]-lo[2],len=Math.hypot(dx,dy,dz)||1;
  const ax=dx/len,ay=dy/len,az=dz/len;
  // Use a common lateral reference so adjacent rings do not spin at a bent joint.
  let ex=1-ax*ax,ey=-ax*ay,ez=-ax*az;
  if(ex*ex+ey*ey+ez*ez<.002){ex=-az*ax;ey=-az*ay;ez=1-az*az;}
  const el=Math.hypot(ex,ey,ez)||1;ex/=el;ey/=el;ez/=el;
  const fx=ey*az-ez*ay,fy=ez*ax-ex*az,fz=ex*ay-ey*ax;
  const ring=[];
  for(let j=0;j<n;j++){
   const a=(j+.28)*tau/n+twist,c=Math.cos(a)*w,s=Math.sin(a)*d;
   ring.push(offset(p,ex*c+fx*s,ey*c+fy*s,ez*c+fz*s));
  }
  if(prior){
   for(let j=0;j<n;j++){
    const k=(j+1)%n,color=palette[(j+seed+(i>>1))%palette.length];
    quad(m,prior[j],prior[k],ring[k],ring[j],color);
   }
  }else for(let j=1;j<n-1;j++)m.tri(ring[0],ring[j+1],ring[j],palette[0]);
  if(i===knots.length-1)for(let j=1;j<n-1;j++)m.tri(ring[0],ring[j],ring[j+1],palette[1]||palette[0]);
  prior=ring;
 }
}

function plates(m,rows,n,pal){
 let prior;
 for(let i=0;i<rows.length;i++){
  const [y,w,d,cx,cz,slant=0]=rows[i],ring=[];
  for(let j=0;j<n;j++){
   const a=tau*j/n,c=Math.cos(a),s=Math.sin(a);
   ring.push([cx+s*w,y+slant*s+.012*(1-c)*s,cz+d*c]);
  }
  if(prior){for(let j=0;j<n;j++)quad(m,prior[j],prior[(j+1)%n],ring[(j+1)%n],ring[j],pal[(j+(i>>1))%pal.length]);}
  else for(let j=1;j<n-1;j++)m.tri(ring[0],ring[j+1],ring[j],pal[0]);
  if(i===rows.length-1)for(let j=1;j<n-1;j++)m.tri(ring[0],ring[j],ring[j+1],pal[1]);
  prior=ring;
 }
}

// These are openings in the scapular blade; both rims and the inner wall survive a view from behind.
function mantle(m,shoulder,side,large,q,a){
 const roll=a.wave(large?1.2:3.1),lift=large?1:.70;
 const tip=offset(shoulder,side*((large?.267:.139)+.037*roll+.084*a.scream),
  lift*(.512+.055*q.coil+.035*roll+(large?.11:0)*a.set),-.259+.043*roll-.11*a.scream);
 tip[0]+=side*a.fan*(large?1.03:.78);tip[1]+=(large?.89:.59)*a.stroke;tip[2]-=a.fan*(large?1.02:.81);
 const crest=offset(tip,-side*.074,.008,-.072);
 const throat=offset(shoulder,-side*.277,.004,-.114),rim=offset(shoulder,side*.061,.059,.084);
 const ridge=offset(shoulder,-side*.074,.349*lift,-.245),root=offset(shoulder,-side*.128,-.175,-.022);
 const outline=[rim,offset(shoulder,side*.162,.153*lift,.010),offset(shoulder,side*.239,.34*lift,-.105),tip,crest,ridge,throat,root];
 const core=offset(shoulder,-side*.007,.132*lift,-.071);
 const aperture=outline.map((p,i)=>between(core,p,[.32,.37,.40,.39,.44,.48,.39,.31][i]));
 for(let i=0;i<outline.length;i++){
  const j=(i+1)%outline.length,a=outline[i],b=outline[j],c=aperture[j],d=aperture[i];
  const thick=[0,-.011,-.052],aa=offset(a,...thick),bb=offset(b,...thick),cc=offset(c,...thick),dd=offset(d,...thick);
  quad(m,a,b,c,d,i===1?edge:dorsal[(i+1)%4]);quad(m,bb,aa,dd,cc,dorsal[i%4]);
  quad(m,a,aa,bb,b,i===1||i===2?edge:horn);quad(m,d,c,cc,dd,i%2?marrow:shadow);
 }
 line(m,ridge,crest,.025,.024,edge,5);line(m,crest,tip,.024,.011,horn,5);
 const lower=offset(shoulder,-side*.091,-.133,-.174),lip=outline[2];
 const rib=between(lower,lip,.57);rib[2]+=.061;
 flesh(m,[[lower,.045,.052],[rib,.062,.040],[lip,.018,.022]],5,hide);
 const strut=offset(core,-side*.006,-.022,-.098);
 line(m,offset(throat,0,-.026,-.061),strut,.041,.024,shadow,5);
 line(m,strut,offset(tip,-side*.022,-.059,-.038),.024,.012,horn,5);
}

function rig(q){
 const action=greyAction(q),{flee,swing,set,arc,tether,reach,haul,scream,inhale,wave}=action;
 const legT=flee?1-q.t:q.t,travel=Math.max(q.move,flee),a=legT*tau,d=Math.max(q.dash,.91*flee),h=q.lurk,m=q.move*(1-d),curl=q.coil,impact=q.sting;
 const stride=Math.sin(a)*travel,suspension=(.5+.5*Math.cos(a*2-.61))*d;
 // The gaze steps, holds, then returns. The chest catches up after the head.
 const glance=action.active?0:smooth((q.t-.09)/.17)-smooth((q.t-.55)/.15);
 const settle=action.active?0:smooth((q.t-.15)/.18)-smooth((q.t-.63)/.18);
 const hips=[-.040*stride-.086*h+.023*q.breath,1.42-.28*m-.51*d-.45*h-.17*curl-.20*q.fall+.066*suspension,
  -.25-.22*h-.35*d-.11*m+.07*q.strike];
 hips[0]-=.070*swing+.061*flee;hips[1]-=.085*set+.102*tether+.07*inhale;hips[2]-=.10*haul;
 const waist=offset(hips,.066-.044*stride,.40-.075*h-.07*d,.012+.048*d);
 const chest=[.010-.091*h+.083*d*Math.sin(a-.81)-.102*impact+.029*settle,
  2.48-.32*m-.51*d-.27*h-.25*curl+.116*q.strike-.33*q.fall+.041*q.breath+.074*suspension,
  -.050+.13*m+.224*d+.146*h+.19*q.strike+.15*curl];
 chest[0]+=.186*swing-.102*flee+.020*wave(.88);chest[1]+=.153*scream-.142*set-.128*reach-.101*inhale;
 chest[2]+=.14*arc+.21*reach-.18*haul-.175*scream;
 const face=[.027+.083*glance-.102*h+.064*d*Math.sin(a-.52)-.13*impact,
  3.48-.47*m-1.11*d-.81*h-.28*curl+.114*q.strike-.40*q.fall+.021*q.breath+.050*suspension,
  .32+.083*m+.235*d+.111*h+.113*q.strike+.091*curl];
 face[0]+=.105*swing-.144*flee+.016*wave(1.52);face[1]+=.152*scream-.127*set-.139*reach-.077*inhale;
 face[2]+=.095*arc+.15*reach-.082*haul-.126*scream;
 hips[1]+=.18*action.fold;chest[2]+=.27*action.fold;face[2]+=.44*action.fold;face[1]-=.19*action.fold;
 const nape=offset(chest,-.119,.357+.088*h+.031*d,-.181),joint=between(nape,face,.54);
 joint[0]-=.061+.065*h-.034*wave(2.1);joint[1]+=.096+.039*scream;joint[2]-=.098+.061*d+.049*scream;
 return lowRig(q,{a,d,h,m,hips,waist,chest,face,nape,joint,stride,suspension,glance,settle,action,legT,travel});
}

function trunk(m,r,q){
 const {hips,waist,chest,action:a}=r,low=offset(chest,.028,-.29,-.037),back=offset(chest,-.035,.102,-.164);
 const pelvic=insetMesh(m,hips,-.038+.12*r.stride,-.08+.16*r.d,.052+.08*r.h);
 plates(pelvic,[[-.203,.111,.112,.011,0],[-.111,.229,.202,.018,-.031],[.032,.308,.22,0,-.04],
  [.159,.269,.172,-.014,-.068],[.225,.115,.126,-.026,-.087]],9,dorsal);
 // A muscular lumbosacral fold bends away from the slit down the front of the abdomen.
 const rear=offset(hips,.007,.078,-.17),nuchal=offset(back,-.061,.161,-.098);
 const bend=between(rear,nuchal,.46);bend[0]-=.041;bend[2]-=.092;
 flesh(m,[[rear,.188,.149],[between(rear,bend,.50),.203,.171],[bend,.191,.164],
  [between(bend,nuchal,.62),.200,.196],[nuchal,.231,.182]],8,dorsal);
 // The front abdominal wall passes around a recessed vent, leaving real lateral gaps below the ribs.
 for(const s of [-1,1]){
  const flank=offset(waist,s*(s<0?.151:.113),.025,-.049);
  flesh(m,[[offset(hips,s*.148,.084,-.11),.10,.10],[flank,.093,.113],
   [offset(low,s*.121,.071,-.118),.102,.124],[offset(back,s*.11,.006,.03),.117,.114]],6,cords,s<0?1:0);
 }
 if(q.mask&8)tornChest(m,offset(chest,.009,-.052,.014),.491,.308,.249,skin,true);
 else{
  const belly=offset(waist,.006,-.02,.020);
  for(const s of [-1,1]){
   const middle=offset(belly,s*.103,.014,.117),vent=offset(chest,s*.075,-.224,.116);
   const coil=between(middle,vent,.53);coil[0]+=s*((s<0?.052:.083)+.036*a.wave(s+2.13));coil[2]+=.041-.021*q.breath+.027*a.wave(s+.54);
   flesh(m,[[offset(hips,s*.10,.109,.069),.091,.122],[middle,.128,.124],
    [coil,.106,.098],[vent,.084,.071]],7,hide,s<0?1:0);
  }
  const body=insetMesh(m,chest,.053*r.settle+.11*r.stride+.17*a.swing,.11+.13*r.d-.15*a.scream,-.10+.08*r.stride+.086*a.swing);
  plates(body,[[-.358,.103,.119,.071,-.037],[-.241,.260,.177,.037,-.057],[-.104,.475,.247,.011,-.031],
   [.039,.554,.281,-.021,-.018],[.178,.508,.262,-.050,-.041],[.273,.273,.160,-.081,-.069],
   [.312,.138,.121,-.095,-.116]],10,hide);
  if(q.wounds)hitWounds(body,[.027,-.047,.252],.40,.218);
 }
 for(const s of [-1,1]){
  // The upper costal lip is thick on one side; wind opens the gill slots like a contracting lung.
  const scap=offset(chest,s*(s<0?.431:.367),.134,-.077);
  const heel=offset(waist,s*.102,-.012,-.072),fan=between(heel,scap,.62);fan[0]+=s*.096;fan[2]-=.090;
  flesh(m,[[heel,.076,.095],[between(heel,fan,.44),.094,.109],[fan,.147,.221],[scap,.165,.202]],
   7,dorsal,s<0?1:0);
  // Open lamellae travel from the rear costal rail around the hollow towards the floating keel.
  for(let i=0;i<4;i++){
   const u=i/3,base=offset(chest,s*(.191+.109*u),.016-.134*i,-.150-.052*u);
   const ripple=a.wave(.76*i+s*1.37),flare=.053*a.scream+.027*a.tether;
   const mid=offset(base,s*(.224-.032*u+.030*ripple+flare),-.098-.031*u+.019*ripple,.075+.022*q.breath+.028*ripple+flare);
   const front=offset(chest,s*(.103+.010*i),-.169-.101*i,.191-.023*i);
   const hinge=between(mid,front,.41);hinge[2]+=.105+.021*a.wave(.76*i+s*1.37+.7);hinge[1]-=.043-.021*a.scream;
   flesh(m,[[base,.031,.071],[mid,.047+.014*(1-u),.079],[hinge,.046,.045],[front,.015,.024]],5,
    i===3?cords:dorsal,i%3);
   if(i<2){
    const lower=offset(mid,-s*.008,-.047-.023*(1-i),.006),membrane=offset(hinge,s*.018,-.061-.019*q.breath,-.012);
    quad(m,mid,hinge,membrane,lower,i===0?hide[s>0?2:1]:dorsal[3]);
   }
  }
 }
 // One short pair of feeding limbs folds into the slots. Only one is fully developed.
 // Both emerge when the long forearms are busy holding or tearing a victim.
 for(const s of [-1,1]){
  const full=s>0,unfold=Math.max(q.grip,q.strike*.8,q.tear*.93,a.tether,a.scream),follow=full?1:.58;
  const root=offset(chest,s*(full?.30:.25),-.173,.095);
  const stir=a.wave(s*1.85+.72),elbow=offset(root,s*(.079+.129*unfold+.084*a.scream+.015*stir),-.221-.042*follow+.18*unfold,.016+.092*r.h+.123*unfold);
  const hand=offset(elbow,-s*(.062+.048*(1-unfold)+.19*a.reach-.19*a.scream),.099-.113*unfold+.19*a.scream+.036*stir,
   .145+.255*unfold+.10*a.reach+.033*Math.sin(r.a+.72*s)+.027*a.wave(s+2.22));
  const sleeve=between(root,elbow,.43);sleeve[0]+=s*.038;
  flesh(m,[[root,.065,.068],[sleeve,.079,.069],[elbow,.042,.041],[hand,.032,.034]],6,hide,full?0:2);
  const claw=offset(hand,-s*.025,.036-.003*unfold,.076+.092*unfold);
  flesh(m,[[hand,.040,.033],[claw,.025,.023],[offset(claw,-s*.042,-.052,.033),.004,.005]],5,nail);
  if(full){
   const spur=offset(hand,s*.045,-.039,.025);
   line(m,hand,spur,.023,.017,skin,4);line(m,spur,offset(spur,-s*.018,.003,.080),.017,.003,horn,4);
  }
 }
 if(!(q.mask&8)){
  // Two sheets of ventral skin fold around a breathing slit. Its lip joins the pelvis and keel.
  const pubis=offset(hips,.011,.081,.147),groove=offset(waist,.018,.014,.159+.024*q.breath);
  const stern=offset(chest,-.014,-.259,.195),split=between(groove,stern,.43);
  for(const s of [-1,1]){
   const iliac=offset(hips,s*.197,.126,.107),lower=offset(waist,s*.130,-.062,.114),
    upper=offset(waist,s*.129,.183,.134+.017*q.breath),costal=offset(chest,s*.199,-.188,.165);
   const gl=offset(groove,s*(.021+.011*q.breath),-.039,.003),up=offset(split,s*.027,.019,.002);
   quad(m,pubis,iliac,lower,gl,hide[s<0?0:2]);quad(m,gl,lower,upper,up,s<0?hide[1]:dorsal[2]);
   quad(m,up,upper,costal,stern,hide[s<0?2:0]);
   line(m,gl,up,.010,.013,marrow,4);
   const crease=between(lower,gl,.48);
   m.tri(offset(lower,-s*.01,.021,.012),offset(gl,0,.015,0),offset(crease,0,.037,.014),horn);
  }
 }
 const sternum=offset(chest,.032,.136,.233);
 flesh(m,[[sternum,.072,.050],[offset(chest,-.009,-.093,.258),.076,.055],
  [offset(chest,.018,-.284,.190),.047,.040],[offset(chest,.009,-.412,.143),.015,.018]],6,ligament);
 backMuscles(m,r,q);
 const spine=[offset(hips,.002,.054,-.208),offset(waist,-.034,.042,-.215),offset(low,-.017,.193,-.152),offset(back,-.014,.116,-.11)];
 for(let i=0;i<6;i++){
  const t=i/5*3,j=Math.min(2,Math.floor(t)),p=between(spine[j],spine[j+1],t-j),later=offset(p,-.014,.158,-.007);
  const rear=offset(p,-.010,.102,-.094-.046*(i/5));
  m.tri(offset(p,-.049,-.032,0),rear,offset(later,-.014,0,0),dorsal[i%4]);
  m.tri(offset(later,-.014,0,0),rear,offset(p,.045,-.024,0),horn);
 }
}

// These fascicles cross the shoulder and costal edge. Each contraction travels between
// fixed insertions; adjacent lobes tighten at different times and never leave the skin.
function backMuscles(m,r,q){
 const {action:a,chest:c,waist:w}=r;
 for(const s of [-1,1]){
  for(let j=0;j<(s<0?2:1);j++){
   const back=j===1,lag=s*1.11+j*2.30,v=a.wave(lag),u=a.wave(lag+1.27),f=a.wave(lag+2.36);
   const upper=offset(c,s*(.24+.078*j),.217-.026*j,back?-.178:.129);
   const shoulder=offset(c,s*(.45+.032*v),.128+.044*v,back?-.221-.043*v:.136+.044*v);
   const rib=offset(c,s*(.44+.032*u),-.052+.054*u,back?-.233-.066*u:.157+.061*u);
   const twist=offset(c,s*(.335+.051*f),-.209+.043*f,back?-.233-.037*f:.176+.053*f);
   const heel=offset(w,s*(.167+.019*j),.114,.027-.171*j);
   flesh(m,[[upper,.031,.032],[shoulder,.109+.030*v,.077+.023*v,.13],
    [rib,.093+.036*u,.074+.020*u,.34],[twist,.072+.029*f,.059+.017*f,.58],
    [between(twist,heel,.57),.050,.045,.28],[heel,.020,.022]],6,back?cords:dorsal,s<0?1:0);
   const root=offset(shoulder,s*.050,-.01,back?-.038:.058),bulge=offset(rib,s*.049,-.014,back?-.035:.063),tip=offset(twist,s*.030,-.022,back?-.026:.046);
   flesh(m,[[root,.009,.009],[bulge,.014+.003*u,.013],[tip,.006,.006]],4,ligament);
  }
 }
 // An everted membrane supplies the tether. Three anchoring lips spread around a dark throat.
 const socket=offset(c,.026,-.240,.258),open=.018+.063*a.tether+.083*a.reach+.031*a.scream;
 const throat=offset(socket,0,.011,.038+.095*a.reach+.022*a.wave(.20));
 m.greyTetherOrigin=throat;
 if(q.mask&8)return;
 const mouth=[[0,1],[-.88,-.54],[.85,-.47]].map(([x,y],i)=>{
  const flex=.013*a.wave(2.11*i+.52),base=offset(socket,x*.097,y*.105,-.037),rim=offset(throat,x*(open+flex),y*(open+flex),.011);
  const bow=between(base,rim,.53);bow[2]+=.035+.024*a.tether;
  flesh(m,[[base,.046,.034],[bow,.038,.027],[rim,.024,.019]],5,inner,i);
  return rim;
 });
 for(let i=0;i<3;i++){
  const j=(i+1)%3;
  m.tri(mouth[i],mouth[j],offset(throat,0,0,-.024),ink);
  line(m,mouth[i],mouth[j],.010,.008,marrow,4);
 }
}

function orbit(m,s,blink){
 const scale=s<0?1:.90,skew=s<0?.026:-.044;
 const orbital=(x,y,z)=>[s*x,y*scale+skew+(x-.12)*(s<0?.22:-.19),z];
 const socket=[orbital(.025,.056,.244),orbital(.101,.173,.236),orbital(.218,.212,.177),
  orbital(.322,.170,.074),orbital(.284,.078,.137),orbital(.195,-.017,.199),orbital(.103,-.031,.238)];
 const eye=[orbital(.037,.049,.253),orbital(.113,.135,.255),orbital(.207,.155,.214),
  orbital(.285,.135,.137),orbital(.248,.074,.191),orbital(.183,.021,.232),orbital(.108,.015,.258)];
 const center=orbital(.162,.080,.262),spec=orbital(.165,.105,.275);
 for(let i=0;i<eye.length;i++){
  const p=eye[i];p[1]+=(center[1]-p[1])*.77*blink;
  p[2]+=.013*(i<4?1:0)*blink;
 }
 for(let i=0;i<eye.length;i++){
  const j=(i+1)%eye.length;
  quad(m,socket[i],socket[j],eye[j],eye[i],i<=2?pale[(i+1)%4]:i===3?shadow:dorsal[i%4]);
  m.tri(eye[i],eye[j],center,i>=3&&i<=5?glass:ink);
  if(i<3){
   const u=between(socket[i],socket[j],.62),v=between(socket[i],eye[i],.67);
   m.tri(u,offset(v,0,.004,.004),between(u,v,.47).map((n,k)=>n+(k===2?.009:k===1?.009:0)),edge);
  }
 }
 const mirror=between(spec,center,blink*.65);
 m.tri(orbital(.118,.125-.032*blink,.268),mirror,orbital(.148,.116-.027*blink,.275),[.340,.377,.379]);
 m.tri(mirror,orbital(.209,.118-.03*blink,.242),orbital(.174,.112-.025*blink,.267),[.207,.246,.253]);
 // Creases run into the temple. They interrupt the eye shape in side view like a closed inner lid.
 for(let i=0;i<2;i++){
  const a=orbital(.245+i*.019,.019-i*.023,.167-i*.013);
  const b=orbital(.301+i*.010,.076-i*.029,.087-i*.014),c=orbital(.309,.099-i*.03,.014);
  line(m,a,b,.010,.012,i?shadow:edge,4);line(m,b,c,.012,.004,i?shadow:horn,4);
 }
}

function head(m,r,q){
 const a=r.action,follow=r.glance-.38*r.settle,threat=Math.max(q.strike,q.grip*.66,q.tear*.83);
 const skull=insetMesh(m,r.face,-.085+.41*follow-.115*r.h+.107*r.d*r.stride+.23*q.sting+.73*a.flee+.15*a.swing+.023*a.wave(1.91),
  .12+.10*r.h-.097*r.d-.20*threat-.49*a.scream+.14*a.inhale+.09*a.haul+(a.sky?.78*a.fold+.43*a.plunge:0),
  -.105-.19*r.h+.078*r.stride+.14*q.sting+.18*a.set-.18*a.flee+.037*a.wave(3.21));
 // A high, flattened brow sweeps back into two unequal lobes. The whole underside is carved away.
 plates(skull,[[-.156,.086,.101,.019,.083,-.006],[-.084,.184,.155,.012,.072,.004],
  [.005,.268,.212,.007,.038,.013],[.117,.324,.266,-.009,-.009,.019],
  [.211,.352,.294,-.025,-.071,.041],[.302,.300,.263,-.043,-.153,.038],
  [.367,.178,.187,-.064,-.203,.025],[.383,.055,.069,-.073,-.234,.013]],12,pale);
 const blink=Math.max(0,Math.cos(a.phase-4.80)),nictitate=.91*blink**22*a.live+.15*q.sting;
 orbit(skull,-1,nictitate);orbit(skull,1,.79*nictitate);
 // The crown has actual surface relief, spreading into the flatter area behind the eyes.
 for(const side of [-1,1]){
  const k=side<0?1.12:.83;
  const p0=[side*.079,.178,.241],p1=[side*.146,.262,.168],p2=[side*.157,.322,.024],p3=[side*.111-.038,.354,-.160];
  flesh(skull,[[p0,.013,.012],[p1,.019*k,.012],[p2,.012*k,.009],[p3,.005,.005]],5,hide,1);
  const brow=[side*.076,.126,.248],browB=[side*.182,.195,.222],wing=[side*.295,.199,.115];
  flesh(skull,[[brow,.019,.022],[browB,.037,.035],[wing,.023,.019],[offset(wing,side*.010,.019,-.045),.006,.008]],6,pale);
  // The thin, irregular supraorbital vessels are dark only at the branch points.
  for(let j=0;j<3;j++){
   const end=[side*(.082+j*.047),.247+.025*j,.189-.065*j];
   const root=[side*(.118+j*.041),.168+.027*j,.225-.050*j],mid=between(root,end,.54);mid[0]+=side*(j%2?.014:-.017);mid[2]+=.007;
   line(skull,root,mid,.006,.005,j%2?horn:skin,4);line(skull,mid,end,.005,.0025,edge,4);
  }
  const temple=[side*.273,.082,.113],ridge=[side*.307,.131,-.045],back=[side*.209,.186,-.266];
  flesh(skull,[[temple,.024,.031],[ridge,.046,.035],[back,.014,.017]],5,hide);
  const fold=[side*.171,-.078,.118],ear=[side*.220,-.075,.036],lower=[side*.114,-.194,.106];
  skull.tri(fold,ear,lower,shadow);
  const cheek=[side*.190,-.056,.122],gill=offset(cheek,side*.019,-.047,-.023);
  flesh(skull,[[offset(cheek,-side*.046,.065,.013),.034,.031],[cheek,.046,.035],
    [gill,.036,.028],[offset(gill,-side*.044,-.085,.021),.018,.020]],6,hide);
  for(let j=0;j<3;j++){
    const a=offset(cheek,-side*(.061+.004*j),.024-.023*j,.081-.008*j),
     b=offset(cheek,side*.018,.033-.024*j,.009);
    line(skull,a,b,.0065,.0045,j%2?skin:shadow,4);
  }
 }
 // The lower face opens on two pivot points. One jaw keeps its cutter folded against the other.
 const gape=.037+.012*(1+r.suspension)+.082*threat+.039*q.coil+.014*(q.breath+1)+.018*a.wave(.31)
  +a.scream*(.31+.026*a.wave(1.31))+.070*a.tether+.075*a.arc+.16*a.plunge+(a.sky?.045*a.fan:0);
 const maw=[[0,-.096,.231],[-.055,-.105,.218],[-.081,-.163,.185],[-.047,-.247-.45*gape,.162],
  [.012,-.274-.62*gape,.162],[.061,-.214-.32*gape,.177],[.053,-.125,.211]];
 const deep=[.006,-.174,.136];
 const pouch=[.018,-.188,.095],jawFront=[.017,-.215-gape*.31,.149+.055*a.scream];
 flesh(skull,[[[.013,-.082,.138],.071,.054],[pouch,.064,.049],[jawFront,.045,.030],
  [offset(jawFront,.010,-.032,.010),.024,.014]],6,inner);
 for(let i=0;i<maw.length;i++)skull.tri(maw[i],maw[(i+1)%maw.length],deep,i%3===2?throat:ink);
 for(const side of [-1,1]){
  const tremor=.012*a.wave(side*2.3),condyle=[side*.206,-.029,.080],elbow=[side*(.164+gape*.52+tremor),-.136,.122];
  const bend=[side*(.133+gape*.55+tremor),-.212-gape*.19,.171],tip=[side*(.019+gape*.60+tremor),-.249-gape*.53,.213+.031*a.scream];
  flesh(skull,[[condyle,.054,.044],[elbow,.048,.038],[bend,.037,.027],[tip,.017,.019]],6,hide,side<0?2:0);
  const hinge=offset(elbow,-side*.013,-.011,-.048),hanging=offset(bend,side*.020,-.084,-.048);
  skull.tri(elbow,hinge,hanging,marrow);skull.tri(elbow,hanging,bend,shadow);
  for(let j=0;j<3;j++){
   const root=between(bend,tip,(j+.4)/3.5),point=offset(root,-side*.027,.043+.011*j,.007+.013*threat);
   skull.tri(offset(root,-side*.013,-.005,0),point,offset(root,side*.011,.007,-.010),j%2?edge:oyster);
  }
 }
 const nose=[.014,-.041,.243];
 for(const s of [-1,1]){
  const lip=offset(nose,s*.034,-.041,-.002),slit=offset(nose,s*.010,-.065,.009);
  skull.tri(offset(nose,s*.002,0,0),lip,slit,shadow);
  line(skull,lip,slit,.006,.004,marrow,4);
 }
 if(q.hits&1)hitWounds(skull,[-.079,.267,.192],.102,.102);
}

function neck(m,r,q){
 const p=r.nape,mid=r.joint,crown=offset(r.face,-.029,.010,-.204);
 if(q.mask&1){woundSocket(m,p,.130);return;}
 flesh(m,[[p,.179,.155],[between(p,mid,.52),.160,.151],[mid,.159,.138],[between(mid,crown,.67),.137,.116],
  [crown,.156,.107]],8,dorsal);
 for(const s of [-1,1]){
  const swell=r.action.wave(2.12*s),bellow=r.action.scream;
  const a=offset(r.chest,s*.223,.104,.064),b=offset(mid,s*((s<0?.096:.069)+.019*swell+.043*bellow),-.053,.107+.039*swell+.102*bellow),c=offset(r.face,s*.105,-.076,.023);
  flesh(m,[[a,.064,.047],[between(a,b,.51),.063+.014*swell+.033*bellow,.039+.022*bellow],[b,.045+.012*swell+.039*bellow,.046+.022*bellow],[c,.026,.033]],5,s<0?hide:cords);
 }
 for(let i=0;i<4;i++){
  const t=.13+.153*i,a=between(mid,crown,t),ridge=offset(a,-.082,-.013,-.102);
  const tip=offset(ridge,.036,.065+.012*i,-.046);
  m.tri(offset(a,-.046,.008,-.067),tip,offset(a,.057,.014,-.089),horn);
 }
 head(m,r,q);
}

function talon(m,root,mid,bend,tip,bulk,back=false){
 flesh(m,[[root,.042*bulk,.039*bulk],[mid,.046*bulk,.033*bulk],[bend,.026*bulk,.023*bulk]],5,back?cords:hide);
 const ridge=between(bend,tip,.61);ridge[1]+=.018*bulk;
 flesh(m,[[bend,.029*bulk,.028*bulk],[ridge,.017*bulk,.019*bulk],[tip,.003,.004]],5,nail,1);
}

function rearLeg(m,s,r,q){
 const step=footfall(r.legT,s<0?.57:.06,r.d?.58:.64),travel=r.travel;
 const stride=step.z*travel,lift=step.lift*travel,curl=q.coil,h=r.h,d=r.d;
 const hip=offset(r.hips,s*(s<0?.233:.202),.012,0);
 const knee=[s*(.346+.062*h+.095*d+.110*q.fall)-.047*r.stride,
  .755-.157*h-.059*d-.087*curl+.153*lift,.133+.091*h+.187*stride+.126*d*stride+.07*q.strike];
 const heel=[s*(.372+.075*h+.093*q.fall),.326+.119*lift+.075*d*lift,
  -.264-.112*h-.142*d+.204*stride];
 const foot=[s*(.40+.061*h+.161*q.fall+.083*r.action.flee),.101+.138*lift+.112*d*lift,-.077+.328*stride+.186*d*stride-.113*r.action.flee];
 if(r.action.vault){
  const fold=r.action.fold;knee[1]+=.39*fold;knee[2]+=.40*fold;
  heel[1]+=.65*fold;heel[2]-=.39*fold;foot[1]+=.49*fold;foot[2]-=.66*fold;
 }
 foot[0]-=.068*r.action.swing;knee[2]+=.095*r.action.set*(s<0?1:-1);
 if(r.low)lowHind(q,r,s,knee,heel,foot);
 const haunch=between(hip,knee,.36);haunch[0]+=s*.065;haunch[2]-=.030;
 const tendon=between(knee,heel,.37);tendon[0]+=s*.043;tendon[2]-=.060;
 const rail=between(heel,foot,.45);rail[0]-=s*.018;
 const kneeHood=between(haunch,knee,.80);kneeHood[2]+=.024;
 // The same skin crosses both reverse joints. The hock turns under it rather than ending at a flat cap.
 flesh(m,[[offset(hip,0,.099,-.055),.146,.145],[hip,.193,.183],[haunch,.202,.167],
  [kneeHood,.124,.117],[knee,.107,.102],[tendon,.122,.107],
  [between(tendon,heel,.69),.074,.077],[heel,.066,.064],[rail,.056,.052],[foot,.070,.075]],8,hide,s>0?1:0);
 const cap=offset(knee,s*.028,.029,.048),cap2=offset(cap,-s*.016,-.083,-.027);
 flesh(m,[[offset(cap,-s*.013,.076,-.023),.051,.034],[cap,.074,.051],[cap2,.047,.037],
  [offset(cap2,-s*.014,-.044,-.019),.018,.019]],6,dorsal);
 const stripe=between(hip,haunch,.58);stripe[0]+=s*.121;stripe[2]+=.073;
 const root=offset(hip,s*.091,.052,.084),lower=offset(kneeHood,s*.069,.039,.064);
 line(m,root,stripe,.027,.035,skin,5);line(m,stripe,lower,.035,.015,horn,5);
 const ligament=offset(knee,-s*.052,.018,-.033),ankle=offset(heel,-s*.032,.016,-.014);
 line(m,ligament,ankle,.019,.013,edge,5);
 const dew=offset(heel,s*.016,.066,-.098);
 flesh(m,[[heel,.034,.033],[dew,.030,.028],[offset(dew,s*.022,-.064,-.06),.004,.006]],5,nail);
 for(let j=0;j<3;j++){
  const k=j-1,finger=offset(foot,k*.036,-.008,.027),
   mid=offset(finger,k*.054,-.047+.039*lift,.081+.017*(j===1)),
   bend=offset(mid,k*.033,-.007,.086+.029*(j===1)),tip=offset(bend,k*.028,-.031+.023*lift,.073+.012*(j===1));
  talon(m,finger,mid,bend,tip,.68+(j===1?.10:0));
 }
}

// Scapular spars unroll a pleated flank in flight. The outermost ragged
// sections hang free, so light passes through and the edge flutters on approach.
function flightSkin(m,r,side,shoulder,wrist){
 const a=r.action,open=a.fan;
 if(open<.055)return;
 const socket=offset(shoulder,-side*.06,.06,-.13);
 const base=offset(r.hips,side*.26,.095,-.22);
 const tips=[],knuckles=[];
 for(let i=0;i<3;i++){
  const ph=a.wave(i*.81+side*1.38),left=side<0?1:.90;
  const near=between(socket,base,.19+i*.22);
  const knuckle=offset(near,side*(.14+open*(1.11-i*.18))*left,.18+open*(.41+.24*a.stroke)-i*.06,-open*(.04+i*.20));
  const tip=offset(knuckle,side*(.13+open*(1.18-i*.15))*left,open*(-.40+.19*a.stroke+.11*ph),-open*(.40+i*.23)-.11);
  const hinge=between(near,knuckle,.61);hinge[1]+=.14*open;
  flesh(m,[[near,.062,.049],[hinge,.053,.041],[knuckle,.045,.030],[tip,.006,.008]],5,ligament,i);
  tips.push(tip);knuckles.push(knuckle);
 }
 const shoulderFlap=between(socket,wrist,.72);shoulderFlap[2]-=.04;
 const ribs=[shoulderFlap,...knuckles,base],rim=[wrist,...tips,base];
 for(let i=0;i+1<ribs.length;i++){
  const front=ribs[i],back=ribs[i+1],tip=rim[i],next=rim[i+1];
  const join=between(tip,next,.52);
  const split=between(join,between(front,back,.47),.25+.14*(i%2));
  split[1]+=(.046+.035*a.wave(i+side))*open;
  const underside=i%2?inner[0]:shadow,upper=i%2?dorsal[3]:cords[1];
  const sheet=(p,b,c)=>{
   if(side<0)[b,c]=[c,b];
   m.tri(p,b,c,upper);
   m.tri(offset(c,0,-.018,0),offset(b,0,-.018,0),offset(p,0,-.018,0),underside);
  };
  sheet(front,tip,split);sheet(front,split,back);if(i<3)sheet(back,split,next);
  if(i===1||i===3){
   const loose=offset(split,side*.031,-(.14+.025*a.wave(i))*open,-.12*open);
   line(m,split,loose,.012,.003,marrow,4);
  }
 }
}

function forelimb(m,s,r,q){
 const a=r.action,left=s<0,d=r.d,h=r.h,carry=q.grip,tear=q.tear,splitting=q.pose==='split';
 const step=footfall(r.legT,left?.09:.62,.57),reach=step.z*r.travel,lift=step.lift*r.travel;
 const shoulder=offset(r.chest,s*(left?.457:.418),left?.205:-.015,left?-.092:.028);
 shoulder[2]+=s*.19*a.set-s*.13*a.arc+.10*a.reach;shoulder[1]+=(left?.16:-.06)*a.set+.07*a.scream;
 mantle(m,shoulder,s,left,q,a);
 const collar=offset(r.chest,s*.081,.216,-.157),cover=between(collar,shoulder,.48);
 cover[1]+=(left?.115:.055);
 flesh(m,[[collar,.130,.128],[cover,.184,.188],[shoulder,left?.193:.159,left?.170:.133]],7,dorsal);
 if(q.mask&(left?2:4)){woundSocket(m,shoulder,left?.153:.127,[s,-.3,.14]);return;}

 const elbow=offset(shoulder,s*(left?.406:.338)+s*(.073*q.coil+.056*q.sting),-.595+.100*h+.166*d+.088*q.coil+
  (left?-.048:.164)*h+.071*r.settle*h,
  -.158-.089*h-.157*reach+.136*q.strike);
 const paw=[s*(left?.822:.715)+.033*r.stride+s*(.09*q.coil+.17*q.fall),
  (left?.541:.702)+.227*lift-.091*h+.176*q.strike,(left?.218:.125)+.181*h-.223*reach+.178*q.strike];
 if(h){
  // The long side bears weight while the smaller hand tests the air, a little after the head turns.
  paw[1]+=left?-.047*h:(.235+.29*r.settle)*h;
  paw[0]+=s*(left?.012:(.075-.133*r.settle))*h;
  paw[2]+=(left?.083:(.151+.187*r.settle))*h;
 }
 if(d){
  const cycle=footfall(r.legT,left?.11:.63,.60);
  paw[0]=s*(left?.802:.735)+.021*r.stride;paw[1]=.297+.456*cycle.lift;
  paw[2]=.21+.804*cycle.z;
  elbow[0]+=s*.082;elbow[1]+=.069*cycle.lift;elbow[2]+=.267*cycle.z;
 }else if(q.pose==='attack'||q.pose==='grab'){
  const strike=q.strike,goal=left?1:.70;
  paw[0]+=s*(.079*strike-.395*carry);paw[1]+=goal*(1.47*strike+.69*carry);
  paw[2]+=goal*(.64*strike+.29*carry);elbow[1]+=.186*strike+.12*carry;
  elbow[2]+=.20*strike+.105*carry;
 }
 if(splitting){
  const lift=Math.sin(Math.PI*q.t),spread=.203+1.026*tear;
  paw[0]=s*spread+(left?-.035:.048);paw[1]=2.11+.348*lift-.16*tear+(left?.103:-.05);
  paw[2]=1.03+.09*lift-.182*tear;
  elbow[0]+=s*.323*tear;elbow[1]+=.266*lift;elbow[2]+=.28-.112*tear;
 }

 if(!r.low||r.low<.999)poseGreyArm(s,a,elbow,paw);
 if(r.low)lowFore(q,r,s,shoulder,elbow,paw);
 const wrist=offset(paw,s*(.124-.053*carry-.067*a.tether),.245+.082*(1-d)-.081*carry-.18*a.scream,
  -.128+.040*d-.11*a.reach);
 if(a.vault)flightSkin(m,r,s,shoulder,wrist);
 const deltoid=between(shoulder,elbow,.34),bicep=between(shoulder,elbow,.63);
 const flex=a.wave(s*.93);deltoid[0]+=s*(.031+.024*flex);bicep[2]+=.048+.029*a.wave(s*.93+1.2);
 const bulk=(left?1.22:.96)*(1+.034*flex+((left?.062:0)*a.set+.034*a.haul));
 flesh(m,[[offset(shoulder,-s*.048,.041,-.019),.151*bulk,.143*bulk],[deltoid,.180*bulk,.145*bulk],
  [bicep,.138*bulk,.132*bulk],[elbow,.080*bulk,.074*bulk]],8,hide,left?2:0);
 if(q.hits&(left?2:4))hitWounds(m,offset(deltoid,s*.036,-.041,.099),.118,.125);

 const swell=between(elbow,wrist,.27),innerJoint=between(elbow,wrist,.56),outerJoint=between(elbow,wrist,.61);
 innerJoint[0]-=s*(left?.112:.090);innerJoint[2]+=.047;
 outerJoint[0]+=s*(left?.110:.087);outerJoint[2]-=.053;
 flesh(m,[[elbow,.088*bulk,.087*bulk],[offset(swell,-s*.052,.014,.043),.085*bulk,.083*bulk],
   [innerJoint,.049*bulk,.062*bulk],[offset(wrist,-s*.014,0,.018),.038*bulk,.045*bulk]],7,cords);
 flesh(m,[[offset(elbow,s*.042,-.013,-.054),.075*bulk,.066*bulk],[offset(swell,s*.078,-.018,-.065),.071*bulk,.055],
  [outerJoint,.046*bulk,.044],[wrist,.052,.046]],6,ligament,left?0:1);
 const spur=offset(elbow,s*(left?.101:.067),.045,-.096),end=offset(spur,s*.054,.077,-.072);
 flesh(m,[[elbow,.074,.066],[spur,.065,.045],[end,.013,.014]],5,dorsal);
 // A long tendon crosses the outer edge of the forearm without closing its fork.
 line(m,offset(swell,s*.099,-.032,-.076),offset(outerJoint,s*.021,-.008,-.037),.014,.012,edge,4);

 flesh(m,[[wrist,.072,.066],[between(wrist,paw,.58),.082,.068],[paw,.103*bulk,.094]],7,hide);
 const palm=insetMesh(m,paw,-s*(.19+.12*h+.49*carry+.62*a.tether)+.85*a.swing*left,
  -.07+.37*carry-.13*tear-.95*a.reach-.48*a.arc+.34*a.scream,s*(.17+.96*a.scream)+.07*q.breath+.055*a.wave(s+1.71));
 const fold=carry*.61+(q.pose==='attack'?q.strike*.49:0)+(splitting?.69-.43*tear:0)+.78*a.haul+.34*a.set;
 const opened=q.strike*(1-carry)+.73*a.tether+.66*a.arc+.95*a.scream;
 for(let j=0;j<3;j++){
  const k=j-1,far=j===1?1.12:j===0&&left?1.10:.88;
  const root=[k*.043,-.011,.024];
  const twitch=.017*a.wave(1.35*j+s*1.4),mid=offset(root,k*(.068+.033*opened+twitch),-.099*far+.060*fold,.066+.07*fold);
  const bend=offset(mid,k*(.035+.018*opened),-.086*far+.064*fold+twitch,.056+.073*opened);
  const tip=offset(bend,k*.018-s*.017,-.066*far+.11*fold,.044+.060*opened-.063*fold);
  talon(palm,root,mid,bend,tip,(left?1.08:.87)*(j===1?1.16:1));
 }
 for(let j=0;j<2;j++){
  const a=[-.043,.012-j*.025,.069],b=[.056,.008-j*.025,.084];
  line(palm,a,b,.009,.007,j?horn:edge,4);
 }
 const thumb=[s*.070,.027,-.011],mid=offset(thumb,s*.071,-.058,.026),bend=offset(mid,-s*.008,-.067,.082);
 talon(palm,thumb,mid,bend,offset(bend,-s*.069,.004+.051*fold,.056),left?.85:.69,true);
}

// Distinct overlapping folds form the shoulder girdle rather than painted bands on a cylinder.
function costalDetail(m,r,q){
 const {chest,waist,face}=r;
 for(const side of [-1,1]){
  for(let j=0;j<5;j++){
   const u=j/4,stir=r.action.wave(u*2+side)*.005,a=offset(chest,side*(.19+.115*u),.17-.075*j,-.186);
   const b=offset(a,side*(.13+.07*(1-u)),.051,.12+stir);
   const c=offset(a,side*(.18+.18*(1-u)),-.049,.22+stir);
   const d=offset(a,side*(.24+.022*u),-.104,.31);
   flesh(m,[[a,.017,.039],[b,.026,.030],[c,.015,.021],[d,.005,.013]],6,ligament,j);
   const tooth=offset(c,side*.006,-.076,.024);
   m.tri(c,tooth,offset(d,0,-.011,-.02),dorsal[j%4]);
  }
  for(let i=0;i<4;i++){
   const u=i/3,n=r.action.wave(.73*i+side),bone=offset(waist,side*.145,.04+i*.074,-.13);
   const curve=offset(bone,side*(.052+.019*u),.087,-.029+n*.009),notch=offset(curve,-side*.016,.046,.028);
   flesh(m,[[bone,.023,.031],[curve,.021,.020],[notch,.004,.010]],6,pale,i);
  }
  for(let j=0;j<3;j++){
   const tear=offset(face,side*(.141+j*.019),-.067+.031*j,.158-.024*j),fin=offset(tear,side*.023,-.026,.041);
   line(m,tear,fin,.006,.0025,oyster,6);
  }
 }
}
export function grey(m,q){
 const r=rig(q);m.greyClose=q.photo;
 if(q.photo)costalDetail(m,r,q);
 trunk(m,r,q);
 for(const side of [-1,1])rearLeg(m,side,r,q);
 for(const side of [-1,1])forelimb(m,side,r,q);
 neck(m,r,q);
}
