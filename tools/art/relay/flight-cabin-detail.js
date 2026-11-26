// The flight card, steel recorder and quilted roof are close enough to inspect from the seat.
import {tint,TAU} from './extension-art-kit.js';

const steel=[.432,.447,.397],dark=[.126,.143,.125],olive=[.317,.342,.257],web=[.48,.434,.301];
const edgeTone=[.54,.57,.50];
const paper=[.67,.648,.488],amber=[.878,.495,.176];
export function flightCabinDetail(f){
 f.box(-.59,1.71,-.47,.23,.075,.139,dark,5);f.box(-.595,1.67,-.472,.162,.014,.090,[.89,.115,.034],12);
 for(const x of [-1.16,.95]){f.box(x,1.736,.67,.27,.06,.18,dark,5);f.box(x,1.694,.67,.177,.023,.112,[.90,.116,.05],12);}
 const wall=f.child(-1.338,0,-.35,Math.PI/2);
 wall.box(0,.98,0,1.08,.91,.059,olive,8);
 for(const x of [-.42,-.17,.08,.33])for(const y of [.76,1.0,1.24]){
  const tile=[[x,y-.116,.033],[x+.117,y,.033],[x,y+.116,.033],[x-.117,y,.033]],center=[x,y,.057];
  for(let i=0;i<4;i++)wall.poly([tile[i],tile[(i+1)%4],center],tint(olive,.91+i*.043),8);
 }
 const radio=wall.child(-.04,.895,.072);
 radio.box(0,0,0,.441,.313,.082,dark,5);radio.box(0,-.018,.049,.416,.218,.034,steel,5);
 radio.panel(-.036,.012,.068,.225,.109,[.157,.181,.156],6);
 for(const x of [-.10,.029]){
  radio.beam([x,.012,.068],[x,.012,.082],.031,.031,paper,5,10);
  radio.beam([x,.012,.081],[x,.012,.085],.014,.014,dark,5,8);
 }
 for(let i=0;i<5;i++)radio.box(-.14+i*.067,-.098,.073,.050,.021,.036,i===4?amber:dark,5);
 radio.box(.146,.034,.07,.020,.023,.009,amber,12);radio.beam([.17,-.03,.057],[.17,-.03,.083],.027,.026,dark,5,10);
 for(const [i,col] of [[0,[.20,.54,.32]],[1,[.75,.22,.054]],[2,[.27,.41,.28]]])radio.box(-.153+i*.043,.108,.063,.022,.014,.008,col,12);
 let last=[.20,-.14,.022];
 for(let j=1;j<=18;j++){const t=j/18,P=[.26+.020*Math.sin(t*TAU*3),-.14-.34*t,.016+.016*Math.cos(t*TAU*3)];radio.beam(last,P,.008,.008,dark,5,4);last=P;}
 const chart=wall.child(.31,1.24,.075,-.02);
 chart.box(0,0,0,.31,.207,.021,paper,8);
 chart.panel(-.013,.068,.013,.25,.016,[.274,.315,.256]);
 for(const [x,y,xx,yy] of [[-.11,-.087,-.02,.024],[-.02,.024,.096,.04],[-.036,-.006,.046,-.072]]){
  chart.beam([x,y,.015],[xx,yy,.015],.004,.0035,[.278,.331,.319],8,4);
 }
 for(const y of [-.07,.07])chart.panel(-.13,y,.015,.017,.032,web);
 // A carbon-copy duty roster under the cabin light; the torn top sheet folds
 // above the older pages. Censor bars are ink against each sheet's surface.
 const clip=wall.child(-.36,1.285,.093);
 for(let i=0;i<4;i++)clip.box(i*.002,-i*.002,i*.002,.255,.249,.002,i===3?paper:tint(web,1.05+i*.055),8);
 for(let i=0;i<10;i++){
  const y=.066-i*.017,col=i===0?steel:dark;
  clip.panel(-.018,y,.009,.065+.056*(i%3!==0),i%4===1?.011:.0042,col);
  if(i>0)clip.panel(.081,y,.009,.032,i%3===0?.010:.004,col);
 }
 clip.poly([[.067,-.123,.009],[.127,-.123,.010],[.127,-.077,.009],[.084,-.099,.019]],tint(paper,.81),8);
 clip.box(0,.108,.016,.110,.036,.028,steel,5);
 for(const x of [-.042,.042])clip.beam([x,.110,.015],[x,.151,.020],.005,.005,edgeTone,5,8);
 clip.beam([-.042,.151,.020],[.042,.151,.020],.005,.005,edgeTone,5,8);
 // Quilted liner only covers the crown. Keep the sliding tracks and windows exposed.
 for(let i=0;i<7;i++)for(let j=0;j<3;j++){
  const x=-1.08+i*.40,z=-.69+j*.57,c=[x,1.727,z];
  const points=[[x-.18,1.785,z-.25],[x+.18,1.785,z-.25],[x+.18,1.785,z+.25],[x-.18,1.785,z+.25]];
  for(let k=0;k<4;k++)f.poly([points[k],points[(k+1)%4],c],tint(olive,.8+.045*k),8);
 }
 for(const z of [-.77,.79])for(let i=0;i<9;i++){
  const x=-1.12+i*.314;f.beam([x,1.70,z],[x+.011,1.70,z+.012],.012,.010,steel,5,5);
 }
}
