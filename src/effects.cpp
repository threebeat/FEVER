#include "effects.hpp"
namespace fever {
float Particles::random(){seed^=seed<<13;seed^=seed>>17;seed^=seed<<5;return (seed>>8)/16777216.f;}
void Particles::burst(V p,V dir,Matter mat,int count){
    for(int j=0;j<count;j++){
        auto& a=pool[next++%pool.size()];a.p=p;float r=random();
        a.kind=mat==Matter::Steel&&r>.28f?ParticleKind::Spark:mat==Matter::Fluid?ParticleKind::Droplet:mat==Matter::Fabric?ParticleKind::Fibre:ParticleKind::Dust;
        a.total=a.life=(a.kind==ParticleKind::Spark?.16f:.31f)+random()*.51f;
        a.radius=a.kind==ParticleKind::Spark?.006f+random()*.008f:.016f+random()*.031f;
        a.v=dir*(random()*2.9f)+V{(random()-.5f)*2.7f,.56f+random()*1.75f,(random()-.5f)*2.7f};
    }
}
void Particles::update(float dt){
    for(auto& a:pool)if(a.life>0){a.life-=dt;a.p=a.p+a.v*dt;a.v.y-=(a.kind==ParticleKind::Dust?2.4f:7.9f)*dt;
        if(a.p.y<.025f){a.p.y=.025f;a.v.y=std::abs(a.v.y)*.23f;a.v.x*=.6f;a.v.z*=.6f;}}
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
