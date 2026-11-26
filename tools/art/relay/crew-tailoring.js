import {box,line,offset,quad,shell} from './actor-geometry.js';

const twill=8,rubber=7,metal=5;
const hem=[.20,.205,.175],sole=[.095,.095,.089],leather=[.161,.151,.137],alloy=[.44,.47,.46];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// Matte woven tape bends across the carrier. All lettering is in the same
// animated mesh and catches the room light like the cloth underneath it.
const tapeLetters={
 P:[[0,0,0,1,.46,1,.63,.84,.63,.66,.46,.52,0,.52]],
 O:[[.14,0,0,.17,0,.84,.14,1,.48,1,.62,.84,.62,.16,.48,0,.14,0]],
 L:[[0,1,0,0,.61,0]],I:[[0,1,.56,1],[.28,1,.28,0],[0,0,.56,0]],
 C:[[.61,.86,.47,1,.16,1,0,.84,0,.16,.16,0,.47,0,.61,.14]],
 E:[[.61,1,0,1,0,0,.61,0],[0,.52,.48,.52]],
 M:[[0,0,0,1,.32,.52,.64,1,.64,0]],D:[[0,0,0,1,.37,1,.62,.77,.62,.23,.37,0,0,0]],
 S:[[.60,.85,.47,1,.12,1,0,.82,0,.65,.14,.53,.47,.46,.60,.32,.60,.15,.46,0,.13,0,0,.12]],
 A:[[0,0,.25,1,.37,1,.63,0],[.12,.41,.51,.41]],R:[[0,0,0,1,.46,1,.62,.83,.62,.67,.46,.53,0,.53],[.32,.53,.66,0]]
};
export function kitTape(m,base,word,height,cloth,ink){
 const half=(word.length*.88-.25)*height/2,edge=half+.011;
 const at=(x,y,z=0)=>offset(base,x,y,.009*Math.abs(x)/edge+z);
 for(const side of [-1,1])quad(m,at(0,-.007),at(side*edge,-.007),at(side*edge,height+.008),at(0,height+.008),cloth,twill);
 for(let i=0;i<word.length;i++)for(const stroke of tapeLetters[word[i]]){
  for(let j=2;j<stroke.length;j+=2){
   // Reverse the pen's horizontal axis: the lettering is seen from behind.
   const x0=half-(i*.88+stroke[j-2])*height,x1=half-(i*.88+stroke[j])*height;
   const y0=stroke[j-1]*height,y1=stroke[j+1]*height,dx=x1-x0,dy=y1-y0;
   const k=height*.080/Math.hypot(dx,dy),ex=dy*k,ey=-dx*k;
   quad(m,at(x0-ex,y0-ey,-.0014),at(x1-ex,y1-ey,-.0014),at(x1+ex,y1+ey,-.0014),at(x0+ex,y0+ey,-.0014),ink,twill);
  }
 }
}

export function fieldKneepad(m,knee,cloth){
 const outline=[[-.43,1],[-.80,.83],[-.98,.40],[-.88,-.28],[-.61,-.81],[-.30,-1],[.30,-1],[.61,-.81],[.88,-.28],[.98,.40],[.80,.83],[.43,1]];
 const at=(x,y,lift=0)=>offset(knee,x*.076,y*.081,.071+.023*(1-x*x)-.010*y*y+lift);
 const outer=outline.map(([x,y])=>at(x,y)),lip=outline.map(([x,y])=>at(x*.93,y*.91,.005));
 const plate=outline.map(([x,y])=>at(x*.83,y*.79,.010)),peak=at(0,.19,.019),face=[.148,.156,.143];
 for(let i=0;i<outer.length;i++){
  const j=(i+1)%outer.length;quad(m,outer[i],outer[j],lip[j],lip[i],cloth,twill);
  quad(m,lip[i],lip[j],plate[j],plate[i],sole,rubber);m.tri(plate[i],plate[j],peak,face,rubber);
 }
 for(const y of [-.37,-.05,.32])for(const side of [-1,1]){
  quad(m,at(side*.04,y,.022),at(side*.55,y+.09,.014),at(side*.52,y+.15,.014),at(side*.04,y+.06,.022),sole,rubber);
 }
}

