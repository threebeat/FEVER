import {chestRecorder} from './fever-kit.js';
import {buildCellarRoach} from './cellar-roach-art.js';
import {portrait,helmetHardware} from './crew-portrait.js';
import {uniformLeg,uniformArms,rescueBack,radioHarness,patrolKit,serviceVisor,fieldKneepad,kitTape} from './crew-tailoring.js';
import {offset,line,box,quad,shell,guard,haunch,footfall,insetMesh} from './actor-geometry.js';
import {woundSocket,tornChest,hitWounds,spineParasite,buildGib} from './actor-anatomy.js';
import {buildOffcut} from './golem-parts.js';
import {host,golem,cultist,witch,worm,wraith,witness,buildWormSpit,wormSocket} from './actor-cast.js';
import {grey} from './grey-art.js';
export {buildGib,buildWormSpit};
// Local +Z is the face of the creature. All dimensions are metres.
const tau = Math.PI * 2;
const clamp01 = n => Math.max(0, Math.min(1, n));
const smooth = n => n*n*(3-2*n);

const iron = [.22,.255,.255], dark = [.095,.115,.12], joint = [.14,.16,.155];
const gunmetal = [.30,.34,.335], silver = [.49,.54,.51], cable = [.105,.12,.113];
const canvas = [.25,.285,.225], olive = [.33,.355,.255], faded = [.45,.46,.335];
const bone = [.60,.585,.485], glaze = [.70,.705,.63], pitted = [.425,.43,.36];
const uv = [.50,.72,.90], cold = [.36,.75,.91], amber = [.96,.38,.10];
const lit = 12, phosphor = 13;

const passage=(t,a,b)=>smooth(clamp01((t-a)/(b-a)));
// Physics owns horizontal travel. This ground-relative arc is also available to hit testing.
export function leapHeight(kind,t){
  const f=clamp01((t-.10)/.77);
  return (kind==='hound'?.56:.43)*4*f*(1-f);
}

function motion(name,t,damage) {
  const aliases={windup:'tell',hit:'stun',death:'fall',walk:'move',run:'move',limp:'move',erupt:'tell',emerge:'rise'};
  const pose=aliases[name]||name,phase=t*tau;
  const move=pose==='move'||pose==='readyWalk'||pose==='dash'||pose==='thrash'?1:0,attack=pose==='attack'||pose==='throw'||pose==='thrash';
  const gather=smooth(clamp01(t/.28)),release=smooth(clamp01((t-.28)/.72));
  const pulse=attack?gather*(1-release):0;
  const settled=smooth(clamp01((t-.05)/.88));
  const tell=pose==='tell'?smooth(t):pose==='ready'||pose==='readyWalk'?.92:0;
  const tear=pose==='split'?passage(t,.20,.66):0;
  const grip=pose==='grab'?.89+.075*Math.sin(phase-.43):pose==='split'?.94-.87*tear:0;
  const crouch=pose==='cower'?.89+.055*Math.sin(phase):pose==='ambush'?.94*(1-passage(t,.23,.95)):
    pose==='leap'?.63*(1-passage(t,0,.22))+.32*passage(t,.74,.90)*(1-passage(t,.90,1)):0;
  const jump=pose==='leap'?Math.sin(Math.PI*clamp01((t-.10)/.77)):0;
  const cast=pose==='castTell'?passage(t,0,.91):pose==='cast'?.96+.036*Math.sin(phase):0;
  const blink=pose==='blink'?Math.sin(t*Math.PI)**1.4:0;
  const gatherBlink=pose==='blinkTell'?passage(t,0,.93):pose==='blink'?1-passage(t,0,.31):0;
  const ambush=pose==='ambush'?Math.sin(Math.PI*clamp01((t-.23)/.71)):0;
  const struggle=pose==='struggle'?1:0,rappel=pose==='rappel'?1:0;
  const land=pose==='land'?(1-passage(t,.20,.96))*(.30+.70*passage(t,0,.20)):0;
  const fall=pose==='fall'?settled:pose==='rise'?1-smooth(t):0;
  const knock=pose==='stun'?(1-smooth(t))*(.64+.36*Math.sin(t*Math.PI*1.57)):0;
  const carry=pose==='carry'?.86+.065*Math.sin(phase):pose==='throw'?1-smooth(clamp01(t/.48)):0;
  const swing=Math.sin(phase+.075*Math.sin(2*phase))*move;
  const wounds=damage?.wounds;
  const hits=Array.isArray(wounds)?wounds.length?8:0:wounds&&typeof wounds==='object'?
    (wounds.head>0?1:0)|(wounds.leftArm>0?2:0)|(wounds.rightArm>0?4:0)|(wounds.torso>0?8:0):Number(wounds)>0?8:0;
  return {pose,t,move,attack,fall,tell,swing,breath:Math.sin(phase),sway:swing,
    double:Math.cos(phase*2)*move,coil:tell+(attack?1-gather:0),
    strike:Math.max(pulse,.69*grip),sting:knock,grip,carry,throw:pose==='throw'?pulse:0,
    aid:pose==='aid'?.94+.025*Math.sin(phase):0,
    erupt:name==='erupt',entry:pose==='rise'||name==='erupt'?smooth(t):1,
    wake:pose==='rise'?Math.sin(t*Math.PI)*Math.sin(phase*2-.24):0,
    burrow:pose==='burrow'?smooth(t):0,mask:(damage?.mask||0)&63,
    generation:Math.min(3,Math.max(0,Math.floor(damage?.generation||0))),
    variant:Math.abs(Math.floor(damage?.variant||0)),
    hits,wounds:hits&8,crouch,jump,cast,blink,gatherBlink,ambush,tear,struggle,rappel,land,
    lurk:pose==='lurk'?.89+.065*Math.cos(phase):0,dash:pose==='dash'?1:0,
    anchored:!!damage?.anchored,young:!!damage?.young};
}

// +Y is out of the attachment surface, +Z along the projected aim axis.
export function wormMouthLocal(pose='anchored',t=0,damage={}){
  return wormSocket(motion(pose,clamp01(t),damage));
}

function hollow(m,q) {
  const {breath,swing,double,tell,strike,sting,fall}=q;
  const slip=Math.sin(q.t*tau-.57)*q.move,coil=q.coil;
  const dip=-.016*double-.145*coil-.14*fall;
  const lean=.13*coil+.27*strike-.14*sting, cock=.075+.025*breath+.078*slip+.085*sting;
  const hip=[-.028*slip,.91+dip,-.073+lean*.22],shoulders=[cock,1.455+dip+.013*breath+.028*double,.072+lean+.105*q.move];
  shell(m,hip,[[-.13,.125,.09],[0,.178,.127],[.105,.144,.096]],joint);
  box(m,offset(hip,0,.041,.015),.333,.065,.219,canvas);
  box(m,offset(hip,.046,.049,.122),.058,.047,.020,silver);
  for(const side of [-1,1]){
    const step=footfall(q.t,side<0?.03:.55,side<0?.55:.64),stride=q.move*step.z,lift=q.move*step.lift;
    const knee=[side*(.135+.040*fall+.051*coil)+.065*slip,.512+dip*.48+.109*lift,.094+stride*.178+lean*.44];
    const foot=[side*(.160+.09*fall)+.057*slip,.083+.146*lift,-.048+stride*.283];
    const hipJoint=offset(hip,side*.135,-.074,0);
    line(m,hipJoint,knee,.091,.057,side<0?pitted:canvas,5);
    line(m,offset(knee,0,.025,-.01),foot,.054,.037,joint,5);
    line(m,offset(knee,side*.048,-.066,.025),offset(foot,side*.026,.031,.026),.032,.021,side<0?bone:gunmetal,4);
    shell(m,foot,[[-.079,.067,.145,0,.033],[-.031,.082,.16,0,.039],[.067,.06,.084,0,-.008]],dark,5);
    line(m,offset(hipJoint,side*.079,-.03,.013),offset(knee,side*.047,.02,.023),.014,.014,uv,4,phosphor);
  }
  // Webbing holds two disjoint breast plates around the vertical void.
  line(m,offset(hip,-.025,.08,-.075),offset(shoulders,-.055,.115,-.095),.048,.034,iron,5);
  for(const side of [-1,1]){
    const lo=offset(hip,side*.12,.12,.005),hi=offset(shoulders,side*.17,.095,-.006);
    line(m,lo,hi,.046,.103,side<0?iron:gunmetal,5);
    const chest=offset(shoulders,side*(.121+.028*coil),-.10+side*.037,.037);
    shell(m,chest,[[-.126,.025,.045,side*.005],[-.037,.058,.071],[.084,.087,.088],[.157,.064,.061,side*.023,-.01]],side<0?bone:pitted,5);
    line(m,offset(chest,-side*.057,-.069,.084),offset(chest,-side*.044,.099,.103),.013,.02,uv,4,phosphor);
  }
  // The two outer ribs rotate out of phase, exposing the gap over the abdomen.
  for(const side of [-1,1]){
    for(let j=0;j<2;j++){
      const rib=offset(shoulders,side*(.059+.03*j),-.21-j*.092,.087);
      const bend=offset(rib,side*(.076+.032*coil),-.014+side*.021*breath,-.056);
      line(m,rib,bend,.020,.018,pitted,4);
      line(m,bend,offset(bend,side*.006,-.069,-.049),.018,.005,iron,4);
    }
  }
  // Torn carrier webbing flaps independently of the weight borne by the belt.
  for(const s of [-1,1]){
    const a=offset(hip,s*.145,.054,.102),b=offset(hip,s*.19,.042,.035);
    const d=offset(hip,s*(.165+.017*breath),-.117,.112+.023*swing);
    const h=offset(hip,s*(.201+.024*breath),-.13,.041+.034*swing);
    quad(m,a,d,h,b,canvas);
    m.tri(d,offset(hip,s*(.183+.026*breath),s<0?-.315:-.232,.088+.061*swing),h,olive);
    line(m,offset(shoulders,s*.19,.088,.062),offset(hip,s*.142,.082,.089),.020,.014,canvas,4);
  }
  const neck=offset(shoulders,.029,.118,-.019),head=offset(neck,-.062-.029*slip,.147,.086+.061*coil);
  line(m,neck,offset(head,0,.041,-.031),.040,.038,joint,5);
  // A split crown and independently hanging respirator cheeks frame a literal hole.
  shell(m,head,[[.038,.135,.134],[.099,.135,.118,-.014,-.007],[.144,.079,.084,-.024,-.016]],gunmetal,7);
  for(const s of [-1,1]){
    line(m,offset(head,s*.090,.04,.041),offset(head,s*.071,-.097,.077),.044,.026,s<0?glaze:bone,5);
    line(m,offset(head,s*.119,.057,.078),offset(head,s*.053,.054,.129),.012,.009,uv,4,phosphor);
  }
  line(m,offset(head,-.059,-.086,.072),offset(head,.064,-.109,.073),.016,.021,iron,4);
  for(const s of [-1,1]){
    const stride=s*swing,reach=s>0?strike:0;
    const shoulder=offset(shoulders,s*.207,s<0?.061:-.054,-.014);
    const elbow=offset(shoulder,s*(.054+.11*coil+.24*sting),-.329+.23*reach+.09*coil-.055*stride,-.086+stride*.138+.34*reach);
    const wrist=offset(elbow,s*(.022+.13*sting),s<0?-.289:-.347+.24*reach,.061+stride*.101+.37*reach);
    shell(m,shoulder,[[-.057,.084,.09],[.014,.12,.11],[.081,.078,.076]],s<0?pitted:canvas,6);
    line(m,shoulder,elbow,.068,.049,joint,5);line(m,elbow,wrist,.053,.032,s<0?gunmetal:pitted,5);
    line(m,offset(elbow,s*.037,-.031,.035),offset(wrist,s*.019,.02,.022),.015,.012,uv,4,phosphor);
    for(const finger of [-1,1])line(m,offset(wrist,finger*.021,0,0),offset(wrist,finger*.046,-.089+.05*reach,.033+.045*reach),.019,.005,bone,4);
  }
  const rig=offset(shoulders,-.123,.007,-.135);
  box(m,rig,.133,.219,.105,canvas);
  line(m,offset(rig,-.064,.112,-.043),offset(rig,-.115,.372,-.088),.015,.006,silver,4);
  line(m,offset(rig,.067,-.082,0),offset(hip,.151,.028,-.082),.020,.019,cable,4);
}

