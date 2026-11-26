#include "night.hpp"
#include <cstring>
namespace fever {
const RecordInfo& info(Recording r){
    static const RecordInfo a[]={{"AFTER HOURS","PORT MERCER, MICHIGAN","PMPD / 17","A. REED","Check on the night attendant at Lake Street Animal Control.",76380},{"THE OPEN DOOR","CYPRESS PARISH, LOUISIANA","CPSO / 42","L. LANDRY","Meet Deputy Roy at 118 Alder Lane.",85320},{"THE GREY","OUTSIDE STOWE, VERMONT","MUTUAL AID / 06","E. SHAW","Find the lift mechanic at Cabin Four.",15360},{"FIRING RANGE","COUNTY TRAINING ANNEX","TRAINING / 02","A. REED","Use the issue bench to change weapons.",66660}};return a[int(r)];
}
const WeaponSpec& spec(Weapon w){
    static const WeaponSpec a[]={{"PATROL AUTO","carbine",24,.111f,1.53f,.86f,82,2.2f,true,false},{"SERVICE PISTOL","pistol",13,.185f,1.17f,.67f,86,1.8f,false,false},{"FIELD KNIFE","knife",0,.45f,0,.34f,96,3.1f,false,false},{"HUNTING BOLT","hunting",5,.86f,1.96f,1.09f,67,5.1f,false,true},{"PATROL SEMI","semi",18,.195f,1.52f,.90f,74,3.2f,false,false},{"SCOPED PRECISION","sniper",5,1.12f,2.1f,1.19f,39,7.4f,false,true},{"GRENADE LAUNCHER","launcher",1,1.02f,1.52f,1.20f,82,12.f,false,false}};return a[int(w)];
}
const char* Game::voiceName(Speaker s)const{
    if(s==Speaker::Player)return info(recording).officer;
    if(s==Speaker::Cole&&recording==Recording::House)return "ROY";
    if(s==Speaker::Cole&&recording==Recording::Grey)return "BLAKE";
    if(s==Speaker::Ives&&recording==Recording::Grey)return "PARK";return name(s);
}
void Game::choose(int n){
    static const Weapon options[]={Weapon::Auto,Weapon::Hunting,Weapon::Semi,Weapon::Sniper,Weapon::Pistol,Weapon::Knife,Weapon::Launcher};
    selection=(n+7)%7;Weapon w=options[selection];slot=w==Weapon::Knife?2:0;loadout[slot]=w;
    fireBuffer=shotDelay=reloadTime=0;ejectIn=-1;equipLower=1;reloadSeated=false;
    if(slot!=2){mag[slot]=handling().capacity;reserve[slot]=mag[slot]*20;}
}
V Game::vehicle()const{
    float a=smooth(1.12f,8.7f,age),b=smooth(8.91f,13.4f,age);
    return {-.78f-.48f*std::sin(a*pi)+.78f*b,0,age<8.81f?mix(recording==Recording::Grey?-47.f:-40.f,-29.5f,a):-20+10.5f*b};
}
void Game::patrolTick(const Input& in,const Prefs& prefs,float dt){
    yaw=clamp(yaw+in.dx,-.66f,.66f);pitch=clamp(pitch+in.dy,-.4f,.35f);float glance=yaw,tilt=pitch;
    yaw+=.033f*std::sin(time*.72f)+.16f*(smooth(3,4.5f,age)-smooth(5.7f,6.6f,age))-.92f*smooth(13.2f,14.8f,age);
    pitch-=.075f+.055f*std::sin(time*.68f);body.update(vehicle()+V{-.35f,0,-.12f},0,0,0,true,dt);refreshCamera(in,prefs,dt);yaw=glance;pitch=tilt;
    if(recording!=Recording::Range){
        std::string prefix=recording==Recording::Animal?"MI":recording==Recording::House?"LA":"VT";
        if(age>1.42f)say(prefix+"_001");if(age>5.35f)say(prefix+"_002");if(age>9.25f&&recording!=Recording::Animal)say(prefix+"_003");
        if(age>8.6f&&age<13&&int((age-dt)*1.7f)!=int(age*1.7f))emit(Sound::Turn,camera,Bus::Body,.36f);
        if(age>13.1f&&age-dt<=13.1f)emit(Sound::Door,camera,Bus::Body,.55f);
    }
    if(age<(recording==Recording::Range?1.36f:15.f))return;
    pos={0,0,recording==Recording::Range?-7.8f:-9.5f};yaw=pitch=camYaw=camPitch=0;enter(Stage::Apron);
    door=recording==Recording::Grey||recording==Recording::Range?1:0;camera=pos+V{0,1.43f,.19f};mount={};
    mount[0].x=camera.x;mount[1].x=camera.y;mount[2].x=camera.z;
    for(int i=0;i<3;i++)crew[i].pos=pos+V{(i-1)*.88f,0,1.5f+i*.24f};
}
namespace {
bool near(V a,V b,float r){return len(flat(a-b))<r&&std::abs(a.y-b.y)<2.2f;}
void box(std::vector<Box>& b,V p,V size){b.push_back({p-size*.5f,p+size*.5f});}
void roomWalls(std::vector<Box>& out,const RoomDef& r){
    for(int n=0;n<4;n++){
        bool horizontal=n%2==0;float span=horizontal?r.w:r.d,off=(n==0||n==3?-1:1)*(horizontal?r.d:r.w)*.5f;
        auto wall=[&](float x,float w){box(out,r.center+(horizontal?V{x,1.65f,off}:V{off,1.65f,x}),horizontal?V{w,3.3f,.16f}:V{.16f,3.3f,w});};
        if(std::strchr(r.open,"nesw"[n])){float w=(span-2.5f)*.5f;wall((span-w)*.5f,w);wall(-(span-w)*.5f,w);}else wall(0,span);
    }
}
V move(Game& g,V from,V to,float travel){
    V d=flat(to-from);if(len(d)<.01f)return from;d=norm(d)*std::min(travel,len(d));
    V n=from+V{d.x,0,0};if(g.passable(n))from=n;n=from+V{0,0,d.z};if(g.passable(n))from=n;from.y=g.ground(from);return from;
}
}
void Game::buildCall(){
    solids.clear();contacts.clear();auto add=[&](V pos,int kind,float h){contacts.push_back({pos,pos,kind,h});};
    if(recording==Recording::Animal){
        solids=animalSolids;for(int i=0;i<10;i++)add({float(i*17%27-13),0,float(58+i*11%23)},i%3==1?1:0,i%3==1?3.f:5.f);
    }else if(recording==Recording::House){
        for(auto& r:houseRooms)roomWalls(solids,r);
        for(auto b:{Box{{-4.65f,0,3},{-3.05f,1.05f,6.9f}},Box{{3.1f,0,2},{4.65f,.85f,4.6f}},Box{{-4.9f,0,12.2f},{-3.9f,.92f,18.4f}},Box{{1.8f,0,17.2f},{4,.84f,18.6f}},Box{{17.0f,3.2f,11},{19.85f,4.02f,14.4f}},Box{{12.0f,3.2f,25},{14.3f,3.94f,27.2f}},Box{{23.7f,3.2f,12},{25.2f,3.9f,14.3f}},Box{{-5.4f,-3,34.3f},{-2.75f,-1.9f,36.2f}}})solids.push_back(b);
        add({-3.7f,.88f,16.35f},4,6);add({13.6f,3.2f,14.4f},2,7);add({26,3.2f,16},2,5);add({-2.2f,-3,34.3f},3,14);
    }else if(recording==Recording::Grey){
        roomWalls(solids,{"cabin",{0,0,14.5f},8,9,"ns"});for(int i=0;i<480;i++){auto p=treeAt(i);if(hasTree(p))box(solids,p+V{0,2,0},{.34f,4,.34f});}add({-8,0,27},5,100);
    }
}
float Game::ground(V p)const{
    if(recording==Recording::House){if(p.x>=11)return 3.2f;if(p.x>5&&rect(p,8,15,6,3.2f))return (p.x-5)*3.2f/6;if(p.z>20&&std::abs(p.x)<7.2f)return -3*clamp((p.z-20)/7);}
    if(recording==Recording::Grey&&std::abs(p.x)<=4.9f&&p.z>=50&&p.z<=60){
        if(p.z<52)return 1.75f*clamp((p.x+4)/8);if(p.z<53.75f)return p.x>2.9f?1.75f:0;
        if(p.z<55.75f)return 1.75f+1.75f*clamp((4-p.x)/8);if(p.z<57)return p.x<-2.9f?3.5f:0;return 3.5f+1.45f*clamp((p.x+4)/8);}
    return 0;
}
bool Game::passable(V p)const{
    float floor=ground(p);
    if(recording==Recording::Animal){
        float width=p.z<0?13.8f:p.z<11?4.95f:p.z<39?5.9f:p.z<51?5.53f:15.5f;
        if(std::abs(p.x)>width||p.z<-15.6f||p.z>79||(door<.82f&&std::abs(p.z)<.42f)||(stage<Stage::Recovery&&p.z>32)||(stage<Stage::Report&&p.z>50.9f))return false;
    }else if(recording==Recording::House){
        bool ok=rect(p,0,-6,14,12.6f)||rect(p,8,15,6.35f,2.8f)||rect(p,0,23.5f,2.8f,7.5f);
        for(auto& b:houseRooms)ok|=rect(p,b.center.x,b.center.z,b.w+.1f,b.d+.1f);
        if(!ok||(door<.82f&&std::abs(p.z)<.24f)||(beat<5&&std::abs(p.x)<2&&p.z>20&&p.z<20.38f))return false;
    }else if(recording==Recording::Grey){if(p.z<-11||p.z>68||p.x<-23||p.x>53||(!dragged&&p.x>27)||std::abs(floor-p.y)>.65f)return false;}
    else if(!rect(p,0,13,12.8f,48))return false;
    for(auto& b:solids)if(b.high.y>floor+.26f&&b.low.y<floor+1.44f&&containsXZ(b,p,-.2f))return false;
    return true;
}
void Game::fieldCrew(float dt){
    int count=recording==Recording::House?1:recording==Recording::Range?0:2;
    for(int j=0;j<count;j++){int i=recording==Recording::Animal&&j==1?2:j;auto& a=crew[i];a.shot=std::max(0.f,a.shot-dt);a.brain.fireTimer-=dt;
        V goal=pos+V{i?1.1f:-1.15f,0,-1.5f};
        if(recording==Recording::House){const V lead[]={{-.7f,0,-1},{0,0,6.4f},{0,0,14},{3.8f,0,15},{0,0,19},{0,-3,31},{0,-3,37}};goal=lead[std::min(6,beat)];}
        else if(recording==Recording::Grey&&pos.z<47&&std::abs(pos.x)<5)goal={i?.88f:-1.3f,0,pos.z+3.8f-i*1.6f};
        else if(recording==Recording::Animal)goal={i?1.2f:-1,0,std::min(70.f,pos.z+2)};
        float gap=len(flat(pos-a.pos));if(gap>7.5f&&dot(flat(a.pos-pos),flat(goal-pos))>0&&len(flat(goal-pos))>2)goal=a.pos;
        if(recording==Recording::House&&std::abs(goal.z-a.pos.z)>3)goal={0,0,a.pos.z+clamp(goal.z-a.pos.z,-2,2)};
        V old=a.pos;a.pos=move(*this,a.pos,goal,(gap>8?4.5f:1.48f)*dt);float travelled=len(flat(a.pos-old));a.stride+=travelled*4;
        a.pace=mix(a.pace,clamp(travelled/dt),decay(9,dt));V look=travelled>.0005f?a.pos-old:forward(std::sin(time*.48f+i)*.76f);
        for(auto& c:contacts)if(c.awake&&c.hp>0&&len(c.p-a.pos)<9&&std::abs(c.p.y-a.pos.y)<2){
            V o=a.pos+V{0,1.33f,0},line=c.p+V{0,1,0}-o;if(wallDistance(o,norm(line))<len(line)-.4f)continue;
            look=line;if(a.brain.fireTimer<=0){a.shot=.14f;a.brain.fireTimer=1.4f+.27f*i;emit(Sound::Round,o,Bus::World,.7f);++crewShots;if(c.kind!=3&&c.kind!=5)c.hp-=.7f;}break;}
        a.yaw+=wrap(std::atan2(look.x,look.z)-a.yaw)*decay(5,dt);
    }
}
bool Game::fieldHit(V o,V d,float& distance,float damage){
    int best=-1;if(recording==Recording::Range){
        for(int i=0;i<6;i++){if(plates[i]>.6f)continue;float t=raySphere(o,d,platesAt[i],i==0?.39f:.48f);if(t<distance){distance=t;best=i;}}
        if(best<0)return false;plates[best]=1;plateHits++;particles.burst(o+d*distance,d*-1,Matter::Steel,12);emit(Sound::Gate,platesAt[best],Bus::World,.5f);return true;}
    for(int i=0;i<int(contacts.size());i++){
        auto& c=contacts[i];if(!c.awake||c.hp<=0||(c.kind==5&&phaseOut>0))continue;
        float h=c.kind==1?.54f:c.kind==4?.26f:c.kind==5?1.50f:1.04f,r=c.kind==5?1.05f:c.kind==1?.54f:.61f;
        float t=std::min(raySphere(o,d,c.p+V{0,h,0},r),raySphere(o,d,c.p+V{0,h*1.52f,0},r*.62f));if(t<distance){distance=t;best=i;}}
    if(best<0)return false;auto& c=contacts[best];c.flinch=1;particles.burst(o+d*distance,d*-1,Matter::Fluid,11);
    if(c.kind==5){aggro=clamp(aggro+.23f);phaseOut=2.1f;watched=0;c.clock=3;emit(Sound::Howl,c.p,Bus::World,1.5f);}
    else if(c.kind==3&&beat<5){c.awake=false;c.clock=6;emit(Sound::Howl,c.p);}else c.hp-=damage;return true;
}
void Game::grenadeTick(float dt){
    if(!projectile)return;V delta=projectileVelocity*dt;float dist=wallDistance(projectilePos,norm(delta));V next=projectilePos+delta;projectileVelocity.y-=9.2f*dt;
    bool hit=dist<len(delta)+.02f;if(recording==Recording::Range)for(auto p:platesAt)hit|=len(next-p)<.44f;
    for(auto& c:contacts)if(c.awake&&c.hp>0)hit|=len(next-c.p-V{0,.85f,0})<.58f;
    if(!hit&&next.y>ground(next)+.07f&&next.y<40&&len(next-pos)<65){projectilePos=next;return;}
    projectile=false;blastPos=hit?projectilePos+norm(delta)*std::min(dist,len(delta)):next;blastPos.y=std::max(ground(blastPos)+.13f,blastPos.y);blast=1;
    for(int i=0;i<6;i++)particles.discharge(blastPos,forward(i*pi/3,.42f),2.7f);
    particles.burst(blastPos,{0,1,0},Matter::Steel,23);emit(Sound::Blast,blastPos,Bus::World,1.2f);
    if(recording==Recording::Range)for(int i=0;i<6;i++)if(plates[i]<.6f&&len(platesAt[i]-blastPos)<4){plates[i]=1;plateHits++;}
    for(auto& c:contacts)if(c.awake&&c.kind!=5&&len(c.p-blastPos)<4)c.hp-=9;
}
std::string Game::prompt(bool pad)const{
    std::string use=pad?"X  ":"E  ";if(stage==Stage::Flight)return {};
    if(recording==Recording::Range)return near(pos,{-4.6f,0,-6.4f},3.45f)?use+"NEXT WEAPON":"";
    if(recording==Recording::Animal)return canReport()?use+"TRANSMIT STREET REPORT":"";
    if(recording==Recording::House){
        if(beat==3&&near(pos,keyAt,2.7f))return use+"TAKE CELLAR KEY";
        if((beat==3||beat==4)&&near(pos,{0,0,19.5f},2.4f))return cellarKey?use+"UNLOCK CELLAR":"CELLAR DOOR LOCKED";
        if(beat==6&&near(pos,callerAt,3))return use+"CALL FOR MEDICAL";}
    if(recording==Recording::Grey){
        if(beat==1&&near(pos,{0,0,15.7f},3.1f))return use+"CHECK CABIN RADIO";
        if(beat==3&&near(pos,flareAt,3.3f))return use+"SEND RESCUE FLARE";
        if(beat==2&&near(pos,relayAt,3.1f))return use+"KEY THE RELAY";}
    return {};
}
void Game::fieldTick(const Input& in,float dt){
    beatAge+=dt;fieldTime+=dt;float previous=phaseOut;phaseOut=std::max(0.f,phaseOut-dt);tether=std::max(0.f,tether-dt);
    auto next=[&](int n){beat=n;beatAge=0;};
    if(recording==Recording::Range){
        for(auto& p:plates)p=std::max(0.f,p-dt*.87f);if(in.weapon>=0&&in.weapon<7)choose(in.weapon);
        if(in.interact&&near(pos,{-4.6f,0,-6.4f},3.45f))choose(selection+1);
        if(slot!=2&&reserve[slot]<handling().capacity*2)reserve[slot]=handling().capacity*20;return;}
    if(recording==Recording::Animal){
        if(pos.z>46)say("MI_014");if(pos.z>52&&beat==0){next(1);say("MI_016");}
        if(in.interact&&canReport()){say("MI_017");emit(Sound::Intercom,pos,Bus::Radio);enter(Stage::Filed);return;}}
    if(recording==Recording::House){
        if(!beat&&pos.z>-4){if(!hitOnce){hitOnce=true;beatAge=0;emit(Sound::Knock,{0,1.3f,0});say("LA_004");}
            if(beatAge>3.1f){door=clamp(door+dt*1.3f);if(door>=1){next(1);emit(Sound::Glass,{1,1,13});say("LA_005");}}}
        if(beat==1&&pos.z>8.6f){next(2);say("LA_006");}
        if(beat==2){if(near(pos,{0,0,15},5.4f))contacts[0].awake=true;if(contacts[0].hp<=0||pos.x>4.4f||pos.z>18){next(3);say("LA_007");}}
        if(beat==3&&in.interact&&near(pos,keyAt,2.7f)){next(4);cellarKey=true;emit(Sound::Latch,keyAt);say("LA_008");}
        if(beat==4&&in.interact&&near(pos,{0,0,19.5f},2.4f)){next(5);emit(Sound::Door,{0,1,20});say("LA_009");}
        auto& witch=contacts[3];if(beat>=5&&pos.z>27){if(!witch.awake){witch.p=witch.origin;witch.awake=true;}if(beat==5&&witch.hp<=0){next(6);say("LA_010");}}
        else if(beat>0&&beat<5){witch.clock-=dt;if(witch.clock<=0){witch.awake=!witch.awake;witch.clock=witch.awake?3.1f:10;witch.p=pos+forward(yaw)*5+right(yaw)*1.1f;witch.p.y=ground(witch.p);if(!passable(witch.p))witch.p={.6f,0,8};}}
        if(beat==6&&in.interact&&near(pos,callerAt,3)){say("LA_011");enter(Stage::Filed);return;}}
    if(recording==Recording::Grey){
        auto& c=contacts[0];if(!beat&&pos.z>4){next(1);say("VT_004");}
        if(beat==1&&in.interact&&near(pos,{0,0,15.7f},3.1f)){next(2);say("VT_005");emit(Sound::Intercom,pos);}
        if(fieldTime>17){if(!c.awake){c.awake=true;emit(Sound::Howl,c.p);say("VT_006");}
            aggro=clamp(aggro+dt*(dragged?.013f:.0032f));c.clock=std::max(0.f,c.clock-dt);
            if(previous>0&&phaseOut<=0){c.p=pos+forward(yaw+1.47f+.8f*std::sin(time))*(13+std::fmod(time,7.f));c.p.x=clamp(c.p.x,-19,50);c.p.z=clamp(c.p.z,-4,65);c.p.y=0;}
            V line=c.p+V{0,1.4f,0}-camera;float dist=len(line);
            if(aggro<.38f||phaseOut>0){
                watched=clamp(watched+dt*(torch&&dot(norm(line),aimRay())>.90f?1.1f:-.7f),0,3);
                if(phaseOut<=0&&(watched>1.15f||dist<5.3f||dist>34)){phaseOut=1.55f;watched=0;}}
            else{if(dist>2.2f)c.p=lerp(c.p,pos,std::min(1.f,dt*(3.45f+aggro*2.5f)/dist));
                if(dist<4.7f&&c.clock<=0){tether=1.2f;lashTarget=pos+V{0,1.15f,0};hp-=9;damageFlash=.65f;c.clock=5.7f;emit(Sound::Lash,c.p);
                    if(beat==2&&aggro>.70f&&!dragged&&pos.z<49){dragged=true;next(3);say("VT_007");}}}}
        if(beat==3&&beatAge<3.8f){pos=lerp(pos,{39,0,49},decay(1.1f,dt));impact=.72f;}
        if(beat==3&&in.interact&&near(pos,flareAt,3.3f)){next(4);aggro=1;emit(Sound::Lash,flareAt);say("VT_008");}
        if(beat==4&&beatAge>16){say("VT_010");enter(Stage::Filed);}
        if(beat==2&&in.interact&&near(pos,relayAt,3.1f)){phaseOut=12;emit(Sound::Beep,relayAt);emit(Sound::Howl,c.p);say("VT_009");enter(Stage::Filed);}return;}
    for(auto& c:contacts){
        c.flinch=std::max(0.f,c.flinch-dt*3);if(c.hp<=0)continue;float dist=len(flat(c.p-pos));
        if(recording==Recording::Animal){if(pos.z<49)continue;c.awake=true;}
        if(c.kind==2&&dist<7&&std::abs(c.p.y-pos.y)<1)c.awake=true;
        if(!c.awake||(c.kind==3&&beat<5))continue;c.clock-=dt;float reach=c.kind==4?4.5f:1.65f;
        if(dist>reach&&c.kind!=4){V goal=pos;if(recording==Recording::Animal&&dist>12)goal=c.origin+V{std::sin(time*.4f+c.origin.z)*5,0,std::cos(time*.26f)*2};
            c.p=move(*this,c.p,goal,dt*(c.kind==1?3.35f:c.kind==3?1.04f:1.62f));}
        if(dist<reach&&std::abs(pos.y-c.p.y)<2&&c.clock<=0){c.clock=c.kind==4?2.3f:1.8f;hp-=c.kind==3?12:7;damageFlash=.69f;impact=.68f;emit(Sound::Lash,c.p);
            if(c.kind==4){tether=.72f;lashTarget=pos+V{0,1.1f,0};}}}
}
}
