#pragma once
#include "game.hpp"
namespace fever {
enum class Page {Title,Options,Playing,Pause,Filed,Lost,Controls,Archive};
enum class Command {None,Start,Continue,Resume,Options,Controls,Title,Back,Exit,Retry,Archive,Animal,House,Grey,Practice,Next,Profile,Motion,Lens,Grain,Range,Volume,Look,PadLook,Deadzone};
struct Tint{float r,g,b,a;};
struct UIVertex{float x,y,u,v;Tint c;float mode;};
struct Hit{float x,y,w,h;Command cmd;bool enabled;};
struct Menu {
    Page page=Page::Title,back=Page::Title;int selected=0;float width=1280;std::string performance;
    std::vector<UIVertex> vertices;std::vector<Hit> choices;
    void build(const Game&,const Prefs&,bool saved,float aspect,float clock,bool pad);
    void navigate(int direction);
    Command confirm()const;int hit(float x,float y)const;
    void quad(float x,float y,float w,float h,Tint c,float mode=0,float u=0,float v=0,float u1=1,float v1=1);
    void fade(float x,float y,float w,float h,Tint left,Tint right);
    void text(float x,float y,const std::string& s,float size,Tint color);
    void option(float x,float y,float w,const std::string& title,const std::string& value,Command cmd,bool enabled=true);
};
}
