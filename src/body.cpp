#include "body.hpp"
namespace fever {
void Body::update(V root,float facing,float crouch,float elevation,bool seated,float dt){
    bool reset=!ready||len(root-previous)>2;
    if(reset)yaw=facing;
    V velocity=reset?V{}:flat(root-previous)*(1/std::max(.0001f,dt));
    speed=mix(speed,len(velocity),decay(9,dt));
    float twist=wrap(facing-yaw),slack=speed>.12f?.055f:.24f;
    yaw+=std::copysign(std::max(0.f,std::abs(twist)-slack),twist)*decay(12,dt);
    V side=right(yaw),ahead=forward(yaw);
    float seat=seated?1.f:0.f;
    pelvis=root+V{0,.895f-.42f*crouch-.24f*seat+elevation,0}-ahead*(.028f+.075f*crouch);
    V neutral[2]={root-side*.136f+ahead*(.050f+.21f*seat),root+side*.136f+ahead*(-.042f+.21f*seat)};
    for(int j=0;j<2;j++){
        neutral[j].y=root.y+.090f;
        if(reset){feet[j]={};feet[j].progress=1;feet[j].planted=neutral[j];feet[j].ankle=neutral[j];}
    }
    if(feet[0].progress>=1&&feet[1].progress>=1){
        float d0=len(flat(neutral[0]-feet[0].planted)),d1=len(flat(neutral[1]-feet[1].planted));
        int j=next;if((j?d1:d0)<.11f && (j?d0:d1)>.17f)j=1-j;
        if((j?d1:d0)>(speed>.2f?.14f:.092f)){
            auto& f=feet[j];f.start=f.planted;f.goal=neutral[j]+velocity*(.09f-.025f*crouch);
            f.progress=0;next=1-j;
        }
    }
    for(int j=0;j<2;j++){
        auto& f=feet[j];float sign=j?1.f:-1.f;
        f.progress=std::min(1.f,f.progress+dt*(4.1f+speed*.83f));
        if(f.progress>=1&&f.goal.y!=0){f.planted=f.goal;}
        V floor=f.progress<1?lerp(f.start,f.goal,smooth(0,1,f.progress)):f.planted;
        floor.y=neutral[j].y+std::sin(pi*f.progress)*(.032f+.019f*std::min(speed,4.f));
        f.ankle=floor+V{0,elevation*.82f,0};f.hip=pelvis+side*(sign*.105f);
        V d=f.ankle-f.hip,dir=norm(d);float dist=clamp(len(d),.055f,.829f);
        V pole=norm(ahead-dir*dot(ahead,dir));
        float t=(.42f*.42f-.41f*.41f+dist*dist)/(2*dist);
        f.knee=f.hip+dir*t+pole*std::sqrt(std::max(0.f,.42f*.42f-t*t));
    }
    ready=true;previous=root;
}
}
