import {fieldRecorder} from './fever-kit.js';
import {buildNailer} from './alder-nailer.js';
import {brushBlade} from './brush-blade.js';
import {buildFarmArm} from './farm-arms.js';
// First-person models use camera-space metres and authored finishes under the shared light rig.
import {reloadMotion as handling} from './reload-motion.js';
import { cross, norm } from '../js/mesh.js';

import {TAU,paint,clamp,smooth,between,plus,scaled,difference,finish,quad,polygon,strips,rim,limb,bevel,slimBevel,hull,box,sidePlate,linked,mapped,dieStamp,screw,boreFace,backCap,fieldLayer} from './armory-shapes.js';
import {breakerReceiver,receiverTrace,launcherBody,launcherSupport,masonHammer,hammerSupport} from './response-tools.js';
import {sportingArm,sportingSupport,sportingBoltGrip,hingedPoint,shotgunSide} from './sporting-arms.js';

const weapons = {
  nailgun:{hip:[.247,-.217,-.425],adsZ:-.445,sight:.139,front:-.228,rear:.048,muzzle:[0,.054,-.30],yaw:.19,pitch:.09,kick:.088,packZ:-.10},
  machinegun:{hip:[.269,-.252,-.428],adsZ:-.46,sight:.138,front:-.553,rear:.061,muzzle:[0,.053,-.729],yaw:.175,pitch:.092,kick:.137,packZ:-.13},
  flamethrower:{hip:[.24,-.216,-.446],adsZ:-.46,sight:.10,front:-.51,rear:.049,muzzle:[0,.049,-.678],yaw:.16,pitch:.072,kick:.021,packZ:-.147},
  launcher:{hip:[.254,-.246,-.451],adsZ:-.47,sight:.153,front:-.454,rear:.071,muzzle:[0,.051,-.535],yaw:.19,pitch:.11,kick:.222,packZ:-.08},
  sledge:{hip:[.245,-.275,-.54],adsZ:-.50,sight:.08,front:-.49,rear:.10,muzzle:[-.098,.337,-.43],yaw:.05,pitch:-.06,kick:0,packZ:0},
  doublebarrel:{sporting:true,hip:[.238,-.222,-.433],adsZ:-.463,sight:.086,front:-.708,rear:.012,
    muzzle:[0,.051,-.728],yaw:.19,pitch:.077,kick:.252,packZ:0},
  rifle:{sporting:true,hip:[.248,-.226,-.435],adsZ:-.453,sight:.100,front:-.651,rear:-.198,
    muzzle:[0,.052,-.699],yaw:.185,pitch:.086,kick:.178,packZ:-.066},
  pistol:{hip:[.244,-.209,-.421], adsZ:-.432, sight:.099, front:-.185, rear:.052,
    muzzle:[0,.051,-.233], yaw:.220, pitch:.090, kick:.267, packZ:.092},
  carbine:{hip:[.255,-.235,-.418], adsZ:-.432, sight:.127, front:-.457, rear:.089,
    muzzle:[0,.054,-.627], yaw:.192, pitch:.106, kick:.115, packZ:-.116},
  breaker:{hip:[.267,-.247,-.426], adsZ:-.450, sight:.134, front:-.361, rear:.098,
    muzzle:[0,.045,-.518], yaw:.230, pitch:.128, kick:.217, packZ:-.119},
  flare:{hip:[.242,-.200,-.416], adsZ:-.419, sight:.116, front:-.193, rear:.029,
    muzzle:[0,.053,-.221], yaw:.226, pitch:.096, kick:.307, packZ:.035},
  sensor:{instrument:true,hip:[.225,-.19,-.47],adsZ:-.44,sight:.10,front:-.09,rear:.10,
    muzzle:[0,.12,-.10],yaw:.18,pitch:.16,kick:0,packZ:0},
  coil:{instrument:true,hip:[.224,-.202,-.46],adsZ:-.46,sight:.09,front:-.23,rear:.09,
    muzzle:[0,.055,-.255],yaw:.18,pitch:.09,kick:0,packZ:0},
  machete:{hip:[.246,-.222,-.465],adsZ:-.55,sight:.078,front:-.014,rear:.060,muzzle:[-.026,.441,-.012],yaw:.19,pitch:-.22,kick:0,packZ:0},
  knife:{hip:[.260,-.188,-.444], adsZ:-.432, sight:.078, front:-.014, rear:.060,
    muzzle:[-.022,.225,.018], yaw:.16, pitch:-.14, kick:0, packZ:0}
};
const weaponKey = id => Object.hasOwn(weapons,id)?id:'pistol';
// Place cloth features on the same moving surface as the sleeve. These share the underlying
// ring vertices, so the pattern follows the wrist through recoil and the reach animation.
function panelPoint(rings,rows,j,k,u,v,raise){
  const a=rings[j],b=rings[j+1],next=(k+1)%a.length;
  const center=between(rows[j][0],rows[j+1][0],v);
  const point=between(between(a[k],a[next],u),between(b[k],b[next],u),v);
  return plus(point,scaled(norm(difference(point,center)),raise));
}
export function buildFieldSleeve(m,rows,sides){
  if(!m.lowDetail)sides+=4;
  const rings=limb(m,rows,sides,8,false,true),p=paint;
  for(let j=0;j<Math.min(2,rows.length-1);j++){
    for(let k=0;k<sides;k++){
      if(m.lowDetail&&(j||k%2===0))continue;
      const at=(u,v,h=.0008)=>panelPoint(rings,rows,j,k,u,v,h);
      const v=.13+.13*((k*5+j*2)%3);
      polygon(m,[at(.04,v),at(.42,v+.04),at(.48,v+.11),at(.83,v+.12),at(.92,v+.29),at(.25,v+.23)],(k+j)%2?p.twill:p.webDark,8);
      if((k+j)%3===1)quad(m,at(.15,.73),at(.65,.61),at(.84,.64),at(.31,.78),p.web,8);
      if(j||k%3!==0)continue;
      quad(m,at(.04,.05),at(.095,.06),at(.12,.92),at(.06,.92),p.stitch,8);
    }
  }
  if(m.lowDetail)return;
  const j=Math.min(1,rows.length-2);
  for(let k=0;k<sides;k+=2){
    const at=(u,v,h)=>panelPoint(rings,rows,j,k,u,v,h);
    quad(m,at(.04,.64,.001),at(.92,.38,.001),at(.86,.44,.0055),at(.09,.67,.004),p.twill,8);
    quad(m,at(.09,.67,.004),at(.86,.44,.0055),at(.69,.55,.001),at(.19,.70,.001),p.webDark,8);
  }
}
function glovePanel(m,rows,sides,side){
  if(!m.lowDetail)sides+=3;
  const rings=limb(m,rows,sides),p=paint;
  if(m.lowDetail)return;
  const facing=[side*.46,.34,.82],lo=rings[0],center=rows[0][0];
  let best=0,score=-Infinity;
  for(let k=0;k<sides;k++){
    const n=norm(difference(between(lo[k],lo[(k+1)%sides],.5),center)),dot=n.reduce((v,x,i)=>v+x*facing[i],0);
    if(dot>score){score=dot;best=k;}
  }
  for(const k of [(best+sides-1)%sides,best,(best+1)%sides]){
    for(let j=0;j<rows.length-1;j++){
      const at=(u,v,h=.0008)=>panelPoint(rings,rows,j,k,u,v,h);
      const end=j===rows.length-2?.84:1;
      polygon(m,[at(.07,.04),at(.76,.015),at(.95,.31),at(.86,end),at(.20,end),at(.06,.60)],j?p.gloveFold:p.leather,8);
      quad(m,at(.11,.13,.0011),at(.169,.18,.0011),at(.171,.50,.0011),at(.116,.48,.0011),p.stitch,8);
      if(j===0)quad(m,at(.16,.66,.0011),at(.67,.59,.0011),at(.72,.65,.0011),at(.20,.74,.0011),p.wax,8);
      if(j===rows.length-2){
        const oval=[[.15,.25],[.27,.14],[.70,.13],[.83,.27],[.83,.52],[.66,.66],[.30,.65],[.14,.52]];
        const outside=oval.map(([u,v])=>at(u,v,.0015)),top=oval.map(([u,v])=>at(.49+(u-.49)*.83,.39+(v-.39)*.82,.0048));
        for(let n=0;n<oval.length;n++){const next=(n+1)%oval.length;quad(m,outside[n],outside[next],top[next],top[n],p.gloveFold,9);}
        // A convex knuckle guard rolls a highlight as the wrist turns. Its two
        // raised ribs read through the flashlight without a painted outline.
        const crown=at(.49,.37,.0076);
        for(let n=0;n<top.length;n++)m.tri(top[n],top[(n+1)%top.length],crown,p.rubber,7);
        for(const v of [.28,.47])quad(m,at(.31,v,.0065),at(.66,v-.02,.0065),at(.65,v+.035,.0077),at(.32,v+.055,.0077),p.seal,7);
      }
    }
  }
}
const palmSeam=[.205,.221,.197];
// Each fingertip closes over a rounded pad. Leave the root open where it enters the palm.
function finger(m,rows,sides=5){
  if(!m.lowDetail)sides+=3;
  const rings=limb(m,rows,sides,finish.leather,false,true),k=rows.length-1,base=rows[k][0];
  const axis=norm(difference(base,rows[k-1][0])),radius=(rows[k][1]+rows[k][2])*.5,last=rings[k];
  const tip=plus(base,scaled(axis,radius*.72));
  if(m.lowDetail){for(let i=0;i<sides;i++)m.tri(last[i],last[(i+1)%sides],tip,paint.leather,finish.leather);return;}
  for(let j=1;j<rows.length-1;j++){
    const joint=rows[j][0],prev=rows[j-1][0],next=rows[j+1][0],arc=rings[j];
    // Raised seams across the finger joints bend with the glove.
    for(let k=0;k<Math.min(4,sides-1);k++){
      const l=k+1,c=scaled(difference(arc[k],joint),1.045),e=scaled(difference(arc[l],joint),1.045);
      quad(m,plus(between(joint,prev,.058),c),plus(between(joint,prev,.058),e),plus(between(joint,next,.034),e),plus(between(joint,next,.034),c),palmSeam,9);
    }
  }
  const pad=last.map(v=>plus(plus(base,scaled(difference(v,base),.68)),scaled(axis,radius*.46)));
  for(let i=0;i<sides;i++){const j=(i+1)%sides;quad(m,last[i],last[j],pad[j],pad[i],paint.glove,finish.leather);
    m.tri(pad[i],pad[j],tip,paint.leather,finish.leather);}
}
// The wrist instrument has a protected glass face and a needle coupled to the already
// simulated spectrum/possession state. Its housing and strap travel with the forearm.
export function buildWristMeter(m,fore,wrist,pose={}){
  const p=paint,axis=difference(fore,wrist);
  if(Math.hypot(...axis)<.00001)return;
  const along=norm(axis),upHint=[-.51,.70,.52],parallel=Math.abs(along.reduce((value,v,i)=>value+v*upHint[i],0))>.94;
  const across=norm(cross(along,parallel?[1,0,0]:upHint)),up=cross(across,along);
  const center=between(fore,wrist,.57);
  const at=(x,y,z)=>plus(center,plus(scaled(across,x),plus(scaled(along,y),scaled(up,z))));
  const plate=(x0,y0,x1,y1,z,col,mat=8)=>quad(m,at(x0,y0,z),at(x1,y0,z),at(x1,y1,z),at(x0,y1,z),col,mat);
  for(const s of [-1,1])quad(m,at(s*.028,-.014,.048),at(s*.052,-.014,.031),at(s*.052,.014,.031),at(s*.028,.014,.048),p.webDark,8);
  const shape=[[-.021,-.034],[.021,-.034],[.033,-.023],[.033,.020],[.022,.031],[-.022,.031],[-.033,.020],[-.033,-.023]];
  const edge=shape.map(([x,y])=>at(x,y,.052)),bezel=shape.map(([x,y])=>at(x*.86,y*.90,.063));
  strips(m,[edge,bezel],[p.dark,p.blued],5,false);polygon(m,bezel,p.blued,5);
  plate(-.024,-.014,.024,.021,.0634,p.oxide,7);plate(-.021,-.011,.021,.018,.064,p.enamel,10);
  // Tinted edge and a narrow bevel leave the printed dial visible through the bezel.
  quad(m,at(-.023,-.011,.064),at(-.019,-.008,.066),at(-.018,.016,.066),at(-.022,.020,.064),p.glass,6);
  quad(m,at(-.022,.020,.064),at(-.018,.016,.066),at(.016,.016,.066),at(.021,.020,.064),p.steelEdge,6);
  for(let i=0;i<5;i++){
    const a=(-57+i*28)*Math.PI/180,x=Math.sin(a),y=Math.cos(a),col=i===4?p.orangeShade:p.dark;
    quad(m,at(.018*x-.001,-.009+.020*y,.0647),at(.018*x+.001,-.009+.020*y,.0647),
      at(.014*x+.0006,-.009+.016*y,.0647),at(.014*x-.0006,-.009+.016*y,.0647),col,5);
  }
  const angle=-.71+(pose.uv?.35:0)+1.11*(pose.resist||0)+.22*(pose.travel||0);
  m.tri(at(-.0017,-.008,.065),at(.0017,-.008,.065),at(Math.sin(angle)*.017,-.008+Math.cos(angle)*.020,.065),p.signal,5);
  plate(-.014,-.026,.006,-.021,.0635,p.steel,5);
  plate(.010,-.026,.016,-.021,.0636,pose.uv?p.uv:p.active,pose.uv?12:5);
}
// The chest harness moves below the eye line. Holding a sight picture fully settles the
// independent hand lag, so turning or strafing cannot move the sight off the firing ray.
export function bodycamMountOffset(s){
  const falling=clamp((s.deathFx?.age||0)/.79);
  const possessed=clamp(s.possession?.progress||0),intrusion=smooth(.28,.98,possessed),aim=clamp(s.aim);
  const approach=s.intro?1-smooth(.66,.98,(s.intro.age||0)/Math.max(.01,s.intro.duration||1)):0;
  const lifted=s.levitation?.target&&s.levitation.target!=='operator'?0:clamp((s.levitation?.height||0)/1.8);
  if(s.motion===false)return [0,-falling*.58-(1-aim)*approach*.071,0];
  const hip=(1-clamp(s.aim))**1.4,run=s.runBlend||0,time=s.time||0;
  const stride=s.footCycle||0,pace=Math.min(1,Math.hypot(s.speedX||0,s.speedZ||0)/4.1);
  const landing=(.5-.5*Math.cos(2*stride))**2,breath=Math.sin(time*1.37+.4),alien=intrusion*Math.sin(time*2.1+1.7);
  return [
    hip*(-.25*(s.turnLag||0)+(s.sway||0)*(.009+.009*run)+.0008*breath+alien*.009+approach*Math.sin(time*16)*.0012)+falling*.048,
    hip*(-.17*(s.tiltLag||0)+pace*(.003-.009*landing)*(1+run)+.0016*breath-.073*approach+lifted*(.014+.004*breath)-.021*intrusion)-.58*falling,
    hip*(pace*Math.sin(2*stride-.30)*(.002+.005*run)+breath*.001)
  ];
}
function exchangePose(id,t) {
 const h=handling[id]||handling.pistol;
 const work=smooth(0,.21,t)*(1-smooth(h.recover,1,t));
 const support=smooth(.015,h.release,t)*(1-smooth(h.recover,.99,t));
 const search=smooth(h.release-.05,h.approach-.035,t)*(1-smooth(h.approach,h.seated-.045,t));
 const seat=Math.sin(Math.PI*smooth(h.seated-.035,h.seated+.105,t));
 const follow=Math.sin(Math.PI*smooth(h.seated+.053,h.recover+.06,t));
 return {work,support,search,seat,follow,h};
}
function poseFor(id,options) {
  const spec=weapons[id],recoil=clamp(options.recoil),reload=clamp(options.reload),aim=clamp(options.aim);
  const variant=(options.shotVariant||0)%3-1,sidearm=id==='pistol'||id==='flare';
  // Mechanical travel snaps back first. The wrists finish a little later and settle below rest.
  const recoilAge=1-recoil,travel=recoil>0?1-smooth(.045,.70,recoilAge):0;
  const settle=recoil>0?Math.sin(Math.PI*smooth(.45,1,recoilAge))*.15:0;
  const lift=recoil>0?Math.max(0,1-smooth(.10,.80,recoilAge))-settle:0;
  const weight=clamp(options.reloadWeight??1);
  const motion=exchangePose(id,reload),{search,h}=motion;
  const work=motion.work*weight,support=motion.support*weight,seat=motion.seat*weight,follow=motion.follow*weight;
  const sprint=clamp(options.sprint)*(1-aim)*(1-travel),swap=clamp(options.swap)*(1-aim)*(1-travel);

  const action=options.action||'',progress=clamp(options.grip);
  const trespass=clamp(options.possession),resist=smooth(.14,.88,trespass),entry=clamp(options.intro);
  const rope=smooth(.405,.535,entry)*(1-smooth(.78,.90,entry));
  const reach=action?smooth(0,.34,progress)*(1-smooth(.58,1,progress)):0;
  const ads=spec.instrument?[.095,-.135,spec.adsZ]:id==='sledge'?[.151,-.210,spec.adsZ]:(id==='knife'||id==='machete')?[.150,-.119,spec.adsZ]:[0,-spec.sight,spec.adsZ];
  const anchor=between(spec.hip,ads,aim);
  // Moving the prop out of the lens during an exchange also works with the aim input held.
  const sightBreak=work*aim;
  anchor[0]+=.09*sightBreak;anchor[1]-=.042*sightBreak;
  let bank=-.055*(1-aim)+(.014*variant-.068)*lift+h.roll*work-.035*seat+.014*follow+.42*sprint+.49*swap;
  let tilt=spec.pitch*(1-aim)+spec.kick*lift-(sidearm?.095:.125)*work+.042*seat-.015*follow-.27*sprint-.54*swap;
  let yaw=spec.yaw*(1-aim)+h.turn*work+.53*sprint+.17*swap+.017*variant*lift;
  const swing=clamp(options.swing),side=options.side===-1?-1:1;
  if(id==='knife'||id==='machete'){
    const wind=smooth(0,.15,swing)*(1-smooth(.15,.40,swing));
    const follow=smooth(.15,.42,swing)*(1-smooth(.55,.89,swing));
    const recover=Math.sin(Math.PI*smooth(.61,1,swing));
    const extend=Math.sin(Math.PI*smooth(.10,.77,swing));
    anchor[0]+=(side<0?-.222:.085)*wind+(side<0?.12:-.361)*follow+recover*(side<0?-.021:.026);
    anchor[1]+=(side<0?.015:.056)*wind+(side<0?.081:.048)*follow-.017*recover;
    anchor[2]+=.038*wind-.182*extend+.018*recover;
    bank+=(id==='machete'?.14+.03*aim:.48+.25*aim)+(side<0?.69:-.77)*wind+(side<0?-.86:.92)*follow+(side<0?.10:-.12)*recover;
    tilt+=-.05*aim+(side<0?-.18:.29)*wind+(side<0?.23:-.24)*follow;
    yaw+=.055*aim+(side<0?.53:-.25)*wind+(side<0?-.43:.64)*follow;
  }
  if(id==='machete'){
    // Carry from the elbow with the cutting edge outboard. The longer blade
    // stays forward even when the arm lowers for a run.
    bank-=.46*sprint;tilt+=.17*sprint-.23*(1-aim);yaw-=.50*sprint;
    anchor[0]-=.045*sprint;anchor[1]+=.055*sprint;
  }
  if(id==='sledge'){
    const charge=smooth(0,.27,swing)*(1-smooth(.27,.49,swing)),drive=smooth(.23,.50,swing)*(1-smooth(.61,.97,swing));
    const rise=smooth(.10,.29,swing)*(1-smooth(.32,.59,swing));
    anchor[0]+=side*(.128*charge-.34*drive);anchor[1]+=.082*rise-.073*drive;
    anchor[2]+=.080*charge-.182*drive;tilt-=.71*charge-.84*drive;
    bank+=side*(.69*charge-.95*drive);yaw+=side*(.33*charge-.57*drive);
  }
  // The glove leaves the fore-end and braces against the recorder. The barrel falls clear.
  const skid=clamp(options.slide)*(1-aim)*(1-travel);
  bank-=.24*skid;tilt+=.067*skid;yaw-=.092*skid;
  anchor[0]-=.034*skid;anchor[1]-=.050*skid;anchor[2]+=.011*skid;
  const lower=(1-aim)*smooth(.43,.97,trespass);
  anchor[0]+=.041*lower;anchor[1]-=.069*lower;bank+=.19*lower;tilt-=.12*lower;
  const free=(1-aim)*reach;
  bank+=free*.13;tilt-=free*.085;anchor[0]+=.038*free;anchor[1]-=.018*free;
  const cr=Math.cos(bank),sr=Math.sin(bank),cp=Math.cos(tilt),sp=Math.sin(tilt),cy=Math.cos(yaw),sy=Math.sin(yaw);
  const pivot=[0,-.078,.076];
  anchor[0]+=-.038*work+.025*sprint+.047*swap;
  anchor[1]+=.010*lift+h.lift*work*(1-.62*aim)+h.push*seat-.004*follow-.080*sprint-.39*swap;
  anchor[2]+=(sidearm?.047:.036)*travel-.028*work+.041*sprint+.073*swap;
  const transform=([x,y,z])=>{
    x-=pivot[0]; y-=pivot[1]; z-=pivot[2];
    const xx=x*cr-y*sr, yy=x*sr+y*cr, zz=yy*sp+z*cp;
    return [xx*cy+zz*sy+pivot[0]+anchor[0],yy*cp-z*sp+pivot[1]+anchor[1],zz*cy-xx*sy+pivot[2]+anchor[2]];
  };
  const localPoint=([x,y,z])=>{
    x-=anchor[0]+pivot[0];y-=anchor[1]+pivot[1];z-=anchor[2]+pivot[2];
    const xx=x*cy-z*sy, zz=z*cy+x*sy, yy=y*cp+zz*sp;
    return [xx*cr+yy*sr+pivot[0],-xx*sr+yy*cr+pivot[1],-y*sp+zz*cp+pivot[2]];
  };
  const exchanging=!options.returning;
  const loaded=Number.isFinite(options.loaded)?Math.round(options.loaded):options.empty?0:spec.sporting&&reload===0?2:0;
  const capacity=id==='doublebarrel'?2:4;
  const reloadCount=Number.isFinite(options.reloadCount)?Math.max(0,Math.round(options.reloadCount)):Math.max(0,capacity-loaded);
  return {transform,localPoint,loaded,reloadLoaded:options.reloadLoaded??loaded,reloadCount,boltCycle:clamp(options.boltCycle),recoil,travel,empty:!!options.empty,bolt:Math.max(travel,options.empty?(1-smooth(h.seated+.04,h.recover,exchanging?reload:0)):0),work,support,search,seat,aim,reload,exchanging,weight,sprint,swap,swing,side,reach,action,resist,trespass,rope,variant,helmet:!!options.helmet,uv:!!options.uv};
}

