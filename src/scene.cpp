#include "scene.hpp"
#include <fstream>
#include <stdexcept>
namespace fever {
namespace {
const V cement={.49f,.51f,.47f},blue={.25f,.37f,.36f},steel={.35f,.39f,.39f},iron={.16f,.18f,.17f},bone={.72f,.68f,.57f},rust={.43f,.28f,.18f},ink={.07f,.08f,.075f};
struct Builder {
    MeshData m;
    void face(V a,V b,V c,V d,V color,int mat,float u0=0,float v0=0,float u1=1,float v1=1){
        V n=norm(cross(b-a,c-a));uint32_t k=uint32_t(m.vertices.size());
        m.vertices.insert(m.vertices.end(),{{a,n,color,float(mat),u0,v1,{}},{b,n,color,float(mat),u1,v1,{}},{c,n,color,float(mat),u1,v0,{}},{d,n,color,float(mat),u0,v0,{}}});
        m.indices.insert(m.indices.end(),{k,k+1,k+2,k,k+2,k+3});
    }
    void box(V p,V size,V color,int mat=Metal){
        V a=p-size*.5f,b=p+size*.5f;
        face({a.x,a.y,a.z},{a.x,a.y,b.z},{a.x,b.y,b.z},{a.x,b.y,a.z},color,mat);
        face({b.x,a.y,b.z},{b.x,a.y,a.z},{b.x,b.y,a.z},{b.x,b.y,b.z},color,mat);
        face({a.x,a.y,b.z},{b.x,a.y,b.z},{b.x,b.y,b.z},{a.x,b.y,b.z},color,mat);
        face({b.x,a.y,a.z},{a.x,a.y,a.z},{a.x,b.y,a.z},{b.x,b.y,a.z},color,mat);
        face({a.x,b.y,b.z},{b.x,b.y,b.z},{b.x,b.y,a.z},{a.x,b.y,a.z},color,mat);
        face({a.x,a.y,a.z},{b.x,a.y,a.z},{b.x,a.y,b.z},{a.x,a.y,b.z},color,mat);
    }
    void pipe(V a,V b,float r,float end,V color,int mat=Metal,int n=8){
        V dir=norm(b-a);V side=norm(cross(dir,std::abs(dir.y)>.83f?V{1,0,0}:V{0,1,0})),up=cross(dir,side);
        for(int i=0;i<n;i++){float t=i*2*pi/n,s=(i+1)*2*pi/n;
            V k=side*std::cos(t)+up*std::sin(t),l=side*std::cos(s)+up*std::sin(s);
            face(a+k*r,a+l*r,b+l*end,b+k*end,color,mat);}
    }
    void sign(V at,V across,float h,int which){
        float s=(which%2)*.5f,t=(which/2)*.25f;
        V v={0,h,0};face(at,at+across,at+across+v,at+v,{1,1,1},Sign,s+.001f,t+.002f,s+.499f,t+.248f);
    }
    void pool(V p,float rx,float rz,int seed){
        int n=18;for(int i=0;i<n;i++){auto pt=[&](int k){float a=k*2*pi/n;float s=.84f+.12f*std::sin(3*a+seed)+.08f*std::cos(7*a);
            return p+V{rx*s*std::cos(a),0,rz*s*std::sin(a)};};face(p,pt(i+1),pt(i),p,{.27f,.063f,.045f},Blood);}
    }
};
void fluorescent(Builder& b,float x,float y,float z,int kind){
    b.box({x,y+.08f,z},{.46f,.13f,1.72f},iron);
    for(float k:{-.103f,.103f})b.box({x+k,y-.018f,z},{.056f,.056f,1.52f},kind==Warm?V{1,.71f,.38f}:V{.78f,1,.93f},kind);
    for(float k:{-.66f,.66f})b.box({x,y-.05f,z+k},{.40f,.045f,.035f},steel);
}
void cart(Builder& b,float x,float z){
    for(float sx:{-.5f,.5f})for(float sz:{-.29f,.29f}){
        b.pipe({x+sx,.09f,z+sz},{x+sx,1.01f,z+sz},.024f,.024f,steel);
        b.box({x+sx,.08f,z+sz},{.1f,.15f,.095f},ink);
    }
    for(float h:{.27f,.94f})b.box({x,h,z},{1.13f,.05f,.7f},steel);
    b.box({x-.21f,1.035f,z},{.49f,.13f,.43f},bone,Paper);
    for(int j=0;j<4;j++){float a=x+.03f+j*.092f;b.pipe({a,.97f,z},{a,1.21f,z},.028f,.033f,blue,Enamel);b.box({a,1.219f,z},{.063f,.035f,.063f},rust);}
}
void cage(Builder& b,int side,float z,int number){
    const float x=side*2.03f,back=side*5.92f,mid=(x+back)*.5f;
    b.box({mid,.14f,z+1.72f},{3.9f,.27f,3.46f},cement,Aggregate);
    for(float h:{.38f,1.25f,2.39f}){
        b.box({x,h,z+1.73f},{.067f,.065f,3.48f},steel);
        b.box({mid,h,z},{3.89f,.062f,.053f},steel);
    }
    for(float zz:{z,z+3.45f})b.box({x,1.36f,zz},{.087f,2.28f,.082f},blue,Enamel);
    for(int j=1;j<13;j++){float zz=z+j*.263f;
        b.pipe({x,.35f,zz},{x,2.38f,zz},.015f,.015f,(j%4==0)?rust:steel,Metal,5);
    }
    for(int j=1;j<11;j++)b.box({x+side*j*.35f,1.34f,z},{.023f,2.05f,.025f},iron);
    b.box({x-side*.04f,1.22f,z+2.72f},{.12f,.23f,.19f},rust);
    b.box({x-side*.07f,1.30f,z+2.74f},{.10f,.046f,.43f},steel);
    b.box({x-side*.035f,1.97f,z+.63f},{.047f,.33f,.47f},bone,Paper);
    for(int j=0;j<(number%4)+1;j++)b.box({x-side*.065f,1.97f,z+.44f+.068f*j},{.012f,.19f,.021f},ink);
    b.pipe({back-side*.55f,.29f,z+.65f},{back-side*.55f,.44f,z+.65f},.29f,.19f,steel,Metal,14);
    if(number%3!=1){
        // An infusion bottle, hose into the enclosure, and clamped restraint.
        b.pipe({x+side*.20f,.31f,z+2.18f},{x+side*.20f,2.51f,z+2.18f},.023f,.024f,steel);
        b.box({x+side*.20f,2.3f,z+2.08f},{.17f,.29f,.10f},{.65f,.63f,.41f},Enamel);
        V prev={x+side*.20f,2.15f,z+2.08f};
        for(int k=1;k<=9;k++){float t=k/9.f;V q={prev.x,2.15f-1.79f*t,z+2.08f+.71f*t+.17f*std::sin(t*5)};
            b.pipe(prev,q,.011f,.011f,rust,Hide,5);prev=q;}
    }
}
Pose pose(V p,float yaw,float morph=0){Pose o;o.p=p;o.x=right(yaw);o.z=forward(yaw);o.morph=morph;return o;}
}
std::vector<Lamp> lamps(){return {
    {{-2.6f,3.38f,-.68f},{1.0f,.54f,.24f},8},{{3.7f,2.75f,-9},{.33f,.54f,.75f},9},
    {{-2.4f,3.08f,5.75f},{.62f,.90f,.79f},6.6f},{{.65f,3.03f,12.75f},{.91f,.76f,.44f},6.3f},
    {{-2.25f,2.9f,23.5f},{.50f,.84f,.77f},8},{{1.7f,3.04f,34.6f},{.83f,.39f,.24f},8},
    {{3.38f,3,44.8f},{.73f,.94f,.86f},8.3f},{{4.9f,1.67f,48.1f},{.86f,.20f,.11f},4}};}
std::map<std::string,MeshData> buildWorld(const Game& g){
    Builder yard,intake,kennelA,kennelB,iso;
    auto section=[&](float z)->Builder&{if(z<.03f)return yard;if(z<11.02f)return intake;if(z<25)return kennelA;if(z<39.02f)return kennelB;return iso;};
    for(auto v:g.solids){
        V size=v.high-v.low,p=(v.high+v.low)*.5f;if(size.y<3)continue;
        auto& b=section(p.z);b.box(p,size,cement,Plaster);
        if(p.z>=0){b.box({p.x,.57f,p.z},{size.x+.035f,1.05f,size.z+.035f},blue,Enamel);
        b.box({p.x,1.10f,p.z},{size.x+.055f,.057f,size.z+.055f},bone,Metal);
        b.box({p.x,.08f,p.z},{size.x+.07f,.16f,size.z+.07f},iron);}
    }
    yard.box({0,-.13f,-8.3f},{38,.24f,23},steel,Aggregate);
    for(int k=-3;k<=3;k++){
        yard.box({k*2.7f,.002f,-6.3f},{.081f,.008f,6.7f},{.65f,.58f,.33f},Enamel);
        if(k==0)continue;
        yard.box({k*6.4f,1.5f,3.1f+std::abs(k)*.83f},{5.9f,3.01f,4.3f},steel,Enamel);
        yard.box({k*6.4f,3.11f,3.1f+std::abs(k)*.83f},{6.1f,.23f,4.5f},iron);
    }
    // The accessible intake occupies the middle of the facade.
    yard.sign({1.9f,1.43f,-.115f},{2.8f,0,0},.73f,0);
    yard.box({1.68f,1.28f,-.13f},{.24f,.38f,.16f},ink);
    yard.box({1.68f,1.35f,-.227f},{.075f,.032f,.01f},{.28f,.85f,.52f},Cold);
    yard.box({0,2.88f,-.10f},{3.5f,.23f,.35f},steel);
    for(int i=0;i<32;i++){
        float x=(i%2?1:-1)*(12+(i%6)*3.3f),z=(-18+(i*7)%39);
        float h=3.2f+i%5;yard.pipe({x,0,z},{x,h,z},.24f,.09f,ink,Wood);
        yard.pipe({x,.8f,z},{x,h+.85f,z},1.9f+.09f*(i%7),.02f,{.06f,.10f,.08f},Fabric,8);
    }
    auto room=[&](Builder& b,float left,float rightEdge,float z0,float z1){
        b.box({(left+rightEdge)*.5f,-.075f,(z0+z1)*.5f},{rightEdge-left,.14f,z1-z0},cement,Aggregate);
        b.box({(left+rightEdge)*.5f,3.58f,(z0+z1)*.5f},{rightEdge-left,.24f,z1-z0},steel,Plaster);
        for(int side:{-1,1}){
            float x=side==-1?left+.22f:rightEdge-.24f;
            for(int n=0;n<3;n++)b.pipe({x-side*n*.13f,3.19f+n*.024f,z0},{x-side*n*.13f,3.19f+n*.024f,z1},n?.040f:.081f,n?.04f:.081f,n==1?rust:steel);
        }
        for(float z=z0+.70f;z<z1;z+=3.75f){
            b.box({0,3.40f,z},{rightEdge-left,.12f,.16f},steel);
            for(float x:{left+.07f,rightEdge-.07f})b.box({x,1.73f,z},{.15f,3.44f,.15f},blue,Enamel);
        }
        for(float z=z0+.5f;z<z1;z+=1.8f){
            b.box({-.48f,.004f,z},{.18f,.009f,.42f},iron);
            for(int j=0;j<5;j++)b.box({-.48f,.012f,z-.16f+j*.076f},{.148f,.008f,.014f},steel);
        }
    };
    room(intake,-5.1f,5.1f,.12f,11);room(kennelA,-6.1f,6.1f,11,24.1f);room(kennelB,-6.1f,6.1f,24.1f,39);room(iso,-5.7f,5.7f,39,51);
    for(auto light:lamps()){
        auto& b=section(light.p.z);fluorescent(b,light.p.x,light.p.y+.13f,light.p.z,light.color.x>light.color.y?Warm:Cold);
    }
    intake.box({-3.9f,.52f,5.6f},{2.04f,1.04f,4.22f},blue,Enamel);
    intake.box({-3.9f,1.08f,5.6f},{2.18f,.095f,4.37f},bone,Enamel);
    intake.box({-3.75f,1.43f,5.4f},{.56f,.49f,.38f},iron);
    intake.box({-3.75f,1.45f,5.19f},{.46f,.33f,.016f},{.18f,.55f,.40f},Cold);
    for(int i=0;i<8;i++){float z=1.5f+i*.75f;intake.box({4.81f,1.02f,z},{.49f,1.9f,.70f},i%3?blue:cement,Enamel);
        intake.box({4.545f,1.2f,z-.19f},{.036f,.12f,.035f},iron);
        for(int j=0;j<3;j++)intake.box({4.55f,1.66f+j*.042f,z},{.024f,.013f,.29f},ink);}
    intake.sign({-2.73f,1.31f,10.77f},{1.15f,0,0},.43f,1);
    int n=0;for(float z:{13.f,16.7f,20.4f,24.1f,27.8f,31.5f}){
        auto& b=section(z+.3f);for(int side:{-1,1})cage(b,side,z,n++);
    }
    kennelA.sign({-1.985f,1.30f,19.82f},{0,0,-1.26f},.43f,2);
    kennelB.sign({1.97f,1.27f,29.2f},{0,0,1.37f},.46f,3);
    kennelB.sign({-3.20f,1.33f,38.77f},{2.54f,0,0},.66f,4);
    cart(kennelB,-3.3f,36.4f);cart(iso,-3.33f,44.1f);cart(iso,3.8f,40.5f);
    kennelB.pool({-2.1f,.012f,25.55f},1.38f,.73f,4);
    for(int i=0;i<27;i++){auto& b=i<12?intake:kennelA;float z=i*.85f+.6f;
        b.pool({std::sin(i*.70f)*.45f+.70f,.016f,z},.034f+.009f*(i%7),.06f+.012f*(i%4),i);}
    // A surgical privacy screen on a wheeled frame shares the fabric acoustic proxy.
    iso.box({-3.51f,1.02f,44.02f},{.98f,1.66f,.035f},blue,Fabric);
    for(float x:{-4.02f,-3.00f})iso.pipe({x,.08f,44.02f},{x,1.93f,44.02f},.021f,.021f,steel);
    iso.pool({1.2f,.012f,44.2f},1.14f,.68f,5);
    iso.box({4.67f,.5f,47.4f},{1.60f,1,3.80f},blue,Enamel);
    iso.box({4.67f,1.04f,47.4f},{1.72f,.09f,3.93f},steel);
    iso.box({4.39f,1.31f,48.5f},{.55f,.43f,.41f},iron);
    iso.box({4.38f,1.41f,48.28f},{.38f,.12f,.015f},{.62f,.22f,.11f},Red);
    iso.sign({5.59f,1.52f,47.4f},{0,0,2.07f},.58f,5);
    iso.sign({-5.60f,1.35f,46.7f},{0,0,-1.82f},.67f,6);
    for(int i=0;i<5;i++){
        float z=40.6f+i*1.91f;iso.box({-5.21f,1.29f,z},{.79f,2.5f,1.46f},steel);
        iso.box({-4.79f,1.56f,z},{.045f,.85f,1.11f},ink,DarkGlass);
        iso.box({-4.75f,1.06f,z+.42f},{.057f,.057f,.075f},{.75f,.12f,.06f},Red);
    }
    Builder door;door.box({0,1.29f,0},{2.98f,2.58f,.139f},blue,Enamel);
    door.box({0,1.81f,-.079f},{.70f,.30f,.023f},ink,DarkGlass);
    for(int i=0;i<9;i++)door.box({0,.23f+i*.24f,-.08f},{2.96f,.014f,.017f},iron);
    Builder grid;grid.box({0,2.0f,0},{4.01f,.09f,.08f},iron);
    for(int i=0;i<22;i++)grid.box({-1.97f+i*.188f,1.06f,0},{.023f,1.89f,.024f},steel);
    return {{"yard",std::move(yard.m)},{"intake",std::move(intake.m)},{"kennel-a",std::move(kennelA.m)},{"kennel-b",std::move(kennelB.m)},{"isolation",std::move(iso.m)},{"intake-door",std::move(door.m)},{"gate",std::move(grid.m)}};
}
MeshData readMesh(const std::string& path){
    std::ifstream f(path,std::ios::binary);char magic[4];uint32_t nv=0,ni=0;
    if(!f.read(magic,4)||(std::string(magic,4)!="FVM1"&&std::string(magic,4)!="FVM2"))throw std::runtime_error("Cannot read mesh "+path);
    bool animated=magic[3]=='2';
    f.read((char*)&nv,4);f.read((char*)&ni,4);if(nv>65535||ni>2000000||ni%3)throw std::runtime_error("Invalid mesh "+path);
    MeshData data;data.vertices.reserve(nv);data.indices.reserve(ni);
    for(uint32_t i=0;i<nv;i++){
        unsigned char b[32]{};if(!f.read((char*)b,animated?32:20))throw std::runtime_error("Incomplete mesh "+path);
        auto i16=[&](int k){return int16_t(int(b[k])+(int(b[k+1])<<8));};
        V p={i16(0)/2400.f,i16(2)/2400.f,i16(4)/2400.f},n={int8_t(b[6])/127.f,int8_t(b[7])/127.f,int8_t(b[8])/127.f},c={b[9]/255.f,b[10]/255.f,b[11]/255.f};
        int legacy=b[12],mat=legacy==12?Cold:legacy==13?Red:legacy==5?Metal:legacy==8?Fabric:legacy==6?DarkGlass:legacy==7?Enamel:Fabric;
        auto track=[&](int j){return V{i16(j)/3200.f,i16(j+2)/3200.f,i16(j+4)/3200.f};};
        data.vertices.push_back({p,n,c,float(mat),0,0,track(14),track(20),track(26)});
    }
    for(uint32_t i=0;i<ni;i++){uint16_t index=0;f.read((char*)&index,2);if(!f||index>=nv)throw std::runtime_error("Invalid mesh indices");data.indices.push_back(index);}
    return data;
}
std::vector<Instance> sceneInstances(const Game& g,bool shadows){
    std::vector<Instance> list;auto add=[&](std::string id,V p,float a=0){list.push_back({std::move(id),pose(p,a)});};
    float z=g.camera.z;
    if(z<15)add("yard",{});if(z<26)add("intake",{});if(z>-15&&z<46)add("kennel-a",{});if(z>0)add("kennel-b",{});if(z>17)add("isolation",{});
    if(z<22)add("intake-door",{0,g.door*2.86f,0});
    float gate=g.stage>=Stage::Recovery?smooth(0,1.4f,g.stage==Stage::Recovery?g.age:2):0;
    if(z>5)add("gate",{0,gate*2.63f,32.4f});
    if(z>22)add("hardware",{0,0,45.6f});
    if(g.time<26){add("aircraft",g.craft());add("rotor",g.craft(),g.time*25);}
    for(int i=0;i<3;i++){
        if(i==1&&g.stage>=Stage::Exposure)continue;auto& a=g.crew[i];
        std::string id=i==0?"officer":i==1?"medic":"operator";
        if(g.stage==Stage::Flight && g.age<9.2f+i*.60f)id=g.age<6.1f+i*.48f?"bench-officer":"rope-officer";
        auto p=pose(a.pos,a.yaw,.5f+.46f*a.pace*std::sin(a.stride));
        p.reaction=clamp(a.stun*2);
        if(g.stage==Stage::Examination&&i==1)p.action=smooth(1.55f,.8f,len(flat(a.pos-Game::patient())));
        else p.action=smooth(0,.11f,a.shot);
        list.push_back({id,p});
    }
    for(int i=0;i<7;i++){float zz=14.f+i*3.24f;float x=i%2?-4.15f:4.10f;if(std::abs(z-zz)<25)add("sleeping-dog",{x,.29f,zz},i*.71f);}
    float wake=g.stage==Stage::Lash?smooth(0,.62f,g.age):0;
    if(z>4&&z<47){
        auto p=pose({-2.92f-(g.stage>=Stage::Recovery?.89f:0),.28f,25.83f},1.57f,.5f+.18f*std::sin(g.time*6));
        p.action=g.lashAmount;p.reaction=g.lashHP<=0?g.lashAmount:0;
        list.push_back({wake>.15f?"hound":"sleeping-dog",p});
    }
    if(z>18){add("patient",Game::patient(),-.6f);
        if(g.stage==Stage::Exposure){Pose p=pose(g.host,std::atan2(g.pos.x-g.host.x,g.pos.z-g.host.z),.5f+.45f*std::sin(g.time*7));
            p.kneel=1-smooth(.8f,2.5f,g.age);p.reaction=g.hostFlinch;list.push_back({g.age<1.5f?"medic":"infected",p});}
        if(g.stage>=Stage::Report&&g.stage!=Stage::Lost)add("medic-down",g.host,.9f);}
    if(!shadows&&(g.stage!=Stage::Flight||g.age>10.9f)&&g.stage!=Stage::Lost){
        Pose p;p.z=forward(g.armsYaw,g.armsPitch);p.x=right(g.armsYaw);p.y=norm(cross(p.z,p.x));
        float phase=g.slot==2?1-clamp(g.shotDelay/.49f):g.reloadTime>0?1-clamp(g.reloadTime/1.45f):1;
        float enter=smooth(.015f,.34f,phase),exchange=smooth(.37f,.71f,phase),leave=1-smooth(.73f,.99f,phase);
        p.action=enter*(1-exchange);p.reaction=exchange*leave;
        float reload=enter*leave;
        p.p=g.camera+p.y*(-.012f-.024f*reload-.14f*g.equipLower+g.kick*.029f)+p.x*(.012f*std::sin(g.stepClock)*g.pace*(1-g.aim))+p.z*(-.034f*g.kick);
        p.morph=g.aim;list.push_back({g.slot==0?"carbine":g.slot==1?"pistol":"knife",p});
    }
    return list;
}
MeshData effectsMesh(const Game& g){
    Builder b;
    if(g.stage==Stage::Flight&&g.age>5.6f){
        V c=g.craft();b.pipe(c+V{0,.6f,1.15f},{c.x,.05f,c.z+1.18f},.021f,.018f,bone,Wood,8);
    }
    if(g.stage==Stage::Lash&&g.lashAmount>.001f){
        V last=g.dog();for(int i=1;i<=20;i++){float t=i/20.f;V next=g.lashPoint(t);
            b.pipe(last,next,mix(.16f,.025f,(i-1)/20.f),mix(.16f,.025f,t),i%4?V{.39f,.16f,.13f}:bone,Hide,9);last=next;}
    }
    if(g.stage==Stage::Exposure&&g.age<2.2f){V a=Game::patient()+V{0,.18f,0},dest=g.host+V{0,1.24f,0};
        for(int i=0;i<9;i++){auto at=[&](float t){V p=lerp(a,dest,t*smooth(0,1,g.age));p.y+=std::sin(t*pi)*.52f;return p;};b.pipe(at(i/9.f),at((i+1)/9.f),.06f,.042f,rust,Hide);}}
    V cameraSide=right(g.camYaw),cameraUp=norm(cross(forward(g.camYaw,g.camPitch),cameraSide));
    for(const auto& a:g.particles.all())if(a.life>0){
        float r=a.radius*smooth(0,.21f,a.life/a.total);V x=cameraSide*r,y=cameraUp*r;
        bool spark=a.kind==ParticleKind::Spark;if(spark)y=a.v*.018f+cameraUp*r;
        V c=spark?V{1,.58f,.23f}:a.kind==ParticleKind::Droplet?V{.32f,.046f,.025f}:V{.34f,.32f,.28f};
        b.face(a.p-x,a.p-y,a.p+x,a.p+y,c,spark?Warm:a.kind==ParticleKind::Droplet?Blood:Aggregate);}
    for(auto& h:g.marks){if(g.time-h.time>40)continue;V r=norm(cross(h.normal,std::abs(h.normal.y)>.9f?V{1,0,0}:V{0,1,0}))*.047f,u=norm(cross(h.normal,r))*.050f;
        b.face(h.pos-r-u,h.pos+r-u,h.pos+r+u,h.pos-r+u,ink,Aggregate);}
    for(int i=0;i<3;i++)if(g.crew[i].shot>.056f){
        V p=g.crew[i].pos+forward(g.crew[i].yaw)*.62f+V{0,1.32f,0};b.pipe(p,p+forward(g.crew[i].yaw)*.27f,.068f,0,{1,.76f,.38f},Warm);}
    return std::move(b.m);
}
}

