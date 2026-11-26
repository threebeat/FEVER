#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <string>
#include <vector>

namespace fever {
constexpr float pi=3.141592654f;
inline float clamp(float v,float lo=0,float hi=1){return std::clamp(v,lo,hi);}
inline float mix(float a,float b,float t){return a+(b-a)*t;}
inline float smooth(float a,float b,float x){float t=clamp((x-a)/(b-a));return t*t*(3-2*t);}
inline float decay(float speed,float dt){return 1-std::exp(-speed*dt);}
struct V {
    float x=0,y=0,z=0;
    V operator+(V b) const{return {x+b.x,y+b.y,z+b.z};}
    V operator-(V b) const{return {x-b.x,y-b.y,z-b.z};}
    V operator*(float s) const{return {x*s,y*s,z*s};}
};
inline float dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}
inline V cross(V a,V b){return {a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};}
inline float len(V a){return std::sqrt(dot(a,a));}
inline V norm(V a){return a*(1/std::max(.00001f,len(a)));}
inline V lerp(V a,V b,float t){return a+(b-a)*t;}
inline V flat(V a){return {a.x,0,a.z};}
inline V forward(float yaw,float pitch=0){float c=std::cos(pitch);return {std::sin(yaw)*c,std::sin(pitch),std::cos(yaw)*c};}
inline V right(float yaw){return {std::cos(yaw),0,-std::sin(yaw)};}
inline float wrap(float a){return std::atan2(std::sin(a),std::cos(a));}
struct Box{V low,high;};
inline bool containsXZ(Box box,V p,float margin=0){return p.x>=box.low.x+margin&&p.x<=box.high.x-margin&&p.z>=box.low.z+margin&&p.z<=box.high.z-margin;}
inline float rayBox(V o,V d,Box b){
    float first=0,last=1000;
    float origins[]={o.x,o.y,o.z},dirs[]={d.x,d.y,d.z},lo[]={b.low.x,b.low.y,b.low.z},hi[]={b.high.x,b.high.y,b.high.z};
    for(int i=0;i<3;i++){
        if(std::abs(dirs[i])<.00001f){if(origins[i]<lo[i]||origins[i]>hi[i])return 1000;continue;}
        float a=(lo[i]-origins[i])/dirs[i],c=(hi[i]-origins[i])/dirs[i];
        first=std::max(first,std::min(a,c));last=std::min(last,std::max(a,c));
        if(first>last)return 1000;
    }
    return first;
}
inline float raySphere(V o,V d,V p,float radius){
    V delta=p-o;float t=dot(delta,d),h=radius*radius-dot(delta,delta)+t*t;
    return h>=0 && t+std::sqrt(h)>0?std::max(0.f,t-std::sqrt(h)):1000.f;
}
struct Spring {
    float x=0,v=0;
    void follow(float target,float hz,float dt){
        float w=hz*2*pi,y=x-target,e=std::exp(-w*dt),c=v+w*y;
        x=target+(y+c*dt)*e;v=(v-w*c*dt)*e;
    }
};
enum class Stage {Flight,Apron,Reception,Kennels,Lash,Recovery,Examination,Exposure,Report,Filed,Lost};
enum class Zone {Cabin,Yard,Intake,Kennels,Isolation};
enum class Bus {World,Radio,Body};
enum class Sound {Boot,Key,Step,Cloth,Door,Intercom,Hum,Gate,Lash,Round,Strike,Drop,Pulse,Host,Footfall,Rotors,Beep,Reload,Seat,Latch,Wind,Voice};
enum class Speaker {Dispatch,Cole,Ives,Bell,Player};
struct Event {Sound sound; V pos; Bus bus=Bus::World; float gain=1; Speaker speaker=Speaker::Player; std::string cue;};
struct Input {float walk=0,strafe=0,dx=0,dy=0;bool aim=false,fire=false,sprint=false,crouch=false,interact=false,reload=false,light=false,jump=false;int weapon=-1,cycle=0;};
struct Prefs {bool psx=false,steady=false,grain=true,lens=true,nightMix=false;float volume=.78f;};
struct Tuning {float wait=7.4f,resume=4.1f,catchup=5,run=4.85f,inspect=3.2f,hostSpeed=1.55f,reach=6.8f,spring=7,fov=105,warp=.061f,ring=.85f;};
enum class Task {Advance,Inspect,Wait,CatchUp,Defend,Treat,Open,Observe,Stagger};
struct Brain {Task task=Task::Advance;V point{},routeGoal{},remembered{};float memory=0;float think=0,watch=0,repath=0,fireTimer=0;int interest=-1,target=-1;uint32_t visited=0;std::vector<V> path;};
struct Person {Brain brain;V velocity{};float stun=0;V pos;float yaw=0,stride=0,pace=0,shot=0;};
struct Mark {V pos,normal;float time;};
inline const char* name(Speaker s){constexpr const char* names[]={"DISPATCH","COLE","IVES","BELL","REED"};return names[int(s)];}
inline Zone zone(V p){if(p.z<0)return Zone::Yard;if(p.z<11)return Zone::Intake;if(p.z<39)return Zone::Kennels;return Zone::Isolation;}
inline float deviceTime(float elapsed){return 21*3600+13*60+4+elapsed;}
}