function grip(m) {
  const p=paint;
  limb(m,[[[0,-.006,.051],.036,.069,p.blued],[[0,-.032,.064],.033,.050,p.dark],
    [[0,-.091,.088],.027,.039,p.gloveFold],[[0,-.148,.105],.030,.039,p.blued]],6,5);
}
// Taken from the recovered tape model: fingers wind around the handle in separate articulated strips.
function firingHand(m,pose,boltGrip=null) {
  const p=paint;
  // The cuff follows the right hand to the bolt while the elbow stays at the body.
  if(boltGrip)m=mapped(m,v=>plus(v,scaled(boltGrip,smooth(-.28,-.106,v[1]))));
  const elbow=pose.localPoint([.370,-.343,-.196]);
  buildFieldSleeve(m,[[elbow,.088,.081,p.fatigues],[[.145,-.162,.184],.073,.065,p.fatigues],[[.103,-.117,.137],.063,.054,p.fatigues],
    [[.084,-.095,.115],.064,.054,p.cuff],[[.072,-.086,.105],.057,.049,p.gloveFold]],7);
  glovePanel(m,[[[.068,-.089,.111],.051,.048,p.gloveFold],[[.051,-.070,.083],.057,.047,p.glove],[[.044,-.049,.055],.043,.036,p.glove]],7,1);
  for(let i=0;i<3;i++){
    const y=-.066-i*.022,z=.056+i*.009;
    finger(m,[[[.058,y+.003,z+.015],.017,.018,p.glove],[[.028,y-.006,z-.014],.018,.017,p.glove],
      [[-.011,y-.004,z-.022],.017,.015,p.gloveFold],[[-.028,y+.002,z-.009],.011,.012,p.glove]],5);
  }
  const press=pose.travel,clear=pose.support;
  const hold=boltGrip?smooth(.006,.083,Math.hypot(...boltGrip)):0;
  const knuckle=between([.048+.010*clear,-.025+.013*clear,.024-.012*press],[.047,-.027,.054],hold);
  const fingertip=between([.035+.017*clear,-.012+.026*clear,-.045+.022*press-.009*clear],[.013,-.047,.040],hold);
  const index=[[[.054,-.044,.070],.020,.019,p.glove],[knuckle,.016,.016,p.glove]];
  if(hold>.005||(pose.stableMesh&&boltGrip))index.push([between(between(knuckle,fingertip,.48),[.021,-.031,.031],hold),.013,.013,p.glove]);
  index.push([fingertip,.012,.011,p.gloveFold]);finger(m,index,6);
  finger(m,[[[.049,-.053,.105],.023,.023,p.glove],[[.012,-.026,.100],.024,.023,p.glove],[[-.029,-.035,.072],.014,.015,p.gloveFold]],6);
  m.tri([.096,-.083,.112],[.071,-.063,.086],[.067,-.072,.095],p.stitch,8);
}
function supportHand(m,id,pose,packShift) {
  const p=paint,isPistol=id==='pistol'||id==='flare';
  const forward=weapons[id].sporting?-.302:id==='carbine'?-.292:-.253;
  const wristShift=id==='sledge'?hammerSupport():isPistol?[-.012*(1-pose.aim),-.012*(1-pose.aim),0]:[-.005,.031,forward];
  // Keep the cuff near the sleeve opening as the fingers travel forward or follow the moving cell.
  const cell=weapons[id].packZ;
  // The spare is fetched from a fixed point on the vest, below the camera. The hand
  // and prop then share a single moving grip point until contact.
  const handAtCell=[-.026,-.060,cell-.055];
  const workShift=id==='launcher'?launcherSupport(pose):weapons[id].sporting?sportingSupport(id,pose):id==='flare'?
    difference(flareShell(pose),[-.006,-.074,.052]):
    plus(handAtCell,packShift);
  const ready=between(wristShift,workShift,pose.support);
  const aid=pose.action==='aid'||pose.action==='bandage',gripRope=pose.rope*(1-pose.resist)*(1-pose.support);
  const reach=Math.max(pose.reach*(1-pose.support),pose.resist,gripRope);
  const task=aid?[-.102,-.223,-.545]:[-.113,-.093,-.640];
  const resisting=[-.171-.032*pose.trespass,-.056+.077*pose.trespass,-.442+.049*pose.trespass];
  const taskPoint=between(task,resisting,pose.resist);
  const target=pose.localPoint(between(taskPoint,[-.192,.046,-.448],gripRope));
  const move=between(ready,difference(target,[-.056,-.087,.059]),reach);
  const commonSleeve=between([-.179,-.185,.153],[-.186,-.237,.137],pose.support);
  const sleeveStart=between(commonSleeve,pose.localPoint([-.223,-.216,-.313]),Math.max(pose.resist,gripRope));
  const place=p=>{
    const normal=plus(p,move);
    if(!pose.resist)return normal;
    const [x,y,z]=difference(p,[-.056,-.087,.059]);
    const palm=pose.localPoint([resisting[0]+x*.86+y*.17,resisting[1]-z*.91+y*.25,resisting[2]+y*.90+z*.21]);
    return between(normal,palm,pose.resist);
  };
  const wrap=(rows,sides=5)=>finger(m,rows.map(([v,w,d,color])=>[place(v),w,d,color]),sides);
  const elbow=pose.localPoint([-.238,-.382,-.213]);
  const wrist=place([-.083,-.106,.084]),movingFore=between(elbow,wrist,.53);
  movingFore[0]-=.013;movingFore[1]-=.014;
  const elbowFold=between(sleeveStart,between(elbow,wrist,.30),pose.support);
  const fore=between(between(sleeveStart,place([-.092,-.112,.09]),.53),movingFore,pose.support);
  buildFieldSleeve(m,[[elbow,.084,.080,p.fatigues],[elbowFold,.073,.068,p.fatigues],[fore,.060,.056,p.fatigues],
    [wrist,.057,.050,p.cuff],[place([-.071,-.100,.078]),.051,.043,p.gloveFold]],6);
  glovePanel(m,[[place([-.072,-.102,.078]),.044,.043,p.gloveFold],[place([-.056,-.087,.059]),.049,.046,p.glove],[place([-.033,-.075,.042]),.037,.032,p.glove]],6,-1);
  buildWristMeter(m,fore,wrist,pose);
  for(let i=0;i<4;i++){
    const y=-.073-i*.017,z=.042+i*.0085,rad=.014-i*.0009;
    const open=Math.max(reach*(1-gripRope),pose.search*pose.weight*(1-smooth(.28,.45,pose.reload))*.64),spread=(1.5-i)*open*.011,extend=[1,.98,.83,.64][i];
    const joint=[-.025-.008*open,y-.011+.010*open,z-.010-.019*open];
    wrap([[[-.050,y,z+.020],rad+.001,rad,p.glove],[joint,rad+.001,rad,p.glove],
      [[.002-.020*open,y-.014+.013*open+spread*.5,z-.016-.041*open*extend],rad,rad-.001,p.leather],
      [[.011-.031*open,y-.008+.021*open+spread,z-.012-.070*open*extend],rad*.74,rad*.73,p.gloveFold]]);
  }
  wrap([[[-.051,-.083,.088],.018,.019,p.glove],[[-.047,-.048,.070],.018,.017,p.glove],[[-.041-.012*reach,-.027+.009*reach,.041-.014*reach],.011,.011,p.gloveFold]]);
}
// Tangent breaks carry a narrow moving reflection along the slide shoulders.
// Keep the straight top edge as the final segment so the breech can open.
const slideLeft=[[-.71,1],[-.785,.985],[-.87,.91],[-.955,.798],[-.991,.724],[-1,.654],[-1,-.61],[-.973,-.71],[-.854,-.877],[-.745,-.975],[-.68,-1]];
const slideProfile=[...slideLeft,...slideLeft.slice().reverse().map(([x,y])=>[-x,y])];
function pistol(m,pose) {
  const p=paint,travel=.035*pose.bolt;
  const slide=mapped(m,v=>[v[0],v[1],v[2]+travel]);
  const rows=[[-.230,.052,.032,.029,p.steel],[-.224,.052,.037,.034,p.blued],[-.213,.051,.039,.035,p.slide],
    [-.116,.050,.040,.035,p.slide],[-.041,.050,.040,.035,p.slide],[.043,.047,.041,.036,p.slide],
    [.064,.047,.039,.034,p.blued],[.071,.047,.033,.029,p.steel]];
  const profile=m.lowDetail?bevel:slideProfile,n=profile.length;
  const rings=rows.map(([z,y,w,h])=>profile.map(([u,v])=>[u*w,y+v*h,z]));
  for(let k=1;k<rings.length;k++)for(let i=0;i<n;i++){
    if(k===4&&i===n-1)continue;
    const j=(i+1)%n;quad(slide,rings[k-1][i],rings[k-1][j],rings[k][j],rings[k][i],rows[k-1][4],5);
  }
  polygon(slide,rings[0].slice().reverse(),p.steel,5);polygon(slide,rings.at(-1),p.steel,5);
  // The cutout has its own shadowed walls. The curved, fixed insert becomes visible as the slide moves.
  const edge=[[-.0284,.085,-.116],[.0284,.085,-.116],[.0284,.085,-.041],[-.0284,.085,-.041]];
  const inside=edge.map(([x,y,z])=>[x*.76,y-.008,z+(z<-.08?.004:-.004)]);
  for(let i=0;i<4;i++){const j=(i+1)%4;quad(slide,edge[i],edge[j],inside[j],inside[i],i===0?p.blued:p.dark,5);}
  polygon(slide,inside,p.oxide,5);
  const shoulders=[[-.020,.078],[-.012,.083],[.012,.084],[.021,.079]];
  for(let i=1;i<shoulders.length;i++){
    const [a,b]=[shoulders[i-1],shoulders[i]];
    quad(m,[a[0],a[1],-.108],[b[0],b[1],-.108],[b[0],b[1],-.052],[a[0],a[1],-.052],i===2?p.steel:p.blued,5);
  }
  backCap(slide,.047,.0714,.032,.027);
  for(const s of [-1,1]){
    sidePlate(slide,s,.0408,[[.041,-.050],[.039,.019],[.047,.026],[.052,-.047]],s>0?p.blued:p.steel);
    for(let k=0;k<3;k++){
      const z=.028+.008*k;
      sidePlate(slide,s,.0409,[[.046,z],[.062,z+.004],[.059,z+.007]],p.dark);
    }
  }
  // Separate the dark molded frame from the steel slide. The inset panel and worn
  // upper corners stay on the slide as it travels past the stationary lower silhouette.
  hull(m,[[-.203,.006,.030,.012,p.oxide],[-.179,.002,.034,.018,p.dark],[-.081,.001,.035,.019,p.dark],
    [-.056,-.004,.040,.024,p.rubber],[.043,-.004,.040,.023,p.blued],[.079,.001,.033,.015,p.dark]],slimBevel);
  for(const s of [-1,1]){
    sidePlate(m,s,.0356,[[-.007,-.179],[-.008,-.096],[.001,-.087],[.003,-.177]],m.lowDetail?p.gloveFold:p.rubber);
    sidePlate(slide,s,.0415,[[.048,.026],[.073,.023],[.075,.029],[.050,.033]],p.oxide);
    screw(m,s,.0407,-.003,-.046,.006);
    const h=.063;
    quad(slide,[s*.037,h,-.191],[s*.036,h+.004,-.177],[s*.036,h+.004,-.113],[s*.037,h,-.117],p.steelEdge,5);
  }
  for(let j=0;j<4;j++){
    const z=.010+j*.007;
    quad(slide,[-.026,.0853,z],[-.017,.0853,z+.002],[.024,.0853,z+.002],[.026,.0853,z],p.blued,5);
  }
  dieStamp(slide,[-.0409,.046,-.161],[0,0,1],[0,1,0],.014,'P-7',p.enamel);
  hull(m,[[-.233,.052,.021,.021,p.dark],[-.22,.052,.024,.023,p.slide],[-.115,.052,.022,.022,p.blued]],rim(6));
  boreFace(m,0,.052,-.2332,.020,.67,7);
  const loop=[[-.073,-.024],[-.068,-.049],[-.048,-.070],[-.018,-.076],[.039,-.064]];
  linked(m,loop.map(([z,y])=>[0,y,z]),.0065,p.blued);
  sight(m,'pistol',travel);
}
function stock(m,id) {
  const p=paint,isCarbine=id==='carbine';
  const cap=isCarbine?.251:.220, y=isCarbine?.046:.033;
  const skin=isCarbine?p.sand:p.umber;
  hull(m,[[.103,y,.032,.026,p.blued],[cap-.047,y-.053,.035,.026,skin],[cap-.014,y-.085,.040,.027,skin]],slimBevel,5,false);
  const rail=[[0,-.014,.115],[0,-.047,.151],[0,-.143,cap-.029],[0,-.150,cap-.005]];
  linked(m,rail,isCarbine?.012:.016,p.blued,5);
  if(m.lowDetail){
    box(m,0,-.106,cap,.086,.151,.022,p.dark);
    for(const off of [-.145,-.105,-.073]) {
      quad(m,[-.033,off,cap+.0114],[.033,off+.008,cap+.0114],[.033,off+.011,cap+.0114],[-.033,off+.003,cap+.0114],p.gloveFold,8);
    }
  }else{
    const shape=[[-.58,1],[-.89,.91],[-1,.62],[-.88,-.33],[-.68,-.88],[-.46,-1],[.46,-1],[.68,-.88],[.88,-.33],[1,.62],[.89,.91],[.58,1]];
    const at=(x,y,d)=>[x*.043,-.106+y*.077,cap+d-.0045*y*y];
    const rings=[[-.010,.88],[-.006,1],[.007,1],[.012,.87]].map(([d,k])=>shape.map(([x,y])=>at(x*k,y*k,d)));
    strips(m,rings,[p.dark,p.rubber,p.rubber],7);
    for(let i=-2;i<=2;i++)for(const side of [-1,1]){
      const y=i*.245,x=.69-.075*Math.abs(i);
      quad(m,at(side*.06,y-.045,.013),at(side*x,y+.085,.013),at(side*x,y+.14,.015),at(side*.06,y+.015,.017),p.seal,7);
    }
  }
  for(const s of [-1,1]){
    sidePlate(m,s,.038,[[-.070,cap-.089],[-.021,cap-.143],[-.001,cap-.159],[-.008,cap-.097],[-.061,cap-.022],[-.089,cap-.019]],skin);
    sidePlate(m,s,.0385,[[-.059,cap-.078],[-.025,cap-.113],[-.019,cap-.102],[-.059,cap-.052]],p.oxide);
    screw(m,s,.041,-.103,cap-.013,.005);
  }
}
function carbine(m,pose) {
  const p=paint;
  const tube=[[-.627,.054,.026,.024,p.blued],[-.609,.054,.029,.026,p.steel],
    [-.579,.054,.022,.020,p.dark],[-.523,.054,.020,.019,p.blued],[-.465,.054,.023,.025,p.slide]];
  hull(m,tube,rim(7));
  hull(m,[[-.477,.044,.039,.041,p.sand],[-.452,.048,.052,.048,p.sand],
    [-.190,.050,.056,.049,p.brown],[-.169,.049,.057,.052,p.slide],
    [.093,.047,.055,.054,p.slide],[.111,.046,.046,.046,p.blued]]);
  for(const s of [-1,1]){
    for(let j=0;j<4;j++){
      const z=-.424+j*.053;
      sidePlate(m,s,.0525+j*.0007,[[.056,z],[.068,z+.008],[.068,z+.033],[.055,z+.025]],p.dark);
    }
    sidePlate(m,s,.0566,[[.030,-.15],[.034,.049],[.060,.063],[.066,-.14]],p.dark);
    const travel=.054*pose.bolt;
    const visible=[[.040,-.122+travel],[.043,-.007+travel],[.057,.002+travel],[.061,-.122+travel]];
    sidePlate(m,s,.0574,visible,p.steel);
    sidePlate(m,s,.0574,[[.021,-.124],[.021,-.082],[.028,-.079],[.029,-.121]],p.paper);
  }
  for(let j=0;j<5;j++){
    const z=-.431+j*.046,y=.097+(.431+z)*.012;
    quad(m,[-.032,y,z],[-.025,y,z+.009],[.025,y,z+.009],[.032,y,z],p.dark,5);
  }
  boreFace(m,0,.054,-.6273,.025,.63,7);
  for(let j=0;j<7;j++){
    const z=-.413+j*.038,y=.098+(z+.415)*.017;
    quad(m,[-.028,y,z],[.028,y,z],[.030,y+.005,z+.005],[-.030,y+.005,z+.005],p.steel,5);
    quad(m,[-.030,y+.005,z+.005],[.030,y+.005,z+.005],[.030,y+.005,z+.016],[-.030,y+.005,z+.016],p.brown,5);
  }
  for(const s of [-1,1]){
    sidePlate(m,s,.0555,[[.019,-.432],[.019,-.236],[.031,-.225],[.041,-.435]],p.webDark);
    for(const z of [-.407,-.352,-.297]){
      sidePlate(m,s,.0561,[[.022,z],[.023,z+.026],[.033,z+.034],[.033,z+.010]],p.oxide);
    }
    screw(m,s,.0568,.065,-.157,.006);screw(m,s,.0555,.070,.068,.0055);
  }
  sidePlate(m,-1,.0578,[[.046,-.146],[.046,-.068],[.070,-.068],[.070,-.146]],p.oxide);
  dieStamp(m,[-.0581,.049,-.139],[0,0,1],[0,1,0],.016,'K-24',p.enamel);
  const handleZ=.024+pose.bolt*.046;
  const latch=mapped(m,v=>[-.053-v[2],.045+v[1],handleZ+v[0]]);
  hull(latch,[[0,0,.006,.009,p.blued],[.009,0,.008,.011,p.steel],[.017,.001,.014,.008,p.dark],
    [.022,.001,.016,.006,p.rubber]],slimBevel,5,false);
  // Rear clasp gives the top casting a shoulder silhouette without crossing the sights.
  hull(m,[[-.167,.094,.021,.006,p.blued],[-.15,.095,.024,.009,p.steel],[-.036,.095,.024,.009,p.blued],
    [.019,.095,.023,.009,p.slide],[.053,.091,.018,.009,p.blued]],slimBevel,5,false);
  hull(m,[[.053,.091,.018,.009,p.blued],[.080,.093,.037,.012,p.steel],[.108,.094,.036,.009,p.dark]],slimBevel);
  backCap(m,.062,.1109,.029,.023);
  hull(m,[[-.180,-.005,.040,.022,p.brown],[-.145,-.012,.043,.026,p.slide],[.071,-.008,.037,.020,p.blued]],slimBevel,5,false);
  linked(m,[[0,-.020,-.065],[0,-.053,-.059],[0,-.063,.013],[0,-.037,.038]],.007,p.blued);
  stock(m,'carbine');sight(m,'carbine');
}
function breaker(m,pose) {
  const p=paint;
  // Paired carrier tubes and a forked cooling collar surround a retracting ceramic bridge.
  for(const s of [-1,1]){
    const sleeve=mapped(m,v=>[v[0]+s*.043,v[1]+.018,v[2]]);
    hull(sleeve,[[-.518,.045,.030,.031,p.umber],[-.509,.045,.035,.036,p.steel],
      [-.479,.045,.035,.036,p.umber],[-.463,.045,.029,.027,p.dark],[-.32,.047,.029,.028,p.blued]],rim(6),5,false);
  }
  hull(m,[[-.341,.055,.067,.025,p.umber],[-.322,.053,.075,.047,p.laminate],[-.194,.052,.078,.047,p.laminate],
    [-.173,.048,.079,.054,p.blued],[.081,.045,.071,.059,p.slide],[.111,.042,.057,.049,p.umber]]);
  // A narrow ceramic bridge leaves both tubes' upper contours visible from the shoulder.
  box(m,0,.080,-.413,.142,.014,.025,p.enamel,10);
  for(const s of [-1,1]){
    const x=.0779;
    const xx=s*.043;
    quad(m,[xx-.010,.1002,-.297],[xx-.010,.1002,-.214],[xx+.010,.1002,-.214],[xx+.010,.1002,-.297],p.dark,5);
    quad(m,[xx-.004,.101,-.277],[xx-.004,.101,-.223],[xx+.004,.101,-.223],[xx+.004,.101,-.277],pose.uv?p.uv:p.active,12);
    sidePlate(m,s,x,[[.040,-.319],[.074,-.322],[.079,-.232],[.065,-.211],[.040,-.221]],p.dark);
    const d=.026*pose.travel, glow=pose.travel>.32?p.active:p.glass;
    for(let k=0;k<4;k++){
      const z=-.309+k*.023;
      sidePlate(m,s,x+.001,[[.048,z+d*.3],[.069,z+.005+d*.3],[.071,z+.016+d*.3],[.047,z+.013+d*.3]],glow,pose.travel>.32?12:5);
    }
    sidePlate(m,s,.077,[[.031,-.150],[.037,-.047],[.071,-.025],[.078,-.126]],p.umber);
    sidePlate(m,s,.0775,[[.045,-.133],[.05,-.075],[.061,-.067],[.065,-.124]],p.steel);
    boreFace(m,s*.043,.063,-.5183,.029,.62,6);
    for(let j=0;j<4;j++){
      const z=-.424+j*.021,xx=s*.043;
      quad(m,[xx-.020,.080,z],[xx-.019,.088,z+.004],[xx+.016,.091,z+.004],[xx+.020,.080,z],j%2?p.brass:p.umber,5);
      quad(m,[xx-.019,.088,z+.004],[xx-.016,.087,z+.010],[xx+.016,.089,z+.010],[xx+.016,.091,z+.004],j%2?p.laminate:p.steel,5);
    }
    screw(m,s,.0778,.074,-.155,.009);
  }
  const meter=mapped(m,v=>[v[0],v[1],v[2]+.031*pose.travel]);
  quad(meter,[-.019,.107,-.042],[.019,.107,-.042],[.019,.107,.024],[-.019,.107,.024],p.dark,5);
  for(let j=0;j<3;j++){
    const z=-.032+j*.015,live=j===0||pose.travel>.25*j;
    quad(meter,[-.011,.1076,z],[.012,.1076,z],[.012,.1076,z+.006],[-.011,.1076,z+.006],live?(pose.uv?p.uv:p.active):p.glass,live?12:5);
  }
  // A pair of insulated leads rises outside the dark casting, clear of the sight channel.
  const conduit=[[-.060,.076,-.187],[-.079,.107,-.165],[-.085,.112,-.122],[-.083,.092,-.073],[-.072,.065,-.055]];
  linked(m,conduit,.0058,p.rubber,7,5);
  for(const i of [0,3]){
    const a=conduit[i],b=conduit[i+1];linked(m,[between(a,b,.08),between(a,b,.27)],.0082,p.steel,5,5);
  }
  dieStamp(m,[-.078,.034,-.137],[0,0,1],[0,1,0],.017,'B-4',p.ivory);
  box(m,0,.099,-.014+.031*pose.travel,.044,.014,.097,p.steel);
  backCap(m,.050,.1115,.043,.029);
  linked(m,[[0,-.020,-.064],[0,-.068,-.053],[0,-.072,.009],[0,-.037,.039]],.009,p.umber);
  stock(m,'breaker');sight(m,'breaker');breakerReceiver(m);
}
function sight(m,id,travel=0) {
  const p=paint,spec=weapons[id],sidearm=id==='pistol'||id==='flare';
  const h=spec.sight,front=spec.front+travel,rear=spec.rear+travel;
  const gap=sidearm?.012:.018,halfWidth=sidearm?.006:.008;
  const pedestal=id==='flare'?.095:sidearm?.081:id==='carbine'?.092:.095;
  // Angled inner cheeks frame the existing sighting ray. Their bases catch a glancing lamp.
  hull(m,[[rear-.015,pedestal-.001,gap+halfWidth*2.1,.0036,p.slide],
    [rear+.011,pedestal-.001,gap+halfWidth*2.2,.004,p.blued]],slimBevel,5);
  for(const s of [-1,1]){
    const x=s*(gap+halfWidth);
    const outline=[[s*gap,pedestal],[s*gap,h-.006],[s*(gap+.003),h-.003],
      [s*(gap+halfWidth*1.64),h-.003],[s*(gap+halfWidth*2.12),h-.011],[s*(gap+halfWidth*2.12),pedestal]];
    const frontFace=outline.map(([u,v])=>[u,v,rear-.011]),backFace=outline.map(([u,v])=>[u,v,rear+.009]);
    strips(m,[frontFace,backFace],[p.blued,p.dark],5);
    quad(m,[x-.003,h-.009,rear+.0097],[x+.003,h-.009,rear+.0097],
      [x+.003,h-.005,rear+.0097],[x-.003,h-.005,rear+.0097],p.tritium,12);
  }
  const atFront=mapped(m,v=>[v[0],v[1],v[2]+front]);
  hull(atFront,[[-.003,h-.01,.0027,.01,p.steel],[.004,h-.01,.0027,.01,p.blued]],[[-1,1],[-1,-1],[1,-1],[1,1]]);
  quad(atFront,[-.0020,h-.006,.0044],[.0020,h-.006,.0044],[.0020,h-.002,.0044],[-.0020,h-.002,.0044],p.tritium,12);
  if(!sidearm) {
    for(const s of [-1,1]){
      const x=s*(id==='breaker'?.029:.022);
      quad(m,[x*.65,pedestal-.003,front-.006],[x,pedestal-.005,front-.006],
        [x*1.09,h-.002,front],[x*.90,h+.003,front],p.blued,5);
    }
  }
}
function pack(m,id,shift,charged) {
  const p=paint,pistol=id==='pistol',breaker=id==='breaker';
  const z=weapons[id].packZ, top=pistol?-.106:-.020, height=pistol?.073:breaker?.157:.192;
  const w=pistol?.025:breaker?.050:.037, d=pistol?.032:breaker?.059:.048;
  const skin=breaker?p.umber:p.pack;
  const shape=[[-.72,-1],[.72,-1],[1,-.65],[1,.68],[.72,1],[-.72,1],[-1,.68],[-1,-.65]];
  const sections=[[top,z,w*.88,d*.88],[top-height*.32,z+.005,w,d],[top-height*.9,z+.022,w,d*.96],[top-height,z+.021,w*1.10,d*1.04]]
    .map(([y,cz,ww,dd])=>shape.map(([x,k])=>plus([x*ww,y,cz+k*dd],shift)));
  strips(m,sections,[skin,skin,p.dark,p.blued],5);
  const sm=mapped(m,v=>plus(v,shift));
  for(const s of [-1,1]){
    const x=w+.0008, low=top-height*.80, high=top-height*.35;
    sidePlate(sm,s,x,[[low,z-.008],[low,z+.014],[high,z+.006],[high,z-.015]],p.dark);
    sidePlate(sm,s,x+.0006,[[low+.007,z-.002],[low+.007,z+.009],[high-.007,z+.001],[high-.007,z-.009]],
      charged?(breaker?p.active:p.tritium):p.glass,charged?12:5);
    for(const offset of [-.51,.51]){
      const rear=z+.021+d*offset,front=z+.006+d*offset,ink=breaker?p.laminate:p.slide;
      sidePlate(sm,s,x+.0004,[[low-.003,rear-.003],[low+.001,rear+.002],[high+.002,front+.002],[high+.007,front-.003]],ink);
    }
  }
  // Top lip and a single bright contact become visible as the carried cell drops into view.
  const topZ=z-.002;
  quad(sm,[-w*.73,top+.0007,topZ-d*.67],[w*.73,top+.0007,topZ-d*.67],
    [w*.73,top+.0007,topZ+d*.67],[-w*.73,top+.0007,topZ+d*.67],p.dark,5);
  if(charged)quad(sm,[-w*.41,top+.0012,topZ-d*.48],[w*.04,top+.0012,topZ-d*.47],
    [w*.12,top+.0012,topZ+d*.38],[-w*.40,top+.0012,topZ+d*.38],breaker?p.active:p.brass,breaker?12:5);
}
function illuminator(m,id,uv) {
  const p=paint,isPistol=id==='pistol'||id==='flare',x=isPistol?-.021:-.059,z=isPistol?-.102:-.255;
  const y=isPistol?-.002:.002;
  const body=mapped(m,v=>[v[0]+x,v[1]+y,v[2]+z]);
  hull(body,[[-.043,0,.014,.013,p.steel],[-.034,0,.019,.018,p.blued],[.043,0,.019,.018,p.dark]],rim(4),5,false);
  hull(body,[[-.049,0,.016,.016,p.steel],[-.046,0,.022,.022,p.blued],[-.034,0,.021,.021,p.dark]],rim(7),5,false);
  const lens=rim(7).map(([a,b])=>[a*.013,b*.013,-.0493]);
  polygon(body,lens,uv?p.uv:p.glass,uv?12:5);
  const socket=rim(7).map(([a,b])=>[a*.008,b*.008,-.0504]);
  for(let i=0;i<7;i++){const j=(i+1)%7;quad(body,lens[i],lens[j],socket[j],socket[i],i%3?p.steel:p.glass,i%3?5:6);}
  polygon(body,socket,uv?p.uv:p.active,uv?12:6);
  const tail=rim(7).map(([a,b])=>[a*.015,b*.015,.044]);
  polygon(body,tail,p.rubber,7);
  box(body,-.015,0,.015,.009,.017,.020,p.rubber,7);
  quad(body,[-.009,.001,.0435],[.008,.001,.0435],[.008,.009,.0435],[-.009,.009,.0435],uv?p.uv:p.glass,uv?12:5);
  quad(body,[-.01,.0185,-.013],[.003,.0185,-.013],[.003,.0185,.014],[-.01,.0185,.014],uv?p.uv:p.glass,uv?12:5);
}