function hound(m,q,clean=false) {
  const {t,breath,move,tell,strike,sting,fall}=q;
  const cycle=t*tau,coil=q.coil,crouch=q.crouch,jump=q.jump;
  const backbeat=Math.sin(cycle-.61)*move,forebeat=Math.sin(cycle+.56)*move;
  const airborne=move*Math.max(0,Math.cos(cycle*2-.92));
  const h=.49-.22*coil+.152*strike+.047*airborne+.038*sting-.102*fall-.235*crouch+.046*jump;
  const thrust=.36*strike-.12*coil+.065*q.wake+.22*q.ambush-.22*q.tear,sidewave=Math.sin(cycle+.4)*.039*move+.072*q.wake;
  const chest=[sidewave,h+.109+.064*forebeat-.067*crouch+.047*jump,.155+thrust+.143*jump],
    rump=[-.043*backbeat,h-.025+.078*backbeat+.055*crouch+.020*jump,-.278+thrust*.40-.101*jump];
  const hide=clean?[.293,.248,.176]:[.243,.217,.188],undercoat=clean?[.51,.401,.267]:[.33,.274,.227],
    muzzle=clean?[.237,.217,.185]:[.35,.315,.253];
  const inner=[.257,.107,.099],sinew=[.46,.265,.215],tooth=[.74,.66,.501];
  line(m,offset(rump,0,.037,-.064),offset(chest,0,.043,q.mask&8?-.16:-.04),.143,q.mask&8?.078:.174,hide,7);
  haunch(m,rump,[[-.23,.076,.10,.051],[-.11,.186,.163,.026],[.04,.194,.174,.01],[.18,.121,.106,.037]],hide);
  if(q.mask&8)tornChest(m,chest,.212,.184,.175,undercoat,true);
  else{
    haunch(m,chest,[[-.19,.13,.153,.004],[-.06,.21,.195,.009],[.10,.218,.194,.003],[.22,.131,.128,.021]],undercoat);
    if(q.wounds)hitWounds(m,offset(chest,0,-.003,.215),.205,.14);
  }
  if(clean){
    const leather=[.284,.222,.147];
    const saddle=offset(rump,0,.071,.020);
    haunch(m,saddle,[[-.16,.111,.078,.037],[0,.165,.112,.054],[.155,.14,.082,.052],[.245,.084,.052,.037]],muzzle,7);
    line(m,offset(chest,0,.06,.125),offset(chest,0,.071,.181),.134,.131,leather,7);
    box(m,offset(chest,-.106,.082,.166),.042,.028,.035,[.48,.493,.425]);
    if(q.photo){
      // A familiar rolled leather collar, stamped disc and a split ring anchor
      // the close-up before the animal changes. The band follows its neck.
      const neck=offset(chest,0,.068,.156),loop=[];
      for(let j=0;j<=20;j++){
        const a=tau*j/20;loop.push(offset(neck,.137*Math.cos(a),.134*Math.sin(a),0));
      }
      for(const dz of [-.017,.017])for(let j=1;j<loop.length;j++){
        line(m,offset(loop[j-1],0,0,dz),offset(loop[j],0,0,dz),.0048,.0048,[.538,.426,.267],5);
      }
      const ring=offset(neck,-.112,-.088,.023);
      let prev;
      for(let j=0;j<=16;j++){
        const a=tau*j/16,pt=offset(ring,Math.cos(a)*.024,Math.sin(a)*.030,0);
        if(prev)line(m,prev,pt,.0041,.0041,silver,5);prev=pt;
      }
      line(m,offset(ring,0,-.052,.001),offset(ring,0,-.052,.008),.026,.026,[.584,.479,.291],16);
      box(m,offset(ring,0,-.052,.009),.025,.003,.003,dark);
      for(const side of [-1,1])for(let j=0;j<15;j++){
        const t=j/14,a=.50+.46*Math.sin(t*Math.PI),root=[side*(.112+.047*a),.051+.091*a,-.255+.368*t];
        const v=offset(rump,...root),k=.012+.009*Math.sin(j*2)**2;
        m.tri(offset(v,0,k,0),offset(v,-side*.014,-k,-.034),offset(v,side*.006,-.020,.009),j%3?hide:muzzle);
      }
    }
  }else{
  const parasite=insetMesh(m,offset(rump,.094,.15,-.126),0,1.24,.24);
  spineParasite(parasite,[0,0,0],.53,.034+q.generation*.006,cycle+.57,q.generation);
  if(q.generation){
    // A second segmented spine emerges through the withers. Its legs clasp the dog.
    spineParasite(m,offset(chest,-.056,.085,-.094),.175+.082*q.generation,.073,cycle-.49,q.generation);
    for(let i=0;i<3+q.generation;i++){
      const u=i/(2+q.generation),s=i%2?1:-1;
      const root=[rump[0]*(1-u)+chest[0]*u,rump[1]*(1-u)+chest[1]*u+.093,-.32+.47*u+thrust*(.25+.55*u)];
      const elbow=offset(root,s*.18,.093+.046*q.generation,-.032);
      const claw=offset(elbow,s*.12,-.045-.010*i,-.062);
      line(m,root,elbow,.053,.040,[.535,.146,.141],5);
      line(m,elbow,claw,.041,.014,[.66,.40,.28],5);
      if(q.generation>1)line(m,claw,offset(claw,-s*.018,-.107,.057),.018,.003,tooth,4);
    }
  }
  }
  const split=.032+.07*coil+.135*strike+.018*(breath+1)+.068*Math.abs(q.wake);
  for(const s of [-1,1]){
    for(const front of [true,false]){
      const root=front?chest:rump,limb=footfall(t,front?(s<0?.10:.23):(s<0?.61:.78),.46);
      const reach=move*limb.z,lift=move*limb.lift;
      const rootJoint=offset(root,s*(front?.16:.14),.005,front?.067:-.035);
      if(front&&(q.mask&(s<0?2:4))){woundSocket(m,rootJoint,.068,[s,-.35,.16]);continue;}
      const elbow=offset(rootJoint,s*(.076+.048*coil),front?-.161:-.19+(lift*.054),front?-.11+.07*reach:.126+.09*reach);
      const hock=[s*(front?.254:.231)+sidewave*.6,.16+.13*lift+.095*strike+.14*jump,
        root[2]+(front?.06:-.14)+reach*.20+(front?.13:-.10)*jump];
      const pad=[s*((front?.29:.26)+.069*coil+.073*fall+.022*crouch),
        .054+.171*lift+.068*strike+(front?.13:.19)*jump,
        root[2]+(front?.14:-.065)+reach*.31+(front?.21:-.16)*strike+(front?.34:-.28)*jump+(front?.07:.11)*crouch];
      line(m,rootJoint,elbow,front?.086:.113,front?.053:.065,hide,6);
      if(front&&(q.hits&(s<0?2:4)))hitWounds(m,offset(elbow,0,.066,.069),.071,.085);
      line(m,elbow,hock,.059,.033,s<0?undercoat:hide,5);line(m,hock,pad,.038,.025,s<0?joint:pitted,5);
      haunch(m,pad,[[-.054,.029,.036],[.014,.055,.049],[.10,.051,.023,-.012]],hide,5);
      for(const k of [-1,1])line(m,offset(pad,k*.024,-.012,.065),offset(pad,k*.041,-.04,.134),.014,.003,tooth,4);
    }
    if(clean)continue;
    // One flank opens in a row of little arches. The other still looks like short brindled fur.
    for(let j=0;j<4;j++){
      const u=j/3,base=[rump[0]*(1-u)+chest[0]*u+s*.09,rump[1]*(1-u)+chest[1]*u+.139,-.26+.124*j+thrust*(.32+.45*u)];
      const mid=offset(base,s*(.086+(s>0?split*.52:0)),-.048,.027);
      const end=offset(mid,s*(s>0?.031+split*.44:-.045),-.132-.035*coil,-.016);
      if(s>0){
        line(m,base,mid,.034,.034,undercoat,4);line(m,mid,end,.034,.014,bone,4);
        const innerRoot=offset(base,-s*.044,-.06,0);
        quad(m,innerRoot,offset(base,.025,-.04,.079),offset(end,-.042,.017,.061),end,inner);
      }else{
        const root=offset(base,s*.026,0,.01);
        m.tri(root,offset(root,s*.085,-.091,.071),offset(root,s*.101,-.108,-.003),j%2?hide:olive);
      }
    }
    // A folded fifth and sixth leg trail from inside the chest and open independently on the leap.
    if(q.mask&(s<0?2:4))continue;
    const flick=.04*Math.sin(cycle+s*1.07);
    const root=offset(chest,s*.122,-.094,.055),elbow=offset(root,s*(.17+.095*coil),-.055+.15*strike,-.118+flick);
    const wrist=offset(elbow,s*(.065+.13*strike),-.098+flick+.047*coil,.118+.25*strike);
    line(m,root,elbow,.041,.038,inner,5);line(m,elbow,wrist,.038,.019,sinew,5);
    line(m,wrist,offset(wrist,s*.025,-.039,.064+.08*strike),.020,.003,tooth,4);
  }
  const neck=offset(chest,-.009,.031,.143),head=offset(neck,sidewave*.4,.055+.019*breath+.071*strike,.120+.104*strike);
  if(q.mask&1)woundSocket(m,neck,.111,[0,.3,1]);
  else{
  line(m,neck,head,.131,.087,hide,6);
  const skull=insetMesh(m,head,.10*Math.sin(cycle+.2)*move+.16*coil+.20*Math.sin(cycle-.32)*crouch,
    -.17*coil+.13*strike+.39*crouch-.13*jump-.21*q.tear,.065*breath+.14*sting+.65*q.tear);
  haunch(skull,[0,0,0],[[-.118,.091,.095,.016],[-.027,.134,.112,.036],[.072,.119,.078,.033],[.156,.074,.045,.006],[.23,.048,.035,-.002]],muzzle);
  haunch(skull,[0,0,0],[[.203,.049,.032,.002],[.236,.050,.031,.001],[.251,.038,.014,-.007]],dark,6);
  if(q.hits&1)hitWounds(skull,[0,.042,.169],.097,.077);
  for(const s of [-1,1]){
    const ear=[s*.079,.105,-.044],b=offset(ear,s*.062,.032,-.034),tip=offset(ear,s*(.086+.055*coil),.135+Math.sin(cycle+(s<0?.45:1.72))*.011,-.065);
    skull.tri(ear,b,tip,hide);skull.tri(offset(ear,0,-.018,.033),tip,b,undercoat);
    if(q.photo){
      const outside=offset(ear,s*.016,-.011,.026),inside=offset(ear,s*.024,.017,.004),rim=offset(tip,-s*.010,-.026,.003);
      skull.tri(outside,inside,rim,clean?muzzle:inner);skull.tri(inside,b,rim,undercoat);
      const folds=[[s*.090,.034,.096],[s*.070,.019,.142],[s*.052,.009,.201]];
      for(let j=1;j<folds.length;j++)line(skull,folds[j-1],folds[j],.006,.004,clean?muzzle:undercoat,5);
      // Raised muzzle pads, sockets and the little notch in each nostril.
      haunch(skull,[s*.038,-.010,.181],[[-.041,.027,.017,.005],[-.012,.036,.024,.002],[.028,.025,.017],[.040,.015,.011]],muzzle,8);
      skull.tri([s*.023,.008,.247],[s*.036,.012,.243],[s*.031,.018,.241],[.073,.069,.060]);
    }
    const eye=[s*.105,.068,.073];line(skull,offset(eye,-s*.024,.015,.026),offset(eye,s*.012,-.006,-.029),.022,.018,dark,4);
    box(skull,offset(eye,s*.011,.002,.010),.011,.010,.013,clean?[.43,.364,.216]:s<0?amber:uv,clean?0:s<0?lit:phosphor);
    if(clean){
      if(s<0)haunch(skull,[0,0,0],[[.056,.078,.034,-.052],[.128,.070,.024,-.053],[.210,.043,.018,-.042]],hide,6);
      continue;
    }
    const open=split*(s<0?.63:1.13),jawBase=[s*.077,-.028,-.036];
    const hinge=offset(jawBase,s*.035,-.037, .078),snout=[s*(.043+open*.71),-.087-open,.212+.065*strike];
    line(skull,jawBase,hinge,.054,.044,undercoat,6);line(skull,hinge,snout,.044,.023,s<0?undercoat:sinew,6);
    quad(skull,jawBase,offset(hinge,-s*.02,-.012,.014),snout,offset(snout,-s*.024,.009,-.038),inner);
    for(let j=0;j<3;j++){
      const a=.209-j*.042;
      line(skull,[s*(.049+j*.012),-.019,.209-j*.042],[s*(.051+j*.011),-.075+(j%2)*.02,a+.011],.013,.002,tooth,4);
    }
    line(skull,offset(snout,0,0,-.034),offset(snout,-s*.012,.045,-.016),.011,.002,tooth,4);
  }
  if(q.generation>=2&&!clean){
    for(const s of [-1,1]){
      const root=[s*.081,-.044,.158],knee=offset(root,s*(.055+.064*coil),-.065,.122);
      line(skull,root,knee,.037,.028,[.53,.176,.15],5);
      line(skull,knee,offset(knee,-s*.058,.007,.124+.045*strike),.029,.003,tooth,4);
    }
  }
  }
  const tip1=offset(rump,-.049*breath,.074,-.176),tip2=offset(tip1,.144*Math.sin(cycle-.73)+.103*fall+.12*crouch,
    (clean?-.069:.066)-.10*coil-.095*fall-.087*crouch,-.244+.14*crouch);
  line(m,tip1,tip2,.050,.030,hide,5);line(m,tip2,offset(tip2,.095*Math.sin(cycle-1.45),-.086+.10*coil,-.202),.03,.005,undercoat,5);
}

