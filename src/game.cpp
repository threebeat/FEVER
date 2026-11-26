#include "game.hpp"
#include "behavior.hpp"
#include "audio.hpp"
#include "night.hpp"
#include <fstream>
#include <sstream>
namespace fever {
namespace {
std::string trim(std::string s){auto a=s.find_first_not_of(" \r\t"),b=s.find_last_not_of(" \r\t");return a==s.npos?"":s.substr(a,b-a+1);}
const std::array<V,3> lanes={V{-.85f,0,0},V{.75f,0,0},V{-.05f,0,0}};
}
std::vector<Cue> readScript(const std::string& path){
    std::ifstream f(path);std::string row;std::vector<Cue> out;
    while(std::getline(f,row)){
        if(row.size()<7||row.rfind("| ",0)!=0||row.find('_')!=4)continue;
        std::istringstream stream(row.substr(1));std::vector<std::string> v;std::string part;
        while(std::getline(stream,part,'|'))v.push_back(trim(part));
        if(v.size()!=7)continue;
        Speaker who=Speaker::Dispatch;for(int i=0;i<5;i++)if(v[1]==name(Speaker(i)))who=Speaker(i);
        if(v[1]=="ROY"||v[1]=="BLAKE")who=Speaker::Cole;
        if(v[1]=="PARK")who=Speaker::Ives;
        if(v[1]=="LANDRY"||v[1]=="SHAW")who=Speaker::Player;
        out.push_back({v[0],v[5],v[6],who,v[2]=="radio"?Bus::Radio:Bus::World,std::stof(v[3]),std::stoi(v[4])});
    }
    return out;
}
Game::Game(std::vector<Cue> lines):script(std::move(lines)){
    auto wall=[&](float x1,float z1,float x2,float z2){solids.push_back({{x1,0,z1},{x2,3.45f,z2}});};
    
    wall(-9,0,-1.5f,.19f);wall(1.5f,0,9,.19f);
    wall(-5.3f,0,-5.12f,11);wall(5.12f,0,5.3f,11);
    wall(-6.15f,10.9f,-1.35f,11.1f);wall(1.5f,10.9f,6.15f,11.1f);
    wall(-6.3f,11,-6.12f,39);wall(6.12f,11,6.3f,39);
    wall(-6.15f,38.9f,-.15f,39.1f);wall(2.88f,38.9f,6.15f,39.1f);
    wall(-5.9f,39,-5.72f,51);wall(5.72f,39,5.9f,51);wall(-5.9f,51,-1.15f,51.2f);wall(1.15f,51,5.9f,51.2f);
    // Banks have solid plinths but the open bars allow the lash and fired shots through.
    for(float z:{13.f,16.7f,20.4f,24.1f,27.8f,31.5f}){
        for(float x:{-6.f,2.02f})solids.push_back({{x,0,z},{x+3.98f,.30f,z+3.45f}});
    }
    solids.push_back({{-4.95f,0,3.4f},{-2.75f,.98f,7.85f}});
    solids.push_back({{3.85f,0,45.5f},{5.5f,1.03f,49.4f}});
    animalSolids=solids;restart();
}
void Game::restart(Stage checkpoint){start(recording,checkpoint);}
void Game::start(Recording r,Stage checkpoint,int savedBeat){
    recording=r;beat=selection=plateHits=greyHits=0;tetherActor=-1;beatAge=fieldTime=aggro=phaseOut=watched=tether=viewKick=fireBuffer=slide=runGrace=blast=0;
    plates={};ejectIn=-1;projectile=dragged=uv=cellarKey=false;buildCall();
    loadout={Weapon::Auto,Weapon::Pistol,Weapon::Knife};
    if(r==Recording::House)loadout={Weapon::Pistol,Weapon::Semi,Weapon::Knife};
    if(r==Recording::Grey)loadout={Weapon::Hunting,Weapon::Pistol,Weapon::Knife};
    body={};idleTime=sprintWeight=0;reloadSeated=reloadEmpty=false;particles.clear();hostBrain={};hostVelocity={};hostFlinch=0;
    time=age=stageStart=0;stage=Stage::Flight;pos={0,0,-10};host=patient();lashTarget={};velocity={};
    yaw=pitch=camYaw=camPitch=camRoll=armsYaw=armsPitch=equipLower=aim=duck=height=vertical=0;
    hp=100;stress=kick=flash=shotDelay=reloadTime=stepClock=turnRate=pace=0;
    allyTimer=enemyTimer=attackTimer=lashAmount=impact=exposure=damageFlash=0;hostHP=8;lashHP=7;
    patientSeen=hitOnce=playerShotLash=interlock=wasFiring=false;door=0;torch=true;shots=crewShots=slot=0;
    for(int i=0;i<2;i++){mag[i]=spec(loadout[i]).capacity;reserve[i]=mag[i]*4;}queue.clear();events.clear();spoken.clear();marks.clear();subtitle={};captionGap=0;
    for(int i=0;i<3;i++){crew[i]={};crew[i].pos=lanes[i]+V{0,0,-7.6f-i*.75f};}
    if(r==Recording::Animal&&(checkpoint==Stage::Kennels||checkpoint==Stage::Recovery||checkpoint==Stage::Report)){
        door=1;stage=checkpoint;time=checkpoint==Stage::Kennels?40:checkpoint==Stage::Recovery?85:140;
        pos={.4f,0,checkpoint==Stage::Kennels?12.1f:checkpoint==Stage::Recovery?32.8f:42.2f};
        for(int i=0;i<3;i++)crew[i].pos=V{0,0,pos.z+1.2f-i*.9f}+lanes[i];
        if(stage==Stage::Report){host={1,0,44};hostHP=0;crew[1].pos=host;say("MI_013");}
    }else if(checkpoint!=Stage::Flight){stage=Stage::Apron;door=r==Recording::House?0:1;pos={0,0,-8.5f};}
    if(r==Recording::House&&savedBeat>0){beat=savedBeat;door=1;cellarKey=beat>=4;pos=beat==1?V{0,0,4}:beat==2?V{0,0,13}:beat==3?V{3.6f,0,15}:beat==4?V{0,0,18}:V{0,-3,28};}
    if(r==Recording::Grey&&savedBeat>0){beat=std::min(2,savedBeat);pos=beat==1?V{0,0,6}:V{0,0,20};fieldTime=25;aggro=.2f;}
    if(r==Recording::Range)choose(0);
    if(r!=Recording::Animal)for(int i=0;i<3;i++)crew[i].pos=pos+V{-1.f+i,0,1.25f};
    if(stage==Stage::Flight)emit(Sound::Boot,pos,Bus::Body);
    body.update(pos,yaw,0,0,false,1.f/90);
    camera=pos+V{0,1.42f,0};for(auto& s:mount)s={};
    mount[0].x=camera.x;mount[1].x=camera.y;mount[2].x=camera.z;handPitch={};handYaw={};
}
Zone Game::room()const{
    if(stage==Stage::Flight)return Zone::Cabin;
    if(recording==Recording::Animal)return pos.z<51?zone(pos):Zone::Yard;
    if(recording==Recording::House)return pos.z<0?Zone::Yard:pos.y<-.3f?Zone::Isolation:Zone::Intake;
    if(recording==Recording::Grey)return rect(pos,0,14.5f,8,9)?Zone::Intake:Zone::Yard;return Zone::Kennels;
}
V Game::source(Speaker s)const{if(s==Speaker::Cole||s==Speaker::Ives||s==Speaker::Bell)return crew[int(s)-1].pos+V{0,1.55f,0};return camera;}
void Game::emit(Sound s,V p,Bus b,float gain){
    if(stage==Stage::Exposure && b!=Bus::Radio && (s==Sound::Round||s==Sound::Footfall||s==Sound::Step)){
        V listener=host+V{0,1.0f,0};auto sound=acousticPath(listener,0,zone(host),p,Bus::World,door);
        float received=std::hypot(sound.left,sound.right)*gain*(s==Sound::Round?1.f:.35f);
        if(received>.12f){hostBrain.remembered=p;hostBrain.memory=1.f+3.f*clamp(received);}
    }
    events.push_back({s,p,b,gain,Speaker::Player,{}});}
void Game::say(const std::string& id){
    if(std::find(spoken.begin(),spoken.end(),id)!=spoken.end())return;
    auto cue=[&](const std::string& k)->const Cue*{for(auto& l:script)if(l.id==k)return &l;return nullptr;};
    auto c=cue(id);if(!c)return;spoken.push_back(id);
    if(c->priority>=3){
        queue.erase(std::remove_if(queue.begin(),queue.end(),[&](const auto& k){return cue(k)->priority==1;}),queue.end());
        if(c->priority==4&&captionPriority<4){subtitle.left=0;captionGap=0;queue.push_front(id);return;}
    }
    queue.push_back(id);
}
void Game::tickScript(float dt){
    subtitle.left=std::max(0.f,subtitle.left-dt);
    if(subtitle.left>0)return;
    captionGap-=dt;if(queue.empty()||captionGap>0)return;
    const auto id=queue.front();queue.pop_front();
    for(const auto& l:script)if(l.id==id){
        subtitle={id,l.text,l.speaker,l.duration};captionGap=.24f;captionPriority=l.priority;
        events.push_back({Sound::Voice,source(l.speaker),l.bus,1,l.speaker,id});break;
    }
}
void Game::enter(Stage next){
    stage=next;age=0;stageStart=time;allyTimer=enemyTimer=attackTimer=0;
    if(recording!=Recording::Animal){if(next==Stage::Lost){queue.clear();subtitle={};emit(Sound::Drop,camera,Bus::Body);}return;}
    switch(next){
    case Stage::Apron:say("MI_003");break;
    case Stage::Reception:say("MI_005");break;
    case Stage::Kennels:say("MI_006");break;
    case Stage::Lash:lashTarget=camera;say("MI_007");emit(Sound::Gate,dog());particles.burst(dog(),{1,.3f,0},Matter::Steel,14);emit(Sound::Lash,dog());impact=.18f;break;
    case Stage::Recovery:say("MI_008");break;
    case Stage::Examination:say("MI_009");break;
    case Stage::Exposure:say("MI_011");host=crew[1].pos;particles.burst(host+V{0,.9f,0},{.3f,1,.2f},Matter::Fluid,17);emit(Sound::Drop,host);break;
    case Stage::Report:crew[1].pos=host;say("MI_013");particles.burst(host+V{0,.9f,0},{.3f,1,.2f},Matter::Fluid,17);emit(Sound::Drop,host);break;
    case Stage::Filed:say("MI_017");break;
    case Stage::Lost:queue.clear();subtitle={};emit(Sound::Drop,camera,Bus::Body);break;
    default:break;
    }
}
float Game::wallDistance(V o,V d)const{
    float t=75;for(auto b:solids)t=std::min(t,rayBox(o,d,b));
    if((recording==Recording::Animal||recording==Recording::House)&&door<.82f)t=std::min(t,rayBox(o,d,{{-1.5f,0,-.06f},{1.5f,2.7f,.1f}}));
    if(recording==Recording::House&&beat<5)t=std::min(t,rayBox(o,d,{{-1.3f,0,19.9f},{1.3f,2.7f,20.08f}}));
    if(recording==Recording::Range)t=std::min(t,rayBox(o,d,{{-7,0,34.45f},{7,5,35}}));
    if(std::abs(d.y)>.0001f){float floor=ground(o),q=(floor-o.y)/d.y;if(q>0)t=std::min(t,q);
        q=(floor+3.45f-o.y)/d.y;if(q>0&&((recording==Recording::House&&o.z>0)||(recording==Recording::Animal&&o.z+d.z*q>0&&o.z+d.z*q<51)))t=std::min(t,q);}
    return t;
}
V Game::lashPoint(float t)const{
    V anchor=dog(),tip=lerp(anchor,lashTarget,lashAmount);
    V p=lerp(anchor,tip,t);
    float wave=std::sin(t*pi)*(.26f+.55f*lashAmount);
    p.y+=wave*(.55f+.35f*std::sin(t*8-time*11));p.z+=wave*std::sin(t*7+time*8);
    return p;
}
V Game::aimRay()const{return forward(yaw,pitch);}
void Game::shoot(bool ally,int index){
    V o=ally?crew[index].pos+V{0,1.30f,0}:camera;
    V target=stage==Stage::Lash?lashPoint(.60f):host+V{0,1.15f,0};
    V d=ally?norm(target-o):forward(yaw,pitch+viewKick);float wall=wallDistance(o,d);
    if(ally&&len(target-o)>wall+.15f)return;
    bool knife=!ally&&slot==2;float distance=knife?std::min(wall,1.75f):wall;
    if(!ally&&!knife){if(mag[slot]<=0)return;--mag[slot];++shots;}
    if(ally){crew[index].shot=.14f;++crewShots;}
    else{
        shotDelay=handling().delay;kick=handling().kick;impact=knife?.11f:.26f;flash=knife?0:1;lastShot=muzzle();
        if(!knife){viewKick=std::min(.07f,viewKick+.019f*handling().kick);particles.discharge(lastShot,d,handling().kick);
            if(handling().bolt)ejectIn=shotDelay*.45f;else if(weapon()!=Weapon::Launcher)particles.eject(camera+right(yaw)*.17f+d*.39f+V{0,-.16f,0},right(yaw),ground(pos),false);}
    }
    emit(knife?Sound::Cloth:Sound::Round,o,ally?Bus::World:Bus::Body,ally?.76f:1);
    if(!ally&&weapon()==Weapon::Launcher){projectile=true;projectilePos=lastShot;projectileVelocity=d*19.f+V{0,1,0};return;}
    bool hit=!ally&&fieldHit(o,d,distance,handling().damage);
    if(stage==Stage::Lash&&lashAmount>.12f){
        float near=raySphere(o,d,dog(),.59f);
        for(int i=1;i<=18;i++)near=std::min(near,raySphere(o,d,lashPoint(i/18.f),.18f));
        if(near<=distance){lashHP-=ally?1.f:2.4f;hit=true;distance=near;playerShotLash|=!ally;emit(Sound::Strike,o+d*near);particles.burst(o+d*near,d*-1,Matter::Fluid,10);}
    }
    if(stage==Stage::Exposure&&age>2.3f&&hostHP>0){
        float near=std::min(raySphere(o,d,host+V{0,1.02f,0},.46f),raySphere(o,d,host+V{0,1.58f,0},.26f));
        if(near<=distance){hostFlinch=1;hostHP-=ally?.85f:slot==2?2.6f:2.f;hit=true;distance=near;emit(Sound::Strike,o+d*near);particles.burst(o+d*near,d*-1,Matter::Fluid,10);}
    }
    if(!ally){lastImpact=o+d*distance;if(distance<65&&!hit){Matter m=std::abs(lastImpact.y)<.1f?Matter::Concrete:(zone(lastImpact)==Zone::Kennels||lastImpact.y<1.08f?Matter::Steel:Matter::Concrete);particles.burst(lastImpact-d*.04f,d*-1,m);marks.push_back({lastImpact-d*.035f,d*-1,time});if(marks.size()>28)marks.erase(marks.begin());emit(Sound::Strike,lastImpact,Bus::World,.46f);}}
}
bool Game::canReport()const{return recording==Recording::Animal&&stage==Stage::Report&&len(flat(pos-V{1,0,66}))<4.7f;}
void Game::moveCrew(float dt){
    if(stage==Stage::Flight)return;
    if(recording!=Recording::Animal||stage==Stage::Report){fieldCrew(dt);return;}
    for(int i=0;i<3;i++){
        auto& a=crew[i];a.shot=std::max(0.f,a.shot-dt);
        if(i==1&&stage>=Stage::Exposure)continue;
        updatePatrol(*this,i,dt);
    }
}
void Game::refreshCamera(const Input& in,const Prefs& prefs,float dt){
    float amount=prefs.steady?0:1;
    V base=pos+V{0,1.43f-duck*.55f+height,0};
    if(stage==Stage::Flight){
        base=vehicle()+V{-.35f-1.13f*smooth(13.0f,14.8f,age),1.15f+.35f*smooth(13.7f,14.85f,age)+amount*.009f*std::sin(time*19),-.12f};
    }
    if(recording==Recording::Grey&&tether>0&&tetherActor==-1)base.y+=(prefs.steady?.13f:.52f)*std::sin(pi*clamp(tether/1.2f));
    base=base+forward(body.yaw)*.19f+right(yaw)*(amount*(.015f*std::sin(stepClock)*pace+.045f));
    base.y+=amount*(pace*.024f*std::sin(stepClock*2)+.004f*std::sin(time*2.2f));
    float frequency=prefs.steady?18:tuning.spring;
    mount[0].follow(base.x,frequency,dt);mount[1].follow(base.y,frequency,dt);mount[2].follow(base.z,frequency,dt);
    mount[3].follow(yaw,frequency+(aim*7),dt);mount[4].follow(pitch,frequency+aim*7,dt);
    float bank=amount*(-std::min(.04f,std::max(-.04f,in.dx*.13f))-.022f*dot(velocity,right(yaw))+.013f*std::sin(stepClock)*pace+.026f*impact);
    mount[5].follow(bank,4.1f,dt);
    camera={mount[0].x,mount[1].x,mount[2].x};camYaw=yaw+clamp(mount[3].x-yaw,-.12f,.12f)*amount;
    camPitch=pitch+viewKick+clamp(mount[4].x-pitch,-.105f,.105f)*amount;camRoll=mount[5].x;
    handYaw.follow(yaw,9,dt);handPitch.follow(pitch,9,dt);armsYaw=yaw+clamp(wrap(handYaw.x-yaw)*.34f,-.17f,.17f)*(1-aim);armsPitch=pitch+clamp((handPitch.x-pitch)*.34f,-.13f,.13f)*(1-aim);
}
void Game::tick(const Input& in,const Prefs& prefs,float dt){
    if(!(dt>0))return;
    time+=dt;age+=dt;particles.update(dt);hostFlinch=std::max(0.f,hostFlinch-dt*3.4f);tickScript(dt);
    if(stage==Stage::Lost)return;
    if(stage==Stage::Filed){if(recording==Recording::Animal&&age>4.5f)say("MI_015");return;}
    if(stage==Stage::Flight){patrolTick(in,prefs,dt);return;}
    yaw+=in.dx;pitch=clamp(pitch+in.dy,-1.49f,1.32f);
    turnRate=mix(turnRate,std::min(5.f,std::abs(in.dx)/dt),decay(5,dt));
    if(in.light)torch=!torch;if(in.uv&&recording==Recording::Grey)uv=!uv;
    equipLower*=std::exp(-18*dt);
    if(recording==Recording::Range&&in.cycle)choose(selection+in.cycle);
    if(recording!=Recording::Range&&(in.weapon>=0||in.cycle)){int next=in.weapon>=0&&recording!=Recording::Range?in.weapon:(slot+in.cycle+3)%3;if(next>=0&&next<3&&next!=slot){slot=next;ejectIn=-1;fireBuffer=0;reloadTime=0;reloadSeated=false;equipLower=1;shotDelay=0;emit(Sound::Cloth,camera,Bus::Body);}}
    aim=mix(aim,in.aim?1:0,decay(26,dt));duck=mix(duck,in.crouch?1:0,decay(12,dt));
    viewKick*=std::exp(-12*dt);blast=std::max(0.f,blast-dt*3);grenadeTick(dt);
    if(ejectIn>=0){ejectIn-=dt;if(ejectIn<0){particles.eject(camera+right(yaw)*.17f+aimRay()*.44f+V{0,-.14f,0},right(yaw),ground(pos),false);emit(Sound::Latch,camera,Bus::Body,.46f);}}
    kick=std::max(0.f,kick-5.8f*dt);flash=std::max(0.f,flash-14*dt);impact*=std::exp(-8*dt);damageFlash=std::max(0.f,damageFlash-dt*2);
    shotDelay=std::max(0.f,shotDelay-dt);
    if(reloadTime>0){
        reloadTime=std::max(0.f,reloadTime-dt);
        float phase=1-reloadTime/reloadDuration;
        if(!reloadSeated && phase>=(slot==0?.69f:.63f)){
            int n=std::min(handling().capacity-mag[slot],reserve[slot]);
            mag[slot]+=n;reserve[slot]-=n;reloadSeated=true;if(weapon()==Weapon::Launcher)particles.eject(camera+right(yaw)*.15f+aimRay()*.44f+V{0,-.18f,0},right(yaw),ground(pos),true);emit(Sound::Seat,camera,Bus::Body,slot==0?.72f:.55f);
        }
        if(reloadTime==0&&reloadEmpty)emit(Sound::Latch,camera,Bus::Body,.60f);
    }
    if(in.reload&&slot<2&&mag[slot]<handling().capacity&&reserve[slot]>0&&reloadTime==0){reloadEmpty=mag[slot]==0;reloadSeated=false;reloadDuration=handling().reload+(reloadEmpty?.30f:0.f);reloadTime=reloadDuration;emit(Sound::Reload,camera,Bus::Body);}
    if(stage!=Stage::Flight){
        bool run=in.sprint&&in.walk>.18f&&!in.aim&&!in.fire&&!in.crouch;
        if(run)runGrace=.18f;else runGrace=std::max(0.f,runGrace-dt);
        if(in.crouch&&runGrace>0&&len(velocity)>3){slide=.48f;runGrace=0;}
        slide=std::max(0.f,slide-dt);if(!in.crouch||in.aim||in.jump)slide=0;
        float speed=in.crouch?1.15f:in.aim?1.72f:run?4.85f:2.48f;
        V target=forward(yaw)*in.walk+right(yaw)*in.strafe;
        if(len(target)>1)target=norm(target);
        velocity=slide>0?velocity*std::exp(-1.75f*dt):lerp(velocity,target*speed,decay(len(target)>.05f?(dot(velocity,target)<-.3f?18.f:11.f):18.f,dt));
        for(int k=0;k<2;k++){V dest=pos;if(k==0)dest.x+=velocity.x*dt;else dest.z+=velocity.z*dt;if(passable(dest)){pos=dest;pos.y=ground(pos);}}
        if(in.jump&&height<=0){vertical=3.30f;emit(Sound::Cloth,camera,Bus::Body,.6f);}
        if(vertical||height){height+=vertical*dt;vertical-=9.8f*dt;if(height<=0){height=vertical=0;impact=.48f;mount[1].v-=.69f;emit(Sound::Drop,pos,Bus::Body,.54f);}}
        pace=clamp(len(velocity)/2.5f);float old=stepClock;stepClock+=len(velocity)*dt*2.55f;
        if(height==0&&int(old/pi)!=int(stepClock/pi)){emit(recording==Recording::Grey&&room()==Zone::Yard?Sound::Snow:Sound::Step,pos,Bus::Body,.48f+.22f*pace);emit(Sound::Cloth,pos,Bus::Body,.34f);}
    }
    body.update(pos,yaw,duck,height,false,dt);
    const bool busy=std::abs(in.dx)+std::abs(in.dy)>.035f||pace>.10f||in.aim||in.fire||reloadTime>0||equipLower>.12f;
    idleTime=busy?0:idleTime+dt;
    sprintWeight=mix(sprintWeight,in.sprint&&in.walk>.18f&&pace>.65f&&!in.aim&&!in.fire&&reloadTime==0?1.f:0.f,decay(9,dt));
    refreshCamera(in,prefs,dt);moveCrew(dt);
    fireBuffer=std::max(0.f,fireBuffer-dt);if(in.firePressed||(in.fire&&!wasFiring))fireBuffer=.12f;
    if((fireBuffer>0||in.fire&&handling().automatic)&&shotDelay<=0&&reloadTime<=0){sprintWeight=std::min(sprintWeight,.19f);shoot();fireBuffer=0;}
    wasFiring=in.fire;
    const bool playerNear=len(flat(pos-patient()))<7.8f;
    if(recording!=Recording::Animal||stage==Stage::Report)fieldTick(in,dt);
    else switch(stage){
    case Stage::Apron:
        if(door>0||crew[0].pos.z>-1.28f){interlock=true;say("MI_004");if(door==0)emit(Sound::Door,crew[0].pos);door=clamp(door+dt*.8f);}
        if(door>.80f&&pos.z>.58f)enter(Stage::Reception);
        break;
    case Stage::Reception:if(pos.z>10.5f)enter(Stage::Kennels);break;
    case Stage::Kennels:if(pos.z>21.2f)enter(Stage::Lash);break;
    case Stage::Lash:{
        if(lashHP<=0){lashAmount=std::max(0.f,lashAmount-dt*2.25f);if(lashAmount==0)enter(Stage::Recovery);break;}
        float cycle=std::fmod(age,3.55f);
        if(cycle<.66f){V toward=camera-dog();lashTarget=dog()+norm(toward)*std::min(tuning.reach,len(toward));hitOnce=false;}
        lashAmount=smooth(.60f,1.17f,cycle)*(1-smooth(2.04f,2.84f,cycle));
        if(lashAmount>.90f&&!hitOnce&&len(lashPoint(1)-camera)<1.0f){hp-=14;hitOnce=true;impact=1;damageFlash=.74f;emit(Sound::Drop,camera,Bus::Body);}
        break;}
    case Stage::Recovery:if(pos.z>37.6f){enter(Stage::Examination);}break;
    case Stage::Examination:
        if(len(flat(crew[1].pos-patient()))<1.25f&&playerNear){if(!patientSeen){patientSeen=true;say("MI_010");}exposure+=dt;if(exposure>4.6f)enter(Stage::Exposure);}break;
    case Stage::Exposure:{
        if(age>1.45f)say("MI_012");
        if(age>2.3f){advanceHost(*this,dt);
            if(hostHP<=0){enter(Stage::Report);}
        }break;}
    case Stage::Report:if(in.interact&&canReport()){enter(Stage::Filed);emit(Sound::Intercom,desk(),Bus::Radio);}break;
    default:break;
    }
    stress=mix(stress,(stage==Stage::Lash||stage==Stage::Exposure)?1:clamp((100-hp)/140),decay(1.1f,dt));
    if(hp<=0){hp=0;enter(Stage::Lost);}
}
}