// The spine leans forward from the fist. The wide single bevel catches a band of light on a cut.
function knife(m){
  const p=paint;
  const handle=(y)=>[0,y,.059-.18*y];
  limb(m,[[handle(-.151),.021,.022,p.steel],[handle(-.143),.028,.026,p.blued],
    [handle(-.123),.025,.024,p.rubber],[handle(-.077),.029,.026,p.rubber],
    [handle(-.027),.026,.022,p.rubber],[handle(-.008),.023,.022,p.steel]],8,5,true);
  for(const y of [-.125,-.101,-.076,-.051,-.026]){
    const r=.028+.003*(1-Math.abs(y+.078)/.066);
    limb(m,[[handle(y-.002),r,.025,p.gloveFold],[handle(y+.002),r,.025,p.gloveFold]],8,5);
  }
  // Recessed grip scales and pins remain visible when the knife is lying in a case.
  for(const side of [-1,1]){
    sidePlate(m,side,.0225,[[-.130,.057],[-.119,.046],[-.040,.039],[-.019,.050],[-.023,.067],[-.115,.086]],p.gloveFold);
    screw(m,side,.024,-.038,.060,.0046);screw(m,side,.0235,-.111,.074,.0046);
  }
  const tab=[[-.014,-.137,.078],[-.019,-.154,.080],[-.004,-.167,.080],[.015,-.158,.078],[.014,-.141,.077]];
  linked(m,tab,.0032,p.steelEdge,5,4);
  limb(m,[[[-.045,.008,.063],.008,.014,p.slide],[[-.035,.002,.061],.009,.018,p.steel],
    [[.025,.003,.057],.009,.019,p.steel],[[.047,.012,.056],.007,.014,p.steelEdge]],6,5,true);
  const rows=[
    [.009,-.022,-.013,.009,.021,.0050],
    [.035,-.024,-.014,.010,.025,.0051],
    [.048,-.026,-.015,.010,.023,.0051],
    [.133,-.027,-.015,.009,.019,.0043],
    [.178,-.027,-.017,.003,.010,.0030],
    [.205,-.025,-.020,-.010,-.005,.0017]
  ];
  const zAt=y=>.059-.182*y;
  const tip=weapons.knife.muzzle;
  for(const face of [-1,1]){
    const sections=rows.map(([y,spine,ridge,grind,edge,h])=>[
      [spine,y,zAt(y)+face*h*.61],[ridge,y,zAt(y)+face*h],
      [grind,y,zAt(y)+face*h*.88],[edge,y,zAt(y)]
    ]);
    const finishes=face===1?[p.steel,p.slide,p.keen]:[p.slide,p.steel,p.blade];
    for(let i=1;i<sections.length;i++)for(let j=0;j<3;j++){
      const q=[sections[i-1][j],sections[i-1][j+1],sections[i][j+1],sections[i][j]];
      if(face<0)q.reverse();
      quad(m,...q,finishes[j],5);
    }
    const last=sections.at(-1);
    for(let j=0;j<3;j++)m.tri(face>0?last[j]:last[j+1],face>0?last[j+1]:last[j],tip,finishes[j],5);
  }
  const spine=rows.map(([y,x,,,,h])=>[[x,y,zAt(y)-h*.61],[x,y,zAt(y)+h*.61]]);
  for(let i=1;i<spine.length;i++)quad(m,...spine[i-1],spine[i][1],spine[i][0],p.steelEdge,5);
  m.tri(...spine.at(-1),tip,p.steelEdge,5);
  quad(m,[-.012,.056,zAt(.056)+.0054],[-.007,.059,zAt(.059)+.0054],
    [-.011,.148,zAt(.148)+.0043],[-.014,.157,zAt(.157)+.0043],p.blued,5);
  for(const y of [.038,.044])quad(m,[-.011,y,zAt(y)+.0054],[-.002,y,zAt(y)+.0054],
    [-.002,y+.0018,zAt(y+.0018)+.0054],[-.011,y+.0018,zAt(y+.0018)+.0054],p.slide,5);
  dieStamp(m,[-.014,.021,zAt(.021)+.0059],[1,0,0],[0,1,-.182],.008,'S9',p.oxide);
}