function cantor(m,q) {
  const {breath,swing,tell,strike,sting,fall}=q;
  const wave=q.t*tau,suspense=q.coil;
  const c=[.046*breath+(sting*.084),1.56+.056*breath+.115*suspense-.159*strike-.125*fall,.073*swing+.163*strike];
  const aperture=-.038*suspense+.139*strike;
  const cap=offset(c,0,.347,-.045);
  shell(m,cap,[[-.04,.193,.127],[.008,.254,.154],[.11,.184,.108],[.154,.088,.063,.014,-.014]],gunmetal,7);
  line(m,offset(cap,0,.11,-.025),offset(cap,.03,.305,-.041),.030,.010,silver,5);
  const cage=offset(c,0,.037,-.093);line(m,offset(cage,0,-.271,0),offset(cap,0,.023,-.045),.055,.102,dark,6);
  // Individual bell petals separate around a throat which hangs without a jaw.
  for(let i=0;i<7;i++){
    const a=(i+.5)*tau/7+.051*Math.sin(wave-.64)+.18*suspense-.21*strike;
    const sx=Math.sin(a),sz=Math.cos(a),side=Math.cos(a),fore=-Math.sin(a);
    const at=(radius,y,width)=>offset(c,sx*radius+side*width,y,sz*radius+fore*width-.049);
    const A=at(.111,.305,-.044),B=at(.111,.305,.044);
    const M=at(.222+aperture*.4,.152,-.065),N=at(.222+aperture*.4,.152,.065);
    const y=-.033-(i%3)*.035+.031*Math.sin(wave+i)+.17*strike-.037*suspense,endR=.311+aperture+.024*(i%2);
    const L=at(endR,y,-.078),R=at(endR,y,.078),tip=at(endR+.029,y-.083,0);
    quad(m,A,M,N,B,i%3===0?bone:pitted);quad(m,M,L,R,N,i%2===0?glaze:bone);m.tri(L,tip,R,pitted);
    const I=at(endR-.035,y,-.050),J=at(endR-.035,y,.050);
    quad(m,L,I,J,R,iron);line(m,at(.20+aperture*.35,.154,0),at(endR-.004,y+.011,0),.012,.009,uv,4,phosphor);
    if(sz<.3){line(m,at(endR-.035,y,-.026),at(.16,-.22-.04*Math.sin(i),0),.027,.013,gunmetal,4);}
  }
  // An incomplete porcelain collar is suspended at a different angle to the bell.
  const auricle=offset(c,-.037,.222,-.041);
  for(let j=0;j<6;j++){
    const a=-1.63+j*.48+.11*Math.sin(wave+.73)-.36*suspense+.41*strike,b=a+.39;
    const ring=a=>offset(auricle,(.373+.053*strike)*Math.sin(a),(.103+.21*suspense)*Math.sin(a)+.043*Math.cos(a),(.209+.066*strike)*Math.cos(a));
    line(m,ring(a),ring(b),.017,.013,j%2?bone:silver,4);
  }
  const throat=offset(c,0,-.016-.06*suspense+.05*strike,.177-.05*suspense+.102*strike);
  guard(m,throat,.105+aperture,.10+aperture*.5,.029,.031,iron,9);
  shell(m,offset(throat,0,0,-.011),[[-.045,.035,.025],[0,.072+.035*strike,.034],[.043,.05,.023]],(suspense>.62||strike>.12)?amber:cold,6,lit);
  // The hanging clapper shines through even from behind as the shutters open.
  for(const s of [-1,1]){
    const jaw=offset(throat,s*(.07+.104*strike),-.05,.01),end=offset(jaw,s*(.042+.041*strike),-.105+.139*strike,-.043);
    line(m,jaw,end,.029,.019,bone,4);line(m,end,offset(end,-s*.026,-.085,0),.020,.003,(suspense>.62||strike>.12)?amber:pitted,4,(suspense>.62||strike>.12)?lit:0);
    const bell=offset(c,s*(.292+aperture),.008,-.05);
    const shoulder=offset(bell,s*(.059+.035*suspense),-.126+.152*suspense,0);
    line(m,bell,shoulder,.036,.029,gunmetal,4);
    line(m,shoulder,offset(shoulder,s*(.075+.101*strike+.052*suspense),-.257+.272*suspense-.043*strike,-.039+.195*strike),.033,.012,glaze,5);
  }
  for(let i=0;i<3;i++){
    const s=i-1,w=Math.sin(wave+i*2.19),z=(i%2)*.048;
    const a=offset(c,s*.09,-.195,-.055+z),b=offset(c,s*.143+w*.057,-.36-.06*(i%2),-.105+.056*Math.cos(wave+i));
    const d=offset(c,s*.085+w*.096+.031*suspense,-.56-.061*(i%2)+.085*suspense-.069*strike,-.113+.129*Math.sin(wave+i)+.124*strike);
    const end=offset(d,.113*Math.sin(wave+i*2.19-.66),-.166+.12*suspense-.031*strike,.036+.056*Math.cos(wave+i-1));
    line(m,a,b,.041,.032,joint,5);line(m,b,d,.032,.018,cable,4);line(m,d,end,.019,.004,i===1?uv:bone,4,i===1?phosphor:0);
  }
}

