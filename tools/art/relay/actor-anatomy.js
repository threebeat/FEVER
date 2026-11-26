import {offset,line,box,quad,shell,insetMesh} from './actor-geometry.js';

const tau=Math.PI*2;
export const tissue={
 clot:[.22,.039,.054],deep:[.106,.018,.033],blood:[.49,.056,.065],muscle:[.59,.196,.176],
 torn:[.69,.359,.283],fat:[.72,.541,.356],ivory:[.73,.647,.465],hide:[.44,.353,.29]
};
const lead=[.18,.201,.188];
const sideOf=part=>part==='leftArm'?-1:1;

export function woundSocket(m,p,r,dir=[0,1,0]){
 const b=offset(p,dir[0]*r*.42,dir[1]*r*.42,dir[2]*r*.42);
 line(m,p,b,r,r*.81,tissue.blood,7);
 const pin=offset(b,dir[0]*r*.56-r*.07,dir[1]*r*.56,dir[2]*r*.56+r*.1);
 line(m,b,pin,r*.33,r*.24,tissue.ivory,5);
 for(let i=0;i<2;i++){
  const sign=i?1:-1,a=offset(b,sign*.34*r,r*.04,sign*.24*r);
  line(m,a,offset(a,dir[0]*r*.49,dir[1]*r*.32-r*.55,dir[2]*r*.62),r*.22,r*.062,tissue.muscle,4);
 }
}

export function hitWounds(m,p,width,height){
 const at=(x,y,z)=>offset(p,x*width,y*height,z);
 // Raised rims catch grazing light while the center stays dark. The blood drains with gravity.
 for(const [cx,cy,r] of [[-.22,.13,.18],[.22,-.11,.12]]){
  const center=at(cx,cy,.009),n=7;
  const point=(i,size,lift)=>{
   const a=i/n*tau+.19,irregular=1+.15*Math.sin(a*3+.5);
   return offset(center,Math.cos(a)*width*r*size*irregular,Math.sin(a)*width*r*size,lift);
  };
  for(let i=0;i<n;i++){
   const a=point(i,1,.002),b=point(i+1,1,.002),c=point(i+1,.60,.008),d=point(i,.60,.008);
   quad(m,a,b,c,d,i%3===0?tissue.muscle:tissue.blood);
   m.tri(center,d,c,tissue.deep);
  }
  const bottom=point(5,1,.005);
  m.tri(bottom,offset(bottom,width*.063,-height*.11,.002),offset(bottom,width*.016,-height*.34,-.002),tissue.clot);
 }
}

// The aperture runs completely through the mass. Broken ribs and strands stand inside its rim.
export function tornChest(m,p,w,h,d,color,drape=false){
 const points=[[-.57,-1],[.32,-.98],[.77,-.67],[.91,-.13],[1,.64],[.80,.94],[.19,1],[-.59,.98],[-.96,.66],[-1,.19],[-.84,-.55]];
 const rim=[],inlet=[],back=[],innerBack=[];
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i],zFactor=.75+.23*(1-Math.abs(x));
  const jag=1+.16*Math.sin(2.21*i),gapX=.095*w,gapY=-.085*h;
  rim.push(offset(p,x*w,y*h,d*zFactor));
  back.push(offset(p,x*w*.93,y*h,-d*.86));
  inlet.push(offset(p,gapX+x*w*.46*jag,gapY+y*h*.43*jag,d*(.86+.12*Math.cos(i))));
  innerBack.push(offset(p,gapX+x*w*.40*jag,gapY+y*h*.40*jag,-d*.78));
 }
 for(let i=0;i<points.length;i++){
  const j=(i+1)%points.length;
  quad(m,rim[i],inlet[i],inlet[j],rim[j],color);
  quad(m,back[j],innerBack[j],innerBack[i],back[i],color);
  quad(m,rim[j],back[j],back[i],rim[i],color);
  quad(m,inlet[i],innerBack[i],innerBack[j],inlet[j],i%3===0?tissue.muscle:tissue.deep);
  const a=inlet[i],b=inlet[j],tip=offset(a,-points[i][0]*w*.12,-.11*h,-.065*d);
  m.tri(a,tip,b,i%3===1?tissue.blood:tissue.clot);
 }
 for(const s of [-1,1]){
  for(let i=0;i<2;i++){
   const a=offset(p,s*w*(.48+.035*i),h*(.18-i*.23),d*.76);
   line(m,a,offset(a,-s*w*(.15+.065*i),-h*.055,-d*.20),w*.064,w*.021,tissue.ivory,4);
  }
 }
 if(drape){
  const a=offset(p,-w*.14,-h*.47,d*.76),b=offset(a,-w*.10,-h*.29,d*.32),c=offset(b,w*.37,-h*.20,d*.30);
  line(m,a,b,w*.07,w*.095,tissue.muscle,5);line(m,b,c,w*.094,w*.082,tissue.blood,5);
  line(m,c,offset(c,w*.14,h*.39,-d*.19),w*.083,w*.054,tissue.muscle,5);
 }
}