function knifeHand(m,pose,longBlade){
  const p=paint,elbow=pose.localPoint(longBlade?[.416,-.385,-.165]:[.386,-.342,-.177]);
  const forearm=longBlade?between(elbow,[.085,-.092,.136],.58):[.163,-.143,.171];
  buildFieldSleeve(m,[[elbow,.085,.083,p.fatigues],[forearm,.069,.063,p.fatigues],
    [[.085,-.092,.136],.055,.054,p.cuff],[[.070,-.077,.120],.051,.044,p.gloveFold]],7);
  glovePanel(m,[[[.076,-.084,.126],.048,.046,p.gloveFold],[[.054,-.062,.093],.048,.040,p.glove],
    [[.039,-.057,.069],.041,.029,p.glove]],7,1);
  for(let i=0;i<4;i++){
    const y=-.029-i*.023,z=.061-y*.18;
    const r=.0145-i*.0008;
    finger(m,[[[.048,y,z+.021],r+.004,r+.003,p.glove],[[.039,y+.002,z-.006],r+.002,r,p.glove],
      [[.018,y+.002,z-.026],r,r,p.glove],[[-.010,y-.001,z-.027],r,r-.001,p.gloveFold],
      [[-.024,y-.002,z-.010],r-.003,r-.003,p.glove]],5);
  }
  finger(m,[[[.054,-.086,.103],.021,.022,p.glove],[[.024,-.049,.100],.018,.019,p.glove],
    [[-.008,-.034,.091],.017,.016,p.glove],[[-.024,-.029,.075],.012,.012,p.gloveFold]],6);
  m.tri([.077,-.061,.112],[.064,-.047,.093],[.077,-.069,.119],p.stitch,8);
}

