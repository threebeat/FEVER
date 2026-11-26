// Body envelopes, reach and foot contact are authored in actor-local metres. +Z faces the player.
import {golemBuilds,graftMarks,triCount,tagMember} from './golem-parts.js';
import {offset,line,box,quad,shell,guard,footfall,insetMesh} from './actor-geometry.js';
import {tissue,woundSocket,tornChest,hitWounds,spineParasite} from './actor-anatomy.js';

const tau=Math.PI*2, PI=Math.PI;
const iron=[.246,.267,.257],edge=[.64,.58,.47],soot=[.128,.137,.125],black=[.061,.054,.051];
const sand=[.43,.405,.305],olive=[.32,.34,.244],web=[.271,.258,.194],flax=[.63,.54,.368];
const bruised=[.423,.306,.271],skin=[.538,.442,.365],chalk=[.69,.64,.51];
const rosary=[.44,.34,.20],smock=[.259,.192,.202],hoodDark=[.151,.133,.153],hem=[.355,.255,.244];
const wool=[.28,.265,.225],shawl=[.333,.301,.251],kerchief=[.466,.392,.29];
const linen=[.56,.511,.401],braid=[.448,.424,.361];

const builds={
 infected:{hip:.90,spine:.47,waist:.172,chest:.247,deep:.158,leg:.107,reach:.53,foot:.16,lean:.14},
 golem:{hip:.98,spine:.57,waist:.27,chest:.425,deep:.249,leg:.151,reach:.69,foot:.22,lean:.18},
 cultist:{hip:.93,spine:.48,waist:.19,chest:.228,deep:.158,leg:.103,reach:.54,foot:.17,lean:.045},
 witch:{hip:.81,spine:.40,waist:.189,chest:.209,deep:.161,leg:.088,reach:.55,foot:.16,lean:.22}
};
const golemForms=golemBuilds(builds.golem);
function rig(kind,q){
 const b=kind==='golem'?golemForms[q.variant%6]:builds[kind],t=q.t*tau,g=q.move,s=q.strike,coil=q.coil;
 const gait=kind==='golem'?Math.sin(t+.32)*.64+Math.sin(t*2-.39)*.22:kind==='witch'?Math.sin(t-.64)*.72+Math.cos(2*t)*.17:Math.sin(t);
 const heavy=kind==='golem',host=kind==='infected',old=kind==='witch';
 const lag=Math.sin(t-.78)*g,sway=gait*g,uneven=heavy?.083:host?.054:.027;
 const seize=heavy?(.64*Math.sin(3*t-.41)**3+.36*Math.sin(5*t+.76)**5)*(1-q.fall):0;
 const spasm=seize*(.51+.49*g)*(1-.40*q.grip);
 const crawling=old&&q.pose==='wallCrawl',crouch=host?q.crouch:crawling?.91:0,leap=host?q.jump:0;
 const missing=heavy?(q.mask&16?1:0)+(q.mask&32?1:0):0;
 const ride=missing===2?.31+.063*Math.cos(t*2):missing===1?b.hip-.12-.08*Math.cos(t):b.hip;
 const pelvis=[uneven*sway-.047*q.sting+.056*spasm,ride+.024*Math.cos(t*2-.32)*g-.078*coil-.065*q.sting-.107*q.fall-.35*crouch+.04*leap,
  -.047+.024*lag-.14*crouch+.12*spasm];
 const chest=offset(pelvis,.040*lag+.10*q.sting+.084*q.wake+(heavy?-.054+.145*spasm:0),
  b.spine-.072*coil+.040*s-.018*sway-.16*crouch-.055*Math.abs(spasm)+.037*leap-.12*q.gatherBlink,
  b.lean+.067*g+.174*s-.082*coil+.093*q.wake+.204*crouch+.206*leap+.113*spasm+.217*q.ambush+.14*q.gatherBlink);
 const neck=offset(chest,old?.044:.009+.038*spasm,b.chest*.65-.011*q.fall-.081*crouch,b.deep*.10+.045*coil+.075*crouch);
 const head=offset(neck,.026*Math.sin(t+.38)+(heavy?-.041-.092*spasm:0),
  (heavy?.159:old?.112:.141)-.053*crouch+.035*q.cast,(old?.13:.056)+.079*coil+.029*g+.090*crouch);
 if(old&&q.pose==='watchHouse'){
  head[0]+=.093*Math.sin(5*t+.16)+.032*Math.sin(9*t);head[1]+=.019*Math.cos(5*t);head[2]+=.046*Math.sin(4*t-.39);
 }else if(crawling){head[0]+=.046*Math.sin(t*2);head[2]+=.16;}
 return {b,t,g,s,coil,sway,lag,pelvis,chest,neck,head,spasm,crouch,leap};

}

function shins(m,kind,q,r){
 const {b,t,pelvis,sway,coil}=r,heavy=kind==='golem',old=kind==='witch',robed=kind==='cultist'||old;
 const above=heavy?tissue.torn:kind==='infected'?olive:kind==='cultist'?hoodDark:wool;
 for(const side of [-1,1]){
  const step=footfall(q.t,side<0?.05:.56,heavy&&side>0?.72:old?.66:.55);
  const lag=side<0&&kind==='infected'?.56:side>0&&heavy?.68:1;
  const lift=q.move*step.lift*lag,advance=q.move*step.z*lag;
  const hip=offset(pelvis,side*b.waist*.67,-.023,0);
  if(heavy&&(q.mask&(side<0?16:32))){woundSocket(m,hip,.095,[side*.18,-1,0]);continue;}
  const start=heavy?triCount(m):0;
  const knee=[side*(b.foot*.84+.057*q.fall)+.042*sway,pelvis[1]*.53+.100*lift-.024*coil,.080+.160*advance+.064*coil+.078*q.fall];
  const ankle=[side*(b.foot+.16*q.fall),.076+.15*lift+(heavy?.017:0),-.035+.295*advance+.055*q.fall];
  const twist=heavy?.066*r.spasm*side:0;
  knee[0]+=side*.086*r.crouch+twist;knee[1]+=.13*r.leap;knee[2]+=.229*r.crouch+(.18+.065*side)*r.leap+twist;
  ankle[0]+=side*.055*r.crouch;ankle[1]+=(.13+.052*side)*r.leap;ankle[2]+=side*.096*r.crouch-(.16+.085*side)*r.leap;
  line(m,hip,knee,b.leg,b.leg*.68,above,6);
  line(m,knee,ankle,b.leg*.74,b.leg*.56,old?skin:above,5);
  if(heavy){
   shell(m,knee,[[-.098,.104,.107],[.002,.127,.113],[.066,.109,.079]],side<0?tissue.muscle:tissue.torn,6);
   for(let j=0;j<3;j++)line(m,offset(knee,side*.075,-.043*j,.045),offset(knee,side*.089,-.043*j-.02,.078),.009,.009,soot,4);
   line(m,offset(knee,-side*.043,.027,-.085),offset(ankle,-side*.022,.018,-.048),.04,.023,tissue.clot,5);
  }
  const foot=offset(ankle,0,-.013,.025);
  shell(m,foot,[[-.054,b.leg*.83,.13,0,.034],[-.013,b.leg*.95,.154,0,.047],[.064,b.leg*.60,.074,0,-.033]],heavy?tissue.torn:robed?soot:web,6);
  if(heavy){for(let k=-1;k<=1;k++)line(m,offset(foot,k*.031,-.012,.137),offset(foot,k*.048,-.037,.201),.021,.006,tissue.fat,4);}
  else if(!robed){
   box(m,offset(knee,0,.012,.073),.120,.129,.043,web);
   line(m,offset(ankle,-.042,.013,.054),offset(ankle,.039,.042,.046),.010,.009,sand,4);
  }
  if(heavy)tagMember(m,side<0?'leftLeg':'rightLeg',start);
 }
}

