#include "behavior.hpp"
#include "audio.hpp"
#include "scene.hpp"
#include "materials.hpp"
#include "ui.hpp"
#include "night.hpp"
#include <cassert>
#include <iostream>
#include <fstream>
#include <filesystem>
#include <set>
#include <stdexcept>
using namespace fever;
#define REQUIRE(x) do{if(!(x))throw std::runtime_error(std::string(#x)+" at line "+std::to_string(__LINE__));}while(0)
namespace {
constexpr float dt=1.f/90;
void wait(Game& g,float seconds){for(int i=0;i<int(seconds/dt);i++){g.tick({},Prefs{},dt);g.events.clear();}}
void walk(Game& g,V goal,bool run=false){
    for(int i=0;i<4500;i++){
        V delta=flat(goal-g.pos);if(len(delta)<.21f)return;Input in;in.walk=1;in.sprint=run;
        in.dx=wrap(std::atan2(delta.x,delta.z)-g.yaw);g.tick(in,{},dt);g.events.clear();
    }
    throw std::runtime_error("Route blocked at "+std::to_string(g.pos.x)+"/"+std::to_string(g.pos.z)+" stage "+std::to_string(int(g.stage)));
}
void titleAndData(){
    auto script=readScript("docs/DIALOGUE.md");REQUIRE(script.size()==38);Game g(script);
    REQUIRE(loadTuning("assets/shift.cfg",g.tuning));REQUIRE(g.tuning.resume<g.tuning.wait);
    Menu m;m.build(g,{},false,16.f/9,0,false);REQUIRE(m.confirm()==Command::Start);m.navigate(1);REQUIRE(m.confirm()==Command::Archive);
    m.page=Page::Options;m.selected=0;m.build(g,{},false,16.f/9,0,false);REQUIRE(m.confirm()==Command::Profile);
    for(auto fn:{"pistol","officer","patient","hound","carbine"}){auto mesh=readMesh(std::string("assets/meshes/")+fn+".fvm");REQUIRE(mesh.indices.size()>2000);}
    auto sets=buildWorld(g);for(const char* id:{"lake-street","la-kitchen","snow-road","annex","steering"})REQUIRE(sets.at(id).indices.size()>50);
}
void patrolAndIncident(){
    Game g(readScript("docs/DIALOGUE.md"));wait(g,24);REQUIRE(g.door>.98f);REQUIRE(g.stage==Stage::Apron);
    walk(g,{0,0,5});REQUIRE(g.stage==Stage::Reception);
    wait(g,13);bool scouted=false;for(auto& a:g.crew){scouted|=a.brain.visited!=0||a.brain.task==Task::Inspect;REQUIRE(len(flat(a.pos-g.pos))<10.f);}REQUIRE(scouted);
    walk(g,{0,0,14.5f},true);REQUIRE(g.stage==Stage::Kennels);
    walk(g,{.4f,0,22.2f},true);REQUIRE(g.stage==Stage::Lash);wait(g,1.34f);
    auto target=g.lashPoint(.72f);auto d=norm(target-g.camera);g.yaw=std::atan2(d.x,d.z);g.pitch=std::asin(d.y);g.shoot();REQUIRE(g.playerShotLash);
    wait(g,18);REQUIRE(g.stage==Stage::Recovery&&g.crewShots>0);
    walk(g,{1.15f,0,39.9f});walk(g,{1.1f,0,42.4f});wait(g,9);REQUIRE(g.stage==Stage::Exposure);
    for(int i=0;i<6&&g.stage==Stage::Exposure;i++){auto dir=norm(g.host+V{0,1.02f,0}-g.camera);g.yaw=std::atan2(dir.x,dir.z);g.pitch=std::asin(dir.y);g.shoot();wait(g,.24f);}
    REQUIRE(g.stage==Stage::Report);walk(g,{.4f,0,48.15f});walk(g,{.3f,0,52});walk(g,{1,0,65.2f},true);Input e;e.interact=true;g.tick(e,{},dt);REQUIRE(g.stage==Stage::Filed);
    wait(g,16);REQUIRE(std::find(g.spoken.begin(),g.spoken.end(),"MI_015")!=g.spoken.end());
    g.restart(Stage::Recovery);REQUIRE(g.door==1&&g.pos.z>32&&g.stage==Stage::Recovery);
    g.hp=1;g.enter(Stage::Exposure);g.age=3;g.host=g.pos+V{.4f,0,.1f};g.tick({}, {},dt);REQUIRE(g.stage==Stage::Lost);
}
void navigation(){
    Game g;g.restart(Stage::Kennels);g.pos={0,0,15};g.crew[0].pos={0,0,23.2f};g.crew[0].brain.think=0;g.tick({}, {},dt);REQUIRE(g.crew[0].brain.task==Task::Wait);
    g.pos={0,0,21};g.crew[0].pos={0,0,13};g.crew[0].brain.think=0;wait(g,.45f);REQUIRE(g.crew[0].brain.task==Task::CatchUp);REQUIRE(len(g.crew[0].velocity)>3);
    g.enter(Stage::Lash);wait(g,.50f);REQUIRE(g.crew[0].brain.task==Task::Defend);
    g.enter(Stage::Recovery);Brain b;V point={-3.9f,0,2.2f};V goal={-3.9f,0,9};
    for(int i=0;i<1500&&len(point-goal)>.45f;i++){V next=steer(g,point,goal,b,dt);V direction=norm(flat(next-point));V candidate=point+direction*.022f;if(g.passable(candidate))point=candidate;}
    REQUIRE(len(point-goal)<.65f);
}
void cameraAndHandling(){
    Game g;g.restart(Stage::Kennels);
    auto materials=readMaterials("assets/materials.tsv");REQUIRE(materials[Metal].metallic>materials[Fabric].metallic);
    REQUIRE(!lowDetailFor(false,false,1,.5f,1,1920));REQUIRE(lowDetailFor(false,false,50,.8f,1,1920));
    REQUIRE(lowDetailFor(true,false,20,.8f,1,1920)&&!lowDetailFor(false,false,20,.8f,1,1920));
    REQUIRE(lowDetailFor(false,true,1,1,1,960));
    auto bodyMeshes=sceneInstances(g);auto shadowMeshes=sceneInstances(g,true);
    auto count=[](const auto& meshes,const std::string& name){return std::count_if(meshes.begin(),meshes.end(),[&](const auto& i){return i.id==name;});};
    REQUIRE(count(bodyMeshes,"reed-boot")==2 && count(shadowMeshes,"reed-shoulders")==1);
    Input down;down.dy=-2;down.crouch=true;g.tick(down,{},dt);down.dy=0;
    for(int i=0;i<110;i++)g.tick(down,{},dt);
    REQUIRE(g.camPitch<-1.4f&&g.camera.y<1.f);
    for(auto& f:g.body.feet){REQUIRE(f.ankle.y>.08f&&f.ankle.y<.11f);REQUIRE(f.knee.y>f.ankle.y);}
    wait(g,7);REQUIRE(g.idleTime>6);
    Input r;r.reload=true;Input change;change.weapon=1;
    g.mag[0]=6;g.tick(r,{},dt);float partial=g.reloadDuration;int reserve=g.reserve[0];
    wait(g,.31f);g.tick(change,{},dt);REQUIRE(g.mag[0]==6&&g.reserve[0]==reserve&&g.reloadTime==0);
    change.weapon=0;g.tick(change,{},dt);g.mag[0]=0;g.tick(r,{},dt);REQUIRE(g.reloadEmpty && g.reloadDuration>partial);
    wait(g,g.reloadDuration*.75f);REQUIRE(g.mag[0]==24 && g.reserve[0]==reserve-24);
    change.weapon=1;g.tick(change,{},dt);REQUIRE(g.mag[0]==24 && !g.reloadSeated);
    g.mag[1]=4;g.tick(r,{},dt);REQUIRE(g.reloadDuration<partial);
}
void pressUse(Game& g){Input i;i.interact=true;g.tick(i,{},dt);}
void nightCalls(){
    Game g(readScript("docs/DIALOGUE.md"));g.start(Recording::House);
    wait(g,4);REQUIRE(g.stage==Stage::Flight);REQUIRE(!g.spoken.empty());wait(g,12);
    walk(g,{0,0,-2});wait(g,4.7f);REQUIRE(g.door>.95f);
    for(V p:{V{0,0,7},V{0,0,14.8f},V{5.9f,0,15},V{12.3f,0,15},V{16,0,16.8f},V{16,0,23.3f}})walk(g,p,true);
    REQUIRE(g.pos.y>3&&g.beat==3);pressUse(g);REQUIRE(g.cellarKey);
    for(V p:{V{16,0,16.8f},V{16,0,15},V{12.3f,0,15},V{5.9f,0,15},V{.3f,0,15},V{0,0,19.3f}})walk(g,p,true);
    pressUse(g);REQUIRE(g.beat==5);walk(g,{0,0,29},true);
    for(int i=0;i<12&&g.beat==5;i++){V d=norm(g.contacts[3].p+V{0,1,0}-g.camera);g.yaw=std::atan2(d.x,d.z);g.pitch=std::asin(d.y);g.shoot();wait(g,.23f);}
    if(g.beat!=6){auto& c=g.contacts[3];V line=c.p+V{0,1,0}-g.camera;
        std::cerr<<"Cellar "<<int(g.stage)<<" officer "<<g.hp<<" rounds "<<g.mag[0]<<" witch "<<c.hp<<" awake "<<c.awake<<" pos "<<c.p.x<<","<<c.p.y<<","<<c.p.z<<" camera "<<g.camera.x<<","<<g.camera.y<<","<<g.camera.z<<" distance "<<len(line)<<" obstruction "<<g.wallDistance(g.camera,norm(line))<<"\n";}
    REQUIRE(g.beat==6);walk(g,{1,0,37.5f},true);pressUse(g);REQUIRE(g.stage==Stage::Filed);
    g.start(Recording::Grey);wait(g,15.4f);
    walk(g,{0,0,14.2f},true);pressUse(g);REQUIRE(g.beat==2&&!g.dragged);
    for(V p:{V{0,0,32},V{-3.9f,0,49.85f},V{-4,0,51},V{3.8f,0,51},V{3.8f,0,54.6f},V{-3.8f,0,54.6f},V{-3.8f,0,58.1f},V{3.45f,0,58.1f}})walk(g,p);
    REQUIRE(g.pos.y>4.5f);pressUse(g);REQUIRE(g.stage==Stage::Filed&&!g.dragged);
    g.start(Recording::Grey,Stage::Apron,2);g.aggro=.89f;g.contacts[0].awake=true;g.contacts[0].p=g.pos+V{0,0,2.75f};wait(g,4.4f);REQUIRE(g.dragged&&g.beat==3);
    walk(g,{42,0,54},true);pressUse(g);REQUIRE(g.beat==4);wait(g,17);REQUIRE(g.stage==Stage::Filed);
}
void handlingRange(){
    Game g;g.start(Recording::Range,Stage::Apron);const Weapon list[]={Weapon::Auto,Weapon::Hunting,Weapon::Semi,Weapon::Sniper,Weapon::Pistol,Weapon::Knife,Weapon::Launcher};
    for(int k=0;k<7;k++){Input key;key.weapon=k;g.tick(key,{},dt);REQUIRE(g.weapon()==list[k]);}
    Input grip;grip.fire=true;g.choose(4);g.tick(grip,{},dt);int shots=g.shots;
    for(int i=0;i<50;i++)g.tick(grip,{},dt);REQUIRE(g.shots==shots);
    g.tick({}, {},dt);g.choose(0);for(int i=0;i<50;i++)g.tick(grip,{},dt);REQUIRE(g.shots>=shots+4);
    Input run;run.sprint=true;run.walk=1;for(int i=0;i<50;i++)g.tick(run,{},dt);REQUIRE(g.sprintWeight>.7f);
    grip.aim=true;g.tick(grip,{},dt);for(int i=0;i<9;i++)g.tick(grip,{},dt);REQUIRE(g.aim>.9f&&g.sprintWeight<.3f);
    g.choose(1);g.tick({}, {},dt);g.particles.clear();g.tick(grip,{},dt);
    auto cases=[&](){auto& all=g.particles.all();return std::count_if(all.begin(),all.end(),[](auto& p){return p.kind==ParticleKind::Casing&&p.life>0;});};
    REQUIRE(cases()==0);wait(g,.48f);REQUIRE(cases()>0);
    g.choose(6);g.pitch=-.25f;g.tick(grip,{},dt);REQUIRE(g.projectile);wait(g,1.8f);REQUIRE(!g.projectile);
    g.choose(4);g.tick({}, {},dt);V d=norm(platesAt[1]-g.camera);g.yaw=std::atan2(d.x,d.z);g.pitch=std::asin(d.y);g.shoot();REQUIRE(g.plateHits>=1);
}
void audio(){
    auto rightSource=acousticPath({0,1,15},0,Zone::Kennels,{2,1,16},Bus::World,1);REQUIRE(rightSource.right>rightSource.left);
    auto outside=acousticPath({0,1,-1},0,Zone::Yard,{0,1,2},Bus::World,1),closed=acousticPath({0,1,-1},0,Zone::Yard,{0,1,2},Bus::World,0);REQUIRE(closed.cutoff<outside.cutoff&&closed.left<outside.left);
    auto steel=acousticPath({0,1,19},0,Zone::Kennels,{3,1,19},Bus::World,1);
    auto fabric=acousticPath({-3.45f,1,43},0,Zone::Isolation,{-3.45f,1,46},Bus::World,1);
    auto glass=acousticPath({-3.8f,1.65f,46},0,Zone::Isolation,{-5.3f,1.65f,46},Bus::World,1);
    REQUIRE(fabric.cutoff<glass.cutoff&&glass.cutoff<steel.cutoff);
    REQUIRE(steel.send>outside.send);
    Mixer m;auto list=readScript("docs/DIALOGUE.md");m.loadTakes("tests/missing-takes",list);REQUIRE(m.recordedTakes()==0);
    std::array<int16_t,1024> out{};MixState state;m.play({Sound::Voice,{},Bus::World,1,Speaker::Cole,"MI_004"});m.render(out.data(),512,state);
    REQUIRE(std::all_of(out.begin(),out.end(),[](auto x){return x==0;}));m.play({Sound::Round,{},Bus::Body,1});
    m.render(out.data(),512,state);REQUIRE(std::any_of(out.begin(),out.end(),[](auto x){return std::abs(x)>1000;}));
    REQUIRE(m.overloadLevel()>.7f);
    for(int j=0;j<6;j++){m.play({Sound::Round,{},Bus::Body,1});m.render(out.data(),512,state);}
    REQUIRE(m.overloadLevel()<=1);m.clear();REQUIRE(m.overloadLevel()==0);
    auto received=[&](float opening){
        state.listener={0,1,-1};state.room=Zone::Yard;state.door=opening;
        m.clear();m.play({Sound::Round,{0,1,2},Bus::World,1});m.render(out.data(),512,state);
        return m.overloadLevel();
    };
    float open=received(1),closedDoor=received(0);
    REQUIRE(open>.18f && closedDoor<open*.35f);
    for(int j=0;j<100;j++)m.render(out.data(),512,state);
    REQUIRE(m.overloadLevel()==0);
    m.play({Sound::Footfall,state.listener,Bus::World,1});m.render(out.data(),512,state);
    REQUIRE(m.overloadLevel()==0);

    // A commissioned take follows the same timed cue and the actor's position.
    auto folder=std::filesystem::temp_directory_path()/"fever-voice-fixture";
    std::filesystem::create_directories(folder);
    {std::ofstream take(folder/"MI_004.wav",std::ios::binary);
        uint32_t n=3*48000*2;auto u32=[&](uint32_t v){take.write((char*)&v,4);};auto u16=[&](uint16_t v){take.write((char*)&v,2);};
        take.write("RIFF",4);u32(36+n);take.write("WAVEfmt ",8);u32(16);u16(1);u16(1);u32(48000);u32(96000);u16(2);u16(16);take.write("data",4);u32(n);
        for(int j=0;j<3*48000;j++)u16(int16_t(8500*std::sin(j*.05f)));
    }
    Mixer voiced;voiced.loadTakes(folder.string(),list);REQUIRE(voiced.recordedTakes()==1);
    auto line=std::find_if(list.begin(),list.end(),[](const auto& c){return c.id=="MI_004";});REQUIRE(line!=list.end()&&line->duration>=3);
    state={};state.room=Zone::Kennels;state.listener={0,1,18};state.crew[0]={1.2f,1,18};
    voiced.play({Sound::Voice,{},Bus::World,1,Speaker::Cole,"MI_004"});voiced.render(out.data(),512,state);
    int left=0,right=0;for(int j=0;j<512;j++){left+=std::abs(out[j*2]);right+=std::abs(out[j*2+1]);}REQUIRE(right>left*2);
    std::filesystem::remove(folder/"MI_004.wav");std::filesystem::remove(folder);

}
}
int main(){try{titleAndData();navigation();patrolAndIncident();cameraAndHandling();nightCalls();handlingRange();audio();std::cout<<"Three recording routes, both Grey endings, seven weapons and native systems passed.\n";return 0;}catch(const std::exception& e){std::cerr<<e.what()<<"\n";return 1;}}