function flashlightHand(mesh,pose){
  const p=paint,cut=Math.sin(smooth(.06,.88,pose.swing)*Math.PI),reach=pose.reach;
  const anchor=between([-.206,-.216,-.402],[-.150,-.151,-.451],pose.aim);
  anchor[0]-=.034*cut*pose.side+.012*reach;anchor[1]-=.043*cut+.083*pose.sprint+.238*pose.swap-.047*reach;
  anchor[2]+=.045*cut+.036*pose.sprint-.099*reach;
  anchor[0]-=.023*pose.rope;anchor[1]+=.064*pose.rope;
  anchor[0]+=.054*pose.resist;anchor[1]+=.208*pose.resist;anchor[2]+=.122*pose.resist;
  const wrist=cut*pose.side*.065+reach*.12,sw=Math.sin(wrist),cw=Math.cos(wrist);
  const m=mapped(mesh,v=>plus([v[0]*cw-v[1]*sw,v[1]*cw+v[0]*sw,v[2]],anchor));
  const elbow=difference([-.367,-.359,-.155],anchor);
  buildFieldSleeve(m,[[elbow,.082,.079,p.fatigues],[[-.078,-.087,.123],.065,.062,p.fatigues],
    [[-.042,-.053,.080],.058,.052,p.cuff],[[-.035,-.044,.067],.047,.045,p.gloveFold]],6);
  glovePanel(m,[[[-.039,-.050,.077],.049,.045,p.gloveFold],[[-.032,-.020,.042],.048,.043,p.glove],
    [[-.022,-.014,.013],.036,.032,p.glove]],6,-1);
  buildWristMeter(m,[-.078,-.087,.123],[-.042,-.053,.080],pose);
  hull(m,[[-.154,.012,.027,.027,p.slide],[-.147,.012,.033,.033,p.steel],
    [-.134,.012,.033,.033,p.blued],[-.116,.012,.027,.027,p.blued],[-.090,.012,.021,.021,p.dark],
    [.052,.012,.021,.021,p.blued],[.063,.012,.023,.023,p.rubber]],rim(8));
  hull(m,[[-.152,.012,.023,.023,pose.uv?p.uv:p.active],[-.155,.012,.023,.023,pose.uv?p.uv:p.active]],rim(8),12);
  for(const z of [-.136,-.124,-.112]){
    const r=z<-.130?.034:z<-.119?.030:.027;
    hull(m,[[z-.002,.012,r,r,p.steel],[z+.002,.012,r,r,p.blued]],rim(8),5,false);
  }
  const toggle=mapped(m,v=>[v[0]-.004,v[1]+.035,v[2]-.072]);
  hull(toggle,[[-.017,0,.014,.004,p.rubber],[-.013,.001,.015,.004,p.dark],[.016,.001,.015,.003,p.steel]],slimBevel);
  for(let i=0;i<3;i++){const z=-.012+.008*i;quad(toggle,[-.010,.005,z],[.010,.005,z],[.010,.005,z+.003],[-.010,.005,z+.003],pose.uv?p.uv:p.webDark,pose.uv?12:5);}
  dieStamp(m,[-.025,.006,-.119],[0,0,1],[0,1,0],.010,'S9',p.ivory);
  box(m,0,.031,-.073,.014,.007,.022,pose.uv?p.uv:p.glass,pose.uv?12:5);
  for(let i=0;i<4;i++){
    const z=-.059+i*.025,r=.0135-i*.0007;
    finger(m,[[[-.034,-.012,z+.008],r+.003,r+.002,p.glove],[[-.012,-.022,z],r+.002,r,p.glove],
      [[.014,-.017,z-.004],r,r,p.glove],[[.026,.003,z-.005],r-.002,r-.002,p.gloveFold]],5);
  }
  finger(m,[[[-.039,.001,.043],.019,.019,p.glove],[[-.027,.026,.023],.018,.017,p.glove],
    [[-.009,.035,-.012],.012,.013,p.gloveFold]],6);
}