function skirt(m,q,r,color,skirtHem,patch=false){
 const {pelvis,b,t,sway,lag}=r,top=[],middle=[],hemline=[],breaks=[],fine=m.fineSkin,n=fine?24:10;
 for(let i=0;i<n;i++){
  const a=i/n*tau,fold=1+.08*Math.cos(a*5)+(fine?.063*Math.sin(a*7+.4+lag*.46):0);
  top.push(offset(pelvis,Math.sin(a)*b.waist,.071,Math.cos(a)*b.deep*.74));
  middle.push(offset(pelvis,Math.sin(a)*b.waist*1.29*(fine?.61+.39*fold:1)-.019*sway,-.33,Math.cos(a)*b.deep*1.34+.035*lag));
  hemline.push([pelvis[0]+Math.sin(a)*b.waist*(1.53+.14*q.sway)*fold-.045*lag,
   .134+(fine?.036*(1+Math.sin(a*3+.45))+.031*Math.max(0,Math.sin(a*9)):.056*(i%3))+.11*q.move*Math.max(0,Math.sin(t-a))+.072*q.fall,
   pelvis[2]+Math.cos(a)*(b.deep*1.79*fold+.107*lag)+.078*Math.sin(t-a)*q.move]);
  if(fine){
   const panel=middle[i].map((v,k)=>v*.41+hemline[i][k]*.59);
   breaks.push(offset(panel,.013*Math.sin(5*a+t*.30),-.009*q.move,.019*Math.cos(6*a-.9)));
  }
 }
 for(let i=0;i<n;i++){
  const j=(i+1)%n,tone=i%3===0?skirtHem:color;
  quad(m,top[i],middle[i],middle[j],top[j],tone);
  if(fine){
   quad(m,middle[i],breaks[i],breaks[j],middle[j],tone,8);
   quad(m,breaks[i],hemline[i],hemline[j],breaks[j],tone,8);
   const inner=(pt)=>offset(pt,(pelvis[0]-pt[0])*.052,.020,(pelvis[2]-pt[2])*.052);
   quad(m,hemline[i],inner(hemline[i]),inner(hemline[j]),hemline[j],skirtHem,8);
  }else quad(m,middle[i],hemline[i],hemline[j],middle[j],i%4===2?skirtHem:tone);
  if(patch&&i%3===0){
   const p=middle[i],q=middle[j],a=hemline[i],b=hemline[j];
   m.tri(offset(p,0,-.036,.008),offset(a,.010,.043,.014),offset(b,-.017,.074,.013),[.414,.333,.254]);
  }
 }
}

function stitches(m,a,b,radius,count){
 const dist=b.map((v,i)=>v-a[i]);
 for(let j=0;j<count;j++){
  const u=(j+.4)/count,p=offset(a,...dist.map(v=>v*u));
  line(m,offset(p,-radius*.52,-radius*.66,0),offset(p,radius*.62,radius*.57,.004),radius*.18,radius*.18,soot,4);
 }
}

function forearm(m,kind,side,root,elbow,hand,q){
 const bulk=kind==='golem'?(side<0?.164:.110):kind==='witch'?.057:.079;
 const sleeve=kind==='golem'?(side<0?tissue.torn:tissue.muscle):kind==='cultist'?smock:kind==='witch'?shawl:olive;
 const wrist=offset(hand,0,.038,-.010);
 if(q.hits&(side<0?2:4)){
  const halfway=root.map((x,i)=>x+(elbow[i]-x)*.39);
  hitWounds(m,offset(halfway,0,0,bulk*1.03),bulk,.12);
 }
 line(m,root,elbow,bulk*1.20,bulk*.78,sleeve,6);
 if(kind==='cultist'||kind==='witch'){
  line(m,elbow,wrist,bulk*.90,bulk*(kind==='cultist'?1.5:1.1),sleeve,6);
  line(m,wrist,offset(wrist,0,-.025,.012),bulk*1.4,bulk*1.36,kind==='cultist'?hem:kerchief,6);
 }else{
  line(m,elbow,wrist,bulk*.82,bulk*.48,kind==='golem'?sleeve:skin,6);
  if(kind==='infected'){
   line(m,root,offset(elbow,0,.071,-.016),bulk*1.28,bulk*.97,olive,6);
   spineParasite(m,offset(hand,side*.04,.015,0),.22,.026,q.t*tau+.7*side);
  }else{
   const seamA=offset(root,side*bulk*.68,-.081,.079),seamB=offset(elbow,-side*.015,.042,.057);
   line(m,seamA,seamB,.011,.008,tissue.blood,4);stitches(m,seamA,seamB,.026,4);
  }
 }
 const hide=kind==='golem'?tissue.torn:kind==='cultist'?bruised:skin;
 shell(m,hand,[[-.042,bulk*.59,bulk*.52],[.015,bulk*.73,bulk*.57],[.048,bulk*.52,bulk*.45]],hide,5);
 for(let i=-1;i<=1;i++){
  const knuckle=offset(hand,i*bulk*.31,-.036,.016+i*.003);
  const ext=kind==='witch'?1.55:kind==='golem'?1.37:1;
  const sec=offset(knuckle,i*bulk*(.135+.30*q.cast),-bulk*.68*ext+.096*q.cast,.025+.044*q.strike+.023*q.cast);
  line(m,knuckle,sec,bulk*.22,bulk*.15,hide,4);line(m,sec,offset(sec,-side*.008,-bulk*.35,.036+(kind==='witch'?.022:0)),bulk*.15,.003,kind==='witch'?black:hide,4);
 }
}

