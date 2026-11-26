#pragma once
#include "types.hpp"
namespace fever {
struct Foot {
    V planted{},start{},goal{},ankle{},knee{},hip{};
    float progress=1;
};
struct Body {
    V pelvis{},previous{};float yaw=0,speed=0;std::array<Foot,2> feet{};
    bool ready=false;int next=0;
    void update(V ground,float facing,float crouch,float elevation,bool seated,float dt);
};
}

