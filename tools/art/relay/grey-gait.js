import {footfall} from './actor-geometry.js';

const tau=Math.PI*2,clamp=n=>Math.min(1,Math.max(0,n));
const lerp=(a,b,f)=>a+(b-a)*f;
const wave=(t,offset)=>Math.sin(tau*(t+offset));
const put=(p,coords)=>{for(let i=0;i<3;i++)p[i]=coords[i];};

// Horizontal spine for every travelling pose. The original high silhouette is reserved for watching and projecting a tether.
export function lowRig(q,r){
 const upright=q.standing??(isWatchingPose(q.pose)?1:0);
 if(upright>=.999)return r;
 const low=1-upright,blend=(target,values)=>put(target,values.map((n,j)=>lerp(target[j],n,low)));
 r.low=low;
 const running=q.pose==='dash'||q.pose==='flee',walking=q.pose==='prowl',f=r.action;
 r.bound=running?1:0;r.travel=running||walking?1:0;r.legT=q.t;
 const t=q.t,cycle=r.travel,spine=running?wave(t,-.07):.34*wave(t*2,-.08);
 const windup=q.pose==='screech'?Math.sin(t*Math.PI):q.pose==='skyRise'&&t<.24?Math.sin(t/.24*Math.PI):0,fold=f.fold;
 const heave=r.travel*spine*.108-.29*windup+.21*fold;
 const hip=[r.stride*.034+.016*f.wave(.23),1.06+heave-.14*f.set,-.87+cycle*.14*wave(t,.18)];
 const shoulder=[.034*f.wave(.53)+.15*f.swing,1.34-heave*.67-.22*windup-.11*f.set+.083*f.arc,.42+.15*spine*cycle+.10*f.arc];
 const head=[.06*f.wave(1.08)+f.swing*.20,1.49-heave*.87+.039*f.wave(1.88)+.17*f.scream+.17*q.tear,1.13+.22*cycle*wave(t,.27)+.28*f.arc];
 if(f.plunge){hip[1]+=.41*f.plunge;shoulder[1]-=.33*f.plunge;head[1]-=.49*f.plunge;head[2]+=.17*f.plunge;}
 if(q.pose==='windowLook'){head[1]+=.14+q.t*.12;shoulder[1]+=.07;}
 blend(r.hips,hip);blend(r.chest,shoulder);blend(r.face,head);
 blend(r.waist,[lerp(hip[0],shoulder[0],.48),lerp(hip[1],shoulder[1],.43)-.09,lerp(hip[2],shoulder[2],.50)]);
 blend(r.nape,[shoulder[0]-.07,shoulder[1]+.19,shoulder[2]+.19]);
 blend(r.joint,[lerp(r.nape[0],head[0],.53)-.04,lerp(r.nape[1],head[1],.51)+.11,lerp(r.nape[2],head[2],.48)]);
 r.stride=wave(t,0)*cycle;r.d=running?1:0;r.h=0;r.glance=0;r.settle=0;
 return r;
}
function pawCycle(q,r,s,front){
 // A stalking four-beat walk changes to a paired, offset gallop when a chase starts.
 const offset=r.bound?(front?(s<0?.12:.29):(s<0?.66:.81)):(front?(s<0?.01:.51):(s<0?.76:.26));
 const footprint=footfall(q.t,offset,r.bound?.42:.70);
 return {run:footprint.z*r.travel,up:footprint.lift*r.travel};
}
export function lowHind(q,r,s,knee,heel,foot){
 const base=r.low<.999?[knee.slice(),heel.slice(),foot.slice()]:null;
 const p=pawCycle(q,r,s,false),reach=(r.bound?.86:.48)*p.run,hop=(r.bound?.51:.23)*p.up,fold=r.action.fold;
 put(foot,[s*(.415+.065*p.up),.099+hop+.51*fold,-.87+reach-.62*fold]);
 put(heel,[s*(.49+.066*p.up),.38+hop*.83+.60*fold,-1.16+reach*.78-.33*fold]);
 put(knee,[s*(.42+.08*p.up),r.hips[1]-.35+hop*.32+.28*fold,-.52+reach*.45+.17*fold]);
 if(base)[knee,heel,foot].forEach((v,k)=>put(v,v.map((n,j)=>lerp(base[k][j],n,r.low))));
}
export function lowFore(q,r,s,shoulder,elbow,paw){
 const base=r.low<.999?[elbow.slice(),paw.slice()]:null;
 const p=pawCycle(q,r,s,true),a=r.action,reach=(r.bound?.89:.47)*p.run,hop=(r.bound?.54:.24)*p.up;
 put(paw,[s*(s<0?.72:.63)+s*.064*p.up,.255+hop,.72+reach]);
 put(elbow,[shoulder[0]+s*(.19+.10*p.up),shoulder[1]-.55+hop*.58,shoulder[2]-.28+reach*.43]);
 if(q.pose==='sweep'||q.pose==='sweepTell'){
  // Three grounded points carry the animal's weight as the fourth limb sweeps the camera.
  if(s<0){const load=a.sweepLift,cut=a.slash;
   paw[0]=lerp(paw[0],-1.47+2.8*cut,load);paw[1]+=load*(.92+.33*a.arc);paw[2]+=load*(.04+.85*a.arc);
   elbow[0]-=(.34-.98*cut)*load;elbow[1]+=.39*load;elbow[2]+=.32*load*a.arc;
  }else{paw[0]+=.21*a.sweepLift;elbow[0]+=.13*a.sweepLift;}
 }
 if(q.pose==='split'){
  const lift=Math.sin(q.t*Math.PI),open=clamp((q.t-.18)/.45);
  // The rear legs brace the body; the front talons pull low across the body on the tear.
  paw[0]=s*(.26+1.05*open);paw[1]=1.14+.43*lift;paw[2]=1.23-.12*open;
  elbow[0]+=s*.28*open;elbow[1]+=.29*lift;elbow[2]+=.36;
 }
 if(a.vault){paw[0]+=s*(.53+.56*a.fan)*a.fold;paw[1]+=a.fold*(1+.69*a.stroke);paw[2]-=a.fold*(.34+.24*a.stroke);elbow[1]+=.46*a.fold;}
 if(a.sky){const drift=a.wave(s*.83);paw[1]+=.11*drift*a.fan;paw[2]+=(s<0?.28:-.17)*a.fan;elbow[1]+=.087*drift*a.fan;}
 if(a.plunge){paw[0]+=s*.26*a.plunge;paw[1]-=.10*a.plunge;paw[2]+=.85*a.plunge;elbow[2]+=.43*a.plunge;}
 if(base)[elbow,paw].forEach((v,k)=>put(v,v.map((n,j)=>lerp(base[k][j],n,r.low))));
}
export function isWatchingPose(k){return k==='watch'||k==='idle'||k==='tetherTell'||k==='tetherPull';}
const highZones=[[.02,3.50,.33,.35,.39,.32],[-.66,1.71,.14,.25,.66,.30],[.64,1.72,.12,.23,.66,.29],[0,2.05,-.06,.52,.74,.29]];
const lowZones=[[.01,1.51,1.13,.38,.40,.41],[-.56,.81,.45,.26,.66,.36],[.56,.82,.45,.26,.67,.36],[0,1.18,-.03,.49,.48,.99]];
export function fallbackGreyZones(pose,standing=isWatchingPose(pose)?1:0){
 if(standing<=0)return lowZones;
 if(standing>=1)return highZones;
 return lowZones.map((zone,i)=>zone.map((n,j)=>lerp(n,highZones[i][j],standing)));
}
