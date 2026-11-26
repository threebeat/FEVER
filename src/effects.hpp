#pragma once
#include "types.hpp"
namespace fever {
enum class Matter{Concrete,Steel,Glass,Fabric,Fluid};
enum class ParticleKind{Dust,Spark,Fibre,Droplet,Flame,Smoke,Casing,Shell};
struct Particle {V p,v;float life,total,radius;ParticleKind kind;float floor=0;};
// Fixed capacity. Old low-energy particles can be recycled without a frame allocation.
class Particles {
    std::array<Particle,160> pool{};unsigned next=0,seed=1296349;
    float random();
public:
    void burst(V p,V direction,Matter matter,int count=10);
    void discharge(V,V,float);void eject(V,V,float,bool);
    void update(float dt);
    void clear(){pool={};next=0;}
    const auto& all()const{return pool;}
};
struct Barrier{Box box;Matter material;};
const std::vector<Barrier>& audioBarriers();
}
