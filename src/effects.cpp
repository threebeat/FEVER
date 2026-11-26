#include "effects.hpp"
namespace fever {
float Particles::random(){seed^=seed<<13;seed^=seed>>17;seed^=seed<<5;return (seed>>8)/16777216.f;}
void Particles::burst(V p,V dir,Matter mat,int count){
    for(int j=0;j<count;j++){
        auto& a=pool[next++%pool.size()];a.p=p;a.floor=std::min(0.f,p.y-.02f);float r=random();
        a.kind=mat==Matter::Steel&&r>.28f?ParticleKind::Spark:mat==Matter::Fluid?ParticleKind::Droplet:mat==Matter::Fabric?ParticleKind::Fibre:ParticleKind::Dust;
        a.total=a.life=(a.kind==ParticleKind::Spark?.16f:.31f)+random()*.51f;
        a.radius=a.kind==ParticleKind::Spark?.006f+random()*.008f:.016f+random()*.031f;
        a.v=dir*(random()*2.9f)+V{(random()-.5f)*2.7f,.56f+random()*1.75f,(random()-.5f)*2.7f};
    }
}
void Particles::discharge(V muzzle,V d,float force){
    V side=norm(cross(d,std::abs(d.y)>.88f?V{0,0,1}:V{0,1,0})),up=cross(side,d);
    for(int i=0;i<13;i++){auto& p=pool[next++%pool.size()];float v=random(),angle=random()*2*pi;bool flame=i<8;
        p.kind=flame?ParticleKind::Flame:ParticleKind::Smoke;p.p=muzzle+d*(flame?v*.19f:.05f);
        p.v=d*(flame?2.9f+v*5:.42f)+(side*std::cos(angle)+up*std::sin(angle))*(flame?1.3f:.31f);
        p.radius=force*(flame?.024f+v*.044f:.018f+v*.023f);p.total=p.life=flame?.032f+.032f*v:.22f+.15f*v;p.floor=muzzle.y-.48f;}
}
void Particles::eject(V at,V right,float ground,bool shell){
    auto& p=pool[next++%pool.size()];p.kind=shell?ParticleKind::Shell:ParticleKind::Casing;p.landed=false;p.p=at;p.v=right*(1.37f+.58f*random())+V{0,1.03f+.28f*random(),0};p.life=p.total=1.7f;p.floor=ground;p.radius=shell?.025f:.010f;
}
void Particles::update(float dt,std::vector<Event>& events){
    int clinks=0;
    for(auto& a:pool)if(a.life>0){a.life-=dt;a.p=a.p+a.v*dt;a.v.y-=(a.kind==ParticleKind::Smoke?-.88f:a.kind==ParticleKind::Flame?0.f:a.kind==ParticleKind::Dust?2.4f:8.9f)*dt;
        if(a.p.y<a.floor+.018f){a.p.y=a.floor+.018f;
            if(!a.landed&&(a.kind==ParticleKind::Casing||a.kind==ParticleKind::Shell)){
                a.landed=true;if(clinks++<4)events.push_back({Sound::Brass,a.p,Bus::World,a.kind==ParticleKind::Shell?.83f:.55f});}
            a.v.y=std::abs(a.v.y)*.23f;a.v.x*=.6f;a.v.z*=.6f;}}
}
const std::vector<Barrier>& audioBarriers(){
    static const std::vector<Barrier> surfaces={
        {{{-5.02f,0,3.45f},{-2.73f,1.08f,7.87f}},Matter::Steel},
        {{{4.50f,0,1.1f},{5.12f,1.96f,7.62f}},Matter::Steel},
        {{{-1.99f,.30f,13},{-1.97f,2.4f,35}},Matter::Steel},
        {{{1.97f,.3f,13},{1.99f,2.4f,35}},Matter::Steel},
        {{{-4.85f,1.15f,40},{-4.78f,2.1f,49}},Matter::Glass},
        {{{-4.0f,.2f,43.85f},{-3.02f,1.87f,44.16f}},Matter::Fabric},
        {{{-6.2f,0,38.91f},{-.15f,3.45f,39.09f}},Matter::Concrete},
        {{{2.88f,0,38.91f},{6.2f,3.45f,39.09f}},Matter::Concrete},
        {{{-6.1f,0,10.91f},{-1.35f,3.45f,11.09f}},Matter::Concrete},
        {{{1.5f,0,10.91f},{6.1f,3.45f,11.09f}},Matter::Concrete}};
    return surfaces;
}
}
