#pragma once
#include "game.hpp"
namespace fever {
struct RoomDef{const char* name;V center;float w,d;const char* open;};
inline constexpr RoomDef houseRooms[]={
 {"living",{0,0,5},10,10,"ns"},{"kitchen",{0,0,15},10,10,"nse"},{"bedroom",{16,3.2f,15},10,10,"esw"},
 {"bath",{16,3.2f,24},10,8,"n"},{"nursery",{26,3.2f,15},10,10,"w"},{"chapel",{0,-3,34},14,14,"n"}};
inline bool rect(V p,float x,float z,float w,float d){return std::abs(p.x-x)<=w*.5f&&std::abs(p.z-z)<=d*.5f;}
inline constexpr V keyAt={15.6f,3.95f,24.5f},callerAt={1,-3,38},relayAt={3.4f,5.7f,58.2f},flareAt={42,.65f,54};
inline constexpr V platesAt[]={{-3.8f,1,-4.3f},{-3.2f,1.65f,6},{-.75f,1.2f,11},{2.3f,1.55f,16},{-1.7f,1.72f,24},{3.2f,1.58f,32}};
inline V treeAt(int i){unsigned s=unsigned(i+37)*2654435761u;auto r=[&](){s=s*1664525u+1013904223u;return float(s>>8)/16777216.f;};return {-37+94*r(),0,-51+137*r()};}
inline bool hasTree(V p){return std::abs(p.x)>4.9f+.9f*std::sin(p.z*.18f)&&!rect(p,0,14.5f,12,15)&&!rect(p,0,55,14,18)&&!rect(p,42,53,13,17);}
}