function hook(m,p,side,q,variant){
 const object=insetMesh(m,p,.96*side+.28*q.strike,-.31-.82*q.coil+.51*q.strike,.19+side*(.42*q.coil-.34*q.strike));
 const metal=[.36,.376,.355],rust=[.49,.238,.158],haft=[.30,.238,.17];
 const h=variant===1?.38:.32;
 line(object,[0,-.10,-.012],[.018,h,.047],.026,.025,haft,6);
 for(let j=0;j<3;j++)line(object,[.011,.096+j*.036,.018],[.013,.111+j*.036,.023],.028,.028,iron,5);
 const a=[.018,h-.064,.04],b=[.023,h+.145,.114],c=[.021,h+.177,.268],tip=[.009,h+.025,.325];
 for(const x of [-.012,.012]){
  const A=offset(a,x,0,0),B=offset(b,x,0,0),C=offset(c,x,0,0),D=offset(tip,x,0,0);
  quad(object,A,B,C,offset(c,x,-.048,-.029),metal);
  object.tri(offset(c,x,-.048,-.029),C,D,rust);
  object.tri(A,offset(c,x,-.048,-.029),offset(a,x,.037,.069),rust);
 }
 quad(object,offset(a,-.012,0,0),offset(b,-.012,0,0),offset(b,.012,0,0),offset(a,.012,0,0),edge);
 if(variant===1){
  const l=[.017,h+.095,-.088];object.tri(a,b,l,rust);object.tri(b,l,[.019,h+.032,-.14],edge);
 }
}
function arms(m,kind,q,r){
 const {b,coil,s,lag,sway}=r;
 for(const side of [-1,1]){
  const lead=side<0?1:.58,heavy=kind==='golem',witchy=kind==='witch',cult=kind==='cultist';
  const shoulder=offset(r.chest,side*(b.chest*.88),b.chest*(side<0?.24:.11)-.035*q.sting,-.016);
  if(q.mask&(side<0?2:4)){woundSocket(m,shoulder,heavy?.10:.065,[side*.91,-.20,.14]);continue;}
  let elbow,hand;
  if(cult&&side>0){
   elbow=offset(shoulder,side*(.113+.14*coil),-.24+.30*coil+.16*s,.038+.19*s+.047*lag);
   hand=offset(elbow,.025-.16*s,-.17+.47*coil+.09*s,.087-.24*coil+.40*s);
  }else if(witchy){
   elbow=offset(shoulder,side*(.15+.14*coil+.09*q.sting),-.240+.175*coil+.29*s,-.034+.14*lag+.126*s);
   hand=offset(elbow,side*(.018+.11*coil-.115*s),-.195+.343*coil+.264*s,.162+.31*s);
  }else{
   elbow=offset(shoulder,side*(b.chest*.40+.09*coil+.09*q.sting),-b.reach*.46+.17*coil+.25*s*lead,-.065-side*.115*lag+.22*s*lead);
   hand=offset(elbow,-side*(.04-.075*q.fall),-b.reach*(heavy?.51:.40)+.13*coil+.23*s*lead,.104-side*.08*sway+.32*s*lead);
  }
  if(heavy){
   const lashing=(.65*Math.sin(3*r.t+side*.84)**3+.35*Math.sin(5*r.t-side*1.27)**3)*(1-q.fall)*(1-.67*q.grip);
   elbow[0]+=side*.18*lashing;elbow[1]+=.16*Math.abs(lashing);elbow[2]-=.20*lashing;
   hand[0]+=side*.23*lashing;hand[1]+=.25*Math.abs(lashing);hand[2]+=.30*lashing;
  }
  if(r.crouch||r.leap||q.ambush){
   const tuck=r.crouch,rush=r.leap+.41*q.ambush;
   elbow[0]+=side*(.086*tuck+.111*rush);elbow[1]+=.081*tuck+.16*rush;elbow[2]+=.105*tuck+.136*rush;
   hand[0]-=side*.14*tuck;hand[1]+=.337*tuck+(.24+.07*side)*rush;hand[2]+=.195*tuck+(.37+.10*side)*rush;
  }
  if(witchy&&q.gatherBlink){
   elbow[0]+=side*.054*q.gatherBlink;elbow[1]+=.172*q.gatherBlink;
   hand[0]-=side*.22*q.gatherBlink;hand[1]+=.36*q.gatherBlink;hand[2]+=.081*q.gatherBlink;
  }
  if(witchy&&q.cast){
   const lift=q.cast;
   elbow[0]+=side*(.18+.039*Math.sin(r.t+side))*lift;elbow[1]+=(side<0?.42:.30)*lift;
   const inv=1-lift,float=Math.sin(r.t+side*.94);
   const cupped=offset(r.chest,side*(.31+.045*float),side<0?.48+.044*float:.32+.034*float,.26+.074*float);
   hand=hand.map((x,i)=>x*inv+cupped[i]*lift);
  }
  if(q.grip){
   const hold=offset(r.chest,side*(heavy?.19:.12),.01+.04*q.breath,.43+.06*lead);
   hand=hand.map((x,i)=>x+(hold[i]-x)*q.grip);
   elbow[1]+=.24*q.grip;elbow[0]+=side*.061*q.grip;
  }
  if(q.pose==='split'){
   hand=offset(r.chest,side*(.17+.64*q.tear),.084+.15*Math.sin(Math.PI*q.t)-.05*q.tear,.50-.19*q.tear);
   elbow=offset(shoulder,side*(.095+.36*q.tear),-.12+.21*Math.sin(Math.PI*q.t),.15+.12*q.tear);
  }
  if(witchy&&q.variant){
   const spreading=q.variant===2?.12:.05;
   elbow[0]+=side*spreading*coil;hand[1]+=(side<0?1:-1)*.13*coil;
   hand[0]-=side*.12*coil;hand[2]+=side*.10*s;
  }
  const start=heavy?triCount(m):0;
  forearm(m,kind,side,shoulder,elbow,hand,q);
  if(heavy)tagMember(m,side<0?'leftArm':'rightArm',start);
  if(cult&&side>0)hook(m,hand,side,q,q.variant);
  if(witchy&&(q.pose==='tell'||q.pose==='attack'||q.pose==='throw'||q.pose==='grab'||q.cast>0)){
    // Her hand spells the same three cuts that briefly appear in flaking ash beneath it.
    const cast=Math.max(q.coil*.86,q.strike,q.cast);
    if(cast>.075){
      const ash=[.59,.324,.159],ember=[.49,.19,.114],phase=q.t*tau;
      for(let j=0;j<3+(q.variant===2?2:0);j++){
        const a=j*tau/(q.variant===2?5:3)+phase+side*.42,rad=(.065+.09*cast)*(1+j*.05);
        const x=offset(hand,rad*Math.cos(a),-.063+j*.054,rad*Math.sin(a)+.032);
        const y=offset(x,side*.04*cast,.055*cast,.023*cast),z=offset(y,-side*.057*cast,.039*cast,.013*cast);
        line(m,x,y,.009*cast,.007*cast,ash,4,12);line(m,y,z,.007*cast,.002*cast,ember,4);
      }
    }
  }
 }
}

function deadFace(m,p,q,kind,scale=1){
 const r=scale,vel=q.t*tau,invasive=kind==='infected',old=kind==='witch';
 const head=insetMesh(m,p,.15*Math.sin(vel+.48)+.28*q.sting+(invasive?.13:0),
  .12+q.coil*.25-.28*q.strike+(old?.13:0),-.14-.16*q.sting-.26*q.wake-(invasive?.24+.085*Math.sin(vel-.43):0)
  +(kind==='golem'?.36*Math.sin(3*vel-.43)**3*(1-q.fall):0)+.23*q.crouch);
 const x=(a,b,c)=>[a*r,b*r,c*r],pal=kind==='golem'?tissue.torn:kind==='witch'?[.585,.500,.386]:skin;
 shell(head,[0,0,0],[[-.089*r,.073*r,.083*r,0,.027*r],[-.02*r,.105*r,.121*r],[.071*r,.119*r,.12*r],[.128*r,.091*r,.093*r]],pal,7);
 for(const s of [-1,1]){
  const socket=x(s*.056,.053,.107);
  line(head,offset(socket,-s*.021*r,.010*r,.004),offset(socket,s*.034*r,-.007*r,-.011*r),.017*r,.013*r,kind==='golem'?tissue.clot:soot,5);
  if(kind==='witch'||s<0)line(head,offset(socket,-s*.008*r,0,.014*r),offset(socket,s*.009*r,-.006*r,.012*r),.006*r,.005*r,chalk,4);
 }
 head.tri(x(-.026,.063,.113),x(.026,.06,.112),x(.013,-.008,kind==='witch'?.192:.153),pal);
 if(q.hits&1)hitWounds(head,x(-.034,.017,.120),.066*r,.068*r);
 const opened=.022+.048*q.coil+.060*q.strike;
 const l=x(-.057,-.041,.111),rgt=x(.058,-.038,.113),low=x(.023,-.047-opened,.105);
 head.tri(l,rgt,low,tissue.deep);line(head,l,low,.011*r,.012*r,bruised,4);line(head,low,rgt,.012*r,.008*r,pal,4);
 if(invasive){
  const a=x(-.113,.01,.015),b=x(-.111,-.07,.079),c=x(-.084,-.122-.034*q.strike,.135),d=x(.023,-.072,.118);
  head.tri(a,b,c,tissue.clot);head.tri(b,d,c,tissue.muscle);line(head,b,c,.018,.012,tissue.fat,4);
  const arc=offset(c,-.041,-.062,.027);line(head,c,arc,.027,.015,tissue.blood,5);
  line(head,arc,offset(arc,.023,-.061,.031),.015,.005,tissue.muscle,4);
 }
 if(kind==='witch'){
  const bridge=x(.006,.062,.119),end=x(.010,-.018,.178),hook=x(.020,-.040,.15);
  line(head,bridge,end,.031,.024,pal,5);line(head,end,hook,.024,.01,bruised,5);
  for(const s of [-1,1]){
   const temple=x(s*.106,.066,.056),brow=x(s*.048,.078,.114),cheek=x(s*.077,-.014,.102);
   line(head,temple,brow,.021,.011,pal,5);
   line(head,cheek,x(s*.043,-.052,.095),.01,.006,bruised,4);
  }
 }
 if(kind!=='witch')for(const s of [-1,1])line(head,x(s*.031,-.043,.119),x(s*.026,-.057,.122),.008*r,.004*r,tissue.ivory,4);
 return head;
}

