#pragma once
#include "game.hpp"
#include <map>
namespace fever {
struct Spatial {float left,right,cutoff,send;};
Spatial acousticPath(V listener,float yaw,Zone room,V source,Bus bus,float door);
struct MixState {
    V listener{},crew[3]{};float yaw=0,door=1,pace=0,turn=0,stress=0,impact=0,recoverySeconds=.85f,rotor=0,volume=.78f;
    Zone room=Zone::Yard;bool night=false,active=false;
};
class Mixer {
    static constexpr int rate=48000;
    struct Voice {const std::vector<float>* pcm=nullptr;size_t at=0;Event e{};float history=0,slow=0,level=0,priority=0;};
    std::array<Voice,32> voices{};std::map<Sound,std::vector<float>> effects;std::map<std::string,std::vector<float>> takes;
    std::vector<float> delayL,delayR;size_t wi=0;uint32_t rng=746813;float prevNoise=0,wind=0,outputPeak=0,phase=0,heart=0,env=0,filterL=0,filterR=0;
    uint64_t clock=0;float noise();
    float overload=0, muffling=0, ringPhase=0;
    void renderBlock(int16_t* stereo,int frames,const MixState&);
    static constexpr int blockSize=512;
public:
    Mixer();
    void loadTakes(const std::string& folder,std::vector<Cue>& script);
    void play(const Event&);
    void clear();
    void render(int16_t* stereo,int frames,const MixState&);
    float overloadLevel()const{return overload;}
    size_t recordedTakes()const{return takes.size();}
};
MixState mixState(const Game& game,const Prefs& prefs,bool active);
}