function carrier(m,q) {
  const {breath,swing,double,tell,strike,sting,fall}=q;
  const stride=q.t*tau,drag=Math.sin(stride-.78)*q.move;
  const wind=q.coil;
  const dip=-.036*double-.156*wind-.107*fall,lean=.25*strike-.109*sting;
  const trunk=[.075*swing,1.42+dip+.018*Math.sin(3*stride)*q.move,-.058+lean*.53];
  const c=offset(trunk,.064*drag,.572+.036*breath,.093+lean*.47+.027*drag);
  shell(m,trunk,[[-.20,.196,.181],[.016,.325,.274],[.217,.271,.21]],gunmetal,7);
  // A broad pair of forward stabilisers and a longer rear leg read as a tripod.
  for(let i=0;i<3;i++){
    const side=i===2?0:i===0?-1:1,footstep=footfall(q.t,i/3+.01,.72);
    const step=q.move*footstep.z,lift=q.move*footstep.lift;
    const root=offset(trunk,side*.26,-.077,side?.095:-.21);
    const knee=offset(trunk,side*(.50+.079*wind),-.558+lift*.139,(side?.05:-.467)+step*.14);
    const foot=[side*(.585+.152*wind+.045*fall),.111+.176*lift,(side?.24:-.405)+step*.235+(side?.172:-.1)*strike];
    line(m,root,knee,.159,.109,side===1?pitted:iron,6);
    line(m,knee,foot,.092,.054,joint,5);
    line(m,offset(knee,side*.07,-.02,.033),offset(foot,side*.034,.026,.05),.054,.028,side?bone:gunmetal,4);
    shell(m,foot,[[-.109,.108,.188,0,.035],[-.039,.136,.199,0,.028],[.062,.081,.119]],dark,5);
    line(m,offset(root,side*.07,.003,.062),offset(knee,side*.055,.003,.054),.024,.016,uv,4,phosphor);
  }
  line(m,offset(trunk,0,.115,-.142),offset(c,0,.427,-.157),.123,.171,dark,6);
  // Three overlapping ceramic vanes on either side fold away from the core.
  for(const s of [-1,1]){
    for(let j=0;j<3;j++){
      const split=.11*wind+.187*strike+.10*sting, y=-.25+j*.171;
      const root=offset(c,s*(.28+.067*j+split*.52),y+.069,-.119);
      const mid=offset(c,s*(.36+.053*j+split),y+.043,.037);
      const lip=offset(c,s*(.081+.071*j+split),y-.073,.253+.031*j);
      const rootB=offset(root,0,-.09,0),midB=offset(mid,0,-.115,0),tipB=offset(lip,s*.026,-.059,-.009);
      if(s>0){
        quad(m,root,mid,midB,rootB,pitted);quad(m,mid,lip,tipB,midB,j%2?glaze:bone);
      }else{
        quad(m,root,rootB,midB,mid,pitted);quad(m,mid,midB,tipB,lip,j%2?glaze:bone);
      }
      quad(m,midB,tipB,offset(tipB,-s*.015,.018,-.04),offset(midB,-s*.031,.02,-.031),iron);
      line(m,offset(mid,0,-.085,.013),offset(lip,0,-.035,.015),.014,.008,uv,4,phosphor);
    }
  }
  const mouth=offset(c,0,.012,.175);
  const opening=.033*wind+.092*strike;
  guard(m,mouth,.141+opening,.156+opening*.45,.039,.085,gunmetal,8);
  shell(m,offset(mouth,0,-.003,-.022),[[-.077,.034,.02],[0,.085+opening*.61,.048],[.067,.047,.024]],strike>.09||wind>.28?amber:uv,6,strike>.09||wind>.28?lit:phosphor);
  for(const s of [-1,1]){
    const shoulder=offset(c,s*.47,.204,-.026);
    const elbow=offset(c,s*(.651+.164*wind),-.154+.181*strike,-.08+.16*strike);
    const hand=offset(c,s*(.562+.29*wind),-.624+.39*strike,.07+.39*strike);
    line(m,shoulder,elbow,.111,.074,s<0?gunmetal:pitted,5);line(m,elbow,hand,.076,.043,dark,5);
    for(const k of [-1,1])line(m,offset(hand,k*.035,.028,0),offset(hand,k*.077,-.143+.064*strike,.066),.028,.007,bone,4);
    const a=offset(shoulder,0,-.034,-.144),b=offset(elbow,-s*.088,-.162,-.143);
    line(m,a,b,.022,.019,cable,4);line(m,b,offset(hand,0,.094,-.042),.019,.012,silver,4);
  }
  // The split dish rises behind one shoulder. Its broken rim twists as the core opens.
  const dish=offset(c,-.346,.261,-.139);
  const rim=(a,fold=0)=>offset(dish,-Math.cos(a)*(.235+opening)+fold,.34*Math.sin(a)+.044*fold,-.076+.135*Math.cos(a)-fold*.65);
  for(let j=0;j<5;j++){
    const a=-.46+j*.56,b=a+.43;
    const base=offset(dish,-.013,.046,-.050),l=rim(a),r=rim(b);
    m.tri(base,l,r,j%2?gunmetal:iron);
    line(m,l,r,.016,.013,j===3?glaze:pitted,4);
    if(j%2===0)line(m,base,r,.009,.007,silver,4);
  }
  // Crooked yagi frames are part of the silhouette even when every pilot is dark.
  const rack=offset(c,-.056,.349,-.132);
  box(m,rack,.524,.224,.319,iron);
  for(const s of [-1,1]){
    const a=offset(rack,s*.147,.073,-.044);
    const top=offset(a,s*(s<0?.20:.103)-.033*sting,s<0?.626:.457,-.089-.071*wind);
    line(m,a,top,.034,.014,silver,5);
    for(let j=0;j<3;j++){
      const k=.38+j*.218,mid=[a[0]+(top[0]-a[0])*k,a[1]+(top[1]-a[1])*k,a[2]+(top[2]-a[2])*k];
      const w=.134-j*.027;
      line(m,offset(mid,-w,0,-.033),offset(mid,w,0,.033),.011,.008,j===2?bone:gunmetal,4);
    }
  }
}