// Swing the signal barrel around its forward pin. Sights, spent round and bore follow that hinge.
function flareBreech(v,pose){
  const angle=-.66*pose.weight*smooth(.07,.29,pose.reload)*(1-smooth(.73,.86,pose.reload));
  const c=Math.cos(angle),s=Math.sin(angle),y=v[1]-.009,z=v[2]+.118;
  return [v[0],.009+y*c-z*s,-.118+y*s+z*c];
}
function flareShell(pose){
  const t=smooth(.34,.64,pose.reload),seat=smooth(.59,.72,pose.reload);
  return flareBreech([-.21*(1-t),.053-.40*(1-t),.006+.105*(1-seat)+.077*(1-t)],pose);
}
function flare(m,pose){
  const p=paint,barrel=mapped(m,v=>flareBreech(v,pose));
  hull(m,[[-.151,.002,.032,.018,p.blued],[-.119,.006,.041,.027,p.orangeShade],
    [-.079,.009,.046,.032,p.signal],[.050,.008,.045,.035,p.signal],[.073,.017,.038,.026,p.orangeShade]]);
  hull(barrel,[[-.221,.053,.052,.051,p.orangeEdge],[-.207,.053,.055,.051,p.signal],
    [-.191,.053,.050,.047,p.signal],[-.076,.053,.050,.047,p.orangeShade],
    [-.065,.053,.053,.050,p.signal],[.040,.053,.050,.047,p.signal],[.050,.053,.047,.044,p.blued]],rim(9),5,false);
  // Two cutaway end rings expose a visibly hollow barrel while the frame is open.
  for(const [z,depth,radius] of [[-.221,.012,.052],[.050,-.009,.047]]){
    const outer=rim(9).map(([x,y])=>[x*radius,.053+y*(radius-.001),z]);
    const inner=rim(9).map(([x,y])=>[x*.034,.053+y*.034,z]);
    const recess=rim(9).map(([x,y])=>[x*.031,.053+y*.031,z+depth]);
    for(let i=0;i<9;i++){
      const j=(i+1)%9;
      quad(barrel,outer[i],outer[j],inner[j],inner[i],z<0?p.orangeEdge:p.steel,5);
      quad(barrel,inner[i],inner[j],recess[j],recess[i],p.dark,5);
    }
    polygon(barrel,recess,p.dark,5);
  }
  for(const side of [-1,1]){
    sidePlate(barrel,side,.052,[[.046,-.062],[.043,.011],[.062,.019],[.068,-.062]],p.orangeEdge);
    for(let j=0;j<3;j++){
      const z=-.055+.012*j;
      sidePlate(barrel,side,.0523,[[.047,z],[.047,z+.005],[.059,z+.010],[.059,z+.005]],p.umber);
    }
    const pin=mapped(m,v=>[side*(.043+v[2]),.007+v[1],-.118+v[0]]);
    hull(pin,[[0,0,.009,.009,p.blued],[.003,0,.010,.010,p.steel]],rim(6));
    sidePlate(barrel,side,.0505,[[.040,-.173],[.040,-.104],[.060,-.098],[.071,-.170]],p.paper);
    for(let j=0;j<3;j++){
      const z=-.164+j*.017;sidePlate(barrel,side,.051,[[.043,z],[.043,z+.007],[.063,z+.016],[.063,z+.009]],p.signal);
    }
    sidePlate(m,side,.0445,[[-.004,-.092],[-.005,-.047],[.009,-.035],[.017,-.092]],p.oxide);
  }
  hull(m,[[.043,.054,.036,.032,p.blued],[.063,.054,.041,.036,p.dark],[.072,.054,.039,.032,p.blued]]);
  box(m,0,.070,.073,.053,.020,.003,p.steel);
  box(m,0,.068,.075,.035,.004,.002,p.blued);
  box(m,-.018,.040,.074,.007,.007,.002,p.orangeEdge);
  linked(m,[[0,-.019,-.080],[0,-.058,-.062],[0,-.071,-.033],[0,-.069,.012],[0,-.039,.032]],.007,p.orangeShade);
  linked(m,[[0,-.012,-.017],[0,-.035,-.021],[0,-.047,-.034]],.006,p.blued);
  sight(barrel,'flare');
  if(pose.exchanging&&pose.reload>.14&&pose.reload<.41){
    const t=smooth(.14,.41,pose.reload),fade=1-smooth(.32,.41,pose.reload);
    const base=flareBreech([.115*t,.052+.068*t-.18*t*t,.030+.19*t],pose);
    const end=plus(base,[.019*t,.037*t,-.064*(1-t)]),r=.021*fade;
    if(r>.001)limb(m,[[base,r,r,p.brass],[between(base,end,.15),r,r,p.orangeShade],[end,r*.95,r*.95,p.umber]],6,5,true,true);
  }
  if(pose.exchanging&&pose.reload>.32&&pose.reload<.81){
    const shell=flareShell(pose),tip=flareBreech([0,.053,-.070],pose),base=flareBreech([0,.053,.006],pose);
    const axis=difference(tip,base),point=t=>plus(shell,scaled(axis,t));
    limb(m,[[point(.05),.029,.029,p.brass],[point(.12),.028,.028,p.orangeEdge],
      [point(.68),.025,.025,p.signal],[point(.97),.024,.024,p.paper]],8,5,true);
  }
}

