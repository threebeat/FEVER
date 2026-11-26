const tau=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const u=clamp(n);return u*u*(3-2*u);};
const across=(t,lo,hi)=>ease((t-lo)/(hi-lo));

// A command has its own one-shot clock. The independent muscle clock keeps a held command alive.
export function greyAction(q){
 const {pose,t}=q,live=1-q.fall,clock=Number.isFinite(q.writhe)?q.writhe:t;
 const phase=clock*tau,wave=(lag=0)=>live*(.66*Math.sin(phase-lag)+.34*Math.sin(phase*3-lag*1.7+.53));
 const sweeping=pose==='sweepTell'||pose==='sweep',sweep=pose==='sweep';
 const sweepLift=pose==='sweepTell'?across(t,.03,.91):sweep?1-across(t,.62,1):0;
 const slash=sweep?across(t,.13,.64):0,arc=Math.sin(Math.PI*slash);
 const tethering=pose==='tetherTell'||pose==='tetherPull',pull=pose==='tetherPull';
 const tether=pose==='tetherTell'?across(t,.04,.88):pull?1-across(t,.82,1):0;
 const reach=pull?across(t,.05,.25)*(1-across(t,.37,.76)):0;
 const haul=pull?across(t,.31,.61)*(1-across(t,.76,1)):0;
 const scream=pose==='screech'?across(t,.10,.37)*(1-across(t,.69,.99)):0;
 const inhale=pose==='screech'?across(t,0,.16)*(1-across(t,.17,.39)):0;
 const flee=pose==='flee'?1:0,vault=pose==='vault'?1:0;
 const rise=pose==='skyRise',hover=pose==='skyHang',drop=pose==='skyFall',land=pose==='skyLand';
 const sky=rise||hover||drop||land;
 const fold=sky?(rise?across(t,0,.33):hover?1:drop?1-.7*across(t,.2,.85):.3*(1-across(t,0,.32))):vault*across(t,0,.32);
 const stroke=sky?(rise?Math.sin(tau*(t*1.5+.12)):hover?.24+.25*Math.sin(tau*t):drop?.32-.96*t:-.64*(1-t)):vault*Math.sin(tau*(t*1.32-.06))*across(t,0,.20);
 const fan=sky?(rise?across(t,.08,.4):hover?.94:drop?1-.92*across(t,.07,.55):.17*(1-t)):vault*across(t,0,.21)*(1-.57*across(t,.67,.96));
 const plunge=drop?across(t,.05,.86):land?1-across(t,.01,.60):0;
 const swing=sweepLift*(2*slash-1),set=sweepLift*(1-slash);
 return {phase,wave,live,active:sweeping||tethering||pose==='screech'||!!flee||!!vault||sky,
  sweepLift,slash,arc,swing,set,tether,reach,haul,scream,inhale,flee,vault:vault||sky,sky,fold,stroke,fan,plunge,pull,t};
}

function guide(point,goal,amount){
 for(let k=0;k<3;k++)point[k]+=(goal[k]-point[k])*amount;
}

// Shoulder, elbow and palm have separate tracks: the elbow leads the backhand, while each
// elbow recoils before its palm in the haul. Absolute targets are in metres relative to the actor.
export function poseGreyArm(s,a,elbow,paw){
 const left=s<0;
 if(a.sweepLift){
  const f=a.slash;
  if(left){
   guide(elbow,[-1.03+.82*f,2.58-.67*f,-.41+.72*f+.74*a.arc],a.sweepLift);
   guide(paw,[-1.40+2.23*f,2.35-.90*f+.13*a.arc,-.24+.85*f+1.24*a.arc],a.sweepLift);
  }else{
   guide(elbow,[.64+.21*f,1.76+.21*f,.10-.32*f],a.sweepLift);
   guide(paw,[.42+.58*f,.85+.08*f,.60-.45*f],a.sweepLift);
  }
 }
 if(a.tether){
  let extension=a.reach,closing=a.haul;
  if(a.pull){
   const t=a.t,lag=left?0:.065;
   extension=across(t,.05+lag,.25+lag)*(1-across(t,.37+lag,.68+lag));
   closing=across(t,.30+lag,.57+lag)*(1-across(t,.72+lag,.98));
  }
  guide(elbow,[s*(.90-.25*extension+.11*closing),2.00-.14*extension+.25*closing,.13+.69*extension-.30*closing],a.tether);
  guide(paw,[s*(.48-.29*extension-.14*closing),1.89+.15*extension+.41*closing+(left?.065:-.035),.80+.64*extension-.45*closing],a.tether);
 }
 if(a.inhale){
  guide(elbow,[s*.64,1.83,-.15],.58*a.inhale);
  guide(paw,[s*.33,1.19,.44],.79*a.inhale);
 }
 if(a.scream){
  guide(elbow,[s*1.04,(left?2.07:1.93),-.22],a.scream);
  guide(paw,[s*1.32,(left?2.72:2.46),.18+left*.16],a.scream);
 }
 if(a.vault){
  guide(elbow,[s*(1.06+.20*a.fan),2.44+.73*a.stroke,-.33],a.fold);
  guide(paw,[s*(1.75+.44*a.fan),2.06+1.30*a.stroke,-.46+.25*a.stroke],a.fold);
 }
 if(a.plunge){
  guide(elbow,[s*.82,1.67,.55],a.plunge);
  guide(paw,[s*.70,.64,1.56],a.plunge);
 }
 if(a.flee){elbow[2]-=.19;paw[0]+=s*.09;}
 const shake=a.wave(left?3.7:1.8);
 paw[0]+=s*(.018+.028*a.scream)*shake;paw[2]+=.014*a.wave(left?1.15:2.83);
}