function kettleKeys(m,p,q){
 for(const side of [-1,1]){
  const top=offset(p,side*.039,0,0),k=offset(top,side*(.035+.105*q.cast)+.018*q.breath,
   -.163-.033*(side+1)+.34*q.cast,.033+.033*q.swing+.079*q.cast);
  line(m,top,k,.006,.005,rosary,4);
  guard(m,k,.021,.026,.006,.006,side<0?iron:edge,6);
  const bit=offset(k,.008,-.096,0);
  line(m,offset(k,0,-.025,0),bit,.008,.007,edge,4);
  box(m,offset(bit,.010,.015,.001),.027,.011,.013,iron);
 }
}

function wearer(m,kind,q){
 const r=rig(kind,q),{b,pelvis,chest,head,neck}=r,monster=kind==='infected'||kind==='golem',patched=kind==='witch';
 if(patched&&q.blink>.001){
  const world=m,bend=q.blink,direction=q.variant===1?-1:1;
  const fold=([x,y,z])=>[x*(1-.88*bend)+direction*bend*(.09+.26*y*y),y*(1-.46*bend),z*(1-.63*bend)];
  for(let i=0;i<7;i++){
   const u=i/6,a=.70+i*2.1,r=bend*(.17+.071*(i%3)),pos=[Math.cos(a)*r,.19+.97*u+.09*Math.sin(a+q.t*tau),Math.sin(a)*r];
   const c=offset(pos,-direction*(.095+.051*u)*bend,.07*bend,.034*bend);
   world.tri(pos,c,offset(c,-direction*.065*bend,.12*bend,-.083*bend),i%2?shawl:kerchief);
  }
  const warped=Object.create(m);warped.tri=(a,b,c,color,mat=0)=>world.tri(fold(a),fold(b),fold(c),color,mat);m=warped;
 }
 const coat=q.attendant?[.255,.345,.322]:kind==='infected'?sand:kind==='golem'?tissue.torn:kind==='cultist'?smock:shawl;
 if(kind==='golem')m.golemRegions=[];
 shins(m,kind,q,r);
 if(!monster)skirt(m,q,r,kind==='witch'?wool:smock,kind==='witch'?shawl:hem,patched);
 if(kind==='golem'){
  shell(m,pelvis,[[-.17,.226,.176],[-.046,.292,.224],[.119,.229,.184]],tissue.muscle,7);
  line(m,offset(pelvis,-.03,.057,-.049),offset(chest,-.03,-.22,-.078),.152,.118,tissue.clot,6);
 }else{
  shell(m,pelvis,[[-.115,b.waist*.9,b.deep*.8],[-.024,b.waist,b.deep*.87],[.111,b.waist*.86,b.deep*.77]],monster?olive:coat,7);
  line(m,offset(pelvis,-.016,.068,-.036),offset(chest,-.018,-.12,-.055),b.waist*.66,b.waist*.72,coat,6);
 }
 const h=monster&&kind==='golem'?.314:.243;
 if(q.mask&8)tornChest(m,offset(chest,0,-.064,.004),b.chest,h,b.deep,coat,monster);
 else{
  shell(m,chest,[[-1.25*h,b.chest*.58,b.deep*.78,0,-.037],[-.65*h,b.chest*.87,b.deep*.90],[-.07*h,b.chest,b.deep*1.15],[.40*h,b.chest*.97,b.deep*.92],[.68*h,b.chest*.56,b.deep*.70]],coat,7);
  if(q.wounds>0)hitWounds(m,offset(chest,0,-.055,b.deep*1.17),b.chest,h);
 }
 const edgeX=b.chest*.73;
 if(kind==='infected'){
  // Work identification stays visible through the kennel attendant’s change.
  box(m,offset(chest,-edgeX*.73,.04,b.deep*.83),.111,.100,.039,olive,0,-.1);
  m.tri(offset(chest,edgeX*.13,.14,b.deep*.60),offset(chest,edgeX*.8,.084,b.deep*.87),offset(chest,edgeX*.38,-.044,b.deep*1.19),olive);
  if(q.attendant){
   const badge=offset(chest,-edgeX*.73,.04,b.deep*1.04);
   box(m,badge,.081,.047,.008,[.73,.72,.61]);
   box(m,offset(badge,-.022,0,.006),.018,.025,.004,[.28,.34,.32]);
   for(const y of [.009,-.004])box(m,offset(badge,.012,y,.006),.031,.003,.004,soot);
   const clip=offset(pelvis,.15,.005,.09);
   for(let i=0;i<3;i++)line(m,offset(clip,.008*i,0,0),offset(clip,.016*i,-.065+.01*i,.018*i),.005,.004,edge,5);
  }else{
  line(m,offset(chest,-edgeX*.48,.134,b.deep*.49),offset(chest,.019,.006,b.deep*1.08),.007,.006,iron,4);
  box(m,offset(chest,.023,-.022,b.deep*1.12),.037,.050,.006,edge,0,.13);
  for(const side of [-1,1]){
   box(m,offset(pelvis,side*b.waist*.77,-.015,b.deep*.44),.104,.117,.084,web,0,side*.22);
   line(m,offset(chest,side*edgeX,.09,b.deep*.54),offset(chest,side*edgeX*.85,-.16,b.deep*.84),.025,.021,web,4);
  }
  }
  if(!(q.mask&8)){
  // A flap of fatigues has pulled away from the advancing parasite. The flap hangs below the belt.
  const tear=insetMesh(m,offset(chest,.082,-.121,b.deep*.99),.12,-.05,.16);
  const fray=[[-.101,.169,.002],[-.036,.210,.022],[.091,.127,-.006],[.102,-.131,-.004],[-.032,-.225,.025],[-.093,-.121,.019]];
  for(let j=0;j<fray.length;j++)tear.tri(fray[j],fray[(j+1)%fray.length],[.006,.031,.039],j%2?tissue.clot:tissue.blood);
  for(let j=0;j<3;j++){
   const x=.063-j*.057,y=.109-j*.042;
   line(tear,[x,y,.051],[x-.035,y+.056,.043],.013,.006,tissue.fat,4);
  }
  tear.tri(fray[4],[-.097,-.285,.023],fray[5],sand);tear.tri(fray[2],[.156,.176,-.023],fray[3],olive);
  }
  const brood=spineParasite(m,offset(chest,.105,-.31,b.deep*.84),.40+.10*q.generation,.045+.014*q.generation,q.t*tau+.74,q.generation);
  if(q.generation){
   const last=q.mask&1?offset(neck,.035,.002,.044):offset(head,.12,.02,.042);
   line(m,brood,last,.039,.026,tissue.blood,5);
   for(const side of [-1,1])spineParasite(m,offset(chest,side*b.chest*.87,-.132,-.056),.38+.105*q.generation,.065+.012*q.generation,q.t*tau+side*1.8,q.generation);
   for(let j=0;j<2+q.generation;j++){
    const base=offset(chest,(j%2?1:-1)*(.052+j*.022),.028+j*.046,-b.deep*.79),tip=offset(base,(j%2?1:-1)*(.15+.026*j),.16+.058*j,-.16+.028*q.breath);
    line(m,base,tip,.047,.007,j%2?tissue.torn:tissue.ivory,5);
   }
  }
 }else if(kind==='golem'){
  graftMarks(m,q,r);
  // Unstitched strips recoil a beat after each shoulder. Their roots remain fixed in the scar.
  for(const side of [-1,1])for(let j=0;j<2;j++){
   const base=offset(chest,side*(.255+.025*j),.095-.17*j,.175-.031*j);
   const shiver=(.46*Math.sin(3*r.t+side+j)**3+.54*Math.sin(2*r.t-.97*j+side))*(1-q.fall);
   const joint=offset(base,side*(.051+.047*shiver),-.102+.113*shiver,.045+.083*shiver);
   const tip=offset(joint,side*(.071+.063*Math.sin(3*r.t+side+j-.7)),-.171+.073*shiver,.036+.087*shiver);
   quad(m,base,offset(base,side*.036,.039,-.005),offset(joint,side*.027,-.004,.007),joint,j===0?tissue.torn:tissue.muscle);
   m.tri(joint,offset(joint,side*.027,-.004,.007),tip,tissue.blood);
  }
  // Swatches are sewn edge to edge. Several thumbs emerge under the build's wrong shoulder.
  if(!(q.mask&8)){
   const harness=insetMesh(m,offset(chest,.015,-.052,.237),-.08,-.06,-.27);
   const seams=[[-.078,.224,.004],[-.029,.147,.025],[-.055,.079,.024],[.014,.028,.044],[-.009,-.062,.026],[.045,-.159,.004]];
   for(let j=0;j<seams.length-1;j++){
    const a=seams[j],b=seams[j+1],inset=j%2?.033:.042;
    quad(harness,offset(a,-inset,0,-.022),a,b,offset(b,-inset,0,-.023),j%2?tissue.blood:tissue.clot);
    line(harness,a,offset(b,.003,0,.003),.014,.009,tissue.muscle,4);
    line(harness,offset(b,-inset,.025,-.003),offset(b,.02,.011,.016),.009,.007,soot,4);
   }
  }
  const a=offset(chest,-.24,.16,.137),d=offset(chest,-.19,-.14,.213),b2=offset(chest,-.036,.077,.253);
  if(!(q.mask&8))m.tri(a,d,b2,bruised);
  line(m,a,d,.010,.012,tissue.blood,4);stitches(m,a,d,.030,5);
  const scarA=offset(chest,.13,.158,.137),scarB=offset(chest,.27,-.181,.146);
  line(m,scarA,scarB,.014,.010,tissue.clot,4);stitches(m,scarA,scarB,.034,6);
  if(!(q.mask&2)){
   const member=offset(chest,-.342,.044,.116);
   shell(m,member,[[-.076,.091,.075],[.022,.123,.092],[.109,.080,.073]],tissue.muscle,6);
   for(let j=0;j<3;j++){
    const a=offset(member,-.039+j*.028,-.027,.073);
    line(m,a,offset(a,-.024*j,-.099,.036+.027*j),.027,.010,tissue.torn,4);
   }
  }
  for(const s of [-1,1]){
   const apron=offset(pelvis,s*.148,.039,.172),end=offset(apron,s*.064,-.367+.035*s,.095+.04*q.swing);
   m.tri(apron,offset(apron,-s*.105,-.017,.031),end,s>0?linen:[.39,.312,.265]);
   line(m,offset(chest,s*.203,.125,-.104),offset(pelvis,-s*.083,-.005,-.173),.018,.026,rosary,4);
  }
 }else if(kind==='cultist'){
  for(const s of [-1,1]){
   const shoulder=offset(chest,s*.217,.096,-.042),throat=offset(neck,s*.059,.014,.034),lappet=offset(chest,s*.12,-.183,.146);
   quad(m,shoulder,offset(shoulder,s*.024,-.129,.094),lappet,throat,hoodDark);
   line(m,throat,lappet,.012,.009,hem,4);
  }
  guard(m,offset(chest,.016,-.106,.177),.036,.046,.007,.007,[.64,.480,.277],7);
  if(q.photo){
   const waist=offset(pelvis,0,.032,.032),pull=.022*Math.sin(q.t*tau-.64);
   for(let i=0;i<16;i++){
    const point=k=>{const a=k*Math.PI/8;return offset(waist,.189*Math.sin(a),.020*Math.sin(a+.62),.146*Math.cos(a));};
    line(m,point(i),point(i+1),i%2?.009:.011,i%2?.011:.009,rosary,5,8);
   }
   for(const side of [-1,1]){
    const knot=offset(waist,.082,.006,.129),cord=offset(knot,side*(.026+pull),-.096,.024);
    const end=offset(cord,side*.017+pull,-.097+(side+1)*.020,.019+pull);
    line(m,knot,cord,.008,.008,rosary,6,8);line(m,cord,end,.008,.005,rosary,5,8);
    const bead=offset(end,0,-.010,0);shell(m,bead,[[-.012,.005,.005],[0,.011,.011],[.011,.006,.006]],edge,7,5);
    const base=offset(chest,side*.184,.068,.058),fold=offset(chest,side*.131,-.108,.137),tail=offset(pelvis,side*.099,-.054,.174);
    quad(m,base,offset(base,side*.015,.001,-.002),offset(fold,side*.013,-.007,-.002),fold,hoodDark,8);
    m.tri(fold,offset(fold,side*.012,-.008,-.002),tail,hem,8);
   }
  }
  line(m,offset(pelvis,-.17,.059,.087),offset(pelvis,.184,.02,.091),.022,.019,rosary,5);
 }else{
  const hump=offset(chest,-.024,.106,-.102);
  shell(m,hump,[[-.166,.163,.143],[.004,.235,.163,0,-.04],[.129,.194,.129,-.032,-.035],[.218,.091,.073,-.014,-.013]],wool,7);
  for(const s of [-1,1]){
   const c=offset(neck,s*.039,.007,.039),shoulder=offset(chest,s*.231,.109,-.042);
   const hem0=offset(chest,s*.184,-.154,.136),hem1=offset(chest,s*.047,-.181,.166);
   quad(m,c,shoulder,hem0,hem1,s<0?shawl:wool);
   for(let j=0;j<4;j++){
    const a=offset(hem1,s*.036*j,.008*j,-.007*j);line(m,a,offset(a,s*.009,-.054-.012*(j%2),.015+.016*q.swing),.007,.003,kerchief,4);
   }
  }
  if(!(q.mask&8)){
   const top=offset(chest,-.03,-.092,.157),l=offset(pelvis,-.129,-.004,.133),rt=offset(pelvis,.128,-.012,.14);
   m.tri(top,l,rt,linen);quad(m,l,offset(l,-.017,-.28,.131),offset(rt,.044,-.333,.096),rt,kerchief);
  }
  kettleKeys(m,offset(pelvis,-.159,.02,.113),q);
  // A bundle of seven clipped orchard switches shows over one shoulder.
  for(let i=0;i<5;i++){
   const a=offset(pelvis,-.074+i*.025,-.016,-.127),b=offset(chest,.122+i*.04,.26+i*.025,-.094);
   line(m,a,b,.018,.006,[.32,.242,.169],4);
   if(i%2)line(m,offset(b,-.015,-.081,.01),offset(b,-.076,.042,-.028),.008,.003,flax,4);
  }
 }
 arms(m,kind,q,r);
 if(q.mask&1){woundSocket(m,neck,kind==='golem'?.105:.066);return;}
 const headStart=kind==='golem'?triCount(m):0;
 line(m,neck,head,kind==='golem'?.102:.067,.066,kind==='golem'?tissue.muscle:bruised,6);
 if(kind==='cultist'){
  const frame=insetMesh(m,head,.17*Math.sin(q.t*tau-.83)+.22*q.coil,.10+.14*q.coil-.16*q.strike,.07*q.swing);
  hood(frame,smock,q.photo,q.variant);
  if(q.hits&1)hitWounds(frame,[.073,.043,.121],.067,.080);
 }else{
  const facial=deadFace(m,head,q,kind,kind==='golem'?1.13:1);
  if(kind==='infected'){
   shell(facial,[0,.079,-.013],[[0,.125,.119],[.040,.132,.13],[.09,.089,.093]],web,7);
   spineParasite(facial,[.067,-.028,.091],.153,.026,q.t*tau,q.generation);
  }else if(kind==='golem'){
   const A=[-.121,.077,.078],B=[.074,-.058,.115];line(facial,A,B,.012,.013,tissue.clot,4);stitches(facial,A,B,.020,6);
   shell(facial,[-.073,.107,-.028],[[-.021,.06,.064],[.043,.078,.07],[.103,.041,.05]],bruised,6);
  }else{
   shell(facial,[0,.038,-.034],[[.014,.126,.135],[.106,.135,.14],[.151,.092,.093,-.014,-.023]],kerchief,7);
   for(const s of [-1,1]){
    const side=[s*.119,.128,.039],low=[s*.057,-.086,.045],front=[s*.101,.027,.097],back=[s*.139,-.114,-.104];
    quad(facial,side,front,low,back,kerchief);
    for(let j=0;j<3;j++){
     const a=[s*(.089+j*.012),-.018,-.025+j*.013],mid=offset(a,s*.015,-.116,.035);
     line(facial,a,mid,.015,.012,braid,4);line(facial,mid,offset(mid,-s*.02,-.082,.034),.011,.004,braid,4);
    }
   }
   facial.tri([-.046,-.068,.082],[-.008,-.123,.144],[.042,-.072,.085],skin);
  }
 }
 if(kind==='golem')tagMember(m,'head',headStart);
}
function hood(m,tone,photo,variant=0){
 // The back is closed and the front opening is a return lip around a recessed face.
 const outline=[[-.084,-.069,.060],[-.135,.037,.059],[-.114,.134,.072],[-.036,.182,.110],[.074,.175,.104],[.144,.084,.064],[.149,-.015,.033],[.081,-.096,.051]];
 const inside=[[-.057,-.058,.102],[-.078,.024,.129],[-.067,.091,.142],[-.022,.114,.153],[.046,.108,.151],[.084,.062,.139],[.09,-.013,.106],[.054,-.06,.099]];
 const back=[0,.065,-.132],n=outline.length;
 for(let i=0;i<n;i++){
  const j=(i+1)%n,a=outline[i],b=outline[j],c=inside[j],d=inside[i];
  quad(m,a,b,c,d,i%3===0?hem:tone);
  m.tri(a,back,b,i%3===1?hoodDark:tone);
  const rear=[0,.024,.038];m.tri(d,c,rear,i<3?hoodDark:black);
 }
 if(photo){
  const clay=[[.465,.375,.284],[.414,.335,.286],[.467,.400,.321]][variant%3];
  const low=[0,-.053,.100],cheek=[.058,.008,.104],bridge=[.001,.048,.129],nose=[.004,.009,.138];
  // A hollow, smoke-darkened eye socket underneath each brow. The face sits behind the folded hem.
  for(const side of [-1,1]){
   const s=p=>[side*p[0],p[1],p[2]];
   const eye=[s([.013,.052,.125]),s([.035,.057,.127]),s([.060,.048,.114]),s([.041,.037,.116]),s([.022,.039,.121])];
   const shadow=s([.038,.046,.110]);
   for(let i=0;i<eye.length;i++)m.tri(eye[i],eye[(i+1)%eye.length],shadow,soot);
   const brow=s([.031,.077,.126]),temple=s([.071,.047,.101]),jaw=s([.041,-.031,.100]),top=s([.030,.094,.107]);
   m.tri(bridge,eye[0],eye[1],clay);m.tri(eye[0],bridge,brow,clay);m.tri(eye[0],brow,eye[1],clay);
   quad(m,brow,temple,eye[2],eye[1],clay);m.tri(brow,top,temple,clay);m.tri(top,brow,bridge,clay);
   quad(m,eye[3],eye[2],temple,s(cheek),clay);m.tri(eye[3],s(cheek),nose,clay);
   m.tri(eye[0],bridge,nose,clay);m.tri(eye[4],eye[0],nose,clay);
   quad(m,nose,s(cheek),jaw,s([.024,-.024,.119]),clay);
   m.tri(jaw,low,s([.024,-.024,.119]),clay);
   const hemline=inside.map(v=>[v[0]*.945,v[1]*.96+.0015,v[2]+.003]);
   if(side===1)for(let i=0;i<n;i++)quad(m,inside[i],inside[(i+1)%n],hemline[(i+1)%n],hemline[i],hem,8);
   for(let i=0;i<3;i++){
    const seam=side<0?2:5,a=inside[seam],b=outline[seam],u=.17+i*.24;
    const q=a.map((x,j)=>x+(b[j]-x)*u);
    line(m,offset(q,-.003,.002,.003),offset(q,.003,-.003,.003),.0018,.0014,rosary,4,8);
   }
  }
  const mouth=[[0,-.015,.119],[-.019,-.013,.115],[-.027,-.023,.117],[.001,-.037,.116],[.022,-.022,.117],[.017,-.013,.117]];
  for(let i=0;i<mouth.length;i++)m.tri(mouth[i],mouth[(i+1)%mouth.length],[.001,-.024,.107],black);
  const crack=variant%2?[[.057,.068,.117],[.040,.059,.128],[.048,.055,.124],[.036,.038,.122]]:
    [[-.024,-.026,.119],[-.034,-.012,.119],[-.029,-.008,.121],[-.041,.002,.118]];
  for(let i=1;i<crack.length;i++)line(m,crack[i-1],crack[i],.0017,.0011,soot,4);
  return;
 }
 m.tri([-.031,.041,.096],[.024,.045,.094],[.013,-.001,.117],bruised);
 const jaw=[.003,-.034,.088];line(m,[-.033,-.012,.097],jaw,.012,.015,bruised,4);line(m,jaw,[.042,-.014,.094],.015,.010,bruised,4);
}
export const host=(m,q)=>wearer(m,'infected',q);
export const golem=(m,q)=>wearer(m,'golem',q);
export const cultist=(m,q)=>wearer(m,'cultist',q);
export const witch=(m,q)=>wearer(m,'witch',q);