// Close camera shots reveal the hardware proud of each surface. Case presentations
// use the same pieces; the archive silhouettes keep the coarser original cuts.
function serviceDetail(m,id,pose){
  if(m.lowDetail)return;
  const p=paint;
  if(id==='knife'){
    const braid=[[-.008,-.153,.079],[-.018,-.173,.078],[-.021,-.192,.086],[-.013,-.202,.090],[.002,-.193,.085],[.006,-.171,.080],[.001,-.155,.078]];
    linked(m,braid,.0026,p.web,8,5);
  }else if(id==='pistol'){
    const top=mapped(m,v=>[v[0],v[1],v[2]+.035*pose.bolt]);
    for(let i=0;i<3;i++){
      const z=-.181+.021*i;
      quad(top,[-.038,.056,z],[-.036,.066,z+.004],[-.036,.068,z+.007],[-.0384,.053,z+.002],p.steel,5);
    }
    const hammer=mapped(m,v=>[v[0],v[1]+.028,v[2]+.068]);
    hull(hammer,[[.0001,0,.012,.008,p.dark],[.012,.001,.009,.008,p.blued],[.018,.006,.008,.006,p.steel]],slimBevel);
  }else if(id==='carbine'){
    // Sling swivel anchored beneath the stock and a folded release paddle.
    const loop=[[.039,-.058,.197],[.050,-.061,.20],[.056,-.079,.190],[.049,-.088,.180],[.038,-.085,.179]];
    linked(m,loop,.0038,p.steel,5,6);
    const paddle=mapped(m,v=>[v[0]-.056,v[1]+.021,v[2]-.065]);
    hull(paddle,[[-.021,0,.005,.006,p.blued],[-.014,.002,.008,.007,p.steel],[.007,.002,.009,.005,p.steel],[.012,0,.005,.004,p.blued]],slimBevel);
  }else if(id==='breaker'){
    const coil=[[-.072,.030,-.153],[-.081,.012,-.127],[-.086,.005,-.100],[-.083,.014,-.083],[-.072,.034,-.078]];
    linked(m,coil,.0046,p.webDark,7,6);for(const a of [coil[0],coil.at(-1)])box(m,...a,.012,.014,.012,p.brass,5);
  }else if(id==='flare'){
    // The tether exits the fixed grip, away from the rotating breech.
    linked(m,[[.020,-.125,.10],[.031,-.149,.098],[.019,-.178,.084],[-.002,-.185,.080],[-.013,-.166,.087],[-.006,-.141,.103]],.0036,p.web,8,5);
  }
}
function weaponBody(m,id,pose){
  if(id==='nailgun'){grip(m);if(!pose.helmet)illuminator(m,id,pose.uv);return buildNailer(m,pose);}
  if(id==='machinegun'||id==='flamethrower'){grip(m);if(!pose.helmet)illuminator(m,id,pose.uv);return buildFarmArm(m,id,pose);}
  serviceDetail(m,id,pose);
  if(id==='machete'){brushBlade(m);return;}
  if(id==='knife'){knife(m);return;}
  if(id==='sledge'){masonHammer(m);return [0,0,0];}
  if(id==='launcher'){grip(m);if(!pose.helmet)illuminator(m,id,pose.uv);return launcherBody(m,pose);}
  if(weapons[id].sporting){
    sportingArm(m,id,pose);
    const mount=id==='doublebarrel'?mapped(m,v=>hingedPoint(v,pose)):m;
    box(mount,-.047,.008,-.26,.017,.014,.032,paint.rubber,7);if(!pose.helmet)illuminator(mount,id,pose.uv);
    return [0,0,0];
  }
  if(id==='pistol')pistol(m,pose);
  else if(id==='carbine')carbine(m,pose);
  else if(id==='breaker')breaker(m,pose);
  else flare(m,pose);
  grip(m);if(!pose.helmet)illuminator(m,id,pose.uv);
  if(id==='flare')return [0,0,0];
  const t=pose.reload,h=handling[id],z=weapons[id].packZ,heavy=id==='breaker';
  const socket=[0,id==='pistol'?-.15:-.13,z];
  const pocket=difference(pose.localPoint([-.090,-.490,-.280]),socket);
  const spare=scaled(pocket,pose.search);
  if(pose.stableMesh){pack(m,id,spare,true);return spare;}
  // Leave space below the prop before bringing the new part back in. The spent
  // component carries its own momentum as the support hand goes to the vest.
  if(!pose.exchanging||t<h.release)pack(m,id,[0,0,0],!pose.empty);
  if(pose.exchanging&&t>=h.release&&t<h.release+.30){
    const u=(t-h.release)/.30,a=u*(heavy?.28:.64),c=Math.cos(a),sn=Math.sin(a);
    const falling=mapped(m,([x,y,z])=>[c*x-sn*(y-socket[1])-.055*u,
      socket[1]+sn*x+c*(y-socket[1])-.90*u*u-.12*u,z+.062*u]);
    pack(falling,id,[0,0,0],false);
  }
  if(t>=h.approach){
    // A short straight alignment ends the curved lift into the receiver.
    spare[1]-=.048*smooth(h.approach,h.approach+.06,t)*(1-smooth(h.seated-.065,h.seated,t));
    if(pose.exchanging)pack(m,id,spare,true);
  }
  return spare;
}

function slingWebbing(mesh,pose){
 const pull=pose.rope*(1-pose.resist);
 if(pull<.025)return;
 const knuckle=between([-.34,-.25,-.23],[-.194,.043,-.447],pull);
 const low=between([-.38,-.266,-.18],[-.30,-.176,-.333],pull);
 const high=between([-.39,-.12,-.24],[-.251,.363,-.431],pull);
 limb(mesh,[[low,.0092,.0034,paint.umber],[between(low,knuckle,.62),.0090,.0035,paint.cuff],
  [knuckle,.010,.0033,paint.cuff],[between(knuckle,high,.45),.009,.0034,paint.brown],
  [high,.009,.0034,paint.cuff]],4,8,false,true);
}
function spentCase(m,id,pose){
  if(weapons[id].sporting||id==='nailgun'||id==='flare'||id==='launcher'||id==='sledge'||pose.recoil<=.025||pose.recoil>=.985)return;
  const t=1-pose.recoil,scatter=pose.variant;
  const y=.059+.275*t-.31*t*t+.014*scatter*t,x=.057+.31*t;
  const z=(id==='pistol'?-.051:-.093)+(.14+.034*scatter)*t;
  const a=t*(7.1+.61*scatter),axis=[Math.cos(a)*.017,Math.sin(a)*.018,-.011];
  const center=[x,y,z],r=(id==='breaker'?.009:.0065)*(1-smooth(.83,1,t));
  if(r<.0007)return;
  const end=plus(center,axis),rear=difference(center,axis),brass=id==='breaker'?paint.steel:paint.brass;
  limb(m,[[rear,r,r,brass],[between(rear,end,.19),r*.9,r*.9,brass],[end,r*.87,r*.87,id==='breaker'?paint.active:paint.brown]],6,5,true,true);
}
// Both instruments share the service department's shockproof case and rear gauge.
function fieldDevice(m,id,signal=0){
  const p=paint,receiver=id==='sensor',olive=receiver?p.cuff:p.webDark;
  grip(m);
  if(!m.lowDetail){
    const path=[[-.076,.13,.076],[-.048,.150,.077],[.050,.150,.077],[.076,.13,.076]];
    linked(m,path,.004,p.steel,5,7);
    for(const s of [-1,1])screw(m,s,.095,.078,.074,.0058);
  }
  hull(m,[[-.079,.047,.074,.062,p.rubber],[-.058,.054,.096,.078,olive],[.076,.058,.097,.080,olive],
    [.105,.055,.093,.077,p.rubber],[.118,.054,.081,.064,p.oxide]],bevel,7);
  for(const x of [-.076,.076]){
    box(m,x,.057,.117,.015,.103,.010,p.rubber);
    for(const y of [.014,.102])box(m,x,y,.123,.007,.007,.003,p.steelEdge);
  }
  // Recessed instrument glass and a mechanical needle, both visible while held.
  box(m,0,.078,.120,.133,.063,.008,p.blued);
  box(m,0,.080,.125,.118,.046,.003,receiver?[.173,.237,.192]:p.ivory,receiver?6:10);
  const face=.128;
  for(let i=0;i<7;i++){
    const t=i/6,angle=-.99+1.98*t,xx=.044*Math.sin(angle),yy=.064+.033*Math.cos(angle);
    linked(m,[[xx*.94,yy-.003,face],[xx,yy,face]],.0009,receiver?p.enamel:p.oxide,5);
  }
  const angle=-.94+signal*.37;
  linked(m,[[0,.062,face+.001],[.046*Math.sin(angle),.061+.034*Math.cos(angle),face+.001]],.0018,receiver?p.signal:p.umber);
  for(let i=0;i<5;i++){
    const lit=i<signal,color=lit?(receiver?(i>2?[.99,.54,.12]:[.43,.95,.60]):[.47,.86,1]):[.12,.17,.16];
    box(m,-.045+i*.0225,.037,.124,.013,.008,.004,color,lit?13:6);
  }
  if(receiver){
    // Split whip and a short, insulated tuning loop.
    for(const [x,h] of [[-.067,.226],[.067,.174]]){
      const root=[x,.13,-.036],tip=[x+(x<0?-.012:.007),h,-.052];
      box(m,x,.135,-.035,.019,.022,.023,p.blued);
      linked(m,[root,tip],.0034,p.steelEdge,5,6);box(m,tip[0],tip[1],tip[2],.009,.009,.009,p.oxide);
    }
    for(let i=0;i<5;i++)box(m,-.04+i*.02,.139,.005,.009,.004,.034,p.oxide);
    dieStamp(m,[-.041,.006,.125],[1,0,0],[0,1,0],.010,'S-9',p.paper);
  }else{
    // Ceramic core, copper winding and four protective rails project ahead of the case.
    limb(m,[[[0,.055,-.247],.048,.048,p.steel],[[0,.055,-.235],.057,.057,p.enamel],
      [[0,.055,-.084],.057,.057,p.enamel],[[0,.055,-.065],.067,.067,p.blued]],10,5,true);
    const winding=[],turns=6,steps=m.lowDetail?8:14;
    for(let i=0;i<=turns*steps;i++){
      const t=i/(turns*steps),a=t*turns*TAU;
      winding.push([.063*Math.cos(a),.055+.063*Math.sin(a),-.082-.15*t]);
    }
    linked(m,winding,.0052,[.55,.279,.131],5,5);
    for(let i=0;i<4;i++){
      const a=(i+.5)*TAU/4,x=.077*Math.cos(a),y=.055+.077*Math.sin(a);
      linked(m,[[x,y,-.069],[x,y,-.217],[x*.75,.055+(y-.055)*.75,-.248]],.0058,p.blued,5,5);
    }
    dieStamp(m,[-.041,.006,.125],[1,0,0],[0,1,0],.010,'K-24',p.paper);
  }
}