// The tube follows both animated joints. Elliptical, biased rings describe a folded
// sleeve or trouser leg, with the forward axis projected into the cross-section.
export function tailoredLimb(m,a,b,profile,cloth,material=twill) {
 const v=b.map((n,i)=>n-a[i]),length=Math.hypot(...v)||1;
 const ux=v[0]/length,uy=v[1]/length,uz=v[2]/length;
 const len=Math.hypot(ux,uy);
 const X=len>.001?[-uy/len,ux/len,0]:[1,0,0];
 const Z=[uy*X[2]-uz*X[1],uz*X[0]-ux*X[2],ux*X[1]-uy*X[0]];
 const sides=m.lowDetail?8:16;
 let last;
 for(const [phase,width,depth,bias] of profile){
  const root=mix(a,b,phase),ring=[];
  for(let i=0;i<sides;i++){
   const theta=(i+.5)*Math.PI*2/sides;
   // The heavier textile bunches diagonally where the elbow or knee bends.
   const fold=material===twill?1+(.015+.051*Math.sin(Math.PI*phase)**2)*Math.sin(3*theta+phase*8):1;
   const x=Math.cos(theta)*width*fold,z=Math.sin(theta)*depth*fold+bias;
   ring.push(root.map((p,j)=>p+X[j]*x+Z[j]*z));
  }
  if(last)for(let i=0;i<sides;i++)quad(m,last[i],last[(i+1)%sides],ring[(i+1)%sides],ring[i],cloth,material);
  last=ring;
 }
}

const thigh=[[0,.10,.092,0],[.16,.113,.112,-.005],[.48,.101,.091,.004],[.76,.082,.073,-.003],[.83,.093,.082,.009],[.93,.079,.067,.014],[1,.079,.071,.004]];
const calf=[[0,.077,.072,0],[.18,.081,.086,-.011],[.46,.080,.091,-.013],[.69,.064,.071,-.013],[.79,.072,.063,-.004],[.88,.061,.064,.01],[.94,.066,.067,0],[1,.060,.061,0]];
const upperSleeve=[[0,.083,.079,0],[.12,.098,.093,.003],[.44,.089,.080,-.005],[.59,.079,.070,.005],[.70,.084,.074,.009],[.88,.061,.061,-.008],[1,.064,.06,0]];
const foreSleeve=[[0,.063,.06,0],[.17,.073,.071,.005],[.44,.062,.057,.002],[.68,.052,.055,.002],[.80,.059,.052,-.004],[.89,.047,.046,.001],[1,.043,.041,.003]];

export function uniformLeg(m,hip,knee,foot,side,cloth,lower,part="all"){
 if(part==="all"||part==="shin")tailoredLimb(m,knee,foot,calf,lower);
 if(part==="all"||part==="thigh"){
 tailoredLimb(m,hip,knee,thigh,cloth);
 const pocket=mix(hip,knee,.39);
 shell(m,offset(pocket,side*.088,.012,-.011),[[-.094,.024,.068],[-.078,.039,.077],[.036,.041,.082],[.077,.024,.073]],cloth,8,twill);
 const panel=offset(pocket,side*.125,.048,-.011);
 quad(m,offset(panel,0,.037,-.07),offset(panel,0,.037,.07),offset(panel,side*.004,-.020,.056),offset(panel,side*.007,-.03,-.064),lower,twill);
 }
 if(part!=="all"&&part!=="boot")return;
 shell(m,foot,[[-.087,.074,.136,0,.040],[-.067,.081,.143,0,.037],[-.058,.078,.142,0,.041]],sole,10,rubber);
 shell(m,foot,[[-.059,.077,.140,0,.04],[-.031,.077,.137,0,.039],[-.012,.072,.126,0,.041],[.014,.066,.083,0,.005],[.063,.064,.070,0,-.013],[.104,.066,.063,0,-.018]],leather,10,rubber);
 const tongue=offset(foot,0,.036,.064);
 quad(m,offset(tongue,-.032,-.034,.031),offset(tongue,.032,-.034,.031),offset(tongue,.029,.051,-.019),offset(tongue,-.029,.051,-.019),sole,rubber);
 for(let i=0;i<4;i++){
  const y=.002+i*.019,z=.090-i*.012;
  for(const s of [-1,1]){
   const eye=offset(foot,s*.037,y,z);
   box(m,eye,.011,.008,.006,hem,metal);
   line(m,eye,offset(foot,-s*.037,y+.018,z-.009),.0028,.0034,sole,4,twill);
  }
 }
 // Pulled loops and relief on the sole interrupt the boot silhouette from behind.
 const heel=offset(foot,0,.075,-.077);
 for(const s of [-1,1])quad(m,offset(heel,s*.013,-.020,0),offset(heel,s*.013,.045,-.016),offset(heel,s*.006,.050,-.014),offset(heel,s*.006,-.020,0),hem,twill);
 for(const s of [-1,1])for(const [dx,z] of [[.057,-.062],[.076,.006],[.072,.076],[.050,.14]]){
  box(m,offset(foot,s*dx,-.082,z),.021,.016,.030,sole,rubber,s*.32);
 }
}
export function uniformArms(m,shoulder,elbow,hand,side,outer,cloth,skin,police,gloved){
 tailoredLimb(m,shoulder,elbow,upperSleeve,outer);
 if(police){
  tailoredLimb(m,elbow,hand,foreSleeve,skin,11);
  const cuff=mix(shoulder,elbow,.71);tailoredLimb(m,cuff,elbow,[[0,.080,.075,0],[.27,.084,.079,0],[.38,.082,.077,0],[.45,.086,.078,0],[.58,.084,.076,0]],cloth);
 }else tailoredLimb(m,elbow,hand,foreSleeve,cloth);
 const shade=gloved?leather:skin,mat=gloved?rubber:11;
 shell(m,hand,[[-.044,.032,.035,0,.005],[-.016,.043,.044],[.022,.040,.038],[.042,.034,.031]],shade,10,mat);
 // Separated finger ends and hooked thumb, visible on the unarmed search crew too.
 for(let i=0;i<4;i++){
  const knuckle=offset(hand,side*(.026-i*.017),-.032,.024);
  const curl=offset(knuckle,-side*.002,-.027+(i===3?.008:0),-.004);
  line(m,knuckle,curl,.009,.008,shade,5,mat);
  line(m,curl,offset(curl,-side*.002,-.007,-.016),.008,.005,shade,5,mat);
 }
 line(m,offset(hand,side*.032,.019,.022),offset(hand,side*.048,-.016,.034),.014,.009,shade,6,mat);
}

