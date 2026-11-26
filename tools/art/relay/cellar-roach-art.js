import {offset,quad,line,shell,haunch,insetMesh} from './actor-geometry.js';
const dark=[.108,.061,.049],shellTone=[.251,.104,.055],amber=[.457,.268,.125],chitin=[.305,.133,.071],joint=[.185,.094,.059],wing=[.395,.301,.21],black=[.058,.045,.041];
export function buildCellarRoach(mesh,q){
 const t=q.t*2*Math.PI,flight=q.pose==='wing',crushed=q.pose==='shell',low=crushed?.058:.112;
 const m=crushed?insetMesh(mesh,[.025,.049,0],.13,-.06,.29):mesh;
 const tail=[0,low,-.086],head=[0,low+.035,.283];
 haunch(m,tail,[[-.46,.055,.040],[-.36,.158,.079],[-.19,.192,.104],[.06,.180,.101],[.19,.131,.077]],dark,8);
 for(let j=0;j<5;j++){
  const z=-.39+j*.077,w=.092+.079*Math.sin((j+.7)*.44);
  line(m,[-w,low-.015,z],[0,low-.056,z-.024],.024,.021,chitin,6);line(m,[0,low-.056,z-.024],[w,low-.015,z],.021,.024,chitin,6);
 }
 for(const side of [-1,1]){
  const f=insetMesh(m,[side*.062,low+.072,.108],0,flight?-.16-.13*Math.cos(t):.01,side*(flight?.54+.16*Math.cos(t):.035));
  shell(f,[side*.059,-.026,-.236],[[-.028,.105,.273],[0,.126,.294],[.036,.091,.269],[.062,.033,.219]],shellTone,8);
  for(let j=0;j<3;j++){
   const x=side*(j*.034+.026),a=[side*.030,.052,-.023],b=[x,.071-.007*j,-.26],end=[side*.050,.025,-.492+j*.025];
   line(f,a,b,.006,.005,amber,4);line(f,b,end,.005,.002,chitin,4);
  }
  if(flight){
   const reach=.52+.17*Math.sin(t),high=.21+.20*Math.cos(t);
   const root=[side*.09,low+.13,.10],spine=[side*(reach*.76),low+high,-.09],tip=[side*reach,low+high*.63,-.39],end=[side*.29,low+.04,-.39];
   quad(m,root,spine,tip,end,wing);line(m,root,spine,.012,.007,amber,5);
   for(let j=0;j<3;j++)line(m,root,[tip[0]*(.72+.08*j),tip[1]+(.06-j*.015),-.14-.079*j],.005,.002,dark,3);
  }
  for(let k=0;k<3;k++){
   const phase=t+(k%2?Math.PI:0)+(side>0?0:Math.PI),z=.165-.139*k;
   const hip=[side*.105,low+.008,z],elbow=[side*(.216+.029*k),low+.027+Math.max(0,Math.sin(phase))*.042,z+.078-.052*k];
   const foot=[side*(flight?.255:.333+.032*k),flight?low-.06:.012+.056*Math.max(0,Math.sin(phase)),z+.101-.104*k+.078*Math.cos(phase)];
   line(m,hip,elbow,.032,.019,joint,5);line(m,elbow,foot,.022,.010,chitin,5);
   line(m,foot,offset(foot,side*.045,-.004,-.037-.010*k),.009,.003,black,4);
   for(let j=0;j<2;j++){const a=elbow.map((v,n)=>v+(foot[n]-v)*(.38+j*.32));line(m,a,offset(a,side*.023,.012,-.023),.005,.001,amber,3);}
  }
  const a=offset(head,side*.067,.035,.054),b=offset(a,side*.101,.07+.035*Math.cos(t+side),.13),c=offset(b,side*(.065+.053*Math.sin(t+side)),.018,.209);
  line(m,a,b,.013,.008,chitin,5);line(m,b,c,.008,.004,amber,4);line(m,c,offset(c,side*.063,-.058,.137+.054*Math.cos(t)),.004,.0015,joint,3);
 }
 haunch(m,head,[[-.099,.108,.072],[-.022,.118,.083],[.079,.084,.063],[.13,.039,.035]],black,8);
 shell(m,[0,low+.044,.16],[[-.035,.164,.115],[.019,.179,.149],[.073,.127,.108],[.102,.073,.071]],amber,9);
 shell(m,[0,low+.104,.143],[[-.003,.145,.101],[.026,.098,.085],[.041,.048,.058]],shellTone,8);
 for(const side of [-1,1])shell(m,[side*.081,low+.065,.341],[[-.016,.033,.028],[.011,.033,.026],[.022,.016,.013]],black,7);
}
