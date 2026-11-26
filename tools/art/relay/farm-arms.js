import {box,paint as p,screw,boreFace} from './armory-shapes.js';
import {line,shell,guard} from './actor-geometry.js';

const green=[.214,.246,.178],seam=[.327,.351,.253],burnt=[.293,.195,.123],red=[.384,.149,.09];
function bar(m,a,b,r,c,n=8){line(m,a,b,r,r,c,n,5);}
function receiver(m,z,length,width,height,color){
 // Narrow shoulders on the receiver catch a separate highlight when it rolls.
 box(m,0,.032,z,width,height,length,color);box(m,0,.032+height*.5,z,width*.83,.010,length-.012,p.steel);
}
function stock(m){
 for(const side of [-1,1]){
  bar(m,[side*.025,.04,.045],[side*.031,.033,.274],.013,p.blued);
  bar(m,[side*.019,-.013,.046],[side*.033,-.066,.267],.011,p.blued);
 }
 box(m,0,-.010,.277,.084,.155,.047,p.rubber,7);
 for(let i=0;i<8;i++)box(m,0,-.068+i*.016,.304,.075,.004,.006,p.gloveFold,7);
}
function eyes(m,front){
 for(const z of [.061,front]){
  box(m,0,.094,z,.021,.075,.021,p.blued);
  if(z>0)guard(m,[0,.138,z],.027,.025,.006,.009,p.steel,12,5);
  else{for(const side of [-1,1])bar(m,[side*.027,.101,z],[side*.020,.150,z],.005,p.steel);}
 }
}
export function buildFarmArm(m,id,pose){
 const shift=[-.015*pose.search,-.34*pose.search,.11*pose.search],y=shift[1],z=shift[2];
 if(id==='machinegun'){
  stock(m);receiver(m,-.101,.357,.106,.112,p.blued);
  box(m,0,.099,-.105,.102,.023,.251,green,7);box(m,.059,.045,-.065,.011,.044,.081,p.oxide);
  for(const x of [-.046,.046])for(let i=0;i<6;i++)box(m,x,.081,-.229+i*.042,.010,.014,.019,p.steel);
  bar(m,[0,.053,-.275],[0,.053,-.706],.027,p.blued,12);
  for(const x of [-.033,.033]){
   box(m,x,.020,-.341,.018,.076,.244,green,7);
   for(let i=0;i<5;i++)box(m,x*1.27,.023,-.430+i*.036,.005,.028,.021,p.dark);
   bar(m,[x,.014,-.475],[x*1.29,-.012,-.310],.008,p.steel);
  }
  for(let i=0;i<11;i++)bar(m,[0,.053,-.486-i*.012],[0,.053,-.490-i*.012],.034,p.steel);
  bar(m,[0,.053,-.682],[0,.053,-.729],.036,p.steel);eyes(m,-.553);
  box(m,shift[0],-.103+y,-.130+z,.135,.144,.178,green,7);
  for(const x of [-.069,.069])for(let i=0;i<5;i++)box(m,x+shift[0],-.10+y,-.192+z+i*.03,.007,.127,.009,seam,7);
  for(let i=0;i<7;i++){
   const a=i*.235,x=-.056-.050*Math.sin(a),y=.066-.049*(1-Math.cos(a));
   bar(m,[x,y,-.073],[x,y,-.112],.006,p.brass,8);
   bar(m,[x,y,-.082],[x,y,-.091],.0073,p.blued,7);
   line(m,[x,y,-.110],[x,y,-.125],.0056,.001,burnt,7);
  }
  for(const side of [-1,1]){
   for(const pos of [[.027,-.20],[.043,.022],[-.009,-.14]])screw(m,side,.054,...pos,.0068);
   box(m,side*.057,.041,-.213,.004,.028,.054,p.pack,5);
   for(let i=0;i<3;i++)box(m,side*.060,.036+i*.005,-.214,.002,.0018,.039-i*.006,p.steel,5);
  }
  const handle=[[-.044,.101,-.19],[-.064,.138,-.19],[-.064,.138,-.045],[-.042,.098,-.045]];
  for(let i=1;i<handle.length;i++)bar(m,handle[i-1],handle[i],i===2?.012:.007,i===2?p.rubber:p.blued);
  boreFace(m,0,.053,-.7295,.036,.63,10);
 }else{
  receiver(m,-.090,.264,.085,.09,p.oxide);box(m,0,-.003,.061,.074,.083,.091,green,7);
  bar(m,[0,.049,-.19],[0,.049,-.577],.021,p.steel,12);
  for(const side of [-1,1])bar(m,[side*.037,.047,-.207],[side*.047,.061,-.544],.007,burnt);
  for(let i=0;i<3;i++)bar(m,[0,.049,-.36-i*.08],[0,.049,-.374-i*.08],.036,p.blued);
  line(m,[0,.049,-.56],[0,.049,-.655],.044,.063,burnt,12,5);
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7;bar(m,[.054*Math.cos(a),.049+.054*Math.sin(a),-.649],[.060*Math.cos(a),.049+.060*Math.sin(a),-.678],.005,p.oxide);
  }
  shell(m,[shift[0],y,-.147+z],[[-.267,.041,.043],[-.253,.073,.075],[-.22,.083,.084],[-.066,.083,.084],[-.040,.062,.061],[-.03,.027,.027]],red,14,10);
  for(const h of [-.103,-.206])shell(m,[shift[0],h+y,-.147+z],[[0,.086,.087],[.014,.086,.087]],p.steel,14,5);
  bar(m,[.024,.063,-.03],[.081,.148,-.035],.013,burnt);
  const dial=[.080,.147,-.023];guard(m,dial,.029,.029,.0045,.012,p.steel,18,5);
  for(let i=0;i<18;i++){
   const a=i*Math.PI/9,b=(i+1)*Math.PI/9,at=t=>[dial[0]+.0248*Math.cos(t),dial[1]+.0248*Math.sin(t),-.0158];
   m.tri([dial[0],dial[1],-.0158],at(a),at(b),p.paper,10);
   if(i%2===0)bar(m,at(a),[dial[0]+.018*Math.cos(a),dial[1]+.018*Math.sin(a),-.0155],.0012,i<4?red:p.blued,4);
  }
  bar(m,[.080,.148,-.014],[.091,.162,-.014],.0018,red);
  for(const side of [-1,1]){
   screw(m,side,.043,.043,-.079,.005);screw(m,side,.043,.047,-.176,.005);
   const at=[side*.045,-.112+y,z-.082];
   box(m,at[0],at[1],at[2],.004,.047,.060,p.paper,10);
   for(let i=0;i<4;i++)box(m,at[0]+side*.003,at[1]+.013-i*.007,at[2]+.002,.002,.002,.042-i*.006,p.oxide);
  }
  bar(m,[-.036,.024,-.231],[-.051,.012,-.594],.0058,burnt,8);
  bar(m,[-.051,.012,-.594],[-.047,-.005,-.638],.007,p.brass,8);
  boreFace(m,0,.049,-.658,.051,.64,12);
  const hose=[[.04,-.025,-.024],[.079,-.138,.012],[.078,-.231,.058],[.041,-.248,.127],[.015,-.158,.18]];
  for(let i=1;i<hose.length;i++)bar(m,hose[i-1],hose[i],.017,p.rubber,10);
 }
 return shift;
}
