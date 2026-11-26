#include "audio.hpp"
#include "night.hpp"
#include <fstream>
#include <cstring>
namespace fever {
namespace {
float randSigned(uint32_t& state){state^=state<<13;state^=state>>17;state^=state<<5;return (state>>8)/8388608.f-1;}
const V portals[]={{0,1.4f,0},{.1f,1.4f,11},{1.36f,1.4f,39}};
std::vector<float> readMono(const std::string& path){
    std::ifstream f(path,std::ios::binary);if(!f)return {};
    auto u16=[&](){uint16_t v=0;f.read((char*)&v,2);return v;};
    auto u32=[&](){uint32_t v=0;f.read((char*)&v,4);return v;};
    char id[4];f.read(id,4);if(std::memcmp(id,"RIFF",4))return {};u32();f.read(id,4);if(std::memcmp(id,"WAVE",4))return {};
    bool valid=false;
    while(f.read(id,4)){uint32_t n=u32();if(n>12*1024*1024)return {};auto start=f.tellg();
        if(!std::memcmp(id,"fmt ",4)&&n>=16){
            int fmt=u16(),channels=u16();auto hz=u32();u32();u16();auto bits=u16();
            valid=fmt==1&&channels==1&&hz==48000&&bits==16;
        }else if(!std::memcmp(id,"data",4)&&valid&&n>=2&&n%2==0){
            std::vector<int16_t> src(n/2);if(!f.read((char*)src.data(),n))return {};
            std::vector<float> pcm;pcm.reserve(src.size());for(auto sample:src)pcm.push_back(sample/32768.f);return pcm;
        }f.seekg(start+std::streamoff(n+(n&1)));
    }return {};
}
}
Spatial acousticPath(V p,float yaw,Zone room,V src,Bus bus,float door,Recording recording){
    if(bus!=Bus::World)return {.68f,.68f,bus==Bus::Radio?3200.f:10500.f,bus==Bus::Radio?.015f:.04f};
    if(recording!=Recording::Animal || (room==Zone::Yard&&p.z>51)){
        auto region=[&](V q){if(recording==Recording::Grey)return rect(q,0,14.5f,8,9)?1:0;
            if(recording==Recording::House){for(int j=0;j<6;j++){const auto& r=houseRooms[j];if(rect(q,r.center.x,r.center.z,r.w,r.d)&&std::abs(q.y-r.center.y-1.1f)<2.1f)return j+1;}return q.z<0?0:7;}
            return 0;};
        float distance=len(src-p),pan=clamp(dot(norm(src-p),right(yaw)),-.93f,.93f);
        int from=region(p),to=region(src);float transmission=1,high=14600;
        if(from!=to){bool closed=door<.8f&&(from==0||to==0);transmission=closed?.27f:.57f;high=closed?780.f:2900.f;
            if(std::abs(p.y-src.y)>2.4f){transmission*=.65f;high=1100;}}
        float gain=transmission/(1+.16f*distance+.007f*distance*distance);
        float send=room==Zone::Yard?.034f:room==Zone::Isolation?.39f:room==Zone::Kennels?.26f:.16f;
        return {gain*std::sqrt(.5f*(1-pan)),gain*std::sqrt(.5f*(1+pan)),high,send};}
    int a=int(room==Zone::Cabin?Zone::Yard:room)-1,b=int(zone(src))-1;V perceived=src;
    float path=len(src-p),trans=1,hz=14500;
    if(a!=b){
        int direction=b>a?1:-1;V prev=p;path=0;
        for(int i=a;i!=b;i+=direction){
            int k=direction>0?i:i-1;V portal=portals[k];
            if(i==a)perceived=portal;
            path+=len(portal-prev);prev=portal;trans*=.80f;
            if(k==0&&door<.8f){trans*=.31f;hz=800;}
        }
        path+=len(src-prev);hz=std::min(hz,4400.f/(.75f+.45f*std::abs(b-a)));
    }else if(a==2&&((src.x<-2&&p.x>-2)||(src.x>2&&p.x<2))){hz=7700;trans=.92f;}
    // Compare a transmitted ray with the door route. Frequencies and gains are game tuning.
    float transmission=1,cut=14500;V line=src-p;float direct=len(line);
    V dir=norm(line);bool blocked=false;
    for(const auto& b:audioBarriers())if(rayBox(p,dir,b.box)<direct-.015f){
        blocked=true;float factor=1,band=15000;
        switch(b.material){case Matter::Steel:factor=.78f;band=6400;break;case Matter::Glass:factor=.70f;band=4300;break;
        case Matter::Fabric:factor=.85f;band=3100;break;default:factor=.22f;band=850;break;}
        transmission*=factor;cut=std::min(cut,band);
    }
    if(blocked&&a==b){trans*=transmission;hz=std::min(hz,cut);}
    else if(blocked && transmission/(1+.16f*direct+.007f*direct*direct)>trans/(1+.16f*path+.007f*path*path)){
        perceived=src;path=direct;hz=cut;trans=transmission;}
    float pan=clamp(dot(norm(perceived-p),right(yaw)),-.92f,.92f);
    float gain=trans/(1+.16f*path+.007f*path*path),wet=room==Zone::Yard?.035f:room==Zone::Kennels?.32f:.20f;
    return {gain*std::sqrt(.5f*(1-pan)),gain*std::sqrt(.5f*(1+pan)),hz,wet};
}
float Mixer::noise(){return randSigned(rng);}
Mixer::Mixer():delayL(4801),delayR(6311){
    struct Recipe{Sound id;float seconds,tone,fall,noise,level;};
    Recipe list[]={{Sound::Boot,.15f,780,16,.03f,.22f},{Sound::Key,.08f,490,35,.04f,.15f},{Sound::Step,.27f,61,18,.66f,.64f},
    {Sound::Cloth,.20f,80,18,.95f,.18f},{Sound::Door,1.14f,41,4,.47f,.67f},{Sound::Intercom,.22f,590,12,.25f,.28f},
    {Sound::Hum,.85f,99,4,.09f,.24f},{Sound::Gate,1.36f,471,4.1f,.4f,.67f},{Sound::Lash,.67f,94,5,.81f,.69f},
    {Sound::Round,.38f,88,18,.79f,.98f},{Sound::Strike,.26f,630,18,.8f,.52f},{Sound::Drop,.53f,48,8,.50f,.70f},
    {Sound::Pulse,.34f,54,16,.15f,.45f},{Sound::Host,.94f,54,4.4f,.70f,.49f},{Sound::Footfall,.31f,82,16,.65f,.60f},
    {Sound::Rotors,1.f,27,3,.20f,.4f},{Sound::Beep,.17f,372,14,.03f,.22f},{Sound::Seat,.14f,162,27,.76f,.48f},{Sound::Latch,.11f,922,36,.69f,.32f},{Sound::Reload,.21f,536,19,.72f,.34f},{Sound::Wind,.8f,52,4,.96f,.31f},{Sound::Turn,.11f,440,52,.36f,.27f},{Sound::Knock,.77f,118,20,.30f,.64f},
    {Sound::Snow,.38f,71,9,.93f,.60f},{Sound::Glass,.69f,1100,9,.64f,.69f},{Sound::Brass,.28f,1880,23,.15f,.17f},
    {Sound::Blast,.92f,52,6,.74f,.96f},{Sound::Howl,1.75f,182,1.8f,.28f,.74f}};
    for(auto r:list){
        auto& out=effects[r.id];out.resize(size_t(r.seconds*rate));float lp=0,last=0,angle=0;
        for(size_t i=0;i<out.size();i++){
            float t=float(i)/rate,n=noise();lp+=.14f*(n-lp);float env1=std::exp(-r.fall*t);
            float voiced=std::sin(angle)+.23f*std::sin(angle*2.71f);
            angle+=2*pi*r.tone*(1+.76f*std::exp(-30*t))/rate;
            float texture=r.id==Sound::Cloth?n-last:lp*2.4f+(n-lp)*.26f;last=n;
            float val=(voiced*(1-r.noise)+r.noise*texture)*env1;
            if(r.id==Sound::Gate)val+=.18f*std::sin(t*6351)*std::exp(-7*t)+.25f*lp*std::exp(-9*std::abs(t-.21f));
            if(r.id==Sound::Round)val+=n*.84f*std::exp(-110*t)+std::sin(t*245)*.49f*std::exp(-17*t);
            if(r.id==Sound::Knock)val+=.78f*(std::sin(t*708)+lp)*std::exp(-34*std::abs(t-.24f))+.54f*std::sin(t*582)*std::exp(-36*std::abs(t-.48f));
            if(r.id==Sound::Glass)val+=.25f*std::sin(t*7066+std::sin(t*1216))*std::exp(-5*t);
            if(r.id==Sound::Snow)val+=.8f*(n-lp)*std::abs(std::sin(t*119+lp))*std::exp(-9*t);
            if(r.id==Sound::Howl)val=std::sin(t*(880+318*std::sin(t*1.6f))+std::sin(t*229)*2)*std::sin(pi*t/r.seconds)*.48f+lp*.62f;
            if(r.id==Sound::Blast)val+=.83f*std::sin(t*(185-85*t))*std::exp(-4*t)+n*std::exp(-52*t);
            if(r.id==Sound::Reload)val+=n*.55f*std::exp(-65*std::abs(t-.38f));
            out[i]=r.level*val*std::min(1.f,t*(r.id==Sound::Round?6000:620))*std::min(1.f,(out.size()-i)/170.f);
        }
    }
}
void Mixer::loadTakes(const std::string& folder,std::vector<Cue>& script){
    for(auto& c:script){auto pcm=readMono(folder+"/"+c.id+".wav");if(pcm.empty())continue;
        c.duration=std::max(c.duration,float(pcm.size())/rate);takes[c.id]=std::move(pcm);}
}
void Mixer::clear(){voices={};std::fill(delayL.begin(),delayL.end(),0);std::fill(delayR.begin(),delayR.end(),0);env=outputPeak=filterL=filterR=overload=muffling=ringPhase=0;}
void Mixer::play(const Event& e){
    const std::vector<float>* source=nullptr;
    if(e.sound==Sound::Voice){
        for(auto& v:voices)if(v.e.sound==Sound::Voice)v.pcm=nullptr;
        auto it=takes.find(e.cue);if(it==takes.end())return;source=&it->second;
    }else {auto it=effects.find(e.sound);if(it==effects.end())return;source=&it->second;}
    float pr=e.sound==Sound::Voice?10:e.sound==Sound::Round||e.sound==Sound::Lash?5:1;
    Voice* dest=nullptr;for(auto& v:voices)if(!v.pcm){dest=&v;break;}
    if(!dest){dest=&*std::min_element(voices.begin(),voices.end(),[](auto& a,auto& b){return a.priority<b.priority;});if(dest->priority>pr)return;}
    *dest=Voice{};dest->pcm=source;dest->e=e;dest->priority=pr;
}
MixState mixState(const Game& g,const Prefs& p,bool active){
    MixState m;m.listener=g.camera;m.yaw=g.camYaw;m.door=g.door;m.pace=g.pace;m.turn=g.turnRate;m.stress=g.stress;m.impact=g.impact;
    m.recording=g.recording;m.engine=g.stage==Stage::Flight&&g.recording!=Recording::Range?1-smooth(11,14.5f,g.age):0;m.volume=p.volume;m.recoverySeconds=g.tuning.ring;m.room=g.room();m.night=p.nightMix;m.active=active;
    for(int i=0;i<3;i++)m.crew[i]=g.crew[i].pos+V{0,1.48f,0};return m;
}
void Mixer::render(int16_t* out,int frames,const MixState& m){
    while(frames>0){
        int count=std::min(frames,blockSize);
        renderBlock(out,count,m);out+=2*count;frames-=count;
    }
}
void Mixer::renderBlock(int16_t* out,int frames,const MixState& m){
    std::array<float,blockSize> dryL{},dryR{},wet{};
    for(auto& v:voices){if(!v.pcm)continue;V pos=v.e.pos;
        if(v.e.sound==Sound::Voice&&v.e.speaker>=Speaker::Cole&&v.e.speaker<=Speaker::Bell)pos=m.crew[int(v.e.speaker)-1];
        auto path=acousticPath(m.listener,m.yaw,m.room,pos,v.e.bus,m.door,m.recording);
        if(v.at==0 && v.e.bus!=Bus::Radio){
            const float transient=v.e.sound==Sound::Blast?1.25f:v.e.sound==Sound::Round?1.f:v.e.sound==Sound::Gate?.55f:0.f;
            const float received=std::hypot(path.left,path.right)*v.e.gain;
            const float roomGain=m.room==Zone::Yard?.76f:1.f;
            const float brightness=.55f+.45f*std::sqrt(path.cutoff/14500.f);
            overload=std::max(overload,clamp((transient*received*roomGain*brightness-.065f)/.78f));
        }
        float alpha=1-std::exp(-2*pi*path.cutoff/rate);
        for(int i=0;i<frames&&v.pcm;i++){
            float s=(*v.pcm)[v.at++];v.history+=alpha*(s-v.history);s=v.history;
            if(v.e.bus==Bus::Radio){v.slow+=.051f*(s-v.slow);s=(s-v.slow)*1.8f+noise()*.009f;}
            s*=v.e.gain;dryL[i]+=s*path.left;dryR[i]+=s*path.right;wet[i]+=s*(path.left+path.right)*path.send;
            if(v.at>=v.pcm->size())v.pcm=nullptr;
        }
    }
    float wetFeedback=m.room==Zone::Yard?.13f:m.room==Zone::Kennels?.58f:.40f;
    const float release=1.f/(rate*std::max(.1f,m.recoverySeconds));
    for(int i=0;i<frames;i++,clock++,wi++){
        float n=noise();wind+=.009f*(n-wind);prevNoise+=.10f*(n-prevNoise);
        phase+=2*pi*24/rate;if(phase>2*pi)phase-=2*pi;heart+= (1.05f+.72f*m.stress)/rate;if(heart>=1)heart-=1;
        float bed=0;
        if(m.active){
            float thump=std::exp(-42*heart)+.50f*std::exp(-55*std::abs(heart-.16f));
            bed=wind*(.038f+.16f*m.pace+.11f*m.turn)+thump*std::sin(heart*154)*m.stress*.088f;
            bed+=m.engine*(.032f*std::sin(phase*2)+.014f*std::sin(phase*4)+.087f*wind+.023f*prevNoise);
            if(m.room!=Zone::Yard)bed+=.011f*std::sin((clock%48000)*2*pi*60/rate);
        }
        size_t l=wi%delayL.size(),r=wi%delayR.size();float echoL=delayL[l],echoR=delayR[r];
        delayL[l]=wet[i]+wetFeedback*(.58f*echoL+.42f*echoR);delayR[r]=wet[i]*.87f+wetFeedback*(.69f*echoL+.31f*echoR);
        float L=dryL[i]+bed+echoL,R=dryR[i]+bed+echoR;
        float peak=std::max(std::abs(L),std::abs(R));
        outputPeak+=(peak>outputPeak?.042f:.00018f)*(peak-outputPeak);
        float gain=1/(1+(m.night?2.9f:1.65f)*std::max(0.f,outputPeak-.30f));
        // One response at Reed's chest. Its short attack lets the initial crack through.
        muffling+=(overload-muffling)*.0019f;
        float response=clamp(muffling);
        float drive=1.7f*overload;
        L=L/(1+drive*std::abs(L));R=R/(1+drive*std::abs(R));
        float coeff=(.81f-.48f*clamp(m.impact))*(1-.87f*response);
        filterL+=coeff*(L-filterL);filterR+=coeff*(R-filterR);
        auto final=[&](float x){float y=x*gain*(m.night?1.25f:1.40f);return int16_t(y/(1+std::abs(y))*.89f*m.volume*32767);};
        ringPhase+=2*pi*1910/rate;if(ringPhase>2*pi)ringPhase-=2*pi;
        float ringTone=.008f*response*response*std::sin(ringPhase);
        float roomLevel=1-.24f*response;
        out[i*2]=final(roomLevel*filterL+ringTone);out[i*2+1]=final(roomLevel*filterR+ringTone);
        overload=std::max(0.f,overload-release);
    }
}
}
