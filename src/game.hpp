#pragma once
#include "types.hpp"
#include "effects.hpp"
#include "body.hpp"
#include <deque>
namespace fever {
struct Cue {std::string id,text,direction;Speaker speaker;Bus bus;float duration;int priority;};
std::vector<Cue> readScript(const std::string& path);
struct Subtitle {std::string id;std::string text;Speaker speaker=Speaker::Dispatch;float left=0;};
struct Game {
    Body body;float idleTime=0,sprintWeight=0,reloadDuration=1.45f;bool reloadEmpty=false,reloadSeated=false;
    Particles particles;Tuning tuning;Brain hostBrain;V hostVelocity{};float hostFlinch=0;
    Stage stage=Stage::Flight; float time=0,age=0,stageStart=0,door=0;
    V pos={0,0,-11},velocity{},camera{},host{},lashTarget{},lastShot{},lastImpact{};
    float yaw=0,pitch=0,camYaw=0,camPitch=0,camRoll=0,armsYaw=0,armsPitch=0,equipLower=0,aim=0,duck=0,height=0,vertical=0;
    float hp=100,stress=0,kick=0,flash=0,shotDelay=0,reloadTime=0,stepClock=0,turnRate=0,pace=0;
    float allyTimer=0,enemyTimer=0,attackTimer=0,lashAmount=0,impact=0,exposure=0,hostHP=8,lashHP=7,damageFlash=0;
    bool torch=true,patientSeen=false,hitOnce=false,playerShotLash=false,interlock=false,wasFiring=false;
    int slot=0,mag[2]={24,13},reserve[2]={72,39},shots=0,crewShots=0,callsign=17;
    std::array<Person,3> crew; std::array<Spring,6> mount{};Spring handYaw{},handPitch{};
    std::vector<Box> solids;std::vector<Event> events;std::vector<Mark> marks;
    std::vector<Cue> script;std::deque<std::string> queue;std::vector<std::string> spoken;
    Subtitle subtitle;int captionPriority=0;float captionGap=0;
    Game(std::vector<Cue> lines={});
    void restart(Stage checkpoint=Stage::Flight);
    void tick(const Input& in,const Prefs& prefs,float dt);
    void enter(Stage next);
    void say(const std::string& id);
    void emit(Sound s,V p,Bus b=Bus::World,float gain=1);
    V source(Speaker s)const; Zone room()const;
    bool passable(V p)const;
    float wallDistance(V from,V dir)const;
    V lashPoint(float t)const;
    V aimRay()const;
    V craft()const;
    void shoot(bool ally=false,int index=0);
    void moveCrew(float dt);
    void tickScript(float dt);
    void refreshCamera(const Input& in,const Prefs& prefs,float dt);
    bool canReport()const;
    static V dog(){return {-2.24f,.84f,25.8f};}
    static V patient(){return {1.20f,0,44.3f};}
    static V desk(){return {4.3f,1.15f,48.5f};}
};
}
