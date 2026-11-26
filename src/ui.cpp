#include "ui.hpp"
#include <cstdio>
namespace fever {
namespace {
const Tint white={.92f,.92f,.87f,1},faint={.65f,.68f,.65f,1},red={.85f,.21f,.17f,1},black={.014f,.020f,.021f,.91f};
std::string clockText(float secs){int t=(int)secs;char b[14];std::snprintf(b,sizeof b,"%02d:%02d:%02d",(t/3600)%24,t/60%60,t%60);return b;}
}
void Menu::quad(float x,float y,float w,float h,Tint c,float mode,float u,float v,float u1,float v1){
    auto vert=[&](float a,float b,float s,float t){return UIVertex{2*a/width-1,1-2*b/720,s,t,c,mode};};
    auto a=vert(x,y,u,v),b=vert(x+w,y,u1,v),d=vert(x,y+h,u,v1),e=vert(x+w,y+h,u1,v1);
    vertices.insert(vertices.end(),{a,b,d,d,b,e});
}
void Menu::fade(float x,float y,float w,float h,Tint a,Tint b){auto k=vertices.size();quad(x,y,w,h,a);for(int i:{1,4,5})vertices[k+i].c=b;}
void Menu::text(float x,float y,const std::string& s,float size,Tint color){
    for(unsigned char c:s){
        if(c>=32&&c<=126&&c!=' '){int i=c-32;float u=float((i%16)*32)/1024,v=float((i/16)*40)/512;
        quad(x,y,size*32/26,size*40/26,color,1,u,v,u+32.f/1024,v+40.f/512);}
        x+=size*.612f;
    }
}
void Menu::option(float x,float y,float w,const std::string& title,const std::string& val,Command cmd,bool enabled){
    bool on=int(choices.size())==selected;choices.push_back({x-12,y-6,w,36,cmd,enabled});
    if(on){fade(x-12,y-7,w,33,{.45f,.081f,.07f,.88f},{.16f,.045f,.03f,.02f});quad(x-12,y-7,3,33,red);}
    text(x+4,y,title,19,enabled?(on?white:faint):Tint{.35f,.38f,.35f,1});
    if(!val.empty())text(x+w-val.size()*9.8f-22,y+2,val,16,on?white:faint);
}
void Menu::navigate(int d){if(choices.empty())return;int n=int(choices.size());do{selected=(selected+d+n)%n;}while(!choices[selected].enabled);}
int Menu::hit(float x,float y)const{for(int i=0;i<int(choices.size());i++){auto h=choices[i];if(h.enabled&&x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<h.y+h.h)return i;}return -1;}
Command Menu::confirm()const{return selected>=0&&selected<int(choices.size())&&choices[selected].enabled?choices[selected].cmd:Command::None;}
void Menu::build(const Game& g,const Prefs& pref,bool saved,float aspect,float now,bool pad){
    vertices.clear();choices.clear();width=720*aspect;float left=std::max(32.f,(width-1280)/2+77),edge=width-left;
    if(page==Page::Playing){
        if(!performance.empty())text(left,42,performance,14,white);
        if(g.stage==Stage::Flight&&g.age<.67f){
            quad(0,0,width,720,{.012f,.017f,.015f,1-smooth(.40f,.67f,g.age)});
            text(left,590,"RECORDER 17   /   BUFFER ONLINE",16,white);
        }
        if(std::fmod(g.time,1.45f)<1.07f)quad(edge-198,42,8,8,red);
        text(edge-182,40,"REC  "+clockText(deviceTime(g.time)),17,white);
        text(edge-156,64,"NBPD  /  UNIT 17",13,faint);
        if(g.stage!=Stage::Flight&&((g.time<30&&g.stage==Stage::Apron)||g.canReport())){
            std::string h=g.canReport()?(pad?"X   TRANSMIT":"E   TRANSMIT"):"RELAY SIX   /   CHECK ON THE NIGHT CUSTODIAN";
            float n=h.size()*8.6f;quad((width-n)/2-12,544,n+24,31,black);text((width-n)/2,552,h,14,white);
        }
        if(g.stage!=Stage::Flight&&g.stage!=Stage::Filed&&g.stage!=Stage::Lost){
            char buf[52];if(g.slot==2)std::snprintf(buf,sizeof buf,"03  /  KNIFE");
            else std::snprintf(buf,sizeof buf,"%s   %02d / %02d",g.slot==0?"CARBINE":"SIDEARM",g.mag[g.slot],g.reserve[g.slot]);
            text(edge-float(std::string(buf).size())*8.6f,672,buf,14,white);
            if(g.hp<80)text(left,672,g.hp<35?"INJURY  //  CRITICAL":"INJURY  //  RECORDED",14,g.hp<35?red:white);
        }
        if(g.subtitle.left>0){
            std::vector<std::string> rows;std::string row,word;std::string full=std::string(name(g.subtitle.speaker))+"  /  "+g.subtitle.text;
            int limit=int(std::min(925.f,width-60)/10.4f);
            for(char c:full+" "){if(c==' '){if(!word.empty()&&int(row.size()+word.size())>=limit){rows.push_back(row);row.clear();}if(!row.empty())row+=' ';row+=word;word.clear();}else word+=c;}if(!row.empty())rows.push_back(row);
            float y=649-float(rows.size()-1)*25;for(auto& line:rows){float n=line.size()*10.4f;
                quad((width-n)/2-12,y-7,n+24,29,{.009f,.012f,.012f,.86f});text((width-n)/2,y,line,17,white);y+=25;}
        }
        return;
    }
    bool titleBackdrop=page==Page::Title||((page==Page::Options||page==Page::Controls)&&back==Page::Title);
    if(titleBackdrop){
        float photoW=std::max(width,1280.f),photoH=photoW*9/16;
        quad((width-photoW)*.5f,(720-photoH)*.5f,photoW,photoH,{.86f,.87f,.82f,1},2);
        fade(0,0,width*.85f,720,{.014f,.019f,.017f,.94f},{.012f,.014f,.016f,.04f});
        quad(0,0,width,30,{.015f,.019f,.017f,1});quad(0,687,width,33,{.014f,.017f,.015f,1});
    }else quad(0,0,width,720,{.012f,.017f,.018f,.81f});
    text(left,51,"NORTH BANK COUNTY POLICE",13,faint);
    text(edge-146,51,"EVIDENCE   001",13,faint);
    quad(left,81,edge-left,1,{.64f,.65f,.60f,.50f});
    if(page==Page::Title){
        quad(left,137,37,4,red);text(left+50,133,"NIGHT SHIFT",15,white);
        float lw=std::min(520.f,width*.57f);quad(left-3,183,lw,lw*144/620,white,1,0,280.f/512,620.f/1024,424.f/512);
        text(left+1,329,"CALL 01    RELAY SIX",16,faint);
        option(left+9,417,305,"BEGIN SHIFT","",Command::Start);
        option(left+9,459,305,"CONTINUE","",Command::Continue,saved);
        option(left+9,501,305,"OPTIONS","",Command::Options);
        option(left+9,543,305,"CONTROLS","",Command::Controls);
        option(left+9,585,305,"QUIT","",Command::Exit);
        quad(edge-172,619,172,1,white);text(edge-172,633,"KENNEL / STILL 06",13,white);
    }else if(page==Page::Options){
        text(left,123,"OPTIONS",39,white);text(left,205,"RECORDER",13,red);
        float w=std::min(550.f,width-2*left);
        option(left+8,249,w,"VISUAL MODE",pref.psx?"PSX":"PHOTOREALISTIC",Command::Profile);
        option(left+8,293,w,"CAMERA MOTION",pref.steady?"REDUCED":"BODY MOUNT",Command::Motion);
        option(left+8,337,w,"LENS DISTORTION",pref.lens?"ON":"OFF",Command::Lens);
        option(left+8,381,w,"SENSOR GRAIN",pref.grain?"ON":"OFF",Command::Grain);
        option(left+8,425,w,"AUDIO RANGE",pref.nightMix?"NIGHT":"STANDARD",Command::Range);
        option(left+8,469,w,"MASTER VOLUME",std::to_string(int(pref.volume*100+.5f))+"%",Command::Volume);
        option(left+8,550,w,"RETURN","",Command::Back);
    }else if(page==Page::Controls){
        text(left,123,"CONTROLS",38,white);
        const char* lines[]={"MOVE           W A S D       /   LEFT STICK","LOOK           MOUSE         /   RIGHT STICK","HOLD AIM       RIGHT MOUSE   /   LT","FIRE           LEFT MOUSE    /   RT","WEAPON         1 2 3, WHEEL  /   Y","RELOAD         R             /   X","USE RADIO      E             /   X","FLASHLIGHT     F             /   DPAD UP","RUN / CROUCH   SHIFT / CTRL  /   LS / B","HOP            SPACE         /   A"};
        for(int j=0;j<10;j++)text(left,210+j*29.f,lines[j],16,faint);
        option(left+8,565,330,"RETURN","",Command::Back);
    }else if(page==Page::Pause){
        text(left,169,"RECORDING PAUSED",32,white);
        option(left+8,300,330,"RESUME","",Command::Resume);option(left+8,350,330,"OPTIONS","",Command::Options);
        option(left+8,400,330,"CONTROLS","",Command::Controls);option(left+8,450,330,"TITLE SCREEN","",Command::Title);
    }else {
        bool filed=page==Page::Filed;
        text(left,177,filed?"CALL 01 FILED":"BODYCAM DISCONNECTED",35,white);
        quad(left,235,42,4,red);text(left,284,filed?"RELAY SIX  /  21:13":"SIGNAL LOST  /  UNIT 17",19,faint);
        text(left,333,filed?"One patient recovered. Paramedic Ives lost.":"Recording ended before dispatch received a report.",17,white);
        if(filed)text(left,382,"End of the playable opening. The night shift continues.",15,faint);
        option(left+8,491,380,filed?"REPLAY CALL":"RETRY CHECKPOINT","",filed?Command::Start:Command::Retry);
        option(left+8,540,380,"TITLE SCREEN","",Command::Title);
    }
    quad(left,657,edge-left,1,{.56f,.58f,.54f,.45f});
    text(left,668,pad?"D-PAD   SELECT     A   CONFIRM     B   BACK":"ARROWS   SELECT     ENTER   CONFIRM     ESC   BACK",12,faint);
    if(page==Page::Title&&std::fmod(now,2.25f)<1.55f)quad(edge-8,669,7,7,red);
}
}

