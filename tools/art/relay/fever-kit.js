// County-issue field kit. The finish changes with use: machined collars, matte rubber and worn high spots.
import {box,quad,paint} from './armory-shapes.js';

function turnedPart(m, point, sections, facets) {
  for(let row=1;row<sections.length;row++) {
    const [za,ra,ca]=sections[row-1], [zb,rb]=sections[row];
    for(let i=0;i<facets;i++) {
      const a=2*Math.PI*i/facets,b=2*Math.PI*(i+1)/facets;
      quad(m,point(a,za,ra),point(b,za,ra),point(b,zb,rb),point(a,zb,rb),ca,5);
    }
  }
}
function knurl(m,point,z0,length,radius,rows,around) {
  for(let j=0;j<rows;j++)for(let i=0;i<around;i++){
    const a=2*Math.PI*(i+.5*(j%2))/around,z=z0+length*(j+.5)/rows;
    const da=.86*Math.PI/around,dz=.48*length/rows;
    const ring=[point(a-da,z,radius),point(a,z+dz,radius),point(a+da,z,radius),point(a,z-dz,radius)];
    const peak=point(a,z,radius+.00105);
    for(let f=0;f<4;f++)m.tri(ring[f],ring[(f+1)%4],peak,f===0?paint.slide:paint.blued,5);
  }
}
export function fieldRecorder(m,id) {
  if(id!=='carbine'&&id!=='pistol')return;
  const long=id==='carbine',x=long?-.072:0,y=long?.046:-.014,z=long?-.30:-.163;
  const unit=long?1:.63,facets=m.lowDetail?10:long?48:32;
  const point=(a,along,r)=>[x+Math.cos(a)*r*unit,y+Math.sin(a)*r*unit,z+along*unit];
  const p=paint;
  box(m,x+(long?.018:0),y+(long?0:.016),z,.048*unit,.035*unit,.096*unit,p.oxide,5);
  const rings=[[-.119,.014,p.glass],[-.116,.021,p.steelEdge],[-.114,.024,p.blued],[-.109,.0255,p.slide],[-.105,.0255,p.blued],[-.103,.024,p.dark],[-.096,.024,p.blued],[-.092,.022,p.slide],[-.080,.019,p.blued],[-.074,.019,p.slide],[-.07,.020,p.blued],[.02,.020,p.blued],[.024,.018,p.seal],[.031,.019,p.slide],[.039,.018,p.blued],[.042,.014,p.rubber],[.04,.001,p.rubber]];
  turnedPart(m,point,m.lowDetail?rings.filter((_,i)=>[0,2,6,10,12,15,16].includes(i)):rings,facets);
  const face=point(0,-.120,0);
  for(let i=0;i<facets;i++)m.tri(face,point(i*2*Math.PI/facets,-.119,.014),point((i+1)*2*Math.PI/facets,-.119,.014),p.glass,6);
  if(m.lowDetail)return;
  knurl(m,point,-.068,.085,.020,long?15:8,long?48:30);
  for(const a of [-.100,-.076,.026]){
    turnedPart(m,point,[[a,.0195,p.dark],[a+.0008,.021,p.slide],[a+.0026,.021,p.blued],[a+.0035,.0195,p.dark]],facets);
  }
}
export function chestRecorder(m,at,medic,detail){
  const [x,y,z]=at,p=paint;
  box(m,x-.075,y+.070,z+.156,.071,.093,.025,p.rubber,7);
  box(m,x-.075,y+.073,z+.172,.057,.075,.012,p.dark,7);
  const point=(a,l,r)=>[x-.075+Math.cos(a)*r,y+.083+Math.sin(a)*r,z+.181+l];
  turnedPart(m,point,[[0,.019,p.blued],[.003,.021,p.steel],[.008,.017,p.blued],[.009,.012,p.glass],[.005,.001,p.glass]],detail?20:8);
  box(m,x-.054,y+.096,z+.181,.004,.004,.002,[.62,.11,.07],13);
  if(detail){
    for(let j=0;j<2;j++)for(let i=0;i<5;i++)box(m,x-.093+i*.008,y+.054+j*.006,z+.18,.004,.0016,.001,p.oxide,5);
    for(let j=0;j<2;j++)box(m,x+.086,y+.059+j*.010,z+.144,.072,.005,.007,medic?p.ivory:p.web,8);
  }
}
