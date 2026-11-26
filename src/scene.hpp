#pragma once
#include "game.hpp"
#include <map>
namespace fever {
struct Vertex {V p,n,c;float material,u,v;V morph;V action{},reaction{};};
struct MeshData {std::vector<Vertex> vertices;std::vector<uint32_t> indices;};
enum Mat {Plaster,Wood,Metal,Fabric,Hide,Aggregate,Enamel,Stone,Warm,Cold,Red,Blood,Sign,DarkGlass,Paper};
struct Pose {V p{},x={1,0,0},y={0,1,0},z={0,0,1};float morph=0,kneel=0,action=0,reaction=0;};
struct Instance {std::string id;Pose pose;};
struct Lamp {V p,color;float range;};
std::vector<Lamp> lamps();
std::map<std::string,MeshData> buildWorld(const Game& g);
MeshData readMesh(const std::string& path);
std::vector<Instance> sceneInstances(const Game& g,bool shadows=false);
MeshData effectsMesh(const Game& g);
}

