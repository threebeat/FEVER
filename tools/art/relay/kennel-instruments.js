import {TAU,tint,vessel} from './extension-art-kit.js';
import {bolt,casework,hose,steel,iron,edge,cream,rubber,pale} from './relay-photo-kit.js';

const enamel=[.61,.64,.56],glass=[.34,.40,.34],blood=[.29,.063,.059],tag=[.71,.63,.41];
function links(f,path){
 for(const [j,[x,y,z]] of path.entries()){
  const loop=[];
  for(let i=0;i<=16;i++){
   const a=TAU*i/16,depth=j%2?.68:.14;
   loop.push([x+Math.cos(a)*.028*(1-depth),y+.047*Math.sin(a),z+.032*Math.cos(a)*depth]);
  }
  hose(f,loop,.0063,edge,6);
 }
}
function dish(pen,x,z){
 const bowl=pen.child(x,.227,z);
 vessel(bowl,0,0,0,[[0,.186],[.012,.210],[.030,.215],[.095,.160],[.12,.162],[.131,.157],[.136,.146],[.12,.14],[.054,.113],[.029,.095],[.029,0]],
  [iron,edge,steel,steel,edge,pale,edge,steel,steel,iron],26,5,.91);
 const rings=[];
 for(let i=0;i<=40;i++){const a=i*TAU/40;rings.push([.157*Math.cos(a),.130,.142*Math.sin(a)]);}
 hose(bowl,rings,.0049,pale,6,5);
 bowl.flat(0,.033,0,.114,.081,[.22,.258,.23],5);
}
function penHardware(pen,x){
 const gate=pen.child(0,0,1.04,x<0?.13:0);
 for(const y of [.33,1.37]){
  const pivot=gate.child(-1.144,y,.067);
  for(const h of [-.055,.056])pivot.beam([0,h-.039,0],[0,h+.043,0],.021,.021,steel,5,13);
  pivot.beam([0,-.113,0],[0,.13,0],.012,.010,iron,5,10);
  for(const side of [-1,1]){pivot.box(side*.057,.013,-.012,.076,.082,.016,edge,5);bolt(pivot,side*.069,.010,0,.011);}
 }
 const latch=gate.child(.91,1.13,.101);
 latch.beam([-.21,.015,.014],[.20,.014,.014],.021,.019,edge,5,14);
 for(const u of [-.136,.093])casework(latch,u,0,.014,.039,.077,.058,.007,steel);
 hose(latch,[[.05,.016,.018],[.05,-.021,.076],[.05,-.097,.083]],.013,iron,9);
 const keeper=gate.child(.76,1.07,.098);
 links(keeper,[[0,0,0],[.007,-.061,.008],[.017,-.123,.014],[.026,-.186,.021]]);
 const evidence=gate.child(-.59,1.43,.038);
 for(const side of [-1,1])bolt(evidence,side*.15,.07,.011,.008);
 dish(pen,x>0?.49:-.62,.30);
}
function wrapping(f,x,z){
 const box=f.child(x,1.044,z,.18);
 const side=[[-.159,.006,-.073],[.133,.003,-.08],[.162,.008,-.044],[.145,.018,.084],[-.142,.004,.077]];
 box.poly(side,tint(cream,.94),8);
 box.flat(-.068,.017,.001,.031,.121,tint(steel,.85));
 const strips=[[-.127,.013,.066],[-.054,.047,.09],[.024,.034,.078],[.101,.046,.093],[.157,.012,.084]];
 for(let j=1;j<strips.length;j++){
  const a=strips[j-1],b=strips[j];
  box.poly([a,b,[b[0],b[1]+.012,b[2]+.041],[a[0],a[1]+.016,a[2]+.037]],tint(enamel,.94+.018*j));
 }
}
function clamp(f,x,z,ang){
 const p=f.child(x,1.055,z,ang),silver=tint(edge,1.08);
 for(const side of [-1,1]){
  const arc=[];
  for(let i=0;i<=15;i++){const a=TAU*i/15;arc.push([-.089+.032*Math.cos(a),.004,.023*side+.019*Math.sin(a)]);}
  hose(p,arc,.0042,silver,5);
  hose(p,[[-.063,.005,side*.023],[-.015,.006,side*.010],[.019,.007,-side*.012],[.067,.008,-side*.004],[.096,.006,0]],.0046,silver,6);
 }
}
function samples(sink){
 const tray=sink.child(-.17,1.041,-.049);
 casework(tray,0,.006,0,.61,.013,.24,.004,iron);
 const lip=[[-.284,.012,-.111],[.282,.012,-.111],[.295,.012,-.096],[.295,.012,.09],[.28,.012,.11],[-.283,.012,.11],[-.297,.012,.092],[-.297,.012,-.093],[-.284,.012,-.111]];
 hose(tray,lip,.0081,edge,7);
 for(let j=0;j<6;j++){
  const x=-.219+j*.087,z=.023*(j%2?1:-1),h=.127+.011*(j%3);
  vessel(tray,x,.014,z,[[0,.008],[.008,.023],[.024,.028],[h-.014,.028],[h,.021],[h+.01,.021]],j===1||j===5?[glass,blood,blood,glass,edge]:[iron,glass,glass,glass,edge],14,5);
  vessel(tray,x,h+.025,z,[[0,.027],[.004,.032],[.031,.032],[.035,.025]],j<4?[.43,.19,.151]:rubber,16,8);
  vessel(tray,x,.080,z,[[0,.0283],[.050,.0283]],j===1?tag:enamel,14,8);
  for(let i=0;i<7;i++){const a=i*TAU/7;tray.beam([x+.032*Math.sin(a),h+.032,z+.032*Math.cos(a)],[x+.032*Math.sin(a),h+.053,z+.032*Math.cos(a)],.0019,.0019,edge,8,3);}
 }
 wrapping(sink,.44,.10);clamp(sink,.33,-.015,.43);clamp(sink,-.61,.142,-.26);
}
// Built lazily with the room's high-detail geometry. The old cages and sink are
// the collision surfaces. These details fit entirely inside those footprints.
export function dressKennelInstruments(f,width,depth){
 for(const x of [-width/2+1.70,width/2-1.69])penHardware(f.child(x,0,-depth/2+1.69),x);
 samples(f.child(width/2-1.23,0,depth/2-1.48,-Math.PI/2));
}
