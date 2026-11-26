#include "geometry.hpp"
#include "night.hpp"
#include <cstring>
namespace fever {
namespace {
const V rock{.47f,.48f,.45f},trim{.67f,.70f,.64f},timber{.38f,.245f,.155f},iron{.18f,.205f,.205f},dark{.069f,.080f,.08f},pine{.105f,.17f,.135f},snow{.81f,.85f,.87f},brass{.62f,.47f,.24f},amber{.98f,.64f,.29f},light{.65f,.87f,.77f},brick{.48f,.295f,.234f};
Pose at(V p,float a=0){Pose o;o.p=p;o.x=right(a);o.z=forward(a);return o;}
void hoop(Builder& b,V c,V x,V y,float r,float width,V col,int mat,int n=24){
    V prev=c+x*r;for(int i=1;i<=n;i++){float a=i*2*pi/n;V p=c+(x*std::cos(a)+y*std::sin(a))*r;b.pipe(prev,p,width,width,col,mat,6);prev=p;}}
void panel(Builder& b,float x,float y,float z,float w,float h,V c,int mat){b.box({x,y,z},{w,h,.032f},c,mat);}
void car(Builder& b){
    b.box({0,.38f,0},{1.85f,.40f,4.34f},dark,Polymer);
    for(float z:{-1.57f,1.62f})b.box({0,.69f,z},{1.82f,.34f,1.2f},rock,Enamel);
    b.box({0,1.69f,-.16f},{1.63f,.075f,1.84f},iron,Enamel);
    for(int s:{-1,1}){
        float x=s*.87f;b.pipe({x,.85f,1.03f},{s*.77f,1.67f,.65f},.045f,.039f,rock,Polymer);b.pipe({x,.82f,-1.32f},{s*.77f,1.67f,-.99f},.060f,.048f,rock);
        b.box({x,.66f,-.16f},{.11f,.43f,2.06f},iron,Polymer);b.box({x,.90f,-.19f},{.097f,.059f,1.93f},dark,Polymer);
        b.box({s*.92f,.99f,.55f},{.26f,.13f,.19f},dark,Polymer);panel(b,s*.925f,.99f,.445f,.20f,.087f,rock,DarkGlass);
        for(float z:{-1.35f,1.36f}){b.pipe({x-.10f,.35f,z},{x+.1f,.35f,z},.32f,.32f,dark,Polymer,16);b.pipe({s*.96f,.35f,z},{s*.98f,.35f,z},.18f,.17f,rock,Metal,12);}
        panel(b,s*.62f,.73f,2.236f,.44f,.135f,light,Cold);panel(b,s*.61f,.71f,-2.23f,.44f,.125f,{.76f,.08f,.04f},Red);}
    b.box({0,.80f,.71f},{1.69f,.38f,.62f},dark,Polymer);b.box({0,.87f,.405f},{1.62f,.15f,.07f},iron,Polymer);
    for(float x:{-.6f,-.40f,-.2f}){hoop(b,{x,.913f,.372f},{1,0,0},{0,1,0},.059f,.0032f,trim,Cold);
        for(int i=0;i<11;i++){V d={std::cos(i*.46f-.78f),std::sin(i*.46f-.78f),0};b.pipe(V{x,.913f,.368f}+d*.047f,V{x,.913f,.368f}+d*.055f,.002f,.002f,light,Cold,4);}
        b.pipe({x,.913f,.365f},{x+.032f,.944f,.365f},.003f,.003f,amber,Warm,5);}
    for(float x:{-.68f,-.04f,.58f}){b.box({x,.91f,.393f},{.13f,.095f,.029f},dark,Polymer);
        for(int j=0;j<5;j++)b.box({x,.876f+j*.014f,.368f},{.122f,.004f,.033f},rock,Polymer);}
    for(int j=0;j<3;j++)b.pipe({.055f+.077f*j,.754f,.357f},{.055f+.077f*j,.754f,.333f},.024f,.024f,iron,Polymer,10);
    V cable={-.07f,.817f,.395f};
    for(int j=1;j<=31;j++){float t=j/31.f;V v={-.07f+.12f*t+.013f*std::sin(t*79),.817f-.33f*std::sin(t*pi),.395f-.19f*t+.012f*std::cos(t*79)};b.pipe(cable,v,.005f,.005f,dark,Polymer,4);cable=v;}
    b.box({-.085f,.823f,.365f},{.072f,.102f,.033f},dark,Polymer);
    for(int j=0;j<4;j++)panel(b,-.085f,.810f+j*.011f,.344f,.044f,.0028f,rock,Metal);
    for(float x:{-.43f,.43f}){b.box({x,.51f,-.36f},{.49f,.15f,.60f},iron,Fabric);b.box({x,.79f,-.69f},{.51f,.48f,.13f},dark,Fabric);b.box({x,1.12f,-.69f},{.30f,.22f,.12f},iron,Fabric);}
    b.box({.27f,.96f,.337f},{.43f,.30f,.055f},dark,Polymer);panel(b,.27f,.96f,.302f,.38f,.245f,{.12f,.23f,.18f},DarkGlass);
    for(int j=0;j<6;j++)panel(b,.195f+(j%3)*.013f,1.04f-j*.023f,.279f,.17f+(j%3)*.027f,.003f,light,Cold);
    for(int j=0;j<8;j++)panel(b,.095f+j*.047f,.837f,.279f,.027f,.011f,j%3?light:amber,j%3?Cold:Warm);
    b.box({.02f,1.48f,.6f},{.25f,.075f,.08f},dark);panel(b,.02f,1.48f,.552f,.23f,.06f,rock,DarkGlass);
}
V onWheel(float a){return {-.36f+std::cos(a)*.185f,.85f+std::sin(a)*.16f,.24f+std::sin(a)*.065f};}
void hands(Builder& b){
    for(int i=0;i<32;i++)b.pipe(onWheel(i*2*pi/32),onWheel((i+1)*2*pi/32),.016f,.016f,dark,Hide,8);
    for(float a:{-.49f,3.62f,4.72f})b.pipe({-.36f,.85f,.24f},onWheel(a),.028f,.015f,iron,Polymer);
    b.box({-.36f,.85f,.228f},{.14f,.087f,.045f},dark,Polymer);
    for(int j=0;j<2;j++){int s=j?1:-1;V hand=onWheel(j?.66f:2.65f),wrist=hand+V{s*.032f,-.045f,-.056f},elbow={-.35f+s*.29f,.64f,-.28f};
        b.pipe(elbow,lerp(elbow,wrist,.65f),.071f,.064f,{.135f,.156f,.175f},Fabric,10);b.pipe(lerp(elbow,wrist,.65f),wrist,.064f,.045f,{.18f,.20f,.22f},Fabric,10);
        b.pipe(wrist,hand,.036f,.043f,{.53f,.37f,.27f},Skin,9);for(int k=0;k<4;k++){V p=hand+V{s*(k*.013f-.028f),.022f,.008f};b.pipe(p,p+V{s*.012f,-.032f,.02f},.009f,.007f,{.55f,.395f,.28f},Skin,6);}}
}
void parkedCar(Builder& b){
    b.box({0,.40f,0},{1.75f,.39f,4.01f},rock,Enamel);
    b.box({0,.63f,0},{1.77f,.24f,3.96f},iron,Enamel);
    for(float s:{-1.f,1.f}){b.box({s*.79f,.87f,-.20f},{.08f,.29f,1.96f},rock,Enamel);
        for(float z:{-1.25f,1.26f}){b.pipe({s*.77f,.34f,z},{s*.93f,.34f,z},.30f,.30f,dark,Polymer,12);b.pipe({s*.923f,.34f,z},{s*.94f,.34f,z},.16f,.15f,iron,Metal,10);}
        for(float z:{-.65f,.26f})b.box({s*.745f,1.11f,z},{.029f,.38f,.76f},iron,DarkGlass);
        b.pipe({s*.77f,.83f,.88f},{s*.64f,1.33f,.41f},.038f,.032f,rock,Metal);panel(b,s*.55f,.62f,-2.006f,.35f,.117f,brick,Red);}
    b.box({0,1.36f,-.20f},{1.44f,.083f,1.44f},rock,Enamel);
    b.face({-.73f,.83f,.91f},{.73f,.83f,.91f},{.64f,1.32f,.44f},{-.64f,1.32f,.44f},iron,DarkGlass);
    b.face({.74f,.83f,-1.25f},{-.74f,.83f,-1.25f},{-.64f,1.32f,-.88f},{.64f,1.32f,-.88f},iron,DarkGlass);
    panel(b,0,.54f,-2.009f,.35f,.14f,trim,Enamel);
}
void overheadLine(Builder& b,float x,float first,int spans){
    const float spacing=12.5f;for(int i=0;i<=spans;i++){
        float z=first+spacing*i;b.pipe({x,0,z},{x+.04f,6.35f,z},.115f,.067f,timber,Wood,7);
        b.box({x,5.78f,z},{1.62f,.12f,.15f},timber,Wood);
        for(float off:{-.64f,.50f}){b.pipe({x+off,5.81f,z},{x+off,6.06f,z},.052f,.032f,trim,Enamel,6);
            if(i==spans)continue;V prev={x+off,6.03f,z};
            for(int k=1;k<=5;k++){float t=k/5.f;V q={x+off,6.03f-.37f*std::sin(t*pi),z+spacing*t};b.pipe(prev,q,.018f,.018f,dark,Polymer,4);prev=q;}}}}
void lampPost(Builder& b,float x,float z){float s=x>0?-1:1;b.pipe({x,0,z},{x,4.90f,z},.10f,.045f,iron);b.pipe({x,4.88f,z},{x+s*1.19f,5.13f,z},.055f,.029f,iron);
    b.box({x+s*1.28f,5.15f,z},{.65f,.16f,.31f},iron);b.box({x+s*1.28f,5.05f,z},{.49f,.032f,.26f},amber,Warm);}
void shop(Builder& b,int s,float z,int k){
    float x=s*13.15f,w=7.66f,h=4.4f+1.14f*(k%4);V col=k%3==0?brick:k%3==1?rock:pine;
    b.box({x+s*2.2f,h*.5f,z},{4.5f,h,w},col,Plaster);b.box({x+s*2.2f,h+.10f,z},{4.74f,.20f,w+.22f},trim,Stone);
    for(int n=0;n<4;n++){float zz=z+(n-1.5f)*1.65f;b.box({x-s*.105f,1.03f,zz},{.13f,1.89f,1.55f},iron);
        b.box({x-s*.184f,1.1f,zz},{.028f,1.44f,1.36f},n==k%4?V{.43f,.35f,.23f}:V{.22f,.32f,.32f},n==k%4?Warm:DarkGlass);
        if(h>5)b.box({x-s*.08f,h-1.27f,zz},{.1f,1.13f,.84f},iron,DarkGlass);}
    b.box({x-s*.20f,2.7f,z},{.27f,.62f,w*.93f},iron,Enamel);b.box({x-s*.35f,2.3f,z},{.71f,.105f,w*.96f},pine,Fabric);
    b.sign({x-s*.348f,2.47f,z-3.20f},{0,0,6.4f},.42f,8+k%6);}
void street(Builder& b,bool rear){
    float z=rear?51:-45,mid=z+22.5f;b.box({0,-.13f,mid},{36,.25f,45},{.17f,.20f,.21f},Aggregate);
    for(float x:{-11.f,11.f})b.box({x,.019f,mid},{4,.10f,45},rock,Stone);
    for(int i=0;i<9;i++)b.box({0,.012f,z+2+i*5},{.085f,.016f,2.10f},brass,Enamel);
    for(int s:{-1,1})for(int k=0;k<5;k++)shop(b,s,z+4.1f+k*8.4f,(k+3+(s>0?2:0))%6);
    overheadLine(b,-10.85f,z+2.0f,3);
    for(int i=0;i<4;i++){float x=i%2?-9.7f:9.7f,zz=z+5+i*11;lampPost(b,x,zz);b.pipe({x,.03f,zz+2},{x,1.04f,zz+2},.046f,.045f,iron);b.box({x,1.15f,zz+2},{.25f,.31f,.16f},rock);}
    for(int j=0;j<8;j++)b.box({-4.4f+j*1.27f,.019f,z+9},{.66f,.012f,2.45f},trim,Enamel);
    if(rear){for(int i=0;i<7;i++){float x=(i-3)*4.2f,h=4.f+i%3*2;b.box({x,h/2,84},{4.0f,h,5},i%2?brick:rock,Plaster);
        for(int n=0;n<3;n++)panel(b,x+(n-1)*1.13f,2.2f,81.48f,.69f,1.12f,i==3?amber:iron,i==3?Warm:DarkGlass);}
        b.box({1,.71f,66},{1.85f,.11f,.54f},timber,Wood);for(float x:{.02f,1.98f})b.pipe({x,0,66.32f},{x,2.6f,66.32f},.047f,.047f,iron);
        b.box({1,2.65f,66},{2.39f,.12f,1.1f},iron);b.sign({.02f,1.8f,66.24f},{1.96f,0,0},.49f,10);}}
void roof(Builder& b,V p,float w,float d,float h){V a=p+V{-w/2,0,-d/2},c=p+V{w/2,0,-d/2},v={0,0,d},r=p+V{0,h,-d/2};
    b.face(a,a+v,r+v,r,iron,Metal);b.face(r,r+v,c+v,c,rock,Metal);b.face(a,r,c,c,timber,Wood);b.face(c+v,r+v,a+v,a+v,timber,Wood);}
void stairs(Builder& b,V base,V axis,float run,float rise,float w){
    V side={axis.z,0,-axis.x};int n=20;float step=run/n;
    for(int i=0;i<n;i++){V at=base+axis*((i+.5f)*step)+V{0,rise*(i+.5f)/n-.055f,0};b.box(at,{std::abs(axis.x)*step+std::abs(side.x)*w,.12f,std::abs(axis.z)*step+std::abs(side.z)*w},timber,Wood);
        if(i%4==0){V a=at+side*(w/2);b.pipe(a,a+V{0,.85f,0},.035f,.035f,iron);}}
    for(int s:{-1,1}){V a=base+side*(s*w/2)+V{0,.84f,0};b.pipe(a,a+axis*run+V{0,rise,0},.037f,.037f,timber,Wood);}}
void table(Builder& b,V p,float w,float d,float h){b.box(p+V{0,h,0},{w,.1f,d},timber,Wood);for(int x:{-1,1})for(int z:{-1,1})b.box(p+V{x*(w*.5f-.09f),h*.5f,z*(d*.5f-.09f)},{.09f,h,.09f},timber,Wood);}
void bed(Builder& b,V p,float w,float d){b.box(p+V{0,.39f,0},{w,.21f,d},timber,Wood);b.box(p+V{0,.57f,0},{w-.05f,.21f,d-.07f},trim,Fabric);b.box(p+V{0,.708f,-d*.07f},{w-.07f,.052f,d*.73f},pine,Fabric);b.box(p+V{0,.734f,d*.30f},{w*.61f,.13f,.42f},rock,Fabric);}
void houseRoom(Builder& b,const RoomDef& r){
    auto p=r.center;float w=r.w,d=r.d;b.box(p+V{0,-.09f,0},{w,.17f,d},r.center.y<0?rock:timber,r.center.y<0?Stone:Wood);
    b.box(p+V{0,3.37f,0},{w,.15f,d},rock,Plaster);for(int j=0;j<4;j++){
        bool horiz=j%2==0;float span=horiz?w:d,off=(j==0||j==3?-1:1)*(horiz?d:w)*.5f;
        auto section=[&](float mid,float size){V v=p+(horiz?V{mid,1.63f,off}:V{off,1.63f,mid});V extent=horiz?V{size,3.28f,.15f}:V{.15f,3.28f,size};
            b.box(v,extent,r.center.y<0?rock:V{.56f,.53f,.43f},r.center.y<0?Stone:Plaster);v.y=p.y+.13f;b.box(v,{extent.x+.058f,.26f,extent.z+.058f},timber,Wood);v.y=p.y+2.99f;b.box(v,{extent.x+.07f,.085f,extent.z+.07f},trim,Wood);};
        if(std::strchr(r.open,"nesw"[j])){float piece=(span-2.5f)*.5f;section((span-piece)*.5f,piece);section(-(span-piece)*.5f,piece);
            b.box(p+(horiz?V{0,2.89f,off}:V{off,2.89f,0}),horiz?V{2.56f,.78f,.17f}:V{.17f,.78f,2.56f},rock,Plaster);}
        else section(0,span);}
    std::string id=r.name;
    if(id=="living"){b.box({-3.85f,.37f,4.9f},{1.63f,.65f,3.64f},pine,Fabric);b.box({-4.55f,.87f,4.9f},{.38f,.76f,3.63f},pine,Fabric);
        for(int i=0;i<3;i++)b.box({-3.77f,.72f,3.75f+i*1.12f},{1.2f,.15f,1.05f},{.33f,.37f,.28f},Fabric);
        table(b,{3.9f,0,3.1f},1.55f,1.1f,.66f);b.box({3.9f,1.22f,3.46f},{1.43f,1.04f,.61f},dark,Polymer);
        panel(b,3.90f,1.27f,3.137f,1.17f,.81f,{.44f,.55f,.64f},Cold);
        for(int i=0;i<19;i++)panel(b,3.90f, .92f+i*.038f,3.114f,1.09f-.08f*(i%4),.009f,iron,DarkGlass);
    }else if(id=="kitchen"){b.box({-4.44f,.45f,15.4f},{1,.9f,6.2f},trim,Enamel);b.box({-4.44f,.94f,15.4f},{1.05f,.10f,6.25f},rock,Stone);
        for(int i=0;i<5;i++){b.box({-3.92f,.47f,13.03f+i*1.13f},{.04f,.73f,.91f},timber,Wood);b.box({-3.88f,.65f,13.32f+i*1.13f},{.035f,.035f,.17f},brass);}
        b.box({-3.85f,1.005f,16.38f},{.66f,.06f,.91f},dark,DarkGlass);
        b.box({-4.16f,1.08f,18.35f},{1.19f,2.17f,1.06f},trim,Enamel);b.box({-3.54f,1.28f,18.31f},{.06f,1.55f,.74f},light,Cold);b.box({-3.41f,1.18f,18.02f},{.29f,1.86f,.12f},trim,Enamel);
        table(b,{2.9f,0,18},2.2f,1.28f,.83f);
    }else if(id=="bedroom"){bed(b,{18.36f,3.2f,12.7f},2.7f,3.2f);table(b,{14.1f,3.2f,11.9f},.91f,.67f,.7f);}
    else if(id=="nursery"){bed(b,{24.45f,3.2f,13.14f},1.5f,2.23f);for(int k=0;k<6;k++)b.box({27.4f+.16f*k,3.38f,16.7f+.2f*(k%3)},{.28f,.32f,.3f},k%2?brick:pine,Wood);}
    else if(id=="bath"){b.box({13.2f,3.49f,26.1f},{2.3f,.61f,1.98f},trim,Enamel);b.pool({13.2f,3.815f,26.14f},.91f,.73f,6);table(b,{15.6f,3.2f,24.5f},.68f,.51f,.70f);panel(b,16.9f,5.04f,27.88f,2.0f,1.29f,rock,DarkGlass);}
    else{table(b,{-4.03f,-3,35.3f},2.52f,1.71f,1.01f);b.pool({.3f,-2.99f,35.4f},2.5f,2.13f,9);
        for(int i=0;i<9;i++){float a=2*pi*i/9,x=2.3f*std::cos(a),z=35.2f+2.3f*std::sin(a);b.pipe({x,-3,z},{x,-2.57f,z},.043f,.046f,trim,Polymer);b.pipe({x,-2.57f,z},{x,-2.48f,z},.032f,.0f,amber,Warm);}}
    if(id=="living"||id=="kitchen")for(int i=0;i<24;i++){
        float x=(i%2?-1:1)*(3.53f+(i%5)*.2f),z=p.z-d*.42f+std::fmod(i*1.72f,d*.83f);float h=.21f+.055f*(i%5);
        if(i%3){b.pipe({x,.035f,z},{x+.05f,h,z},.14f+.025f*(i%4),.18f,dark,Polymer,8);b.pipe({x+.05f,h,z},{x,h+.09f,z},.178f,.029f,dark,Polymer,8);}
        else b.box({x,.09f,z},{.45f,.16f,.30f},trim,Paper);}
}
void porch(Builder& b){
    b.box({0,-.12f,-23},{48,.22f,46},pine,Aggregate);b.box({0,-.002f,-20},{7.2f,.027f,40},{.18f,.19f,.20f},Aggregate);
    for(int s:{-1,1})for(int j=0;j<5;j++){float x=s*(9+j%2*1.8f),z=-39+j*8.6f;
        b.box({x,1.65f,z},{6,3.3f,5},j%2?timber:rock,Wood);roof(b,{x,3.29f,z},6.7f,5.8f,1.27f);
        for(int k:{-1,1})panel(b,x+k*1.55f,1.74f,z-2.54f,.8f,1.15f,k==1&&j%2?amber:iron,k==1&&j%2?Warm:DarkGlass);}
    overheadLine(b,5.6f,-43,3);
    for(int i=0;i<8;i++){int side=i%2?1:-1;float x=side*(4.7f+.33f*(i%3)),z=-37+i*4.25f;
        b.pipe({x,0,z},{x,.86f,z},.05f,.054f,timber,Wood,7);b.box({x,.92f,z},{.24f,.25f,.47f},i%3?iron:brick,Enamel);b.box({x+side*.13f,1.0f,z+.03f},{.025f,.07f,.12f},brick,Enamel);}
    roof(b,{0,3.4f,5},10.65f,10.7f,1.98f);b.box({0,2.64f,-1.5f},{7.2f,.13f,3.20f},timber,Wood);
    for(float x:{-3.3f,3.3f})b.box({x,1.36f,-2.84f},{.18f,2.72f,.18f},trim,Wood);b.box({0,.016f,-1.53f},{7.3f,.05f,3.1f},timber,Wood);
    b.sign({1.67f,1.43f,-.13f},{1.4f,0,0},.36f,14);}
void tree(Builder& b,V p,int seed){
    float h=4.7f+std::fmod(std::abs(p.x*1.73f+p.z),5.7f),r=.90f+h*.095f;b.pipe(p,p+V{.04f,h,0},.16f,.041f,timber,Wood,6);
    for(int tier=0;tier<5;tier++)for(int j=0;j<7;j++){float a=j*(2*pi/7)+tier*.49f+seed*1.41f,span=r*(1-tier*.13f),y=h*(.17f+tier*.143f);
        V d=forward(a),s=right(a),trunk=p+V{0,y+.19f*h,0},tip=p+d*span+V{0,y-.17f,0},k=p+d*(span*.55f)+V{0,y+.16f,0},u=k-s*(span*.35f),v=k+s*(span*.35f);
        b.face(trunk,u,tip,v,tier%2?pine:V{.13f,.21f,.17f},Fabric);
        if((j+seed)%3){V n={0,.025f,0};b.face(trunk+n,lerp(k,u,.64f)+n,lerp(k,tip,.75f)+n,lerp(k,v,.51f)+n,{.50f,.57f,.58f},Stone);}}}
void outdoors(Builder& b){b.box({9,-.145f,19},{105,.26f,145},snow,Stone);
    for(int i=0;i<74;i++){float z=-48+i*1.6f;for(int s:{-1,1})b.box({std::sin(z*.09f)*.40f+s*1.28f,-.006f,z},{.33f,.017f,1.62f},{.48f,.51f,.50f},Aggregate);}
    for(int s:{-1,1})for(int i=0;i<9;i++){float z=-24+i*9.2f,x=s*(37.f+4*std::sin(float(i)));b.pipe({x,-2,z},{x+s*2.f,7.f+i%4*2.4f,z+3.1f},8.f+i%4,.2f,{.29f,.36f,.40f},Stone,7);}
    for(int i=0;i<13;i++){float h=.13f+i*.235f;for(float x:{-4.f,4.f})b.pipe({x,h,9.86f},{x,h,19.14f},.135f,.135f,timber,Wood);
        for(float z:{10.f,19.f})for(int s:{-1,1})b.pipe({s*1.36f,h,z},{s*4.12f,h,z},.135f,.135f,timber,Wood);}
    roof(b,{0,3.16f,14.5f},9.15f,10.35f,2.04f);bed(b,{-2.3f,0,15.3f},1.51f,2.66f);table(b,{2,0,16.4f},1.5f,.85f,.83f);
    b.box({1.91f,1.04f,16.4f},{.50f,.27f,.31f},iron);panel(b,1.91f,1.08f,16.22f,.28f,.065f,light,Cold);b.pipe({2.06f,1.16f,16.48f},{2.13f,1.65f,16.49f},.012f,.007f,iron);
    b.sign({1.58f,1.63f,9.82f},{1.86f,0,0},.48f,15);
    b.pipe({2.8f,0,28},{2.8f,1.54f,28},.070f,.063f,timber,Wood);b.sign({2.12f,1.09f,27.93f},{1.41f,0,0},.40f,16);
    for(float x:{-4.45f,4.45f})for(float z:{50.1f,59.3f})b.pipe({x,0,z},{x,5.16f,z},.13f,.10f,iron);
    for(float x:{-4.43f,4.43f}){b.pipe({x,.08f,50.2f},{x,4.8f,59.3f},.065f,.065f,iron);b.pipe({x,4.8f,50.2f},{x,.08f,59.3f},.065f,.065f,iron);}
    stairs(b,{-4,0,51},{1,0,0},8,1.75f,1.72f);b.box({3.85f,1.69f,52.92f},{1.56f,.12f,2.34f},timber,Wood);
    stairs(b,{4,1.75f,54.72f},{-1,0,0},8,1.75f,1.74f);b.box({-3.83f,3.44f,56.31f},{1.67f,.12f,2.16f},timber,Wood);
    stairs(b,{-4,3.5f,58},{1,0,0},8,1.45f,1.85f);
    b.box({3.43f,5.51f,58.65f},{.59f,1.09f,.31f},iron);panel(b,3.43f,5.78f,58.46f,.21f,.103f,amber,Warm);
    b.pipe({4.24f,4.9f,59},{4.24f,10.2f,59},.079f,.03f,iron);b.sign({-4.83f,1.10f,49.9f},{1.44f,0,0},.47f,17);
    b.box({42,.38f,54},{1.12f,.76f,.67f},iron);b.sign({41.52f,.23f,53.64f},{.96f,0,0},.30f,19);}
void range(Builder& b){b.box({0,-.08f,13},{14,.15f,49},rock,Aggregate);for(float x:{-6.65f,6.65f}){
        b.box({x,1.78f,13},{.28f,3.72f,49},rock,Aggregate);for(int j=0;j<14;j++)b.box({x*.975f,1.8f,-9+j*3.35f},{.19f,3.5f,.12f},iron);}
    b.box({0,2.69f,-6.85f},{13.2f,.19f,7.8f},iron);b.box({0,2.13f,35.1f},{13.75f,4.3f,1.05f},dark,Polymer);
    for(int j=0;j<9;j++)b.box({0,.012f,-3+j*4.4f},{13.05f,.012f,.055f},brass,Enamel);
    table(b,{-4.75f,0,-6.46f},2.6f,1.08f,.83f);b.box({-4.71f,1.14f,-6.08f},{2.14f,.51f,.07f},iron);b.sign({-5.71f,1.015f,-6.135f},{2,0,0},.37f,18);
    for(auto p:platesAt){b.pipe({p.x,0,p.z+.05f},{p.x,p.y-.27f,p.z+.05f},.047f,.034f,iron);b.box({p.x,.05f,p.z},{.77f,.1f,.53f},iron);}
}
}
void buildLocations(std::map<std::string,MeshData>& out){
    auto make=[&](std::string id,auto fn){Builder b;fn(b);out.emplace(id,std::move(b.m));};
    make("cruiser",car);make("parked-car",parkedCar);make("steering",hands);make("wiper",[](Builder& b){b.pipe({-.72f,.96f,.98f},{-.07f,1.20f,.86f},.011f,.009f,dark,Polymer);});
    make("lake-front",[](Builder& b){street(b,false);});make("lake-street",[](Builder& b){street(b,true);});make("alder-street",porch);
    for(auto& r:houseRooms)make(std::string("la-")+r.name,[&](Builder& b){houseRoom(b,r);});
    make("la-stairs",[](Builder& b){stairs(b,{5,0,15},{1,0,0},6,3.2f,2.65f);stairs(b,{0,0,20},{0,0,1},7,-3,2.65f);});
    make("door-leaf",[](Builder& b){b.box({0,1.25f,0},{2.4f,2.5f,.125f},timber,Wood);for(float x:{-.56f,.56f})for(float y:{.65f,1.75f})panel(b,x,y,-.08f,.87f,.73f,rock,Wood);b.box({.91f,1.07f,-.13f},{.18f,.052f,.09f},brass);});
    make("snow-road",outdoors);for(int k=0;k<12;k++)make("pines-"+std::to_string(k),[&](Builder& b){for(int i=0;i<480;i++){auto p=treeAt(i);if(hasTree(p)&&std::clamp(int((p.z+51)/24),0,5)*2+(p.x>6)==k)tree(b,p,i);}});
    make("annex",range);make("plate",[](Builder& b){b.pipe({0,0,.042f},{0,0,-.042f},.36f,.36f,iron,Metal,20);
        for(int i=0;i<24;i++){float a=2*pi*i/24,c=2*pi*(i+1)/24;V o={0,0,-.044f};b.face(o,o+V{.36f*std::cos(a),.36f*std::sin(a),0},o+V{.36f*std::cos(c),.36f*std::sin(c),0},o,trim,Enamel);}
        hoop(b,{0,0,-.049f},{1,0,0},{0,1,0},.19f,.011f,iron,Enamel);});
}

Pose weaponPose(const Game& g){
    float run=g.sprintWeight,cycle=g.stepClock,aim=g.aim;
    float yaw=g.armsYaw+run*(-.28f+.078f*std::sin(cycle));
    float pitch=g.armsPitch+g.viewKick+.075f*g.kick+run*(-.20f+.067f*std::cos(2*cycle));
    float roll=g.camRoll*.30f+run*(-.23f+.057f*std::sin(cycle));
    Pose p;p.z=forward(yaw,pitch);V x=right(yaw),up=norm(cross(p.z,x));
    p.x=x*std::cos(roll)+up*std::sin(roll);p.y=up*std::cos(roll)-x*std::sin(roll);
    p.p=g.camera+p.y*(-.012f-.14f*g.equipLower-.103f*run+.026f*g.kick+.024f*run*std::cos(2*cycle))
        +p.x*(.023f*std::sin(cycle)*g.pace*(1-aim)+.045f*run)+p.z*(-.067f*g.kick-.033f*run);
    if(g.weapon()==Weapon::Sniper)p.p=p.p-p.y*(.052f*aim);return p;
}
V Game::muzzle()const{
    static constexpr V hip[]={{.1314f,-.1076f,1.0159f},{.1863f,-.1309f,.6356f},{.1018f,-.0097f,.4384f},{.115f,-.108f,1.108f},{.1314f,-.1076f,1.0759f},{.115f,-.108f,1.108f},{.14894f,-.1289f,.9588f}};
    static constexpr V ads[]={{0,-.073f,1.059f},{0,-.048f,.665f},{-.0719f,.011f,.412f},{0,-.048f,1.152f},{0,-.073f,1.119f},{0,-.048f,1.152f},{0,-.102f,1.005f}};
    Pose p=weaponPose(*this);V v=lerp(hip[int(weapon())],ads[int(weapon())],aim);return p.p+p.x*v.x+p.y*v.y+p.z*v.z;
}
void locationInstances(const Game& g,std::vector<Instance>& out,bool shadows){
    auto add=[&](const std::string& id,V pos={},float yaw=0,int key=0){out.push_back({id,at(pos,yaw),key});};
    if(g.recording!=Recording::Range){bool driving=g.stage==Stage::Flight;V carPos=driving?g.vehicle():V{-2.35f,0,-9.65f};
        if(len(carPos-g.camera)<55){add("cruiser",carPos);if(driving&&!shadows){
            Pose steer=at(carPos);float turn=.055f*std::sin(g.time*1.18f)+.10f*(smooth(4.1f,6.1f,g.age)-smooth(7.4f,8.6f,g.age));
            steer.x={std::cos(turn),std::sin(turn),0};steer.y={-std::sin(turn),std::cos(turn),0};V hub={-.36f,.85f,.24f};
            steer.p=carPos+hub-steer.x*hub.x-steer.y*hub.y-steer.z*hub.z;out.push_back({"steering",steer});Pose w=at(carPos);float a=(g.recording==Recording::Grey?.08f:.15f)*std::sin(g.time*2.4f);
            w.x={std::cos(a),std::sin(a),0};w.y={-std::sin(a),std::cos(a),0};
            V pivot={-.72f,.96f,.98f};w.p=carPos+pivot-w.x*pivot.x-w.y*pivot.y-w.z*pivot.z;out.push_back({"wiper",w});}}}
    switch(g.recording){
    case Recording::Animal:{
        if(g.camera.z<17)add("lake-front");if(g.camera.z>31)add("lake-street");
        for(int i=0;i<8;i++){float z=i<4?-37.f+i*8:55.f+(i-4)*7;if(std::abs(g.camera.z-z)<43)add("parked-car",{i%2?7.6f:-7.2f,0,z},i%2?3.07f:.06f);}
        if(g.stage==Stage::Flight&&g.age<8.7f)add("parked-car",{2.15f,0,-14.f-3.72f*g.age},pi);break;}
    case Recording::House:{
        if(g.camera.z<20)add("alder-street");for(auto& r:houseRooms)if(len(g.camera-r.center)<34)add(std::string("la-")+r.name);
        if(g.camera.z>0)add("la-stairs");auto door=[&](float z,float open){float angle=open*1.53f;add("door-leaf",{-1.2f+1.2f*std::cos(angle),0,z+1.2f*std::sin(angle)},-angle);};door(0,g.door);door(20,g.beat>=5?1.f:0.f);
        if(g.beat>=5)add("patient",callerAt,.75f,96);break;}
    case Recording::Grey:add("snow-road");for(int k=0;k<12;k++){float mid=-39.f+(k/2)*24;if(std::abs(mid-g.camera.z)<64)add("pines-"+std::to_string(k));}break;
    case Recording::Range:add("annex");for(int i=0;i<6;i++){Pose p=at(platesAt[i]);float a=g.plates[i]*1.4f;
        p.y={0,std::cos(a),std::sin(a)};p.z={0,-std::sin(a),std::cos(a)};out.push_back({"plate",p});}break;}
    if(g.stage==Stage::Flight)return;
    int crew=g.recording==Recording::Grey?2:g.recording==Recording::House?1:0;
    for(int i=0;i<crew;i++){const auto& a=g.crew[i];auto p=at(a.pos,a.yaw);p.morph=.5f+.46f*a.pace*std::sin(a.stride);p.action=smooth(0,.11f,a.shot);p.reaction=clamp(a.stun);if(g.tetherActor==i)p.p.y+=.93f*std::sin(pi*clamp(g.tether/1.35f));out.push_back({i?"operator":"officer",p,80+i});}
    for(size_t i=0;i<g.contacts.size();i++){const auto& c=g.contacts[i];if(c.kind==4||len(c.p-g.camera)>61||(c.kind==3||c.kind==5)&&(!c.awake||c.hp<=0)||(c.kind==5&&g.phaseOut>0))continue;
        const char* id=c.kind==0?"infected":c.kind==1?"hound":c.kind==2?"golem":c.kind==3?"witch":g.aggro<.38f?"grey-watch":"grey";
        if(c.hp<=0)id=c.kind==1?"sleeping-dog":"patient";
        Pose p=at(c.p,std::atan2(g.pos.x-c.p.x,g.pos.z-c.p.z));p.morph=.5f+.49f*std::sin(g.time*(c.kind==5?4.4f:6.3f)+i);p.reaction=c.flinch;
        out.push_back({id,p,100+int(i)});}
}
void locationEffects(const Game& g,Builder& b){
    if(g.stage==Stage::Flight&&g.recording!=Recording::Range&&g.recording!=Recording::Grey){
        V car=g.vehicle();int count=g.recording==Recording::House?69:36;float sweep=.50f+.42f*std::sin(g.time*2.4f);
        for(int i=0;i<count;i++){float x=std::fmod(i*.4193f+.13f,1.0f),y=std::fmod(i*.6234f+g.time*(.012f+.003f*(i%3)),1.0f);
            if(std::abs(x-sweep)<.21f&&y>.31f&&x<.76f)continue;
            V a=car+V{(x-.5f)*1.38f,1.59f-.57f*y,.68f+.31f*y};
            V r{.0018f+.0006f*(i%4),0,0},down{.0013f,-.007f-.003f*(i%4),.005f};
            b.face(a-r,a+down,a+r,a-down*.22f,{.36f,.40f,.38f},DarkGlass);}}
    if(g.recording==Recording::House&&!g.cellarKey&&g.beat<5){b.pipe(keyAt,keyAt+V{.15f,0,.04f},.019f,.015f,brass,Metal,7);hoop(b,keyAt,{1,0,0},{0,0,1},.045f,.011f,brass,Metal,8);}
    if(g.tether>0&&((g.recording==Recording::Grey&&g.uv)||g.recording==Recording::House)){
        bool alien=g.recording==Recording::Grey;V a=alien?g.contacts[0].p+V{0,1.7f,0}:g.contacts[0].origin;
        V end=g.lashTarget;if(alien&&g.tetherActor>=0)end=g.crew[g.tetherActor].pos+V{0,1.1f+.93f*std::sin(pi*clamp(g.tether/1.35f)),0};
        V prev=a;for(int i=1;i<=14;i++){float t=i/14.f;V q=lerp(a,end,t)+V{std::sin(9*t+g.time*6)*.18f,std::sin(t*pi)*.59f,0};b.pipe(prev,q,.057f*(1.1f-t),.054f*(1.1f-t),alien?V{.52f,.43f,.95f}:brick,alien?Cold:Hide,7);prev=q;}}
    if(g.recording==Recording::Grey){V x=right(g.camYaw)*.018f,y{0,.021f,0};for(int i=0;i<74;i++){
        float seed=float(i*31%71),h=std::fmod(41+std::fmod(i*.7531f,4.5f)-std::fmod(g.time*(.50f+.009f*(i%9)),4.5f),4.5f);
        V p={g.camera.x-5+std::fmod(seed*7.47f+std::sin(g.time*.43f+i)*.79f,10.f),g.camera.y-1.6f+h,g.camera.z-5+std::fmod(seed*13.78f,12.f)};b.face(p-x,p-y,p+x,p+y,snow,Fabric);}}
    if(g.projectile)b.pipe(g.projectilePos,g.projectilePos+norm(g.projectileVelocity)*.115f,.034f,.029f,brass,Metal,7);
    if(g.blast>.58f){float r=(1-g.blast)*2.1f+.075f;hoop(b,g.blastPos,{1,0,0},{0,0,1},r,.022f*g.blast,amber,Warm,16);}
}
std::vector<Lamp> callLights(const Game& g){
    std::vector<Lamp> l;auto add=[&](V p,V c,float r){l.push_back({p,c,r});};
    if(g.recording==Recording::Animal){l=lamps();for(float z:{-36.f,-20.f,-7.f,53.f,65.f,76.f})add({z>0?-7.f:6.f,4.3f,z},amber,12);add({-4,1,61},{.15f,.32f,.89f},8);}
    if(g.recording==Recording::House){add({3.88f,1.26f,3.0f},light*(.66f+.2f*std::sin(g.time*37)),5);add({-3.45f,1.4f,18.23f},light,5.8f);
        add({1.5f,2.4f,16},amber*(.64f+.19f*std::sin(g.time*11)),4.8f);for(auto& r:houseRooms)if(r.center.y!=0)add(r.center+V{1,2.2f,1},r.center.y>0?amber:brick,6.4f);
        for(float z:{-36.f,-20.f,-5.f})add({-4.3f,3.4f,z},amber,8);}
    if(g.recording==Recording::Grey){add({1,2.5f,13},amber,7.5f);add({-3,2,9},light,5);add({3.5f,6,58},amber,6);if(g.beat==4)add(flareAt,{1,.16f,.05f},15);}
    if(g.recording==Recording::Range)for(int i=0;i<8;i++)add({i%2?3.1f:-3.1f,3.2f,-7.f+i*5.7f},i%2?light:amber,10);
    if(g.stage==Stage::Flight){V v=g.vehicle();add(v+V{.26f,1.1f,.31f},light*.55f,1.1f);add(v+V{0,.8f,6.8f},light,9);
        if(g.recording==Recording::Animal&&g.age<8.7f)add({2.15f,.70f,-16.f-3.72f*g.age},amber*.73f,6.5f);}
    if(g.flash>.001f)add(g.muzzle(),{1,.72f,.32f},3.8f+g.flash*11.f);
    if(g.blast>.03f)add(g.blastPos,{1,.48f,.14f},2.5f+10*g.blast);
    std::stable_sort(l.begin(),l.end(),[&](const Lamp& a,const Lamp& b){return len(a.p-g.camera)-.3f*a.range<len(b.p-g.camera)-.3f*b.range;});l.resize(8,{{},{},1.f});return l;
}
}