export function spineParasite(m,start,length,bulk,phase=0,generation=0){
 const scale=1+Math.min(2,generation)*.14,sides=bulk>.051?7:5;
 const axis=u=>offset(start,Math.sin(phase+u*6.2)*bulk*(.22+u*.81),u*length,
  bulk*(.14+.56*Math.sin(u*Math.PI)-.39*u+.18*u*Math.cos(u*4.15+Math.sin(phase))));
 const radius=u=>bulk*(.36+.61*Math.sin(Math.PI*(.03+.93*u)))*scale;
 const section=(u,k)=>{const a=axis(u),r=radius(u)*k;
  return Array.from({length:sides},(_,i)=>offset(a,Math.sin(i*tau/sides+.17)*r,0,Math.cos(i*tau/sides+.17)*r*.89));
 };
 let prev=section(0,.77);
 for(let j=1;j<sides-1;j++)m.tri(prev[0],prev[j],prev[j+1],tissue.clot);
 for(let i=0;i<7;i++){
  for(const [u,size,tone] of [[.19,1.12,tissue.torn],[.83,.98,i%2===0?tissue.muscle:tissue.blood],[1,.71,tissue.clot]]){
   const ring=section((i+u)/7,size);
   for(let j=0;j<sides;j++){
    const k=(j+1)%sides;
    quad(m,prev[j],prev[k],ring[k],ring[j],tone);
   }
   prev=ring;
  }
 }
 for(let j=1;j<sides-1;j++)m.tri(prev[0],prev[j+1],prev[j],tissue.blood);
 const tip=axis(1),bite=.012+.008*Math.sin(phase);
 for(const s of [-1,1])line(m,offset(tip,s*bulk*.21,0,0),offset(tip,s*(bulk*.33+bite),bulk*.89,bulk*.45),bulk*.18,bulk*.04,tissue.ivory,4);
 return tip;
}

function intestine(m,center,r=1){
 let prev;
 for(let i=0;i<=13;i++){
  const t=i/13,theta=t*tau*1.63;
  const p=offset(center,Math.sin(theta)*(.075+.039*t)*r,(.19-.35*t)*r,Math.cos(theta)*.075*r);
  if(prev)line(m,prev,p,(.027+.008*Math.sin(theta)**2)*r,(.024+.005*Math.cos(theta)**2)*r,i%4?tissue.muscle:tissue.clot,5);
  prev=p;
 }
}