// Long high-visibility back panel, radio and shaped storm hood read as different
// pieces before the fine cloth weave becomes visible in the flashlight.
export function rescueBack(m,chest,role,cloth,outer,trim){
 const p=offset(chest,0,-.027,-.171),medic=role==='medic';
 const body=medic?[.235,.324,.322]:[.478,.255,.127];
 shell(m,p,[[-.19,.096,.036],[-.158,.138,.074],[-.074,.148,.094],[.073,.142,.090],[.122,.135,.076],[.161,.097,.052],[.169,.055,.036]],body,12,twill);
 const bottom=offset(p,.011,-.097,-.078);
 shell(m,bottom,[[-.079,.106,.027],[-.057,.127,.041],[.008,.128,.036],[.048,.105,.019]],cloth,10,twill);
 kitTape(m,offset(p,0,.044,-.094),medic?'MED':'SAR',.036,trim,[.206,.236,.204]);
 if(medic){
  box(m,offset(bottom,0,-.015,-.042),.064,.016,.006,[.58,.39,.32],8);
  box(m,offset(bottom,0,-.015,-.043),.019,.060,.005,[.58,.39,.32],8);
 }
 for(const side of [-1,1]){
  line(m,offset(chest,side*.081,.136,-.093),offset(p,side*.090,.15,-.048),.027,.023,outer,7,twill);
  line(m,offset(p,side*.09,.15,-.048),offset(p,side*.14,.088,-.061),.023,.011,outer,7,twill);
  line(m,offset(p,side*.123,-.012,-.038),offset(p,side*.119,-.045,-.068),.005,.005,alloy,5,metal);
 }
}

export function radioHarness(m,chest,cloth,trim){
 const p=offset(chest,-.155,.028,.13),caseTone=[.131,.145,.136];
 shell(m,p,[[-.055,.033,.018],[-.046,.038,.023],[.041,.038,.023],[.052,.031,.016]],caseTone,8,rubber);
 for(let i=0;i<3;i++)box(m,offset(p,0,.001+i*.010,.023),.047,.004,.004,hem,rubber);
 box(m,offset(p,-.016,.052,0),.016,.019,.023,hem,rubber);
 line(m,offset(p,.019,.048,.005),offset(p,.027,.125,-.007),.006,.003,caseTone,6,rubber);
 const c=[offset(p,-.023,.057,.004),offset(chest,-.183,.151,.066),offset(chest,-.175,.158,-.059),offset(chest,-.149,.071,-.138)];
 for(let i=1;i<c.length;i++)line(m,c[i-1],c[i],.005,.005,caseTone,5,rubber);
 const neck=offset(chest,0,.145,.004);
 for(const side of [-1,1]){
  const top=offset(neck,side*.082,.042,-.057),front=offset(neck,side*.041,-.062,.129),tip=offset(neck,side*.125,-.027,.095);
  m.tri(top,front,tip,trim,twill);m.tri(top,tip,offset(neck,side*.15,.018,-.067),cloth,twill);
 }
}

