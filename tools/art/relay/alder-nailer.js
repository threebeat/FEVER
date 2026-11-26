import {box,paint,linked,dieStamp} from './armory-shapes.js';
import {line} from './actor-geometry.js';

const yellow=[.646,.421,.094],ochre=[.40,.269,.097],rubber=paint.rubber,metal=paint.steel;
export function buildNailer(m,pose){
 const bar=(a,b,r,c)=>line(m,a,b,r,r,c,8,5);
 // An old cordless finish nailer. The nose, magazine and removable battery each have a distinct silhouette.
 bar([0,.071,-.135],[0,.071,.066],.068,yellow);
 box(m,0,.060,-.102,.122,.111,.205,yellow,7);
 box(m,0,.072,.071,.120,.116,.046,rubber,7);
 for(let j=0;j<4;j++)for(const s of [-1,1])
  box(m,s*.062,.061+j*.011,.034-j*.002,.004,.004,.035,rubber);
 bar([0,.054,-.17],[0,.054,-.248],.030,metal);
 box(m,0,.052,-.267+.014*pose.bolt,.033,.039,.067,paint.dark);
 box(m,0,.033,-.27+.014*pose.bolt,.017,.037,.055,metal);
 const y=-.050*pose.search,z=.042*pose.search;
 bar([0,-.11+y,.05+z],[0,-.019+y,-.197+z],.023,paint.dark);
 bar([0,-.13+y,.049+z],[0,-.045+y,-.197+z],.020,metal);
 for(let j=0;j<10;j++){
  const t=j/11;bar([-.020,-.113+y+t*.083,.027+z-.205*t],[-.02,-.130+y+t*.084,.023+z-.205*t],.002,metal);
 }
 box(m,0,-.155,.077,.08,.035,.108,rubber,7);
 box(m,0,-.174,.075,.082,.018,.113,ochre,7);
 linked(m,[[.061,.024,.028],[.072,.015,.037],[.075,-.049,.045],[.069,-.052,.050]],.005,metal,7,5);
 dieStamp(m,[-.062,.079,-.123],[0,0,1],[0,1,0],.008,'18',paint.paper);
 return [0,y,z];
}