// A returnee acknowledges a sound with its head several frames before its
// second shoulder catches up. The trailing foot hardly clears the ground.
function risen(m,q,soldier=false){
  const {t,breath,move,tell,strike,sting,fall}=q,phase=t*tau;
  const sway=Math.sin(phase)*move, lag=Math.sin(phase-.75)*move,
    recoil=q.coil;
  const trousers=soldier?[.25,.267,.253]:[.217,.210,.202],coat=soldier?[.27,.291,.29]:[.304,.209,.219];
  const seam=soldier?[.356,.374,.337]:[.365,.26,.251],shirt=soldier?[.437,.397,.299]:[.493,.462,.39];
  const skin=soldier?[.469,.435,.35]:[.514,.481,.401],bruised=[.333,.309,.287],hair=soldier?[.24,.215,.18]:[.199,.175,.156],eye=[.588,.571,.487];
  const pelvis=[.029*sway,.909-.035*move+.026*Math.cos(phase*2)*move-.075*recoil-.09*fall,-.04];
  const shoulder=offset(pelvis,.050+.032*lag+.19*sting,.457-.006*breath-.061*recoil+.057*strike,.104+.084*move+.086*recoil+.22*strike);
  shell(m,pelvis,[[-.104,.14,.106],[-.016,.175,.116],[.093,.153,.109]],trousers,7);
  if(q.mask&8){
    line(m,offset(pelvis,0,.032,-.016),offset(shoulder,0,-.19,-.059),.132,.084,coat,7);
    tornChest(m,offset(shoulder,0,-.049,0),.218,.209,.141,coat,true);
  }else{
    line(m,offset(pelvis,0,.032,-.016),offset(shoulder,0,.02,-.025),.139,.177,coat,7);
    shell(m,shoulder,[[-.248,.155,.116,-.032,-.034],[-.08,.187,.14],[.09,.222,.142],[.138,.13,.101,.014]],coat,7);
    if(q.wounds)hitWounds(m,offset(shoulder,-.037,-.037,.141),.20,.165);
  }
  for(const s of [-1,1]){
    const step=footfall(t,s>0?.57:.02,s>0?.72:.52),reach=step.z*move*(s<0?1:.62),lift=step.lift*move*(s<0?1:.35);
    const hip=offset(pelvis,s*.103,-.037,0),knee=[s*(.137+.051*fall),.51+.091*lift-.04*recoil,.052+reach*.14+.025*(s+1)];
    const shoe=[s*(.169+.115*fall),.074+.119*lift-.006*(s+1),-.04+reach*.22];
    line(m,hip,knee,.101,.069,trousers,6);line(m,knee,shoe,.074,.053,trousers,5);
    shell(m,shoe,[[-.058,.067,.126,0,.048],[-.016,.075,.15,0,.045],[.072,.053,.073,0,-.013]],soldier?hair:dark,5);
    const collar=offset(shoulder,s*.085,.115,.088);
    m.tri(collar,offset(collar,s*.065,-.041,.024),offset(collar,-s*.053,-.141,.052),seam);
    const tail=offset(pelvis,s*.116,.111,.092);
    quad(m,tail,offset(tail,s*.049,.019,-.055),offset(tail,s*.058,-.214-.083*(s+1),-.02-.039*lag),offset(tail,-s*.025,-.162,.035+.035*lag),coat);
    const arm=offset(shoulder,s*.206,s<0?.078:-.016,-.007),lance=s<0?strike:Math.max(0,strike*.55);
    if(q.mask&(s<0?2:4)){woundSocket(m,arm,.061,[s,-.30,.11]);continue;}
    if(q.hits&(s<0?2:4))hitWounds(m,offset(arm,s*.017,-.095,.077),.071,.089);
    const elbow=offset(arm,s*(.037+.117*recoil+.12*fall),-.266+.09*recoil+.20*lance,-.042-.076*s*lag+.263*lance);
    const hand=offset(elbow,-s*(.017-.084*fall),s<0?-.22+.20*lance:-.279+.13*lance,.105-.071*s*sway+.20*lance);
    line(m,arm,elbow,.085,.066,coat,6);line(m,elbow,hand,.067,.049,coat,5);
    line(m,offset(hand,0,.028,-.016),hand,.051,.054,seam,5);
    for(const j of [-1,1])line(m,offset(hand,j*.021,.008,0),offset(hand,j*.034,-.081+.028*lance,.041+.038*lance),.023,.008,skin,4);
  }
  const throat=offset(shoulder,.035,.144,.024);
  const anchor=offset(throat,.044+.022*breath,.126-.034*recoil,.033+.069*recoil+.07*move);
  if(q.mask&1){woundSocket(m,throat,.059);return;}
  line(m,throat,anchor,.053,.058,bruised,6);
  const head=insetMesh(m,anchor,.17+.22*Math.sin(phase-.84)*(move+.23),.12+.061*breath+.17*recoil-.17*strike,-.20-.09*lag-.21*sting);
  shell(head,[0,0,0],[[-.084,.065,.083,0,.019],[-.026,.10,.107],[.061,.113,.115],[.121,.10,.09],[.141,.073,.057]],skin,7);
  if(q.hits&1)hitWounds(head,[.05,.019,.106],.065,.068);
  shell(head,[0,.006,-.015],[[.063,.111,.101],[.12,.108,.101],[.153,.071,.068]],hair,7);
  const mouth=offset([0,-.055,.102],.006,-.024*recoil,0);
  head.tri(offset(mouth,-.044,.024,0),offset(mouth,.043,.015,0),offset(mouth,.024,-.016,.009),bruised);
  head.tri([-.027,.07,.098],[.018,.071,.100],[-.007,.001,.131],skin);
  for(const s of [-1,1]){
    const hollow=[s*.053,.047+(s<0?.009:0),.102];
    line(head,offset(hollow,-s*.018,.008,.007),offset(hollow,s*.029,-.007,-.015),.015,.012,bruised,4);
    line(head,offset(hollow,-s*.008,-.004,.013),offset(hollow,s*.015,-.009,.001),.006,.007,eye,4);
    box(head,[s*.105,.015,-.004],.031,.054,.032,skin);
  }
  if(soldier){
    shell(head,[0,.091,-.006],[[0,.13,.122],[.037,.128,.125],[.097,.09,.096,.012,-.021],[.105,.058,.075,.018,-.032]],coat,7);
    box(head,[0,.104,.124],.19,.019,.098,dark);
    for(let j=0;j<3;j++)box(m,offset(shoulder,0,.022-j*.069,.143-j*.005),.024,.023,.013,[.55,.483,.312]);
    line(m,offset(shoulder,-.142,.087,.101),offset(pelvis,.131,.021,.102),.028,.028,hair,4);
    box(m,offset(pelvis,.145,.028,.106),.132,.123,.059,dark);
  }else{
    const a=offset(shoulder,-.038,.095,.112),b=offset(shoulder,.089,.098,.098);
    m.tri(a,b,offset(shoulder,.021,-.13,.151),shirt);
    for(let j=0;j<3;j++)box(m,offset(shoulder,.025,.023-j*.086,.142-j*.006),.013,.017,.009,bruised);
  }
}

function crewWeapon(prop,police,cloth,close=false){
  if(police){
    box(prop,[0,.03,.061],.040,.037,.163,iron);
    box(prop,[0,-.005,.005],.039,.082,.047,dark);
    box(prop,[0,.053,.129],.013,.010,.009,gunmetal);
  }else{
    box(prop,[0,.04,.093],.059,.091,.218,iron);
    box(prop,[0,.055,.246],.055,.062,.122,cloth);
    line(prop,[0,.063,.285],[0,.063,.470],.016,.013,dark,6);
    line(prop,[0,.064,.432],[0,.064,.478],.023,.020,iron,5);
    box(prop,[0,.047,-.087],.050,.049,.146,dark);
    box(prop,[0,.018,-.170],.066,.119,.051,cloth);
    box(prop,[0,-.029,.115],.044,.093,.058,dark);
    box(prop,[0,.104,.118],.045,.033,.056,gunmetal);
    line(prop,[0,-.117,.135],[0,-.008,.126],.023,.026,iron,5);
  }
  if(!close)return;
  const guard=police?[[0,.007,.009],[0,-.028,.015],[0,-.035,.063],[0,-.012,.090],[0,.015,.089]]:
    [[0,.012,.021],[0,-.037,.031],[0,-.044,.075],[0,-.024,.091],[0,.012,.095]];
  for(let i=1;i<guard.length;i++)line(prop,guard[i-1],guard[i],.0035,.004,gunmetal,5,5);
  if(police){
    for(const side of [-1,1]){
      const x=side*.0204;
      for(let i=0;i<5;i++){const z=.002+i*.006;quad(prop,[x,.027,z],[x,.027,z+.0025],[x,.045,z+.007],[x,.045,z+.004],gunmetal,5);}
      box(prop,[side*.015,.053,-.002],.005,.009,.010,gunmetal,5);
    }
    line(prop,[0,.032,.141],[0,.032,.144],.011,.010,dark,8,5);
    box(prop,[0,.001,.080],.029,.024,.049,gunmetal,7);
    return;
  }
  for(const side of [-1,1]){
    for(let i=0;i<3;i++)box(prop,[side*.0285,.06,.203+i*.032],.003,.010,.022,dark,5);
    line(prop,[side*.027,-.020,.075],[side*.037,-.087,.113],.005,.006,gunmetal,5,5);
    line(prop,[side*.020,.075,.40],[side*.017,.110,.407],.004,.004,iron,5,5);
    line(prop,[side*.019,.041,-.112],[side*.025,-.027,-.174],.007,.009,iron,5,5);
  }
  for(let i=0;i<5;i++)box(prop,[0,.091,.151+i*.024],.049,.005,.008,gunmetal,5);
  box(prop,[0,.092,.045],.043,.012,.047,gunmetal,5);
  line(prop,[0,.109,.1],[0,.109,.137],.017,.017,gunmetal,8,5);
  line(prop,[0,.109,.137],[0,.109,.138],.011,.011,[.292,.405,.414],8,6);
}