function segmentRing(centers,i,r,n,phase){
 const p=centers[i],lo=centers[Math.max(0,i-1)],hi=centers[Math.min(i+1,centers.length-1)];
 const dx=hi[0]-lo[0],dy=hi[1]-lo[1],dz=hi[2]-lo[2],len=Math.hypot(dx,dy,dz)||1;
 // The trunk leans mainly on the sagittal plane. Project a fixed lateral axis onto its normal plane.
 const ax=dx/len,ay=dy/len,az=dz/len,nx=1-ax*ax,ny=-ax*ay,nz=-ax*az,unit=Math.hypot(nx,ny,nz)||1;
 const ex=nx/unit,ey=ny/unit,ez=nz/unit,fx=ay*ez-az*ey,fy=az*ex-ax*ez,fz=ax*ey-ay*ex;
 return Array.from({length:n},(_,j)=>{
  const a=j/n*tau+phase,c=Math.cos(a)*r,s=Math.sin(a)*r*(.89+.04*Math.sin(a*3));
  return offset(p,ex*c+fx*s,ey*c+fy*s,ez*c+fz*s);
 });
}

const unit=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const u=unit(x);return u*u*(3-2*u);};
const anchoredPoses=new Set(['anchored','surface','sink','recoil','spitTell','spit']);
const larvalPoses=new Set(['seek','flee','enter','hatch']);