export function buildStowedWeapon(mesh,weapon){
  const id=weaponKey(weapon),layer=fieldLayer(mesh,!!mesh.lowDetail);
  if(weapons[id].instrument)fieldDevice(layer,id);else weaponBody(layer,id,poseFor(id,{}));
}

export function buildGun(mesh,weapon,options={}) {
  const id=weaponKey(weapon),pose=poseFor(id,options),layer=fieldLayer(mesh,!!options.lowDetail);
  const m=mapped(layer,pose.transform);
  if(weapons[id].instrument){fieldDevice(m,id,options.signal||0);firingHand(m,pose);if(!options.helmet)flashlightHand(layer,pose);return;}
  pose.stableMesh=options.stableMesh;
  fieldRecorder(m,id);
  const shift=weaponBody(m,id,pose);
  const tube=(a,b,r1,r2,col,mt,n)=>limb(m,[[a,r1,r1,col],[b,r2,r2,col]],n,mt,true);
  if(options.variantModel==='sniper'){
    for(const z of [-.42,-.273]){box(m,0,.114,z,.050,.072,.035,paint.blued,5);tube([0,.15,z-.015],[0,.15,z+.012],.039,.039,paint.blued,5,12);}
    tube([0,.151,-.50],[0,.151,-.405],.042,.028,paint.blued,5,14);
    tube([0,.151,-.406],[0,.151,-.230],.027,.027,paint.blued,5,14);
    tube([0,.151,-.232],[0,.151,-.175],.027,.042,paint.blued,5,14);
    tube([0,.151,-.176],[0,.151,-.171],.037,.037,[.10,.18,.21],6,14);
  }else if(options.variantModel==='semi'){
    tube([0,.057,-.521],[0,.057,-.636],.019,.014,paint.blued,5,12);
    for(const z of [-.41,-.36,-.31])tube([0,.05,z],[0,.05,z+.014],.036,.036,paint.blued,5,12);
  }
  slingWebbing(layer,pose);
  if(id==='knife'||id==='machete'){
    knifeHand(m,pose,id==='machete');
    if(!options.helmet)flashlightHand(layer,pose);
    return;
  }
  firingHand(m,pose,id==='rifle'?sportingBoltGrip(pose):null);supportHand(m,id,pose,shift);if(!pose.stableMesh)spentCase(m,id,pose);
}

// Contacts change independently from the cached weapon mesh. The map is mounted on
// the moving receiver; sighting and reloading rotate the geometry and phosphor together.
export function buildBreakerReturn(mesh,options={},{contacts=[],sweep=0}={}){
  const layer=Object.create(mesh);layer.lowDetail=!!options.lowDetail;
  receiverTrace(mapped(layer,poseFor('breaker',options).transform),contacts,sweep);
}

export function gunOffsets(weapon,options={}) {
  const id=weaponKey(weapon),spec=weapons[id],pose=poseFor(id,options);
  if(id==='knife'||id==='machete'||id==='sledge')return {
    muzzle:pose.transform(spec.muzzle),frontSight:pose.transform(spec.muzzle),rearSight:pose.transform([0,.004,.059])
  };
  const slide=id==='pistol'?.035*pose.bolt:0;
  const point=v=>pose.transform(id==='flare'?flareBreech(v,pose):id==='doublebarrel'?hingedPoint(v,pose):v);
  const muzzle=id==='doublebarrel'?plus(spec.muzzle,[shotgunSide(pose.loaded)*.025,0,0]):spec.muzzle;
  return {
    muzzle:point(muzzle),
    frontSight:point([0,spec.sight,spec.front+slide]),
    rearSight:point([0,spec.sight,spec.rear+slide])
  };
}

export function buildMuzzle(mesh,weapon,aim=0,recoil=0) {
  const id=weaponKey(weapon),spec=weapons[id];
  if(id==='nailgun'||id==='knife'||id==='machete'||id==='sledge'||spec.instrument)return;
  const options=typeof aim==='object'?aim:{aim,recoil};
  const pose=poseFor(id,options),m=mapped(mesh,pose.transform),spectral=id==='breaker';
  const signal=id==='flare';
  const pearl=spectral?[.95,1,1]:signal?[1,.93,.79]:[1,1,.94];
  const body=spectral?[.66,.93,1]:signal?[1,.36,.16]:[1,.91,.56];
  const edge=spectral?[.55,.59,1]:signal?[1,.085,.095]:[1,.59,.19];
  const decay=pose.recoil>0?.34+.66*smooth(.42,.96,pose.recoil):1;
  const span=(id==='launcher'?2.14:id==='doublebarrel'?2.25:id==='rifle'?1.77:signal?1.20:spectral?1.58:id==='carbine'?1.86:1.60)*(.25+.75*decay);
  const reach=(id==='launcher'?1.31:id==='doublebarrel'?1.69:id==='rifle'?2.04:signal?.98:spectral?1.25:id==='carbine'?1.67:1.24)*decay;
  const at=(x,y,z)=>{
    const v=plus(spec.muzzle,[x*span,y*span,-z*reach]);
    if(id==='doublebarrel'){v[0]+=shotgunSide(pose.loaded)*.025;return hingedPoint(v,pose);}
    return signal?flareBreech(v,pose):v;
  };
  const start=at(0,0,.001), tip=at(-.008,.009,.213),mid=[];
  for(let i=0;i<6;i++){
    const a=(i+.17+pose.variant*.14)*TAU/6;
    mid.push(at(.035*Math.cos(a),.035*Math.sin(a),.042));
  }
  const radii=[.055,.081,.045,.070,.059,.088];
  const face=at(0,0,.020);
  for(let i=0;i<6;i++){
    const a=(i+.17+pose.variant*.14)*TAU/6,j=(i+1)%6;
    const lobe=at(Math.cos(a)*radii[i],Math.sin(a)*radii[i],.088+.021*(i%3));
    m.tri(start,mid[i],mid[j],pearl,12);m.tri(mid[i],lobe,mid[j],i%2?body:edge,12);
    m.tri(mid[j],tip,mid[i],i%2?pearl:body,12);
    m.tri(face,mid[j],mid[i],pearl,12);
  }
  const sparks=signal?[[.076,.057,.087,.013],[-.036,.075,.158,.014],[.041,-.051,.121,.012],
    [-.078,-.026,.184,.013],[.022,.089,.231,.01],[-.048,.009,.255,.012]]:
    [[.071,.041,.143,.011],[-.047,.06,.116,.010],[.012,-.051,.171,.008]];
  for(const [x,y,z,k] of sparks)
    m.tri(at(x-k,y,z),at(x+k,y+.003,z+.009),at(x+k*.15,y+.004,z+.034),edge,12);
}

// Each contact is the same ledge point transformed into the camera basis this frame.
// The gloves keep their world purchase as the operator's head climbs past them.
export function buildClimbHands(mesh,{progress=0,contacts,up=[0,1,0],lowDetail=false}={}){
  if(!contacts||contacts.length!==2||!contacts.every(v=>v?.length===3&&v.every(Number.isFinite)))return;
  const t=clamp(progress),right=norm(difference(contacts[1],contacts[0]));
  if(Math.hypot(...right)<.5)return;
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const normal=norm(difference(up,scaled(right,dot(right,up))));
  const forward=norm(cross(normal,right)),layer=fieldLayer(mesh,lowDetail),p=paint;
  for(const [i,contact] of contacts.entries()){
    const side=i===0?-1:1,lag=i*.073;
    const plant=smooth(.016+lag,.284+lag,t),leave=smooth(i===0?.827:.738,i===0?.986:.946,t);
    const carry=plant*(1-leave),pressure=smooth(.235+lag,.42+lag,t)*(1-smooth(.71,.91,t));
    const rest=[side*.264,-.605,-.254],exit=[side*.274,-.562,-.301];
    const regrip=i===1?smooth(.602,.684,t):0,arc=Math.sin(Math.PI*regrip);
    const place=(v,across,height,depth)=>plus(v,plus(scaled(right,across),plus(scaled(normal,height),scaled(forward,depth))));
    const ledge=place(contact,side*.013*regrip,.031+.034*arc-.006*pressure,.033+.049*regrip);
    const palm=between(between(rest,ledge,plant),exit,leave);
    palm[1]+=.065*Math.sin(Math.PI*plant)*(1-leave);
    const curl=carry*(1-.79*arc);
    const at=(x,y,z)=>place(palm,x,y,z);
    const elbow=[side*(.339+.057*pressure),-.341-.082*pressure,-.112-.050*t];
    const wrist=at(side*.001,.015+.026*(1-carry),-.081);
    const fore=between(elbow,wrist,.56),cuff=between(elbow,wrist,.88);
    buildFieldSleeve(layer,[[elbow,.086,.080,p.fatigues],[fore,.073,.067,p.fatigues],
      [cuff,.062,.054,p.cuff],[wrist,.051,.045,p.gloveFold]],lowDetail?6:8);
    glovePanel(layer,[[wrist,.050,.043,p.gloveFold],[at(0,.013,-.042),.053,.029,p.glove],
      [at(0,.004,.008),.055,.025,p.glove],[at(-side*.003,0,.024),.046,.021,p.glove]],lowDetail?6:8,side);
    if(i===0)buildWristMeter(layer,fore,wrist);
    for(let k=0;k<4;k++){
      const x=side*(.033-.022*k),len=[.051,.060,.056,.044][k],fan=side*(1.5-k)*.006;
      const knuckle=at(x,.006,.019+len*.11);
      const middle=at(x+fan,-.003-.003*curl,.028+len*.60);
      const tip=at(x+fan*1.35,-.013-.007*curl,.028+len);
      finger(layer,[[knuckle,.0115,.0125,p.glove],[middle,.010,.0105,p.glove],
        [tip,.0084,.0078,p.leather]],lowDetail?5:7);
    }
    finger(layer,[[at(-side*.039,.009,-.045),.018,.016,p.glove],[at(-side*.064,-.006,-.013),.015,.014,p.glove],
      [at(-side*.071,-.014,.012),.010,.0105,p.leather]],lowDetail?5:7);
  }
}