function ally(m,q,police=false,role='') {
  const torso=m,hit=q.reaction,weight=hit?.[3]||0;
  const joints=!q.hideWeapon&&!q.fall?(m.crewPose=[]):null;
  const {t,breath,swing,double,tell,strike,sting,fall,aid,rappel,land}=q,phase=t*tau;
  const ranger=role==='ranger',medic=role==='medic',search=ranger||medic,scout=role==='scout',support=role==='operator';
  const struggle=q.struggle||(q.pose==='grab'?1:0),kick=Math.sin(phase+.28),pull=Math.cos(2*phase-.74);
  const cloth=police?[.15,.181,.227]:ranger?[.281,.294,.233]:medic?[.201,.270,.296]:scout?[.404,.372,.27]:support?[.258,.281,.26]:canvas;
  const outer=police?[.177,.222,.28]:ranger?[.60,.315,.147]:medic?[.317,.425,.428]:scout?[.515,.454,.322]:support?[.385,.392,.32]:olive;
  const trim=police?[.238,.295,.343]:search?[.68,.653,.534]:scout?[.282,.282,.229]:faded;
  const skin=police?[.53,.405,.32]:ranger?[.494,.352,.274]:medic?[.49,.395,.325]:scout?[.389,.282,.201]:[.54,.451,.354];
  const skinShadow=police?[.39,.298,.241]:medic?[.348,.277,.228]:scout?[.28,.205,.159]:[.414,.342,.28];
  const y=-.025*double-.29*fall-.077*sting-.385*aid-.137*rappel-.326*land-.058*struggle;
  const hips=[-.092*fall+.031*swing+.047*kick*struggle,.94+y-.25*(q.seated?1:0),-.02+.07*fall+.096*aid+.112*rappel+.098*land];
  const chest=offset(hips,.031*swing+.175*fall-.077*sting-.044*kick*struggle+.028*rappel*breath,.37+.012*breath-.067*aid-.055*land,
    .008+.071*strike-.12*fall+.048*q.move+.137*aid-.125*rappel+.074*land-.13*struggle);
  const struckLeg=hit?.[0]?.endsWith('Leg'),struckHead=hit?.[0]==='head';
  if(hit){const amount=(struckHead?.045:.105)*weight;chest[0]+=hit[1]*amount;chest[2]+=hit[2]*amount;chest[1]-=(struckLeg?.17:.05)*weight;}
  const head=offset(chest,-.012-.062*fall+.030*struggle*kick,.312+tell*.006-.057*fall-.035*struggle,
    .028+.012*breath+.038*sting+.055*aid-.079*struggle+.034*land);
  chestRecorder(m,chest,medic,q.photo);
  if(joints){
    joints[0]=hips;joints[1]=offset(chest,0,.084,-.01);joints[2]=head;
    joints[15]=offset(chest,0,-.007,.142);joints[16]=offset(head,0,-.005,.104);joints[17]=offset(hips,0,-.004,-.114);
  }
  shell(m,hips,[[-.136,.143,.111],[-.014,.182,.123],[.106,.155,.107]],cloth,q.photo?12:7,q.photo?8:0);
  if(q.mask&8)tornChest(m,offset(chest,0,-.049,0),.218,.224,.147,outer,true);
  else{
    shell(m,chest,[[-.272,.151,.12],[-.087,.19,.138],[.109,.237,.145],[.177,.153,.102]],outer,q.photo?14:7,q.photo?8:0);
    shell(m,offset(chest,0,-.035,.02),[[-.111,.174,.138],[.096,.213,.152],[.144,.156,.114]],cloth,q.photo?12:6,q.photo?8:0);
    if(q.wounds)hitWounds(m,offset(chest,0,-.027,.17),.207,.19);
  }
  if(q.photo)shell(m,offset(hips,0,.043,.008),[[-.030,.175,.121],[-.022,.186,.133],[.022,.186,.133],[.030,.176,.124]],dark,12,9);
  else box(m,offset(hips,0,.043,.008),.352,.059,.241,dark);
  box(m,offset(hips,0,.047,.139),.073,.047,.017,police?silver:trim);
  for(const s of [-1,1]){
    const step=footfall(t,s===1?.52:.02),stride=q.move*step.z,lift=q.move*step.lift;
    const knee=[s*(.128+.159*fall)-.065*fall,.515+y*.53+.074*lift,.053+stride*.131+(s<0?.14:.052)*fall];
    const foot=[s*(.152+.269*fall)-.092*fall,.092+.134*lift+.058*fall,-.039+stride*.229-(s<0?.018:.092)*fall];
    if(rappel){
      knee[0]+=s*.068;knee[1]+=.084+.034*Math.sin(phase+s);knee[2]+=.197+.054*s;
      foot[0]-=s*.093;foot[1]+=.228+.049*Math.sin(phase+s);foot[2]+=.104+.031*s;
    }else if(land){
      knee[0]+=s*.083*land;knee[1]-=.089*land;knee[2]+=.236*land;foot[2]+=(s<0?.096:-.063)*land;
    }else if(struggle){
      const flail=Math.max(0,Math.sin(phase+s*1.36));
      knee[0]+=s*(.040+.114*flail);knee[1]+=.043+.14*flail;knee[2]+=.049+.19*flail;
      foot[0]+=s*(.055+.078*flail);foot[1]+=.037+.19*flail;foot[2]+=.135*kick*s-.066;
    }
    if(aid){
      knee[1]-=(s>0?.25:.079)*aid;knee[2]+=(s>0?.09:.215)*aid;
      foot[2]+=(s>0?-.29:.261)*aid;
    }
    if(q.seated){
      knee.splice(0,3,s*.154,.63,.34+s*.026);
      foot.splice(0,3,s*.163,.405,.51+s*.039);
    }
    const leg=m.tagJoint?.(s<0?'leftLeg':'rightLeg')||m;
    if(struckLeg&&hit[0]===(s<0?'leftLeg':'rightLeg')){knee[2]+=.16*weight;knee[1]-=.06*weight;foot[2]-=.078*weight;}
    const hip=offset(hips,s*.111,-.063,0);
    if(joints){const i=s<0?9:12;joints[i]=hip;joints[i+1]=knee;joints[i+2]=foot;}
    if(q.photo)uniformLeg(leg,hip,knee,foot,s,cloth,police?cloth:outer);
    else{
      line(leg,offset(hips,s*.111,-.063,0),knee,.108,.076,cloth,6);line(leg,knee,foot,.077,.054,police?cloth:outer,5);
      shell(leg,foot,[[-.09,.072,.135,0,.026],[-.038,.079,.161,0,.034],[.110,.069,.071,0,-.023]],dark,6);
    }
    if(q.legHits&(s<0?1:2))hitWounds(leg,offset(knee,-s*.016,.17,.048),.068,.093);
    if(!police&&q.photo&&!search)fieldKneepad(leg,knee,cloth);
    if(!police&&!q.photo)box(leg,offset(knee,0,0,.048),.123,.129,.056,iron);
    if(search){
      const stripe=offset(chest,s*.147,.045,.099);
      line(m,offset(stripe,0,.087,-.032),offset(stripe,-s*.02,-.105,.044),.028,.024,trim,4);
      box(m,offset(hips,s*.155,.019,-.015),.089,.107,.09,cloth);
    }else if(police){
      box(m,offset(chest,s*.106,-.045,.150),.111,.090,.021,outer);
      box(m,offset(chest,s*.106,-.012,.164),.115,.027,.012,trim);
      box(m,offset(hips,s*.181,.018,-.005),.065,.137,.066,dark);
    }else{
      box(m,offset(chest,s*.094,-.052,.137),.14,.126,.059,s<0?trim:outer);
      box(m,offset(chest,s*.094,-.016,.170),.132,.035,.012,cloth);
      line(m,offset(chest,s*.144,.14,.093),offset(chest,s*.12,.031,.149),.025,.021,trim,4);
    }
  }
  if(q.photo&&!(q.mask&8)){
    radioHarness(m,chest,cloth,outer);
    if(police)patrolKit(m,chest,hips,cloth,outer);
    if(search)rescueBack(m,chest,role,cloth,outer,trim);
    else{
    const back=offset(chest,.004,-.012,-.137);
    // The carrier, loose radio lead and shoulder webbing follow the torso through a crouch.
    shell(m,back,[[-.170,.113,.025],[-.147,.156,.061],[.073,.167,.064],[.122,.137,.045],[.139,.103,.026]],cloth,12,8);
    for(const side of [-1,1]){
      line(m,offset(chest,side*.13,.149,-.077),offset(back,side*.122,.075,-.055),.022,.018,outer,8,8);
      line(m,offset(back,side*.122,.075,-.056),offset(back,side*.104,-.131,-.052),.017,.014,outer,6,8);
      box(m,offset(back,side*.113,-.070,-.067),.043,.033,.009,joint,7);
      box(m,offset(back,side*.113,-.067,-.074),.028,.008,.005,iron,5);
    }
    for(let row=0;row<3;row++)for(let i=-1;i<=1;i++)box(m,offset(back,i*.055,-.046+row*.033,-.064),.047,.013,.008,outer,8);
    if(police)kitTape(m,offset(back,0,.067,-.066),'POLICE',.039,[.11,.143,.167],[.637,.646,.584]);
    line(m,offset(back,-.114,.028,-.065),offset(chest,-.189,.137,-.103),.008,.006,dark,6,7);
    line(m,offset(chest,-.189,.137,-.103),offset(chest,-.160,.156,.070),.006,.006,dark,6,7);
    }
  }
  if(q.mask&1)woundSocket(m,offset(chest,0,.165,.017),.072);
  else{
  line(m,offset(chest,0,.125,.011),offset(head,0,-.067,0),.076,.065,police?skinShadow:iron,6,q.photo&&police?11:0);
  if(struckHead){head[0]+=.078*hit[1]*weight;head[2]+=.072*hit[2]*weight;}
  const face=insetMesh(m.tagJoint?.('head')||m,head,(hit?hit[1]*weight*(struckHead?.52:.14):0)-.94*(q.passengerLook||0)+.13*Math.sin(t*tau-.72)*(1-.59*tell)+.17*fall+.24*kick*struggle,
    .037*breath-(q.pose==='skywatch'?.36:0)+(q.pose==='mapPoint'||q.pose==='mapStudy'?.50:0)+.32*fall+.40*aid+.26*rappel+.31*land-.35*struggle+(hit?hit[2]*weight*(struckHead?.43:.12):0),-.043+.31*fall+.053*sting+.23*struggle*pull+(hit?hit[1]*weight*.25:0));
  if(q.photo)portrait(face,skin,skinShadow,role||(police?'officer':'ally'),breath);
  else shell(face,[0,0,0],[[-.114,.067,.075,0,.027],[-.045,.102,.099],[.042,.112,.105],[.102,.080,.077]],skin,7);
  if(q.hits&1)hitWounds(face,[.041,-.027,.097],.066,.067);
  if(police){
    shell(face,[0,.014,-.015],[[-.019,.104,.109],[.060,.112,.114],[.102,.086,.086]],dark,7);
    shell(face,[0,.043,-.004],[[.003,.12,.118],[.033,.125,.127],[.07,.137,.124,.002,-.012],[.095,.085,.091,.001,-.019]],outer,8);
    if(q.photo)serviceVisor(face,dark);else box(face,[0,.055,.123],.185,.016,.084,dark);
    if(q.photo){
      const emblem=[.003,.087,.126];
      quad(face,offset(emblem,-.012,.011,0),offset(emblem,.012,.011,0),offset(emblem,.009,-.005,.003),offset(emblem,-.009,-.005,.003),silver,5);
      face.tri(offset(emblem,-.009,-.005,.003),offset(emblem,.009,-.005,.003),offset(emblem,.001,-.015,.005),silver,5);
    }else box(face,[.003,.093,.106],.025,.024,.011,silver);
    for(const s of [-1,1]){
      if(!q.photo)line(face,[s*.026,.008,.098],[s*.079,.012,.075],.009,.007,dark,4);
      if(!q.photo)box(face,[s*.105,-.014,-.011],.028,.057,.045,skin);
    }
    if(!q.photo)face.tri([-.018,.012,.100],[.019,.011,.100],[.006,-.035,.122],skinShadow);
    if(!q.photo)line(face,[-.037,-.070,.092],[.042,-.065,.089],.008,.005,skinShadow,4);
    const shield=offset(chest,-.10,.078,.157);
    quad(m,offset(shield,-.026,.016,0),offset(shield,.026,.016,0),offset(shield,.021,-.018,0),offset(shield,-.021,-.018,0),silver);
    m.tri(offset(shield,-.021,-.018,0),offset(shield,.021,-.018,0),offset(shield,0,-.042,.002),silver);
    box(m,offset(chest,.029,.103,.145),.046,.058,.027,dark);
    box(m,offset(chest,.029,.111,.161),.023,.016,.008,gunmetal);
  }else if(search){
    const cap=ranger?[.334,.301,.236]:[.264,.290,.303];
    shell(face,[0,.035,-.011],[[.004,.114,.114],[.059,.131,.127],[.12,.099,.102],[.143,.057,.063]],cap,q.photo?14:7,q.photo?8:0);
    for(const s of [-1,1]){
      if(!q.photo)line(face,[s*.021,.010,.100],[s*.081,.011,.080],.009,.006,dark,4);
      if(!q.photo)box(face,[s*.107,-.01,-.003],.028,.051,.039,skin);
    }
    if(!q.photo)face.tri([-.017,.016,.104],[.018,.012,.104],[.007,-.032,.129],skinShadow);
    if(!q.photo)line(face,[-.034,-.064,.092],[.040,-.061,.093],.006,.005,skinShadow,4);
    if(ranger){
      box(face,[0,.054,.125],.177,.018,.112,cloth);
      shell(face,[0,.036,-.007],[[.012,.125,.125],[.039,.130,.129]],cloth,7);
      box(face,[0,.071,.117],.065,.044,.031,dark);
      box(face,[0,.072,.135],.041,.028,.012,[.77,.75,.56],phosphor);
    }else{
      shell(face,[0,.034,-.004],[[.0001,.118,.115],[.044,.128,.125]],cloth,7);
      shell(face,[-.055,-.052,-.070],[[-.065,.052,.058],[.02,.071,.073],[.064,.053,.055]],dark,6);
    }
  }else{
    shell(face,[0,.045,-.009],[[-.036,.14,.142],[.04,.145,.148],[.105,.113,.116],[.129,.065,.07]],outer,q.photo?16:8,q.photo?7:0);
    if(q.photo)helmetHardware(face,trim,role);
    else{
      box(face,[0,.002,.098],.178,.044,.041,dark);box(face,[0,.01,.121],.145,.014,.006,gunmetal);
      for(const s of [-1,1])box(face,[s*.115,-.014,-.006],.033,.085,.085,joint);
    }
    if(scout||support){
      const fabric=scout?[.45,.406,.326]:[.303,.318,.29];
      box(face,[0,.107,.111],scout?.101:.153,.046,.049,joint);
      if(scout){
        for(const s of [-1,1]){
          line(face,[s*.137,.042,-.012],[s*.066,.083,.092],.013,.012,trim,4);
          box(face,[s*.045,.083,.119],.065,.034,.016,[.451,.390,.228]);
        }
        shell(face,[0,-.063,-.004],[[-.072,.099,.084,0,-.024],[-.001,.117,.107],[.042,.103,.102]],fabric,7);
        face.tri([-.068,-.064,.087],[.075,-.066,.084],[.049,-.169,.089],trim);
      }else{
        box(face,[0,-.042,.085],.166,.062,.084,dark);
        for(const s of [-1,1])box(face,[s*.077,-.048,.084],.050,.068,.051,cloth);
      }
    }
    line(face,[-.132,-.028,.008],[-.075,-.061,.095],.009,.008,dark,4);
  }
  }
  const raise=Math.max(tell,q.attack?.94:0)*(1-fall),flinch=fall*(1-fall)*4;
  const atMap=q.pose==='mapPoint'||q.pose==='mapStudy';
  const issued=q.issuedWeapon||(!search?(scout?'carbine':'pistol'):null);
  const armed=!!issued&&!q.holstered&&!q.hideWeapon&&!atMap&&aid<.52&&!struggle&&!rappel&&land<.26;
  const sidearm=issued!=='carbine';
  const yaw=-.07-(scout?.37:.13)*(1-raise)+.028*swing;
  const pitch=.61*(1-raise)-.14*strike+.039*q.move*double+.44*fall;
  const grip=offset(chest,-.074-.044*fall,-.17+.232*raise+.026*strike+(scout?.050*(1-raise):0),.165+.115*raise-.047*strike);
  const foregrip=sidearm?offset(grip,.030,-.007,.029):offset(grip,.017+.245*Math.sin(yaw)*Math.cos(pitch),
    .006-.245*Math.sin(pitch),.245*Math.cos(pitch)*Math.cos(yaw));
  for(const s of [-1,1]){
    const m=torso.tagJoint?.(s<0?'leftArm':'rightArm')||torso;
    const shoulder=offset(chest,s*.215,.084+(s<0?.074:0)*fall,-.01);
    if(q.mask&(s<0?2:4)){woundSocket(m,shoulder,.066,[s,-.31,.08]);continue;}
    const stride=s*swing;
    const elbow=offset(shoulder,s*(.066+.047*raise+.174*fall+.11*flinch+.034*aid),-.231+.090*raise+.107*fall+.11*flinch,
      -.035+stride*.091+.055*raise-.13*fall+.084*aid);
    let hand=armed?(s<0?grip:foregrip):offset(elbow,s*(-.023-.145*aid+.089*fall),-.172+.179*aid+.088*fall,
      .101+.202*aid+stride*.070-.11*fall);
    if(q.seated){
      elbow[0]=chest[0]+s*.253;elbow[1]=chest[1]-.155;elbow[2]=chest[2]+.015;
      hand=offset(hips,s*.145,.101+(s<0?.034:0),.235+s*.025);
    }
    if(q.pose==='keypad'&&s>0){
      const reach=smooth(clamp01(t/.23))*(1-smooth(clamp01((t-.74)/.25)));
      const tap=.020*Math.sin(t*tau*4.4)*reach;
      elbow[0]+=.045;elbow[1]+=.11*reach;elbow[2]+=.174*reach;
      hand=offset(chest,.16,-.074+.094*reach,.19+.303*reach+tap);
      if(reach>.48)line(m,offset(hand,-.018,.014,.026),offset(hand,-.020,.014,.075+tap),.010,.007,skin,6);
    }else if(q.pose==='mapPoint'||q.pose==='mapStudy'){
      const point=q.pose==='mapPoint'&&s<0,t=point?.5+.5*Math.sin(phase):0;
      elbow[2]+=.14;elbow[1]+=.10;
      hand=offset(chest,s*(point?.045:.16),-.13-.07*t,point?.50+.09*t:.29);
    }else if(rappel){
      elbow[0]=shoulder[0]+s*.10;elbow[1]+=s>0?.25:.037;elbow[2]+=.098;
      hand=s>0?[.076,1.63+.053*breath,.149]:[.056,.988+.042*Math.sin(phase-.71),.175];
    }else if(struggle){
      const push=Math.max(0,Math.sin(phase+s*.94));
      elbow[0]+=s*(.08+.104*push);elbow[1]+=.213+.131*push;elbow[2]+=.099;
      hand=offset(chest,s*(.067+.211*push),.23+.123*push,.116+.182*push);
    }else if(land>.26){
      elbow[0]+=s*.065*land;elbow[2]+=.069*land;
      hand=offset(elbow,-s*.042,-.166,.11+.091*land);
    }
    if(hit){
      const struck=hit[0]===(s<0?'leftArm':'rightArm'),pull=(struck?.22:.06)*weight;
      elbow[0]+=(hit[1]+s*.63)*pull;elbow[2]+=hit[2]*pull;
      hand=offset(hand,pull*(hit[1]+s*.25),-pull*(struck?1.2:.7),pull*(hit[2]-.65));
    }
    if(joints){const i=s<0?3:6;joints[i]=shoulder;joints[i+1]=elbow;joints[i+2]=hand;}
    if(q.photo)uniformArms(m,shoulder,elbow,hand,s,outer,cloth,skin,police,!police&&!search);
    else{
      line(m,shoulder,elbow,.086,.06,outer,6);
      line(m,elbow,hand,.061,.042,police?skin:cloth,5);
      shell(m,hand,[[-.05,.039,.037],[.001,.048,.046],[.043,.040,.039]],police||search?skin:dark,5);
    }
    if(q.hits&(s<0?2:4))hitWounds(m,offset(shoulder,s*.035,-.119,.059),.064,.095);
    const patch=offset(shoulder,s*.078,-.067,-.008);
    box(m,patch,.015,.057,.073,police?cloth:trim);
    box(m,offset(patch,s*.010,.002,0),.006,.019,medic?.068:.043,medic?[.57,.124,.13]:outer);
    if(medic)box(m,offset(patch,s*.011,.002,0),.007,.047,.022,[.57,.124,.13]);
    if(armed&&s<0&&!q.patrolPartner)crewWeapon(insetMesh(m,hand,yaw,pitch),sidearm,cloth,q.photo);
    if(aid>.55&&s<0&&!q.stableMesh){
      box(m,offset(hand,.011,-.031,.062),.11,.083,.122,trim);
      box(m,offset(hand,.011,-.031,.126),.074,.024,.009,medic?[.59,.167,.16]:cloth);
    }
  }
  if(q.patrolPartner){
    const mount=armed?insetMesh(m,grip,yaw,pitch):insetMesh(m,offset(hips,.185,-.014,.013),0,1.45);
    crewWeapon(mount,true,cloth,q.photo);
  }
  if(!armed&&!q.hideWeapon&&!q.patrolPartner&&issued){
    if(sidearm)crewWeapon(insetMesh(m,offset(hips,-.163,.002,.012),0,1.42),true,cloth,q.photo);
    else{
      const sling=offset(chest,-.105,-.138,-.173);
      crewWeapon(insetMesh(m,sling,-.34,1.08,-.24),false,cloth,q.photo);
      line(m,offset(chest,-.159,.126,.056),offset(chest,.121,-.18,.157),.017,.014,trim,4);
    }
  }
  if(rappel){
    const rope=[.298,.277,.218],low=[.035,.49,.178],top=[.076,2.10,.147];
    const feed=[.055,.992+.04*Math.sin(phase-.71),.175];
    line(m,low,feed,.016,.016,rope,5);line(m,feed,top,.016,.016,rope,5);
    for(const s of [-1,1])line(m,offset(hips,s*.138,.03,.057),offset(hips,s*.085,-.162,.117),.029,.024,trim,4);
    guard(m,offset(hips,.056,.011,.139),.036,.042,.009,.013,gunmetal,6);
  }
  if(scout||support){
    const harness=offset(chest,0,.094,.133);
    box(m,offset(harness,-.054,-.012,.012),.112,.036,.016,[.555,.504,.363]);
    for(let i=0;i<3;i++){
      const p=offset(chest,-.092+i*.088,-.114,.141);
      box(m,p,.077,.10,.057,scout?trim:outer);box(m,offset(p,0,.026,.035),.069,.019,.018,cloth);
    }
    if(support)for(const s of [-1,1])shell(m,offset(chest,s*.191,.065,.006),[[-.06,.080,.104],[.04,.081,.108],[.095,.046,.074]],outer,6);
  }
  if(!police){
    const pack=offset(chest,.032,-.035,-.153);
    if(search){
      shell(m,pack,[[-.257,.115,.109,0,-.043],[-.171,.185,.128,0,-.073],[.084,.177,.125,0,-.069],[.178,.115,.104,0,-.051]],
        medic?[.442,.305,.231]:cloth,7);
      box(m,offset(pack,0,-.034,-.178),.228,.183,.048,outer);
      if(medic){
        const flap=offset(pack,0,-.035,-.209);
        box(m,flap,.119,.080,.008,trim);box(m,offset(flap,0,0,-.007),.067,.018,.006,[.53,.099,.106]);
        box(m,offset(flap,0,0,-.008),.02,.055,.007,[.53,.099,.106]);
      }else{
        const roll=offset(pack,0,.172,-.064);
        line(m,offset(roll,-.205,0,0),offset(roll,.205,0,0),.077,.076,trim,7);
        for(const s of [-1,1])line(m,offset(roll,s*.131-.013,0,0),offset(roll,s*.131+.013,0,0),.080,.080,dark,7);
      }
    }else if(scout||support){
      shell(m,pack,[[-.195,.099,.089,0,-.042],[-.123,.149,.123,0,-.055],[.105,.141,.116,0,-.049],[.175,.085,.074,0,-.031]],cloth,7);
      const antenna=offset(pack,scout?.072:-.095,.104,-.112);
      line(m,antenna,offset(antenna,scout?.11:-.05,scout?.30:.20,-.047),.014,.004,iron,4);
      if(scout){
        const roll=offset(pack,0,-.159,-.059);
        line(m,offset(roll,-.146,0,0),offset(roll,.146,0,0),.058,.057,trim,7);
      }else box(m,offset(pack,0,.002,-.131),.19,.173,.083,outer);
    }else{
      box(m,pack,.292,.297,.119,cloth);box(m,offset(pack,-.064,.068,-.079),.149,.144,.053,dark);
      line(m,offset(pack,-.094,.111,-.078),offset(pack,-.102,.381,-.112),.012,.005,iron,4);
      box(m,offset(chest,.117,.122,.112),.061,.022,.009,cold,lit);
    }
  }
}