function wormSpine(q){
 const pose=q.pose,phase=q.t*tau;
 const larva=q.young||larvalPoses.has(pose),fixed=!larva&&(q.anchored||anchoredPoses.has(pose));
 const wind=pose==='spitTell'?ease(q.t):pose==='spit'?1-ease(q.t/.28):0;
 const expel=pose==='spit'?Math.sin(Math.PI*unit((q.t-.08)/.72)):0;
 const recoil=pose==='recoil'?(1-ease(q.t))*(.77+.23*Math.sin(Math.PI*q.t)):0;
 const coil=q.coil,lash=q.strike,centers=[],radii=[],twists=[];
 let scale=1,sub=0,yaw=.14*Math.sin(phase-.6)+.26*coil,pitch=-.05-.33*coil+.29*lash+.47*q.fall,roll=-.12*q.sting-.28*q.fall;
 if(larva){
  const flee=pose==='flee',enter=pose==='enter',hatch=pose==='hatch';
  const wave=phase*(flee?2:1),approach=enter?ease(q.t):0;
  for(let i=0;i<=10;i++){
   const u=i/10,wake=1-u,buried=enter?ease((approach-.37*wake)/.63):0;
   const width=flee?.40:.25,whip=Math.sin(wave-u*7.4)+.32*Math.sin(2*wave+u*9);
   const z=-1.10+2.07*u+.055*Math.cos(wave-u*9)*Math.sin(PI*u);
   const p=[width*whip*(.27+wake*.72)+.06*Math.sin(3*wave-u*7)*wake,
    .174+.080*Math.sin(wave-u*9)**2+.105*u**3,z];
   if(hatch){const release=ease((q.t-.32*u)/.68);p[0]*=release;p[1]+=.14*(1-release);p[2]=.06+(z-.06)*(.09+.91*release);}
   if(enter){
    p[0]*=1-buried;p[1]+=(.24-p[1])*buried-.55*buried**2;
    p[2]+=(1.25-p[2])*buried;
   }
   // Leave a tiny depth difference when the tail exits; every ring remains well-defined.
   p[2]+=.013*u*buried;
   centers.push(p);radii.push((.10+.142*Math.sin(PI*(.065+u*.86)))*(.96+.12*Math.cos(wave-u*8))*(1-.92*buried));
   twists.push(.15+.37*Math.sin(wave-u*4.8));
  }
  const p=centers[10],pre=centers[9],dx=p[0]-pre[0],dy=p[1]-pre[1],dz=p[2]-pre[2];
  yaw=Math.atan2(dx,Math.max(.025,dz));pitch=-Math.atan2(dy,Math.max(.08,Math.hypot(dx,dz)));
  roll=.21*Math.sin(wave-1.21)*(1-approach);scale=.54*(1-.91*ease(approach/.63));
 }else if(fixed){
  const visible=pose==='surface'?ease(q.t):pose==='sink'?1-ease(q.t):1;
  sub=-.66*(1-visible);yaw=.13*Math.sin(phase-.3)-.27*wind+.32*expel;
  pitch=-.05-.41*wind+.35*expel+.33*recoil;roll=.09*Math.sin(phase)+.44*wind-.28*expel;
  for(let i=0;i<=10;i++){
   const u=i/10,stem=ease(u),wave=Math.sin(phase-4*u);
   const turn=2.1+2.9*wind-1.42*expel;
   const x=(.176*Math.sin(turn*u+.35*wave)+.13*wind*Math.sin(u*6.1))*stem;
   const y=-.18+.012*u*(1-visible)+(1.97*Math.sin(1.55*u)+.046*u*wave-.48*wind*stem-.33*recoil*stem+.23*expel*stem)*visible;
   const z=(-.177*Math.sin(PI*u)+.56*u**4-.29*wind*stem+.60*expel*stem-.24*recoil*stem)*visible+.009*u*(1-visible);
   centers.push([x*visible,y,z]);
   const pulse=Math.exp(-((u-(.15+.71*wind))**2)/.044)*wind;
   radii.push((.321+.126*Math.sin(PI*u)-.021*u)*(1+.025*u*wave+.32*pulse-.09*expel*u));
   twists.push(.12+u*(wind*.95-.63*expel)+.14*u*wave);
  }
 }else{
  const rising=pose==='rise'||q.erupt,rise=rising?.065+.935*q.entry:1;
  const up=Math.max(.065,(1-q.burrow)*rise);
  sub=-.70*(1-up);
  for(let i=0;i<=10;i++){
   const u=i/10,hump=Math.sin(u*PI),bend=ease(u);
   const x=(.36*Math.sin(u*4.35+.34*Math.sin(phase-.72))+.12*Math.sin(phase-u*4)*q.move)*.9+.19*bend*coil-.46*lash*bend+.09*q.sting+.53*q.fall*Math.sin(u*3.42-.5);
   const y=(.034+1.80*Math.sin(u*1.52)-.32*coil*bend+.23*lash*bend+.054*Math.sin(phase-u*4)*u)*up*(1-.72*q.fall);
   const z=-.55+.145*hump+.27*bend+.88*u**4+.16*Math.sin(phase-2*u)*q.move*u-.19*coil*bend+.70*lash*bend+.97*u*q.fall;
   centers.push([x,y,z]);radii.push((.35+.14*Math.sin(u*PI)-.095*u+.07*bend)*(.98+.064*Math.sin(phase-u*7)));twists.push(.12);
  }
 }
 return {larva,fixed,centers,radii,twists,sub,yaw,pitch,roll,scale,wind,expel,recoil};
}

