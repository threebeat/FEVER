import {paint,quad,limb,linked,screw} from './armory-shapes.js';

// A forward-weighted brush blade with a convex cutting edge and a full-width tang.
export function brushBlade(mesh){
 const wood=[.34,.19,.105],grain=[.23,.135,.082],edge=[.65,.66,.60];
 const stem=y=>[0,y,.059-.16*y];
 limb(mesh,[[-.156,.024,.022],[-.146,.032,.025],[-.120,.027,.024],[-.053,.025,.025],[-.016,.030,.023],[.006,.028,.022]].map(([y,w,d])=>[stem(y),w,d,wood]),10,9,true);
 for(const side of [-1,1])for(const y of [-.119,-.045])screw(mesh,side,.026,y,.059-.16*y,.005);
 for(let i=0;i<4;i++){
  const y=-.12+i*.019;
  linked(mesh,[[-.018,y,.083-.16*y],[-.002,y+.003,.085-.16*y],[.018,y+.007,.080-.16*y]],.0014,grain,6,4);
 }
 linked(mesh,[[-.018,-.137,.086],[-.032,-.18,.106],[-.023,-.208,.102],[.003,-.197,.088],[.014,-.148,.082]],.0032,paint.webDark,7,5);
 const rows=[[.002,-.021,.019,.005],[.041,-.025,.030,.005],[.14,-.032,.043,.0048],[.257,-.040,.061,.0043],[.342,-.044,.062,.0038],[.385,-.045,.043,.0032],[.420,-.039,.014,.0025],[.442,-.027,-.024,.0009]];
 for(const side of [-1,1]){
  let prev;
  for(const [y,back,front,t] of rows){
   const z=.059-.16*y;
   const row=[[back,y,z+side*t*.64],[back+.006,y,z+side*t],[front-.013,y,z+side*t],[front,y,z]];
   if(prev)for(let a=0;a<3;a++)quad(mesh,prev[a],prev[a+1],row[a+1],row[a],a===0?paint.steelEdge:a===1?paint.blued:edge,5);
   prev=row;
  }
 }
}