const models={
  hollow,hound,cantor,carrier,grey,ally,risen,kennelDog:(m,q)=>hound(m,q,true),scout:(m,q)=>ally(m,q,false,'scout'),operator:(m,q)=>ally(m,q,false,'operator'),
  infected:host,worm,golem,offcut:buildOffcut,roach:buildCellarRoach,cultist,witch,wraith,witness,
  risenSoldier:(m,q)=>risen(m,q,true),officer:(m,q)=>ally(m,q,true),
  ranger:(m,q)=>ally(m,q,false,'ranger'),medic:(m,q)=>ally(m,q,false,'medic')
};
const collapseAxes={
  hollow:[.30,-1.47],hound:[.18,1.17],kennelDog:[.21,1.18],scout:[-1.49,-.23],operator:[1.43,.27],cantor:[-1.28,.28],carrier:[-1.49,-.20],ally:[-1.55,.105],
  officer:[1.54,-.11],grey:[1.41,-.26],risen:[-1.52,.15],risenSoldier:[1.49,-.17],
  infected:[-1.53,.21],golem:[1.41,-.46],cultist:[-1.45,-.31],witch:[1.51,.27],
  worm:[.23,-.37],wraith:[-.4,1.42],witness:[-1.5,.21],ranger:[-1.43,.32],medic:[1.49,-.24]
};
export function buildEntity(mesh,kind,pose='idle',t=0,damage={}) {
  const draw=models[kind];if(!draw)return mesh;
  mesh.fineSkin=!!damage.photo;
  const q=motion(pose==='wallCrawl'?'move':pose,clamp01(t),damage);if(pose==='wallCrawl')q.pose=pose;q.photo=!!damage.photo;q.stableMesh=!!damage.stableMesh;q.legHits=(damage.wounds?.leftLeg?1:0)|(damage.wounds?.rightLeg?2:0);q.reaction=damage.reaction;q.hideWeapon=!!damage.hideWeapon;q.issuedWeapon=damage.issuedWeapon;q.writhe=damage.writhe??t;q.standing=damage.standing;
  q.seated=!!damage.seated;q.passengerLook=damage.passengerLook||0;
  q.patrolPartner=!!damage.patrolPartner;q.holstered=!!damage.holstered;q.attendant=!!damage.attendant;
  if(q.pose==='leap'&&(kind==='hound'||kind==='infected')){
    const part=insetMesh(mesh,[0,leapHeight(kind,q.t),0],0,0);
    draw(part,q);return mesh;
  }
  if(kind==='worm'){
    if(q.anchored&&q.pose==='fall'){q.pose='sink';q.fall=0;}
    if(q.pose==='rise')q.fall=0;
  }
  if(!q.fall){draw(mesh,q);return mesh;}

  // Settle each articulated body onto its lowest vertex so the fall works on
  // every placement height and the final silhouette lies flush with the floor.
  const [pitch,roll]=collapseAxes[kind],ca=Math.cos(q.fall*pitch),sa=Math.sin(q.fall*pitch);
  const cb=Math.cos(q.fall*roll),sb=Math.sin(q.fall*roll);
  const flatten=kind==='hound'||kind==='kennelDog'?.40:kind==='worm'?.21:(kind==='ally'||kind==='officer')?.14:.06;
  const compression=1-flatten*q.fall;
  let minY=Infinity;const triangles=[];
  const rotate=([x,y,z])=>{
    const up=y*ca-z*sa, forward=y*sa+z*ca;
    const p=[x*cb-up*sb,(x*sb+up*cb)*compression,forward];minY=Math.min(minY,p[1]);return p;
  };
  const local=Object.create(mesh);
  local.tri=(a,b,c,color,material=0)=>triangles.push([rotate(a),rotate(b),rotate(c),color,material]);
  draw(local,q);
  const floating=kind==='cantor'?.77:kind==='wraith'?.40:0;
  const settling=floating*(1-q.fall);
  const floor=settling-minY+.002;
  for(const [a,b,c,color,mat] of triangles){a[1]+=floor;b[1]+=floor;c[1]+=floor;mesh.tri(a,b,c,color,mat);}
  return mesh;
}