export function wormSocket(q){
 const r=wormSpine(q),p=r.centers[10],length=.27*r.scale;
 return offset(p,length*Math.sin(r.yaw)*Math.cos(r.pitch),r.sub-length*Math.sin(r.pitch),length*Math.cos(r.yaw)*Math.cos(r.pitch));
}

export function worm(m,q){
 const phase=q.t*tau,coil=q.coil,lash=q.strike;
 const {larva,fixed,centers,radii,twists,sub,yaw,pitch,roll,scale,wind,expel}=wormSpine(q);
 if(sub)m=insetMesh(m,[0,sub,0],0,0);
 const n=larva?7:10,rings=[];
 for(let i=0;i<centers.length;i++){
  if(q.mask&8&&i===5)radii[i]*=.78;
  rings.push(segmentRing(centers,i,radii[i],n,twists[i]));
 }
 const palette=[tissue.clot,[.423,.130,.126],[.53,.20,.161],[.422,.17,.15]];
 for(let i=0;i<10;i++){
  const first=rings[i],last=rings[i+1],seam=rings[i].map((v,k)=>v.map((x,j)=>x+(last[k][j]-x)*.18+(x-centers[i][j])*.070));
  for(let j=0;j<n;j++){
   const k=(j+1)%n;
   if(q.mask&8&&i>=4&&i<7&&(j===n-3||j===n-2)){
    // The gap is backed by tissue set deep into the body and a few pale connective strands.
    const innerA=first[j].map((v,l)=>(v+centers[i][l])/2),innerB=last[k].map((v,l)=>(v+centers[i+1][l])/2);
    quad(m,first[j],innerA,innerB,last[k],tissue.deep);
    if(i%2===0)line(m,first[j],innerB,.046,.029,tissue.torn,5);
    continue;
   }
   quad(m,first[j],first[k],seam[k],seam[j],(i+j)%4===0?tissue.torn:tissue.muscle);
   quad(m,seam[j],seam[k],last[k],last[j],palette[(i+Math.floor(j*.5))%4]);
   if((i+j)%4===1&&j%2===0){
    const a=seam[j],b=last[j],c=b.map((v,l)=>v+(a[l]-centers[i][l])*.24);
    m.tri(a,c,last[k],tissue.clot);
   }
  }
  if(fixed&&(i===4||i===6||i===8)){
   const skin=offset(centers[i],radii[i]*(i%4?.74:-.75),.035,radii[i]*.50);
   const size=.061+.068*wind*(.44+.56*Math.cos(i+phase)**2);
   shell(m,skin,[[-size,size*.42,size*.56],[0,size,size*.87],[size*.77,size*.48,size*.40]],
    wind>.37?[.65,.48,.213]:[.445,.287,.190],6);
  }
  if(!larva&&i>1&&i<7&&i%2===0)for(const side of [-1,1]){
   const root=offset(centers[i],side*radii[i]*.68,.023,.072);
   const joint=offset(root,side*.11,.058+.02*Math.sin(phase+i),-.024);
   line(m,root,joint,.048,.035,tissue.muscle,5);
   line(m,joint,offset(joint,side*.072,-.061,-.082),.035,.004,tissue.ivory,4);
  }
 }
 if(q.wounds)hitWounds(m,offset(centers[5],0,0,radii[5]*.95),radii[5]*.85,radii[5]);
 const p=centers[10],front=insetMesh(m,p,yaw,pitch,roll,scale);
 if(q.mask&1){
  shell(front,[0,0,-.02],[[-.147,.15,.14],[.022,.22,.17],[.170,.128,.119]],tissue.deep,7);
  spineParasite(front,[.018,-.073,.106],.18,.044,phase);return;
 }
 const open=.03+.078*coil+.127*lash+.075*q.fall+.095*wind+.143*expel+.022*(1+Math.sin(phase)),mouth=.218+open;
 const center=[0,-.023,.028];
 for(let j=0;j<10;j++){
  const a=j/10*tau,b=(j+1)/10*tau,axis=(ang,r,z)=>[Math.sin(ang)*r,center[1]+Math.cos(ang)*r*.90,center[2]+z];
  const A=axis(a,.315,0),B=axis(b,.315,0),C=axis(b,mouth,.191),D=axis(a,mouth,.191);
  quad(front,A,B,C,D,j%2?tissue.torn:tissue.muscle);
  const J=axis(b,mouth*.68,.045),I=axis(a,mouth*.68,.045);
  quad(front,D,C,J,I,j%2?tissue.blood:tissue.clot);front.tri(I,J,center,tissue.deep);
  const tooth=axis((a+b)*.5,mouth*(j%2?.68:.54),.302+.036*(j%2));
  front.tri(D,C,tooth,tissue.ivory);
  front.tri(tooth,C,axis(b,mouth*.92,.106),tissue.fat);
  if(j%2===0){const tip=axis((a+b)*.5,.343+.026*lash,-.077);front.tri(A,tip,B,tissue.clot);}
 }
 // Inside the outer barbs sits a smaller row of slick, inward-pointing teeth.
 for(let j=0;j<8;j++){
   const a=j/8*tau+.19,b=a+.39,c=a+.21;
   const point=(theta,r,z)=>[Math.sin(theta)*r,-.023+Math.cos(theta)*r*.88,z];
   front.tri(point(a,mouth*.65,.079),point(b,mouth*.65,.079),point(c,mouth*.37,.151),j%2?tissue.fat:tissue.ivory);
 }
 if(q.hits&1)hitWounds(front,[-.20,.169,.188],.083,.096);
 if(fixed&&(wind>.015||expel>.015)){
  const r=.022+.115*wind*(1-expel);
  const sac=[.012,-.005,.095+.135*wind+.16*expel];
  shell(front,sac,[[-r,r*.46,r*.49],[0,r,r*1.20],[r*.73,r*.48,r*.54]],[.586,.414,.20],7);
 }
 const tongue=[.039+.028*Math.sin(phase),-.062,.11];
 line(front,tongue,offset(tongue,-.029,.011,.107+.21*lash),.047,.027,tissue.muscle,5);
 for(const side of [-1,1]){
  const jaw=[side*.238,-.113,.095];
  if(q.mask&(side<0?2:4)){woundSocket(front,jaw,.095,[side*.45,.05,.8]);continue;}
  const base=offset(jaw,side*(.12+.10*coil+.095*q.tear),-.037+.073*side*q.tear,.130),hinge=offset(base,side*(.092+.15*coil-.11*lash),.051,.18+.043*lash);
  const tip=offset(hinge,-side*(.13+.12*lash),.113,.18+.075*lash);
  if(q.hits&(side<0?2:4))hitWounds(front,offset(base,0,0,.096),.075,.07);
  line(front,jaw,base,.123,.091,tissue.blood,6);
  line(front,base,hinge,.098,.065,tissue.fat,5);
  line(front,hinge,tip,.069,.017,tissue.ivory,5);
  line(front,tip,offset(tip,-side*.055,.037,-.007),.018,.003,tissue.ivory,4);
 }
}

