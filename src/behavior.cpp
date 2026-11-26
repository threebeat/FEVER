#include "behavior.hpp"
#include <fstream>
#include <sstream>
#include <queue>
#include <limits>
namespace fever {
bool loadTuning(const std::string& path,Tuning& out){
    std::ifstream f(path);if(!f)return false;Tuning tmp;
    struct Key{const char* id;float Tuning::*field;float lo,hi;};
    const Key keys[]={{"squad.wait_metres",&Tuning::wait,3,14},{"squad.resume_metres",&Tuning::resume,1,9},{"squad.catchup_metres",&Tuning::catchup,2,12},
      {"squad.catchup_speed",&Tuning::run,2.5f,6},{"squad.inspect_seconds",&Tuning::inspect,1,9},{"host.speed",&Tuning::hostSpeed,.7f,3.5f},
      {"kennel.reach",&Tuning::reach,3,9},{"camera.spring_hz",&Tuning::spring,4,13},{"camera.fov_degrees",&Tuning::fov,90,115},{"optics.distortion",&Tuning::warp,0,.09f},{"audio.overload_recovery_seconds",&Tuning::ring,.1f,2}};
    std::string line;uint32_t mask=0;
    while(std::getline(f,line)){auto comment=line.find('#');if(comment!=line.npos)line.erase(comment);
        std::istringstream r(line);std::string name,op,junk;float v;if(!(r>>name))continue;
        if(!(r>>op>>v)||op!="="||(r>>junk)||!std::isfinite(v))return false;
        size_t i=0;for(;i<std::size(keys);i++)if(name==keys[i].id)break;
        if(i==std::size(keys)||(mask&(1u<<i))||v<keys[i].lo||v>keys[i].hi)return false;
        mask|=1u<<i;tmp.*keys[i].field=v;
    }
    if(mask!=(1u<<std::size(keys))-1||tmp.resume>=tmp.wait)return false;out=tmp;return true;
}
namespace {
bool clearPath(const Game& g,V from,V goal){
    if(!g.passable(goal))return false;
    V delta=flat(goal-from);float distance=len(delta);if(distance<.012f)return true;
    V dir=delta*(1.f/distance);from.y=0;
    for(const auto& body:g.solids){
        Box swept={{body.low.x-.23f,-1,body.low.z-.23f},{body.high.x+.23f,1,body.high.z+.23f}};
        if(rayBox(from,dir,swept)<distance)return false;
    }
    return g.door>=.82f || (from.z<-.42f&&goal.z<-.42f) || (from.z>.42f&&goal.z>.42f);

}
constexpr float cell=.58f;constexpr int nx=31,nz=115,total=nx*nz;
int indexOf(V p){int x=int(std::lround((p.x+8.7f)/cell)),z=int(std::lround((p.z+15.3f)/cell));return std::clamp(z,0,nz-1)*nx+std::clamp(x,0,nx-1);}
V point(int i){return {-8.7f+(i%nx)*cell,0,-15.3f+(i/nx)*cell};}
std::vector<V> route(const Game& g,V from,V goal){
    // Sparse replans. A direct walk across a room never opens a search.
    std::array<float,total> cost;cost.fill(1e9f);std::array<int,total> prev;prev.fill(-1);
    auto h=[&](int id){return len(flat(point(id)-goal));};
    int start=indexOf(from),end=indexOf(goal),best=start;cost[start]=0;
    using Entry=std::pair<float,int>;std::priority_queue<Entry,std::vector<Entry>,std::greater<Entry>> open;open.push({h(start),start});
    const int offsets[]={-1,1,-nx,nx};
    while(!open.empty()){auto v=open.top();open.pop();int i=v.second;if(i==end){best=i;break;}
        if(v.first>cost[i]+h(i)+.001f)continue;if(h(i)<h(best))best=i;
        for(int d:offsets){int j=i+d;if(j<0||j>=total||std::abs((j%nx)-(i%nx))>1)continue;
            float c=cost[i]+cell;if(c>=cost[j]||!g.passable(point(j))||!clearPath(g,point(i),point(j)))continue;
            cost[j]=c;prev[j]=i;open.push({c+h(j),j});}
    }
    std::vector<V> path;for(int i=best;i!=start&&i>=0;i=prev[i])path.push_back(point(i));std::reverse(path.begin(),path.end());return path;
}
struct Landmark {V stand,look;};
const Landmark interests[]={
    {{-2.13f,0,5.1f},{-3.6f,1.1f,5.6f}},{{-.91f,0,15.65f},{-3.1f,.45f,15.4f}},
    {{1.12f,0,18.45f},{3.3f,1.6f,18.7f}},{{1.09f,0,36.4f},{2.05f,1.6f,39}}};
}
V steer(const Game& g,V from,V goal,Brain& b,float dt){
    b.repath-=dt;
    if(clearPath(g,from,goal)){b.path.clear();return goal;}
    if(b.repath<=0&&(b.path.empty()||len(flat(goal-b.routeGoal))>1.1f)){
        b.path=route(g,from,goal);b.routeGoal=goal;b.repath=.49f;
    }
    while(!b.path.empty()&&len(flat(b.path.front()-from))<.07f)b.path.erase(b.path.begin());
    if(b.path.empty())return from;
    size_t skip=0;for(size_t i=1;i<b.path.size()&&i<5;i++){if(!clearPath(g,from,b.path[i]))break;skip=i;}
    if(skip)b.path.erase(b.path.begin(),b.path.begin()+skip);
    return b.path.front();
}
void updatePatrol(Game& g,float dt){
    auto& a=g.crew.front();auto& b=a.brain;const auto& t=g.tuning;V look=forward(a.yaw);constexpr float lane=-.78f;
    bool fight=g.stage==Stage::Lash||g.stage==Stage::Exposure;float sep=len(flat(a.pos-g.pos));
    b.think-=dt;b.watch=std::max(0.f,b.watch-dt);a.stun=std::max(0.f,a.stun-dt);
    if(a.stun>0){a.pace=mix(a.pace,0,decay(10,dt));b.task=Task::Stagger;return;}
    bool treatment=g.stage==Stage::Examination;
    if(fight||treatment||g.stage==Stage::Apron||b.think<=0){
        b.think=.24f;
        if(fight){
            b.task=Task::Defend;
            b.point=g.stage==Stage::Lash?V{lane,0,clamp(g.pos.z+.9f,20,27)}:V{-1.46f,0,42.2f};
        }else if(treatment){b.task=Task::Treat;b.point=Game::patient()+V{-.66f,0,-.5f};}
        else if(g.stage==Stage::Apron&&!g.interlock){
            b.task=Task::Open;b.point={1.03f,0,-.67f};
        }else if(g.stage>=Stage::Examination){
            b.task=Task::Observe;b.point={-.77f,0,42.6f};
        }else{
            bool behind=g.pos.z>a.pos.z+t.catchup||(std::abs(g.pos.x-a.pos.x)>5&&sep>t.catchup+2);
            bool wait=a.pos.z>g.pos.z+1 && (sep>t.wait||(b.task==Task::Wait&&sep>t.resume));
            if(behind||(b.task==Task::CatchUp&&g.pos.z>a.pos.z+2.25f)){
                b.task=Task::CatchUp;b.point={g.pos.x+lane,0,g.pos.z-.92f};
            }else if(wait){
                if(b.task!=Task::Wait)b.point=a.pos;b.task=Task::Wait;
            }else{
                if(b.interest>=0&&b.watch==0&&len(flat(a.pos-interests[b.interest].stand))<.48f){
                    b.visited|=1u<<b.interest;b.interest=-1;
                }
                if(b.interest<0){
                    for(int j=0;j<int(std::size(interests));j++){const auto& mark=interests[j];
                        if((b.visited&(1u<<j))||std::abs(mark.stand.z-g.pos.z)>5.7f||len(flat(a.pos-mark.stand))>6.5f)continue;
                        b.interest=j;b.watch=t.inspect+len(flat(a.pos-mark.stand))/1.4f;break;}
                }
                if(b.interest>=0){b.task=Task::Inspect;b.point=interests[b.interest].stand;}
                else{b.task=Task::Advance;
                    float end=g.stage==Stage::Apron?8.8f:g.stage==Stage::Reception?20.5f:g.stage==Stage::Kennels?25.f:45.f;
                    b.point={lane,0,std::min(end,std::max(a.pos.z,g.pos.z+t.wait+.85f))};}
            }
        }
    }
    if(!g.passable(b.point)){b.point.x=b.point.z>37&&b.point.z<40?1.3f:lane;}
    V wp=steer(g,a.pos,b.point,b,dt),delta=flat(wp-a.pos);float remaining=len(delta);
    float speed=b.task==Task::CatchUp?t.run:b.task==Task::Treat?2.65f:1.48f;
    V old=a.pos;V desired=remaining>.06f?norm(delta)*std::min(speed,remaining/std::max(dt,.0001f)):V{};
    a.velocity=lerp(a.velocity,desired,decay(8,dt));V nx=a.pos+V{a.velocity.x*dt,0,0};if(g.passable(nx))a.pos=nx;
    V nz=a.pos+V{0,0,a.velocity.z*dt};if(g.passable(nz))a.pos=nz;
    float distance=len(flat(a.pos-old));a.pace=mix(a.pace,clamp(distance/dt/1.4f),decay(8,dt));
    float previous=a.stride;a.stride+=distance*4.0f;
    if(int(previous/pi)!=int(a.stride/pi))g.emit(Sound::Footfall,a.pos,Bus::World,.36f);
    if(fight)look=(g.stage==Stage::Lash?g.dog():g.host)-a.pos;
    else if(treatment)look=g.patient()-a.pos;
    else if(b.task==Task::Inspect&&remaining<.7f)look=interests[b.interest].look-a.pos;
    else if(b.task==Task::Wait){look=std::sin(g.time*.58f)>.24f?g.pos-a.pos:V{std::sin(g.time*.54f),0,1};}
    else if(remaining>.18f)look=delta;
    a.yaw+=wrap(std::atan2(look.x,look.z)-a.yaw)*decay(5.6f,dt);
    if(fight){
        b.fireTimer-=dt;bool eligible=g.stage==Stage::Lash?(g.age>1.55f&&g.lashAmount>.34f&&g.lashHP>0):(g.age>5.3f&&g.hostHP>0);
        if(eligible&&b.fireTimer<=0){g.shoot(true,0);b.fireTimer=g.stage==Stage::Lash?.95f:1.45f;}
    }
}
void advanceHost(Game& g,float dt){
    auto& brain=g.hostBrain;brain.think-=dt;brain.memory=std::max(0.f,brain.memory-dt);
    if(brain.think<=0){
        brain.think=.23f;V selected=brain.memory>0?brain.remembered:g.host;float best=1000;brain.target=-2;
        for(int k=-1;k<int(g.crew.size());++k){
            V target=k<0?g.pos:g.crew[k].pos;if(k>=0&&g.crew[k].stun>0)continue;
            V o=g.host+V{0,1.13f,0},d=target+V{0,1.15f,0}-o;float dist=len(d);
            bool sight=g.wallDistance(o,norm(d))>=dist-.23f;
            if(!sight)continue;float score=dist+(k<0?-1.4f:0);
            if(score<best){best=score;selected=target;brain.target=k;}
        }brain.point=selected;if(brain.target!=-2){brain.remembered=selected;brain.memory=2.5f;}
    }
    float distance=len(flat(brain.point-g.host));
    if(distance>1.06f){V waypoint=steer(g,g.host,brain.point,brain,dt);
        auto vel=norm(flat(waypoint-g.host))*(g.tuning.hostSpeed*(1-.60f*g.hostFlinch));
        g.hostVelocity=lerp(g.hostVelocity,vel,decay(6,dt));V next=g.host+g.hostVelocity*dt;if(g.passable(next))g.host=next;
    }
    g.attackTimer-=dt;if(brain.target!=-2&&distance<1.42f&&g.attackTimer<=0){g.emit(Sound::Host,g.host);
        if(brain.target<0){g.hp-=18;g.damageFlash=1;g.impact=.85f;}
        else{g.crew[brain.target].stun=2.8f;g.emit(Sound::Drop,g.crew[brain.target].pos);}
        g.attackTimer=1.5f;
    }
}
}