const colors={
 infected:[.317,.326,.249],golem:[.466,.276,.241],cultist:[.237,.183,.190],witch:[.281,.252,.222],
 ally:[.30,.33,.26],officer:[.182,.217,.269],ranger:[.60,.319,.148],medic:[.32,.411,.424],
 grey:[.465,.49,.474],risen:[.31,.24,.22],risenSoldier:[.27,.29,.277],kennelDog:[.42,.331,.236],scout:[.409,.381,.279],operator:[.36,.37,.302],hound:[.322,.239,.20],worm:tissue.muscle
};
const kit=['operator','scout','ally','officer','ranger','medic','infected','player'];
function tornHood(m,shade){
 shell(m,[0,.021,-.012],[[.006,.13,.113],[.094,.133,.121],[.159,.100,.103,.009,-.022],[.176,.05,.053,.019,-.049]],shade,7);
 for(const s of [-1,1])quad(m,[s*.119,.09,.024],[s*.115,.057,.104],[s*.096,-.109,.069],[s*.14,-.085,-.085],shade);
}
export function buildGib(mesh,kind,part='flesh'){
 part=({1:'head',2:'leftArm',4:'rightArm',8:'torso'})[part]||part;
 const color=colors[kind]||[.344,.317,.285],coat=kit.includes(kind);
 const m=insetMesh(mesh,[0,0,0],.19,-.08,.13);
 if(part==='head'){
  if(kind==='worm'){
   shell(m,[0,0,0],[[-.18,.16,.15],[-.07,.20,.18],[.08,.222,.176],[.15,.122,.107]],tissue.blood,8);
   for(const s of [-1,1]){
    const joint=[s*.174,.079,.07],tip=[s*.217,.16,.232];
    line(m,joint,tip,.066,.040,tissue.ivory,5);line(m,tip,[s*.114,.18,.301],.04,.008,tissue.ivory,5);
   }
  }else if((kind==='hound'||kind==='kennelDog')){
   shell(m,[0,0,0],[[-.085,.108,.115],[.012,.137,.194],[.104,.119,.139]],color,6);
   line(m,[0,.025,.079],[0,-.009,.247],.083,.050,color,6);
   for(const s of [-1,1])m.tri([s*.06,.09,-.046],[s*.141,.081,-.091],[s*.135,.211,-.107],color);
  }else{
   const skin=kind==='grey'?colors.grey:kind==='golem'?tissue.torn:[.511,.435,.355];
   shell(m,[0,0,0],[[-.106,.08,.079,0,.04],[-.07,.112,.118],[.044,.13,.136],[.116,.104,.10,0,-.012],[.14,.070,.065]],skin,7);
   for(const s of [-1,1]){
    const eye=[s*.057,.040,.112];
    line(m,offset(eye,-s*.026,.012,.004),offset(eye,s*.031,-.008,-.02),.019,.018,s===1?tissue.clot:lead,4);
   }
   m.tri([-.025,.052,.126],[.029,.048,.125],[.017,-.003,.159],skin);
   line(m,[-.052,-.059,.096],[.049,-.068,.102],.012,.015,tissue.deep,4);
   if(kind==='cultist'||kind==='witch')tornHood(m,color);
   else if(coat||kind==='risenSoldier'){
    shell(m,[0,.061,-.006],[[.003,.14,.137],[.045,.141,.141],[.100,.106,.102],[.116,.062,.063]],color,7);
    if(kind==='ranger'||kind==='officer')box(m,[0,.073,.129],.184,.017,.124,lead);
   }else if(kind==='golem')woundSocket(m,[-.049,.083,.096],.045,[.2,.7,.34]);
  }
  woundSocket(m,[0,-.066,-.025],kind==='worm'?.11:.071,[0,-1,-.2]);
 }else if(part==='leftArm'||part==='rightArm'||part==='arm'){
  const s=sideOf(part),root=[-s*.045,.237,-.08],elbow=[s*.048,.003,-.063],hand=[s*.025,-.205,.099];
  if(kind==='worm'||(kind==='hound'||kind==='kennelDog')){
   line(m,root,elbow,.076,.058,tissue.clot,6);line(m,elbow,hand,.06,.032,kind==='worm'?tissue.ivory:color,5);
   line(m,hand,offset(hand,-s*.066,-.037,.114),.032,.005,tissue.ivory,4);
  }else{
   line(m,root,elbow,.085,.062,color,6);line(m,elbow,hand,.061,.039,coat?color:tissue.torn,5);
   shell(m,hand,[[-.046,.054,.044],[.023,.051,.044],[.055,.038,.031]],kind==='cultist'||kind==='ranger'?lead:tissue.torn,5);
   for(let j=-1;j<=1;j++)line(m,offset(hand,j*.018,-.039,.013),offset(hand,j*.029,-.093+.01*j,.039),.014,.006,tissue.torn,4);
  }
  woundSocket(m,root,.065,[0,.91,-.32]);
 }else if(part==='torso'){
  const center=[.015,.015,.013];
  tornChest(m,center,.157,.161,.073,color,true);
  for (const s of [-1,1]) line(m,[s*.126,.061,.057],[s*.145,.098,.084],.024,.010,tissue.ivory,4);
 }else if(part==='gut'||part==='guts')intestine(m,[0,-.028,0],.92);
 else if(part==='bone') {
  line(m,[-.07,-.128,-.036],[.063,.121,.035],.023,.036,tissue.ivory,5);
  woundSocket(m,[.039,.079,.019],.036,[.37,.8,.42]);
 }else{
  shell(m,[0,0,0],[[-.061,.045,.034],[.007,.071,.052,.012],[.062,.037,.049,-.014,.012]],tissue.muscle,5);
  m.tri([-.045,.033,.02],[.031,.026,.059],[.021,-.103,.043],tissue.blood);
 }
 return mesh;
}