// Tumbling secretion mesh, centred on the gameplay projectile; +Z is velocity.
export function buildWormSpit(mesh,t=0){
 const a=t*tau,body=insetMesh(mesh,[0,0,0],.22*Math.sin(a),.21*Math.cos(a),a);
 shell(body,[0,0,0],[[-.085,.042,.077],[.002,.088,.102],[.068,.063,.066],[.081,.032,.039]],[.476,.313,.122],7);
 const hot=[.81,.57,.22],slime=[.57,.466,.191];
 for(let i=0;i<3;i++){
  const k=i*tau/3,r=.055,root=[r*Math.sin(k),r*Math.cos(k),.038],elbow=offset(root,.023*Math.sin(a+k),-.014,-.144);
  line(body,root,elbow,.025,.017,i%2?hot:slime,5);
  line(body,elbow,offset(elbow,.036*Math.sin(a-k),.04*Math.cos(a+k),-.127-.034*(i%2)),.017,.003,slime,4);
 }
 return mesh;
}

export {nightClerk as wraith} from './night-clerk.js';

export function witness(m,q){
 const k=q.aid,t=q.t*tau,held=q.struggle||(q.pose==='grab'?1:0),step=q.move;
 const p=[.025*q.swing+.042*held*Math.sin(t),.904-.42*k-.076*q.fall-.06*held,.022+.041*k];
 const chest=offset(p,.016*q.breath-.078*held*Math.sin(t),.404-.037*k,.071+.118*k-.116*held);
 const jacket=[.361,.361,.319],denim=[.253,.273,.295],hair=[.213,.187,.163],skin=[.548,.450,.349];
 for(const side of [-1,1]){
  const stride=footfall(q.t,side>0?.54:.03),knee=[side*(.108+.063*k),.49-.39*k+.10*stride.lift*step,.089+.27*k+.141*stride.z*step];
  const foot=[side*(.139+.083*k),.072+.113*stride.lift*step,-.048-.26*k+.246*stride.z*step];
  if(held){const kick=Math.max(0,Math.sin(t+side*1.56));knee[0]+=side*.065;knee[1]+=.11*kick;knee[2]+=.183*kick;
   foot[0]+=side*.12*kick;foot[1]+=.06+.18*kick;foot[2]+=side*.161*Math.sin(t-.62);}
  line(m,offset(p,side*.099,-.042,0),knee,.091,.066,denim,6);line(m,knee,foot,.065,.045,denim,5);
  shell(m,foot,[[-.07,.073,.125,0,.026],[-.026,.077,.136,0,.033],[.049,.048,.061]],soot,5);
 }
 shell(m,p,[[-.092,.139,.110],[.013,.173,.124],[.115,.148,.095]],denim,7);
 if(q.mask&8)tornChest(m,offset(chest,0,-.055,0),.207,.227,.138,jacket,true);
 else{
  shell(m,chest,[[-.289,.14,.104],[-.132,.176,.125],[.048,.211,.144],[.147,.134,.093]],jacket,7);
  if(q.wounds)hitWounds(m,offset(chest,0,-.037,.147),.198,.184);
 }
 for(const side of [-1,1]){
  const sh=offset(chest,side*.191,.081,-.004);
  if(q.mask&(side<0?2:4)){woundSocket(m,sh,.054,[side,-.21,0]);continue;}
  const elbow=offset(sh,side*(.067+.08*k),-.232+.056*k,-.017-.181*k-side*.10*q.swing);
  let hand=offset(elbow,-side*(.017+.190*k),-.184+.151*k,.074-.147*k-side*.063*q.swing);
  if(held){
   const kick=Math.max(0,Math.sin(t+side*.94));
   elbow[0]+=side*(.075+.081*kick);elbow[1]+=.202+.141*kick;elbow[2]+=.09;
   hand=offset(chest,side*(.06+.16*kick),.23+.103*kick,.119+.206*kick);
  }
  line(m,sh,elbow,.073,.053,jacket,6);line(m,elbow,hand,.053,.037,skin,5);
  if(q.hits&(side<0?2:4))hitWounds(m,offset(sh,side*.018,-.103,.054),.062,.09);
  shell(m,hand,[[-.063,.029,.039],[.016,.042,.048],[.051,.031,.028]],skin,5);
  if(k>.6)line(m,offset(hand,.001,.024,0),offset(hand,.004,.044,-.003),.043,.043,rosary,5);
 }
 const neck=offset(chest,.018,.147,.036);if(q.mask&1){woundSocket(m,neck,.055);return;}
 const head=offset(neck,.026*Math.sin(t),.112-.030*k,.040+.061*k);
 line(m,neck,head,.054,.057,skin,5);const face=insetMesh(m,head,.22*Math.sin(t-.7),-.075+.29*k-.32*held,.094*q.breath+.20*Math.sin(t)*held);
 shell(face,[0,0,0],[[-.079,.063,.079,0,.019],[-.017,.099,.106],[.073,.103,.101],[.124,.069,.075]],skin,7);
 if(q.hits&1)hitWounds(face,[.037,-.018,.101],.059,.060);
 shell(face,[0,.049,-.016],[[.002,.11,.112],[.067,.108,.105],[.099,.072,.071]],hair,7);
 for(const s of [-1,1])line(face,[s*.021,.055,.102],[s*.072,.036,.083],.012,.005,hair,4);
 face.tri([-.024,.056,.098],[.019,.053,.103],[.003,-.007,.138],skin);
 line(face,[-.032,-.044,.095],[.027,-.050,.093],.006,.006,bruised,4);
}
