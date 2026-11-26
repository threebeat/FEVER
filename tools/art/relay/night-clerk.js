import {offset,line,shell,quad,insetMesh} from './actor-geometry.js';
const tau=Math.PI*2,uv=13;
const shadow=[.102,.127,.234],ink=[.181,.236,.389],smoke=[.324,.395,.564],bone=[.579,.649,.752],phosphor=[.79,.875,.918];
const shine=color=>color===phosphor?uv:color===bone||color===smoke?12:0;
const ring=(m,p,w,d,h,color,n=8)=>shell(m,p,[[-h,w*.45,d*.48],[-h*.45,w*.93,d*.92],[0,w,d],[h*.61,w*.81,d*.83],[h,w*.35,d*.44]],color,n,shine(color));
function filament(m,path,radii,color){
 for(let j=1;j<path.length;j++)line(m,path[j-1],path[j],radii[j-1],radii[j],color,5,shine(color));
}
function fold(m,root,side,phase,long){
 const flap=.035*Math.sin(phase*2+side),l=long?1.28:1;
 const edge=offset(root,side*.157,.073,-.036);
 const tip=offset(root,side*(.333+flap)*l,.207+.044*Math.sin(phase+side),-.086);
 const lower=offset(root,side*.173,-.038,-.081),ridge=offset(root,side*.097,.004,.034);
 m.tri(root,ridge,edge,bone,12);m.tri(edge,ridge,tip,smoke,12);m.tri(ridge,lower,tip,ink,0);
 filament(m,[root,edge,tip],[.016,.012,.002],phosphor);
 m.tri(root,lower,ridge,shadow,0);
}
function face(m,phase,v){
 const w=v===0?.192:v===1?.223:.204;
 shell(m,[0,0,0],[[-.137,.064,.061,0,.034],[-.081,w*.72,.101,0,.021],[.008,w,.140],[.095,w*.92,.132],[.156,w*.49,.091]],smoke,11,12);
 // The dark orbital hollows and teeth sit on the front surface in both renderers.
 for(const side of [-1,1]){
  const lid=.012+Math.pow(Math.max(0,Math.cos(phase+.4)),38)*.024;
  const p=[side*w*.55,.04,.137],outer=offset(p,side*.059,.028,-.017),inner=offset(p,-side*.058,-.004,.018),bottom=offset(p,0,-.041+lid,.013);
  m.tri(outer,inner,bottom,shadow,0);filament(m,[inner,p,outer],[.008,.012,.011],bone);
  const pin=offset(p,.013*Math.sin(phase),-.011,.013);ring(m,pin,.012,.006,.010,phosphor,5);
  fold(m,[side*w*.79,.059,-.014],side,phase,v===2);
  const root=[side*w*.59,.123,-.048],middle=offset(root,side*.033,.09,-.054),tip=offset(middle,-side*.046,.061+.04*(side>0&&v===1),-.059);
  filament(m,[root,middle,tip],[.043,.022,.002],bone);
 }
 const snout=[.009,-.004,.142];m.tri([-.032,.017,.134],[.028,.019,.136],offset(snout,0,-.031,.037),ink,0);
 const points=[];
 for(let i=-4;i<=4;i++){
  const a=i/4,x=a*w*.78,y=-.058+.042*a*a+sideGrin(a),z=.154-.045*a*a;
  points.push([x,y,z]);
  if(i>-4){
   const b=points[points.length-2],c=points.at(-1);
   quad(m,b,c,offset(c,0,-.025,-.001),offset(b,0,-.026,0),shadow,0);
   m.tri(offset(b,.002,0,.002),offset(c,-.003,0,.002),[(b[0]+c[0])*.5,(b[1]+c[1])*.5-.014-.012*(i%3===0),z+.002],phosphor,uv);
  }
 }
 function sideGrin(a){return Math.max(0,a)*.018;}
}
export function nightClerk(m,q){
 const v=q.variant%3,shift=Math.floor(q.variant/3),phase=q.t*tau,walk=q.move,cast=q.pose==='castTell'?q.t:0,carry=q.carry||0,whip=q.throw||0,dive=q.pose==='dive'?q.t:0;
 const beckon=q.pose==='taunt'?Math.sin(Math.PI*q.t)**.55:0;
 const bob=.042*Math.sin(phase+.6)+walk*(.044+.05*Math.sin(2*phase-.39)),cock=.10*Math.sin(phase*.998+v)+.32*beckon;
 const stern=[.039*Math.sin(phase)+.09*whip,.739+bob+.066*carry-.20*dive,.026+.091*whip+.09*dive],hip=offset(stern,-.012,-.174,-.069);
 ring(m,stern,.125,.105,.144,ink,9);ring(m,hip,.098,.087,.086,smoke,8);
 filament(m,[hip,offset(stern,0,-.068,-.093),offset(stern,0,.106,-.067)],[.055,.043,.048],bone);
 for(let j=0;j<4;j++){
  const y=-.071+j*.041,rad=.090+.018*Math.sin((j+1)*.7);
  for(const s of [-1,1])filament(m,[offset(stern,0,y,-.076),offset(stern,s*rad,y+.019,.001),offset(stern,s*.031,y-.012,.091)],[.014,.012,.006],smoke);
 }
 const neck=offset(stern,cock*.29,.116,.037),skull=offset(neck,cock*.27,.137,.07+.055*cast);
 filament(m,[offset(stern,0,.032,.011),neck,skull],[.053,.029,.051],smoke);
 face(insetMesh(m,skull,-.12+.15*Math.sin(phase-.59)-.32*dive,.21*Math.sin(phase+.2*v),cock-.08),phase,v);
 // The staff still wear fragments of the things on their own time cards.
 if(shift===1){
  const shoulder=offset(stern,-.116,.085,.044),tie=offset(stern,.028,-.164,.115);
  filament(m,[shoulder,offset(stern,-.04,.006,.121),tie],[.010,.009,.014],bone);
  quad(m,tie,offset(tie,.055,-.015,-.003),offset(tie,.046,-.073,.009),offset(tie,-.014,-.055,.013),smoke,12);
 }else if(shift===2){
  for(const side of [-1,1])filament(m,[offset(skull,side*.185,.036,.084),offset(skull,side*.207,.099,-.003),offset(skull,side*.123,.191,-.075),offset(skull,0,.196,-.085)],[.023,.014,.010,.004],bone);
  filament(m,[offset(skull,-.185,.022,.095),offset(skull,-.225,-.041,.115),offset(skull,-.086,-.083,.204)],[.013,.010,.006],smoke);
 }else if(shift===3){
  for(const side of [-1,1])for(let j=0;j<3;j++){
   const a=offset(stern,side*(.051+j*.019),.102-j*.023,.038),tip=offset(a,side*(.121-j*.02),.08+.026*Math.sin(phase+j),-.158);
   m.tri(a,tip,offset(a,side*.055,-.097,-.025),j%2?smoke:bone,12);
  }
 }
 for(const side of [-1,1]){
  const sign=side>0?1:-1,lift=(.5+.5*Math.sin(phase*2+side))*walk,arm=side>0?whip:cast;
  const sh=offset(stern,side*.122,.059,-.011),el=offset(sh,side*(.108+.094*carry+.12*arm),-.148+.15*carry+.18*arm+.20*beckon*(side>0),-.062+.083*lift),
    hand=offset(el,side*(.093-.11*arm),-.166+.286*carry+.12*arm+.17*dive+beckon*(side>0)*(.235+.033*Math.sin(phase*3)),.151+.149*arm+.097*lift);
  filament(m,[sh,el,hand],[.051,.034,.021],smoke);ring(m,el,.039,.033,.034,bone,7);ring(m,hand,.051,.037,.044,bone,7);
  for(let j=-1;j<=2;j++){
   const b=offset(hand,side*j*.016,-.014,.018),kn=offset(b,side*(j*.022-.010),-.042+.057*cast,.049),
     nail=offset(kn,side*j*.013,-.041-.014*(j===1)+beckon*(side>0)*(.043-.038*Math.cos(phase*3)),-.003+.045*arm);
   filament(m,[b,kn,nail],[.014,.011,.002],j===2?smoke:phosphor);
  }
  const k=offset(hip,side*(.145+.046*lift),-.102-.039*lift,.146+.045*Math.sin(phase+side)),
    heel=offset(k,side*.026,-.131+.075*lift,-.156+.129*Math.sin(phase+sign*1.52)*walk);
  filament(m,[offset(hip,side*.059,0,0),k,heel],[.062,.044,.025],ink);ring(m,k,.048,.044,.049,smoke,7);
  for(let j=-1;j<=1;j++)filament(m,[heel,offset(heel,j*.032,-.024,.061),offset(heel,j*.049,-.033,.104)],[.018,.013,.002],bone);
 }
 // A trail of punched-out clock-card chads hangs from the end of the spine.
 const tail=[hip];for(let j=1;j<6;j++){const u=j/5;tail.push(offset(hip,-.064*u+.122*u*Math.sin(phase-u*2),-.047-.135*Math.sin(u*2.47)+.184*u*u,-u*(.273+.09*dive)));}
 filament(m,tail,[.033,.026,.020,.015,.008,.002],bone);
 for(let j=1;j<4;j++){
  const root=tail[j],s=j%2?-1:1;
  m.tri(root,offset(root,s*.059,-.039,.008),offset(root,s*.012,-.071,-.052),smoke,12);
 }
}