export function patrolKit(m,chest,hips,cloth,outer){
 const p=(x,y,z)=>offset(chest,x,y,z);
 const black=[.086,.099,.111],cover=[.144,.165,.182],edge=[.29,.304,.299],steel=[.429,.446,.409];
 // A textile lip runs around the ballistic panel instead of a straight printed stripe.
 const rim=[[-.164,.132,.105],[-.123,.146,.114],[-.077,.104,.158],[.075,.104,.158],[.129,.142,.114],[.167,.125,.103]];
 for(let j=1;j<rim.length;j++)line(m,p(...rim[j-1]),p(...rim[j]),.0075,.0075,cover,5,twill);
 for(const s of [-1,1]){
  const shoulder=p(s*.132,.119,.085),end=p(s*.147,.047,.145);
  const a=offset(shoulder,-.020,0,0),b=offset(shoulder,.019,0,0),c=offset(end,.014,0,0),d=offset(end,-.013,0,0);
  quad(m,a,b,c,d,cover,twill);
  const base=p(s*.103,-.052,.167);
  const u=offset(base,-.053,.038,-.010),v=offset(base,.055,.038,-.010),tip=offset(base,.008,.006,.015);
  m.tri(u,v,tip,outer,twill);m.tri(u,tip,offset(base,-.047,.002,.008),cloth,twill);
  m.tri(v,offset(base,.047,.002,.007),tip,cloth,twill);
  const snap=offset(tip,0,.004,.001);
  shell(m,snap,[[-.003,.006,.0025],[.001,.007,.0035],[.004,.005,.002]],cover,7,rubber);
 }
 // The dark optic and its outer ring break up both the camera casing and its highlight.
 const c=p(.028,.102,.169);
 box(m,c,.048,.066,.015,black,rubber);line(m,offset(c,0,.010,.004),offset(c,0,.010,.015),.018,.017,edge,12,metal);
 line(m,offset(c,0,.010,.012),offset(c,0,.010,.017),.013,.012,[.063,.106,.119],12,6);
 box(m,offset(c,-.016,-.019,.008),.005,.004,.002,[.53,.281,.146],10);
 for(let j=0;j<3;j++)box(m,offset(c,.008,-.015-j*.004,.009),.019,.0015,.0025,cover,rubber);
 const badge=p(-.101,.070,.1595);
 line(m,offset(badge,0,.002,0),offset(badge,0,.002,.006),.013,.013,[.262,.29,.308],11,5);
 line(m,offset(badge,0,.002,.005),offset(badge,0,.002,.007),.0065,.006,steel,10,5);
 for(const s of [-1,1])for(const [x,y,z] of [[.156,.031,.095],[.064,.030,.126]]){
  const belt=offset(hips,s*x,y,z);box(m,belt,.019,.067,.013,black,9);
  box(m,offset(belt,0,.020,.007),.007,.008,.002,edge,5);
 }
}

export function serviceVisor(m,trim){
 const brim=[.181,.177,.166,.149,.127,.091],black=[.092,.103,.112],piping=[.245,.261,.248];
 const row=(side,i,front)=>[side*i*.0207,.053-.012*(i/5)**1.8+(front?-.010:0),front?brim[i]:.107-.029*(i/5)**2];
 for(const side of [-1,1])for(let i=1;i<brim.length;i++){
  const a=row(side,i-1,false),b=row(side,i,false),c=row(side,i,true),d=row(side,i-1,true);
  quad(m,a,b,c,d,trim,9);
  quad(m,d,c,offset(c,0,-.006,-.001),offset(d,0,-.006,-.001),black,9);
  quad(m,offset(a,0,-.005,0),offset(b,0,-.005,0),offset(c,0,-.006,-.001),offset(d,0,-.006,-.001),black,9);
  line(m,offset(d,0,.0009,-.006),offset(c,0,.0009,-.006),.0012,.0012,piping,4,8);
 }
 for(const side of [-1,1]){
  const corners=[[side*.012,.059,.117],[side*.055,.059,.112],[side*.094,.053,.092],[side*.116,.055,.052]];
  for(let j=1;j<corners.length;j++){
   const a=corners[j-1],b=corners[j];quad(m,a,b,offset(b,0,.007,.001),offset(a,0,.007,.001),black,9);
  }
  const lo=[side*.107,.054,-.035],hi=[side*.065,.125,-.002];
  line(m,lo,hi,.002,.0025,trim,4,8);
 }
}
